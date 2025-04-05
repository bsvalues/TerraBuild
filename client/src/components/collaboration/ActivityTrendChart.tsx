import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format, subDays, parseISO, isAfter, startOfDay } from 'date-fns';

interface ActivityTrendChartProps {
  activities: any[];
}

// Map of activity types to display names and colors
const ACTIVITY_TYPES: Record<string, { label: string; color: string }> = {
  PROJECT_CREATED: { label: 'Project Created', color: '#8884d8' },
  PROJECT_UPDATED: { label: 'Project Updated', color: '#82ca9d' },
  MEMBER_ADDED: { label: 'Member Added', color: '#ffc658' },
  MEMBER_REMOVED: { label: 'Member Removed', color: '#ff8042' },
  ITEM_ADDED: { label: 'Item Added', color: '#0088fe' },
  ITEM_REMOVED: { label: 'Item Removed', color: '#ff8042' },
  COMMENT_ADDED: { label: 'Comment Added', color: '#00C49F' },
  TASK_CREATED: { label: 'Task Created', color: '#FFBB28' },
  TASK_COMPLETED: { label: 'Task Completed', color: '#FF8042' }
};

const ActivityTrendChart: React.FC<ActivityTrendChartProps> = ({ activities }) => {
  // Generate data for the chart
  const chartData = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    // Get the date range - last 30 days
    const today = startOfDay(new Date());
    const dateRange: Date[] = Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i));
    
    // Initialize the data structure with zeros for all activity types
    const dataByDate = dateRange.map(date => {
      const formattedDate = format(date, 'MMM dd');
      const data: Record<string, any> = { date: formattedDate, fullDate: date };
      
      // Initialize all activity types to 0
      Object.keys(ACTIVITY_TYPES).forEach(type => {
        data[type] = 0;
      });
      
      return data;
    });
    
    // Count activities by type and date
    activities.forEach(activity => {
      if (!activity.createdAt) return;
      
      const activityDate = typeof activity.createdAt === 'string' 
        ? parseISO(activity.createdAt) 
        : activity.createdAt;
      
      // Only include activities within the last 30 days
      if (!isAfter(activityDate, subDays(today, 30))) return;
      
      // Find the corresponding date entry
      const dateIndex = dataByDate.findIndex(entry => 
        format(entry.fullDate, 'yyyy-MM-dd') === format(activityDate, 'yyyy-MM-dd')
      );
      
      if (dateIndex !== -1 && activity.type) {
        // Increment the count for this activity type on this date
        dataByDate[dateIndex][activity.type] = (dataByDate[dateIndex][activity.type] || 0) + 1;
      }
    });

    // Remove the fullDate property as it's no longer needed and isn't serializable for recharts
    return dataByDate.map(({ fullDate, ...rest }) => rest);
  }, [activities]);

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
          <CardDescription>No activity data available yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Activity trends will appear here as your team uses the project
        </CardContent>
      </Card>
    );
  }

  // Determine which activity types have data
  const activeTypes = Object.keys(ACTIVITY_TYPES).filter(type => 
    chartData.some(entry => entry[type] > 0)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Trends</CardTitle>
        <CardDescription>Project activity over the last 30 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {activeTypes.map(type => (
                <Line
                  key={type}
                  type="monotone"
                  dataKey={type}
                  name={ACTIVITY_TYPES[type]?.label || type}
                  stroke={ACTIVITY_TYPES[type]?.color || '#000'}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityTrendChart;