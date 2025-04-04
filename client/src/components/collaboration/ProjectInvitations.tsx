import React from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeCheck, Clock, Users } from 'lucide-react';

const ProjectInvitations: React.FC = () => {
  const { myInvitations, acceptInvitation, declineInvitation, isLoadingInvitations } = useCollaboration();

  // Handle accept invitation
  const handleAccept = async (invitationId: number) => {
    try {
      await acceptInvitation(invitationId);
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  // Handle decline invitation
  const handleDecline = async (invitationId: number) => {
    try {
      await declineInvitation(invitationId);
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  if (isLoadingInvitations) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border border-border">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter>
              <div className="flex space-x-2">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (myInvitations.length === 0) {
    return (
      <Card className="border border-border bg-muted/50">
        <CardContent className="pt-6 flex flex-col items-center justify-center text-center space-y-2">
          <Clock className="h-12 w-12 text-muted-foreground mb-2" />
          <CardTitle className="text-xl">No Pending Invitations</CardTitle>
          <CardDescription>
            You don't have any pending project invitations at the moment.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {myInvitations.map((invitation) => (
        <Card key={invitation.id} className="border border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{invitation.projectName}</CardTitle>
              <div className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm font-medium">
                {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
              </div>
            </div>
            <CardDescription>
              Invited by {invitation.inviterName} {invitation.invitedAt instanceof Date ? 
                formatDistanceToNow(invitation.invitedAt, { addSuffix: true }) : 
                formatDistanceToNow(new Date(invitation.invitedAt), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center text-sm text-muted-foreground space-x-4">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>Collaborative Project</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>Pending Response</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                onClick={() => handleAccept(invitation.id)}
                className="flex items-center"
              >
                <BadgeCheck className="h-4 w-4 mr-1" />
                Accept
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleDecline(invitation.id)}
              >
                Decline
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ProjectInvitations;