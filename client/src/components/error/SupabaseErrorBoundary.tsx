/**
 * Supabase Error Boundary Component
 * 
 * This component provides a graceful fallback UI when Supabase
 * connection errors occur, while allowing the application to
 * continue functioning in offline mode.
 */

import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, WifiOff, RefreshCw, Database, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { isIndexedDBAvailable } from '@/lib/utils/localDatabase';
import reconnectionManager from '@/lib/utils/reconnectionManager';
import { checkSupabaseConnection } from '@/lib/utils/supabaseClient';

// Error types that this boundary should catch
const SUPABASE_ERROR_PATTERNS = [
  'supabase',
  'connection',
  'network',
  'fetch',
  'api',
  'authentication',
  'auth',
  'database',
  'storage',
];

interface Props {
  children: React.ReactNode;
  showFallbackInitially?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isSupabaseError: boolean;
  errorStackTrace: string | null;
  offlineMode: boolean;
  reconnectionAttempts: number;
  isReconnecting: boolean;
}

/**
 * Determine if an error is a Supabase-related error
 */
const isSupabaseError = (error: Error): boolean => {
  if (!error) return false;
  
  const errorString = (error.message + ' ' + (error.stack || '')).toLowerCase();
  
  return SUPABASE_ERROR_PATTERNS.some(pattern => 
    errorString.includes(pattern.toLowerCase())
  );
};

/**
 * Component to show reconnection progress
 */
const ReconnectionStatus: React.FC<{
  attempts: number;
  onRetry: () => void;
  isReconnecting: boolean;
}> = ({ attempts, onRetry, isReconnecting }) => {
  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <RefreshCw 
            className={`mr-2 h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} 
          />
          <span>
            {isReconnecting 
              ? 'Reconnecting...' 
              : `Reconnection attempts: ${attempts}`
            }
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={onRetry}
          disabled={isReconnecting}
        >
          Retry Now
        </Button>
      </div>
      
      {attempts > 0 && (
        <Alert variant="warning" className="mt-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limited Functionality</AlertTitle>
          <AlertDescription>
            You're in offline mode. Some features may not be available until connection is restored.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Button to enable offline mode
 */
const OfflineModeToggle: React.FC<{
  enabled: boolean;
  onToggle: () => void;
}> = ({ enabled, onToggle }) => {
  return (
    <Button 
      variant={enabled ? "default" : "outline"} 
      className="gap-2"
      onClick={onToggle}
    >
      <WifiOff className="h-4 w-4" />
      <span>{enabled ? 'Exit Offline Mode' : 'Use Offline Mode'}</span>
    </Button>
  );
};

/**
 * Error details accordion
 */
const ErrorDetails: React.FC<{
  error: Error | null;
  stackTrace: string | null;
}> = ({ error, stackTrace }) => {
  return (
    <Accordion type="single" collapsible className="mt-4">
      <AccordionItem value="details">
        <AccordionTrigger className="text-sm">
          Show Error Details
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs font-mono overflow-auto max-h-[200px]">
            <p className="mb-2 font-bold">{error?.message || 'Unknown error'}</p>
            <pre className="whitespace-pre-wrap break-all">
              {stackTrace || error?.stack || 'No stack trace available'}
            </pre>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

/**
 * Supabase Error Boundary Class Component
 */
class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: props.showFallbackInitially || false,
      error: null,
      errorInfo: null,
      isSupabaseError: false,
      errorStackTrace: null,
      offlineMode: false,
      reconnectionAttempts: 0,
      isReconnecting: false
    };
  }
  
  /**
   * Derived state from error
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a Supabase-related error
    const supabaseError = isSupabaseError(error);
    
    return {
      hasError: true,
      error,
      isSupabaseError: supabaseError,
    };
  }
  
  /**
   * Capture error details when component throws
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
      errorStackTrace: error.stack || null
    });
    
    // Log error to console for debugging
    console.error('Supabase connection error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }
  
  /**
   * Check Supabase connection and try to recover
   */
  tryReconnect = async () => {
    this.setState({
      isReconnecting: true,
      reconnectionAttempts: this.state.reconnectionAttempts + 1
    });
    
    try {
      const isConnected = await checkSupabaseConnection();
      
      if (isConnected) {
        // Connection restored
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isReconnecting: false,
          offlineMode: false
        });
        
        return true;
      } else {
        // Still disconnected
        this.setState({
          isReconnecting: false
        });
        return false;
      }
    } catch (error) {
      // Error during reconnection
      this.setState({
        isReconnecting: false
      });
      
      return false;
    }
  };
  
  /**
   * Toggle offline mode
   */
  toggleOfflineMode = () => {
    this.setState(state => ({
      offlineMode: !state.offlineMode,
      hasError: !state.offlineMode ? false : state.hasError
    }));
    
    // If turning off offline mode, try to reconnect
    if (this.state.offlineMode) {
      this.tryReconnect();
    }
  };
  
  /**
   * Reset the error boundary
   */
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      reconnectionAttempts: 0
    });
  };
  
  /**
   * Render error boundary content
   */
  render() {
    const { hasError, error, isSupabaseError, errorStackTrace, offlineMode, reconnectionAttempts, isReconnecting } = this.state;
    const { children } = this.props;
    
    // If there's no error or it's not a Supabase error, render children normally
    if (!hasError || (!isSupabaseError && !offlineMode && !this.props.showFallbackInitially)) {
      return children;
    }
    
    // For Supabase errors, render fallback UI with offline mode option
    return (
      <div className="p-4">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Connection Issue
            </CardTitle>
            <CardDescription>
              {offlineMode 
                ? "You're working in offline mode. Changes will be synchronized when connection is restored."
                : "We're having trouble connecting to the server. You can continue in offline mode or try reconnecting."
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Alert className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {offlineMode ? "Offline Mode Enabled" : "Connection Error"}
              </AlertTitle>
              <AlertDescription>
                {offlineMode
                  ? "Your data is being stored locally and will sync when connection is restored."
                  : "The application is having trouble connecting to the database. This may be due to network issues or server maintenance."
                }
              </AlertDescription>
            </Alert>
            
            {/* Connection status indicator */}
            {!offlineMode && (
              <ReconnectionStatus 
                attempts={reconnectionAttempts}
                onRetry={this.tryReconnect}
                isReconnecting={isReconnecting}
              />
            )}
            
            {/* Only show error details in development */}
            {process.env.NODE_ENV === 'development' && error && (
              <ErrorDetails 
                error={error} 
                stackTrace={errorStackTrace} 
              />
            )}
            
            {/* Show IndexedDB support status */}
            <div className="mt-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-md flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Offline Storage Support</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isIndexedDBAvailable() 
                    ? "Your browser supports offline storage. Your data will be saved locally until connection is restored."
                    : "Your browser doesn't fully support offline storage. Some features may not work properly in offline mode."
                  }
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <OfflineModeToggle 
              enabled={offlineMode} 
              onToggle={this.toggleOfflineMode} 
            />
            
            <Button 
              variant="outline" 
              onClick={this.resetErrorBoundary}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset & Retry</span>
            </Button>
          </CardFooter>
        </Card>
        
        {/* If in offline mode, still render children */}
        {offlineMode && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
    );
  }
}

export default SupabaseErrorBoundary;