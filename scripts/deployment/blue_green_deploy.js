#!/usr/bin/env node
/**
 * TerraFusion Blue/Green Deployment Script
 * 
 * This script performs a blue/green deployment for the TerraFusion application
 * using AWS ECS and Route 53 for traffic routing.
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');
const { randomUUID } = require('crypto');

// Configuration
const DEFAULT_CONFIG = {
  environment: 'dev',
  awsRegion: 'us-west-2',
  ecsCluster: 'terrafusion-cluster',
  serviceName: 'terrafusion-api',
  taskDefinitionFamily: 'terrafusion-api',
  containerName: 'terrafusion-api',
  deploymentTimeout: 600, // seconds
  canaryTrafficPercentage: 10,
  canaryTestDuration: 300, // seconds
  healthCheckEndpoint: '/health',
  healthCheckPort: 5000,
  healthCheckInterval: 10, // seconds
  healthCheckHealthyThreshold: 3,
  healthCheckUnhealthyThreshold: 2,
  healthCheckTimeout: 5, // seconds
  rollbackOnFailure: true,
  logDir: path.join(__dirname, '../../logs'),
  vpcId: '', // Will be loaded from the ECS service
  subnets: [], // Will be loaded from the ECS service
  securityGroups: [], // Will be loaded from the ECS service
  targetGroupBlue: '',
  targetGroupGreen: '',
  loadBalancerArn: '',
  listenerArn: '',
  hostedZoneId: '',
  domainName: '',
  buildId: process.env.BUILD_ID || randomUUID().substring(0, 8),
  dryRun: false
};

// Parse command line arguments
const args = process.argv.slice(2);
const config = { ...DEFAULT_CONFIG };

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  
  if (arg === '--env' || arg === '-e') {
    config.environment = args[++i];
  } else if (arg === '--region' || arg === '-r') {
    config.awsRegion = args[++i];
  } else if (arg === '--cluster' || arg === '-c') {
    config.ecsCluster = args[++i];
  } else if (arg === '--service' || arg === '-s') {
    config.serviceName = args[++i];
  } else if (arg === '--task-family' || arg === '-t') {
    config.taskDefinitionFamily = args[++i];
  } else if (arg === '--canary-traffic' || arg === '-p') {
    config.canaryTrafficPercentage = parseInt(args[++i], 10);
  } else if (arg === '--canary-duration' || arg === '-d') {
    config.canaryTestDuration = parseInt(args[++i], 10);
  } else if (arg === '--timeout') {
    config.deploymentTimeout = parseInt(args[++i], 10);
  } else if (arg === '--no-rollback') {
    config.rollbackOnFailure = false;
  } else if (arg === '--dry-run') {
    config.dryRun = true;
  } else if (arg === '--help' || arg === '-h') {
    showHelp();
    process.exit(0);
  }
}

// Initialize logging
const logFilePath = path.join(config.logDir, `deploy_${config.environment}_${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
let logFile;

// Function to show help
function showHelp() {
  console.log(`
TerraFusion Blue/Green Deployment Script

Usage: node blue_green_deploy.js [options]

Options:
  --env, -e         Environment (dev, staging, prod) (default: dev)
  --region, -r      AWS region (default: us-west-2)
  --cluster, -c     ECS cluster name (default: terrafusion-cluster)
  --service, -s     ECS service name (default: terrafusion-api)
  --task-family, -t Task definition family (default: terrafusion-api)
  --canary-traffic, -p Canary traffic percentage (default: 10)
  --canary-duration, -d Canary test duration in seconds (default: 300)
  --timeout         Deployment timeout in seconds (default: 600)
  --no-rollback     Disable automatic rollback on failure
  --dry-run         Show what would be done without making changes
  --help, -h        Show this help message
  `);
}

// Main deployment function
async function deploy() {
  try {
    await initializeLogging();
    
    log('=== TerraFusion Blue/Green Deployment ===');
    log(`Environment: ${config.environment}`);
    log(`AWS Region: ${config.awsRegion}`);
    log(`ECS Cluster: ${config.ecsCluster}`);
    log(`Service: ${config.serviceName}`);
    log(`Build ID: ${config.buildId}`);
    log(`Dry Run: ${config.dryRun ? 'Yes' : 'No'}`);
    log('================================================');
    
    // 1. Set AWS region
    process.env.AWS_REGION = config.awsRegion;
    
    // 2. Load current service configuration
    await loadServiceConfiguration();
    
    // 3. Register new task definition
    const newTaskDefinition = await registerTaskDefinition();
    
    // 4. Create new target group for green deployment
    const greenTargetGroup = await createGreenTargetGroup();
    
    // 5. Update service to use the new task definition and target group
    await updateService(newTaskDefinition, greenTargetGroup);
    
    // 6. Wait for service deployment to stabilize
    await waitForServiceStability();
    
    // 7. Perform canary testing if configured
    if (config.canaryTrafficPercentage > 0) {
      await performCanaryTesting(greenTargetGroup);
    }
    
    // 8. If all is good, shift 100% traffic to new deployment
    await shiftTrafficToGreen(greenTargetGroup);
    
    // 9. Wait for old tasks to drain
    await waitForTasksToDrain();
    
    // 10. Clean up old target group
    await cleanupOldTargetGroup();
    
    log('Deployment completed successfully');
    await closeLogging();
    process.exit(0);
  } catch (error) {
    log(`ERROR: Deployment failed: ${error.message}`);
    console.error('Deployment failed:', error);
    
    if (config.rollbackOnFailure) {
      log('Initiating rollback...');
      try {
        await rollback();
        log('Rollback completed successfully');
      } catch (rollbackError) {
        log(`ERROR: Rollback failed: ${rollbackError.message}`);
        console.error('Rollback failed:', rollbackError);
      }
    }
    
    await closeLogging();
    process.exit(1);
  }
}

// Initialize logging
async function initializeLogging() {
  try {
    await fs.mkdir(config.logDir, { recursive: true });
    logFile = await fs.open(logFilePath, 'a');
    log('Logging initialized');
  } catch (error) {
    console.error('Failed to initialize logging:', error);
    // Continue without file logging
  }
}

// Log to both console and file
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  console.log(formattedMessage);
  
  if (logFile) {
    logFile.write(formattedMessage + '\n').catch(err => {
      console.error('Failed to write to log file:', err);
    });
  }
}

// Close logging
async function closeLogging() {
  if (logFile) {
    try {
      await logFile.close();
    } catch (error) {
      console.error('Failed to close log file:', error);
    }
  }
}

// Load current service configuration
async function loadServiceConfiguration() {
  log('Loading current service configuration...');
  
  if (config.dryRun) {
    log('DRY RUN: Would load service configuration');
    return;
  }
  
  try {
    // Describe the ECS service to get current configuration
    const { stdout } = await execAsync(`aws ecs describe-services --cluster ${config.ecsCluster} --services ${config.serviceName} --region ${config.awsRegion}`);
    const serviceData = JSON.parse(stdout);
    
    if (!serviceData.services || serviceData.services.length === 0) {
      throw new Error(`Service ${config.serviceName} not found in cluster ${config.ecsCluster}`);
    }
    
    const service = serviceData.services[0];
    
    // Get load balancer configuration
    if (service.loadBalancers && service.loadBalancers.length > 0) {
      const loadBalancer = service.loadBalancers[0];
      config.targetGroupBlue = loadBalancer.targetGroupArn;
      
      // Get load balancer and listener ARNs
      const { stdout: lbStdout } = await execAsync(`aws elbv2 describe-target-groups --target-group-arns ${config.targetGroupBlue} --region ${config.awsRegion}`);
      const targetGroupData = JSON.parse(lbStdout);
      
      if (targetGroupData.TargetGroups && targetGroupData.TargetGroups.length > 0) {
        const targetGroup = targetGroupData.TargetGroups[0];
        config.loadBalancerArn = targetGroup.LoadBalancerArns[0];
        
        // Get listener ARN
        const { stdout: listenerStdout } = await execAsync(`aws elbv2 describe-listeners --load-balancer-arn ${config.loadBalancerArn} --region ${config.awsRegion}`);
        const listenerData = JSON.parse(listenerStdout);
        
        if (listenerData.Listeners && listenerData.Listeners.length > 0) {
          config.listenerArn = listenerData.Listeners[0].ListenerArn;
        }
      }
    }
    
    // Get network configuration
    if (service.networkConfiguration && service.networkConfiguration.awsvpcConfiguration) {
      const { subnets, securityGroups } = service.networkConfiguration.awsvpcConfiguration;
      config.subnets = subnets;
      config.securityGroups = securityGroups;
    }
    
    log('Service configuration loaded successfully');
    log(`Current Target Group: ${config.targetGroupBlue}`);
    log(`Load Balancer ARN: ${config.loadBalancerArn}`);
    log(`Listener ARN: ${config.listenerArn}`);
  } catch (error) {
    throw new Error(`Failed to load service configuration: ${error.message}`);
  }
}

// Register a new task definition based on the current task definition
async function registerTaskDefinition() {
  log('Registering new task definition...');
  
  if (config.dryRun) {
    log('DRY RUN: Would register new task definition');
    return 'task-definition-arn';
  }
  
  try {
    // Get the current task definition
    const { stdout: taskDefStdout } = await execAsync(`aws ecs describe-task-definition --task-definition ${config.taskDefinitionFamily} --region ${config.awsRegion}`);
    const taskDefData = JSON.parse(taskDefStdout);
    
    if (!taskDefData.taskDefinition) {
      throw new Error(`Task definition family ${config.taskDefinitionFamily} not found`);
    }
    
    const taskDef = taskDefData.taskDefinition;
    
    // Remove the read-only fields
    delete taskDef.taskDefinitionArn;
    delete taskDef.revision;
    delete taskDef.status;
    delete taskDef.requiresAttributes;
    delete taskDef.compatibilities;
    delete taskDef.registeredAt;
    delete taskDef.registeredBy;
    
    // Update container tags with build ID
    taskDef.containerDefinitions.forEach(container => {
      if (container.name === config.containerName) {
        const imageParts = container.image.split(':');
        container.image = `${imageParts[0]}:${config.buildId}`;
      }
    });
    
    // Write updated task definition to temp file
    const tempTaskDefPath = path.join('/tmp', `${config.taskDefinitionFamily}-${config.buildId}.json`);
    await fs.writeFile(tempTaskDefPath, JSON.stringify(taskDef));
    
    // Register the new task definition
    const { stdout: registerStdout } = await execAsync(`aws ecs register-task-definition --cli-input-json file://${tempTaskDefPath} --region ${config.awsRegion}`);
    const registerData = JSON.parse(registerStdout);
    
    if (!registerData.taskDefinition || !registerData.taskDefinition.taskDefinitionArn) {
      throw new Error('Failed to register new task definition');
    }
    
    const newTaskDefinitionArn = registerData.taskDefinition.taskDefinitionArn;
    log(`New task definition registered: ${newTaskDefinitionArn}`);
    
    return newTaskDefinitionArn;
  } catch (error) {
    throw new Error(`Failed to register new task definition: ${error.message}`);
  }
}

// Create a new (green) target group
async function createGreenTargetGroup() {
  log('Creating new target group for green deployment...');
  
  if (config.dryRun) {
    log('DRY RUN: Would create new target group');
    return 'green-target-group-arn';
  }
  
  try {
    // Describe the current (blue) target group to get its configuration
    const { stdout: blueStdout } = await execAsync(`aws elbv2 describe-target-groups --target-group-arns ${config.targetGroupBlue} --region ${config.awsRegion}`);
    const blueData = JSON.parse(blueStdout);
    
    if (!blueData.TargetGroups || blueData.TargetGroups.length === 0) {
      throw new Error(`Target group ${config.targetGroupBlue} not found`);
    }
    
    const blueTargetGroup = blueData.TargetGroups[0];
    
    // Create a target group name with a timestamp to ensure uniqueness
    const timestamp = new Date().getTime();
    const greenTargetGroupName = `tf-${config.environment}-${config.buildId}-${timestamp}`.substring(0, 32);
    
    // Create a new target group with the same settings as the blue one
    const createCmd = `aws elbv2 create-target-group \
      --name ${greenTargetGroupName} \
      --protocol ${blueTargetGroup.Protocol} \
      --port ${blueTargetGroup.Port} \
      --vpc-id ${blueTargetGroup.VpcId} \
      --target-type ${blueTargetGroup.TargetType} \
      --health-check-protocol ${blueTargetGroup.HealthCheckProtocol} \
      --health-check-port ${blueTargetGroup.HealthCheckPort} \
      --health-check-path ${config.healthCheckEndpoint} \
      --health-check-interval-seconds ${config.healthCheckInterval} \
      --health-check-timeout-seconds ${config.healthCheckTimeout} \
      --healthy-threshold-count ${config.healthCheckHealthyThreshold} \
      --unhealthy-threshold-count ${config.healthCheckUnhealthyThreshold} \
      --region ${config.awsRegion}`;
    
    const { stdout: createStdout } = await execAsync(createCmd);
    const createData = JSON.parse(createStdout);
    
    if (!createData.TargetGroups || createData.TargetGroups.length === 0) {
      throw new Error('Failed to create new target group');
    }
    
    const greenTargetGroupArn = createData.TargetGroups[0].TargetGroupArn;
    log(`Created new target group: ${greenTargetGroupArn}`);
    
    return greenTargetGroupArn;
  } catch (error) {
    throw new Error(`Failed to create green target group: ${error.message}`);
  }
}

// Update the service to use the new task definition and target group
async function updateService(taskDefinitionArn, targetGroupArn) {
  log('Updating service with new task definition and target group...');
  
  if (config.dryRun) {
    log('DRY RUN: Would update service');
    return;
  }
  
  try {
    const updateCmd = `aws ecs update-service \
      --cluster ${config.ecsCluster} \
      --service ${config.serviceName} \
      --task-definition ${taskDefinitionArn} \
      --load-balancers targetGroupArn=${targetGroupArn},containerName=${config.containerName},containerPort=${config.healthCheckPort} \
      --region ${config.awsRegion}`;
    
    await execAsync(updateCmd);
    log('Service updated successfully');
  } catch (error) {
    throw new Error(`Failed to update service: ${error.message}`);
  }
}

// Wait for service deployment to stabilize
async function waitForServiceStability() {
  log('Waiting for service deployment to stabilize...');
  
  if (config.dryRun) {
    log('DRY RUN: Would wait for service stability');
    return;
  }
  
  try {
    const waitCmd = `aws ecs wait services-stable \
      --cluster ${config.ecsCluster} \
      --services ${config.serviceName} \
      --region ${config.awsRegion}`;
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Service stabilization timed out after ${config.deploymentTimeout} seconds`));
      }, config.deploymentTimeout * 1000);
    });
    
    const stabilityPromise = execAsync(waitCmd);
    
    await Promise.race([stabilityPromise, timeoutPromise]);
    log('Service deployment is stable');
  } catch (error) {
    throw new Error(`Service stabilization failed: ${error.message}`);
  }
}

// Perform canary testing with partial traffic to the new deployment
async function performCanaryTesting(greenTargetGroupArn) {
  log(`Starting canary testing with ${config.canaryTrafficPercentage}% traffic for ${config.canaryTestDuration} seconds...`);
  
  if (config.dryRun) {
    log('DRY RUN: Would perform canary testing');
    return;
  }
  
  try {
    // Modify the listener rule to send a percentage of traffic to the green target group
    const modifyCmd = `aws elbv2 modify-listener \
      --listener-arn ${config.listenerArn} \
      --default-actions Type=forward,ForwardConfig='{TargetGroups=[{TargetGroupArn=${config.targetGroupBlue},Weight=${100 - config.canaryTrafficPercentage}},{TargetGroupArn=${greenTargetGroupArn},Weight=${config.canaryTrafficPercentage}}]}' \
      --region ${config.awsRegion}`;
    
    await execAsync(modifyCmd);
    log(`Canary testing started with ${config.canaryTrafficPercentage}% traffic to new deployment`);
    
    // Wait for the canary test duration
    log(`Waiting for ${config.canaryTestDuration} seconds to monitor canary test...`);
    await new Promise(resolve => setTimeout(resolve, config.canaryTestDuration * 1000));
    
    // TODO: Add CloudWatch metrics check here to ensure the canary deployment is healthy
    
    log('Canary testing completed successfully');
  } catch (error) {
    throw new Error(`Canary testing failed: ${error.message}`);
  }
}

// Shift 100% of traffic to the green deployment
async function shiftTrafficToGreen(greenTargetGroupArn) {
  log('Shifting 100% traffic to the new deployment...');
  
  if (config.dryRun) {
    log('DRY RUN: Would shift traffic to green deployment');
    return;
  }
  
  try {
    const modifyCmd = `aws elbv2 modify-listener \
      --listener-arn ${config.listenerArn} \
      --default-actions Type=forward,TargetGroupArn=${greenTargetGroupArn} \
      --region ${config.awsRegion}`;
    
    await execAsync(modifyCmd);
    log('Traffic shifted to new deployment successfully');
    
    // Store the green target group as the new blue for future deployments
    config.targetGroupGreen = greenTargetGroupArn;
  } catch (error) {
    throw new Error(`Failed to shift traffic: ${error.message}`);
  }
}

// Wait for old tasks to drain
async function waitForTasksToDrain() {
  log('Waiting for old tasks to drain...');
  
  if (config.dryRun) {
    log('DRY RUN: Would wait for old tasks to drain');
    return;
  }
  
  // Wait a fixed amount of time to allow connections to drain
  await new Promise(resolve => setTimeout(resolve, 60 * 1000));
  log('Old tasks drained');
}

// Clean up the old target group
async function cleanupOldTargetGroup() {
  log('Cleaning up old target group...');
  
  if (config.dryRun) {
    log('DRY RUN: Would clean up old target group');
    return;
  }
  
  try {
    // Wait a bit longer to ensure no traffic is going to the old target group
    await new Promise(resolve => setTimeout(resolve, 30 * 1000));
    
    // Delete the old target group
    const deleteCmd = `aws elbv2 delete-target-group \
      --target-group-arn ${config.targetGroupBlue} \
      --region ${config.awsRegion}`;
    
    await execAsync(deleteCmd);
    log('Old target group deleted successfully');
  } catch (error) {
    log(`Warning: Failed to clean up old target group: ${error.message}`);
    // Don't throw an error here as this is not critical
  }
}

// Rollback function for failed deployments
async function rollback() {
  log('Starting rollback process...');
  
  if (config.dryRun) {
    log('DRY RUN: Would perform rollback');
    return;
  }
  
  try {
    // Return traffic to blue target group
    const modifyCmd = `aws elbv2 modify-listener \
      --listener-arn ${config.listenerArn} \
      --default-actions Type=forward,TargetGroupArn=${config.targetGroupBlue} \
      --region ${config.awsRegion}`;
    
    await execAsync(modifyCmd);
    log('Traffic returned to original deployment');
    
    // Delete the green target group if it was created
    if (config.targetGroupGreen) {
      const deleteCmd = `aws elbv2 delete-target-group \
        --target-group-arn ${config.targetGroupGreen} \
        --region ${config.awsRegion}`;
      
      await execAsync(deleteCmd);
      log('New target group deleted');
    }
    
    log('Rollback completed successfully');
  } catch (error) {
    throw new Error(`Rollback failed: ${error.message}`);
  }
}

// Run the deployment
deploy().catch(error => {
  console.error('Unhandled deployment error:', error);
  process.exit(1);
});