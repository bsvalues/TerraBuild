import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProjectMember } from '@/contexts/ProjectContext';

type ActivityData = {
  userId: number;
  type: string;
  data?: any;
  createdAt: string | Date;
}

interface ChartProps {
  activities: ActivityData[];
  members: ProjectMember[];
  className?: string;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background p-3 border rounded-md shadow-md">
        <p className="font-medium text-sm">{data.name}</p>
        <p className="text-muted-foreground text-xs">
          {data.value} activities ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#A4DE6C', '#D0ED57', '#FFC658', '#8DD1E1'
];

const TeamContributionChart: React.FC<ChartProps> = ({ activities, members, className = '' }) => {
  // Process data for the chart
  const data = useMemo(() => {
    if (!activities || !activities.length || !members || !members.length) {
      return [];
    }

    // Count activities by user
    const activityByUser: Record<number, number> = {};
    activities.forEach(activity => {
      if (activity.userId) {
        activityByUser[activity.userId] = (activityByUser[activity.userId] || 0) + 1;
      }
    });

    // Get user names and format data for the chart
    const totalActivities = activities.length;
    return Object.entries(activityByUser).map(([userId, count]) => {
      const userIdNum = Number(userId);
      const member = members.find(m => m.userId === userIdNum);
      const name = member 
        ? (member.user?.name || member.user?.username || `User ${userId}`) 
        : `User ${userId}`;
      
      // Truncate long names
      const displayName = name.length > 15 ? name.substring(0, 12) + '...' : name;
      
      return {
        name: displayName,
        fullName: name, // Store full name for tooltip
        value: count,
        userId: userIdNum,
        percentage: Math.round((count / totalActivities) * 100)
      };
    }).sort((a, b) => b.value - a.value); // Sort by contribution count
  }, [activities, members]);

  // Show empty state if no data
  if (!data.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Team Contributions</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground">No activity data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Team Contributions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry: any) => (
                  <span className="text-xs">
                    {value} ({entry.payload.percentage}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamContributionChart;