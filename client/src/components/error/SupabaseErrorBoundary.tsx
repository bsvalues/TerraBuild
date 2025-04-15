/**
 * Supabase Error Boundary Component
 * 
 * This component provides a boundary for handling errors in Supabase-connected components.
 * It prevents errors from crashing the entire application and provides a graceful fallback.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

// Props for the error boundary
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  onOfflineMode?: () => void;
  showOfflineOption?: boolean;
}

// State for the error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error boundary specific for Supabase-related errors
 */
export class SupabaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // Called when an error occurs in a child component
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  // Called after an error has been thrown by a child component
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Update state with error details
    this.setState({ 
      error, 
      errorInfo 
    });
    
    // Call onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Log error to console
    console.error('Supabase error caught by boundary:', error, errorInfo);
  }

  // Handle retry button click
  handleRetry = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Call onRetry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  // Handle offline mode button click
  handleOfflineMode = (): void => {
    // Call onOfflineMode handler if provided
    if (this.props.onOfflineMode) {
      this.props.onOfflineMode();
      
      // Reset error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    }
  };

  // Render the error UI or the children
  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showOfflineOption = true } = this.props;
    
    // If there's no error, render children normally
    if (!hasError) {
      return children;
    }
    
    // If a custom fallback is provided, use it
    if (fallback) {
      return fallback;
    }
    
    // Determine if it's a Supabase-specific error
    const isSupabaseError = error?.message?.includes('supabase') || 
                           error?.message?.toLowerCase().includes('network') ||
                           error?.message?.toLowerCase().includes('fetch') ||
                           error?.message?.toLowerCase().includes('connection') ||
                           error?.stack?.includes('supabase');
    
    // Get a user-friendly error message
    const errorMessage = isSupabaseError
      ? "There was a problem connecting to the database. This could be due to network issues or server problems."
      : error?.message || "An unexpected error occurred.";
    
    // Render the default error UI
    return (
      <div className="w-full py-8 px-4">
        <Card className="max-w-md mx-auto border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Connection Error</CardTitle>
            </div>
            <CardDescription>
              {isSupabaseError 
                ? "We're having trouble connecting to our servers." 
                : "Something went wrong."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 dark:text-gray-400">
            <p>{errorMessage}</p>
            {isSupabaseError && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-900 rounded-md">
                <p className="text-amber-700 dark:text-amber-300 text-xs">
                  You can try refreshing the page or continue in offline mode. 
                  Offline mode will use your device's storage and sync your changes 
                  when the connection is restored.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={this.handleRetry} 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
            
            {isSupabaseError && showOfflineOption && (
              <Button 
                variant="default" 
                onClick={this.handleOfflineMode}
                className="flex items-center gap-2"
              >
                <WifiOff className="h-4 w-4" />
                <span>Work Offline</span>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }
}

export default SupabaseErrorBoundary;