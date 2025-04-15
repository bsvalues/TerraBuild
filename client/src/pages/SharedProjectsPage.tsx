import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import ProjectInvitations from '@/components/collaboration/ProjectInvitations';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  User,
  MoreHorizontal,
  Edit,
  Trash2,
  EyeIcon,
  GlobeIcon,
  ClockIcon,
  Users,
  BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: number;
  name: string;
  description: string | null;
  createdById: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  status: string;
  isPublic: boolean;
}

const SharedProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    myProjects,
    publicProjects,
    deleteProject,
    isLoadingProjects,
  } = useCollaboration();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-projects');
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);

  // Handle project deletion
  const handleDeleteProject = async (projectId: number) => {
    setDeletingProjectId(projectId);
    
    try {
      await deleteProject(projectId);
      
      toast({
        title: 'Project deleted',
        description: 'The project has been deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Filter projects based on search query
  const filterProjects = (projects: Project[]) => {
    if (!searchQuery.trim()) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(
      project =>
        project.name.toLowerCase().includes(query) ||
        (project.description?.toLowerCase().includes(query) || false)
    );
  };

  // Format date for display
  const formatDate = (date: string | Date) => {
    if (date instanceof Date) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  // Render project cards
  const renderProjectCards = (projects: Project[], isOwnProjects: boolean = false) => {
    const filteredProjects = filterProjects(projects);
    
    if (isLoadingProjects) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-border">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
              <CardFooter className="pt-0 flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-8 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (filteredProjects.length === 0) {
      return (
        <Card className="bg-muted/50 border border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Folder className="h-12 w-12 mb-2 text-muted-foreground" />
            <CardDescription className="text-lg">No projects found</CardDescription>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? 'No projects match your search criteria'
                : isOwnProjects
                ? 'You have not created or been invited to any projects yet'
                : 'There are no public projects available'}
            </p>
            {isOwnProjects && !searchQuery && (
              <Button
                onClick={() => setLocation('/shared-projects/create')}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create a Project
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => {
          const isOwner = user?.id === project.createdById;
          const isDeleting: boolean = project.id === deletingProjectId;
          
          return (
            <Card key={project.id} className="border border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                  </div>
                  
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setLocation(`/shared-projects/${project.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-destructive focus:text-destructive"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                <CardDescription>
                  {project.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Created by {isOwner ? 'you' : 'another user'}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={project.isPublic ? 'outline' : 'default'} className="flex items-center gap-1">
                    {project.isPublic ? (
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
                  
                  {isOwner && (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Owner
                    </Badge>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0 flex gap-2">
                <Link to={`/shared-projects/${project.id}`} className="flex-1">
                  <Button variant="default" className="w-full">
                    <EyeIcon className="h-4 w-4 mr-2" />
                    View Project
                  </Button>
                </Link>
                <Link to={`/shared-projects/${project.id}/dashboard`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Projects</h1>
          <p className="text-muted-foreground mt-1">
            Create, collaborate, and share projects with your team
          </p>
        </div>
        <Button
          onClick={() => setLocation('/shared-projects/create')}
          className="mt-4 md:mt-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Project Invitations */}
      <ProjectInvitations className="mb-6" />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Project Tabs */}
      <Tabs defaultValue="my-projects" className="mb-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="public-projects">Public Projects</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-projects" className="mt-6">
          {renderProjectCards(myProjects, true)}
        </TabsContent>
        
        <TabsContent value="public-projects" className="mt-6">
          {renderProjectCards(publicProjects)}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SharedProjectsPage;