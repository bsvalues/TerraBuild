import React, { useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  Globe,
  Lock,
  Loader2,
  Share2,
  Link2,
  CalendarIcon,
  Clock,
  Key,
  ShieldAlert,
  Eye,
  Edit,
  CheckCircle,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface ProjectSharingControlsProps {
  projectId: number;
  projectName: string;
  isPublic: boolean;
  isOwner: boolean;
  currentUserId: number;
  currentUserRole: string;
}

export default function ProjectSharingControls({
  projectId,
  projectName,
  isPublic,
  isOwner,
  currentUserId,
  currentUserRole,
}: ProjectSharingControlsProps) {
  const { user } = useAuth();
  const {
    setProjectPublic,
    sharedLinks,
    isLinksLoading,
    createSharedLink,
    deleteSharedLink,
    refreshLinks
  } = useCollaboration();
  
  const [isChangingVisibility, setIsChangingVisibility] = useState(false);
  const [projectVisibility, setProjectVisibility] = useState(isPublic);
  
  // For link creation
  const [newLinkOpen, setNewLinkOpen] = useState(false);
  const [newLinkAccess, setNewLinkAccess] = useState('view');
  const [newLinkExpiry, setNewLinkExpiry] = useState<Date | undefined>(undefined);
  const [newLinkDescription, setNewLinkDescription] = useState('');
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  // For link deletion
  const [linkToDelete, setLinkToDelete] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeletingLink, setIsDeletingLink] = useState(false);
  
  // Check permissions
  const canManageLinks = isOwner || currentUserRole === 'admin';
  const canChangeVisibility = isOwner;
  
  const handleVisibilityChange = async (checked: boolean) => {
    if (!canChangeVisibility) return;
    
    setIsChangingVisibility(true);
    setProjectVisibility(checked); // Optimistic update
    
    try {
      await setProjectPublic(projectId, checked);
      toast({
        title: checked ? 'Project is now public' : 'Project is now private',
        description: checked 
          ? 'Anyone with the link can view this project' 
          : 'Only invited members can access this project',
      });
    } catch (error) {
      console.error('Error changing project visibility', error);
      setProjectVisibility(!checked); // Revert on error
      toast({
        title: 'Error',
        description: 'Failed to update project visibility',
        variant: 'destructive',
      });
    } finally {
      setIsChangingVisibility(false);
    }
  };
  
  const handleCreateLink = async () => {
    if (!canManageLinks) return;
    
    setIsCreatingLink(true);
    try {
      await createSharedLink({
        projectId,
        accessLevel: newLinkAccess,
        expiresAt: newLinkExpiry ? newLinkExpiry.toISOString() : null,
        description: newLinkDescription || null,
      });
      
      // Reset form and close dialog
      setNewLinkOpen(false);
      setNewLinkAccess('view');
      setNewLinkExpiry(undefined);
      setNewLinkDescription('');
      
      toast({
        title: 'Link created',
        description: 'Shared link has been created successfully',
      });
      
      refreshLinks();
    } catch (error) {
      console.error('Error creating shared link', error);
      toast({
        title: 'Error',
        description: 'Failed to create shared link',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingLink(false);
    }
  };
  
  const handleDeleteLink = (linkId: number) => {
    setLinkToDelete(linkId);
    setConfirmDeleteOpen(true);
  };
  
  const confirmDeleteLink = async () => {
    if (linkToDelete === null) return;
    
    setIsDeletingLink(true);
    try {
      await deleteSharedLink(projectId, linkToDelete);
      setConfirmDeleteOpen(false);
      setLinkToDelete(null);
      
      toast({
        title: 'Link deleted',
        description: 'Shared link has been deleted',
      });
      
      refreshLinks();
    } catch (error) {
      console.error('Error deleting shared link', error);
      toast({
        title: 'Error',
        description: 'Failed to delete shared link',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingLink(false);
    }
  };
  
  const copyLinkToClipboard = (token: string) => {
    // Use window.location to get the base URL
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    const shareUrl = `${baseUrl}/shared/${token}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast({
          title: 'Link copied',
          description: 'Shared link has been copied to clipboard',
        });
      })
      .catch((error) => {
        console.error('Error copying to clipboard', error);
        toast({
          title: 'Error',
          description: 'Failed to copy link to clipboard',
          variant: 'destructive',
        });
      });
  };
  
  const getAccessLevelBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'view':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <Eye className="h-3 w-3 mr-1" />
            View only
          </Badge>
        );
      case 'edit':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <Edit className="h-3 w-3 mr-1" />
            Edit access
          </Badge>
        );
      case 'admin':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Admin access
          </Badge>
        );
      default:
        return <Badge>{accessLevel}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Share2 className="h-5 w-5 mr-2" />
          Sharing Controls
        </CardTitle>
        <CardDescription>
          Manage project visibility and sharing options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Visibility Section */}
        <div>
          <h3 className="text-sm font-medium mb-3">Project Visibility</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center space-x-3">
              {projectVisibility ? (
                <>
                  <div className="rounded-full bg-green-50 p-2">
                    <Globe className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Public project</div>
                    <div className="text-sm text-muted-foreground">Anyone with the link can view this project</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-amber-50 p-2">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium">Private project</div>
                    <div className="text-sm text-muted-foreground">Only invited members can access this project</div>
                  </div>
                </>
              )}
            </div>
            
            {canChangeVisibility && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="visibility-toggle" className="select-none cursor-pointer">
                  {isChangingVisibility ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : projectVisibility ? "Public" : "Private"}
                </Label>
                <Switch
                  id="visibility-toggle"
                  checked={projectVisibility}
                  onCheckedChange={handleVisibilityChange}
                  disabled={isChangingVisibility}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* Shared Links Section */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Shared Links</h3>
            
            {canManageLinks && (
              <Dialog open={newLinkOpen} onOpenChange={setNewLinkOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Shared Link</DialogTitle>
                    <DialogDescription>
                      Generate a new link to share this project with others.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="grid gap-4 py-4">
                    {/* Access Level */}
                    <div className="grid gap-2">
                      <Label htmlFor="access-level">Access Level</Label>
                      <Select
                        value={newLinkAccess}
                        onValueChange={setNewLinkAccess}
                      >
                        <SelectTrigger id="access-level">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View Only</SelectItem>
                          <SelectItem value="edit">Can Edit</SelectItem>
                          <SelectItem value="admin">Admin Access</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {newLinkAccess === 'view' && "Recipients can only view the project content."}
                        {newLinkAccess === 'edit' && "Recipients can make changes to the project."}
                        {newLinkAccess === 'admin' && "Recipients have full administrative access."}
                      </p>
                    </div>
                    
                    {/* Expiration */}
                    <div className="grid gap-2">
                      <Label htmlFor="expiry-date">Expiration Date (Optional)</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="expiry-date"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newLinkExpiry && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newLinkExpiry ? format(newLinkExpiry, "PPP") : "No expiration"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newLinkExpiry}
                            onSelect={setNewLinkExpiry}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-3" 
                          onClick={() => setNewLinkExpiry(undefined)}
                          disabled={!newLinkExpiry}
                        >
                          Clear date
                        </Button>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="grid gap-2">
                      <Label htmlFor="link-description">Description (Optional)</Label>
                      <Textarea
                        id="link-description"
                        placeholder="e.g., For client review, Shared with the design team, etc."
                        value={newLinkDescription}
                        onChange={(e) => setNewLinkDescription(e.target.value)}
                        className="resize-none"
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setNewLinkOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateLink} disabled={isCreatingLink}>
                      {isCreatingLink ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          Create Link
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {isLinksLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sharedLinks.length === 0 ? (
            <div className="text-center border rounded-lg p-8">
              <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
                <Link2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No shared links</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                {canManageLinks 
                  ? "Create a link to share this project with others without inviting them as members."
                  : "No shared links have been created for this project yet."}
              </p>
              {canManageLinks && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setNewLinkOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create a shared link
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {sharedLinks.map((link) => (
                <div key={link.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <Link2 className="h-4 w-4 mr-2 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {link.description || `Shared link (${format(new Date(link.createdAt), "MMM d, yyyy")})`}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Created {format(new Date(link.createdAt), "PPP")}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3"
                        onClick={() => copyLinkToClipboard(link.token)}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        Copy
                      </Button>
                      
                      {canManageLinks && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {getAccessLevelBadge(link.accessLevel)}
                    
                    {link.expiresAt ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                        <CalendarIcon className="h-3 w-3 mr-1" />
                        Expires {format(new Date(link.expiresAt), "MMM d, yyyy")}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Never expires
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      <Key className="h-3 w-3 mr-1" />
                      {link.token.substring(0, 8)}...
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Delete Link Confirmation Dialog */}
        <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Shared Link</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this shared link?
                Anyone using this link will no longer be able to access the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingLink}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteLink}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletingLink}
              >
                {isDeletingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Link"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}