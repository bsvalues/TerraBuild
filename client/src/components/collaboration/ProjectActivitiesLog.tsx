import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  FileText, Users, CheckSquare, Calendar, 
  FileArchive, RefreshCw, FileUp, FileDown,
  Link as LinkIcon, MessageSquare, Settings, 
  Layers, Database, Upload, Download
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
  type: string;
  timestamp: string;
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  details?: {
    [key: string]: any;
  };
}

interface ProjectActivitiesLogProps {
  activities: ActivityItem[];
  title?: string;
  description?: string;
  isLoading?: boolean;
}

const ProjectActivitiesLog: React.FC<ProjectActivitiesLogProps> = ({
  activities,
  title = "Recent Activities",
  description = "Recent project activities and updates",
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60">
            <p className="text-muted-foreground">Loading activities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-60">
            <p className="text-muted-foreground">No activities found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format the activity message based on type
  const getActivityMessage = (activity: ActivityItem) => {
    const { type, details } = activity;
    
    switch (type) {
      case 'created_project':
        return `created project "${details?.projectName || 'Unnamed project'}"`;
      case 'updated_project':
        return `updated project details`;
      case 'deleted_project':
        return `deleted project "${details?.projectName || 'Unnamed project'}"`;
      case 'added_member':
        return `added ${details?.memberName || 'a new member'} to the project`;
      case 'removed_member':
        return `removed ${details?.memberName || 'a member'} from the project`;
      case 'updated_member_role':
        return `updated ${details?.memberName || 'a member'}'s role to ${details?.newRole || 'a new role'}`;
      case 'completed_task':
        return `completed task "${details?.taskName || 'Unnamed task'}"`;
      case 'added_milestone':
        return `added milestone "${details?.milestoneName || 'Unnamed milestone'}"`;
      case 'added_document':
        return `added document "${details?.documentName || 'Unnamed document'}"`;
      case 'updated_document':
        return `updated document "${details?.documentName || 'Unnamed document'}"`;
      case 'synced_data':
        return `synced data with ${details?.source || 'external system'}`;
      case 'uploaded_file':
        return `uploaded file "${details?.fileName || 'a file'}"`;
      case 'downloaded_file':
        return `downloaded file "${details?.fileName || 'a file'}"`;
      case 'shared_link':
        return `shared a link to the project`;
      case 'added_comment':
        return `commented on ${details?.itemType || 'an item'}`;
      case 'updated_settings':
        return `updated project settings`;
      case 'added_item':
        return `added ${details?.itemType || 'an item'} "${details?.itemName || 'Unnamed item'}"`;
      case 'removed_item':
        return `removed ${details?.itemType || 'an item'} "${details?.itemName || 'Unnamed item'}"`;
      case 'updated_item':
        return `updated ${details?.itemType || 'an item'} "${details?.itemName || 'Unnamed item'}"`;
      case 'connected_database':
        return `connected to database "${details?.databaseName || 'Unnamed database'}"`;
      case 'ftp_upload':
        return `uploaded file "${details?.fileName || 'a file'}" via FTP`;
      case 'ftp_download':
        return `downloaded file "${details?.fileName || 'a file'}" via FTP`;
      case 'ftp_sync_started':
        return `started FTP sync job "${details?.jobName || 'Unnamed job'}"`;
      case 'ftp_sync_completed':
        return `completed FTP sync job "${details?.jobName || 'Unnamed job'}"`;
      case 'ftp_sync_failed':
        return `failed FTP sync job "${details?.jobName || 'Unnamed job'}"`;
      default:
        return `performed action "${type}"`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => {
              const activityIcon = ACTIVITY_ICONS[activity.type] || 
                <FileText className="h-4 w-4 text-muted-foreground" />;
              const formattedDate = activity.timestamp ? 
                format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a') : 
                'Unknown date';
                
              return (
                <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatarUrl} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{activity.user.name}</span>
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
      </CardContent>
    </Card>
  );
};

export default ProjectActivitiesLog;