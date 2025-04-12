/**
 * MCP Visualizations Page
 * 
 * This page provides a comprehensive dashboard for real-time visualizations
 * of the Model Content Protocol (MCP) system performance and metrics.
 */

import React, { useState } from 'react';
import { Link } from 'wouter';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import MCPVisualizations from '@/components/visualizations/MCPVisualizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Activity, 
  BarChart2, 
  BrainCircuit, 
  MessageSquare,
  Settings, 
  RefreshCw,
  Download,
  Share2
} from 'lucide-react';

export default function MCPVisualizationsPage() {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };
  
  return (
    <LayoutWrapper>
      <MainContent title="MCP Visualizations">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">MCP Visualizations</h1>
            <p className="text-muted-foreground">
              Real-time monitoring dashboard for Model Content Protocol metrics
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/mcp-overview">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                MCP Overview
              </Button>
            </Link>
            
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Button variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard">
              <Activity className="mr-2 h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="agents">
              <BrainCircuit className="mr-2 h-4 w-4" />
              Agent Performance
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart2 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Visualization Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="mt-0">
            <MCPVisualizations />
          </TabsContent>
          
          <TabsContent value="agents" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>
                  Detailed performance metrics for individual MCP agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Agent performance visualization will be available in a future update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Advanced analytics and ML-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <BarChart2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Advanced analytics will be available in a future update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Visualization Settings</CardTitle>
                <CardDescription>
                  Customize your visualization experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Data Refresh Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Auto-refresh interval</span>
                          <select className="border rounded-md px-2 py-1 text-sm">
                            <option>3 seconds</option>
                            <option>5 seconds</option>
                            <option>10 seconds</option>
                            <option>30 seconds</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Data windows</span>
                          <select className="border rounded-md px-2 py-1 text-sm">
                            <option>Last 10 points</option>
                            <option>Last 20 points</option>
                            <option>Last 50 points</option>
                            <option>All data</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Chart Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Default chart type</span>
                          <select className="border rounded-md px-2 py-1 text-sm">
                            <option>Line</option>
                            <option>Area</option>
                            <option>Bar</option>
                          </select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Color scheme</span>
                          <select className="border rounded-md px-2 py-1 text-sm">
                            <option>Default</option>
                            <option>Monochrome</option>
                            <option>Vibrant</option>
                            <option>Pastels</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Display Options</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input type="checkbox" id="show-grid" className="mr-2" checked readOnly />
                          <label htmlFor="show-grid" className="text-sm">Show grid lines</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="show-tooltips" className="mr-2" checked readOnly />
                          <label htmlFor="show-tooltips" className="text-sm">Show tooltips</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="show-legend" className="mr-2" checked readOnly />
                          <label htmlFor="show-legend" className="text-sm">Show legend</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="animated" className="mr-2" checked readOnly />
                          <label htmlFor="animated" className="text-sm">Animated transitions</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-3">Data Options</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input type="checkbox" id="use-real-data" className="mr-2" checked readOnly />
                          <label htmlFor="use-real-data" className="text-sm">Use real-time data when available</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="show-min-max" className="mr-2" checked readOnly />
                          <label htmlFor="show-min-max" className="text-sm">Show min/max indicators</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="aggregate" className="mr-2" />
                          <label htmlFor="aggregate" className="text-sm">Aggregate data points (averaging)</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input type="checkbox" id="interpolate" className="mr-2" />
                          <label htmlFor="interpolate" className="text-sm">Interpolate missing values</label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button>Save Settings</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MainContent>
    </LayoutWrapper>
  );
}