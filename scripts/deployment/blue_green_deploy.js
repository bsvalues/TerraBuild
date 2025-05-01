/**
 * Blue/Green Deployment Script for TerraFusion
 * 
 * This script performs a blue/green deployment by:
 * 1. Creating a new "green" ECS task definition
 * 2. Deploying green environment with the new code
 * 3. Running smoke tests against green environment
 * 4. Shifting traffic from blue to green
 * 5. Rolling back if necessary
 */

const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');

// Configuration (from environment or command line args)
const config = {
  cluster: process.env.ECS_CLUSTER || 'terrafusion-cluster',
  service: process.env.ECS_SERVICE || 'terrafusion-service',
  targetGroupBlue: process.env.TARGET_GROUP_BLUE,
  targetGroupGreen: process.env.TARGET_GROUP_GREEN,
  listenerArn: process.env.LISTENER_ARN,
  region: process.env.AWS_REGION || 'us-west-2',
  imageTag: process.env.IMAGE_TAG || 'latest',
  ecrRepo: process.env.ECR_REPO || 'terrafusion',
  maxAttempts: 30,
  healthCheckUrl: process.env.HEALTH_CHECK_URL || '/api/health',
  smokeTestTimeoutMs: 10000,
  rollbackDelayMs: 300000 // 5 minutes
};

// Verify required environment variables
const requiredEnvVars = ['TARGET_GROUP_BLUE', 'TARGET_GROUP_GREEN', 'LISTENER_ARN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

async function executeCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    console.error(`Command failed: ${error.message}`);
    throw error;
  }
}

async function waitForEcsServiceStability(cluster, service) {
  console.log(`Waiting for service ${service} to become stable...`);
  try {
    await executeCommand(`aws ecs wait services-stable --cluster ${cluster} --services ${service} --region ${config.region}`);
    console.log('Service is stable');
    return true;
  } catch (error) {
    console.error('Failed to wait for service stability:', error);
    return false;
  }
}

async function runSmokeTests(targetGroupArn) {
  console.log('Running smoke tests against green environment...');
  
  // Get DNS name for target group
  const describeTargetGroups = await executeCommand(
    `aws elbv2 describe-target-groups --target-group-arns ${targetGroupArn} --region ${config.region}`
  );
  
  const targetGroupInfo = JSON.parse(describeTargetGroups);
  const loadBalancerArn = targetGroupInfo.TargetGroups[0].LoadBalancerArns[0];
  
  // Get load balancer DNS name
  const describeLBs = await executeCommand(
    `aws elbv2 describe-load-balancers --load-balancer-arns ${loadBalancerArn} --region ${config.region}`
  );
  
  const lbInfo = JSON.parse(describeLBs);
  const lbDns = lbInfo.LoadBalancers[0].DNSName;
  
  // URL for smoke test
  const testUrl = `http://${lbDns}${config.healthCheckUrl}`;
  
  // Run smoke tests
  let attempts = 0;
  let success = false;
  
  while (attempts < config.maxAttempts && !success) {
    try {
      console.log(`Attempt ${attempts + 1}/${config.maxAttempts}: Testing ${testUrl}`);
      const response = await axios.get(testUrl, { timeout: config.smokeTestTimeoutMs });
      
      if (response.status === 200) {
        console.log('Smoke tests passed successfully');
        success = true;
      } else {
        console.log(`Unexpected status code: ${response.status}`);
        await new Promise(resolve => setTimeout(resolve, config.smokeTestTimeoutMs));
      }
    } catch (error) {
      console.log(`Smoke test failed: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, config.smokeTestTimeoutMs));
    }
    attempts++;
  }
  
  return success;
}

async function shiftTraffic(listenerArn, targetGroupArn) {
  console.log(`Shifting traffic to target group: ${targetGroupArn}`);
  await executeCommand(`
    aws elbv2 modify-listener --listener-arn ${listenerArn} \
    --default-actions Type=forward,TargetGroupArn=${targetGroupArn} \
    --region ${config.region}
  `);
  console.log('Traffic shifted successfully');
}

async function updateTaskDefinition() {
  console.log('Getting current task definition...');
  
  // Get current task definition
  const describeService = await executeCommand(`
    aws ecs describe-services --cluster ${config.cluster} \
    --services ${config.service} \
    --region ${config.region}
  `);
  
  const serviceInfo = JSON.parse(describeService);
  const currentTaskDefArn = serviceInfo.services[0].taskDefinition;
  
  console.log(`Current task definition: ${currentTaskDefArn}`);
  
  // Get task definition details
  const describeTaskDef = await executeCommand(`
    aws ecs describe-task-definition --task-definition ${currentTaskDefArn} \
    --region ${config.region}
  `);
  
  const taskDef = JSON.parse(describeTaskDef);
  const taskDefFamily = taskDef.taskDefinition.family;
  
  // Create new task definition JSON with updated image
  const newTaskDef = { ...taskDef.taskDefinition };
  delete newTaskDef.taskDefinitionArn;
  delete newTaskDef.revision;
  delete newTaskDef.status;
  delete newTaskDef.requiresAttributes;
  delete newTaskDef.compatibilities;
  delete newTaskDef.registeredAt;
  delete newTaskDef.registeredBy;
  
  // Update container image
  newTaskDef.containerDefinitions = newTaskDef.containerDefinitions.map(container => {
    const updatedContainer = { ...container };
    // Only update the main application container
    if (updatedContainer.name === 'terrafusion-app') {
      updatedContainer.image = `${config.ecrRepo}:${config.imageTag}`;
    }
    return updatedContainer;
  });
  
  // Write new task definition to temp file
  const tempFile = `/tmp/new-task-def-${Date.now()}.json`;
  fs.writeFileSync(tempFile, JSON.stringify(newTaskDef, null, 2));
  
  // Register new task definition
  console.log('Registering new task definition...');
  const registerResult = await executeCommand(`
    aws ecs register-task-definition --cli-input-json file://${tempFile} \
    --region ${config.region}
  `);
  
  const newTaskDefinition = JSON.parse(registerResult);
  const newTaskDefArn = newTaskDefinition.taskDefinition.taskDefinitionArn;
  
  console.log(`New task definition registered: ${newTaskDefArn}`);
  fs.unlinkSync(tempFile);
  
  return newTaskDefArn;
}

async function deployGreen() {
  try {
    console.log('Starting blue/green deployment process...');
    
    // Step 1: Update task definition with new image
    const newTaskDefArn = await updateTaskDefinition();
    
    // Step 2: Update service to use green target group
    console.log('Updating service to use green target group and new task definition...');
    await executeCommand(`
      aws ecs update-service --cluster ${config.cluster} \
      --service ${config.service} \
      --task-definition ${newTaskDefArn} \
      --load-balancers targetGroupArn=${config.targetGroupGreen},containerName=terrafusion-app,containerPort=5000 \
      --region ${config.region}
    `);
    
    // Step 3: Wait for service to become stable
    const isStable = await waitForEcsServiceStability(config.cluster, config.service);
    if (!isStable) {
      throw new Error('Service failed to stabilize');
    }
    
    // Step 4: Run smoke tests against green environment
    const smokeTestsPassed = await runSmokeTests(config.targetGroupGreen);
    if (!smokeTestsPassed) {
      throw new Error('Smoke tests failed');
    }
    
    // Step 5: Shift traffic from blue to green
    console.log('Shifting traffic from blue to green...');
    await shiftTraffic(config.listenerArn, config.targetGroupGreen);
    
    console.log('Blue/green deployment completed successfully');
    return {
      success: true,
      newTaskDefinitionArn: newTaskDefArn
    };
    
  } catch (error) {
    console.error('Error during blue/green deployment:', error);
    
    // Roll back if there was an error
    try {
      console.log('Rolling back to blue environment...');
      await shiftTraffic(config.listenerArn, config.targetGroupBlue);
      console.log('Rolled back to blue environment');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute if called directly
if (require.main === module) {
  deployGreen()
    .then(result => {
      if (result.success) {
        console.log('Deployment completed successfully');
        process.exit(0);
      } else {
        console.error('Deployment failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { deployGreen };