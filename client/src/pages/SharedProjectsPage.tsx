import React, { useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Link, useLocation } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, Share2, Lock, Globe, Plus, Edit, Trash } from 'lucide-react';
import { format } from 'date-fns';

const SharedProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    myProjects,
    publicProjects,
    isLoadingProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject
  } = useCollaboration();

  // Create project form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectIsPublic, setNewProjectIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Edit project form state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [editProjectIsPublic, setEditProjectIsPublic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide a project name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      await createProject({
        name: newProjectName,
        description: newProjectDescription || undefined,
        isPublic: newProjectIsPublic
      });
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle edit project
  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectName.trim() || !editingProject) {
      toast({
        title: "Missing information",
        description: "Please provide a project name.",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(true);
    try {
      await updateProject(editingProject.id, {
        name: editProjectName,
        description: editProjectDescription || undefined,
        isPublic: editProjectIsPublic
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsEditing(false);
    }
  };

  // Handle delete project
  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    try {
      await deleteProject(deletingProject.id);
      setIsDeleteOpen(false);
      setDeletingProject(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Open the edit dialog
  const openEditDialog = (project: any) => {
    setEditingProject(project);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description || '');
    setEditProjectIsPublic(project.isPublic);
    setIsEditOpen(true);
  };

  // Open the delete dialog
  const openDeleteDialog = (project: any) => {
    setDeletingProject(project);
    setIsDeleteOpen(true);
  };

  // Reset create form
  const resetCreateForm = () => {
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectIsPublic(false);
  };

  // View a project
  const [_, setLocation] = useLocation();
  const viewProject = (project: any) => {
    setCurrentProject(project);
    // Navigate to project details page
    setLocation(`/shared-projects/${project.id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Shared Projects</h1>
        <Link href="/shared-projects/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-projects" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-projects">My Projects</TabsTrigger>
          <TabsTrigger value="public-projects">Public Projects</TabsTrigger>
        </TabsList>

        {/* My Projects Tab */}
        <TabsContent value="my-projects" className="mt-6">
          {isLoadingProjects ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : myProjects.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't created or been added to any projects yet.
              </p>
              <Link href="/shared-projects/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            // Projects grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{project.name}</CardTitle>
                      <Badge variant={project.isPublic ? "default" : "outline"}>
                        {project.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                        {project.isPublic ? "Public" : "Private"}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created {format(new Date(project.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    {project.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description provided</p>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => viewProject(project)}>
                      View Details
                    </Button>
                    
                    {project.createdById === user?.id && (
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openEditDialog(project)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openDeleteDialog(project)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Public Projects Tab */}
        <TabsContent value="public-projects" className="mt-6">
          {isLoadingProjects ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : publicProjects.length === 0 ? (
            // Empty state
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No public projects available</h3>
              <p className="text-muted-foreground">
                There are no public projects available at the moment.
              </p>
            </div>
          ) : (
            // Projects grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Users className="h-3 w-3 mr-1" />
                      By {project.createdById === user?.id ? 'You' : 'Another User'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-4">
                    {project.description ? (
                      <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description provided</p>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button variant="outline" size="sm" onClick={() => viewProject(project)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Project Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a project to collaborate on building cost calculations with your team.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateProject}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Building Project"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="public"
                  checked={newProjectIsPublic}
                  onCheckedChange={setNewProjectIsPublic}
                />
                <Label htmlFor="public" className="flex gap-2 items-center">
                  <Globe className="h-4 w-4" />
                  Make this project public
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateOpen(false);
                  resetCreateForm();
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project details.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditProject}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  placeholder="My Building Project"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  value={editProjectDescription}
                  onChange={(e) => setEditProjectDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-public"
                  checked={editProjectIsPublic}
                  onCheckedChange={setEditProjectIsPublic}
                />
                <Label htmlFor="edit-public" className="flex gap-2 items-center">
                  <Globe className="h-4 w-4" />
                  Make this project public
                </Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {deletingProject && (
              <p className="font-medium">"{deletingProject.name}"</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharedProjectsPage;