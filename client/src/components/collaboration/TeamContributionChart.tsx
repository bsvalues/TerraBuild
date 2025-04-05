import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRound } from 'lucide-react';

export interface TeamContributionData {
  userId: number;
  userName: string;
  count: number;
}

interface TeamContributionChartProps {
  data?: TeamContributionData[];
  isLoading?: boolean;
  title?: string;
  description?: string;
  className?: string;
  useProjectColors?: boolean;
  // Added new props to work with SharedProjectDashboardPage
  activities?: any[];
  members?: any[];
}

export default function TeamContributionChart({
  data = [],
  isLoading = false,
  title = 'Team Contributions',
  description = 'Activity distribution across team members',
  className = '',
  useProjectColors = false,
  activities = [],
  members = []
}: TeamContributionChartProps) {
  // Generate team contribution data from activities and members if data is empty
  const contributionData = useMemo(() => {
    if (data.length > 0) return data;
    
    if (activities.length === 0 || members.length === 0) return [];
    
    // Count activities by user
    const activityByUser: Record<number, number> = {};
    activities.forEach(activity => {
      if (activity.userId) {
        activityByUser[activity.userId] = (activityByUser[activity.userId] || 0) + 1;
      }
    });
    
    // Convert to TeamContributionData format
    return Object.entries(activityByUser).map(([userId, count]) => {
      const member = members.find(m => m.userId === Number(userId));
      const userName = member 
        ? member.user?.name || member.user?.username || `User ${userId}`
        : `User ${userId}`;
      
      return {
        userId: Number(userId),
        userName,
        count
      };
    });
  }, [data, activities, members]);
  
  // Sort data by count descending
  const sortedData = useMemo(() => {
    return [...contributionData].sort((a, b) => b.count - a.count);
  }, [contributionData]);

  // Define Benton County theme colors for the bars
  const colors = useProjectColors ? 
    ['#33A4CB', '#47AD55', '#243E4D', '#FFD23F', '#D4770D'] :
    ['#33A4CB', '#33A4CB', '#33A4CB', '#33A4CB', '#33A4CB']; 

  // Format user names to handle long names
  const formattedData = useMemo(() => {
    return sortedData.map(item => ({
      ...item,
      // Truncate names that are too long
      formattedName: item.userName.length > 15 
        ? `${item.userName.substring(0, 12)}...` 
        : item.userName
    }));
  }, [sortedData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded shadow-sm">
          <p className="font-medium">{data.userName}</p>
          <p className="text-sm text-muted-foreground">
            {data.count} {data.count === 1 ? 'activity' : 'activities'}
          </p>
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
          <UserRound className="h-12 w-12 text-muted-foreground/60 mb-3" />
          <p className="text-muted-foreground font-medium">No team activity data available</p>
          <p className="text-muted-foreground/70 text-sm">
            Activity data will be shown when team members interact with the project
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
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="formattedName" 
              width={100}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" barSize={20} radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}