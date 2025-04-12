/**
 * Real-Time Chart Component
 * 
 * Provides real-time data visualization with auto-updating capabilities
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PauseCircle, PlayCircle, RefreshCw, Download, Clock, Settings } from 'lucide-react';

export type ChartType = 'line' | 'area' | 'bar';
export type DataPoint = { timestamp: string; value: number; [key: string]: any };

interface RealTimeChartProps {
  title: string;
  description?: string;
  data: DataPoint[];
  dataKey: string;
  xAxisKey?: string;
  valueLabel?: string;
  chartType?: ChartType;
  color?: string;
  secondaryColor?: string;
  height?: number;
  isRealTime?: boolean;
  updateInterval?: number;
  fetchNewData?: () => Promise<DataPoint[]>;
  showControls?: boolean;
}

export function RealTimeChart({
  title,
  description,
  data: initialData,
  dataKey,
  xAxisKey = 'timestamp',
  valueLabel = 'Value',
  chartType = 'line',
  color = '#8884d8',
  secondaryColor = '#82ca9d',
  height = 300,
  isRealTime = true,
  updateInterval = 3000,
  fetchNewData,
  showControls = true
}: RealTimeChartProps) {
  // State for chart data and controls
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [activeChart, setActiveChart] = useState<ChartType>(chartType);
  const [isPaused, setIsPaused] = useState(false);
  const [updateSpeed, setUpdateSpeed] = useState(updateInterval);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  // Interval reference for cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mock data update function if none provided
  const updateData = async () => {
    if (isPaused) return;
    
    setIsLoading(true);
    
    try {
      if (fetchNewData) {
        // Use provided data fetching function
        const newData = await fetchNewData();
        setData(newData);
      } else {
        // Generate mock data for demo purposes
        const now = new Date();
        const newPoint = {
          timestamp: now.toLocaleTimeString(),
          value: Math.floor(Math.random() * 100)
        };
        
        // Keep a sliding window of data points
        setData(prev => [...prev.slice(-19), newPoint]);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up real-time data updates with adjustable interval
  useEffect(() => {
    if (!isRealTime) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set new interval if not paused
    if (!isPaused) {
      intervalRef.current = setInterval(updateData, updateSpeed);
    }
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRealTime, isPaused, updateSpeed]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    updateData();
  };
  
  // Export chart data
  const exportData = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {isRealTime && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Real-time
            </Badge>
          )}
        </div>
      </CardHeader>
      
      {showControls && (
        <div className="px-6">
          <Tabs defaultValue={activeChart} onValueChange={(value) => setActiveChart(value as ChartType)}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="area">Area</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-8 w-8"
                >
                  {isPaused ? (
                    <PlayCircle className="h-4 w-4" />
                  ) : (
                    <PauseCircle className="h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleRefresh}
                  className="h-8 w-8"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={exportData}
                  className="h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="h-[${height}px] mt-4">
              <TabsContent value="line" className="mt-0 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={dataKey} 
                      name={valueLabel}
                      stroke={color} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="area" className="mt-0 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey={dataKey} 
                      name={valueLabel}
                      stroke={color} 
                      fill={color} 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>
              
              <TabsContent value="bar" className="mt-0 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey={dataKey} 
                      name={valueLabel}
                      fill={color} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      )}
      
      {!showControls && (
        <CardContent>
          <div className="h-[${height}px]">
            {activeChart === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey={dataKey} 
                    name={valueLabel}
                    stroke={color} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {activeChart === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey={dataKey} 
                    name={valueLabel}
                    stroke={color} 
                    fill={color} 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            
            {activeChart === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={xAxisKey} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey={dataKey} 
                    name={valueLabel}
                    fill={color} 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      )}
      
      {showControls && (
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Update Speed:</span>
            <Select 
              value={updateSpeed.toString()} 
              onValueChange={(val) => setUpdateSpeed(parseInt(val))}
            >
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue placeholder="3000ms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1 second</SelectItem>
                <SelectItem value="3000">3 seconds</SelectItem>
                <SelectItem value="5000">5 seconds</SelectItem>
                <SelectItem value="10000">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-update" 
              checked={!isPaused} 
              onCheckedChange={() => setIsPaused(!isPaused)} 
            />
            <Label htmlFor="auto-update">Auto-update</Label>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default RealTimeChart;