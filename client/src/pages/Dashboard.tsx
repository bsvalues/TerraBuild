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
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { ErrorDisplay } from "@/components/ui/error-display";

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
    // Refresh data every 15 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 15000);
    
    return () => clearInterval(intervalId);
  }, [refetch]);

  if (isLoading) {
    // Use the new skeleton component for a better loading experience
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">MCP Monitoring Dashboard</h1>
        <ErrorDisplay 
          title="Error Loading Dashboard" 
          error={error} 
          onRetry={() => refetch()} 
        />
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
          <TabsTrigger value="command">Command Structure</TabsTrigger>
          <TabsTrigger value="mcps">MCP Processes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
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
        
        <TabsContent value="command">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Command Structure</CardTitle>
                <CardDescription>
                  ARCHITECT PRIME → INTEGRATION COORDINATOR → COMPONENT LEADS → SPECIALIST AGENTS
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {/* Top Level: Architect Prime */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Architect Prime</h3>
                    {data.commandStructure.architectPrime ? (
                      <div className="bg-slate-50 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{data.commandStructure.architectPrime.name}</div>
                            <div className="text-sm text-gray-500">ID: {data.commandStructure.architectPrime.id}</div>
                          </div>
                          <div>
                            {getStatusBadge(data.commandStructure.architectPrime.status)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-md text-gray-500">No Architect Prime assigned</div>
                    )}
                  </div>
                  
                  {/* Second Level: Integration Coordinator */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Integration Coordinator</h3>
                    {data.commandStructure.integrationCoordinator ? (
                      <div className="bg-slate-50 p-4 rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{data.commandStructure.integrationCoordinator.name}</div>
                            <div className="text-sm text-gray-500">ID: {data.commandStructure.integrationCoordinator.id}</div>
                          </div>
                          <div>
                            {getStatusBadge(data.commandStructure.integrationCoordinator.status)}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-md text-gray-500">No Integration Coordinator assigned</div>
                    )}
                  </div>
                  
                  {/* Third Level: Component Leads */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Component Leads</h3>
                    {Object.keys(data.commandStructure.componentLeads).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(data.commandStructure.componentLeads).map(([key, lead]) => (
                          <div key={key} className="bg-slate-50 p-4 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{lead.name}</div>
                                <div className="text-xs text-gray-500">Component: {key}</div>
                              </div>
                              <div>
                                {getStatusBadge(lead.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-md text-gray-500">No Component Leads assigned</div>
                    )}
                  </div>
                  
                  {/* Fourth Level: Specialist Agents */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Specialist Agents</h3>
                    {Object.keys(data.commandStructure.specialistAgents).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(data.commandStructure.specialistAgents).map(([key, agent]) => (
                          <div key={key} className="bg-slate-50 p-4 rounded-md">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{agent.name}</div>
                                <div className="text-xs text-gray-500">Specialty: {key}</div>
                              </div>
                              <div>
                                {getStatusBadge(agent.status)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-4 rounded-md text-gray-500">No Specialist Agents assigned</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="mcps">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Assessment Calculation MCP */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Calculation MCP</CardTitle>
                <CardDescription>
                  Input Processing → Calculation Engine → Output Generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Status</div>
                    <div>{getStatusBadge(data.mcpMetrics.assessmentCalculation.status)}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-2">Processing Stages</div>
                    
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Input Processing</div>
                          <div className="text-sm">
                            {data.mcpMetrics.assessmentCalculation.processingStages.inputProcessing.activeAgents}/
                            {data.mcpMetrics.assessmentCalculation.processingStages.inputProcessing.totalAgents} agents
                          </div>
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(data.mcpMetrics.assessmentCalculation.processingStages.inputProcessing.status)}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Calculation Engine</div>
                          <div className="text-sm">
                            {data.mcpMetrics.assessmentCalculation.processingStages.calculationEngine.activeAgents}/
                            {data.mcpMetrics.assessmentCalculation.processingStages.calculationEngine.totalAgents} agents
                          </div>
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(data.mcpMetrics.assessmentCalculation.processingStages.calculationEngine.status)}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Output Generation</div>
                          <div className="text-sm">
                            {data.mcpMetrics.assessmentCalculation.processingStages.outputGeneration.activeAgents}/
                            {data.mcpMetrics.assessmentCalculation.processingStages.outputGeneration.totalAgents} agents
                          </div>
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(data.mcpMetrics.assessmentCalculation.processingStages.outputGeneration.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Geospatial Integration MCP */}
            <Card>
              <CardHeader>
                <CardTitle>Geospatial Integration MCP</CardTitle>
                <CardDescription>
                  Data Ingestion → Spatial Analytics → Visualization Generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Status</div>
                    <div>{getStatusBadge(data.mcpMetrics.geospatialIntegration.status)}</div>
                  </div>
                  
                  <div>
                    <div className="font-medium mb-2">Processing Stages</div>
                    
                    <div className="space-y-3">
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Data Ingestion</div>
                          <div className="text-sm">
                            {data.mcpMetrics.geospatialIntegration.processingStages.dataIngestion.activeAgents}/
                            {data.mcpMetrics.geospatialIntegration.processingStages.dataIngestion.totalAgents} agents
                          </div>
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(data.mcpMetrics.geospatialIntegration.processingStages.dataIngestion.status)}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Spatial Analytics</div>
                          <div className="text-sm">
                            {data.mcpMetrics.geospatialIntegration.processingStages.spatialAnalytics.activeAgents}/
                            {data.mcpMetrics.geospatialIntegration.processingStages.spatialAnalytics.totalAgents} agents
                          </div>
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(data.mcpMetrics.geospatialIntegration.processingStages.spatialAnalytics.status)}
                        </div>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">Visualization Generation</div>
                          <div className="text-sm">
                            {data.mcpMetrics.geospatialIntegration.processingStages.visualizationGeneration.activeAgents}/
                            {data.mcpMetrics.geospatialIntegration.processingStages.visualizationGeneration.totalAgents} agents
                          </div>
                        </div>
                        <div className="mt-1">
                          {getStatusBadge(data.mcpMetrics.geospatialIntegration.processingStages.visualizationGeneration.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="communication">
          <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Communication Metrics</CardTitle>
                <CardDescription>
                  Agent message exchange and communication patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="text-2xl font-bold">
                      {data.communicationMetrics.messageCount}
                    </div>
                    <div className="text-sm text-gray-500">Total messages exchanged</div>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-md md:col-span-2">
                    <div className="font-medium mb-2">Message Types</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(data.communicationMetrics.messagesByType).map(([type, count]) => (
                        <div key={type} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {type}: {count}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium mb-2">Latest Messages</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>To</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.communicationMetrics.latestMessages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">{message.from}</TableCell>
                          <TableCell>{message.to}</TableCell>
                          <TableCell>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {message.type}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">{formatDate(message.timestamp)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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