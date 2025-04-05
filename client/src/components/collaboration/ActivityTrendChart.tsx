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
}

export default function ActivityTrendChart({
  data = [],
  isLoading = false,
  title = 'Activity Trend',
  description = 'Project activity over time',
  className = '',
  showByType = false,
  timeRange = 'week'
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

  // Process data to fit date range and aggregate by type if needed
  const processedData = useMemo(() => {
    // Create a map of dates to counts
    const dateMap = new Map(dateRange.map(d => [d.date, { ...d }]));
    
    // If showing by type, we need to track activity types
    const typeMap = new Map();
    
    // Process each data point
    data.forEach(item => {
      try {
        const date = item.date.split('T')[0]; // Get YYYY-MM-DD part
        if (dateMap.has(date)) {
          const entry = dateMap.get(date);
          entry.count += item.count;
          
          // Track by type if needed
          if (showByType && item.type) {
            if (!entry[item.type]) {
              entry[item.type] = 0;
            }
            entry[item.type] += item.count;
            typeMap.set(item.type, true);
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
  }, [data, dateRange, showByType]);

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
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p 
              key={index} 
              className="text-sm" 
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.value} {entry.value === 1 ? 'activity' : 'activities'}
            </p>
          ))}
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

  if (data.length === 0) {
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