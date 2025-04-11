import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CheckCircle2, AlertCircle, AlertTriangle, Clock } from "lucide-react";

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
}

const Dashboard = () => {
  const { data, error, isLoading, refetch } = useQuery<DashboardMetrics>({
    queryKey: ['/api/mcp/dashboard'],
  });

  useEffect(() => {
    // Refresh data every 15 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MCP Monitoring Dashboard</h1>
        <div className="grid gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-32">
                <p>Loading dashboard data...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MCP Monitoring Dashboard</h1>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="mr-2" />
              <span>Error loading dashboard data</span>
            </div>
            <p className="mt-2 text-sm">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MCP Monitoring Dashboard</h1>
        <Card>
          <CardContent className="pt-6">
            <p>No dashboard data available</p>
          </CardContent>
        </Card>
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
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">MCP Monitoring Dashboard</h1>
          <div className="ml-4">
            {getStatusBadge(data.systemStatus.status)}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <div>Last updated: {formatDate(data.timestamp)}</div>
          <div>Uptime: {formatDuration(data.systemStatus.uptimeSeconds)}</div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.systemStatus.activeAgents}/{data.systemStatus.totalAgents}
                </div>
                <p className="text-xs text-gray-500">Active agents</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalTasks}
                </div>
                <p className="text-xs text-gray-500">Total tasks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Task Success</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {successRate}%
                </div>
                <Progress 
                  value={successRate} 
                  className="h-2 mt-2" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Experience Buffer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.trainingMetrics.replayBufferSize}
                </div>
                <p className="text-xs text-gray-500">Stored experiences</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Status</CardTitle>
                <CardDescription>
                  Status of all MCP agents in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="agents">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
                <CardDescription>
                  Detailed information about all MCP agents
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.taskMetrics.completedTasks}
                </div>
                <p className="text-xs text-gray-500">Successfully completed tasks</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.taskMetrics.inProgressTasks}
                </div>
                <p className="text-xs text-gray-500">Tasks in progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.taskMetrics.failedTasks}
                </div>
                <p className="text-xs text-gray-500">Tasks that failed to complete</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution</CardTitle>
                <CardDescription>
                  Distribution of tasks by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-4 flex rounded-full overflow-hidden mb-2">
                  {data.taskMetrics.completedTasks > 0 && (
                    <div 
                      className="bg-green-500 text-xs text-white flex items-center justify-center"
                      style={{ width: `${Math.round(data.taskMetrics.completedTasks / totalTasks * 100)}%` }}
                    />
                  )}
                  {data.taskMetrics.inProgressTasks > 0 && (
                    <div 
                      className="bg-blue-500 text-xs text-white flex items-center justify-center"
                      style={{ width: `${Math.round(data.taskMetrics.inProgressTasks / totalTasks * 100)}%` }}
                    />
                  )}
                  {data.taskMetrics.pendingTasks > 0 && (
                    <div 
                      className="bg-purple-500 text-xs text-white flex items-center justify-center"
                      style={{ width: `${Math.round(data.taskMetrics.pendingTasks / totalTasks * 100)}%` }}
                    />
                  )}
                  {data.taskMetrics.delegatedTasks > 0 && (
                    <div 
                      className="bg-amber-500 text-xs text-white flex items-center justify-center"
                      style={{ width: `${Math.round(data.taskMetrics.delegatedTasks / totalTasks * 100)}%` }}
                    />
                  )}
                  {data.taskMetrics.failedTasks > 0 && (
                    <div 
                      className="bg-red-500 text-xs text-white flex items-center justify-center"
                      style={{ width: `${Math.round(data.taskMetrics.failedTasks / totalTasks * 100)}%` }}
                    />
                  )}
                </div>
                
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                    <span className="text-sm">Completed ({data.taskMetrics.completedTasks})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                    <span className="text-sm">In Progress ({data.taskMetrics.inProgressTasks})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
                    <span className="text-sm">Pending ({data.taskMetrics.pendingTasks})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
                    <span className="text-sm">Delegated ({data.taskMetrics.delegatedTasks})</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                    <span className="text-sm">Failed ({data.taskMetrics.failedTasks})</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Task Success Rate</span>
                    <span className="text-sm font-medium">{successRate}%</span>
                  </div>
                  <Progress 
                    value={successRate} 
                    className="h-2" 
                  />
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Average Completion Time</span>
                    <span className="text-sm font-medium">{data.taskMetrics.averageCompletionTimeMs}ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="training">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Training Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.trainingMetrics.trainingEnabled ? 'Enabled' : 'Disabled'}
                </div>
                <p className="text-xs text-gray-500">Automated training status</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Experience Buffer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.trainingMetrics.replayBufferSize}
                </div>
                <p className="text-xs text-gray-500">Experiences in buffer</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Training Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.trainingMetrics.totalTrainingSessions}
                </div>
                <p className="text-xs text-gray-500">Total training sessions</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Agent Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(data.trainingMetrics.averageAgentImprovement * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">Average improvement</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Training Information</CardTitle>
                <CardDescription>
                  Details about agent training and experience sharing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-1">Last Training Time</div>
                    <div>{data.trainingMetrics.lastTrainingTime ? formatDate(data.trainingMetrics.lastTrainingTime) : 'Never'}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Experiences in Buffer</div>
                    <div>{data.trainingMetrics.replayBufferSize} experiences available for training</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Training Status</div>
                    <div className="flex items-center">
                      {data.trainingMetrics.trainingEnabled ? (
                        <>
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          <span>Automated training is enabled</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                          <span>Automated training is disabled</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium mb-1">Agent Performance Improvement</div>
                    <div>Average improvement of {(data.trainingMetrics.averageAgentImprovement * 100).toFixed(1)}% across {data.trainingMetrics.totalTrainingSessions} training sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-center mt-6">
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
};

export default Dashboard;