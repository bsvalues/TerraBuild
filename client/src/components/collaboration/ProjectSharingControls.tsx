import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Lock, Share2, Link, Copy, Check } from 'lucide-react';
import InviteUserDialog from '@/components/collaboration/InviteUserDialog';
import { Badge } from '@/components/ui/badge';

interface ProjectSharingControlsProps {
  projectId: number;
  isPublic: boolean;
  isAdmin: boolean;
}

const ProjectSharingControls: React.FC<ProjectSharingControlsProps> = ({ 
  projectId, 
  isPublic, 
  isAdmin 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Project URL for sharing
  const projectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/shared-projects/${projectId}`
    : '';
  
  // Toggle public status mutation
  const togglePublicMutation = useMutation({
    mutationFn: async (makePublic: boolean) => {
      const response = await apiRequest(`/api/shared-projects/${projectId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublic: makePublic }),
        headers: { 'Content-Type': 'application/json' }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/public'] });
      toast({
        title: isPublic ? 'Project is now private' : 'Project is now public',
        description: isPublic 
          ? 'Only invited members can access this project now.' 
          : 'Anyone can view this project now.',
      });
    },
    onError: () => {
      toast({
        title: 'Failed to update project',
        description: 'There was an error updating the project visibility.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle toggling public status
  const handleTogglePublic = async () => {
    setIsUpdating(true);
    try {
      await togglePublicMutation.mutateAsync(!isPublic);
    } catch (error) {
      console.error("Error toggling project visibility:", error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle copying link to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectUrl).then(() => {
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Project link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Share2 className="mr-2 h-5 w-5" />
            Project Sharing
            <Badge variant={isPublic ? "default" : "outline"} className="ml-auto">
              {isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
              {isPublic ? "Public" : "Private"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage how this project is shared with others
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isAdmin && (
            <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-0.5">
                <Label htmlFor="public-toggle" className="text-base">Public Access</Label>
                <p className="text-sm text-muted-foreground">
                  {isPublic 
                    ? "Anyone with the link can view this project" 
                    : "Only invited members can access this project"}
                </p>
              </div>
              <Switch
                id="public-toggle"
                checked={isPublic}
                onCheckedChange={handleTogglePublic}
                disabled={isUpdating}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-base">Share Link</Label>
            <div className="flex items-center">
              <div className="bg-muted p-2 rounded-l-md flex-1 text-sm truncate">
                {projectUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="rounded-l-none"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isPublic 
                ? "Anyone with this link can view the project" 
                : "Only invited members can access this link"}
            </p>
          </div>
        </CardContent>
        
        <CardFooter>
          {isAdmin && (
            <Button 
              onClick={() => setShowInviteDialog(true)}
              className="w-full"
            >
              <Link className="mr-2 h-4 w-4" />
              Invite Users
            </Button>
          )}
        </CardFooter>
      </Card>
      
      {isAdmin && (
        <InviteUserDialog 
          projectId={projectId} 
          open={showInviteDialog} 
          onOpenChange={setShowInviteDialog} 
        />
      )}
    </>
  );
};

export default ProjectSharingControls;