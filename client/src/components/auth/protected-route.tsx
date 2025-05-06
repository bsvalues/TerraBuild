import React from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, ShieldAlert, LogIn } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthErrorBoundary } from './auth-error-boundary';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[]; // Optional role requirement for role-based access control
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  // Use destructuring with default values for optional properties
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user data...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-700">
              <LogIn className="mr-2 h-5 w-5" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>You need to sign in to access this page. Please log in to continue.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/login'} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check role-based access if requiredRole is provided
  if (requiredRole && user) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!roles.includes(user.role)) {
      // User doesn't have the required role - show access denied message
      return (
        <div className="flex h-screen flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-red-700 dark:text-red-400">
                <ShieldAlert className="mr-2 h-5 w-5" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-800 dark:text-red-300">
              <p>You don't have permission to access this page.</p>
              <p className="mt-2 text-xs">
                Required role: {Array.isArray(requiredRole) 
                  ? requiredRole.join(' or ') 
                  : requiredRole}
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'} 
                className="border-red-300 hover:bg-red-100"
              >
                Go to Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }
  }

  // If the user is authenticated and has the required role (if any), render the children
  return (
    <AuthErrorBoundary>
      {children}
    </AuthErrorBoundary>
  );
}