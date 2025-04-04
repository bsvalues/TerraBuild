import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Folder,
  Calendar,
  User,
  Check,
  X,
  Clock,
  Shield,
  Edit,
  Eye,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ProjectInvitationsProps {
  title?: string;
  description?: string;
}

const ProjectInvitations: React.FC<ProjectInvitationsProps> = ({
  title = 'Project Invitations',
  description = 'Invitations to collaborate on projects',
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { myInvitations, acceptInvitation, declineInvitation } = useCollaboration();
  const [processingInvitations, setProcessingInvitations] = useState<Record<number, boolean>>({});

  // Handle accepting an invitation
  const handleAcceptInvitation = async (invitationId: number) => {
    setProcessingInvitations(prev => ({ ...prev, [invitationId]: true }));
    
    try {
      await acceptInvitation(invitationId);
      
      toast({
        title: 'Invitation accepted',
        description: 'You have successfully joined the project',
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessingInvitations(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  // Handle declining an invitation
  const handleDeclineInvitation = async (invitationId: number) => {
    setProcessingInvitations(prev => ({ ...prev, [invitationId]: true }));
    
    try {
      await declineInvitation(invitationId);
      
      toast({
        title: 'Invitation declined',
        description: 'The invitation has been declined',
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive',
      });
    } finally {
      setProcessingInvitations(prev => ({ ...prev, [invitationId]: false }));
    }
  };

  // Get role icon based on the role
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'editor':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Filter to only show pending invitations
  const pendingInvitations = myInvitations.filter(inv => inv.status === 'pending');

  if (!user) {
    return null;
  }

  if (pendingInvitations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">{invitation.projectName}</span>
                  <Badge variant="outline" className="ml-2">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(invitation.role)}
                      <span className="capitalize">{invitation.role}</span>
                    </div>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Invited by {invitation.inviterName}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Invited{' '}
                    {invitation.invitedAt instanceof Date
                      ? formatDistanceToNow(invitation.invitedAt, { addSuffix: true })
                      : formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-amber-500">
                  <Clock className="h-3 w-3" />
                  <span>Waiting for your response</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 self-end md:self-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeclineInvitation(invitation.id)}
                  disabled={processingInvitations[invitation.id]}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={processingInvitations[invitation.id]}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Accept invitations to join projects and collaborate with others.
        </p>
      </CardFooter>
    </Card>
  );
};

export default ProjectInvitations;