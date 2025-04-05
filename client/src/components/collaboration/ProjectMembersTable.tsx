import React, { useState } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  Users,
  MoreHorizontal,
  UserX,
  ShieldAlert,
  Edit,
  Eye,
  UserCheck,
  UserCog,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ProjectMembersTableProps {
  // Required props
  projectId: number;
  // Optional props with defaults
  members?: any[]; // Project Member array
  isLoading?: boolean;
  currentUserId?: number;
  currentUserRole?: string;
  // Props for direct usage in SharedProjectDashboardPage
  isAdmin?: boolean;
  isOwner?: boolean;
}

export default function ProjectMembersTable({
  projectId,
  members = [],
  isLoading = false,
  currentUserId = 0,
  currentUserRole = 'viewer',
  isAdmin = false,
  isOwner = false,
}: ProjectMembersTableProps) {
  const {
    changeMemberRole,
    removeMember,
  } = useCollaboration();
  
  const [memberToRemove, setMemberToRemove] = useState<{id: number, name: string} | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if current user can manage members
  const canManageMembers = currentUserRole === 'admin' || currentUserRole === 'owner';
  
  // Remove a member
  const handleRemoveMember = (memberId: number, memberName: string) => {
    setMemberToRemove({ id: memberId, name: memberName });
    setShowRemoveConfirm(true);
  };
  
  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    
    setIsProcessing(true);
    try {
      await removeMember(projectId, memberToRemove.id);
      setShowRemoveConfirm(false);
      setMemberToRemove(null);
      
      toast({
        title: 'Member removed',
        description: `${memberToRemove.name} has been removed from the project`,
      });
      
      // No refreshMembers function, rely on cache invalidation from mutation
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member from project',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Update member role
  const handleRoleChange = async (memberId: number, newRole: string) => {
    setIsProcessing(true);
    try {
      await changeMemberRole(projectId, memberId, newRole);
      
      toast({
        title: 'Role updated',
        description: `Member role has been updated to ${newRole}`,
      });
      
      // No refreshMembers function, rely on cache invalidation from mutation
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Helper function to determine the display name
  const getMemberDisplayName = (member: any) => {
    return member.user?.name || member.user?.username || `User ${member.userId}`;
  };
  
  // Get initials for avatar
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Helper function to render role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300 hover:bg-red-200">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'editor':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200">
            <Edit className="h-3 w-3 mr-1" />
            Editor
          </Badge>
        );
      case 'viewer':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200">
            <Eye className="h-3 w-3 mr-1" />
            Viewer
          </Badge>
        );
      default:
        return <Badge>{role}</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Project Members
        </CardTitle>
        <CardDescription>
          {members.length} member{members.length !== 1 ? 's' : ''} in this project
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                {canManageMembers && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => {
                const isCurrentUser = member.userId === currentUserId;
                const isOwner = member.role === 'owner';
                const canEdit = canManageMembers && !isOwner && member.userId !== currentUserId;
                const displayName = getMemberDisplayName(member);
                
                return (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{getInitials(member.user?.name)}</AvatarFallback>
                          {member.user?.name && (
                            <AvatarImage
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                member.user.name
                              )}&background=random`}
                              alt={member.user.name || 'User avatar'}
                            />
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {displayName}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                            )}
                          </div>
                          {member.user?.username && (
                            <div className="text-xs text-muted-foreground">
                              @{member.user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>
                      {format(new Date(member.joinedAt), "MMM d, yyyy")}
                    </TableCell>
                    {canManageMembers && (
                      <TableCell className="text-right">
                        {!canEdit ? (
                          <div className="text-xs text-muted-foreground">
                            {isCurrentUser
                              ? "You can't edit your own role"
                              : isOwner
                                ? "Owner can't be edited"
                                : "Insufficient permissions"}
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                  <UserCog className="h-4 w-4 mr-2" />
                                  Change Role
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                  <DropdownMenuRadioGroup
                                    value={member.role}
                                    onValueChange={(value) => handleRoleChange(member.userId, value)}
                                  >
                                    <DropdownMenuRadioItem value="admin" disabled={isProcessing}>
                                      <ShieldAlert className="h-4 w-4 mr-2" />
                                      Admin
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="editor" disabled={isProcessing}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editor
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="viewer" disabled={isProcessing}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Viewer
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.userId, displayName)}
                                className="text-destructive focus:text-destructive"
                                disabled={isProcessing}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        
        {/* Remove Member Confirmation Dialog */}
        <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {memberToRemove?.name || 'this member'} from the project? 
                They will lose access to all project resources.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRemoveMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove Member"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// This Icon isn't in lucide-react by default, so we create it
function Crown(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}