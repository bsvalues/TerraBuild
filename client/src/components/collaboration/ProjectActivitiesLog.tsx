import React, { useState } from 'react';
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
  HomeIcon as IconHome,
  BuildingIcon as IconBuilding,
  DatabaseIcon as IconDatabase,
  FileBarChart2Icon as IconChart,
  TableIcon as IconTable,
  PercentIcon as IconPercent,
  MoveRightIcon as IconArrowRight,
  FilterIcon as IconFilter,
  FileTextIcon as IconFileText,
  DownloadIcon as IconDownload,
  ClockIcon as IconClock,
  BookmarkIcon as IconBookmark
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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
  // Project activities
  'project_created': { icon: <IconHome className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  'project_updated': { icon: <IconEdit className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'project_deleted': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  'project_shared': { icon: <IconShare className="h-4 w-4" />, color: 'bg-violet-100 text-violet-800' },
  'project_exported': { icon: <IconDownload className="h-4 w-4" />, color: 'bg-sky-100 text-sky-800' },
  'project_finalized': { icon: <IconCheck className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-800' },
  
  // Team activities
  'member_added': { icon: <IconUsers className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  'member_removed': { icon: <IconUsers className="h-4 w-4" />, color: 'bg-rose-100 text-rose-800' },
  'member_role_changed': { icon: <IconUsers className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  
  // Item activities
  'item_added': { icon: <IconPlus className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-800' },
  'item_removed': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800' },
  'item_updated': { icon: <IconEdit className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  
  // Calculation activities
  'calculation_created': { icon: <IconCalculator className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-800' },
  'calculation_updated': { icon: <IconCalculator className="h-4 w-4" />, color: 'bg-teal-100 text-teal-800' },
  'calculation_deleted': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  
  // Communication activities
  'comment_added': { icon: <IconMessage className="h-4 w-4" />, color: 'bg-sky-100 text-sky-800' },
  'comment_edited': { icon: <IconEdit className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'comment_deleted': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  
  // Sharing activities
  'link_created': { icon: <IconLink className="h-4 w-4" />, color: 'bg-fuchsia-100 text-fuchsia-800' },
  'link_deleted': { icon: <IconLink className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800' },
  'link_accessed': { icon: <IconArrowRight className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  
  // File activities
  'file_uploaded': { icon: <IconFileUpload className="h-4 w-4" />, color: 'bg-lime-100 text-lime-800' },
  'file_downloaded': { icon: <IconDownload className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'file_deleted': { icon: <IconTrash className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  
  // CAMA-specific activities
  'cost_matrix_imported': { icon: <IconTable className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800' },
  'cost_matrix_updated': { icon: <IconEdit className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'cost_matrix_exported': { icon: <IconDownload className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
  'building_cost_created': { icon: <IconBuilding className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  'building_cost_updated': { icon: <IconEdit className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'depreciation_table_updated': { icon: <IconPercent className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-800' },
  'region_factor_updated': { icon: <IconFilter className="h-4 w-4" />, color: 'bg-cyan-100 text-cyan-800' },
  'assessment_report_generated': { icon: <IconFileText className="h-4 w-4" />, color: 'bg-emerald-100 text-emerald-800' },
  'benchmark_comparison_run': { icon: <IconChart className="h-4 w-4" />, color: 'bg-violet-100 text-violet-800' },
  'cama_export_generated': { icon: <IconDatabase className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
  'appraisal_milestone_reached': { icon: <IconBookmark className="h-4 w-4" />, color: 'bg-pink-100 text-pink-800' },

  // Default
  'default': { icon: <IconClock className="h-4 w-4" />, color: 'bg-gray-100 text-gray-800' }
};

const getActivityIcon = (type: string) => {
  return activityIcons[type] || activityIcons.default;
};

const getActivityDescription = (activity: ProjectActivity): string => {
  const { activityType, activityData, user } = activity;
  const userName = user.name || user.username;
  
  switch (activityType) {
    // Project activities
    case 'project_created':
      return `${userName} created this project`;
    case 'project_updated':
      return `${userName} updated project details`;
    case 'project_deleted':
      return `${userName} marked the project for deletion`;
    case 'project_shared':
      return `${userName} shared the project`;
    case 'project_exported':
      if (activityData?.format) {
        return `${userName} exported the project as ${activityData.format}`;
      }
      return `${userName} exported the project`;
    case 'project_finalized':
      return `${userName} finalized the project`;
      
    // Team activities
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
      
    // Item activities
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
    case 'item_updated':
      if (activityData?.itemType && activityData?.itemName) {
        return `${userName} updated ${activityData.itemType} "${activityData.itemName}"`;
      }
      return `${userName} updated an item`;
      
    // Calculation activities
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
    case 'calculation_deleted':
      if (activityData?.name) {
        return `${userName} deleted calculation "${activityData.name}"`;
      }
      return `${userName} deleted a calculation`;
      
    // Communication activities
    case 'comment_added':
      if (activityData?.targetType) {
        return `${userName} commented on a ${activityData.targetType}`;
      }
      return `${userName} added a comment`;
    case 'comment_edited':
      return `${userName} edited a comment`;
    case 'comment_deleted':
      return `${userName} deleted a comment`;
      
    // Sharing activities
    case 'link_created':
      if (activityData?.accessLevel) {
        return `${userName} created a ${activityData.accessLevel} access link`;
      }
      return `${userName} created a sharing link`;
    case 'link_deleted':
      return `${userName} deleted a sharing link`;
    case 'link_accessed':
      if (activityData?.accessedBy) {
        return `${activityData.accessedBy} accessed the project via sharing link`;
      }
      return `Someone accessed the project via sharing link`;
      
    // File activities
    case 'file_uploaded':
      if (activityData?.fileName) {
        return `${userName} uploaded file "${activityData.fileName}"`;
      }
      return `${userName} uploaded a file`;
    case 'file_downloaded':
      if (activityData?.fileName) {
        return `${userName} downloaded file "${activityData.fileName}"`;
      }
      return `${userName} downloaded a file`;
    case 'file_deleted':
      if (activityData?.fileName) {
        return `${userName} deleted file "${activityData.fileName}"`;
      }
      return `${userName} deleted a file`;
      
    // CAMA-specific activities
    case 'cost_matrix_imported':
      if (activityData?.matrixName) {
        return `${userName} imported cost matrix "${activityData.matrixName}"`;
      }
      return `${userName} imported a cost matrix`;
    case 'cost_matrix_updated':
      if (activityData?.matrixName) {
        return `${userName} updated cost matrix "${activityData.matrixName}"`;
      }
      return `${userName} updated a cost matrix`;
    case 'cost_matrix_exported':
      if (activityData?.matrixName) {
        return `${userName} exported cost matrix "${activityData.matrixName}"`;
      }
      return `${userName} exported a cost matrix`;
    case 'building_cost_created':
      if (activityData?.buildingType) {
        return `${userName} created ${activityData.buildingType} building cost estimate`;
      }
      return `${userName} created a building cost estimate`;
    case 'building_cost_updated':
      if (activityData?.buildingType) {
        return `${userName} updated ${activityData.buildingType} building cost estimate`;
      }
      return `${userName} updated a building cost estimate`;
    case 'depreciation_table_updated':
      if (activityData?.tableType) {
        return `${userName} updated ${activityData.tableType} depreciation table`;
      }
      return `${userName} updated a depreciation table`;
    case 'region_factor_updated':
      if (activityData?.region) {
        return `${userName} updated cost factors for ${activityData.region} region`;
      }
      return `${userName} updated regional cost factors`;
    case 'assessment_report_generated':
      if (activityData?.reportType) {
        return `${userName} generated ${activityData.reportType} assessment report`;
      }
      return `${userName} generated an assessment report`;
    case 'benchmark_comparison_run':
      if (activityData?.comparisonType) {
        return `${userName} ran ${activityData.comparisonType} benchmark comparison`;
      }
      return `${userName} ran a benchmark comparison`;
    case 'cama_export_generated':
      if (activityData?.exportFormat) {
        return `${userName} generated CAMA export in ${activityData.exportFormat} format`;
      }
      return `${userName} generated a CAMA system export`;
    case 'appraisal_milestone_reached':
      if (activityData?.milestone) {
        return `${userName} marked appraisal milestone: ${activityData.milestone}`;
      }
      return `${userName} reached an appraisal milestone`;
      
    // Default
    default:
      return `${userName} performed an action`;
  }
};

const ActivityItem = ({ activity }: { activity: ProjectActivity }) => {
  const { activityType, createdAt } = activity;
  const { icon, color } = getActivityIcon(activityType);
  const description = getActivityDescription(activity);
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Format the activity type for display
  const formatActivityType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="flex items-start space-x-4 py-3">
      <div className={`p-2 rounded-full ${color}`}>
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{description}</p>
        <div className="flex items-center">
          <Badge variant="outline" className="text-xs">{formatActivityType(activityType)}</Badge>
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
  const [filter, setFilter] = useState<string>('all');
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${projectId}/activities`],
    queryFn: () => apiRequest(`/api/projects/${projectId}/activities`),
    enabled: !!projectId
  });

  const activities = Array.isArray(data) ? data as ProjectActivity[] : [];
  
  // Filter activities based on the selected filter
  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'cama') {
      return [
        'cost_matrix_imported', 'cost_matrix_updated', 'cost_matrix_exported',
        'building_cost_created', 'building_cost_updated', 'depreciation_table_updated',
        'region_factor_updated', 'assessment_report_generated', 'benchmark_comparison_run',
        'cama_export_generated', 'appraisal_milestone_reached'
      ].includes(activity.activityType);
    }
    if (filter === 'team') {
      return [
        'member_added', 'member_removed', 'member_role_changed',
        'comment_added', 'comment_edited', 'comment_deleted'
      ].includes(activity.activityType);
    }
    if (filter === 'project') {
      return [
        'project_created', 'project_updated', 'project_deleted',
        'project_shared', 'project_exported', 'project_finalized',
        'link_created', 'link_deleted', 'link_accessed'
      ].includes(activity.activityType);
    }
    if (filter === 'items') {
      return [
        'item_added', 'item_removed', 'item_updated',
        'calculation_created', 'calculation_updated', 'calculation_deleted',
        'file_uploaded', 'file_downloaded', 'file_deleted'
      ].includes(activity.activityType);
    }
    return true;
  });
  
  const displayActivities = limit > 0 ? filteredActivities.slice(0, limit) : filteredActivities;

  // Get statistics for activity types
  const getActivityStats = () => {
    if (!activities.length) return null;
    
    const camaActivities = activities.filter(a => 
      ['cost_matrix_imported', 'cost_matrix_updated', 'building_cost_created', 'depreciation_table_updated',
       'region_factor_updated', 'assessment_report_generated', 'benchmark_comparison_run', 'cama_export_generated',
       'appraisal_milestone_reached'].includes(a.activityType)
    ).length;
    
    const teamActivities = activities.filter(a => 
      ['member_added', 'member_removed', 'member_role_changed', 'comment_added'].includes(a.activityType)
    ).length;
    
    return {
      total: activities.length,
      cama: camaActivities,
      team: teamActivities,
      other: activities.length - camaActivities - teamActivities
    };
  };

  const stats = getActivityStats();

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
          <CardDescription>Track all changes and actions in this project</CardDescription>
        </CardHeader>
      )}
      
      {stats && !limit && (
        <div className="px-6 -mt-2 mb-4">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="grid grid-cols-5 mb-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cama">CAMA</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="project">Project</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
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
      
      {stats && !limit && displayActivities.length > 0 && (
        <CardFooter className="flex justify-between text-xs text-muted-foreground border-t pt-4">
          <div>Total: {stats.total} activities</div>
          {stats.cama > 0 && (
            <div>CAMA-related: {stats.cama} activities</div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default ProjectActivitiesLog;