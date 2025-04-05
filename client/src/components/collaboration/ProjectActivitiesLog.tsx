import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, Users, CheckSquare, Calendar, 
  FileArchive, RefreshCw, FileUp, FileDown,
  Link as LinkIcon, MessageSquare, Settings, 
  Layers, Database, Upload, Download, Activity
} from 'lucide-react';

// Activity types with their corresponding icons
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  'created_project': <FileText className="h-4 w-4 text-blue-500" />,
  'updated_project': <FileText className="h-4 w-4 text-yellow-500" />,
  'deleted_project': <FileText className="h-4 w-4 text-red-500" />,
  'added_member': <Users className="h-4 w-4 text-green-500" />,
  'removed_member': <Users className="h-4 w-4 text-red-500" />,
  'updated_member_role': <Users className="h-4 w-4 text-yellow-500" />,
  'completed_task': <CheckSquare className="h-4 w-4 text-green-500" />,
  'added_milestone': <Calendar className="h-4 w-4 text-purple-500" />,
  'added_document': <FileArchive className="h-4 w-4 text-blue-500" />,
  'updated_document': <FileArchive className="h-4 w-4 text-yellow-500" />,
  'synced_data': <RefreshCw className="h-4 w-4 text-blue-500" />,
  'uploaded_file': <FileUp className="h-4 w-4 text-green-500" />,
  'downloaded_file': <FileDown className="h-4 w-4 text-blue-500" />,
  'shared_link': <LinkIcon className="h-4 w-4 text-purple-500" />,
  'added_comment': <MessageSquare className="h-4 w-4 text-blue-500" />,
  'updated_settings': <Settings className="h-4 w-4 text-yellow-500" />,
  'added_item': <Layers className="h-4 w-4 text-green-500" />,
  'removed_item': <Layers className="h-4 w-4 text-red-500" />,
  'updated_item': <Layers className="h-4 w-4 text-yellow-500" />,
  'connected_database': <Database className="h-4 w-4 text-purple-500" />,
  'ftp_upload': <Upload className="h-4 w-4 text-green-500" />,
  'ftp_download': <Download className="h-4 w-4 text-blue-500" />,
  'ftp_sync_started': <RefreshCw className="h-4 w-4 text-blue-500" />,
  'ftp_sync_completed': <RefreshCw className="h-4 w-4 text-green-500" />,
  'ftp_sync_failed': <RefreshCw className="h-4 w-4 text-red-500" />,
};

interface ActivityItem {
  id: number;
  projectId: number;
  userId: number;
  type: string;
  createdAt: string;
  data?: Record<string, any>;
  user?: {
    id: number;
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
}

interface ProjectActivitiesLogProps {
  // Direct activities array (optional)
  activities?: ActivityItem[];
  // Or project ID to fetch activities
  projectId?: number;
  // Style and display props
  title?: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
  limit?: number;
  showCard?: boolean;
}

const ProjectActivitiesLog: React.FC<ProjectActivitiesLogProps> = ({
  activities: propActivities,
  projectId,
  title = "Recent Activities",
  description = "Recent project activities and updates",
  isLoading: propIsLoading,
  className = "",
  limit = 50,
  showCard = true
}) => {
  const { toast } = useToast();
  
  // Fetch activities if projectId is provided and activities are not
  const { data, isLoading: queryIsLoading, error } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/activities`] : null,
    enabled: !!projectId && !propActivities,
  });
  
  // Use provided activities or fetched activities
  const activities = propActivities || (data as ActivityItem[]) || [];
  const isLoading = propIsLoading || queryIsLoading;
  
  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading activities",
        description: "There was a problem fetching project activities.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Loading state
  if (isLoading) {
    return showCard ? (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="flex items-start space-x-4 pb-4 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 pb-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return showCard ? (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <p className="text-muted-foreground font-medium">No activities found</p>
            <p className="text-muted-foreground/70 text-sm">
              When project activities occur, they will be shown here
            </p>
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/60 mb-3" />
        <p className="text-muted-foreground font-medium">No activities found</p>
        <p className="text-muted-foreground/70 text-sm">
          When project activities occur, they will be shown here
        </p>
      </div>
    );
  }

  // Format the activity message based on type
  const getActivityMessage = (activity: ActivityItem) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'created_project':
        return `created project "${data?.projectName || 'Unnamed project'}"`;
      case 'updated_project':
        return `updated project details`;
      case 'deleted_project':
        return `deleted project "${data?.projectName || 'Unnamed project'}"`;
      case 'added_member':
        return `added ${data?.memberName || 'a new member'} to the project`;
      case 'removed_member':
        return `removed ${data?.memberName || 'a member'} from the project`;
      case 'updated_member_role':
        return `updated ${data?.memberName || 'a member'}'s role to ${data?.newRole || 'a new role'}`;
      case 'completed_task':
        return `completed task "${data?.taskName || 'Unnamed task'}"`;
      case 'added_milestone':
        return `added milestone "${data?.milestoneName || 'Unnamed milestone'}"`;
      case 'added_document':
        return `added document "${data?.documentName || 'Unnamed document'}"`;
      case 'updated_document':
        return `updated document "${data?.documentName || 'Unnamed document'}"`;
      case 'synced_data':
        return `synced data with ${data?.source || 'external system'}`;
      case 'uploaded_file':
        return `uploaded file "${data?.fileName || 'a file'}"`;
      case 'downloaded_file':
        return `downloaded file "${data?.fileName || 'a file'}"`;
      case 'shared_link':
        return `shared a link to the project`;
      case 'added_comment':
        return `commented on ${data?.itemType || 'an item'}`;
      case 'updated_settings':
        return `updated project settings`;
      case 'added_item':
        return `added ${data?.itemType || 'an item'} "${data?.itemName || 'Unnamed item'}"`;
      case 'removed_item':
        return `removed ${data?.itemType || 'an item'} "${data?.itemName || 'Unnamed item'}"`;
      case 'updated_item':
        return `updated ${data?.itemType || 'an item'} "${data?.itemName || 'Unnamed item'}"`;
      case 'connected_database':
        return `connected to database "${data?.databaseName || 'Unnamed database'}"`;
      case 'ftp_upload':
        return `uploaded file "${data?.fileName || 'a file'}" via FTP`;
      case 'ftp_download':
        return `downloaded file "${data?.fileName || 'a file'}" via FTP`;
      case 'ftp_sync_started':
        return `started FTP sync job "${data?.jobName || 'Unnamed job'}"`;
      case 'ftp_sync_completed':
        return `completed FTP sync job "${data?.jobName || 'Unnamed job'}"`;
      case 'ftp_sync_failed':
        return `failed FTP sync job "${data?.jobName || 'Unnamed job'}"`;
      default:
        return `performed action "${type}"`;
    }
  };

  // Limit the number of activities to display
  const limitedActivities = activities.slice(0, limit);

  // The activity list component (shared between card and non-card views)
  const activityList = (
    <ScrollArea className="pr-4" style={{ height: showCard ? '350px' : 'auto' }}>
      <div className="space-y-4">
        {limitedActivities.map((activity) => {
          const activityIcon = ACTIVITY_ICONS[activity.type] || 
            <FileText className="h-4 w-4 text-muted-foreground" />;
          const formattedDate = activity.createdAt ? 
            format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a') : 
            'Unknown date';
            
          // Get user name (handle different API response structures)
          const userName = activity.user?.name || 
                          activity.user?.username || 
                          `User ${activity.userId}`;
          
          return (
            <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.user?.avatarUrl} alt={userName} />
                <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-medium">{userName}</span>
                  <span className="text-muted-foreground">{getActivityMessage(activity)}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {activityIcon}
                  <span className="ml-1">{formattedDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );

  // Return either a card or just the activity list based on showCard prop
  return showCard ? (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {activityList}
      </CardContent>
    </Card>
  ) : (
    <div className={className}>
      {activityList}
    </div>
  );
};

export default ProjectActivitiesLog;