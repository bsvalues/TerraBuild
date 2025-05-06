#!/usr/bin/env node
/**
 * Canary Deployment Script for BCBS Application
 * 
 * This script automates the canary deployment process, which is a more granular
 * approach compared to blue-green deployments. With canary deployments, we gradually
 * route small percentages of traffic to the new version while monitoring metrics.
 * 
 * Usage:
 *   node scripts/canary_deploy.js [options]
 * 
 * Options:
 *   --environment=env     Deployment environment (dev, staging, prod) (default: staging)
 *   --deployment-id=id    Unique deployment ID (default: generates timestamp-based ID)
 *   --image-tag=tag       Docker image tag to deploy (default: latest)
 *   --initial-percent=n   Initial percentage of traffic to route to canary (default: 5)
 *   --increment=n         Percentage increment for each step (default: 10)
 *   --interval=n          Minutes between traffic percentage increases (default: 15)
 *   --error-threshold=n   Error rate threshold for automatic rollback (default: 1)
 *   --latency-threshold=n P95 latency threshold in ms for rollback (default: 500)
 *   --abort-deployment    Abort an in-progress canary deployment
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
  deploymentId: args['deployment-id'] || `canary-${Date.now()}`,
  imageTag: args['image-tag'] || 'latest',
  initialPercent: parseInt(args['initial-percent'] || '5', 10),
  increment: parseInt(args['increment'] || '10', 10),
  intervalMinutes: parseInt(args['interval'] || '15', 10),
  errorThreshold: parseFloat(args['error-threshold'] || '1'),
  latencyThreshold: parseInt(args['latency-threshold'] || '500', 10),
  abortDeployment: args['abort-deployment'] || false,
  // AWS-specific configuration
  region: args.region || 'us-west-2',
  clusterName: '',
  targetGroup: '',
  canaryTargetGroup: '',
  listenerArn: '',
};

// Initialize deployment state
let deploymentState = {
  status: 'initializing',
  startTime: Date.now(),
  endTime: null,
  currentPercentage: 0,
  steps: [],
  metrics: {},
  errors: []
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
    
    throw error;
  }
}

/**
 * Initialize the canary deployment
 */
async function initializeCanaryDeployment() {
  console.log(`Initializing canary deployment (ID: ${config.deploymentId})...`);
  
  try {
    // Get ECS cluster name
    config.clusterName = `${args.project || 'bcbs'}-cluster-${config.environment}`;
    
    // Create a new task definition with the canary tag
    const taskDefFamily = `${args.project || 'bcbs'}-task-${config.environment}`;
    
    // Get the latest task definition
    const describeTaskDefCmd = `ecs describe-task-definition --task-definition ${taskDefFamily}`;
    const taskDefResult = awsCommand(describeTaskDefCmd);
    
    // Create a copy of the task definition for the canary
    const taskDef = taskDefResult.taskDefinition;
    
    // Update the container image in the task definition
    const containerDef = taskDef.containerDefinitions[0];
    const imageParts = containerDef.image.split(':');
    const newImage = `${imageParts[0]}:${config.imageTag}`;
    
    containerDef.image = newImage;
    
    // Add canary identifier to environment variables
    containerDef.environment.push({
      name: 'DEPLOYMENT_TYPE',
      value: 'canary'
    });
    
    containerDef.environment.push({
      name: 'DEPLOYMENT_ID',
      value: config.deploymentId
    });
    
    // Create a new target group for the canary
    const vpcId = awsCommand(`ec2 describe-vpcs --filters "Name=tag:Name,Values=${args.project || 'bcbs'}-vpc-${config.environment}"`).Vpcs[0].VpcId;
    
    const createTargetGroupCmd = `elbv2 create-target-group --name ${args.project || 'bcbs'}-canary-${config.deploymentId.slice(0, 8)} --protocol HTTP --port 5000 --vpc-id ${vpcId} --target-type ip --health-check-path /api/health --health-check-interval-seconds 30`;
    
    const targetGroupResult = awsCommand(createTargetGroupCmd);
    config.canaryTargetGroup = targetGroupResult.TargetGroups[0].TargetGroupArn;
    
    // Get the current production target group
    const listTargetGroupsCmd = `elbv2 describe-target-groups --names ${args.project || 'bcbs'}-tg-blue-${config.environment} ${args.project || 'bcbs'}-tg-green-${config.environment}`;
    const targetGroups = awsCommand(listTargetGroupsCmd).TargetGroups;
    
    // Get the load balancer listener
    const listenerCmd = `elbv2 describe-listeners --load-balancer-arn ${targetGroups[0].LoadBalancerArns[0]}`;
    const listeners = awsCommand(listenerCmd).Listeners;
    
    // Find the HTTPS listener
    const httpsListener = listeners.find(l => l.Port === 443);
    config.listenerArn = httpsListener.ListenerArn;
    
    // Determine which target group is active based on the default action
    const activeTargetGroupArn = httpsListener.DefaultActions[0].TargetGroupArn;
    config.targetGroup = activeTargetGroupArn;
    
    // Register a new ECS service for the canary
    const registerTaskDefCmd = `ecs register-task-definition --family ${taskDefFamily}-canary --container-definitions '${JSON.stringify(taskDef.containerDefinitions)}' --cpu ${taskDef.cpu} --memory ${taskDef.memory} --requires-compatibilities ${JSON.stringify(taskDef.requiresCompatibilities)} --network-mode ${taskDef.networkMode} --execution-role-arn ${taskDef.executionRoleArn} --task-role-arn ${taskDef.taskRoleArn}`;
    
    const newTaskDef = awsCommand(registerTaskDefCmd);
    
    // Create a new service for the canary
    const createServiceCmd = `ecs create-service --cluster ${config.clusterName} --service-name ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)} --task-definition ${newTaskDef.taskDefinition.taskDefinitionArn} --desired-count 1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[${taskDef.networkConfiguration?.awsvpcConfiguration?.subnets.join(',')}],securityGroups=[${taskDef.networkConfiguration?.awsvpcConfiguration?.securityGroups.join(',')}],assignPublicIp=DISABLED}" --load-balancers "containerName=${containerDef.name},containerPort=${containerDef.portMappings[0].containerPort},targetGroupArn=${config.canaryTargetGroup}"`;
    
    awsCommand(createServiceCmd);
    
    console.log('Canary service created successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize canary deployment:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'initialization',
      error: error.message
    });
    
    deploymentState.status = 'failed';
    return false;
  }
}

/**
 * Wait for the canary service to be stable
 */
async function waitForCanaryStability() {
  console.log('Waiting for canary service to be stable...');
  deploymentState.status = 'waiting-for-stability';
  
  try {
    // Wait for ECS service to be stable
    const serviceWaitCmd = `ecs wait services-stable --cluster ${config.clusterName} --services ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)}`;
    
    execSync(`aws ${serviceWaitCmd} --region ${config.region}`, { stdio: 'inherit' });
    
    console.log('Canary service is stable');
    
    // Wait for target group to be healthy
    let healthy = false;
    let attempts = 0;
    
    while (!healthy && attempts < 10) {
      const targetHealthCmd = `elbv2 describe-target-health --target-group-arn ${config.canaryTargetGroup}`;
      const healthResult = awsCommand(targetHealthCmd);
      
      const allHealthy = healthResult.TargetHealthDescriptions.every(
        target => target.TargetHealth.State === 'healthy'
      );
      
      if (allHealthy && healthResult.TargetHealthDescriptions.length > 0) {
        healthy = true;
        console.log('Canary target group is healthy');
      } else {
        console.log(`Waiting for target group health... (${attempts + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 15000));
        attempts++;
      }
    }
    
    if (!healthy) {
      throw new Error('Canary target group did not become healthy after multiple attempts');
    }
    
    return true;
  } catch (error) {
    console.error('Failed while waiting for canary stability:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'stability-check',
      error: error.message
    });
    
    return false;
  }
}

/**
 * Update traffic weights for the canary deployment
 * @param {number} productionWeight Percentage for production (0-100)
 * @param {number} canaryWeight Percentage for canary (0-100)
 */
async function updateCanaryTraffic(productionWeight, canaryWeight) {
  console.log(`Updating traffic weights: production=${productionWeight}%, canary=${canaryWeight}%`);
  
  try {
    // Prepare the forward action with weighted target groups
    const forwardAction = {
      Type: 'forward',
      ForwardConfig: {
        TargetGroups: [
          {
            TargetGroupArn: config.targetGroup,
            Weight: productionWeight
          },
          {
            TargetGroupArn: config.canaryTargetGroup,
            Weight: canaryWeight
          }
        ]
      }
    };
    
    // Update the listener
    const modifyListenerCmd = `elbv2 modify-listener --listener-arn ${config.listenerArn} --default-actions '${JSON.stringify(forwardAction)}'`;
    awsCommand(modifyListenerCmd);
    
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
 * Collect metrics for the canary deployment
 */
async function collectCanaryMetrics() {
  console.log('Collecting metrics for canary deployment...');
  
  try {
    // Get CloudWatch metrics for both target groups
    const metricQueries = [
      {
        id: 'production_errors',
        metricStat: {
          metric: {
            namespace: 'AWS/ApplicationELB',
            metricName: 'HTTPCode_Target_5XX_Count',
            dimensions: [
              { name: 'TargetGroup', value: config.targetGroup.split('/').pop() },
              { name: 'LoadBalancer', value: config.targetGroup.split(':')[5].split('/')[1] }
            ]
          },
          period: 60,
          stat: 'Sum'
        }
      },
      {
        id: 'canary_errors',
        metricStat: {
          metric: {
            namespace: 'AWS/ApplicationELB',
            metricName: 'HTTPCode_Target_5XX_Count',
            dimensions: [
              { name: 'TargetGroup', value: config.canaryTargetGroup.split('/').pop() },
              { name: 'LoadBalancer', value: config.canaryTargetGroup.split(':')[5].split('/')[1] }
            ]
          },
          period: 60,
          stat: 'Sum'
        }
      },
      {
        id: 'production_latency',
        metricStat: {
          metric: {
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            dimensions: [
              { name: 'TargetGroup', value: config.targetGroup.split('/').pop() },
              { name: 'LoadBalancer', value: config.targetGroup.split(':')[5].split('/')[1] }
            ]
          },
          period: 60,
          stat: 'p95'
        }
      },
      {
        id: 'canary_latency',
        metricStat: {
          metric: {
            namespace: 'AWS/ApplicationELB',
            metricName: 'TargetResponseTime',
            dimensions: [
              { name: 'TargetGroup', value: config.canaryTargetGroup.split('/').pop() },
              { name: 'LoadBalancer', value: config.canaryTargetGroup.split(':')[5].split('/')[1] }
            ]
          },
          period: 60,
          stat: 'p95'
        }
      }
    ];
    
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 5);
    
    const endTime = new Date();
    
    const getMetricsCmd = `cloudwatch get-metric-data --metric-data-queries '${JSON.stringify(metricQueries)}' --start-time ${startTime.toISOString()} --end-time ${endTime.toISOString()}`;
    
    const metricResults = awsCommand(getMetricsCmd);
    
    // Process metric results
    const productionErrors = metricResults.MetricDataResults.find(r => r.Id === 'production_errors');
    const canaryErrors = metricResults.MetricDataResults.find(r => r.Id === 'canary_errors');
    const productionLatency = metricResults.MetricDataResults.find(r => r.Id === 'production_latency');
    const canaryLatency = metricResults.MetricDataResults.find(r => r.Id === 'canary_latency');
    
    // Calculate error rates
    const productionErrorSum = productionErrors.Values.reduce((sum, val) => sum + val, 0);
    const canaryErrorSum = canaryErrors.Values.reduce((sum, val) => sum + val, 0);
    
    // Get the latest latency values
    const latestProductionLatency = productionLatency.Values.length > 0 ? 
      productionLatency.Values[productionLatency.Values.length - 1] : 0;
    
    const latestCanaryLatency = canaryLatency.Values.length > 0 ? 
      canaryLatency.Values[canaryLatency.Values.length - 1] : 0;
    
    // Store metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      production: {
        errors: productionErrorSum,
        latency: latestProductionLatency
      },
      canary: {
        errors: canaryErrorSum,
        latency: latestCanaryLatency
      }
    };
    
    // Add to deployment state
    deploymentState.metrics[new Date().toISOString()] = metrics;
    
    console.log('Metrics collected:');
    console.log(JSON.stringify(metrics, null, 2));
    
    return metrics;
  } catch (error) {
    console.error('Failed to collect metrics:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'metrics-collection',
      error: error.message
    });
    
    return null;
  }
}

/**
 * Check if the canary deployment is healthy based on metrics
 * @param {Object} metrics Metrics collected from CloudWatch
 * @returns {boolean} Whether the canary is healthy
 */
function isCanaryHealthy(metrics) {
  if (!metrics) return false;
  
  console.log('Evaluating canary health...');
  
  // Check error rate
  if (metrics.canary.errors > config.errorThreshold) {
    console.error(`Canary error rate (${metrics.canary.errors}) exceeds threshold (${config.errorThreshold})`);
    return false;
  }
  
  // Check latency
  if (metrics.canary.latency > config.latencyThreshold) {
    console.error(`Canary latency (${metrics.canary.latency}ms) exceeds threshold (${config.latencyThreshold}ms)`);
    return false;
  }
  
  // Compare with production
  if (metrics.canary.errors > metrics.production.errors * 2) {
    console.error(`Canary error rate (${metrics.canary.errors}) is more than twice the production error rate (${metrics.production.errors})`);
    return false;
  }
  
  if (metrics.canary.latency > metrics.production.latency * 1.5) {
    console.error(`Canary latency (${metrics.canary.latency}ms) is more than 50% higher than production latency (${metrics.production.latency}ms)`);
    return false;
  }
  
  console.log('Canary deployment is healthy');
  return true;
}

/**
 * Perform the canary deployment process
 */
async function performCanaryDeployment() {
  console.log('Starting canary deployment process...');
  deploymentState.status = 'in-progress';
  
  try {
    // Start with initial percentage
    let currentPercentage = config.initialPercent;
    
    // Update deployment state
    deploymentState.currentPercentage = currentPercentage;
    deploymentState.steps.push({
      time: Date.now(),
      percentage: currentPercentage,
      status: 'started'
    });
    
    // Initial traffic shift
    const initialShiftSuccess = await updateCanaryTraffic(100 - currentPercentage, currentPercentage);
    if (!initialShiftSuccess) {
      throw new Error('Failed to perform initial traffic shift');
    }
    
    // Wait for the initial interval to collect metrics
    console.log(`Waiting for ${config.intervalMinutes} minutes to collect initial metrics...`);
    await new Promise(resolve => setTimeout(resolve, config.intervalMinutes * 60 * 1000));
    
    // Collect and check metrics
    const initialMetrics = await collectCanaryMetrics();
    const initialHealthy = isCanaryHealthy(initialMetrics);
    
    if (!initialHealthy) {
      throw new Error('Canary is not healthy after initial deployment');
    }
    
    // Update step status
    deploymentState.steps[deploymentState.steps.length - 1].status = 'completed';
    deploymentState.steps[deploymentState.steps.length - 1].metrics = initialMetrics;
    
    // Gradually increase traffic
    while (currentPercentage < 100) {
      // Calculate next percentage
      const nextPercentage = Math.min(currentPercentage + config.increment, 100);
      console.log(`Increasing canary traffic from ${currentPercentage}% to ${nextPercentage}%...`);
      
      // Record step
      deploymentState.steps.push({
        time: Date.now(),
        percentage: nextPercentage,
        status: 'started'
      });
      
      // Update traffic
      const shiftSuccess = await updateCanaryTraffic(100 - nextPercentage, nextPercentage);
      if (!shiftSuccess) {
        throw new Error(`Failed to update traffic to ${nextPercentage}%`);
      }
      
      // Update current percentage
      currentPercentage = nextPercentage;
      deploymentState.currentPercentage = currentPercentage;
      
      // Wait for the interval to collect metrics
      console.log(`Waiting for ${config.intervalMinutes} minutes to collect metrics...`);
      await new Promise(resolve => setTimeout(resolve, config.intervalMinutes * 60 * 1000));
      
      // Collect and check metrics
      const metrics = await collectCanaryMetrics();
      const healthy = isCanaryHealthy(metrics);
      
      // Update step status
      deploymentState.steps[deploymentState.steps.length - 1].status = healthy ? 'completed' : 'failed';
      deploymentState.steps[deploymentState.steps.length - 1].metrics = metrics;
      
      if (!healthy) {
        throw new Error(`Canary is not healthy at ${currentPercentage}% traffic`);
      }
      
      // If we've reached 100%, we're done
      if (currentPercentage === 100) {
        // Finalize deployment
        await finalizeCanaryDeployment();
        break;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Canary deployment failed:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'deployment',
      error: error.message
    });
    
    // Rollback
    await rollbackCanaryDeployment('Deployment failure: ' + error.message);
    return false;
  }
}

/**
 * Finalize the canary deployment
 */
async function finalizeCanaryDeployment() {
  console.log('Finalizing canary deployment...');
  deploymentState.status = 'finalizing';
  
  try {
    // Promote canary to production
    
    // 1. Update the service that the active target group is using to use the new task definition
    const describeServicesCmd = `ecs describe-services --cluster ${config.clusterName} --services ${args.project || 'bcbs'}-service-blue-${config.environment} ${args.project || 'bcbs'}-service-green-${config.environment}`;
    const servicesResult = awsCommand(describeServicesCmd);
    
    // Find the service that corresponds to the active target group
    const activeService = servicesResult.services.find(s => {
      if (s.loadBalancers && s.loadBalancers.length > 0) {
        return s.loadBalancers[0].targetGroupArn === config.targetGroup;
      }
      return false;
    });
    
    if (!activeService) {
      throw new Error('Could not find active service');
    }
    
    // Get the task definition from the canary service
    const describeCanaryServiceCmd = `ecs describe-services --cluster ${config.clusterName} --services ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)}`;
    const canaryServiceResult = awsCommand(describeCanaryServiceCmd);
    
    if (!canaryServiceResult.services || canaryServiceResult.services.length === 0) {
      throw new Error('Could not find canary service');
    }
    
    const canaryTaskDef = canaryServiceResult.services[0].taskDefinition;
    
    // Update the active service with the canary task definition
    const updateServiceCmd = `ecs update-service --cluster ${config.clusterName} --service ${activeService.serviceName} --task-definition ${canaryTaskDef} --force-new-deployment`;
    awsCommand(updateServiceCmd);
    
    // Wait for the service to be stable
    const serviceWaitCmd = `ecs wait services-stable --cluster ${config.clusterName} --services ${activeService.serviceName}`;
    execSync(`aws ${serviceWaitCmd} --region ${config.region}`, { stdio: 'inherit' });
    
    // 2. Clean up the canary service
    const deleteCanaryServiceCmd = `ecs update-service --cluster ${config.clusterName} --service ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)} --desired-count 0`;
    awsCommand(deleteCanaryServiceCmd);
    
    // 3. Restore traffic to 100% to the active target group
    await updateCanaryTraffic(100, 0);
    
    // 4. Delete the canary target group
    const deregisterTargetsCmd = `elbv2 deregister-targets --target-group-arn ${config.canaryTargetGroup} --targets Id=$(aws elbv2 describe-target-health --target-group-arn ${config.canaryTargetGroup} --query 'TargetHealthDescriptions[0].Target.Id' --output text)`;
    awsCommand(deregisterTargetsCmd);
    
    // Wait a few seconds for deregistration
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const deleteCanaryServiceFinalCmd = `ecs delete-service --cluster ${config.clusterName} --service ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)} --force`;
    awsCommand(deleteCanaryServiceFinalCmd);
    
    const deleteTargetGroupCmd = `elbv2 delete-target-group --target-group-arn ${config.canaryTargetGroup}`;
    awsCommand(deleteTargetGroupCmd);
    
    // 5. Update deployment state
    deploymentState.status = 'completed';
    deploymentState.endTime = Date.now();
    
    console.log('Canary deployment finalized successfully');
    
    // Save deployment report
    saveDeploymentReport();
    return true;
  } catch (error) {
    console.error('Failed to finalize canary deployment:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'finalization',
      error: error.message
    });
    
    // Try to clean up even if finalization fails
    try {
      await rollbackCanaryDeployment('Finalization failure');
    } catch (rollbackError) {
      console.error('Failed to roll back after finalization failure:', rollbackError);
    }
    
    return false;
  }
}

/**
 * Roll back a canary deployment
 * @param {string} reason Reason for rollback
 */
async function rollbackCanaryDeployment(reason) {
  console.log(`Rolling back canary deployment: ${reason}`);
  deploymentState.status = 'rolling-back';
  
  try {
    // 1. Redirect all traffic back to the production target group
    await updateCanaryTraffic(100, 0);
    
    // 2. Clean up the canary service
    const deleteCanaryServiceCmd = `ecs update-service --cluster ${config.clusterName} --service ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)} --desired-count 0`;
    awsCommand(deleteCanaryServiceCmd);
    
    // 3. Delete the canary service and target group
    try {
      // Deregister targets first
      const deregisterTargetsCmd = `elbv2 deregister-targets --target-group-arn ${config.canaryTargetGroup} --targets Id=$(aws elbv2 describe-target-health --target-group-arn ${config.canaryTargetGroup} --query 'TargetHealthDescriptions[0].Target.Id' --output text)`;
      awsCommand(deregisterTargetsCmd);
      
      // Wait a few seconds for deregistration
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const deleteCanaryServiceFinalCmd = `ecs delete-service --cluster ${config.clusterName} --service ${args.project || 'bcbs'}-service-canary-${config.deploymentId.slice(0, 8)} --force`;
      awsCommand(deleteCanaryServiceFinalCmd);
      
      const deleteTargetGroupCmd = `elbv2 delete-target-group --target-group-arn ${config.canaryTargetGroup}`;
      awsCommand(deleteTargetGroupCmd);
    } catch (error) {
      console.error('Error during cleanup (continuing rollback):', error);
    }
    
    // 4. Update deployment state
    deploymentState.status = 'rolled-back';
    deploymentState.endTime = Date.now();
    
    console.log('Canary deployment rolled back successfully');
    
    // Save deployment report
    saveDeploymentReport();
    return true;
  } catch (error) {
    console.error('Failed to roll back canary deployment:', error);
    deploymentState.errors.push({
      time: Date.now(),
      phase: 'rollback',
      error: error.message
    });
    
    deploymentState.status = 'rollback-failed';
    deploymentState.endTime = Date.now();
    
    // Save deployment report even if rollback fails
    saveDeploymentReport();
    return false;
  }
}

/**
 * Abort an in-progress canary deployment
 */
async function abortCanaryDeployment() {
  console.log('Aborting canary deployment...');
  
  try {
    // Find the canary service
    const listServicesCmd = `ecs list-services --cluster ${config.clusterName}`;
    const services = awsCommand(listServicesCmd).serviceArns;
    
    const canaryServices = services.filter(s => s.includes('canary'));
    
    if (canaryServices.length === 0) {
      console.log('No active canary deployments found');
      return true;
    }
    
    // For each canary service, roll back
    for (const canaryService of canaryServices) {
      const serviceName = canaryService.split('/').pop();
      console.log(`Found canary service: ${serviceName}`);
      
      // Get the target group for this canary
      const describeServiceCmd = `ecs describe-services --cluster ${config.clusterName} --services ${serviceName}`;
      const serviceDetails = awsCommand(describeServiceCmd).services[0];
      
      if (serviceDetails.loadBalancers && serviceDetails.loadBalancers.length > 0) {
        config.canaryTargetGroup = serviceDetails.loadBalancers[0].targetGroupArn;
        
        // Extract deployment ID from the service name
        const deploymentIdMatch = serviceName.match(/canary-([a-zA-Z0-9-]+)/);
        if (deploymentIdMatch) {
          config.deploymentId = deploymentIdMatch[1];
        } else {
          config.deploymentId = `unknown-${Date.now()}`;
        }
        
        // Find the main listener
        const targetGroupDetails = awsCommand(`elbv2 describe-target-groups --target-group-arns ${config.canaryTargetGroup}`).TargetGroups[0];
        const lbArn = targetGroupDetails.LoadBalancerArns[0];
        
        const listeners = awsCommand(`elbv2 describe-listeners --load-balancer-arn ${lbArn}`).Listeners;
        const mainListener = listeners.find(l => l.Port === 443);
        
        if (mainListener) {
          config.listenerArn = mainListener.ListenerArn;
          
          // Find the production target group
          if (mainListener.DefaultActions[0].ForwardConfig && 
              mainListener.DefaultActions[0].ForwardConfig.TargetGroups) {
            const targetGroups = mainListener.DefaultActions[0].ForwardConfig.TargetGroups;
            const prodTargetGroup = targetGroups.find(tg => tg.TargetGroupArn !== config.canaryTargetGroup);
            
            if (prodTargetGroup) {
              config.targetGroup = prodTargetGroup.TargetGroupArn;
              
              // Roll back the canary
              await rollbackCanaryDeployment('Manual abort requested');
            }
          }
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to abort canary deployment:', error);
    return false;
  }
}

/**
 * Save deployment report
 */
function saveDeploymentReport() {
  const deploymentReport = {
    ...deploymentState,
    config: {
      environment: config.environment,
      deploymentId: config.deploymentId,
      imageTag: config.imageTag,
      initialPercent: config.initialPercent,
      increment: config.increment,
      intervalMinutes: config.intervalMinutes,
      errorThreshold: config.errorThreshold,
      latencyThreshold: config.latencyThreshold
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
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <title>Canary Deployment Report - ${config.deploymentId}</title>
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
    .step-list { list-style-type: none; padding: 0; }
    .step-list li { margin-bottom: 10px; padding: 10px; border-radius: 4px; }
    .step-completed { background-color: #d4edda; }
    .step-failed { background-color: #f8d7da; }
    .step-started { background-color: #fff3cd; }
  </style>
</head>
<body>
  <h1>Canary Deployment Report</h1>
  
  <div class="card ${deploymentState.status === 'completed' ? 'success' : deploymentState.status === 'rolled-back' || deploymentState.status === 'failed' ? 'failure' : 'warning'}">
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
    <h2>Canary Configuration</h2>
    <p><strong>Initial Percentage:</strong> ${config.initialPercent}%</p>
    <p><strong>Increment:</strong> ${config.increment}%</p>
    <p><strong>Interval:</strong> ${config.intervalMinutes} minutes</p>
    <p><strong>Error Threshold:</strong> ${config.errorThreshold}</p>
    <p><strong>Latency Threshold:</strong> ${config.latencyThreshold}ms</p>
  </div>
  
  <div class="card">
    <h2>Deployment Steps</h2>
    <ul class="step-list">
      ${deploymentState.steps.map(step => `
      <li class="step-${step.status}">
        <p><strong>Time:</strong> ${new Date(step.time).toLocaleString()}</p>
        <p><strong>Percentage:</strong> ${step.percentage}%</p>
        <p><strong>Status:</strong> ${step.status}</p>
      </li>
      `).join('')}
    </ul>
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
}

/**
 * Main function
 */
async function main() {
  console.log(`Canary Deployment Script`);
  console.log(`=======================`);
  console.log(`Environment: ${config.environment}`);
  console.log(`Deployment ID: ${config.deploymentId}`);
  console.log(`Image Tag: ${config.imageTag}`);
  console.log(`Initial Percentage: ${config.initialPercent}%`);
  console.log(`Increment: ${config.increment}%`);
  console.log(`Interval: ${config.intervalMinutes} minutes`);
  console.log(`Error Threshold: ${config.errorThreshold}`);
  console.log(`Latency Threshold: ${config.latencyThreshold}ms`);
  console.log(`Abort Mode: ${config.abortDeployment}`);
  console.log(`=======================`);
  
  try {
    // Check if we're aborting an existing deployment
    if (config.abortDeployment) {
      await abortCanaryDeployment();
      return;
    }
    
    // Initialize the canary deployment
    const initSuccess = await initializeCanaryDeployment();
    if (!initSuccess) {
      console.error('Failed to initialize canary deployment');
      process.exit(1);
    }
    
    // Wait for the canary service to be stable
    const stabilitySuccess = await waitForCanaryStability();
    if (!stabilitySuccess) {
      console.error('Canary service failed to stabilize');
      await rollbackCanaryDeployment('Failed to stabilize');
      process.exit(1);
    }
    
    // Perform the canary deployment
    const deploymentSuccess = await performCanaryDeployment();
    
    if (deploymentSuccess) {
      console.log('Canary deployment completed successfully');
      process.exit(0);
    } else {
      console.error('Canary deployment failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    
    // Try to roll back if possible
    if (config.canaryTargetGroup) {
      await rollbackCanaryDeployment('Unhandled error: ' + error.message);
    }
    
    process.exit(1);
  }
}

// Run the main function
main();