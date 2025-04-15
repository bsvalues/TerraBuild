import React, { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { ProjectProvider, useProjectContext } from '@/contexts/ProjectContext';
import ProjectSharingControls from '@/components/collaboration/ProjectSharingControls';
import ProjectMembersTable from '@/components/collaboration/ProjectMembersTable';
import ProjectItemsTable from '@/components/collaboration/ProjectItemsTable';
import InviteUserDialog from '@/components/collaboration/InviteUserDialog';
import SharedLinksTable from '@/components/collaboration/SharedLinksTable';
import ProjectActivitiesLog from '@/components/collaboration/ProjectActivitiesLog';
import ProjectProgressTracker from '@/components/collaboration/ProjectProgressTracker';
import ProjectProgressReport from '@/components/collaboration/ProjectProgressReport';
import CommentsSection from '@/components/comments/CommentsSection';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Folder,
  Settings,
  Share2,
  Edit,
  Trash2,
  MoreHorizontal,
  ClockIcon,
  User,
  MessageSquare,
  Plus,
  Users,
  GlobeIcon,
  FileText,
  Calculator,
  BarChart,
  Table,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Item type mapping for display purposes
const itemTypeMap: Record<string, { label: string; icon: React.ReactNode }> = {
  'calculation': {
    label: 'Calculation',
    icon: <Calculator className="h-4 w-4" />,
  },
  'cost_matrix': {
    label: 'Cost Matrix',
    icon: <Table className="h-4 w-4" />,
  },
  'what_if_scenario': {
    label: 'What-If Scenario',
    icon: <BarChart className="h-4 w-4" />,
  },
  'report': {
    label: 'Report',
    icon: <FileText className="h-4 w-4" />,
  },
};

const ProjectDetailsPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Use collaboration context for some functionality
  const {
    currentProject,
    setCurrentProject,
    myProjects,
    publicProjects,
    projectItems,
    deleteProject,
    addProjectItem,
    removeProjectItem,
    isLoadingProjects,
    isLoadingItems,
  } = useCollaboration();
  
  // Use project context for project-specific functionality
  const {
    project,
    members: projectMembers,
    isMembersLoading: isLoadingMembers,
    currentUserRole,
    isOwner: isProjectOwner,
    refreshMembers,
  } = useProjectContext();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const [addingItemType, setAddingItemType] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [isLoadingAvailableItems, setIsLoadingAvailableItems] = useState(false);
  
  // When projectId changes, set the current project
  useEffect(() => {
    const findProject = () => {
      // Try to find in my projects first
      let project = myProjects.find(p => p.id === projectId);
      
      // If not found, try to find in public projects
      if (!project) {
        project = publicProjects.find(p => p.id === projectId);
      }
      
      if (project) {
        setCurrentProject(project);
      } else if (!isLoadingProjects) {
        // If project not found and we're not loading, redirect to projects list
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

  // Use both owner checks to ensure consistency
  const isOwner = (currentProject && user?.id === currentProject.createdById) || isProjectOwner;

  // Format date for display
  const formatDate = (date: string | Date) => {
    if (date instanceof Date) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!currentProject) return;
    
    setIsDeleting(true);
    
    try {
      await deleteProject(currentProject.id);
      
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted successfully.',
      });
      
      setLocation('/shared-projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Load available items based on selected type
  const loadAvailableItems = async (itemType: string) => {
    setIsLoadingAvailableItems(true);
    setAvailableItems([]);
    
    try {
      // Here we'd typically fetch from the API
      let endpoint = '';
      
      switch (itemType) {
        case 'calculation':
          endpoint = '/api/calculations';
          break;
        case 'cost_matrix':
          endpoint = '/api/cost-matrix';
          break;
        case 'what_if_scenario':
          endpoint = '/api/what-if-scenarios';
          break;
        case 'report':
          endpoint = '/api/reports';
          break;
      }
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to load available ${itemType} items`);
      }
      
      const data = await response.json();
      setAvailableItems(data);
    } catch (error) {
      console.error(`Error loading ${itemType} items:`, error);
      toast({
        title: 'Error',
        description: `Failed to load available ${itemType} items.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoadingAvailableItems(false);
    }
  };

  // Handle adding an item to the project
  const handleAddItem = async () => {
    if (!currentProject || !addingItemType || !selectedItemId) return;
    
    try {
      await addProjectItem({
        projectId: currentProject.id,
        itemType: addingItemType,
        itemId: Number(selectedItemId)
      });
      
      toast({
        title: 'Item added',
        description: `The ${itemTypeMap[addingItemType].label.toLowerCase()} has been added to the project.`,
      });
      
      // Reset the state
      setAddingItemType(null);
      setSelectedItemId('');
    } catch (error) {
      console.error('Error adding item to project:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to project.',
        variant: 'destructive',
      });
    }
  };

  // Handle removing an item from the project
  const handleRemoveItem = async (itemId: number, itemType: string) => {
    if (!currentProject) return;
    
    try {
      await removeProjectItem(currentProject.id, itemType, itemId);
      
      toast({
        title: 'Item removed',
        description: `The ${itemTypeMap[itemType].label.toLowerCase()} has been removed from the project.`,
      });
    } catch (error) {
      console.error('Error removing item from project:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from project.',
        variant: 'destructive',
      });
    }
  };

  // Render loading skeleton
  if (isLoadingProjects || !currentProject) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header with navigation */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/shared-projects')}
            className="p-0 h-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex items-center space-x-3">
            <Folder className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{currentProject.name}</h1>
              <p className="text-muted-foreground">
                {currentProject.description || 'No description provided'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button
              variant="default"
              onClick={() => setLocation(`/shared-projects/${currentProject.id}/dashboard`)}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Dashboard
            </Button>

            {isOwner && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setLocation(`/shared-projects/${currentProject.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={handleDeleteProject}
                      className="text-destructive focus:text-destructive"
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Project'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant={currentProject.isPublic ? 'outline' : 'default'} className="flex items-center gap-1">
            {currentProject.isPublic ? (
              <>
                <GlobeIcon className="h-3 w-3" />
                Public
              </>
            ) : (
              <>
                <Users className="h-3 w-3" />
                Private
              </>
            )}
          </Badge>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            Updated {formatDate(currentProject.updatedAt)}
          </Badge>
          
          {isOwner && (
            <Badge variant="outline" className="bg-primary/10 text-primary">
              Owner
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs for project content */}
      <Tabs defaultValue="overview" className="mb-8" onValueChange={setActiveTab}>
        <TabsList className="w-full border-b mb-0 rounded-none bg-transparent justify-start gap-4 px-0">
          <TabsTrigger value="overview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            Project Items
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            Comments
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="sharing" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Sharing
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Description</h3>
                      <p className="text-muted-foreground">
                        {currentProject.description || 'No description provided.'}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Items in this project</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(itemTypeMap).map(([type, { label, icon }]) => {
                          const count = projectItems.filter(item => item.itemType === type).length;
                          return (
                            <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-md">
                              <div className="flex items-center">
                                {icon}
                                <span className="ml-2">{label}s</span>
                              </div>
                              <Badge variant="default">{count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-2">Team Members</h3>
                      {isLoadingMembers ? (
                        <div className="space-y-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center space-x-2">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          ))}
                        </div>
                      ) : projectMembers.length > 0 ? (
                        <div className="space-y-2">
                          {projectMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                              <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  {member.user?.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <div className="font-medium">{member.user?.name || member.user?.username || `User ${member.userId}`}</div>
                                  <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No team members yet.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>Project Progress</CardTitle>
                    <CardDescription>Track the completion status of this project</CardDescription>
                  </div>
                  <ProjectProgressReport projectId={currentProject.id} />
                </CardHeader>
                <CardContent>
                  <ProjectProgressTracker 
                    projectId={currentProject.id}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Track all changes and actions in this project</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectActivitiesLog 
                    projectId={currentProject.id}
                    className="h-full"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="items" className="pt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Items</CardTitle>
                <CardDescription>
                  Add calculations, cost matrices, and other items to this project
                </CardDescription>
              </div>
              
              {isOwner && addingItemType === null && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {Object.entries(itemTypeMap).map(([type, { label, icon }]) => (
                      <DropdownMenuItem 
                        key={type}
                        onClick={() => {
                          setAddingItemType(type);
                          loadAvailableItems(type);
                        }}
                      >
                        <div className="flex items-center">
                          {icon}
                          <span className="ml-2">Add {label}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            
            <CardContent>
              <ProjectItemsTable 
                projectId={currentProject.id}
                items={projectItems}
                isLoading={isLoadingItems}
                currentUserRole={isOwner ? 'owner' : 'member'}
              />
              
              {addingItemType !== null && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-4">
                    Add {itemTypeMap[addingItemType]?.label || 'Item'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">
                        Select {itemTypeMap[addingItemType]?.label || 'Item'}:
                      </label>
                      
                      {isLoadingAvailableItems ? (
                        <Skeleton className="h-10 w-full mt-1" />
                      ) : (
                        <Select
                          value={selectedItemId}
                          onValueChange={setSelectedItemId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`Select a ${itemTypeMap[addingItemType]?.label.toLowerCase() || 'item'}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableItems.length > 0 ? (
                              availableItems.map(item => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name || `${itemTypeMap[addingItemType]?.label} #${item.id}`}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-center text-muted-foreground">
                                No available items found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddingItemType(null);
                          setSelectedItemId('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddItem}
                        disabled={!selectedItemId}
                      >
                        Add to Project
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoadingItems ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Card key={i}>
                      <CardHeader className="p-4 pb-2">
                        <Skeleton className="h-5 w-32" />
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : projectItems.length > 0 ? (
                <div className="space-y-4">
                  {projectItems.map(item => (
                    <Card key={item.id} className="border">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {itemTypeMap[item.itemType]?.icon || <FileText className="h-4 w-4" />}
                            <CardTitle className="text-lg">
                              {itemTypeMap[item.itemType]?.label || 'Item'} #{item.itemId}
                            </CardTitle>
                          </div>
                          
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.itemId, item.itemType)}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <ClockIcon className="h-3.5 w-3.5 mr-1" />
                          <span>Added {formatDate(item.addedAt)}</span>
                        </div>
                        
                        <div className="mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              // Navigate to the appropriate page based on item type
                              let path = '';
                              switch (item.itemType) {
                                case 'calculation':
                                  path = `/calculator/${item.itemId}`;
                                  break;
                                case 'cost_matrix':
                                  path = `/data-import/matrix/${item.itemId}`;
                                  break;
                                case 'what_if_scenario':
                                  path = `/what-if-scenarios/${item.itemId}`;
                                  break;
                                case 'report':
                                  path = `/reports/${item.itemId}`;
                                  break;
                              }
                              setLocation(path);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 mb-2 text-muted-foreground" />
                  <CardDescription className="text-lg">No items in this project</CardDescription>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add calculations, cost matrices, or other items to collaborate on them.
                  </p>
                  
                  {isOwner && (
                    <Button
                      onClick={() => {
                        setAddingItemType('calculation');
                        loadAvailableItems('calculation');
                      }}
                      className="mt-4"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comments" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Comments</CardTitle>
              <CardDescription>
                Discuss this project with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CommentsSection targetType="project" targetId={projectId} canComment={true} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {isOwner && (
          <TabsContent value="sharing" className="pt-6">
            <div className="grid grid-cols-1 gap-6">
              <ProjectSharingControls
                projectId={currentProject.id}
                projectName={currentProject.name}
                isPublic={currentProject.isPublic}
                isOwner={isOwner}
                currentUserId={user?.id || 0}
                currentUserRole={isOwner ? 'owner' : 'member'}
              />
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Project Members</CardTitle>
                    <CardDescription>
                      People with access to this project
                    </CardDescription>
                  </div>
                  <InviteUserDialog 
                    projectId={currentProject.id}
                    open={false} 
                    onOpenChange={() => {}} 
                    isOwner={isOwner} 
                  />
                </CardHeader>
                <CardContent>
                  <ProjectMembersTable 
                    projectId={currentProject.id}
                    members={projectMembers}
                    isLoading={isLoadingMembers}
                    currentUserRole={isOwner ? 'owner' : 'member'}
                    currentUserId={user?.id || 0}
                  />
                </CardContent>
              </Card>
              
              <SharedLinksTable 
                projectId={currentProject.id}
                isAdmin={isOwner}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Wrapper component that provides project context
const ProjectDetailsPageWithProvider: React.FC = () => {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  
  return (
    <ProjectProvider currentUserId={user?.id || 0}>
      <ProjectDetailsPage />
    </ProjectProvider>
  );
};

export default ProjectDetailsPageWithProvider;