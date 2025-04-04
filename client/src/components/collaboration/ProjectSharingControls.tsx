import React, { useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GlobeIcon, Lock, Users, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import InviteUserDialog from './InviteUserDialog';

interface ProjectSharingControlsProps {
  projectId: number;
  isPublic: boolean;
  isOwner: boolean;
}

const ProjectSharingControls: React.FC<ProjectSharingControlsProps> = ({
  projectId,
  isPublic,
  isOwner,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  
  const { updateProject, projectMembers } = useCollaboration();
  const { toast } = useToast();

  const handleVisibilityChange = async () => {
    if (!isOwner) return;
    
    setIsUpdating(true);
    
    try {
      const newIsPublic = !currentIsPublic;
      await updateProject(projectId, { isPublic: newIsPublic });
      setCurrentIsPublic(newIsPublic);
      
      toast({
        title: 'Project visibility updated',
        description: `Project is now ${newIsPublic ? 'public' : 'private'}.`,
      });
    } catch (error) {
      console.error('Error updating project visibility:', error);
      toast({
        title: 'Error updating visibility',
        description: 'There was a problem updating the project visibility.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const copyProjectLink = () => {
    const link = `${window.location.origin}/projects/${projectId}`;
    navigator.clipboard.writeText(link);
    
    toast({
      title: 'Link copied',
      description: 'Project link copied to clipboard.',
    });
  };

  // Count members by role
  const memberCounts = {
    admin: projectMembers.filter(m => m.role === 'admin').length,
    editor: projectMembers.filter(m => m.role === 'editor').length,
    viewer: projectMembers.filter(m => m.role === 'viewer').length,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Project Sharing
        </CardTitle>
        <CardDescription>
          Control who can access and collaborate on this project
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Visibility Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-0.5">
              <div className="flex items-center">
                {currentIsPublic ? (
                  <GlobeIcon className="h-5 w-5 mr-2 text-primary" />
                ) : (
                  <Lock className="h-5 w-5 mr-2 text-muted-foreground" />
                )}
                <Label htmlFor="project-visibility" className="font-medium">
                  Project Visibility
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentIsPublic
                  ? "Anyone can find and view this project"
                  : "Only invited members can access this project"}
              </p>
            </div>
            <Switch
              id="project-visibility"
              checked={currentIsPublic}
              onCheckedChange={handleVisibilityChange}
              disabled={!isOwner || isUpdating}
            />
          </div>
          
          <div className="bg-muted/40 rounded-md p-3 text-sm">
            {currentIsPublic ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span>This project is visible to anyone with the link</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span>The project will appear in public listings</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span>Non-members can view but not edit content</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span>Only project members can access content</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span>The project won't appear in public listings</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                  <span>You control who can view or edit</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Share Link */}
        <div className="space-y-2">
          <Label className="font-medium">Share Link</Label>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              className="flex-1 flex items-center justify-center" 
              onClick={copyProjectLink}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Copy Project Link
            </Button>
          </div>
        </div>
        
        {/* Members Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-medium">Project Members</Label>
            <div className="flex gap-2">
              {memberCounts.admin > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  {memberCounts.admin} Admin{memberCounts.admin !== 1 ? 's' : ''}
                </Badge>
              )}
              {memberCounts.editor > 0 && (
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {memberCounts.editor} Editor{memberCounts.editor !== 1 ? 's' : ''}
                </Badge>
              )}
              {memberCounts.viewer > 0 && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {memberCounts.viewer} Viewer{memberCounts.viewer !== 1 ? 's' : ''}
                </Badge>
              )}
              {Object.values(memberCounts).reduce((sum, count) => sum + count, 0) === 0 && (
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  No members yet
                </Badge>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {Object.values(memberCounts).reduce((sum, count) => sum + count, 0) === 0
              ? "You haven't invited any members to this project yet."
              : `This project has ${Object.values(memberCounts).reduce((sum, count) => sum + count, 0)} member${Object.values(memberCounts).reduce((sum, count) => sum + count, 0) !== 1 ? 's' : ''} (excluding you).`}
          </p>
        </div>
      </CardContent>
      
      <CardFooter>
        <InviteUserDialog 
          projectId={projectId}
          buttonLabel="Invite New Member"
          buttonVariant="default"
          buttonSize="default"
          className="w-full"
        />
      </CardFooter>
    </Card>
  );
};

export default ProjectSharingControls;