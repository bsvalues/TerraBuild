import React, { useState } from 'react';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MoreHorizontal, Shield, User, UserMinus } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useProjectContext, ProjectMember } from '@/contexts/ProjectContext';
import { useQueryClient } from '@tanstack/react-query';

// Using ProjectMember type from ProjectContext

interface ProjectMembersTableProps {
  projectId: number;
  members: ProjectMember[];
  isLoading: boolean;
  currentUserRole: string;
  currentUserId: number;
}

const ProjectMembersTable: React.FC<ProjectMembersTableProps> = ({
  projectId,
  members,
  isLoading,
  currentUserRole,
  currentUserId
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { project } = useProjectContext();

  const canManageMembers = currentUserRole === 'admin' || (project && project.createdById === currentUserId);

  const getRoleBadgeVariant = (role: string): "default" | "danger" | "outline" | "success" | "warning" | null | undefined => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'editor':
        return 'default';
      case 'viewer':
      default:
        return 'outline';
    }
  };

  const handleRemoveMember = async () => {
    if (!removingUserId) return;
    
    setIsActionLoading(true);
    
    try {
      const response = await apiRequest(`/api/shared-projects/${projectId}/members/${removingUserId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove member');
      }
      
      // Invalidate query to refresh members list
      queryClient.invalidateQueries({ queryKey: [`/api/shared-projects/${projectId}/members`] });
      
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the project',
      });
      
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove member',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
      setIsDialogOpen(false);
      setRemovingUserId(null);
    }
  };
  
  const handleChangeRole = async (userId: number, newRole: string) => {
    setIsActionLoading(true);
    
    try {
      const response = await apiRequest(`/api/shared-projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change role');
      }
      
      // Invalidate query to refresh members list
      queryClient.invalidateQueries({ queryKey: [`/api/shared-projects/${projectId}/members`] });
      
      toast({
        title: 'Role updated',
        description: `The member's role has been updated to ${newRole}`,
      });
      
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change role',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const confirmRemoveMember = (userId: number) => {
    setRemovingUserId(userId);
    setIsDialogOpen(true);
  };

  // Get project owner
  const projectOwner = members.find(member => project && member.userId === project.createdById);
  
  // Get sorted members (owner first, then by role, then alphabetically)
  const sortedMembers = [...members].sort((a, b) => {
    // Project owner always first
    if (project && a.userId === project.createdById) return -1;
    if (project && b.userId === project.createdById) return 1;
    
    // Then sort by role importance
    const roleImportance = { 'admin': 0, 'editor': 1, 'viewer': 2 };
    const aImportance = roleImportance[a.role as keyof typeof roleImportance] || 3;
    const bImportance = roleImportance[b.role as keyof typeof roleImportance] || 3;
    
    if (aImportance !== bImportance) {
      return aImportance - bImportance;
    }
    
    // Finally sort by username
    return (a.user.username || '').localeCompare(b.user.username || '');
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Project Members</h3>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading members...</TableCell>
              </TableRow>
            ) : sortedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No members found</TableCell>
              </TableRow>
            ) : (
              sortedMembers.map((member) => {
                const isOwner = project && member.userId === project.createdById;
                const isCurrentUser = member.userId === currentUserId;
                const canBeManaged = canManageMembers && !isOwner && (!isCurrentUser || currentUserRole === 'admin');
                
                return (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {isOwner ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                      {member.user.username}
                      {isCurrentUser && <Badge variant="outline">You</Badge>}
                    </TableCell>
                    <TableCell>{member.user.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role}
                      </Badge>
                      {isOwner && <Badge variant="outline" className="ml-2">Owner</Badge>}
                    </TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {canBeManaged ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isActionLoading}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Role change options */}
                            <DropdownMenuItem
                              disabled={member.role === 'admin' || isActionLoading}
                              onClick={() => handleChangeRole(member.userId, 'admin')}
                            >
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={member.role === 'editor' || isActionLoading}
                              onClick={() => handleChangeRole(member.userId, 'editor')}
                            >
                              Make Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={member.role === 'viewer' || isActionLoading}
                              onClick={() => handleChangeRole(member.userId, 'viewer')}
                            >
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              disabled={isActionLoading}
                              onClick={() => confirmRemoveMember(member.userId)}
                            >
                              <UserMinus className="h-4 w-4 mr-2" />
                              Remove from Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember} 
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectMembersTable;