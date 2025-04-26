#!/usr/bin/env node
/**
 * Blue-Green Deployment Script for BCBS Application
 * 
 * This script automates the blue-green deployment process, including:
 * - Determining the active and target environments
 * - Deploying to the target environment
 * - Validating the deployment
 * - Shifting traffic gradually
 * - Automating rollback in case of failure
 * 
 * Usage:
 *   node scripts/blue_green_deploy.js [options]
 * 
 * Options:
 *   --environment=env     Deployment environment (dev, staging, prod) (default: staging)
 *   --deployment-id=id    Unique deployment ID (default: generates timestamp-based ID)
 *   --image-tag=tag       Docker image tag to deploy (default: latest)
 *   --skip-validation     Skip validation steps (not recommended)
 *   --force-rollback      Force a rollback to the previous deployment
 *   --rollback-threshold  Error rate threshold for automatic rollback (default: 5)
 *   --canary-steps=n      Number of traffic shift steps (default: 5)
 *   --canary-interval=n   Seconds between traffic shifts (default: 60)
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.includes('=')) {
    const [key, value] = arg.split('=');
    acc[key.replace('--', '')] = value;
  } else if (arg.startsWith('--')) {
    acc[arg.replace('--', '')] = true;
  }
  return acc;
}, {});

// Default configuration
const config = {
  environment: args.environment || 'staging',
  deploymentId: args['deployment-id'] ? args['deployment-id'] : `deploy-${Date.now()}`,
  imageTag: args['image-tag'] || 'latest',
  skipValidation: args['skip-validation'] || false,
  forceRollback: args['force-rollback'] || false,
  rollbackThreshold: parseInt(args['rollback-threshold'] || '5', 10),
  canarySteps: parseInt(args['canary-steps'] || '5', 10),
  canaryInterval: parseInt(args['canary-interval'] || '60', 10),
  // Calculated later based on environment
  region: 'us-west-2',
  albArn: '',
  blueTargetGroupArn: '',
  greenTargetGroupArn: '',
  domain: '',
  listenerId: '',
  testListenerId: '',
};

// Set AWS region based on environment
if (config.environment === 'prod') {
  config.region = 'us-west-2';
} else if (config.environment === 'staging') {
  config.region = 'us-east-1';
} else {
  config.region = 'us-east-2';
}

// Initialize deployment state
let deploymentState = {
  activeEnvironment: '',
  targetEnvironment: '',
  status: 'pending',
  startTime: Date.now(),
  endTime: null,
  currentTrafficPercentage: 0,
  errors: [],
  metrics: {},
};

/**
 * Execute AWS CLI command and return the result
 * @param {string} command AWS CLI command
 * @returns {object} Command result as parsed JSON
 */
function awsCommand(command) {
  try {
    const result = execSync(`aws ${command} --region ${config.region} --output json`, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    return JSON.parse(result);
  } catch (error) {
    console.error(`AWS CLI command failed: ${command}`);
    console.error(error.stderr || error.message);
    deploymentState.errors.push({
      time: Date.now(),
      command,
      error: error.stderr || error.message
    });
    
    if (deploymentState.status !== 'rolling-back') {
      initiateRollback('AWS CLI error');
    }
    throw error;
  }
}

/**
 * Get deployment information from Terraform state
 */
function getDeploymentInfo() {
  console.log(`Getting deployment information for ${config.environment} environment...`);
  
  try {
    // Change to Terraform directory
    process.chdir(path.join(process.cwd(), 'terrafusion'));
    
    // Initialize Terraform
    execSync('terraform init', { stdio: 'inherit' });
    
    // Select the correct workspace
    execSync(`terraform workspace select ${config.environment} || terraform workspace new ${config.environment}`, { 
      stdio: 'inherit' 
    });
    
    // Get current outputs
    const terraformOutput = JSON.parse(
      execSync('terraform output -json', { encoding: 'utf8' })
    );
    
    // Extract values
    deploymentState.activeEnvironment = terraformOutput.active_environment.value;
    deploymentState.targetEnvironment = deploymentState.activeEnvironment === 'blue' ? 'green' : 'blue';
    
    config.albArn = terraformOutput.alb_dns_name.value;
    config.blueTargetGroupArn = terraformOutput.blue_target_group_arn.value;
    config.greenTargetGroupArn = terraformOutput.green_target_group_arn.value;
    config.domain = terraformOutput.app_url.value;
    
    console.log(`Current active environment: ${deploymentState.activeEnvironment}`);
    console.log(`Target environment: ${deploymentState.targetEnvironment}`);
    
    // Go back to original directory
    process.chdir(process.cwd());
    
    // Get listener ARNs
    const elbCommand = `elbv2 describe-listeners --load-balancer-arn ${config.albArn}`;
    const listeners = awsCommand(elbCommand).Listeners;
    
    config.listenerId = listeners.find(l => l.Port === 443).ListenerArn;
    config.testListenerId = listeners.find(l => l.Port === 8443).ListenerArn;
    
  } catch (error) {
    console.error('Failed to get deployment information:', error);
    process.exit(1);
  }
}

/**
 * Deploy to the target environment
 */
async function deployToTarget() {
  console.log(`Deploying to ${deploymentState.targetEnvironment} environment...`);
  
  try {
    // Change to Terraform directory
    process.chdir(path.join(process.cwd(), 'terrafusion'));
    
    // Create Terraform variables file
    const tfVarsContent = `
      target_environment = "${deploymentState.targetEnvironment}"
      active_environment = "${deploymentState.activeEnvironment}"
      deployment_id = "${config.deploymentId}"
      image_tag = "${config.imageTag}"
    `;
    
    fs.writeFileSync('deployment.auto.tfvars', tfVarsContent);
    
    // Apply Terraform changes
    execSync('terraform apply -auto-approve', { stdio: 'inherit' });
    
    // Go back to original directory
    process.chdir(process.cwd());
    
    console.log(`Deployment to ${deploymentState.targetEnvironment} environment completed`);
    deploymentState.status = 'deployed';
    
  } catch (error) {
    console.error('Deployment failed:', error);
    deploymentState.status = 'failed';
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'deployment',
      error: error.message
    });
    
    initiateRollback('Deployment failure');
    process.exit(1);
  }
}

/**
 * Validate the deployment
 */
async function validateDeployment() {
  if (config.skipValidation) {
    console.log('Skipping validation as requested');
    return true;
  }
  
  console.log('Validating deployment...');
  deploymentState.status = 'validating';
  
  try {
    // Wait for services to be ready (ECS stabilization)
    const waitCommand = `ecs wait services-stable --cluster bcbs-cluster-${config.environment} --services bcbs-service-${deploymentState.targetEnvironment}-${config.environment}`;
    execSync(`aws ${waitCommand} --region ${config.region}`, { stdio: 'inherit' });
    
    // Run health checks against the test endpoint
    console.log('Running health checks...');
    const healthCheckUrl = `https://${config.domain}:8443/api/health`;
    
    let healthCheckPassed = false;
    let attempts = 0;
    
    while (!healthCheckPassed && attempts < 10) {
      try {
        const healthResponse = await axios.get(healthCheckUrl, { 
          timeout: 5000,
          validateStatus: false 
        });
        
        if (healthResponse.status === 200 && healthResponse.data.status === 'healthy') {
          healthCheckPassed = true;
          console.log('Health check passed!');
        } else {
          console.log(`Health check attempt ${attempts + 1} failed: ${healthResponse.status} ${JSON.stringify(healthResponse.data)}`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.log(`Health check attempt ${attempts + 1} failed: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      attempts++;
    }
    
    if (!healthCheckPassed) {
      throw new Error('Health checks failed after multiple attempts');
    }
    
    // Run smoke tests
    console.log('Running smoke tests...');
    const smokeTestResult = execSync('node scripts/run-smoke-test.sh --env=test', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log(smokeTestResult);
    
    // Run performance tests
    console.log('Running performance tests...');
    const perfTestResult = execSync('node scripts/performance-test.js --duration=10 --connections=5 --url=https://${config.domain}:8443', { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    
    const perfData = JSON.parse(fs.readFileSync('performance-results.json', 'utf8'));
    deploymentState.metrics.performance = perfData;
    
    // All validation passed
    console.log('Validation completed successfully');
    deploymentState.status = 'validated';
    return true;
    
  } catch (error) {
    console.error('Validation failed:', error);
    deploymentState.status = 'validation-failed';
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'validation',
      error: error.message
    });
    
    initiateRollback('Validation failure');
    return false;
  }
}

/**
 * Update the traffic weights for canary deployment
 * @param {number} blueWeight Percentage for blue environment (0-100)
 * @param {number} greenWeight Percentage for green environment (0-100)
 */
async function updateTrafficWeights(blueWeight, greenWeight) {
  console.log(`Updating traffic weights: blue=${blueWeight}%, green=${greenWeight}%`);
  
  try {
    // Get the current active and target target group ARNs
    const activeTargetGroupArn = deploymentState.activeEnvironment === 'blue' 
      ? config.blueTargetGroupArn 
      : config.greenTargetGroupArn;
      
    const targetTargetGroupArn = deploymentState.targetEnvironment === 'blue'
      ? config.blueTargetGroupArn
      : config.greenTargetGroupArn;
    
    // Prepare the forward action with weighted target groups
    const forwardAction = {
      Type: 'forward',
      ForwardConfig: {
        TargetGroups: [
          {
            TargetGroupArn: activeTargetGroupArn,
            Weight: deploymentState.activeEnvironment === 'blue' ? blueWeight : greenWeight
          },
          {
            TargetGroupArn: targetTargetGroupArn,
            Weight: deploymentState.targetEnvironment === 'blue' ? blueWeight : greenWeight
          }
        ]
      }
    };
    
    // Update the main listener
    const modifyListenerCommand = `elbv2 modify-listener --listener-arn ${config.listenerId} --default-actions '${JSON.stringify(forwardAction)}'`;
    awsCommand(modifyListenerCommand);
    
    // Update the current traffic percentage in deployment state
    deploymentState.currentTrafficPercentage = deploymentState.targetEnvironment === 'blue' ? blueWeight : greenWeight;
    
    console.log(`Traffic weights updated successfully`);
    return true;
  } catch (error) {
    console.error('Failed to update traffic weights:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'traffic-shift',
      error: error.message
    });
    
    return false;
  }
}

/**
 * Check if the deployment is healthy
 * @returns {Promise<boolean>} Whether the deployment is healthy
 */
async function isDeploymentHealthy() {
  console.log('Checking deployment health...');
  
  try {
    // Check CloudWatch metrics for error rates
    const errorMetricCommand = `cloudwatch get-metric-statistics --namespace AWS/ApplicationELB --metric-name HTTPCode_Target_5XX_Count --dimensions Name=LoadBalancer,Value=${config.albArn} --start-time $(date -u -d "5 minutes ago" +"%Y-%m-%dT%H:%M:%SZ") --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") --period 60 --statistics Sum`;
    
    const errorMetrics = awsCommand(errorMetricCommand);
    
    // Calculate total errors in the last 5 minutes
    const totalErrors = errorMetrics.Datapoints.reduce((sum, point) => sum + point.Sum, 0);
    
    // Check if error count exceeds threshold
    if (totalErrors > config.rollbackThreshold) {
      console.error(`Deployment is unhealthy: ${totalErrors} errors exceed threshold of ${config.rollbackThreshold}`);
      deploymentState.metrics.errors = totalErrors;
      return false;
    }
    
    // Perform health check on the application
    const healthCheckUrl = `https://${config.domain}/api/health`;
    const healthResponse = await axios.get(healthCheckUrl, { 
      timeout: 5000,
      validateStatus: false 
    });
    
    if (healthResponse.status !== 200 || healthResponse.data.status !== 'healthy') {
      console.error(`Health check failed: ${healthResponse.status} ${JSON.stringify(healthResponse.data)}`);
      return false;
    }
    
    console.log('Deployment is healthy');
    return true;
    
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Gradually shift traffic to the target environment
 */
async function shiftTraffic() {
  console.log(`Starting traffic shift to ${deploymentState.targetEnvironment} environment...`);
  deploymentState.status = 'shifting-traffic';
  
  // Define the traffic shifting steps
  const steps = config.canarySteps;
  const interval = config.canaryInterval * 1000; // Convert to milliseconds
  
  // Calculate initial weights based on active environment
  let activeWeight = 100;
  let targetWeight = 0;
  
  for (let step = 1; step <= steps; step++) {
    // Calculate new weights
    targetWeight = Math.round((step / steps) * 100);
    activeWeight = 100 - targetWeight;
    
    console.log(`Traffic shift step ${step}/${steps}: ${activeWeight}% to ${deploymentState.activeEnvironment}, ${targetWeight}% to ${deploymentState.targetEnvironment}`);
    
    // Update traffic weights
    if (deploymentState.activeEnvironment === 'blue') {
      await updateTrafficWeights(activeWeight, targetWeight);
    } else {
      await updateTrafficWeights(targetWeight, activeWeight);
    }
    
    // Wait for specified interval
    console.log(`Waiting ${config.canaryInterval} seconds before next step...`);
    await new Promise(resolve => setTimeout(resolve, interval));
    
    // Check if deployment is healthy
    const isHealthy = await isDeploymentHealthy();
    if (!isHealthy) {
      console.error('Deployment is unhealthy, initiating rollback');
      initiateRollback('Unhealthy deployment during traffic shift');
      return false;
    }
  }
  
  // Complete traffic shift
  console.log(`Traffic shift completed. 100% of traffic now directed to ${deploymentState.targetEnvironment} environment`);
  
  // Update deployment state
  deploymentState.status = 'completed';
  deploymentState.endTime = Date.now();
  deploymentState.currentTrafficPercentage = 100;
  
  // Update Terraform state to reflect the new active environment
  finalizeDeployment();
  
  return true;
}

/**
 * Finalize the deployment by updating the Terraform state
 */
function finalizeDeployment() {
  console.log('Finalizing deployment...');
  
  try {
    // Change to Terraform directory
    process.chdir(path.join(process.cwd(), 'terrafusion'));
    
    // Create Terraform variables file to update the active environment
    const tfVarsContent = `
      active_environment = "${deploymentState.targetEnvironment}"
      target_environment = "${deploymentState.targetEnvironment}"
      deployment_id = "${config.deploymentId}"
      image_tag = "${config.imageTag}"
    `;
    
    fs.writeFileSync('deployment.auto.tfvars', tfVarsContent);
    
    // Apply Terraform changes
    execSync('terraform apply -auto-approve', { stdio: 'inherit' });
    
    // Go back to original directory
    process.chdir(process.cwd());
    
    console.log('Deployment finalized');
    
    // Save deployment report
    saveDeploymentReport();
    
  } catch (error) {
    console.error('Failed to finalize deployment:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'finalization',
      error: error.message
    });
  }
}

/**
 * Save deployment report for future reference
 */
function saveDeploymentReport() {
  const deploymentReport = {
    ...deploymentState,
    config: {
      ...config,
      // Remove sensitive data
      albArn: undefined,
      blueTargetGroupArn: undefined,
      greenTargetGroupArn: undefined,
      listenerId: undefined,
      testListenerId: undefined
    },
    duration: deploymentState.endTime - deploymentState.startTime,
    durationFormatted: `${Math.round((deploymentState.endTime - deploymentState.startTime) / 1000 / 60)} minutes`
  };
  
  // Save the report
  const reportPath = path.join(process.cwd(), 'deployment-reports', `${config.deploymentId}.json`);
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  
  // Write report
  fs.writeFileSync(reportPath, JSON.stringify(deploymentReport, null, 2));
  
  console.log(`Deployment report saved to ${reportPath}`);
  
  // Optionally generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Deployment Report - ${config.deploymentId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1, h2 { color: #333; }
    .card { background: #f5f5f5; border-radius: 4px; padding: 20px; margin-bottom: 20px; }
    .success { background-color: #d4edda; color: #155724; }
    .failure { background-color: #f8d7da; color: #721c24; }
    .warning { background-color: #fff3cd; color: #856404; }
    table { width: 100%; border-collapse: collapse; }
    table, th, td { border: 1px solid #ddd; }
    th, td { padding: 12px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Deployment Report</h1>
  <div class="card ${deploymentState.status === 'completed' ? 'success' : deploymentState.status === 'rolling-back' || deploymentState.status === 'failed' ? 'failure' : 'warning'}">
    <h2>Summary</h2>
    <p><strong>Deployment ID:</strong> ${config.deploymentId}</p>
    <p><strong>Status:</strong> ${deploymentState.status}</p>
    <p><strong>Environment:</strong> ${config.environment}</p>
    <p><strong>Image Tag:</strong> ${config.imageTag}</p>
    <p><strong>Started:</strong> ${new Date(deploymentState.startTime).toLocaleString()}</p>
    <p><strong>Ended:</strong> ${deploymentState.endTime ? new Date(deploymentState.endTime).toLocaleString() : 'N/A'}</p>
    <p><strong>Duration:</strong> ${deploymentReport.durationFormatted}</p>
  </div>
  
  <div class="card">
    <h2>Environment Details</h2>
    <p><strong>Previous Active:</strong> ${deploymentState.activeEnvironment}</p>
    <p><strong>Current Active:</strong> ${deploymentState.status === 'completed' ? deploymentState.targetEnvironment : deploymentState.activeEnvironment}</p>
  </div>
  
  ${deploymentState.errors.length > 0 ? `
  <div class="card failure">
    <h2>Errors</h2>
    <table>
      <tr>
        <th>Time</th>
        <th>Phase</th>
        <th>Error</th>
      </tr>
      ${deploymentState.errors.map(error => `
      <tr>
        <td>${new Date(error.time).toLocaleString()}</td>
        <td>${error.phase || 'N/A'}</td>
        <td>${error.error}</td>
      </tr>
      `).join('')}
    </table>
  </div>
  ` : ''}
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(path.dirname(reportPath), `${config.deploymentId}.html`), htmlReport);
  console.log(`HTML report saved to ${path.join(path.dirname(reportPath), `${config.deploymentId}.html`)}`);
}

/**
 * Initiate a rollback
 * @param {string} reason Reason for rollback
 */
async function initiateRollback(reason) {
  console.log(`Initiating rollback: ${reason}`);
  
  if (deploymentState.status === 'rolling-back') {
    console.log('Rollback already in progress, skipping');
    return;
  }
  
  deploymentState.status = 'rolling-back';
  
  try {
    // Immediately direct 100% traffic back to the active environment
    if (deploymentState.activeEnvironment === 'blue') {
      await updateTrafficWeights(100, 0);
    } else {
      await updateTrafficWeights(0, 100);
    }
    
    // Reset the target environment
    console.log('Restoring original deployment configuration...');
    
    // Change to Terraform directory
    process.chdir(path.join(process.cwd(), 'terrafusion'));
    
    // Create Terraform variables file to reset to the original state
    const tfVarsContent = `
      active_environment = "${deploymentState.activeEnvironment}"
      target_environment = "${deploymentState.activeEnvironment}"
    `;
    
    fs.writeFileSync('deployment.auto.tfvars', tfVarsContent);
    
    // Apply Terraform changes
    execSync('terraform apply -auto-approve', { stdio: 'inherit' });
    
    // Go back to original directory
    process.chdir(process.cwd());
    
    console.log('Rollback completed');
    
    // Update deployment state
    deploymentState.status = 'rolled-back';
    deploymentState.endTime = Date.now();
    
    // Save deployment report
    saveDeploymentReport();
    
  } catch (error) {
    console.error('Rollback failed:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'rollback',
      error: error.message
    });
    
    // Even if rollback fails, try to save the report
    deploymentState.status = 'rollback-failed';
    deploymentState.endTime = Date.now();
    saveDeploymentReport();
  }
}

/**
 * Main function to run the deployment process
 */
async function main() {
  console.log(`Starting Blue-Green deployment...`);
  console.log(`Deployment ID: ${config.deploymentId}`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Image tag: ${config.imageTag}`);
  
  try {
    // Step 1: Get current deployment state
    getDeploymentInfo();
    
    // Check if force rollback was requested
    if (config.forceRollback) {
      console.log('Force rollback requested');
      await initiateRollback('User requested rollback');
      process.exit(0);
    }
    
    // Step 2: Deploy to target environment
    await deployToTarget();
    
    // Step 3: Validate the deployment
    const validationSucceeded = await validateDeployment();
    if (!validationSucceeded) {
      console.error('Validation failed, deployment aborted');
      process.exit(1);
    }
    
    // Step 4: Shift traffic gradually
    const trafficShiftSucceeded = await shiftTraffic();
    if (!trafficShiftSucceeded) {
      console.error('Traffic shift failed, deployment aborted');
      process.exit(1);
    }
    
    console.log('Deployment completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('Deployment failed:', error);
    
    // Attempt rollback if not already rolling back
    if (deploymentState.status !== 'rolling-back' && deploymentState.status !== 'rolled-back') {
      await initiateRollback('Unhandled error during deployment');
    }
    
    process.exit(1);
  }
}

// Run the main function
main();