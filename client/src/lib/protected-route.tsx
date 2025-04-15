import React from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [_, navigate] = useLocation();

  /**
   * Enhanced ProtectedRoute with authentication
   * 
   * In production: redirects to auth page if not authenticated
   * In development: still allows access (with mock admin user)
   */
  const ProtectedComponent = (props: any) => {
    React.useEffect(() => {
      // Skip authentication checks in development mode
      if (process.env.NODE_ENV === 'development') {
        return;
      }
      
      if (!isLoading && !isAuthenticated) {
        navigate('/auth', { replace: true });
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // User is authenticated, render the protected component
    return <Component {...props} />;
  };

  return <Route path={path} component={ProtectedComponent} />;
}