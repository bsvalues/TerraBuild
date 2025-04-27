// AWS Lambda function for managing Canary deployments
const AWS = require('aws-sdk');

// Main handler function
exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Extract environment variables
  const albListenerArn = process.env.ALB_LISTENER_ARN;
  const listenerRuleArn = process.env.LISTENER_RULE_ARN;
  const currentTgArn = process.env.CURRENT_TG_ARN;
  const canaryTgArn = process.env.CANARY_TG_ARN;
  const ecsCluster = process.env.ECS_CLUSTER;
  const canaryService = process.env.CANARY_SERVICE;
  const environment = process.env.ENVIRONMENT || 'unknown';
  const project = process.env.PROJECT || 'bcbs';
  const snsTopic = process.env.SNS_TOPIC_ARN;
  
  // Setup AWS SDK clients
  const elbv2 = new AWS.ELBv2();
  const ecs = new AWS.ECS();
  const cloudwatch = new AWS.CloudWatch();
  const sns = new AWS.SNS();
  
  try {
    // Parse action parameters from the event
    let action = 'status';  // Default action
    let trafficPercentage = 0;
    let desiredCount = 0;
    let monitoringPeriod = 60; // seconds
    
    if (event.action) {
      action = event.action;
    }
    
    if (event.trafficPercentage !== undefined) {
      trafficPercentage = parseInt(event.trafficPercentage, 10);
      // Ensure value is within 0-100 range
      trafficPercentage = Math.min(Math.max(trafficPercentage, 0), 100);
    }
    
    if (event.desiredCount !== undefined) {
      desiredCount = parseInt(event.desiredCount, 10);
      desiredCount = Math.max(desiredCount, 0);
    }
    
    if (event.monitoringPeriod !== undefined) {
      monitoringPeriod = parseInt(event.monitoringPeriod, 10);
      monitoringPeriod = Math.max(monitoringPeriod, 30);
    }
    
    console.log(`Canary deployment management for ${project} in ${environment} environment`);
    console.log(`Action: ${action}`);
    
    // Handle different actions
    switch (action) {
      case 'start':
        await startCanaryDeployment(desiredCount);
        break;
        
      case 'update':
        await updateTrafficDistribution(trafficPercentage);
        await checkHealthMetrics(monitoringPeriod, trafficPercentage);
        break;
        
      case 'complete':
        await completeCanaryDeployment();
        break;
        
      case 'rollback':
        await rollbackCanaryDeployment();
        break;
        
      case 'status':
      default:
        return await getCanaryStatus();
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Canary deployment action '${action}' completed successfully`,
        environment: environment,
        project: project,
        timestamp: new Date().toISOString(),
        details: {
          trafficPercentage: trafficPercentage,
          desiredCount: desiredCount,
          monitoringPeriod: monitoringPeriod
        }
      })
    };
    
  } catch (error) {
    console.error('Error during canary deployment:', error);
    
    // Notify about the failure via SNS if topic ARN is provided
    if (snsTopic) {
      try {
        await sns.publish({
          TopicArn: snsTopic,
          Subject: `Canary Deployment Failure - ${project} ${environment}`,
          Message: JSON.stringify({
            message: 'Canary deployment action failed',
            error: error.message,
            environment: environment,
            project: project,
            timestamp: new Date().toISOString()
          })
        }).promise();
      } catch (snsError) {
        console.error('Failed to send SNS notification:', snsError);
      }
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Canary deployment action failed',
        error: error.message,
        environment: environment,
        project: project,
        timestamp: new Date().toISOString()
      })
    };
  }
  
  // Function to start canary deployment
  async function startCanaryDeployment(desiredCount) {
    console.log(`Starting canary deployment with desired count: ${desiredCount}`);
    
    // Update the canary service to start task
    await ecs.updateService({
      cluster: ecsCluster,
      service: canaryService,
      desiredCount: desiredCount
    }).promise();
    
    // Set initial traffic distribution to 0%
    await updateTrafficDistribution(0);
    
    console.log('Canary deployment started');
  }
  
  // Function to update traffic distribution
  async function updateTrafficDistribution(percentage) {
    console.log(`Updating traffic distribution: ${percentage}% to canary`);
    
    // Get the current listener rule
    const ruleResponse = await elbv2.describeRules({
      RuleArns: [listenerRuleArn]
    }).promise();
    
    if (!ruleResponse.Rules || ruleResponse.Rules.length === 0) {
      throw new Error(`Rule not found: ${listenerRuleArn}`);
    }
    
    const rule = ruleResponse.Rules[0];
    
    // Update the rule with new traffic distribution
    const forwardAction = {
      Type: 'forward',
      ForwardConfig: {
        TargetGroups: [
          {
            TargetGroupArn: currentTgArn,
            Weight: 100 - percentage
          },
          {
            TargetGroupArn: canaryTgArn,
            Weight: percentage
          }
        ],
        TargetGroupStickinessConfig: {
          Enabled: true,
          DurationSeconds: 300 // 5 minutes stickiness
        }
      }
    };
    
    await elbv2.modifyRule({
      RuleArn: listenerRuleArn,
      Actions: [forwardAction],
      Conditions: rule.Conditions
    }).promise();
    
    console.log(`Traffic distribution updated: ${percentage}% to canary, ${100-percentage}% to current`);
  }
  
  // Function to check health metrics
  async function checkHealthMetrics(monitoringPeriod, currentPercentage) {
    console.log(`Checking health metrics for ${monitoringPeriod} seconds`);
    
    // Get metrics for error rates from CloudWatch
    const currentTime = new Date();
    const startTime = new Date(currentTime.getTime() - (monitoringPeriod * 1000));
    
    // Check error rate for canary
    const canaryErrorData = await cloudwatch.getMetricData({
      MetricDataQueries: [
        {
          Id: 'canaryErrors',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/ApplicationELB',
              MetricName: 'HTTPCode_Target_5XX_Count',
              Dimensions: [
                {
                  Name: 'TargetGroup',
                  Value: canaryTgArn.split('/')[1] // Extract TG name from ARN
                }
              ]
            },
            Period: monitoringPeriod,
            Stat: 'Sum'
          }
        }
      ],
      StartTime: startTime,
      EndTime: currentTime
    }).promise();
    
    // Check error rate for current version
    const currentErrorData = await cloudwatch.getMetricData({
      MetricDataQueries: [
        {
          Id: 'currentErrors',
          MetricStat: {
            Metric: {
              Namespace: 'AWS/ApplicationELB',
              MetricName: 'HTTPCode_Target_5XX_Count',
              Dimensions: [
                {
                  Name: 'TargetGroup',
                  Value: currentTgArn.split('/')[1] // Extract TG name from ARN
                }
              ]
            },
            Period: monitoringPeriod,
            Stat: 'Sum'
          }
        }
      ],
      StartTime: startTime,
      EndTime: currentTime
    }).promise();
    
    // Get values with safety checks
    const canaryErrors = canaryErrorData.MetricDataResults[0]?.Values[0] || 0;
    const currentErrors = currentErrorData.MetricDataResults[0]?.Values[0] || 0;
    
    console.log(`Canary errors: ${canaryErrors}`);
    console.log(`Current version errors: ${currentErrors}`);
    
    // Simple health check logic - more sophisticated logic could be implemented
    const errorThreshold = 5; // Maximum number of errors allowed
    
    // If canary has too many errors, consider it unhealthy
    if (canaryErrors > errorThreshold || (canaryErrors > 2 * currentErrors && canaryErrors > 0)) {
      console.log('Canary deployment is unhealthy - rolling back');
      await rollbackCanaryDeployment();
      throw new Error(`Canary deployment is unhealthy. Errors: ${canaryErrors}`);
    }
    
    console.log('Canary deployment is healthy');
  }
  
  // Function to complete canary deployment
  async function completeCanaryDeployment() {
    console.log('Completing canary deployment');
    
    // First update to 100% canary traffic
    await updateTrafficDistribution(100);
    
    // Wait for a short period to ensure all connections are to the canary
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the current listener
    const listenerResponse = await elbv2.describeListeners({
      ListenerArns: [albListenerArn]
    }).promise();
    
    if (!listenerResponse.Listeners || listenerResponse.Listeners.length === 0) {
      throw new Error(`Listener not found: ${albListenerArn}`);
    }
    
    // Update the main listener to point directly to the canary target group
    const mainAction = {
      Type: 'forward',
      TargetGroupArn: canaryTgArn
    };
    
    await elbv2.modifyListener({
      ListenerArn: albListenerArn,
      DefaultActions: [mainAction]
    }).promise();
    
    // Reset the rule to original state
    await updateTrafficDistribution(0);
    
    // Stop the canary service
    await ecs.updateService({
      cluster: ecsCluster,
      service: canaryService,
      desiredCount: 0
    }).promise();
    
    console.log('Canary deployment completed successfully');
  }
  
  // Function to rollback canary deployment
  async function rollbackCanaryDeployment() {
    console.log('Rolling back canary deployment');
    
    // Update rule to send all traffic to current version
    await updateTrafficDistribution(0);
    
    // Stop the canary service
    await ecs.updateService({
      cluster: ecsCluster,
      service: canaryService,
      desiredCount: 0
    }).promise();
    
    console.log('Canary deployment rolled back');
    
    // Send notification
    if (snsTopic) {
      await sns.publish({
        TopicArn: snsTopic,
        Subject: `Canary Deployment Rollback - ${project} ${environment}`,
        Message: JSON.stringify({
          message: 'Canary deployment was rolled back',
          environment: environment,
          project: project,
          timestamp: new Date().toISOString()
        })
      }).promise();
    }
  }
  
  // Function to get current canary status
  async function getCanaryStatus() {
    console.log('Retrieving canary deployment status');
    
    // Get service info
    const serviceResponse = await ecs.describeServices({
      cluster: ecsCluster,
      services: [canaryService]
    }).promise();
    
    // Get rule info
    const ruleResponse = await elbv2.describeRules({
      RuleArns: [listenerRuleArn]
    }).promise();
    
    // Extract information
    let canaryRunning = false;
    let trafficPercentage = 0;
    
    if (serviceResponse.services && serviceResponse.services.length > 0) {
      const service = serviceResponse.services[0];
      canaryRunning = service.runningCount > 0;
    }
    
    if (ruleResponse.Rules && ruleResponse.Rules.length > 0) {
      const rule = ruleResponse.Rules[0];
      if (rule.Actions && rule.Actions.length > 0) {
        const action = rule.Actions[0];
        if (action.ForwardConfig && action.ForwardConfig.TargetGroups) {
          const canaryTargetGroup = action.ForwardConfig.TargetGroups.find(
            tg => tg.TargetGroupArn === canaryTgArn
          );
          if (canaryTargetGroup) {
            trafficPercentage = canaryTargetGroup.Weight;
          }
        }
      }
    }
    
    const status = {
      statusCode: 200,
      body: JSON.stringify({
        status: canaryRunning ? 'running' : 'stopped',
        canaryRunning: canaryRunning,
        trafficPercentage: trafficPercentage,
        environment: environment,
        project: project,
        timestamp: new Date().toISOString()
      })
    };
    
    console.log('Canary status:', status.body);
    return status;
  }
};