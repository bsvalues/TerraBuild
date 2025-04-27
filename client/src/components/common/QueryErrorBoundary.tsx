import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface QueryErrorBoundaryProps {
  children: React.ReactNode;
  queryKey: string | string[];
  title?: string;
  description?: string;
  className?: string;
  fallback?: React.ReactNode;
}

/**
 * Error boundary component specifically for React Query data fetching errors
 * Provides a standardized UI for error states with retry capability
 */
export function QueryErrorBoundary({
  children,
  queryKey,
  title = "Data Loading Error",
  description = "There was a problem loading the data. Please try again.",
  className = "",
  fallback
}: QueryErrorBoundaryProps) {
  const queryClient = useQueryClient();
  const [hasError, setHasError] = React.useState(false);
  
  // Reset error state when queryKey changes
  React.useEffect(() => {
    setHasError(false);
  }, [queryKey]);
  
  // Handle errors from children
  const handleError = React.useCallback((error: Error) => {
    console.error('Query error boundary caught error:', error);
    setHasError(true);
  }, []);

  // Retry the query
  const handleRetry = React.useCallback(() => {
    // Convert single string to array if needed
    const key = Array.isArray(queryKey) ? queryKey : [queryKey];
    queryClient.invalidateQueries({ queryKey: key });
    setHasError(false);
  }, [queryClient, queryKey]);

  // If there's an error, show the error UI
  if (hasError) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="h-5 w-5 mr-2" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleRetry} 
            variant="outline"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Otherwise, render children
  return (
    <ErrorBoundary
      onReset={handleRetry}
      fallback={
        fallback || (
          <Card className={className}>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{description}</p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleRetry} 
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardFooter>
          </Card>
        )
      }
    >
      {children}
    </ErrorBoundary>
  );
}