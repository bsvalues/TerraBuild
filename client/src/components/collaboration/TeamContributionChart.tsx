import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from 'recharts';
import { Loader2, Users } from 'lucide-react';

interface ActivityType {
  id: number;
  projectId: number;
  userId: number;
  type: string;
  createdAt: string;
  data?: Record<string, any>;
}

interface MemberType {
  id: number;
  projectId: number;
  userId: number;
  role: string;
  user?: {
    id: number;
    name?: string;
    username?: string;
  };
}

interface ContributionData {
  name: string;
  contributions: number;
  color?: string;
}

interface TeamContributionChartProps {
  // Support both direct data prop and activities+members props
  data?: ContributionData[];
  // Or allow passing raw activities and members for processing
  activities?: ActivityType[];
  members?: MemberType[];
  title?: string;
  description?: string;
}

export default function TeamContributionChart({
  data: externalData,
  activities = [],
  members = [],
  title = "Team Contributions",
  description = "Number of contributions by team member"
}: TeamContributionChartProps) {
  
  // Generate contribution data from activities and members if external data not provided
  const data = useMemo(() => {
    if (externalData) return externalData;
    
    // If we have both activities and members, generate the data
    if (activities.length > 0 && members.length > 0) {
      // Group activities by user ID
      const userContributions = activities.reduce((acc: Record<number, number>, activity) => {
        acc[activity.userId] = (acc[activity.userId] || 0) + 1;
        return acc;
      }, {});
      
      // Map to the format needed for the chart
      const chartData: ContributionData[] = members.map((member) => {
        // Get member name
        const memberName = member.user?.name || 
                          member.user?.username || 
                          `User ${member.userId}`;
        
        // Set color based on role
        let color;
        switch (member.role) {
          case 'owner':
            color = '#8B5CF6'; // Purple
            break;
          case 'admin':
            color = '#EF4444'; // Red
            break;
          case 'editor':
            color = '#3B82F6'; // Blue
            break;
          default:
            color = '#6B7280'; // Gray
        }
        
        return {
          name: memberName,
          contributions: userContributions[member.userId] || 0,
          color
        };
      });
      
      // Sort by number of contributions (descending)
      return chartData.sort((a, b) => b.contributions - a.contributions);
    }
    
    // Fallback to empty array if no data
    return [];
  }, [externalData, activities, members]);
  
  // Generate colors for bars
  const getBarColor = (entry: ContributionData) => entry.color || '#3B82F6';
  
  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-xs">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p>
            <span className="font-medium">Contributions:</span> {payload[0].value}
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
            <Users className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No contribution data available</p>
            <p className="text-sm">Activity data will appear here once team members start contributing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              width={500}
              height={300}
              data={data}
              layout="vertical"
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="contributions" 
                fill="#3B82F6" 
                radius={[0, 4, 4, 0]}
                barSize={20}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
                ))}
                <LabelList dataKey="contributions" position="right" style={{ fill: '#6B7280', fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}