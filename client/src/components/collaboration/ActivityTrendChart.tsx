import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartBarIcon } from 'lucide-react';
import { format, parseISO, subDays, isValid } from 'date-fns';

export interface ActivityData {
  date: string; // ISO date string
  count: number;
  type?: string;
}

interface ActivityTrendChartProps {
  data?: ActivityData[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  className?: string;
  showByType?: boolean; // If true, show lines for each activity type
  timeRange?: 'week' | 'month' | 'year'; // Time range to display
  // Added typed prop to work with SharedProjectDashboardPage
  activities?: {
    id: number;
    userId: number;
    createdAt: string | Date;
    type: string;
    data?: any;
  }[];
}

export default function ActivityTrendChart({
  data = [],
  isLoading = false,
  title = 'Activity Trend',
  description = 'Project activity over time',
  className = '',
  showByType = false,
  timeRange = 'week',
  activities = []
}: ActivityTrendChartProps) {
  // Generate date range for the chart
  const dateRange = useMemo(() => {
    const today = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const range = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(today, i);
      range.push({
        date: format(date, 'yyyy-MM-dd'),
        displayDate: format(date, 'MMM dd'),
        count: 0
      });
    }
    
    return range;
  }, [timeRange]);

  // Generate activity data from activities prop if data is empty
  const activityData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    
    if (!Array.isArray(activities) || activities.length === 0) return [];
    
    // Convert activities to ActivityData format with improved error handling
    return activities.map(activity => {
      let date;
      try {
        date = activity.createdAt ? 
          (typeof activity.createdAt === 'string' ? 
            activity.createdAt : 
            new Date(activity.createdAt).toISOString())
          : new Date().toISOString();
          
        // Validate date format
        if (!date.includes('T')) {
          // Add time component if missing
          date = `${date}T00:00:00.000Z`;
        }
        
        // Check if valid ISO format, if not use current date
        if (!isValid(parseISO(date))) {
          date = new Date().toISOString();
        }
      } catch (error) {
        // Fallback to current date if there's an error parsing
        console.error('Error parsing date:', error);
        date = new Date().toISOString();
      }
      
      return {
        date,
        count: 1,
        type: activity && activity.type ? activity.type : 'unknown'
      };
    });
  }, [data, activities]);
  
  // Process data to fit date range and aggregate by type if needed
  const processedData = useMemo(() => {
    // If no data or invalid data, return empty structure
    if (!Array.isArray(activityData) || activityData.length === 0) {
      return { chartData: [], types: [] };
    }
    
    // Create a map of dates to counts
    const dateMap = new Map(dateRange.map(d => [d.date, { ...d }]));
    
    // If showing by type, we need to track activity types
    const typeMap = new Map();
    
    // Process each data point with improved error handling
    activityData.forEach(item => {
      try {
        if (!item || !item.date) return;
        
        const date = typeof item.date === 'string' ? 
          item.date.split('T')[0] : // Get YYYY-MM-DD part
          new Date().toISOString().split('T')[0]; // Fallback to today
          
        if (dateMap.has(date)) {
          const entry = dateMap.get(date);
          if (entry) {
            entry.count += item.count || 1; // Default to 1 if count is undefined
            
            // Track by type if needed
            if (showByType && item.type) {
              // Use type-safe indexing with a type assertion
              const typedEntry = entry as Record<string, any>;
              if (!typedEntry[item.type]) {
                typedEntry[item.type] = 0;
              }
              typedEntry[item.type] += item.count || 1;
              typeMap.set(item.type, true);
            }
          }
        }
      } catch (error) {
        console.error('Error processing activity data:', error);
      }
    });
    
    return {
      chartData: Array.from(dateMap.values()),
      types: Array.from(typeMap.keys())
    };
  }, [activityData, dateRange, showByType]);

  // Define Benton County theme colors for the chart
  const colors = {
    primary: '#33A4CB',
    secondary: '#47AD55',
    accent: '#243E4D',
    highlight: '#FFD23F',
    warning: '#D4770D'
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{label || 'No date'}</p>
          {payload.map((entry: any, index: number) => {
            if (!entry) return null;
            
            const value = entry.value || 0;
            return (
              <p 
                key={index} 
                className="text-sm" 
                style={{ color: entry.color }}
              >
                {entry.name || 'Activity'}: {value} {value === 1 ? 'activity' : 'activities'}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-2/3 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activityData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <ChartBarIcon className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <p className="text-muted-foreground font-medium">No activity data available</p>
          <p className="text-muted-foreground/70 text-sm">
            Activity data will be shown as project members interact with the project
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processedData.chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              allowDecimals={false}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showByType ? (
              <>
                {processedData.types.map((type, index) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={type}
                    stroke={Object.values(colors)[index % Object.values(colors).length]}
                    activeDot={{ r: 8 }}
                  />
                ))}
                <Legend />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="count"
                name="Activities"
                stroke={colors.primary}
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}