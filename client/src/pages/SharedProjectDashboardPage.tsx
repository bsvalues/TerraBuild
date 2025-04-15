import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation } from 'wouter';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ProjectProvider, useProjectContext } from '@/contexts/ProjectContext';
import ProjectMembersTable from '@/components/collaboration/ProjectMembersTable';
import ProjectItemsTable from '@/components/collaboration/ProjectItemsTable';
import ProjectActivitiesLog from '@/components/collaboration/ProjectActivitiesLog';
import TeamContributionChart from '../components/collaboration/TeamContributionChart';
import ActivityTrendChart from '../components/collaboration/ActivityTrendChart';
import ProjectSharingControls from '@/components/collaboration/ProjectSharingControls';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Folder,
  FolderOpen,
  Users,
  LayoutDashboard,
  FileText,
  BarChart3,
  Share2,
  Calendar,
  Activity,
  Globe,
  MessageSquare,
  Share,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const SharedProjectDashboardPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use collaboration context
  const {
    currentProject,
    setCurrentProject,
    myProjects,
    publicProjects,
    isLoadingProjects,
  } = useCollaboration();
  
  // Use project context for project-specific data
  const {
    project,
    members,
    activities,
    items,
    isMembersLoading,
    isActivitiesLoading,
    isItemsLoading,
    currentUserRole,
    isOwner,
  } = useProjectContext();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  // When projectId changes, set the current project
  useEffect(() => {
    const findProject = () => {
      let foundProject = myProjects.find(p => p.id === projectId);
      if (!foundProject) {
        foundProject = publicProjects.find(p => p.id === projectId);
      }
      
      if (foundProject) {
        setCurrentProject(foundProject);
      } else if (!isLoadingProjects) {
        toast({
          title: 'Project not found',
          description: 'The requested project could not be found or you do not have access to it.',
          variant: 'destructive',
        });
        setLocation('/shared-projects');
      }
    };
    
    findProject();
  }, [projectId, myProjects, publicProjects, isLoadingProjects, setCurrentProject, toast, setLocation]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      setCurrentProject(null);
    };
  }, [setCurrentProject]);
  
  // Check if the current user is a project admin
  const isAdmin = currentUserRole === 'admin' || isOwner;
  
  // Render loading skeleton
  if (isLoadingProjects || !currentProject) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Calculate metrics for overview
  const metrics = useMemo(() => {
    // The total number of activities
    const totalActivities = activities.length;
    
    // Calculate activity by type
    const activityByType = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get the most active user
    const activityByUser: Record<number, number> = {};
    activities.forEach(activity => {
      if (activity.userId) {
        activityByUser[activity.userId] = (activityByUser[activity.userId] || 0) + 1;
      }
    });
    
    const mostActiveUserId = Object.entries(activityByUser)
      .sort(([, a], [, b]) => b - a)
      .map(([userId]) => Number(userId))[0];
    
    const mostActiveMember = members.find(m => m.userId === mostActiveUserId);
    const mostActiveUserName = mostActiveMember
      ? mostActiveMember.user?.name || mostActiveMember.user?.username || `User ${mostActiveUserId}`
      : 'Unknown';
    
    // Get the most recent activity date
    const mostRecentActivity = activities.length > 0
      ? activities.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        })[0]
      : null;
    
    const formatActivityDate = (date: string | Date) => {
      if (typeof date === 'string') {
        return format(parseISO(date), 'MMM d, yyyy');
      }
      return format(date, 'MMM d, yyyy');
    };
    
    return {
      totalActivities,
      activityByType,
      activityByUser,
      mostActiveUserId,
      mostActiveUserName,
      mostRecentActivity: mostRecentActivity 
        ? formatActivityDate(mostRecentActivity.createdAt)
        : 'N/A',
      totalMembers: members.length,
      totalItems: items.length
    };
  }, [activities, members, items]);
  
  // Get the member display name
  const getMemberName = (userId: number) => {
    const member = members.find(m => m.userId === userId);
    return member
      ? member.user?.name || member.user?.username || `User ${userId}`
      : `User ${userId}`;
  };
  
  // Get activity type display name
  const getActivityTypeName = (type: string) => {
    const parts = type.split('_');
    return parts.map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header with navigation */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/shared-projects/${projectId}`)}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex items-center space-x-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentProject.name} Dashboard</h1>
              <p className="text-muted-foreground">
                Analytics and insights for your project
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard tabs */}
      <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="w-full border-b mb-0 rounded-none bg-transparent justify-start gap-4 px-0">
          <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activities" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <Activity className="h-4 w-4 mr-2" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="members" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <Users className="h-4 w-4 mr-2" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="items" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <FolderOpen className="h-4 w-4 mr-2" />
            Shared Items
          </TabsTrigger>
          <TabsTrigger value="sharing" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <Share className="h-4 w-4 mr-2" />
            Sharing
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab Content */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalActivities}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all team members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalMembers}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active collaborators
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Most Active Member</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate" title={metrics.mostActiveUserName}>
                  {metrics.mostActiveUserName !== 'Unknown' 
                    ? metrics.mostActiveUserName 
                    : 'No activity yet'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.activityByUser && metrics.mostActiveUserId
                    ? `${metrics.activityByUser?.[metrics.mostActiveUserId] || 0} activities`
                    : 'No activities recorded'}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.mostRecentActivity}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Most recent update
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityTrendChart activities={activities} />
            <TeamContributionChart activities={activities} members={members} />
          </div>
          
          {/* Recent activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest actions in this project</CardDescription>
            </CardHeader>
            <CardContent>
              {isActivitiesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-4 py-2 border-b last:border-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        {activity.type?.includes('MEMBER') ? (
                          <Users className="h-5 w-5" />
                        ) : activity.type?.includes('ITEM') ? (
                          <FileText className="h-5 w-5" />
                        ) : activity.type?.includes('COMMENT') ? (
                          <MessageSquare className="h-5 w-5" />
                        ) : (
                          <Activity className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {getMemberName(activity.userId)}{' '}
                          <span className="font-normal text-muted-foreground">
                            {getActivityTypeName(activity.type)}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.createdAt).toLocaleString()}
                        </p>
                        {activity.data && (
                          <p className="text-sm mt-1">
                            {JSON.stringify(activity.data)}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {getActivityTypeName(activity.type)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No activities recorded for this project yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Activities Tab Content */}
        <TabsContent value="activities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Project Activities
              </CardTitle>
              <CardDescription>Complete history of actions in this project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ActivityTrendChart activities={activities} />
              </div>
              
              <ProjectActivitiesLog 
                projectId={projectId} 
                className="max-h-[500px] overflow-y-auto"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Team Members Tab Content */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Members
              </CardTitle>
              <CardDescription>Project collaborators and their roles</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectMembersTable 
                projectId={projectId} 
                isAdmin={isAdmin} 
                isOwner={isOwner}
                currentUserId={user?.id || 0}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Items Tab Content */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <FolderOpen className="h-5 w-5 mr-2" />
                Shared Items
              </CardTitle>
              <CardDescription>Items shared within this project</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectItemsTable 
                projectId={projectId} 
                canManageItems={isAdmin || isOwner} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sharing Tab Content */}
        <TabsContent value="sharing">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Share className="h-5 w-5 mr-2" />
                Project Sharing
              </CardTitle>
              <CardDescription>Control how your project is shared and accessed</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectSharingControls 
                projectId={projectId}
                projectName={project?.name || currentProject.name}
                isPublic={project?.isPublic || currentProject.isPublic || false}
                isOwner={isOwner}
                currentUserId={user?.id || 0}
                currentUserRole={currentUserRole}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Wrap the component with ProjectProvider to provide project-specific data
const SharedProjectDashboardPageWrapper: React.FC = () => {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { user } = useAuth();
  
  return (
    <ProjectProvider projectId={projectId} currentUserId={user?.id || 0}>
      <SharedProjectDashboardPage />
    </ProjectProvider>
  );
};

export default SharedProjectDashboardPageWrapper;