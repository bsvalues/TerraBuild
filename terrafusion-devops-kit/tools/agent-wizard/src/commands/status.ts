/**
 * Agent Status Commands
 * Check status and view logs for agents
 */

import chalk from 'chalk';
import ora from 'ora';
import { table, getBorderCharacters } from 'table';
import { config } from '../lib/config';
import axios from 'axios';

// Agent status interface
interface AgentStatus {
  name: string;
  type: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  health: number;
  uptime: string;
  version: string;
  lastActive: string;
  cpu: string;
  memory: string;
  pendingTasks: number;
}

// Mock data for development purposes
const mockAgentData: AgentStatus[] = [
  {
    name: 'data-quality-agent',
    type: 'service',
    status: 'online',
    health: 100,
    uptime: '3d 4h 12m',
    version: '1.0.0',
    lastActive: '2m ago',
    cpu: '12%',
    memory: '256Mi',
    pendingTasks: 0,
  },
  {
    name: 'data-processor',
    type: 'processor',
    status: 'online',
    health: 92,
    uptime: '1d 2h 30m',
    version: '1.0.0',
    lastActive: '5m ago',
    cpu: '45%',
    memory: '420Mi',
    pendingTasks: 2,
  },
  {
    name: 'model-inference',
    type: 'inference',
    status: 'degraded',
    health: 78,
    uptime: '6h 15m',
    version: '1.0.0',
    lastActive: '1m ago',
    cpu: '85%',
    memory: '1.2Gi',
    pendingTasks: 5,
  },
  {
    name: 'task-scheduler',
    type: 'scheduler',
    status: 'offline',
    health: 0,
    uptime: '0m',
    version: '1.0.0',
    lastActive: '6h ago',
    cpu: '0%',
    memory: '0Mi',
    pendingTasks: 0,
  },
];

/**
 * Get the status of agents
 * @param agent Optional agent name to filter by
 * @returns Promise resolving to agent status data
 */
async function getAgentStatus(agent?: string): Promise<AgentStatus[]> {
  try {
    // In a real implementation, this would make an API call to the agent status endpoint
    // For now, we'll simulate with mock data
    const url = `${config.getApiUrl()}/api/v1/agents/status`;
    console.log(chalk.gray(`📡 Requesting agent status from ${url}`));
    
    try {
      // Try to fetch from API, but fall back to mock data
      const response = await axios.get(url, { timeout: 2000 });
      if (response.data && response.status === 200) {
        return agent 
          ? response.data.filter((a: AgentStatus) => a.name === agent)
          : response.data;
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not connect to API, using local data'));
      // Fall back to mock data
    }
    
    // Use mock data for development
    return agent 
      ? mockAgentData.filter(a => a.name === agent)
      : mockAgentData;
  } catch (error) {
    console.error(chalk.red(`Error fetching agent status: ${error}`));
    return [];
  }
}

/**
 * Format agent status for display
 * @param status Agent status object
 * @returns Formatted status with colors
 */
function formatAgentStatus(status: AgentStatus): string[] {
  const healthColor = 
    status.health >= 90 ? chalk.green :
    status.health >= 75 ? chalk.yellow :
    status.health > 0 ? chalk.red :
    chalk.gray;
  
  const statusColor = 
    status.status === 'online' ? chalk.green :
    status.status === 'degraded' ? chalk.yellow :
    status.status === 'offline' ? chalk.red :
    chalk.gray;
  
  const pendingTasksColor = 
    status.pendingTasks === 0 ? chalk.green :
    status.pendingTasks < 3 ? chalk.yellow :
    chalk.red;
  
  return [
    status.name,
    status.type,
    statusColor(status.status),
    healthColor(`${status.health}%`),
    status.uptime,
    status.version,
    status.lastActive,
    status.cpu,
    status.memory,
    pendingTasksColor(status.pendingTasks.toString()),
  ];
}

/**
 * Show agent status
 * @param options Command options
 */
export async function showStatus(options: any): Promise<void> {
  const spinner = ora('Fetching agent status...').start();
  
  try {
    const agentData = await getAgentStatus(options.agent);
    
    spinner.stop();
    
    if (agentData.length === 0) {
      if (options.agent) {
        console.log(chalk.yellow(`\n⚠️ No agent found with name "${options.agent}"\n`));
      } else {
        console.log(chalk.yellow('\n⚠️ No agents found\n'));
      }
      return;
    }
    
    const tableData = [
      [
        chalk.bold('NAME'),
        chalk.bold('TYPE'),
        chalk.bold('STATUS'),
        chalk.bold('HEALTH'),
        chalk.bold('UPTIME'),
        chalk.bold('VERSION'),
        chalk.bold('ACTIVE'),
        chalk.bold('CPU'),
        chalk.bold('MEMORY'),
        chalk.bold('TASKS'),
      ],
      ...agentData.map(formatAgentStatus),
    ];
    
    const tableConfig = {
      border: getBorderCharacters('norc'),
      columnDefault: {
        paddingLeft: 1,
        paddingRight: 1,
      },
      drawHorizontalLine: (index: number, size: number) => {
        return index === 0 || index === 1 || index === size;
      },
    };
    
    console.log();
    console.log(table(tableData, tableConfig));
    
    // Print summary
    const onlineCount = agentData.filter(a => a.status === 'online').length;
    const degradedCount = agentData.filter(a => a.status === 'degraded').length;
    const offlineCount = agentData.filter(a => a.status === 'offline').length;
    
    console.log(chalk.cyan(`🔹 ${agentData.length} agents total: `
      + chalk.green(`${onlineCount} online`) + ', '
      + chalk.yellow(`${degradedCount} degraded`) + ', '
      + chalk.red(`${offlineCount} offline`)
    ));
    
    // Watch mode
    if (options.watch) {
      const interval = parseInt(options.interval, 10) * 1000 || 5000;
      console.log(chalk.gray(`\nWatch mode enabled. Refreshing every ${interval / 1000}s (Ctrl+C to exit)\n`));
      
      setTimeout(() => {
        showStatus(options);
      }, interval);
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red(`\nError showing agent status: ${error}\n`));
  }
}

/**
 * Show agent logs
 * @param options Command options
 */
export async function showLogs(options: any): Promise<void> {
  const agent = options.agent || 'all';
  const lines = parseInt(options.lines, 10) || 100;
  const follow = options.follow || false;
  const since = options.since || '1h';
  
  console.log(chalk.cyan(`\n📜 Showing logs for ${agent === 'all' ? 'all agents' : `agent "${agent}"`}`));
  console.log(chalk.gray(`   ${lines} lines, since ${since}${follow ? ', following' : ''}\n`));
  
  // In a real implementation, this would fetch and display logs from the agent
  // For demo purposes, we'll simulate some logs
  
  const simulateLogs = () => {
    const agents = options.agent 
      ? mockAgentData.filter(a => a.name === options.agent)
      : mockAgentData;
    
    if (agents.length === 0) {
      console.log(chalk.yellow(`No agent found with name "${options.agent}"`));
      return;
    }
    
    const logLevels = ['INFO', 'DEBUG', 'WARN', 'ERROR'];
    const logMessages = [
      'Agent started successfully',
      'Processing request',
      'Completed task',
      'Connection established',
      'Received new job',
      'Task scheduled',
      'Resource limit approaching',
      'Failed to process request',
      'Connection timeout',
      'Retrying operation',
    ];
    
    // Generate some random logs
    for (let i = 0; i < Math.min(lines, 20); i++) {
      const agent = agents[Math.floor(Math.random() * agents.length)];
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      const message = logMessages[Math.floor(Math.random() * logMessages.length)];
      const timestamp = new Date().toISOString();
      
      const levelColor = 
        level === 'INFO' ? chalk.blue :
        level === 'DEBUG' ? chalk.gray :
        level === 'WARN' ? chalk.yellow :
        chalk.red;
      
      console.log(`${chalk.gray(timestamp)} ${levelColor(level.padEnd(5))} [${agent.name}] ${message}`);
    }
    
    // If following, schedule more logs
    if (follow) {
      setTimeout(simulateLogs, 2000);
    }
  };
  
  simulateLogs();
}