import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserRoundPlus, Link as LinkIcon, Copy, Trash2, Users, Clock } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProjectMember {
  id: number;
  userId: number;
  projectId: number;
  role: string;
  joinedAt: string;
  user: {
    username: string;
    name: string | null;
  };
}

interface ShareLink {
  id: number;
  token: string;
  projectId: number;
  createdAt: string;
  createdBy: number;
  accessLevel: string;
  description: string | null;
  expiresAt: string | null;
}

interface ProjectSharingControlsProps {
  projectId: number;
  projectName: string;
  isOwner: boolean;
  isPublic?: boolean;
  currentUserId?: number;
  currentUserRole?: string;
  className?: string;
}

export default function ProjectSharingControls({
  projectId,
  projectName,
  isOwner,
  isPublic,
  currentUserId,
  currentUserRole,
  className
}: ProjectSharingControlsProps) {
  const { toast } = useToast();
  const [isPublicDialogOpen, setIsPublicDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [createLinkDialogOpen, setCreateLinkDialogOpen] = useState(false);
  const [linkDescription, setLinkDescription] = useState('');
  const [linkAccessLevel, setLinkAccessLevel] = useState('read');
  const [linkExpiration, setLinkExpiration] = useState('never');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  // Fetch project details to get public status
  const { data: projectData, isLoading: isProjectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}`);
      return response;
    }
  });

  // Fetch project members
  const { data: membersData, isLoading: isMembersLoading } = useQuery({
    queryKey: ['/api/projects/members', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/members`);
      return response;
    }
  });

  // Fetch share links
  const { data: linksData, isLoading: isLinksLoading } = useQuery({
    queryKey: ['/api/projects/links', projectId],
    queryFn: async () => {
      const response = await apiRequest(`/api/projects/${projectId}/links`);
      return response;
    }
  });

  // Toggle project public status
  const togglePublicMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      return await apiRequest(`/api/projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects/public'] });
      toast({
        title: projectData?.isPublic ? 'Project is now private' : 'Project is now public',
        description: projectData?.isPublic 
          ? 'Only invited members can access this project' 
          : 'Anyone can view this project'
      });
      setIsPublicDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error updating project',
        description: 'Failed to update project visibility',
        variant: 'destructive'
      });
    }
  });

  // Invite a user to the project
  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      return await apiRequest(`/api/projects/${projectId}/invitations`, {
        method: 'POST',
        body: JSON.stringify({ email, role })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/members', projectId] });
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${inviteEmail}`
      });
      setInviteEmail('');
      setInviteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error sending invitation',
        description: 'Failed to send invitation',
        variant: 'destructive'
      });
    }
  });

  // Remove a member from the project
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/projects/${projectId}/members/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/members', projectId] });
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the project'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error removing member',
        description: 'Failed to remove member from project',
        variant: 'destructive'
      });
    }
  });

  // Create a sharing link
  const createLinkMutation = useMutation({
    mutationFn: async (linkData: { 
      accessLevel: string; 
      description: string;
      expiration?: string;
    }) => {
      const body: any = {
        accessLevel: linkData.accessLevel,
        description: linkData.description || null
      };
      
      if (linkData.expiration && linkData.expiration !== 'never') {
        const days = parseInt(linkData.expiration);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
        body.expiresAt = expiresAt.toISOString();
      }
      
      return await apiRequest(`/api/projects/${projectId}/links`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/links', projectId] });
      
      // Copy link to clipboard
      const shareUrl = `${window.location.origin}/projects/shared/${data.token}`;
      navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: 'Share link created',
        description: 'The link has been copied to your clipboard'
      });
      
      setLinkDescription('');
      setLinkAccessLevel('read');
      setLinkExpiration('never');
      setCreateLinkDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error creating link',
        description: 'Failed to create sharing link',
        variant: 'destructive'
      });
    }
  });

  // Delete a sharing link
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      return await apiRequest(`/api/projects/${projectId}/links/${linkId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects/links', projectId] });
      toast({
        title: 'Link deleted',
        description: 'The sharing link has been deleted'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting link',
        description: 'Failed to delete sharing link',
        variant: 'destructive'
      });
    }
  });

  // Copy a sharing link to clipboard
  const copyLink = (token: string) => {
    const shareUrl = `${window.location.origin}/projects/shared/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: 'Link copied',
      description: 'The sharing link has been copied to your clipboard'
    });
  };

  // Get role display with icon
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <span className="flex items-center text-primary">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Owner
          </span>
        );
      case 'editor':
        return (
          <span className="flex items-center text-secondary">
            <Users className="w-3.5 h-3.5 mr-1" />
            Editor
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="flex items-center text-muted-foreground">
            <Users className="w-3.5 h-3.5 mr-1" />
            Viewer
          </span>
        );
    }
  };

  // Get access level display with icon and color
  const getAccessLevelDisplay = (level: string) => {
    switch (level) {
      case 'edit':
        return <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">Editor Access</Badge>;
      case 'read':
      default:
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">View Only</Badge>;
    }
  };

  // Format expiration date
  const formatExpiration = (expiresAt: string | null) => {
    if (!expiresAt) return 'Never expires';
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    
    const diffDays = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Expired';
    if (diffDays === 1) return 'Expires today';
    if (diffDays < 30) return `Expires in ${diffDays} days`;
    
    return `Expires on ${expirationDate.toLocaleDateString()}`;
  };

  // Use prop value if provided, otherwise use fetched data
  const isProjectPublic = isPublic !== undefined ? isPublic : (projectData?.isPublic || false);
  const members = membersData || [];
  const shareLinks = linksData || [];

  return (
    <div className={cn("space-y-8", className)}>
      {/* Public Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Public Access</span>
            {isOwner && (
              <Switch 
                checked={isProjectPublic} 
                onCheckedChange={() => setIsPublicDialogOpen(true)}
                disabled={!isOwner}
              />
            )}
            {!isOwner && (
              <Badge variant={isProjectPublic ? "outline" : "default"} className="ml-auto opacity-70">
                {isProjectPublic ? "Public" : "Private"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isProjectPublic 
              ? 'This project is publicly accessible to anyone with the link' 
              : 'This project is private and only accessible to invited members'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Team Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Members</span>
            {isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setInviteDialogOpen(true)}
                className="ml-auto"
              >
                <UserRoundPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Manage who has access to this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMembersLoading ? (
            <div className="flex items-center justify-center py-8">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-muted-foreground font-medium">No team members yet</p>
              <p className="text-muted-foreground/70 text-sm">
                Invite others to collaborate on this project
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member: ProjectMember) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium">
                      {member.user.name || member.user.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {member.user.username}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      {getRoleDisplay(member.role)}
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground/70 hover:text-destructive"
                              onClick={() => removeMemberMutation.mutate(member.userId)}
                              disabled={currentUserId === member.userId}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{currentUserId === member.userId ? "Cannot remove yourself" : "Remove member"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sharing Links Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sharing Links</span>
            {isOwner && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCreateLinkDialogOpen(true)}
                className="ml-auto"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Create and manage links to share this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLinksLoading ? (
            <div className="flex items-center justify-center py-8">Loading sharing links...</div>
          ) : shareLinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <LinkIcon className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-muted-foreground font-medium">No sharing links</p>
              <p className="text-muted-foreground/70 text-sm">
                Create a link to share this project with others
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {shareLinks.map((link: ShareLink) => (
                <div 
                  key={link.id} 
                  className="flex flex-col border rounded-md p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {link.description || 'Untitled Link'}
                    </div>
                    <div className="flex gap-1">
                      {/* Anyone can copy the link */}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => copyLink(link.token)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy link</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Only owner can delete links */}
                      {isOwner && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-muted-foreground/70 hover:text-destructive"
                                onClick={() => deleteLinkMutation.mutate(link.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete link</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {getAccessLevelDisplay(link.accessLevel)}
                    <span className="text-muted-foreground flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {formatExpiration(link.expiresAt)}
                    </span>
                    
                    {/* Show who created the link if you're not the owner */}
                    {!isOwner && currentUserRole !== 'owner' && (
                      <Badge variant="outline" className="ml-2 opacity-70">
                        Created by owner
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Make Public/Private Dialog */}
      <Dialog open={isPublicDialogOpen} onOpenChange={setIsPublicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isProjectPublic ? 'Make Project Private?' : 'Make Project Public?'}
            </DialogTitle>
            <DialogDescription>
              {isProjectPublic 
                ? 'This will restrict access to invited members only.' 
                : 'This will allow anyone with the link to view this project.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsPublicDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant={isProjectPublic ? "default" : "default"}
              onClick={() => togglePublicMutation.mutate(!isProjectPublic)}
            >
              {isProjectPublic ? 'Make Private' : 'Make Public'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                placeholder="colleague@example.com" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={inviteRole} 
                onValueChange={setInviteRole}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (can only view)</SelectItem>
                  <SelectItem value="editor">Editor (can edit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setInviteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole })}
              disabled={!inviteEmail}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Share Link Dialog */}
      <Dialog open={createLinkDialogOpen} onOpenChange={setCreateLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create Sharing Link
            </DialogTitle>
            <DialogDescription>
              Generate a link to share this project with others.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Link description (optional)</Label>
              <Input 
                id="description" 
                placeholder="e.g., For the design team" 
                value={linkDescription}
                onChange={(e) => setLinkDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessLevel">Access level</Label>
              <Select 
                value={linkAccessLevel} 
                onValueChange={setLinkAccessLevel}
              >
                <SelectTrigger id="accessLevel">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">View only</SelectItem>
                  <SelectItem value="edit">Can edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration</Label>
              <Select 
                value={linkExpiration} 
                onValueChange={setLinkExpiration}
              >
                <SelectTrigger id="expiration">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never expires</SelectItem>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCreateLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createLinkMutation.mutate({ 
                accessLevel: linkAccessLevel, 
                description: linkDescription,
                expiration: linkExpiration
              })}
            >
              Create Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}