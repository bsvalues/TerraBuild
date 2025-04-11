/**
 * MCP Monitoring Dashboard
 * 
 * This module implements monitoring capabilities for the MCP framework,
 * providing metrics, logs, and health information for all AI agents.
 */

import { Request, Response } from 'express';
import { agentCoordinator } from '../experience/agentCoordinator';
import { trainingCoordinator } from '../experience/trainingCoordinator';
import { experienceReplayBuffer } from '../experience/replayBuffer';
import { agentRegistry } from '../agents';

/**
 * Dashboard metrics structure
 */
interface DashboardMetrics {
  timestamp: string;
  systemStatus: {
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    activeAgents: number;
    totalAgents: number;
    activeTaskCount: number;
    completedTaskCount: number;
    failedTaskCount: number;
    uptimeSeconds: number;
  };
  agentMetrics: Record<string, {
    id: string;
    name: string;
    status: string;
    memoryUsage: number;
    taskCount: number;
    errorCount: number;
    averageResponseTime: number;
    lastHeartbeat: string;
  }>;
  trainingMetrics: {
    replayBufferSize: number;
    lastTrainingTime: string | null;
    trainingEnabled: boolean;
    totalTrainingSessions: number;
    averageAgentImprovement: number;
  };
  taskMetrics: {
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    failedTasks: number;
    delegatedTasks: number;
    averageCompletionTimeMs: number;
    taskSuccessRate: number;
  };
  
  // Command structure metrics based on strategic guide
  commandStructure: {
    architectPrime: {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    } | null;
    integrationCoordinator: {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    } | null;
    componentLeads: Record<string, {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    }>;
    specialistAgents: Record<string, {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    }>;
  };
  
  // Multi-Agent Cognitive Processes metrics
  mcpMetrics: {
    assessmentCalculation: {
      status: string;
      activeAgents: number;
      totalAgents: number;
      processingStages: {
        inputProcessing: {
          activeAgents: number;
          totalAgents: number;
          status: string;
        };
        calculationEngine: {
          activeAgents: number;
          totalAgents: number;
          status: string;
        };
        outputGeneration: {
          activeAgents: number;
          totalAgents: number;
          status: string;
        };
      };
    };
    geospatialIntegration: {
      status: string;
      activeAgents: number;
      totalAgents: number;
      processingStages: {
        dataIngestion: {
          activeAgents: number;
          totalAgents: number;
          status: string;
        };
        spatialAnalytics: {
          activeAgents: number;
          totalAgents: number;
          status: string;
        };
        visualizationGeneration: {
          activeAgents: number;
          totalAgents: number;
          status: string;
        };
      };
    };
  };
  
  // Communication metrics
  communicationMetrics: {
    messageCount: number;
    messagesByType: Record<string, number>;
    latestMessages: Array<{
      from: string;
      to: string;
      type: string;
      timestamp: string;
      id: string;
    }>;
  };
}

// Track system start time for uptime calculation
const systemStartTime = new Date();

/**
 * Get uptime in seconds
 * 
 * @returns Uptime in seconds
 */
function getUptimeSeconds(): number {
  return Math.floor((Date.now() - systemStartTime.getTime()) / 1000);
}

/**
 * Get dashboard metrics
 * 
 * @returns Dashboard metrics
 */
export function getDashboardMetrics(): DashboardMetrics {
  // Get agent health statuses
  const agentHealthStatus = agentCoordinator.getAgentHealth() as Record<string, any>;
  
  // Get agent registry to get names
  const allAgentIds = Object.keys(agentHealthStatus);
  
  // Get performance metrics from agent coordinator
  const performanceMetrics = agentCoordinator.getPerformanceMetrics();
  
  // Get tasks
  const allTasks = agentCoordinator.getTasks();
  const pendingTasks = allTasks.filter(t => t.status === 'PENDING').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
  const failedTasks = allTasks.filter(t => t.status === 'FAILED').length;
  const delegatedTasks = allTasks.filter(t => t.status === 'DELEGATED').length;
  
  // Get replay buffer stats
  const replayBufferStats = experienceReplayBuffer.getStats();
  
  // Get training status
  const isTrainingActive = trainingCoordinator.isAutomatedTrainingActive();
  const isTrainingInProgress = trainingCoordinator.isTrainingInProgress();
  const recentTrainingResults = trainingCoordinator.getRecentTrainingResults();
  
  // Format agent metrics
  const agentMetrics: Record<string, any> = {};
  for (const agentId of allAgentIds) {
    const health = agentHealthStatus[agentId];
    const agent = agentRegistry.getAgent(agentId);
    const name = agent ? agent.getDefinition().name : agentId;
    
    agentMetrics[agentId] = {
      id: agentId,
      name,
      status: health.status,
      memoryUsage: health.memoryUsage,
      taskCount: health.taskCount,
      errorCount: health.errorCount,
      averageResponseTime: health.averageResponseTime,
      lastHeartbeat: health.lastHeartbeat.toISOString()
    };
  }
  
  // Determine system status
  let systemStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
  const unhealthyAgents = allAgentIds.filter(id => 
    agentHealthStatus[id].status === 'UNHEALTHY' || 
    agentHealthStatus[id].status === 'OFFLINE'
  );
  
  if (unhealthyAgents.length > 0) {
    systemStatus = unhealthyAgents.length === allAgentIds.length ? 
      'UNHEALTHY' : 'DEGRADED';
  }
  
  // Calculate average agent improvement from training
  let averageImprovement = 0;
  if (recentTrainingResults.length > 0) {
    const totalImprovement = recentTrainingResults.reduce((sum, result) => {
      const improvements = Object.values(result.improvements);
      return sum + (improvements.reduce((s, v) => s + v, 0) / improvements.length);
    }, 0);
    averageImprovement = totalImprovement / recentTrainingResults.length;
  }
  
  // Last training time
  const lastTrainingTime = recentTrainingResults.length > 0 ?
    recentTrainingResults[recentTrainingResults.length - 1].timestamp.toISOString() : null;
  
  // Process command structure metrics
  const commandStructureMetrics = {
    architectPrime: null,
    integrationCoordinator: null,
    componentLeads: {},
    specialistAgents: {}
  };
  
  // Add Architect Prime if available
  if (agentRegistry.commandStructure?.architectPrime) {
    const apAgent = agentRegistry.commandStructure.architectPrime;
    const apId = apAgent.getDefinition().id;
    const apHealth = agentHealthStatus[apId] || { 
      status: 'UNKNOWN', 
      lastHeartbeat: new Date() 
    };
    
    commandStructureMetrics.architectPrime = {
      id: apId,
      name: apAgent.getDefinition().name,
      status: apHealth.status,
      lastHeartbeat: apHealth.lastHeartbeat.toISOString()
    };
  }
  
  // Add Integration Coordinator if available
  if (agentRegistry.commandStructure?.integrationCoordinator) {
    const icAgent = agentRegistry.commandStructure.integrationCoordinator;
    const icId = icAgent.getDefinition().id;
    const icHealth = agentHealthStatus[icId] || { 
      status: 'UNKNOWN', 
      lastHeartbeat: new Date() 
    };
    
    commandStructureMetrics.integrationCoordinator = {
      id: icId,
      name: icAgent.getDefinition().name,
      status: icHealth.status,
      lastHeartbeat: icHealth.lastHeartbeat.toISOString()
    };
  }
  
  // Add Component Leads
  for (const [name, agent] of Object.entries(agentRegistry.commandStructure?.componentLeads || {})) {
    if (!agent) continue;
    
    const id = agent.getDefinition().id;
    const health = agentHealthStatus[id] || { 
      status: 'UNKNOWN', 
      lastHeartbeat: new Date() 
    };
    
    commandStructureMetrics.componentLeads[name] = {
      id,
      name: agent.getDefinition().name,
      status: health.status,
      lastHeartbeat: health.lastHeartbeat.toISOString()
    };
  }
  
  // Add Specialist Agents
  for (const [name, agent] of Object.entries(agentRegistry.commandStructure?.specialistAgents || {})) {
    if (!agent) continue;
    
    const id = agent.getDefinition().id;
    const health = agentHealthStatus[id] || { 
      status: 'UNKNOWN', 
      lastHeartbeat: new Date() 
    };
    
    commandStructureMetrics.specialistAgents[name] = {
      id,
      name: agent.getDefinition().name,
      status: health.status,
      lastHeartbeat: health.lastHeartbeat.toISOString()
    };
  }
  
  // Process MCP metrics for Assessment Calculation
  const assessmentCalculation = {
    status: 'HEALTHY',
    activeAgents: 0,
    totalAgents: 0,
    processingStages: {
      inputProcessing: {
        activeAgents: 0,
        totalAgents: Object.keys(agentRegistry.commandStructure?.assessmentCalculation?.inputProcessing || {}).length,
        status: 'HEALTHY'
      },
      calculationEngine: {
        activeAgents: 0,
        totalAgents: Object.keys(agentRegistry.commandStructure?.assessmentCalculation?.calculationEngine || {}).length,
        status: 'HEALTHY'
      },
      outputGeneration: {
        activeAgents: 0,
        totalAgents: Object.keys(agentRegistry.commandStructure?.assessmentCalculation?.outputGeneration || {}).length,
        status: 'HEALTHY'
      }
    }
  };
  
  // Process MCP metrics for Geospatial Integration
  const geospatialIntegration = {
    status: 'HEALTHY',
    activeAgents: 0,
    totalAgents: 0,
    processingStages: {
      dataIngestion: {
        activeAgents: 0,
        totalAgents: Object.keys(agentRegistry.commandStructure?.geospatialIntegration?.dataIngestion || {}).length,
        status: 'HEALTHY'
      },
      spatialAnalytics: {
        activeAgents: 0,
        totalAgents: Object.keys(agentRegistry.commandStructure?.geospatialIntegration?.spatialAnalytics || {}).length,
        status: 'HEALTHY'
      },
      visualizationGeneration: {
        activeAgents: 0,
        totalAgents: Object.keys(agentRegistry.commandStructure?.geospatialIntegration?.visualizationGeneration || {}).length,
        status: 'HEALTHY'
      }
    }
  };
  
  // Include mock communication metrics for now
  const communicationMetrics = {
    messageCount: agentCoordinator.getMessageCount() || 25,
    messagesByType: agentCoordinator.getMessageTypeDistribution() || {
      'task.created': 8,
      'task.completed': 6,
      'task.failed': 2,
      'agent.heartbeat': 9
    },
    latestMessages: agentCoordinator.getLatestMessages() || [
      {
        from: 'data-quality-agent',
        to: 'compliance-agent',
        type: 'task.delegated',
        timestamp: new Date().toISOString(),
        id: 'msg-' + Math.floor(Math.random() * 1000000)
      },
      {
        from: 'architect-prime',
        to: 'all',
        type: 'system.status',
        timestamp: new Date().toISOString(),
        id: 'msg-' + Math.floor(Math.random() * 1000000)
      }
    ]
  };
  
  return {
    timestamp: new Date().toISOString(),
    systemStatus: {
      status: systemStatus,
      activeAgents: allAgentIds.filter(id => 
        agentHealthStatus[id].status !== 'OFFLINE'
      ).length,
      totalAgents: allAgentIds.length,
      activeTaskCount: inProgressTasks,
      completedTaskCount: completedTasks,
      failedTaskCount: failedTasks,
      uptimeSeconds: getUptimeSeconds()
    },
    agentMetrics,
    trainingMetrics: {
      replayBufferSize: replayBufferStats.size,
      lastTrainingTime,
      trainingEnabled: isTrainingActive,
      totalTrainingSessions: recentTrainingResults.length,
      averageAgentImprovement: averageImprovement
    },
    taskMetrics: {
      pendingTasks,
      inProgressTasks,
      completedTasks,
      failedTasks,
      delegatedTasks,
      averageCompletionTimeMs: performanceMetrics.avgCompletionTime,
      taskSuccessRate: performanceMetrics.taskSuccessRate
    },
    commandStructure: commandStructureMetrics,
    mcpMetrics: {
      assessmentCalculation,
      geospatialIntegration
    },
    communicationMetrics
  };
}

/**
 * Handle dashboard API request
 * 
 * @param req Express request
 * @param res Express response
 */
export function handleDashboardRequest(req: Request, res: Response): void {
  try {
    const metrics = getDashboardMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error generating dashboard metrics:', error);
    res.status(500).json({
      error: 'Error generating dashboard metrics',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Generate HTML dashboard
 * 
 * @returns HTML dashboard string
 */
export function generateHtmlDashboard(): string {
  const metrics = getDashboardMetrics();
  
  // Format uptime
  const uptime = metrics.systemStatus.uptimeSeconds;
  const uptimeFormatted = 
    Math.floor(uptime / 86400) + 'd ' + 
    Math.floor((uptime % 86400) / 3600) + 'h ' + 
    Math.floor((uptime % 3600) / 60) + 'm ' + 
    (uptime % 60) + 's';
  
  // Convert task success rate to percentage
  const successRate = Math.round(metrics.taskMetrics.taskSuccessRate * 100);
  
  // Generate HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCP Monitoring Dashboard</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f7fa;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 20px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    h1 {
      color: #2c3e50;
      margin: 0;
    }
    .refresh-info {
      color: #7f8c8d;
      font-size: 14px;
    }
    .status-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 6px;
    }
    .status-healthy { background-color: #2ecc71; }
    .status-degraded { background-color: #f39c12; }
    .status-unhealthy { background-color: #e74c3c; }
    .status-offline { background-color: #95a5a6; }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      padding: 20px;
      height: 100%;
    }
    .card h2 {
      margin-top: 0;
      color: #2c3e50;
      font-size: 18px;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 10px;
    }
    .metric {
      padding: 15px;
      border-radius: 6px;
      background-color: #f8f9fa;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 5px;
    }
    .metric-label {
      font-size: 14px;
      color: #7f8c8d;
    }
    .agents-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .agents-table th, .agents-table td {
      text-align: left;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .agents-table th {
      font-weight: 500;
      color: #7f8c8d;
    }
    .auto-refresh {
      display: flex;
      justify-content: center;
      margin-top: 30px;
    }
    button {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background-color: #2980b9;
    }
    .task-bar {
      height: 24px;
      display: flex;
      overflow: hidden;
      border-radius: 4px;
      margin: 15px 0;
    }
    .task-segment {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
    }
    .task-complete { background-color: #2ecc71; }
    .task-pending { background-color: #3498db; }
    .task-progress { background-color: #9b59b6; }
    .task-failed { background-color: #e74c3c; }
    .task-delegated { background-color: #f39c12; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>
        <span class="status-indicator status-${metrics.systemStatus.status.toLowerCase()}"></span>
        MCP Monitoring Dashboard
      </h1>
      <div class="refresh-info">
        Last updated: ${new Date().toLocaleString()}
        <br>
        System uptime: ${uptimeFormatted}
      </div>
    </header>
    
    <div class="dashboard-grid">
      <div class="card">
        <h2>System Status</h2>
        <div class="metric-grid">
          <div class="metric">
            <div class="metric-value">${metrics.systemStatus.status}</div>
            <div class="metric-label">Overall Status</div>
          </div>
          <div class="metric">
            <div class="metric-value">${metrics.systemStatus.activeAgents}/${metrics.systemStatus.totalAgents}</div>
            <div class="metric-label">Active Agents</div>
          </div>
          <div class="metric">
            <div class="metric-value">${metrics.systemStatus.activeTaskCount}</div>
            <div class="metric-label">Active Tasks</div>
          </div>
          <div class="metric">
            <div class="metric-value">${metrics.trainingMetrics.replayBufferSize}</div>
            <div class="metric-label">Experiences</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2>Task Metrics</h2>
        <div class="task-bar">
          ${metrics.taskMetrics.completedTasks > 0 ? 
            `<div class="task-segment task-complete" style="width: ${Math.round(metrics.taskMetrics.completedTasks / (metrics.taskMetrics.completedTasks + metrics.taskMetrics.pendingTasks + metrics.taskMetrics.inProgressTasks + metrics.taskMetrics.failedTasks + metrics.taskMetrics.delegatedTasks) * 100)}%">
              ${metrics.taskMetrics.completedTasks} Completed
            </div>` : ''}
          ${metrics.taskMetrics.pendingTasks > 0 ? 
            `<div class="task-segment task-pending" style="width: ${Math.round(metrics.taskMetrics.pendingTasks / (metrics.taskMetrics.completedTasks + metrics.taskMetrics.pendingTasks + metrics.taskMetrics.inProgressTasks + metrics.taskMetrics.failedTasks + metrics.taskMetrics.delegatedTasks) * 100)}%">
              ${metrics.taskMetrics.pendingTasks} Pending
            </div>` : ''}
          ${metrics.taskMetrics.inProgressTasks > 0 ? 
            `<div class="task-segment task-progress" style="width: ${Math.round(metrics.taskMetrics.inProgressTasks / (metrics.taskMetrics.completedTasks + metrics.taskMetrics.pendingTasks + metrics.taskMetrics.inProgressTasks + metrics.taskMetrics.failedTasks + metrics.taskMetrics.delegatedTasks) * 100)}%">
              ${metrics.taskMetrics.inProgressTasks} In Progress
            </div>` : ''}
          ${metrics.taskMetrics.delegatedTasks > 0 ? 
            `<div class="task-segment task-delegated" style="width: ${Math.round(metrics.taskMetrics.delegatedTasks / (metrics.taskMetrics.completedTasks + metrics.taskMetrics.pendingTasks + metrics.taskMetrics.inProgressTasks + metrics.taskMetrics.failedTasks + metrics.taskMetrics.delegatedTasks) * 100)}%">
              ${metrics.taskMetrics.delegatedTasks} Delegated
            </div>` : ''}
          ${metrics.taskMetrics.failedTasks > 0 ? 
            `<div class="task-segment task-failed" style="width: ${Math.round(metrics.taskMetrics.failedTasks / (metrics.taskMetrics.completedTasks + metrics.taskMetrics.pendingTasks + metrics.taskMetrics.inProgressTasks + metrics.taskMetrics.failedTasks + metrics.taskMetrics.delegatedTasks) * 100)}%">
              ${metrics.taskMetrics.failedTasks} Failed
            </div>` : ''}
        </div>
        <div class="metric-grid">
          <div class="metric">
            <div class="metric-value">${successRate}%</div>
            <div class="metric-label">Success Rate</div>
          </div>
          <div class="metric">
            <div class="metric-value">${Math.round(metrics.taskMetrics.averageCompletionTimeMs)}ms</div>
            <div class="metric-label">Avg. Completion Time</div>
          </div>
          <div class="metric">
            <div class="metric-value">${metrics.taskMetrics.completedTasks + metrics.taskMetrics.failedTasks}</div>
            <div class="metric-label">Total Processed</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2>Training Metrics</h2>
        <div class="metric-grid">
          <div class="metric">
            <div class="metric-value">${metrics.trainingMetrics.trainingEnabled ? 'Enabled' : 'Disabled'}</div>
            <div class="metric-label">Training Status</div>
          </div>
          <div class="metric">
            <div class="metric-value">${metrics.trainingMetrics.totalTrainingSessions}</div>
            <div class="metric-label">Training Sessions</div>
          </div>
          <div class="metric">
            <div class="metric-value">${(metrics.trainingMetrics.averageAgentImprovement * 100).toFixed(1)}%</div>
            <div class="metric-label">Avg. Improvement</div>
          </div>
          <div class="metric">
            <div class="metric-value">${metrics.trainingMetrics.lastTrainingTime ? new Date(metrics.trainingMetrics.lastTrainingTime).toLocaleTimeString() : 'Never'}</div>
            <div class="metric-label">Last Training</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2>Agent Status</h2>
      <table class="agents-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Status</th>
            <th>Tasks</th>
            <th>Errors</th>
            <th>Avg. Response</th>
            <th>Memory Usage</th>
            <th>Last Heartbeat</th>
          </tr>
        </thead>
        <tbody>
          ${Object.values(metrics.agentMetrics).map(agent => `
            <tr>
              <td>
                <span class="status-indicator status-${agent.status.toLowerCase()}"></span>
                ${agent.name}
              </td>
              <td>${agent.status}</td>
              <td>${agent.taskCount}</td>
              <td>${agent.errorCount}</td>
              <td>${Math.round(agent.averageResponseTime)}ms</td>
              <td>${agent.memoryUsage} entries</td>
              <td>${new Date(agent.lastHeartbeat).toLocaleTimeString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="auto-refresh">
      <button onclick="location.reload()">Refresh Dashboard</button>
    </div>
    
    <script>
      // Auto-refresh every 30 seconds
      setTimeout(() => {
        location.reload();
      }, 30000);
    </script>
  </div>
</body>
</html>`;
}

/**
 * Handle HTML dashboard request
 * 
 * @param req Express request
 * @param res Express response
 */
export function handleHtmlDashboardRequest(req: Request, res: Response): void {
  try {
    const html = generateHtmlDashboard();
    res.header('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error generating HTML dashboard:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Error Generating Dashboard</h1>
          <p>${error instanceof Error ? error.message : String(error)}</p>
          <a href="javascript:location.reload()">Retry</a>
        </body>
      </html>
    `);
  }
}