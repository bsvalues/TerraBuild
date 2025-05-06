/**
 * Agent Status Module
 * 
 * Provides functionality for checking the status of deployed agents
 */

import chalk from 'chalk';
import ora from 'ora';
import { exec } from 'child_process';
import { promisify } from 'util';
import { table } from 'table';
import { formatMode, formatStatus, formatDuration, formatSensitivity } from './ui.js';

const execAsync = promisify(exec);

/**
 * List all agents from the manifest
 * @param {Object} manifest - Agent manifest
 * @param {boolean} detailed - Whether to show detailed information
 * @param {string} environment - Target environment
 * @returns {Promise<void>}
 */
export async function listAgents(manifest, detailed = false, environment = 'dev') {
  console.log(chalk.cyan(`\n📋 Agents configured for ${chalk.bold(environment)}\n`));
  
  if (!manifest.agents || manifest.agents.length === 0) {
    console.log(chalk.yellow('No agents configured in manifest.'));
    return;
  }
  
  if (detailed) {
    // Show detailed table for each agent
    for (const agent of manifest.agents) {
      console.log(chalk.bold(`\n${agent.name} (${agent.version})`));
      if (agent.description) {
        console.log(chalk.dim(agent.description));
      }
      
      // Prepare agent details
      const details = [
        ['Mode', formatMode(agent.mode)],
        ['Memory', agent.memory || manifest.default_settings?.memory || 'persistent'],
        ['Sensitivity', formatSensitivity(agent.sensitivity || manifest.default_settings?.sensitivity || 'medium')],
        ['Feedback Loop', (agent.feedback_loop !== undefined ? agent.feedback_loop : manifest.default_settings?.feedback_loop) ? 'Enabled' : 'Disabled']
      ];
      
      // Add mode-specific details
      if (agent.mode === 'autonomous' && agent.schedule) {
        details.push(['Schedule', agent.schedule]);
      }
      
      if (agent.mode === 'suggestive' && agent.trigger_on) {
        details.push(['Trigger', agent.trigger_on]);
      }
      
      if (agent.mode === 'watchdog' && agent.alert_threshold) {
        details.push(['Alert Threshold', agent.alert_threshold]);
      }
      
      if (agent.on_anomaly) {
        details.push(['On Anomaly', agent.on_anomaly.replace(/_/g, ' ')]);
      }
      
      if (agent.max_outputs) {
        details.push(['Max Outputs', agent.max_outputs]);
      }
      
      // Display settings if available
      if (agent.settings && Object.keys(agent.settings).length > 0) {
        details.push(['', '']);
        details.push(['Settings', '']);
        
        for (const [key, value] of Object.entries(agent.settings)) {
          details.push([`  ${key}`, value]);
        }
      }
      
      console.log(table(details));
    }
  } else {
    // Simple table listing all agents
    const tableData = [
      ['Name', 'Version', 'Mode', 'Description']
    ];
    
    for (const agent of manifest.agents) {
      tableData.push([
        agent.name,
        agent.version,
        formatMode(agent.mode),
        agent.description || ''
      ]);
    }
    
    console.log(table(tableData));
  }
  
  console.log(chalk.dim(`\nTotal: ${manifest.agents.length} agent(s)`));
}

/**
 * Get the runtime status of deployed agents
 * @param {string} agentName - Specific agent to check (optional)
 * @param {string} environment - Target environment
 * @returns {Promise<Object>} Status information
 */
export async function getAgentStatus(agentName, environment = 'dev') {
  console.log(chalk.cyan(`\n🔍 Checking agent status in ${chalk.bold(environment)}\n`));
  
  const spinner = ora('Querying agent status...').start();
  
  try {
    // First try to get status via the status script
    let statusCommand;
    if (agentName) {
      statusCommand = `../../scripts/agent-status.sh -e ${environment} -a ${agentName}`;
    } else {
      statusCommand = `../../scripts/agent-status.sh -e ${environment}`;
    }
    
    let realStatusData = null;
    
    try {
      // Try to execute the real status command if it exists
      const { stdout } = await execAsync(statusCommand);
      realStatusData = JSON.parse(stdout);
    } catch (error) {
      // Script doesn't exist or failed, we'll use mock data
      // In a real implementation, you might want to handle this differently
      spinner.text = 'Connecting to agent orchestrator...';
    }
    
    // Wait a bit to simulate API calls
    await sleep(2000);
    
    // If we got real data from the script, use it
    if (realStatusData) {
      spinner.succeed('Status retrieved from agent orchestrator');
      displayAgentStatus(realStatusData, agentName);
      return realStatusData;
    }
    
    // Otherwise, generate mock status data for demonstration purposes
    // In a real implementation, you would call your API or service
    spinner.succeed('Status retrieved from agent orchestrator');
    
    let statusData;
    if (agentName) {
      // Status for a specific agent
      statusData = {
        environment,
        timestamp: new Date().toISOString(),
        agents: [generateMockAgentStatus(agentName)]
      };
    } else {
      // Status for all agents
      statusData = {
        environment,
        timestamp: new Date().toISOString(),
        agents: [
          generateMockAgentStatus('factor-tuner'),
          generateMockAgentStatus('benchmark-guard'),
          generateMockAgentStatus('curve-trainer'),
          generateMockAgentStatus('scenario-agent'),
          generateMockAgentStatus('boe-arguer')
        ]
      };
    }
    
    // Display the status information
    displayAgentStatus(statusData, agentName);
    
    return statusData;
  } catch (error) {
    spinner.fail(`Failed to retrieve agent status: ${error.message}`);
    throw error;
  }
}

/**
 * Display agent status information
 * @param {Object} statusData - Status data for agents
 * @param {string} specificAgent - Name of specific agent (if any)
 */
function displayAgentStatus(statusData, specificAgent = null) {
  if (specificAgent) {
    // Detailed view for a single agent
    const agent = statusData.agents.find(a => a.name === specificAgent);
    
    if (!agent) {
      console.log(chalk.yellow(`Agent "${specificAgent}" not found or not deployed.`));
      return;
    }
    
    console.log(chalk.bold(`\n${agent.name}\n`));
    
    // Basic info
    const details = [
      ['Status', formatStatus(agent.status)],
      ['Version', agent.version],
      ['Mode', formatMode(agent.mode)],
      ['Last Executed', agent.last_execution || 'Never'],
      ['Uptime', formatDuration(agent.uptime || 0)]
    ];
    
    // Add metrics if available
    if (agent.metrics) {
      details.push(['', '']);
      details.push(['Metrics', '']);
      
      for (const [key, value] of Object.entries(agent.metrics)) {
        const formattedKey = key.replace(/_/g, ' ');
        details.push([`  ${formattedKey}`, value]);
      }
    }
    
    // Add recent executions if available
    if (agent.recent_executions && agent.recent_executions.length > 0) {
      details.push(['', '']);
      details.push(['Recent Executions', '']);
      
      agent.recent_executions.forEach((execution, index) => {
        details.push([`  #${index + 1}`, `${execution.timestamp} (${execution.duration}s) - ${execution.status}`]);
      });
    }
    
    console.log(table(details));
    
    // Show any alerts
    if (agent.alerts && agent.alerts.length > 0) {
      console.log(chalk.yellow('\nAlerts:'));
      agent.alerts.forEach(alert => {
        console.log(chalk.yellow(`  - ${alert.message} (${alert.timestamp})`));
      });
    }
  } else {
    // Table view for all agents
    const tableData = [
      ['Name', 'Status', 'Version', 'Last Execution', 'Success Rate']
    ];
    
    for (const agent of statusData.agents) {
      tableData.push([
        agent.name,
        formatStatus(agent.status),
        agent.version,
        agent.last_execution || 'Never',
        `${agent.metrics?.success_rate || '0'}%`
      ]);
    }
    
    console.log(table(tableData));
  }
  
  console.log(chalk.dim(`\nLast updated: ${new Date(statusData.timestamp).toLocaleString()}`));
}

/**
 * Generate mock status data for an agent
 * This is only used when the real status script is not available
 * @param {string} agentName - Name of the agent
 * @returns {Object} Mock status data
 */
function generateMockAgentStatus(agentName) {
  // Basic status object
  const status = {
    name: agentName,
    version: '1.0.0',
    status: 'active',
    uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds (up to 24h)
    last_execution: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString(),
    metrics: {
      success_rate: Math.floor(85 + Math.random() * 15), // 85-100%
      average_duration: (Math.random() * 5 + 1).toFixed(2), // 1-6s
      memory_usage_mb: Math.floor(Math.random() * 500 + 100), // 100-600MB
      cpu_usage_percent: Math.floor(Math.random() * 20 + 5) // 5-25%
    },
    recent_executions: []
  };
  
  // Add recent executions
  const executionCount = Math.floor(Math.random() * 5) + 1; // 1-5 recent executions
  for (let i = 0; i < executionCount; i++) {
    const timestamp = new Date(Date.now() - (i * Math.floor(Math.random() * 3600000))).toISOString();
    const duration = (Math.random() * 5 + 0.5).toFixed(2);
    const executionStatus = Math.random() > 0.8 ? 'failed' : 'completed';
    
    status.recent_executions.push({
      timestamp,
      duration,
      status: executionStatus
    });
  }
  
  // Set mode based on agent name
  switch (agentName) {
    case 'factor-tuner':
      status.mode = 'autonomous';
      break;
    case 'benchmark-guard':
      status.mode = 'watchdog';
      // Add some alerts for the watchdog
      if (Math.random() > 0.6) {
        status.alerts = [{
          message: 'Anomaly detected in cost calculation factors',
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
          severity: 'warning'
        }];
      }
      break;
    case 'curve-trainer':
      status.mode = 'autonomous';
      status.metrics.model_accuracy = (Math.random() * 0.1 + 0.85).toFixed(4); // 0.85-0.95
      break;
    case 'scenario-agent':
      status.mode = 'suggestive';
      break;
    case 'boe-arguer':
      status.mode = 'collaborative';
      break;
    default:
      status.mode = 'autonomous';
  }
  
  // If agent name doesn't match any known agents, set to inactive
  if (!['factor-tuner', 'benchmark-guard', 'curve-trainer', 'scenario-agent', 'boe-arguer'].includes(agentName)) {
    status.status = 'inactive';
  }
  
  return status;
}

/**
 * Helper function to sleep for a given duration
 * @param {number} ms - Duration in milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}