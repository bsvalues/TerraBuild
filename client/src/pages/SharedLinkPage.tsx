import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/queryClient';
import { ProjectProvider } from '@/contexts/ProjectContext';
import ProjectDetailsPage from './ProjectDetailsPage';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowRight, CheckCircle2, Link, Lock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SharedLinkPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  
  // Fetch project information using the shared link token
  const { data: linkInfo, isLoading, isError } = useQuery({
    queryKey: [`/api/shared-links/${token}`],
    queryFn: async () => {
      try {
        const response = await apiRequest(`/api/shared-links/${token}`);
        return response.json();
      } catch (error) {
        console.error('Error fetching shared link info:', error);
        throw error;
      }
    },
    retry: false,
  });
  
  useEffect(() => {
    if (linkInfo && !isLoading) {
      // If link is valid and project info is available, set access granted
      setAccessGranted(true);
    }
  }, [linkInfo, isLoading]);
  
  // Handle accessing the project
  const handleAccessProject = () => {
    if (!linkInfo || !linkInfo.projectId) return;
    
    // Navigate to the project with a query param indicating access via shared link
    // The token will be used to maintain the access level throughout the session
    setLocation(`/shared-projects/${linkInfo.projectId}?via=shared-link&token=${token}`);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container max-w-3xl mx-auto py-12">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Render error state if the link is invalid or expired
  if (isError || !linkInfo) {
    return (
      <div className="container max-w-3xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <AlertCircle className="h-6 w-6 mr-2 text-destructive" />
              Invalid or Expired Link
            </CardTitle>
            <CardDescription>
              This shared link is either invalid, has expired, or has been revoked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Link Error</AlertTitle>
              <AlertDescription>
                The link you're trying to access is no longer valid. Please contact the project owner for a new link.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setLocation('/shared-projects')}>
                Go to Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If user has been granted access, proceed to the project
  if (accessGranted) {
    return (
      <div className="container max-w-3xl mx-auto py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <CheckCircle2 className="h-6 w-6 mr-2 text-green-500" />
              Access Granted
            </CardTitle>
            <CardDescription>
              You now have {linkInfo.accessLevel} access to the project "{linkInfo.projectName}".
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                This project has been shared with you via a direct link. 
                {linkInfo.accessLevel === 'view' && ' You have view-only access to this project.'}
                {linkInfo.accessLevel === 'edit' && ' You can view and make changes to this project.'}
                {linkInfo.accessLevel === 'admin' && ' You have full administrative access to this project.'}
              </p>
              
              {linkInfo.expiresAt && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Access Expiration</AlertTitle>
                  <AlertDescription>
                    Your access to this project will expire on {new Date(linkInfo.expiresAt).toLocaleDateString()}.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-center mt-6">
                <Button size="lg" onClick={handleAccessProject}>
                  Open Project <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Default view - requesting access
  return (
    <div className="container max-w-3xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center">
            <Link className="h-6 w-6 mr-2 text-primary" />
            Shared Project Access
          </CardTitle>
          <CardDescription>
            You're accessing a shared project via an invitation link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg">
              This link gives you access to the project "{linkInfo?.projectName || 'Shared Project'}".
            </p>
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Access Level</AlertTitle>
              <AlertDescription>
                {linkInfo?.accessLevel === 'view' && 'You will have view-only access to this project.'}
                {linkInfo?.accessLevel === 'edit' && 'You will be able to view and make changes to this project.'}
                {linkInfo?.accessLevel === 'admin' && 'You will have full administrative access to this project.'}
              </AlertDescription>
            </Alert>
            <div className="flex justify-center mt-6">
              <Button size="lg" onClick={handleAccessProject}>
                Open Project <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedLinkPage;