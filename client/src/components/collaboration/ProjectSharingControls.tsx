import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Globe,
  Lock,
  Users,
  User,
  Edit,
  EyeIcon,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const { toast } = useToast();
  const { 
    projectMembers, 
    updateProject, 
    updateMemberRole, 
    removeMember,
    currentProject,
  } = useCollaboration();

  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  // Toggle project visibility between public and private
  const handleToggleVisibility = async () => {
    if (!isOwner) return;
    
    setIsUpdatingVisibility(true);
    
    try {
      await updateProject(projectId, { isPublic: !isPublic });
      
      toast({
        title: `Project is now ${!isPublic ? 'public' : 'private'}`,
        description: !isPublic
          ? 'Anyone can view this project'
          : 'Only team members can view this project',
      });
    } catch (error) {
      console.error('Error updating project visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project visibility',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  // Change a member's role (e.g., from viewer to editor)
  const handleChangeRole = async (userId: number, newRole: string) => {
    if (!isOwner) return;
    
    try {
      await updateMemberRole(projectId, userId, newRole);
      
      toast({
        title: 'Role updated',
        description: `User's role has been updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    }
  };

  // Remove a member from the project
  const handleRemoveMember = async () => {
    if (!isOwner || memberToRemove === null) return;
    
    setIsRemovingMember(true);
    
    try {
      await removeMember(projectId, memberToRemove);
      
      toast({
        title: 'Member removed',
        description: 'The user has been removed from the project',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member from project',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingMember(false);
      setMemberToRemove(null);
      setConfirmRemoveOpen(false);
    }
  };

  // Helper function to get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <EyeIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Visibility Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {isPublic ? (
              <Globe className="h-5 w-5 mr-2 text-blue-500" />
            ) : (
              <Lock className="h-5 w-5 mr-2 text-orange-500" />
            )}
            Project Visibility
          </CardTitle>
          <CardDescription>
            Control who can see and access this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{isPublic ? 'Public' : 'Private'}</div>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? 'Anyone can view this project'
                  : 'Only team members can view this project'}
              </p>
            </div>
            {isOwner && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="project-visibility"
                  checked={isPublic}
                  onCheckedChange={handleToggleVisibility}
                  disabled={isUpdatingVisibility}
                />
                <Label htmlFor="project-visibility">
                  {isPublic ? 'Public' : 'Private'}
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage who has access to this project
            </CardDescription>
          </div>
          {isOwner && (
            <InviteUserDialog
              projectId={projectId}
              buttonVariant="outline"
              buttonSize="sm"
            />
          )}
        </CardHeader>
        <CardContent>
          {projectMembers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  {isOwner && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user?.name || member.user?.username || `User ${member.userId}`}
                    </TableCell>
                    <TableCell className="flex items-center space-x-1">
                      {getRoleIcon(member.role)}
                      <span className="capitalize">{member.role}</span>
                    </TableCell>
                    {isOwner && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'admin')}>
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'editor')}>
                              <Edit className="h-4 w-4 mr-2" />
                              Make Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChangeRole(member.userId, 'viewer')}>
                              <EyeIcon className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setMemberToRemove(member.userId);
                                setConfirmRemoveOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No team members yet
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            {isOwner
              ? "As the project owner, you can invite others and manage their access."
              : "Contact the project owner to invite more people."}
          </p>
        </CardFooter>
      </Card>

      {/* Confirm Remove Member Dialog */}
      <AlertDialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this user from the project? They will lose all access to this project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemovingMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemovingMember ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectSharingControls;