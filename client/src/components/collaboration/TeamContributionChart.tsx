import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TeamContributionChartProps {
  data: {
    name: string;
    contributions: number;
    color?: string;
  }[];
  title?: string;
  description?: string;
}

const TeamContributionChart: React.FC<TeamContributionChartProps> = ({ 
  data, 
  title = "Team Contributions", 
  description = "Chart showing the number of activities by each team member"
}) => {
  // Ensure we have data to display
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No team contribution data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort data by contributions (highest first)
  const sortedData = [...data].sort((a, b) => b.contributions - a.contributions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 45,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => [`${value} activities`, 'Contributions']}
              labelFormatter={(value) => `User: ${value}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              dataKey="contributions" 
              name="Activities" 
              fill="#4f46e5" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TeamContributionChart;