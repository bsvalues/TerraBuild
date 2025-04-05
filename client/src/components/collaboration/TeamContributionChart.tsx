import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TeamContributionChartProps {
  activities: any[];
  members: any[];
}

interface ContributionEntry {
  name: string;
  userId: number;
  value: number;
  role: string;
}

const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c', 
  '#d0ed57', '#ffc658', '#ff8c42', '#f78fb3', '#cf6cc9'
];

const TeamContributionChart: React.FC<TeamContributionChartProps> = ({ activities, members }) => {
  // Process data to count contributions by each team member
  const contributionData = useMemo(() => {
    if (!activities || !members) return [];

    // Create a map of user IDs to counts
    const userContributions = activities.reduce((acc, activity) => {
      const userId = activity.userId;
      if (!userId) return acc;
      
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Map to chart format and sort by contributions (descending)
    return members
      .map(member => ({
        name: member.user?.name || member.user?.username || `User ${member.userId}`,
        userId: member.userId,
        value: userContributions[member.userId] || 0,
        role: member.role
      }))
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 10); // Take top 10 contributors
  }, [activities, members]);

  if (!contributionData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Contributions</CardTitle>
          <CardDescription>No contribution data available yet</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          Team activity will appear here when members contribute to the project
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Contributions</CardTitle>
        <CardDescription>Activities by team members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={contributionData}
              margin={{ top: 5, right: 20, left: 0, bottom: 65 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [`${value} activities`, 'Contributions']}
                labelFormatter={(name) => `Member: ${name}`}
              />
              <Bar dataKey="value">
                {contributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamContributionChart;