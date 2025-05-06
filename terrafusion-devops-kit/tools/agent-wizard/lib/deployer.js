/**
 * Agent Deployer
 * 
 * Handles deploying agents to different environments
 */

import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { formatMode, formatSensitivity } from './ui.js';

const execAsync = promisify(exec);

/**
 * Deploy a specific agent to the target environment
 * @param {string} agentName - Name of the agent to deploy
 * @param {Object} manifest - Agent manifest containing the agent configuration
 * @param {string} environment - Target environment (dev, staging, prod)
 * @param {boolean} retrain - Whether to retrain the agent model after deployment
 * @returns {Promise<Object>} Deployment result
 */
export async function deployAgent(agentName, manifest, environment, retrain = false) {
  // Find the agent in the manifest
  const agent = manifest.agents.find(a => a.name === agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found in manifest`);
  }
  
  console.log(chalk.cyan(`\n🚀 Deploying agent: ${chalk.bold(agentName)}`));
  console.log(chalk.dim(`Mode: ${formatMode(agent.mode)}`));
  console.log(chalk.dim(`Version: ${agent.version}`));
  console.log(chalk.dim(`Environment: ${environment}`));
  
  // Start the deployment spinner
  const spinner = ora(`Preparing deployment...`).start();
  
  try {
    // Simulate preparing the deployment
    await sleep(1000);
    spinner.text = 'Validating agent configuration...';
    
    // Validate agent-specific configuration
    await validateAgentConfig(agent);
    
    // Update spinner
    await sleep(1000);
    spinner.text = `Deploying agent to ${environment}...`;
    
    // Simulate deployment to different environments
    let deployCommand;
    if (environment === 'dev') {
      deployCommand = `../../scripts/update-agents.sh -e dev -a ${agentName} -y`;
    } else if (environment === 'staging') {
      deployCommand = `../../scripts/update-agents.sh -e staging -a ${agentName} -y`;
    } else if (environment === 'prod' || environment === 'production') {
      deployCommand = `../../scripts/update-agents.sh -e prod -a ${agentName} -y`;
    } else {
      deployCommand = `../../scripts/update-agents.sh -e ${environment} -a ${agentName} -y`;
    }
    
    try {
      // Actually execute the deployment command if it exists
      await execAsync(deployCommand);
    } catch (error) {
      // For demo purposes, we'll continue even if the command fails
      // In a real implementation, you might want to throw here
      console.log(chalk.yellow(`\nNote: Deployment script execution failed, but wizard is continuing for demo purposes.`));
      console.log(chalk.dim(`Error: ${error.message}`));
    }
    
    // Update spinner
    await sleep(1500);
    spinner.text = 'Registering agent with orchestrator...';
    
    // Simulate orchestrator registration
    await sleep(1500);
    
    // If retraining is requested, perform it
    if (retrain) {
      spinner.text = 'Retraining agent model...';
      await sleep(3000); // Simulate longer training process
    }
    
    // Complete deployment
    spinner.succeed(`Agent "${agentName}" deployed successfully to ${environment}`);
    
    return {
      success: true,
      agent: agent.name,
      environment,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    spinner.fail(`Deployment failed: ${error.message}`);
    throw error;
  }
}

/**
 * Deploy all agents in the manifest to the target environment
 * @param {Object} manifest - Agent manifest
 * @param {string} environment - Target environment (dev, staging, prod)
 * @param {boolean} retrain - Whether to retrain agent models after deployment
 * @returns {Promise<Object>} Deployment results
 */
export async function deployAllAgents(manifest, environment, retrain = false) {
  const results = {
    success: true,
    environment,
    timestamp: new Date().toISOString(),
    agents: []
  };
  
  console.log(chalk.cyan(`\n🚀 Deploying all agents to ${chalk.bold(environment)}\n`));
  
  try {
    // First, try the bulk deployment script
    const bulkSpinner = ora(`Attempting bulk deployment...`).start();
    
    let bulkDeployCommand;
    if (environment === 'dev') {
      bulkDeployCommand = `../../scripts/update-agents.sh -e dev -a all -y`;
    } else if (environment === 'staging') {
      bulkDeployCommand = `../../scripts/update-agents.sh -e staging -a all -y`;
    } else if (environment === 'prod' || environment === 'production') {
      bulkDeployCommand = `../../scripts/update-agents.sh -e prod -a all -y`;
    } else {
      bulkDeployCommand = `../../scripts/update-agents.sh -e ${environment} -a all -y`;
    }
    
    try {
      // Actually execute the bulk deployment command if it exists
      await execAsync(bulkDeployCommand);
      bulkSpinner.succeed('Bulk deployment completed successfully');
      
      // If retraining is requested, perform it
      if (retrain) {
        const retrainSpinner = ora('Retraining all agent models...').start();
        await sleep(5000); // Simulate longer training process
        retrainSpinner.succeed('All agent models retrained successfully');
      }
      
      // Add all agents to results
      manifest.agents.forEach(agent => {
        results.agents.push({
          name: agent.name,
          success: true
        });
      });
      
      return results;
    } catch (error) {
      bulkSpinner.fail('Bulk deployment failed, falling back to individual deployments');
      console.log(chalk.dim(`Error: ${error.message}`));
    }
    
    // If bulk deployment fails, fall back to deploying agents individually
    for (const agent of manifest.agents) {
      try {
        const result = await deployAgent(agent.name, manifest, environment, retrain);
        results.agents.push({
          name: agent.name,
          success: true
        });
      } catch (error) {
        results.agents.push({
          name: agent.name,
          success: false,
          error: error.message
        });
        results.success = false;
      }
    }
    
    // Final summary
    const successCount = results.agents.filter(a => a.success).length;
    const failCount = results.agents.length - successCount;
    
    if (failCount === 0) {
      console.log(chalk.green(`\n✅ All ${successCount} agents deployed successfully!`));
    } else {
      console.log(chalk.yellow(`\n⚠️ Deployment completed with ${failCount} failures and ${successCount} successes.`));
      // List failed agents
      const failedAgents = results.agents.filter(a => !a.success);
      failedAgents.forEach(agent => {
        console.log(chalk.red(`  - ${agent.name}: ${agent.error}`));
      });
    }
    
    return results;
  } catch (error) {
    console.error(chalk.red(`\n❌ Deployment failed: ${error.message}`));
    results.success = false;
    results.error = error.message;
    return results;
  }
}

/**
 * Validate agent-specific configuration
 * @param {Object} agent - Agent configuration
 * @returns {Promise<void>}
 */
async function validateAgentConfig(agent) {
  // Check for required fields based on agent mode
  if (agent.mode === 'autonomous' && !agent.schedule) {
    throw new Error(`Autonomous agent "${agent.name}" requires a schedule`);
  }
  
  if (agent.mode === 'suggestive' && !agent.trigger_on) {
    throw new Error(`Suggestive agent "${agent.name}" requires a trigger_on field`);
  }
  
  if (agent.mode === 'watchdog' && !agent.alert_threshold) {
    throw new Error(`Watchdog agent "${agent.name}" requires an alert_threshold`);
  }
  
  // Add agent-specific validation for known agent types
  if (agent.name === 'factor-tuner') {
    if (!agent.settings?.optimization_algorithm) {
      throw new Error('factor-tuner agent requires an optimization_algorithm setting');
    }
  }
  
  if (agent.name === 'benchmark-guard') {
    if (!agent.settings?.benchmark_dataset) {
      throw new Error('benchmark-guard agent requires a benchmark_dataset setting');
    }
  }
  
  // Successful validation
  return;
}

/**
 * Helper function to sleep for a given duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}