import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Button 
} from '@/components/ui/button';
import { 
  Skeleton 
} from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  Clock, 
  XCircle 
} from 'lucide-react';
import { format } from 'date-fns';

interface Invitation {
  id: number;
  projectId: number;
  userId: number;
  invitedBy: number;
  role: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string | Date;
  projectName: string;
  inviterName: string;
}

const ProjectInvitations: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fetch pending invitations
  const { 
    data: invitations = [], 
    isLoading,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['/api/invitations/pending'],
    queryFn: async () => {
      const response = await apiRequest('/api/invitations/pending');
      return response.json();
    },
    meta: {
      errorMessage: 'Failed to load invitations'
    }
  });
  
  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest(`/api/invitations/${invitationId}/accept`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shared-projects/my'] });
      toast({
        title: 'Invitation accepted',
        description: 'You have successfully joined the project.',
      });
    },
    onError: () => {
      toast({
        title: 'Error accepting invitation',
        description: 'There was a problem accepting the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await apiRequest(`/api/invitations/${invitationId}/decline`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invitations/pending'] });
      toast({
        title: 'Invitation declined',
        description: 'You have declined the project invitation.',
      });
    },
    onError: () => {
      toast({
        title: 'Error declining invitation',
        description: 'There was a problem declining the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Handle accepting an invitation
  const handleAcceptInvitation = async (invitationId: number) => {
    setIsProcessing(true);
    try {
      await acceptInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      console.error("Error accepting invitation:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle declining an invitation
  const handleDeclineInvitation = async (invitationId: number) => {
    setIsProcessing(true);
    try {
      await declineInvitationMutation.mutateAsync(invitationId);
    } catch (error) {
      console.error("Error declining invitation:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">You don't have any pending invitations.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {invitations.map((invitation: Invitation) => (
        <Card key={invitation.id}>
          <CardHeader>
            <CardTitle className="text-lg">{invitation.projectName}</CardTitle>
            <CardDescription className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Invited {format(new Date(invitation.invitedAt), 'MMM d, yyyy')} by {invitation.inviterName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">
              You've been invited to join this project as a <span className="font-medium">{invitation.role}</span>.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => handleDeclineInvitation(invitation.id)}
              disabled={isProcessing}
              className="flex items-center"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button
              onClick={() => handleAcceptInvitation(invitation.id)}
              disabled={isProcessing}
              className="flex items-center"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProjectInvitations;