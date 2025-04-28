import React, { ErrorInfo, Component, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Specific error boundary for authentication-related components
 * Provides specialized handling for auth errors
 */
class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Authentication Error:', error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 max-w-md mx-auto my-8">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-700 dark:text-amber-400">
              Authentication Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-800 dark:text-amber-300">
            <p>
              There was a problem with the authentication system. This could be due to an expired 
              session or an issue with the authentication service.
            </p>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Error details: {this.state.error?.message || 'Unknown authentication error'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              className="border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-950"
              onClick={this.handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="default"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => window.location.href = '/'}
            >
              Go to Home
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export { AuthErrorBoundary };