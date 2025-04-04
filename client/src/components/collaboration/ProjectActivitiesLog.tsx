import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ActivitySquare,
  User,
  Users,
  UserPlus,
  FileText,
  Link,
  Share,
  Check,
  XCircle,
  MessageCircle,
  Loader2,
  RefreshCw,
  Clock,
  FileBarChart,
  FileSpreadsheet,
  Calculator,
  Pencil,
  Trash2,
  Eye,
  Settings,
  GlobeIcon
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ProjectActivity {
  id: number;
  projectId: number;
  userId: number;
  activityType: string;
  activityData: any;
  createdAt: string;
  user?: {
    id: number;
    name: string | null;
    username: string;
  };
}

interface ActivityIconProps {
  type: string;
  className?: string;
}

interface ProjectActivitiesLogProps {
  projectId: number;
  maxHeight?: string;
  limit?: number;
}

// Activity icon component
const ActivityIcon: React.FC<ActivityIconProps> = ({ type, className = "h-4 w-4" }) => {
  switch (type) {
    case 'member_added':
    case 'member_joined':
      return <UserPlus className={className} />;
    case 'member_removed':
      return <Users className={className} />;
    case 'member_role_changed':
      return <Settings className={className} />;
    case 'project_created':
      return <FileText className={className} />;
    case 'project_edited':
      return <Pencil className={className} />;
    case 'project_deleted':
      return <Trash2 className={className} />;
    case 'project_visibility_changed':
      return <GlobeIcon className={className} />;
    case 'link_created':
      return <Link className={className} />;
    case 'link_deleted':
      return <XCircle className={className} />;
    case 'comment_added':
      return <MessageCircle className={className} />;
    case 'item_added':
      return <Share className={className} />;
    case 'item_removed':
      return <Trash2 className={className} />;
    case 'calculation_created':
      return <Calculator className={className} />;
    case 'matrix_imported':
      return <FileSpreadsheet className={className} />;
    case 'report_generated':
      return <FileBarChart className={className} />;
    default:
      return <ActivitySquare className={className} />;
  }
};

// Format timestamp for display
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return formatDistanceToNow(date, { addSuffix: true });
  } else {
    return format(date, "MMM d, yyyy 'at' h:mm a");
  }
};

// Get appropriate badge variant for activity type
const getActivityBadgeVariant = (type: string): "default" | "outline" | "secondary" => {
  if (type.includes('removed') || type.includes('deleted')) {
    return "outline";
  } else if (type.includes('edited') || type.includes('changed')) {
    return "secondary";
  }
  return "default";
};

// Get initials for avatar
const getInitials = (name: string | null | undefined): string => {
  if (!name) return '?';
  
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

// Helper to get activity description
const getActivityDescription = (activity: ProjectActivity): string => {
  const { activityType, activityData, user } = activity;
  const userName = user?.name || user?.username || 'A user';
  
  switch (activityType) {
    case 'member_added':
      return `${userName} added ${activityData.targetUser} to the project`;
    case 'member_joined':
      return `${userName} joined the project`;
    case 'member_removed':
      return `${userName} removed ${activityData.targetUser} from the project`;
    case 'member_role_changed':
      return `${userName} changed ${activityData.targetUser}'s role to ${activityData.newRole}`;
    case 'project_created':
      return `${userName} created the project`;
    case 'project_edited':
      return `${userName} updated project details`;
    case 'project_deleted':
      return `${userName} deleted the project`;
    case 'project_visibility_changed':
      return `${userName} changed project visibility to ${activityData.isPublic ? 'public' : 'private'}`;
    case 'link_created':
      return `${userName} created a shared link with ${activityData.accessLevel} access`;
    case 'link_deleted':
      return `${userName} deleted a shared link`;
    case 'comment_added':
      return `${userName} added a comment: "${activityData.contentPreview || 'No preview'}"`;
    case 'item_added':
      return `${userName} added ${activityData.itemType} "${activityData.itemName}" to the project`;
    case 'item_removed':
      return `${userName} removed ${activityData.itemType} "${activityData.itemName}" from the project`;
    case 'calculation_created':
      return `${userName} created a new calculation: "${activityData.name}"`;
    case 'matrix_imported':
      return `${userName} imported a cost matrix: "${activityData.name}"`;
    case 'report_generated':
      return `${userName} generated a report: "${activityData.name}"`;
    default:
      return `${userName} performed an action on the project`;
  }
};

const ProjectActivitiesLog: React.FC<ProjectActivitiesLogProps> = ({
  projectId,
  maxHeight = '400px',
  limit = 20
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch project activities
  const {
    data: activities = [],
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: [`/api/projects/${projectId}/activities`],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/projects/${projectId}/activities?limit=${limit}`);
        return response.json();
      } catch (error) {
        console.error('Error fetching project activities:', error);
        throw new Error('Failed to fetch activities');
      }
    },
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Refresh activities
  const handleRefresh = () => {
    refetch();
  };
  
  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <ActivitySquare className="h-5 w-5 mr-2" />
            Project Activity
          </CardTitle>
          <CardDescription>
            Recent activity in this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg flex items-center">
            <ActivitySquare className="h-5 w-5 mr-2" />
            Project Activity
          </CardTitle>
          <CardDescription>
            {activities.length > 0 
              ? `${activities.length} recent ${activities.length === 1 ? 'action' : 'actions'} in this project` 
              : 'No recent activity in this project'}
          </CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefetching}
          className="h-8 w-8 p-0"
          title="Refresh activities"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div 
          className="space-y-4 overflow-auto pr-1" 
          style={{ maxHeight }}
        >
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p>No activity recorded yet.</p>
              <p className="text-sm">Recent actions on this project will appear here.</p>
            </div>
          ) : (
            activities.map((activity: ProjectActivity) => (
              <div key={activity.id} className="flex items-start gap-3 group">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(activity.user?.name)}</AvatarFallback>
                  {activity.user?.name && (
                    <AvatarImage
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        activity.user.name
                      )}&background=random`}
                      alt={activity.user.name}
                    />
                  )}
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <p className="text-sm">
                      {getActivityDescription(activity)}
                    </p>
                    <Badge 
                      variant={getActivityBadgeVariant(activity.activityType)}
                      className="ml-2 opacity-80 group-hover:opacity-100 flex items-center whitespace-nowrap"
                    >
                      <ActivityIcon type={activity.activityType} className="h-3 w-3 mr-1" />
                      <span className="text-xs">
                        {activity.activityType.replace('_', ' ')}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTimestamp(activity.createdAt)}
                    {activity.user?.id === user?.id && (
                      <span className="ml-2">(by you)</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectActivitiesLog;