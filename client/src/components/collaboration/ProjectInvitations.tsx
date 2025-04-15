import React, { useState, useEffect } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { useAuth } from '@/contexts/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import {
  Loader2,
  Mail,
  Check,
  X,
  Ban,
  Clock,
  Users,
  CalendarClock,
  AlertCircle,
  CheckCircle,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  User,
  UsersRound,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProjectInvitationsProps {
  projectId?: number;
  className?: string;
}

interface ProjectInvitation {
  id: number;
  projectId: number;
  userId: number;
  invitedBy: number;
  role: string;
  status: string;
  invitedAt: string;
  // Project property from context type
  project?: {
    id: number;
    name: string;
  };
  // User property from context type
  inviter?: {
    id: number;
    name: string | null;
    username: string;
  };
}

export default function ProjectInvitations({ projectId, className }: ProjectInvitationsProps) {
  const {
    projectInvitations,
    isInvitationsLoading,
    respondToInvitation,
    deleteInvitation,
  } = useCollaboration();
  
  const [selectedInvitation, setSelectedInvitation] = useState<number | null>(null);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filter invitations for this project, or show all if no project is specified
  const invitations = projectId 
    ? projectInvitations.filter(inv => inv.projectId === projectId) 
    : projectInvitations;
  
  const handleAcceptInvitation = async () => {
    if (!selectedInvitation) return;
    
    setIsProcessing(true);
    try {
      await respondToInvitation(selectedInvitation, 'accepted');
      toast({
        title: 'Invitation accepted',
        description: 'You are now a member of this project',
      });
      setShowAcceptDialog(false);
      setSelectedInvitation(null);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeclineInvitation = async () => {
    if (!selectedInvitation) return;
    
    setIsProcessing(true);
    try {
      await respondToInvitation(selectedInvitation, 'declined');
      toast({
        title: 'Invitation declined',
        description: 'You have declined the invitation to join this project',
      });
      setShowDeclineDialog(false);
      setSelectedInvitation(null);
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleCancelInvitation = async () => {
    if (!selectedInvitation) return;
    
    setIsProcessing(true);
    try {
      const invitation = projectInvitations.find(inv => inv.id === selectedInvitation);
      if (invitation) {
        await deleteInvitation(invitation.projectId, invitation.id);
        toast({
          title: 'Invitation canceled',
          description: 'The invitation has been canceled',
        });
        setShowCancelDialog(false);
        setSelectedInvitation(null);
      }
    } catch (error) {
      console.error('Error canceling invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Get role badge component
  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        );
      case 'editor':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Editor
          </Badge>
        );
      case 'viewer':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <User className="h-3 w-3 mr-1" />
            Viewer
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Users className="h-3 w-3 mr-1" />
            {role}
          </Badge>
        );
    }
  };
  
  // Get status badge component
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      case 'canceled':
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            <Ban className="h-3 w-3 mr-1" />
            Canceled
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  // Get user initials for avatar
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };
  
  // Helper to get user display name
  const getDisplayName = (user: any) => {
    return user?.name || user?.username || 'Unknown User';
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          Project Invitations
        </CardTitle>
        <CardDescription>
          {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} to join projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isInvitationsLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : invitations.length === 0 ? (
          <div className="text-center border rounded-lg p-8">
            <div className="mx-auto rounded-full bg-muted w-12 h-12 flex items-center justify-center mb-3">
              <Mail className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No pending invitations</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have any pending project invitations at the moment.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Invited By</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-medium">
                    {invitation.project?.name || `Project ${invitation.projectId}`}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{getInitials(invitation.inviter?.name)}</AvatarFallback>
                        {invitation.inviter?.name && (
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              invitation.inviter.name
                            )}&background=random`}
                            alt={invitation.inviter.name}
                          />
                        )}
                      </Avatar>
                      <span className="text-sm">{getDisplayName(invitation.inviter)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(invitation.role)}</TableCell>
                  <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                  <TableCell>
                    {invitation.invitedAt 
                      ? format(new Date(invitation.invitedAt), "MMM d, yyyy") 
                      : 'Unknown'}
                  </TableCell>
                  <TableCell className="text-right">
                    {invitation.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                          onClick={() => {
                            setSelectedInvitation(invitation.id);
                            setShowAcceptDialog(true);
                          }}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                          onClick={() => {
                            setSelectedInvitation(invitation.id);
                            setShowDeclineDialog(true);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                    {invitation.status === 'pending' && invitation.invitedBy && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600"
                        onClick={() => {
                          setSelectedInvitation(invitation.id);
                          setShowCancelDialog(true);
                        }}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Accept invitation dialog */}
        <AlertDialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Accept Invitation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to accept this invitation? You will be added as a member to the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAcceptInvitation}
                className="bg-green-600 text-white hover:bg-green-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  "Accept Invitation"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Decline invitation dialog */}
        <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Decline Invitation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to decline this invitation? You will not be added to the project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeclineInvitation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Declining...
                  </>
                ) : (
                  "Decline Invitation"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        {/* Cancel invitation dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel this invitation? The user will no longer be able to join the project with this invitation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelInvitation}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  "Cancel Invitation"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}