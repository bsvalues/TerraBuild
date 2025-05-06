import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Specific error boundary for authentication-related components
 * Provides specialized handling for auth errors
 */
export class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Auth Error Boundary caught an error:', error, errorInfo);
    
    // Check if this is an authentication-related error
    const isAuthError = 
      error.message.includes('useAuth') || 
      error.message.includes('AuthProvider') ||
      error.message.includes('Authentication') ||
      error.message.includes('token') ||
      error.message.includes('login');
    
    if (isAuthError) {
      console.warn('Authentication-related error detected:', error.message);
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = (): void => {
    // Clear the error state and attempt to re-render
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Optionally trigger a refresh of auth state here
    // if (this.props.onRetry) this.props.onRetry();
  };

  handleLogout = (): void => {
    // Navigate to logout
    window.location.href = '/api/logout';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="p-4 max-w-md mx-auto my-8">
          <Card className="border-amber-200">
            <CardHeader className="pb-2 bg-amber-50">
              <CardTitle className="flex items-center text-amber-700">
                <AlertCircle className="mr-2 h-5 w-5" />
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || 'An authentication error occurred'}
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground mt-2">
                This could be due to an expired session or authentication configuration issues.
              </p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={this.handleRetry}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button 
                variant="destructive"
                onClick={this.handleLogout}
              >
                Sign Out
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default AuthErrorBoundary;