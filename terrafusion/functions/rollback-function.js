// AWS Lambda function for automatic rollback in Blue-Green deployments
const AWS = require('aws-sdk');

// Main handler function
exports.handler = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Extract environment variables
  const albListenerArn = process.env.ALB_LISTENER_ARN;
  const blueTgArn = process.env.BLUE_TG_ARN;
  const greenTgArn = process.env.GREEN_TG_ARN;
  const environment = process.env.ENVIRONMENT || 'unknown';
  const project = process.env.PROJECT || 'bcbs';
  
  // Setup AWS SDK clients
  const elbv2 = new AWS.ELBv2();
  
  try {
    // Determine if the rollback event is from CloudWatch Alarm
    let isAlarmEvent = false;
    let alarmName = '';
    let alarmReason = '';
    
    if (event.Records && event.Records[0] && event.Records[0].Sns) {
      const snsMessage = JSON.parse(event.Records[0].Sns.Message);
      if (snsMessage.AlarmName) {
        isAlarmEvent = true;
        alarmName = snsMessage.AlarmName;
        alarmReason = snsMessage.NewStateReason || 'Unknown reason';
      }
    }
    
    console.log(`Initiating rollback for ${project} in ${environment} environment`);
    if (isAlarmEvent) {
      console.log(`Triggered by alarm: ${alarmName}`);
      console.log(`Reason: ${alarmReason}`);
    }
    
    // Get current listener configuration
    console.log(`Retrieving current configuration from listener: ${albListenerArn}`);
    const listenerResponse = await elbv2.describeListeners({
      ListenerArns: [albListenerArn]
    }).promise();
    
    if (!listenerResponse.Listeners || listenerResponse.Listeners.length === 0) {
      throw new Error(`Listener not found: ${albListenerArn}`);
    }
    
    const listener = listenerResponse.Listeners[0];
    if (!listener.DefaultActions || listener.DefaultActions.length === 0) {
      throw new Error('No default actions found in the listener');
    }
    
    const currentAction = listener.DefaultActions[0];
    if (currentAction.Type !== 'forward' || !currentAction.TargetGroupArn) {
      throw new Error('Listener is not configured for forward action or missing target group');
    }
    
    // Determine current and rollback target groups
    const currentTargetGroupArn = currentAction.TargetGroupArn;
    const rollbackTargetGroupArn = currentTargetGroupArn === blueTgArn ? greenTgArn : blueTgArn;
    const currentColor = currentTargetGroupArn === blueTgArn ? 'blue' : 'green';
    const rollbackColor = currentColor === 'blue' ? 'green' : 'blue';
    
    console.log(`Current active environment: ${currentColor}`);
    console.log(`Rolling back to: ${rollbackColor}`);
    
    // Prepare the rollback action
    const rollbackAction = {
      Type: 'forward',
      TargetGroupArn: rollbackTargetGroupArn,
    };
    
    // Update the listener to point to the rollback target group
    console.log(`Updating listener to route traffic to ${rollbackColor} environment`);
    await elbv2.modifyListener({
      ListenerArn: albListenerArn,
      DefaultActions: [rollbackAction]
    }).promise();
    
    console.log('Rollback completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Rollback completed successfully',
        from: currentColor,
        to: rollbackColor,
        environment: environment,
        project: project,
        timestamp: new Date().toISOString(),
        triggeredBy: isAlarmEvent ? `Alarm: ${alarmName}` : 'Manual invocation'
      })
    };
    
  } catch (error) {
    console.error('Error during rollback:', error);
    
    // Send SNS notification or log to CloudWatch
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Rollback failed',
        error: error.message,
        environment: environment,
        project: project,
        timestamp: new Date().toISOString()
      })
    };
  }
};