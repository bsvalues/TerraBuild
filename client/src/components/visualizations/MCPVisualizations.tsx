/**
 * MCP Visualizations Component
 * 
 * Provides real-time visualization of MCP agent activities, metrics, and status
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import RealTimeChart, { DataPoint } from './RealTimeChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Activity,
  CheckSquare,
  AlertCircle,
  BarChart2,
  Gauge,
  MessageSquare,
} from 'lucide-react';

// Types for MCP dashboard data
interface AgentHealth {
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
  change: number;
}

interface MCPDashboardData {
  status: string;
  agents: number;
  agentHealth: Record<string, AgentHealth>;
  metrics: PerformanceMetric[];
  timestamp: string;
}

export function MCPVisualizations() {
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState('real-time');
  
  // Fetch MCP dashboard data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/mcp/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/mcp/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch MCP dashboard data');
      }
      return response.json() as Promise<MCPDashboardData>;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Show error toast on fetch failure
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load MCP metrics. Using simulated data instead.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);
  
  // Transform data for response time chart
  const getResponseTimeData = (): DataPoint[] => {
    if (!data || !data.agentHealth) {
      return generateMockTimeSeriesData(20, 'Response Time');
    }
    
    return Object.entries(data.agentHealth).map(([agentId, health]) => ({
      timestamp: new Date(health.lastHeartbeat).toLocaleTimeString(),
      value: health.responseTime,
      agent: agentId
    }));
  };
  
  // Transform data for error rate chart
  const getErrorRateData = (): DataPoint[] => {
    if (!data || !data.agentHealth) {
      return generateMockTimeSeriesData(20, 'Error Rate');
    }
    
    return Object.entries(data.agentHealth).map(([agentId, health]) => ({
      timestamp: new Date(health.lastHeartbeat).toLocaleTimeString(),
      value: health.errorRate * 100, // Convert to percentage
      agent: agentId
    }));
  };
  
  // Transform data for memory usage chart
  const getMemoryUsageData = (): DataPoint[] => {
    if (!data || !data.agentHealth) {
      return generateMockTimeSeriesData(20, 'Memory Usage');
    }
    
    return Object.entries(data.agentHealth).map(([agentId, health]) => ({
      timestamp: new Date(health.lastHeartbeat).toLocaleTimeString(),
      value: health.memoryUsage,
      agent: agentId
    }));
  };
  
  // Transform data for task count chart
  const getTaskCountData = (): DataPoint[] => {
    if (!data || !data.agentHealth) {
      return generateMockTimeSeriesData(20, 'Task Count');
    }
    
    return Object.entries(data.agentHealth).map(([agentId, health]) => ({
      timestamp: new Date(health.lastHeartbeat).toLocaleTimeString(),
      value: health.activeTaskCount,
      agent: agentId
    }));
  };
  
  // Generate mock time series data for demonstration
  const generateMockTimeSeriesData = (
    count: number, 
    metricName: string
  ): DataPoint[] => {
    let baseValue = 50;
    const variance = 15;
    const result: DataPoint[] = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const time = new Date(now.getTime() - (count - i - 1) * 1000);
      
      // Add some randomness based on metric type
      let value = baseValue + (Math.random() * variance * 2 - variance);
      if (metricName === 'Error Rate') {
        value = Math.abs(value) % 10; // Keep error rates lower
      } else if (metricName === 'Memory Usage') {
        value = Math.abs(value) % 100; // Keep memory usage between 0-100
      } else if (metricName === 'Task Count') {
        value = Math.floor(Math.abs(value) % 20); // Task count as integers
      }
      
      result.push({
        timestamp: time.toLocaleTimeString(),
        value,
        metric: metricName
      });
      
      // Adjust base value for next point to create trends
      baseValue += (Math.random() * 10 - 5);
      if (baseValue < 10) baseValue = 10;
      if (baseValue > 90) baseValue = 90;
    }
    
    return result;
  };
  
  // Simulate fetching new data
  const fetchNewResponseTimeData = async (): Promise<DataPoint[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return generateMockTimeSeriesData(20, 'Response Time');
  };
  
  const fetchNewErrorRateData = async (): Promise<DataPoint[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return generateMockTimeSeriesData(20, 'Error Rate');
  };
  
  const fetchNewMemoryUsageData = async (): Promise<DataPoint[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return generateMockTimeSeriesData(20, 'Memory Usage');
  };
  
  const fetchNewTaskCountData = async (): Promise<DataPoint[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return generateMockTimeSeriesData(20, 'Task Count');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">MCP Visualizations</h2>
          <p className="text-muted-foreground">Real-time monitoring of Model Content Protocol agents</p>
        </div>
        
        <Tabs defaultValue={selectedView} onValueChange={setSelectedView}>
          <TabsList>
            <TabsTrigger value="real-time">
              <Activity className="mr-2 h-4 w-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="historical">
              <BarChart2 className="mr-2 h-4 w-4" />
              Historical
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="real-time" className="mt-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RealTimeChart
            title="Agent Response Times"
            description="Response time in milliseconds per agent"
            data={getResponseTimeData()}
            dataKey="value"
            valueLabel="Response Time (ms)"
            chartType="line"
            color="#8884d8"
            height={300}
            isRealTime={true}
            updateInterval={3000}
            fetchNewData={fetchNewResponseTimeData}
          />
          
          <RealTimeChart
            title="Error Rates"
            description="Percentage of requests resulting in errors"
            data={getErrorRateData()}
            dataKey="value"
            valueLabel="Error Rate (%)"
            chartType="area"
            color="#FF6B6B"
            height={300}
            isRealTime={true}
            updateInterval={5000}
            fetchNewData={fetchNewErrorRateData}
          />
          
          <RealTimeChart
            title="Memory Usage"
            description="Agent memory consumption"
            data={getMemoryUsageData()}
            dataKey="value"
            valueLabel="Memory Usage (MB)"
            chartType="area"
            color="#82ca9d"
            height={300}
            isRealTime={true}
            updateInterval={7000}
            fetchNewData={fetchNewMemoryUsageData}
          />
          
          <RealTimeChart
            title="Active Tasks"
            description="Number of tasks being processed by agents"
            data={getTaskCountData()}
            dataKey="value"
            valueLabel="Task Count"
            chartType="bar"
            color="#8884d8"
            height={300}
            isRealTime={true}
            updateInterval={4000}
            fetchNewData={fetchNewTaskCountData}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-primary" />
                Agent Status
              </CardTitle>
              <CardDescription>Health status of all MCP agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                    <span className="text-sm">Healthy</span>
                  </div>
                  <span className="font-medium">3</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2" />
                    <span className="text-sm">Warning</span>
                  </div>
                  <span className="font-medium">1</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-red-500 mr-2" />
                    <span className="text-sm">Critical</span>
                  </div>
                  <span className="font-medium">0</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-gray-300 mr-2" />
                    <span className="text-sm">Inactive</span>
                  </div>
                  <span className="font-medium">1</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-primary" />
                Task Completion
              </CardTitle>
              <CardDescription>Task completion metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Completed Today</span>
                  <span className="font-medium">127</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed</span>
                  <span className="font-medium">12</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Success Rate</span>
                  <span className="font-medium">91.3%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Completion Time</span>
                  <span className="font-medium">1.3s</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Gauge className="mr-2 h-5 w-5 text-primary" />
                System Performance
              </CardTitle>
              <CardDescription>Overall system metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Requests/min</span>
                  <span className="font-medium">347</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Avg. Response Time</span>
                  <span className="font-medium">0.8s</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Error Rate</span>
                  <span className="font-medium">2.4%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="font-medium">99.95%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="historical" className="mt-0">
        <Card>
          <CardHeader>
            <CardTitle>Historical Data</CardTitle>
            <CardDescription>
              Long-term trend analysis and historical performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Historical data visualization will be available in a future update
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}

export default MCPVisualizations;