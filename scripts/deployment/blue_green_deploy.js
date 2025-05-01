/**
 * TerraFusion Blue/Green Deployment Script
 * 
 * This script automates blue/green deployments on AWS ECS using CodeDeploy
 * It handles traffic shifting, health checks, and rollbacks if needed
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configuration
const DEFAULT_CONFIG = {
  region: 'us-west-2',
  environment: 'prod',
  clusterName: null,  // Will be set based on environment
  serviceName: null,  // Will be set based on environment
  taskDefPath: './task-definition.json',
  ecrRepository: null,  // Will be set based on environment
  imageTag: 'latest',
  blueTargetGroupArn: null,
  greenTargetGroupArn: null,
  listenerArn: null,
  deploymentTimeout: 15 * 60 * 1000,  // 15 minutes in milliseconds
  healthCheckInterval: 10 * 1000,     // 10 seconds in milliseconds
  healthCheckPath: '/api/health',
  healthCheckSuccessThreshold: 3,
  canaryTrafficPercentage: 10,
  canaryTrafficDuration: 5 * 60 * 1000,  // 5 minutes in milliseconds
};

let config = { ...DEFAULT_CONFIG };
let awsClients = {};

/**
 * Initialize the script with configuration
 * @param {Object} userConfig - User-provided configuration
 */
async function init(userConfig = {}) {
  console.log('Initializing blue/green deployment...');
  
  // Merge user config with defaults
  config = { ...config, ...userConfig };
  
  // Set derived values if not provided
  if (!config.clusterName) {
    config.clusterName = `${config.environment}-terrafusion-cluster`;
  }
  
  if (!config.serviceName) {
    config.serviceName = `${config.environment}-terrafusion-service`;
  }
  
  if (!config.ecrRepository) {
    config.ecrRepository = `${config.environment}-terrafusion`;
  }
  
  // Initialize AWS clients
  AWS.config.update({ region: config.region });
  awsClients.ecs = new AWS.ECS();
  awsClients.codeDeploy = new AWS.CodeDeploy();
  awsClients.elbv2 = new AWS.ELBv2();
  awsClients.cloudwatch = new AWS.CloudWatch();
  
  // Validate configuration
  await validateConfig();
  
  console.log('Initialization complete');
  console.log('Configuration:', JSON.stringify(config, null, 2));
}

/**
 * Validate the configuration and load missing values from AWS
 */
async function validateConfig() {
  console.log('Validating configuration...');
  
  // Check if target group ARNs exist
  if (!config.blueTargetGroupArn || !config.greenTargetGroupArn || !config.listenerArn) {
    console.log('Target group ARNs or listener ARN not provided, fetching from AWS...');
    
    try {
      // Get service info to extract load balancer info
      const serviceDetails = await awsClients.ecs.describeServices({
        cluster: config.clusterName,
        services: [config.serviceName]
      }).promise();
      
      if (!serviceDetails.services || serviceDetails.services.length === 0) {
        throw new Error(`Service ${config.serviceName} not found in cluster ${config.clusterName}`);
      }
      
      const service = serviceDetails.services[0];
      
      if (service.loadBalancers.length === 0) {
        throw new Error(`Service ${config.serviceName} does not have any load balancers`);
      }
      
      const targetGroupArn = service.loadBalancers[0].targetGroupArn;
      const loadBalancerName = service.loadBalancers[0].loadBalancerName;
      
      // Get load balancer listeners
      const loadBalancers = await awsClients.elbv2.describeLoadBalancers({
        Names: [loadBalancerName]
      }).promise();
      
      if (!loadBalancers.LoadBalancers || loadBalancers.LoadBalancers.length === 0) {
        throw new Error(`Load balancer ${loadBalancerName} not found`);
      }
      
      const loadBalancerArn = loadBalancers.LoadBalancers[0].LoadBalancerArn;
      
      // Get listeners
      const listeners = await awsClients.elbv2.describeListeners({
        LoadBalancerArn: loadBalancerArn
      }).promise();
      
      if (!listeners.Listeners || listeners.Listeners.length === 0) {
        throw new Error(`No listeners found for load balancer ${loadBalancerName}`);
      }
      
      // Find HTTPS listener
      const httpsListener = listeners.Listeners.find(l => l.Protocol === 'HTTPS');
      
      if (!httpsListener) {
        throw new Error(`No HTTPS listener found for load balancer ${loadBalancerName}`);
      }
      
      config.listenerArn = httpsListener.ListenerArn;
      
      // Get target groups
      const targetGroups = await awsClients.elbv2.describeTargetGroups({
        LoadBalancerArn: loadBalancerArn
      }).promise();
      
      if (!targetGroups.TargetGroups || targetGroups.TargetGroups.length < 2) {
        throw new Error(`Not enough target groups found for load balancer ${loadBalancerName}`);
      }
      
      // Determine which target group is currently in use (blue) and which is idle (green)
      const currentRules = await awsClients.elbv2.describeRules({
        ListenerArn: config.listenerArn
      }).promise();
      
      if (!currentRules.Rules || currentRules.Rules.length === 0) {
        throw new Error(`No rules found for listener ${config.listenerArn}`);
      }
      
      const defaultRule = currentRules.Rules.find(r => r.IsDefault);
      
      if (!defaultRule || !defaultRule.Actions || defaultRule.Actions.length === 0) {
        throw new Error(`No default rule found for listener ${config.listenerArn}`);
      }
      
      const currentTargetGroupArn = defaultRule.Actions[0].TargetGroupArn;
      
      // Set blue (current) and green (idle) target groups
      config.blueTargetGroupArn = currentTargetGroupArn;
      
      // Find the other target group to use as green
      const greenTargetGroup = targetGroups.TargetGroups.find(tg => tg.TargetGroupArn !== currentTargetGroupArn);
      
      if (!greenTargetGroup) {
        throw new Error(`No idle target group found for load balancer ${loadBalancerName}`);
      }
      
      config.greenTargetGroupArn = greenTargetGroup.TargetGroupArn;
      
      console.log(`Blue (current) target group: ${config.blueTargetGroupArn}`);
      console.log(`Green (idle) target group: ${config.greenTargetGroupArn}`);
      console.log(`Listener ARN: ${config.listenerArn}`);
    } catch (error) {
      console.error('Error retrieving target group or listener information:', error);
      throw error;
    }
  }
}

/**
 * Create a new task definition revision
 * @returns {string} New task definition ARN
 */
async function createTaskDefinition() {
  console.log('Creating new task definition revision...');
  
  // Read the task definition template
  const taskDefPath = path.resolve(config.taskDefPath);
  
  if (!fs.existsSync(taskDefPath)) {
    throw new Error(`Task definition file not found at ${taskDefPath}`);
  }
  
  const taskDefTemplate = JSON.parse(fs.readFileSync(taskDefPath, 'utf8'));
  
  // Update the image in the container definitions
  const imageUri = `${config.ecrRepository}:${config.imageTag}`;
  taskDefTemplate.containerDefinitions[0].image = imageUri;
  
  // Register the new task definition
  console.log(`Using image: ${imageUri}`);
  
  try {
    const registerResponse = await awsClients.ecs.registerTaskDefinition({
      family: taskDefTemplate.family,
      executionRoleArn: taskDefTemplate.executionRoleArn,
      taskRoleArn: taskDefTemplate.taskRoleArn,
      networkMode: taskDefTemplate.networkMode,
      containerDefinitions: taskDefTemplate.containerDefinitions,
      volumes: taskDefTemplate.volumes || [],
      placementConstraints: taskDefTemplate.placementConstraints || [],
      requiresCompatibilities: taskDefTemplate.requiresCompatibilities || [],
      cpu: taskDefTemplate.cpu,
      memory: taskDefTemplate.memory
    }).promise();
    
    const newTaskDefArn = registerResponse.taskDefinition.taskDefinitionArn;
    console.log(`New task definition registered: ${newTaskDefArn}`);
    
    return newTaskDefArn;
  } catch (error) {
    console.error('Error registering new task definition:', error);
    throw error;
  }
}

/**
 * Create a CodeDeploy deployment
 * @param {string} taskDefArn - ARN of the new task definition
 * @returns {string} Deployment ID
 */
async function createDeployment(taskDefArn) {
  console.log('Creating CodeDeploy deployment...');
  
  try {
    // Check if application exists, create if not
    const appName = `${config.environment}-terrafusion`;
    let appExists = false;
    
    try {
      const getAppResponse = await awsClients.codeDeploy.getApplication({
        applicationName: appName
      }).promise();
      
      if (getAppResponse.application) {
        appExists = true;
      }
    } catch (error) {
      if (error.code !== 'ApplicationDoesNotExistException') {
        throw error;
      }
    }
    
    if (!appExists) {
      console.log(`Creating CodeDeploy application: ${appName}`);
      await awsClients.codeDeploy.createApplication({
        applicationName: appName,
        computePlatform: 'ECS'
      }).promise();
    }
    
    // Check if deployment group exists, create if not
    const deploymentGroupName = `${config.environment}-terrafusion-bluegreen`;
    let deploymentGroupExists = false;
    
    try {
      const getDeploymentGroupResponse = await awsClients.codeDeploy.getDeploymentGroup({
        applicationName: appName,
        deploymentGroupName: deploymentGroupName
      }).promise();
      
      if (getDeploymentGroupResponse.deploymentGroupInfo) {
        deploymentGroupExists = true;
      }
    } catch (error) {
      if (error.code !== 'DeploymentGroupDoesNotExistException') {
        throw error;
      }
    }
    
    if (!deploymentGroupExists) {
      console.log(`Creating CodeDeploy deployment group: ${deploymentGroupName}`);
      
      // Get service role ARN for CodeDeploy
      const iamClient = new AWS.IAM();
      const rolesResponse = await iamClient.listRoles({
        PathPrefix: '/service-role/'
      }).promise();
      
      const codeDeployRole = rolesResponse.Roles.find(role => 
        role.RoleName.includes('CodeDeploy') && role.AssumeRolePolicyDocument.includes('codedeploy.amazonaws.com')
      );
      
      if (!codeDeployRole) {
        throw new Error('CodeDeploy service role not found');
      }
      
      await awsClients.codeDeploy.createDeploymentGroup({
        applicationName: appName,
        deploymentGroupName: deploymentGroupName,
        serviceRoleArn: codeDeployRole.Arn,
        deploymentConfigName: 'CodeDeployDefault.ECSAllAtOnce',
        ecsServices: [{
          serviceName: config.serviceName,
          clusterName: config.clusterName
        }],
        loadBalancerInfo: {
          targetGroupPairInfoList: [{
            targetGroups: [
              { name: config.blueTargetGroupArn.split('/').pop() },
              { name: config.greenTargetGroupArn.split('/').pop() }
            ],
            prodTrafficRoute: {
              listenerArns: [config.listenerArn]
            }
          }]
        },
        deploymentStyle: {
          deploymentType: 'BLUE_GREEN',
          deploymentOption: 'WITH_TRAFFIC_CONTROL'
        },
        blueGreenDeploymentConfiguration: {
          deploymentReadyOption: {
            actionOnTimeout: 'CONTINUE_DEPLOYMENT',
            waitTimeInMinutes: 10
          },
          terminateBlueInstancesOnDeploymentSuccess: {
            action: 'TERMINATE',
            terminationWaitTimeInMinutes: 5
          }
        },
        autoRollbackConfiguration: {
          enabled: true,
          events: ['DEPLOYMENT_FAILURE', 'DEPLOYMENT_STOP_ON_ALARM', 'DEPLOYMENT_STOP_ON_REQUEST']
        }
      }).promise();
    }
    
    // Create deployment
    console.log('Creating deployment...');
    const createDeploymentResponse = await awsClients.codeDeploy.createDeployment({
      applicationName: appName,
      deploymentGroupName: deploymentGroupName,
      revision: {
        revisionType: 'AppSpecContent',
        appSpecContent: {
          content: JSON.stringify({
            version: 0.0,
            Resources: [{
              TargetService: {
                Type: 'AWS::ECS::Service',
                Properties: {
                  TaskDefinition: taskDefArn,
                  LoadBalancerInfo: {
                    ContainerName: 'terrafusion-app',
                    ContainerPort: 5000
                  }
                }
              }
            }]
          }),
          sha256: 'auto-calculated-sha256'
        }
      }
    }).promise();
    
    const deploymentId = createDeploymentResponse.deploymentId;
    console.log(`Deployment created with ID: ${deploymentId}`);
    
    return deploymentId;
  } catch (error) {
    console.error('Error creating deployment:', error);
    throw error;
  }
}

/**
 * Monitor deployment status
 * @param {string} deploymentId - Deployment ID to monitor
 * @returns {boolean} Success status
 */
async function monitorDeployment(deploymentId) {
  console.log(`Monitoring deployment ${deploymentId}...`);
  
  const startTime = Date.now();
  let inProgress = true;
  let success = false;
  
  while (inProgress && (Date.now() - startTime) < config.deploymentTimeout) {
    try {
      const deploymentResponse = await awsClients.codeDeploy.getDeployment({
        deploymentId: deploymentId
      }).promise();
      
      const deploymentInfo = deploymentResponse.deploymentInfo;
      const status = deploymentInfo.status;
      
      console.log(`Deployment status: ${status}`);
      
      switch (status) {
        case 'Succeeded':
          console.log('Deployment completed successfully');
          inProgress = false;
          success = true;
          break;
        case 'Failed':
        case 'Stopped':
          console.error(`Deployment ${status.toLowerCase()}`);
          console.error(`Error info: ${JSON.stringify(deploymentInfo.errorInformation || {})}`);
          inProgress = false;
          success = false;
          break;
        case 'InProgress':
        case 'Queued':
        case 'Created':
        case 'Ready':
          // Deployment still in progress, continue monitoring
          await new Promise(resolve => setTimeout(resolve, config.healthCheckInterval));
          break;
        default:
          console.warn(`Unknown deployment status: ${status}`);
          await new Promise(resolve => setTimeout(resolve, config.healthCheckInterval));
      }
    } catch (error) {
      console.error('Error monitoring deployment:', error);
      await new Promise(resolve => setTimeout(resolve, config.healthCheckInterval));
    }
  }
  
  if (inProgress) {
    console.error('Deployment timed out');
    
    try {
      console.log('Stopping deployment due to timeout');
      await awsClients.codeDeploy.stopDeployment({
        deploymentId: deploymentId,
        autoRollbackEnabled: true
      }).promise();
    } catch (stopError) {
      console.error('Error stopping deployment:', stopError);
    }
    
    return false;
  }
  
  return success;
}

/**
 * Run the full blue/green deployment process
 */
async function runDeployment() {
  try {
    console.log('Starting blue/green deployment process...');
    
    // Create new task definition
    const newTaskDefArn = await createTaskDefinition();
    
    // Create deployment
    const deploymentId = await createDeployment(newTaskDefArn);
    
    // Monitor deployment
    const deploymentSuccess = await monitorDeployment(deploymentId);
    
    if (deploymentSuccess) {
      console.log('Blue/green deployment completed successfully');
    } else {
      console.error('Blue/green deployment failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const userConfig = {};
    
    // Parse command-line arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--environment' || arg === '-e') {
        userConfig.environment = args[++i];
      } else if (arg === '--region' || arg === '-r') {
        userConfig.region = args[++i];
      } else if (arg === '--image-tag' || arg === '-i') {
        userConfig.imageTag = args[++i];
      } else if (arg === '--task-def' || arg === '-t') {
        userConfig.taskDefPath = args[++i];
      } else if (arg === '--help' || arg === '-h') {
        console.log(`
Blue/Green Deployment Script Usage:
--environment, -e    Environment (dev, staging, prod)
--region, -r         AWS region
--image-tag, -i      Docker image tag to deploy
--task-def, -t       Path to task definition template
--help, -h           Show this help message
        `);
        process.exit(0);
      }
    }
    
    // Initialize and run deployment
    await init(userConfig);
    await runDeployment();
    
    console.log('Deployment script completed');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run script if executed directly
if (require.main === module) {
  main();
}

// Export functions for testing
module.exports = {
  init,
  validateConfig,
  createTaskDefinition,
  createDeployment,
  monitorDeployment,
  runDeployment
};