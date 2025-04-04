import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckIcon as IconCheck, 
  PencilIcon as IconEdit,
  ShareIcon as IconShare,
  UsersIcon as IconUsers,
  CalculatorIcon as IconCalculator,
  TrashIcon as IconTrash,
  PlusIcon as IconPlus,
  MessageSquareIcon as IconMessage,
  LinkIcon as IconLink,
  UploadIcon as IconFileUpload,
  HomeIcon as IconHome 
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 as Spinner } from 'lucide-react';

export interface ProjectActivityProps {
  projectId: number;
  limit?: number;
  showTitle?: boolean;
  className?: string;
}

type ActivityIcon = {
  icon: React.ReactNode;
  color: string;
}

interface ProjectActivity {
  id: number;
  projectId: number;
  userId: number;
  activityType: string;
  activityData: any;
  createdAt: string;
  user: {
    username: string;
    name: string | null;
  };
}

const activityIcons: Record<string, ActivityIcon> = {
  'project_created': { icon: <IconHome className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  'project_updated': { icon: <IconEdit className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'project_deleted': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  'member_added': { icon: <IconUsers className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  'member_removed': { icon: <IconUsers className="h-4 w-4" />, color: 'bg-rose-100 text-rose-800' },
  'member_role_changed': { icon: <IconUsers className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  'item_added': { icon: <IconPlus className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-800' },
  'item_removed': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800' },
  'calculation_created': { icon: <IconCalculator className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-800' },
  'calculation_updated': { icon: <IconCalculator className="h-4 w-4" />, color: 'bg-teal-100 text-teal-800' },
  'comment_added': { icon: <IconMessage className="h-4 w-4" />, color: 'bg-sky-100 text-sky-800' },
  'project_shared': { icon: <IconShare className="h-4 w-4" />, color: 'bg-violet-100 text-violet-800' },
  'link_created': { icon: <IconLink className="h-4 w-4" />, color: 'bg-fuchsia-100 text-fuchsia-800' },
  'link_deleted': { icon: <IconLink className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800' },
  'file_uploaded': { icon: <IconFileUpload className="h-4 w-4" />, color: 'bg-lime-100 text-lime-800' },
  'default': { icon: <IconCheck className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' }
};

const getActivityIcon = (type: string) => {
  return activityIcons[type] || activityIcons.default;
};

const getActivityDescription = (activity: ProjectActivity): string => {
  const { activityType, activityData, user } = activity;
  const userName = user.name || user.username;
  
  switch (activityType) {
    case 'project_created':
      return `${userName} created this project`;
    case 'project_updated':
      return `${userName} updated project details`;
    case 'project_deleted':
      return `${userName} marked the project for deletion`;
    case 'member_added':
      if (activityData?.memberName) {
        return `${userName} added ${activityData.memberName} to the project`;
      }
      return `${userName} added a new member to the project`;
    case 'member_removed':
      if (activityData?.memberName) {
        return `${userName} removed ${activityData.memberName} from the project`;
      }
      return `${userName} removed a member from the project`;
    case 'member_role_changed':
      if (activityData?.memberName && activityData?.role) {
        return `${userName} changed ${activityData.memberName}'s role to ${activityData.role}`;
      }
      return `${userName} changed a member's role`;
    case 'item_added':
      if (activityData?.itemType && activityData?.itemName) {
        return `${userName} added ${activityData.itemType} "${activityData.itemName}"`;
      }
      return `${userName} added an item to the project`;
    case 'item_removed':
      if (activityData?.itemType) {
        return `${userName} removed a ${activityData.itemType} from the project`;
      }
      return `${userName} removed an item from the project`;
    case 'calculation_created':
      if (activityData?.name) {
        return `${userName} created calculation "${activityData.name}"`;
      }
      return `${userName} created a new calculation`;
    case 'calculation_updated':
      if (activityData?.name) {
        return `${userName} updated calculation "${activityData.name}"`;
      }
      return `${userName} updated a calculation`;
    case 'comment_added':
      if (activityData?.targetType) {
        return `${userName} commented on a ${activityData.targetType}`;
      }
      return `${userName} added a comment`;
    case 'project_shared':
      return `${userName} shared the project`;
    case 'link_created':
      if (activityData?.accessLevel) {
        return `${userName} created a ${activityData.accessLevel} access link`;
      }
      return `${userName} created a sharing link`;
    case 'link_deleted':
      return `${userName} deleted a sharing link`;
    case 'file_uploaded':
      if (activityData?.fileName) {
        return `${userName} uploaded file "${activityData.fileName}"`;
      }
      return `${userName} uploaded a file`;
    default:
      return `${userName} performed an action`;
  }
};

const ActivityItem = ({ activity }: { activity: ProjectActivity }) => {
  const { activityType, createdAt } = activity;
  const { icon, color } = getActivityIcon(activityType);
  const description = getActivityDescription(activity);
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  return (
    <div className="flex items-start space-x-4 py-3">
      <div className={`p-2 rounded-full ${color}`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{description}</p>
        <div className="flex items-center">
          <Badge variant="outline" className="text-xs">{activityType.replace('_', ' ')}</Badge>
          <span className="ml-2 text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
    </div>
  );
};

const SkeletonActivityItem = () => (
  <div className="flex items-start space-x-4 py-3">
    <Skeleton className="h-8 w-8 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
);

export const ProjectActivitiesLog: React.FC<ProjectActivityProps> = ({ 
  projectId, 
  limit = 10, 
  showTitle = true,
  className = ""
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${projectId}/activities`],
    queryFn: () => apiRequest(`/api/projects/${projectId}/activities`),
    enabled: !!projectId
  });

  const activities = Array.isArray(data) ? data as ProjectActivity[] : [];
  const displayActivities = limit > 0 ? activities.slice(0, limit) : activities;

  if (error) {
    return (
      <Card className={className}>
        {showTitle && (
          <CardHeader>
            <CardTitle>Project Activity</CardTitle>
            <CardDescription>Recent activity in this project</CardDescription>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center p-4 text-red-500">
            Failed to load project activities
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader>
          <CardTitle>Project Activity</CardTitle>
          <CardDescription>Recent activity in this project</CardDescription>
        </CardHeader>
      )}
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <SkeletonActivityItem key={i} />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            No activities recorded yet
          </div>
        ) : (
          <div className="space-y-1 divide-y">
            {displayActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectActivitiesLog;