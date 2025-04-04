import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '../hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import CommentsSection from '@/components/comments/CommentsSection';
import { 
  ArrowLeft, 
  Building, 
  Calculator, 
  Calendar, 
  Clock, 
  FileText, 
  Globe, 
  Lock, 
  MessageCircle,
  Plus, 
  Share2, 
  Trash, 
  UserPlus, 
  Users
} from 'lucide-react';
import { format } from 'date-fns';

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams();
  const projectId = parseInt(id || '0');
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    myProjects, 
    publicProjects, 
    setCurrentProject, 
    currentProject, 
    projectMembers, 
    projectItems,
    isLoadingProjects,
    isLoadingMembers,
    isLoadingItems,
    addMember,
    updateMemberRole,
    removeMember,
    addProjectItem,
    removeProjectItem,
    updateProject
  } = useCollaboration();

  // Member management
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('viewer');
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Remove member confirmation
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  // Item management
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [itemType, setItemType] = useState('calculation');
  const [itemId, setItemId] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Remove item confirmation
  const [isRemoveItemOpen, setIsRemoveItemOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<any>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  // Setup project on mount
  useEffect(() => {
    if (projectId && !currentProject) {
      // Find the project in our lists
      const project = [...myProjects, ...publicProjects].find(p => p.id === projectId);
      if (project) {
        setCurrentProject(project);
      }
    }
  }, [projectId, currentProject, myProjects, publicProjects, setCurrentProject]);

  // Check if the current user is a project admin
  const isProjectAdmin = () => {
    // If the user is the creator of the project
    if (currentProject && user && currentProject.createdById === user.id) {
      return true;
    }
    
    // If the user is a member with admin role
    const userMember = projectMembers.find(member => member.userId === user?.id);
    return userMember?.role === 'admin';
  };
  
  // Check if the current user can edit (as admin or editor)
  const canEdit = () => {
    // If the user is a project admin
    if (isProjectAdmin()) {
      return true;
    }
    
    // If the user is a member with editor role
    const userMember = projectMembers.find(member => member.userId === user?.id);
    return userMember?.role === 'editor';
  };

  // Handle adding a member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMemberId || !newMemberRole || !projectId) {
      toast({
        title: "Missing information",
        description: "Please provide a user ID and select a role.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingMember(true);
    try {
      await addMember(projectId, parseInt(newMemberId), newMemberRole);
      setIsAddMemberOpen(false);
      setNewMemberId('');
      setNewMemberRole('viewer');
    } catch (error) {
      console.error("Error adding member:", error);
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle updating a member's role
  const handleUpdateMemberRole = async (memberId: number, newRole: string) => {
    try {
      await updateMemberRole(projectId, memberId, newRole);
      toast({
        title: "Role updated",
        description: "The member's role has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating member role:", error);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async () => {
    if (!memberToRemove || !projectId) return;

    setIsRemovingMember(true);
    try {
      await removeMember(projectId, memberToRemove.userId);
      setIsRemoveMemberOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
    } finally {
      setIsRemovingMember(false);
    }
  };

  // Open the remove member dialog
  const openRemoveMemberDialog = (member: any) => {
    setMemberToRemove(member);
    setIsRemoveMemberOpen(true);
  };

  // Handle adding an item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemType || !itemId || !projectId) {
      toast({
        title: "Missing information",
        description: "Please select an item type and provide an item ID.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingItem(true);
    try {
      await addProjectItem(projectId, itemType, parseInt(itemId));
      setIsAddItemOpen(false);
      setItemType('calculation');
      setItemId('');
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsAddingItem(false);
    }
  };

  // Handle removing an item
  const handleRemoveItem = async () => {
    if (!itemToRemove || !projectId) return;

    setIsRemovingItem(true);
    try {
      await removeProjectItem(projectId, itemToRemove.itemType, itemToRemove.itemId);
      setIsRemoveItemOpen(false);
      setItemToRemove(null);
    } catch (error) {
      console.error("Error removing item:", error);
    } finally {
      setIsRemovingItem(false);
    }
  };

  // Open the remove item dialog
  const openRemoveItemDialog = (item: any) => {
    setItemToRemove(item);
    setIsRemoveItemOpen(true);
  };

  // Toggle project visibility
  const toggleProjectVisibility = async () => {
    if (!currentProject || !projectId) return;
    
    try {
      await updateProject(projectId, {
        isPublic: !currentProject.isPublic
      });
      toast({
        title: "Project updated",
        description: `The project is now ${!currentProject.isPublic ? 'public' : 'private'}.`,
      });
    } catch (error) {
      console.error("Error updating project visibility:", error);
    }
  };

  // Render project not found
  if (!isLoadingProjects && !currentProject) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The project you're looking for might have been deleted or you don't have access to it.
        </p>
        <Link href="/shared-projects">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/shared-projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> 
              Back
            </Button>
          </Link>
          
          {currentProject && (
            <Badge variant={currentProject.isPublic ? "default" : "outline"} className="ml-auto">
              {currentProject.isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {currentProject.isPublic ? "Public" : "Private"}
            </Badge>
          )}
          
          {isProjectAdmin() && currentProject && (
            <Button variant="outline" size="sm" onClick={toggleProjectVisibility}>
              {currentProject.isPublic ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Make Public
                </>
              )}
            </Button>
          )}
        </div>

        {isLoadingProjects ? (
          <div>
            <Skeleton className="h-10 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-6" />
          </div>
        ) : currentProject ? (
          <div>
            <h1 className="text-3xl font-bold">{currentProject.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-2">
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created {format(new Date(currentProject.createdAt), 'MMM d, yyyy')}
              </span>
              <span className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Updated {format(new Date(currentProject.updatedAt), 'MMM d, yyyy')}
              </span>
            </div>
            {currentProject.description && (
              <p className="mt-4 text-muted-foreground">{currentProject.description}</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Tabs for members, items, and comments */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="items">
            <FileText className="mr-2 h-4 w-4" />
            Project Items
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageCircle className="mr-2 h-4 w-4" />
            Comments
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Members</h2>
            {isProjectAdmin() && (
              <Button onClick={() => setIsAddMemberOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
          
          {isLoadingMembers ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-1/4 mb-2" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : projectMembers.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No project members</h3>
              <p className="text-muted-foreground mb-6">
                This project doesn't have any members yet apart from the creator.
              </p>
              {isProjectAdmin() && (
                <Button onClick={() => setIsAddMemberOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isProjectAdmin() && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProject && (
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {currentProject.createdById === user?.id ? user.username?.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {currentProject.createdById === user?.id ? 'You' : 'Project Creator'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {currentProject.createdById === user?.id ? user.username : ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">Owner</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(currentProject.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      {isProjectAdmin() && (
                        <TableCell className="text-right">
                          {/* Can't modify the owner */}
                        </TableCell>
                      )}
                    </TableRow>
                  )}
                  
                  {projectMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {member.user ? member.user.username?.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {member.userId === user?.id ? 'You' : member.user?.username || `User ${member.userId}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.user?.name || ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isProjectAdmin() ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleUpdateMemberRole(member.userId, value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="viewer">Viewer</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">{member.role.charAt(0).toUpperCase() + member.role.slice(1)}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                      </TableCell>
                      {isProjectAdmin() && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openRemoveMemberDialog(member)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Items</h2>
            {canEdit() && (
              <Button onClick={() => setIsAddItemOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            )}
          </div>
          
          {isLoadingItems ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <Skeleton className="h-6 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : projectItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-6">
                This project doesn't have any items yet. Add calculations, matrices, or what-if scenarios.
              </p>
              {canEdit() && (
                <Button onClick={() => setIsAddItemOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      {item.itemType === 'calculation' && (
                        <Calculator className="h-4 w-4 mr-2" />
                      )}
                      {item.itemType === 'cost_matrix' && (
                        <Building className="h-4 w-4 mr-2" />
                      )}
                      {item.itemType === 'what_if_scenario' && (
                        <Share2 className="h-4 w-4 mr-2" />
                      )}
                      {item.itemData?.name || `${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} #${item.itemId}`}
                    </CardTitle>
                    <CardDescription>
                      {item.itemType === 'calculation' && 'Cost Calculation'}
                      {item.itemType === 'cost_matrix' && 'Cost Matrix'}
                      {item.itemType === 'what_if_scenario' && 'What-If Scenario'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {item.itemType === 'calculation' && item.itemData && (
                      <div className="text-sm">
                        <p>Region: {item.itemData.region}</p>
                        <p>Building Type: {item.itemData.buildingType}</p>
                        <p>Total Cost: ${parseFloat(item.itemData.totalCost).toLocaleString()}</p>
                      </div>
                    )}
                    
                    {item.itemType === 'cost_matrix' && item.itemData && (
                      <div className="text-sm">
                        <p>Region: {item.itemData.region}</p>
                        <p>Building Type: {item.itemData.buildingType}</p>
                        <p>Year: {item.itemData.matrixYear}</p>
                      </div>
                    )}
                    
                    {item.itemType === 'what_if_scenario' && item.itemData && (
                      <div className="text-sm">
                        <p>{item.itemData.description || 'No description'}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Link href={
                      item.itemType === 'calculation' ? `/calculator/${item.itemId}` :
                      item.itemType === 'cost_matrix' ? `/cost-matrix/${item.itemId}` :
                      item.itemType === 'what_if_scenario' ? `/what-if-scenarios/${item.itemId}` :
                      '#'
                    }>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                    
                    {canEdit() && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openRemoveItemDialog(item)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Project Comments</h2>
          </div>

          {!currentProject ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <CommentsSection 
              targetType="project" 
              targetId={projectId} 
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Project</DialogTitle>
            <DialogDescription>
              Add a team member to collaborate on this project.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddMember}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  placeholder="Enter user ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The user must be registered on the platform.
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Viewer:</span> Can only view project content.<br />
                  <span className="font-medium">Editor:</span> Can view and add items to the project.<br />
                  <span className="font-medium">Admin:</span> Can manage members and project settings.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddMemberOpen(false)}
                disabled={isAddingMember}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingMember}>
                {isAddingMember ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveMemberOpen} onOpenChange={setIsRemoveMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the project?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {memberToRemove && memberToRemove.user && (
              <p className="font-medium">{memberToRemove.user.username || `User ID: ${memberToRemove.userId}`}</p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRemoveMemberOpen(false)}
              disabled={isRemovingMember}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
            >
              {isRemovingMember ? "Removing..." : "Remove Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Item to Project</DialogTitle>
            <DialogDescription>
              Add a calculation, cost matrix, or what-if scenario to this project.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddItem}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item-type">Item Type</Label>
                <Select value={itemType} onValueChange={setItemType}>
                  <SelectTrigger id="item-type">
                    <SelectValue placeholder="Select an item type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calculation">Cost Calculation</SelectItem>
                    <SelectItem value="cost_matrix">Cost Matrix</SelectItem>
                    <SelectItem value="what_if_scenario">What-If Scenario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="item-id">Item ID</Label>
                <Input
                  id="item-id"
                  type="number"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  placeholder="Enter item ID"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The ID of the item you want to add to this project.
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddItemOpen(false)}
                disabled={isAddingItem}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingItem}>
                {isAddingItem ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Item Dialog */}
      <Dialog open={isRemoveItemOpen} onOpenChange={setIsRemoveItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from the project? The item itself will not be deleted.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {itemToRemove && (
              <p className="font-medium">
                {itemToRemove.itemData?.name || 
                  `${itemToRemove.itemType.charAt(0).toUpperCase() + itemToRemove.itemType.slice(1)} #${itemToRemove.itemId}`}
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRemoveItemOpen(false)}
              disabled={isRemovingItem}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRemoveItem}
              disabled={isRemovingItem}
            >
              {isRemovingItem ? "Removing..." : "Remove Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetailsPage;