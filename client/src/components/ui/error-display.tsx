import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  title?: string;
  error: Error | string | unknown;
  onRetry?: () => void;
}

/**
 * A consistent error display component
 * Shows error messages with optional retry functionality
 */
const ErrorDisplay = ({ 
  title = "Error", 
  error, 
  onRetry 
}: ErrorDisplayProps) => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
      ? error 
      : 'An unknown error occurred';

  return (
    <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-red-700 dark:text-red-400">
          <AlertTriangle className="mr-2 h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-red-800 dark:text-red-300">
        <p>{errorMessage}</p>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="border-red-300 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export { ErrorDisplay };