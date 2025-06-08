import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/page-header';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardContent } from '@/components/ui/enterprise-card';
import { MetricCard } from '@/components/ui/metric-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, AlertTriangle, Clock, Activity, Cpu, Database, MessageSquare } from "lucide-react";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />;
    case 'degraded':
      return <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />;
    case 'unhealthy':
      return <AlertCircle className="h-4 w-4 text-red-500 mr-1" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500 mr-1" />;
  }
};

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  
  let variant = "outline";
  if (statusLower === "healthy") variant = "success";
  if (statusLower === "degraded") variant = "warning";
  if (statusLower === "unhealthy") variant = "destructive";
  
  return (
    <Badge variant={variant as any} className="capitalize">
      {getStatusIcon(status)}
      {status}
    </Badge>
  );
};

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

const Dashboard = () => {
  const { data, error, isLoading, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['/api/mcp/dashboard'],
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      refetch();
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Dashboard"
          description="Loading system metrics and status..."
          icon={Activity}
        />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-800/30 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Dashboard"
          description="Error loading dashboard data"
          icon={Activity}
        />
        <EnterpriseCard>
          <EnterpriseCardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-400">Failed to load dashboard data</p>
              <button 
                onClick={() => refetch()} 
                className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-lg"
              >
                Retry
              </button>
            </div>
          </EnterpriseCardContent>
        </EnterpriseCard>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="System Dashboard"
          description="No data available"
          icon={Activity}
        />
        <EnterpriseCard>
          <EnterpriseCardContent>
            <p className="text-slate-400">No dashboard data available</p>
          </EnterpriseCardContent>
        </EnterpriseCard>
      </div>
    );
  }

  const successRate = Math.round(data.taskMetrics.taskSuccessRate * 100);
  const totalTasks = 
    data.taskMetrics.completedTasks + 
    data.taskMetrics.pendingTasks + 
    data.taskMetrics.inProgressTasks + 
    data.taskMetrics.failedTasks +
    data.taskMetrics.delegatedTasks;
  
  return (
    <div className="space-y-8">
      <PageHeader
        title="System Dashboard"
        description={`System ${data.systemStatus.status.toLowerCase()} - Uptime: ${formatDuration(data.systemStatus.uptimeSeconds)}`}
        icon={Activity}
        actions={
          <div className="flex items-center gap-4">
            {getStatusBadge(data.systemStatus.status)}
            <span className="text-sm text-slate-400">
              Updated: {formatDate(data.timestamp)}
            </span>
          </div>
        }
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Agents"
          value={`${data.systemStatus.activeAgents}/${data.systemStatus.totalAgents}`}
          description="System agents online"
          icon={Cpu}
          variant="primary"
        />
        <MetricCard
          title="Total Tasks"
          value={totalTasks.toString()}
          trend="up"
          trendValue={`${data.taskMetrics.completedTasks} completed`}
          icon={Activity}
          variant="default"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          description="Task completion rate"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Experience Buffer"
          value={data.trainingMetrics.replayBufferSize.toString()}
          description="Training experiences stored"
          icon={Database}
          variant="default"
        />
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 gap-6">
            <EnterpriseCard>
              <EnterpriseCardHeader>
                <EnterpriseCardTitle>Agent Status Overview</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Avg Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(data.agentMetrics).map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{getStatusBadge(agent.status)}</TableCell>
                        <TableCell>{agent.taskCount}</TableCell>
                        <TableCell>{agent.errorCount}</TableCell>
                        <TableCell>{agent.averageResponseTime}ms</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </EnterpriseCardContent>
            </EnterpriseCard>
          </div>
        </TabsContent>
        
        <TabsContent value="agents">
          <EnterpriseCard>
            <EnterpriseCardHeader>
              <EnterpriseCardTitle>Detailed Agent Information</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Memory Usage</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Last Heartbeat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(data.agentMetrics).map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell className="font-mono text-xs">{agent.id}</TableCell>
                      <TableCell>{getStatusBadge(agent.status)}</TableCell>
                      <TableCell>{agent.memoryUsage} bytes</TableCell>
                      <TableCell>{agent.taskCount}</TableCell>
                      <TableCell>{agent.errorCount}</TableCell>
                      <TableCell>{agent.averageResponseTime}ms</TableCell>
                      <TableCell className="text-sm">{formatDate(agent.lastHeartbeat)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>
        
        <TabsContent value="tasks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <MetricCard
              title="Completed Tasks"
              value={data.taskMetrics.completedTasks.toString()}
              description="Successfully completed tasks"
              icon={CheckCircle2}
              variant="success"
            />
            <MetricCard
              title="Active Tasks"
              value={data.taskMetrics.inProgressTasks.toString()}
              description="Tasks in progress"
              icon={Activity}
              variant="default"
            />
            <MetricCard
              title="Failed Tasks"
              value={data.taskMetrics.failedTasks.toString()}
              description="Tasks that failed to complete"
              icon={AlertCircle}
              variant="warning"
            />
          </div>
          
          <EnterpriseCard>
            <EnterpriseCardHeader>
              <EnterpriseCardTitle>Task Distribution</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Success Rate</span>
                  <span className="text-sm font-medium">{successRate}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-emerald-400">{data.taskMetrics.completedTasks}</div>
                    <div className="text-xs text-slate-500">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-sky-400">{data.taskMetrics.inProgressTasks}</div>
                    <div className="text-xs text-slate-500">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-400">{data.taskMetrics.pendingTasks}</div>
                    <div className="text-xs text-slate-500">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">{data.taskMetrics.failedTasks}</div>
                    <div className="text-xs text-slate-500">Failed</div>
                  </div>
                </div>
              </div>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>
        
        <TabsContent value="communication">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnterpriseCard>
              <EnterpriseCardHeader>
                <EnterpriseCardTitle>Message Statistics</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-4">
                  <MetricCard
                    title="Total Messages"
                    value={data.communicationMetrics.messageCount.toString()}
                    icon={MessageSquare}
                    variant="primary"
                  />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300">Messages by Type</h4>
                    {Object.entries(data.communicationMetrics.messagesByType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-slate-400 capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>

            <EnterpriseCard>
              <EnterpriseCardHeader>
                <EnterpriseCardTitle>Recent Messages</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-3">
                  {data.communicationMetrics.latestMessages.slice(0, 5).map((message) => (
                    <div key={message.id} className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm">
                          <span className="text-sky-400">{message.from}</span>
                          <span className="text-slate-500 mx-2">→</span>
                          <span className="text-emerald-400">{message.to}</span>
                        </div>
                        <span className="text-xs text-slate-500">{formatDate(message.timestamp)}</span>
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {message.type.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;