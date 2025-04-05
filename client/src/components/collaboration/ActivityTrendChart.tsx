import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart,
  Area
} from 'recharts';
import { Activity, BarChart } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

interface ActivityType {
  id: number;
  projectId: number;
  userId: number;
  type: string;
  createdAt: string;
  data?: Record<string, any>;
}

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityTrendChartProps {
  // Support both direct data prop and activities prop
  data?: ActivityData[];
  activities?: ActivityType[];
  title?: string;
  description?: string;
  days?: number;
}

export default function ActivityTrendChart({
  data: externalData,
  activities = [],
  title = "Activity Trends",
  description = "Project activity over time",
  days = 14
}: ActivityTrendChartProps) {
  
  // Generate trend data from activities if external data not provided
  const data = useMemo(() => {
    if (externalData) return externalData;
    
    if (activities.length > 0) {
      // Get the date range (last N days)
      const today = new Date();
      const dateMap: Record<string, number> = {};
      
      // Initialize the date range with zeros
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(today, i);
        const formattedDate = format(date, 'yyyy-MM-dd');
        dateMap[formattedDate] = 0;
      }
      
      // Count activities per day
      activities.forEach(activity => {
        if (!activity.createdAt) return;
        
        const date = format(parseISO(activity.createdAt), 'yyyy-MM-dd');
        if (dateMap[date] !== undefined) {
          dateMap[date] += 1;
        }
      });
      
      // Convert to array format for chart
      return Object.entries(dateMap).map(([date, count]) => ({
        date,
        count,
        // Format date for display
        displayDate: format(parseISO(date), 'MMM d')
      }));
    }
    
    return [];
  }, [externalData, activities, days]);

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dateStr = payload[0].payload.date;
      const formattedDate = format(parseISO(dateStr), 'MMM d, yyyy');
      
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <p className="font-medium">{formattedDate}</p>
          <p>
            <span className="font-medium">Activities:</span> {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No activity data available</p>
            <p className="text-sm">Activity trends will appear here as project activities are recorded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BarChart className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              width={500}
              height={300}
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fontSize: 12 }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3B82F6" 
                fill="#93C5FD"
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}