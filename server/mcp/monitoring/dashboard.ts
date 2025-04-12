/**
 * MCP Dashboard Service
 * 
 * Provides monitoring data for the MCP dashboard, including:
 * - Agent health metrics
 * - System performance metrics
 * - Task completion statistics
 * - Real-time event monitoring
 */

import { agentCoordinator } from '../experience/agentCoordinator';
import { agentEventBus as eventBus } from '../agents/eventBus';
import NodeCache from 'node-cache';

// Cache for dashboard data with 10-second TTL
const dashboardCache = new NodeCache({ stdTTL: 10, checkperiod: 15 });

interface AgentHealthMetrics {
  status: string;
  lastHeartbeat: string;
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  activeTaskCount: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number; // Percentage change from previous measurement
}

interface TaskSummary {
  completed: number;
  failed: number;
  inProgress: number;
  successRate: number;
  avgCompletionTime: number;
}

interface DashboardData {
  status: string;
  agents: number;
  agentHealth: Record<string, AgentHealthMetrics>;
  metrics: PerformanceMetric[];
  tasks: TaskSummary;
  systemPerformance: {
    requestsPerMinute: number;
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  timestamp: string;
}

// Track historical values for calculating changes
const metricHistory: Record<string, number[]> = {
  'responseTime': [],
  'errorRate': [],
  'memoryUsage': [],
  'activeTaskCount': [],
  'requestsPerMinute': []
};

// Maximum history items to keep
const MAX_HISTORY_ITEMS = 30;

/**
 * Calculate percentage change between current and previous values
 */
function calculateChange(current: number, previous: number | undefined): number {
  if (previous === undefined || previous === 0) {
    return 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Update metric history and calculate change
 */
function updateMetricHistory(name: string, value: number): number {
  if (!metricHistory[name]) {
    metricHistory[name] = [];
  }
  
  const history = metricHistory[name];
  const previousValue = history.length > 0 ? history[history.length - 1] : undefined;
  
  // Add current value to history
  history.push(value);
  
  // Trim history if it exceeds max length
  if (history.length > MAX_HISTORY_ITEMS) {
    history.shift();
  }
  
  return calculateChange(value, previousValue);
}

/**
 * Generate dashboard data with metrics and agent health
 */
export function generateDashboardData(): DashboardData {
  // Check cache first
  const cachedData = dashboardCache.get<DashboardData>('dashboardData');
  if (cachedData) {
    return cachedData;
  }
  
  // Get agent health from coordinator
  const agentHealthRaw = agentCoordinator.getAgentHealth();
  
  // Process agent health metrics
  const agentHealth: Record<string, AgentHealthMetrics> = {};
  
  Object.entries(agentHealthRaw).forEach(([agentId, health]) => {
    // Calculate derived metrics
    const responseTime = Math.round(Math.random() * 200 + 50); // In a real system, this would come from actual monitoring
    const errorRate = Math.random() * 0.05; // Keep error rates generally low
    const memoryUsage = Math.round(Math.random() * 200 + 50); // MB
    const activeTaskCount = Math.floor(Math.random() * 10);
    
    agentHealth[agentId] = {
      status: health.status,
      lastHeartbeat: health.lastHeartbeat || new Date().toISOString(),
      responseTime,
      errorRate,
      memoryUsage,
      activeTaskCount
    };
    
    // Update metric history for each agent
    updateMetricHistory(`${agentId}_responseTime`, responseTime);
    updateMetricHistory(`${agentId}_errorRate`, errorRate);
    updateMetricHistory(`${agentId}_memoryUsage`, memoryUsage);
    updateMetricHistory(`${agentId}_activeTaskCount`, activeTaskCount);
  });
  
  // Calculate aggregate metrics
  const avgResponseTime = Object.values(agentHealth).reduce(
    (sum, agent) => sum + agent.responseTime, 0
  ) / Math.max(Object.keys(agentHealth).length, 1);
  
  const avgErrorRate = Object.values(agentHealth).reduce(
    (sum, agent) => sum + agent.errorRate, 0
  ) / Math.max(Object.keys(agentHealth).length, 1);
  
  const avgMemoryUsage = Object.values(agentHealth).reduce(
    (sum, agent) => sum + agent.memoryUsage, 0
  ) / Math.max(Object.keys(agentHealth).length, 1);
  
  const totalActiveTasks = Object.values(agentHealth).reduce(
    (sum, agent) => sum + agent.activeTaskCount, 0
  );
  
  // Calculate changes for the metrics
  const responseTimeChange = updateMetricHistory('responseTime', avgResponseTime);
  const errorRateChange = updateMetricHistory('errorRate', avgErrorRate);
  const memoryChange = updateMetricHistory('memoryUsage', avgMemoryUsage);
  const taskCountChange = updateMetricHistory('activeTaskCount', totalActiveTasks);
  
  // Generate system performance metrics
  const requestsPerMinute = Math.round(Math.random() * 500 + 100);
  const requestsChange = updateMetricHistory('requestsPerMinute', requestsPerMinute);
  
  // Performance metrics
  const metrics: PerformanceMetric[] = [
    {
      name: 'Avg Response Time',
      value: avgResponseTime,
      change: responseTimeChange
    },
    {
      name: 'Error Rate',
      value: avgErrorRate * 100, // Convert to percentage
      change: errorRateChange
    },
    {
      name: 'Memory Usage',
      value: avgMemoryUsage,
      change: memoryChange
    },
    {
      name: 'Active Tasks',
      value: totalActiveTasks,
      change: taskCountChange
    },
    {
      name: 'Requests/min',
      value: requestsPerMinute,
      change: requestsChange
    }
  ];
  
  // Task summary (simulate with random data for demo)
  const completedTasks = Math.round(Math.random() * 200 + 50);
  const failedTasks = Math.round(Math.random() * 20);
  const inProgressTasks = totalActiveTasks;
  const successRate = (completedTasks / (completedTasks + failedTasks)) * 100;
  const avgCompletionTime = Math.random() * 2 + 0.5; // In seconds
  
  const tasks: TaskSummary = {
    completed: completedTasks,
    failed: failedTasks,
    inProgress: inProgressTasks,
    successRate,
    avgCompletionTime
  };
  
  // System performance
  const systemPerformance = {
    requestsPerMinute,
    avgResponseTime,
    errorRate: avgErrorRate * 100, // Convert to percentage
    uptime: 99.95 // Hardcoded for demo
  };
  
  // Compile full dashboard data
  const dashboardData: DashboardData = {
    status: 'active',
    agents: Object.keys(agentHealth).length,
    agentHealth,
    metrics,
    tasks,
    systemPerformance,
    timestamp: new Date().toISOString()
  };
  
  // Cache the data
  dashboardCache.set('dashboardData', dashboardData);
  
  return dashboardData;
}

/**
 * Clear dashboard cache
 */
export function clearDashboardCache(): void {
  dashboardCache.del('dashboardData');
}

/**
 * Reset dashboard metrics history
 */
export function resetMetricHistory(): void {
  Object.keys(metricHistory).forEach(key => {
    metricHistory[key] = [];
  });
}

// Subscribe to agent events to update dashboard data
const dashboardSubscriptionId = "dashboard-cache-clearer";
eventBus.subscribe('agent:*', dashboardSubscriptionId, async (event) => {
  // Clear cache whenever there's agent activity
  clearDashboardCache();
});