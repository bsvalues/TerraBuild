import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format, subDays, isAfter, subMonths, subYears, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

type ActivityData = {
  userId: number;
  type: string;
  data?: any;
  createdAt: string | Date;
}

interface ActivityTrendChartProps {
  activities: ActivityData[];
  className?: string;
}

// Defines the time range for the chart
type TimeRange = 'week' | 'month' | 'year';

const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({ activities, className = '' }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  // Group activities by date and type
  const chartData = useMemo(() => {
    if (!activities || !activities.length) {
      return [];
    }

    let startDate;
    const now = new Date();
    
    // Determine the start date based on the selected time range
    switch (timeRange) {
      case 'week':
        startDate = subDays(now, 7);
        break;
      case 'month':
        startDate = subMonths(now, 1);
        break;
      case 'year':
        startDate = subYears(now, 1);
        break;
      default:
        startDate = subDays(now, 7);
    }
    
    // Filter activities within the selected time range
    const filteredActivities = activities.filter(activity => {
      const activityDate = typeof activity.createdAt === 'string' 
        ? parseISO(activity.createdAt) 
        : activity.createdAt;
      return isAfter(activityDate, startDate);
    });
    
    // Count activities per day and per type
    const dailyActivityCounts: Record<string, Record<string, number>> = {};
    
    filteredActivities.forEach(activity => {
      const activityDate = typeof activity.createdAt === 'string' 
        ? parseISO(activity.createdAt) 
        : activity.createdAt;
      
      // Format date based on time range
      let formattedDate;
      if (timeRange === 'week') {
        formattedDate = format(activityDate, 'EEE');
      } else if (timeRange === 'month') {
        formattedDate = format(activityDate, 'MMM dd');
      } else {
        formattedDate = format(activityDate, 'MMM');
      }
      
      // Initialize counts for this date if not exists
      if (!dailyActivityCounts[formattedDate]) {
        dailyActivityCounts[formattedDate] = {};
      }
      
      // Initialize counts for this activity type if not exists
      const activityType = activity.type || 'general';
      if (!dailyActivityCounts[formattedDate][activityType]) {
        dailyActivityCounts[formattedDate][activityType] = 0;
      }
      
      // Increment count
      dailyActivityCounts[formattedDate][activityType]++;
    });
    
    // Convert to array format for the chart
    const uniqueActivityTypes = new Set<string>();
    
    // First collect all activity types
    Object.values(dailyActivityCounts).forEach(dayData => {
      Object.keys(dayData).forEach(type => uniqueActivityTypes.add(type));
    });
    
    // Then create data points with all types represented (even if 0)
    const result = Object.entries(dailyActivityCounts).map(([date, counts]) => {
      const dataPoint: Record<string, any> = { date };
      
      // Ensure all activity types are represented
      uniqueActivityTypes.forEach(type => {
        dataPoint[type] = counts[type] || 0;
      });
      
      // Add total count
      dataPoint.total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      
      return dataPoint;
    });
    
    // Sort by date
    return result.sort((a, b) => a.date.localeCompare(b.date));
  }, [activities, timeRange]);
  
  // Get unique activity types for the legend
  const activityTypes = useMemo(() => {
    if (!chartData.length) return [];
    
    // Get all property names except 'date' and 'total'
    const firstDataPoint = chartData[0];
    return Object.keys(firstDataPoint).filter(key => key !== 'date' && key !== 'total');
  }, [chartData]);
  
  // Define colors for the different activity types
  const typeColors: Record<string, string> = {
    comment: '#8884d8',
    edit: '#82ca9d',
    upload: '#ffc658',
    share: '#ff8042',
    review: '#0088FE',
    export: '#00C49F',
    general: '#FFBB28',
  };
  
  // Show empty state if no data
  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No activity data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle>Activity Trends</CardTitle>
        <div className="flex items-center justify-between pt-2">
          <Tabs
            defaultValue="week"
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
            className="w-[240px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs
            defaultValue="line"
            value={chartType}
            onValueChange={(value) => setChartType(value as 'line' | 'bar')}
            className="w-[160px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="bar">Bar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {activityTypes.map((type) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={typeColors[type] || '#8884d8'}
                    activeDot={{ r: 8 }}
                    name={type.charAt(0).toUpperCase() + type.slice(1)}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {activityTypes.map((type) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    fill={typeColors[type] || '#8884d8'}
                    name={type.charAt(0).toUpperCase() + type.slice(1)}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTrendChart;