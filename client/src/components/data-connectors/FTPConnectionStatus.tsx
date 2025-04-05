import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Server, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FTPStatusProps = {
  onStatusChange?: (isConnected: boolean) => void;
};

interface FTPEnvironmentInfo {
  FTP_HOST: { set: boolean; value: string };
  FTP_USERNAME: { set: boolean; value: string };
  FTP_PASSWORD: { set: boolean; value: string };
  FTP_PORT: { set: boolean; value: string };
  timestamp: string;
}

interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: string;
  timestamp: string;
}

const FTPConnectionStatus: React.FC<FTPStatusProps> = ({ onStatusChange }) => {
  const { toast } = useToast();
  const [lastTestTimestamp, setLastTestTimestamp] = useState<string>('');

  // Query to check if FTP environment variables are set
  const ftpEnvQuery = useQuery<FTPEnvironmentInfo>({
    queryKey: ['/api/connections/ftp/environment'],
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 1,
  });
  
  // Query to test FTP connection
  const ftpConnectionQuery = useQuery<ConnectionTestResult>({
    queryKey: ['/api/connections/ftp/test', lastTestTimestamp],
    enabled: false, // Don't run on component mount
    refetchOnWindowFocus: false,
    retry: 0,
  });

  // Format a timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    if (!timestamp) return 'Never';
    
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
      }).format(date);
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate configuration status based on environment variables
  const getConfigStatus = (): 'unconfigured' | 'partial' | 'configured' => {
    if (!ftpEnvQuery.data) return 'unconfigured';
    
    const allSet = Object.entries(ftpEnvQuery.data)
      .filter(([key]) => key !== 'timestamp')
      .every(([_, value]) => value.set);
      
    const anySet = Object.entries(ftpEnvQuery.data)
      .filter(([key]) => key !== 'timestamp')
      .some(([_, value]) => value.set);
      
    if (allSet) return 'configured';
    if (anySet) return 'partial';
    return 'unconfigured';
  };

  // Test the FTP connection
  const testConnection = () => {
    setLastTestTimestamp(new Date().toISOString());
    ftpConnectionQuery.refetch();
  };

  // Update the parent component when connection status changes
  useEffect(() => {
    if (onStatusChange && ftpConnectionQuery.data) {
      onStatusChange(ftpConnectionQuery.data.success);
    }
  }, [ftpConnectionQuery.data, onStatusChange]);

  // Render configuration status badge
  const renderConfigStatus = () => {
    const status = getConfigStatus();
    
    switch (status) {
      case 'configured':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Configured</Badge>;
      case 'partial':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Partially Configured</Badge>;
      case 'unconfigured':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Not Configured</Badge>;
      default:
        return null;
    }
  };

  // Render connection status badge
  const renderConnectionStatus = () => {
    if (ftpConnectionQuery.isPending) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Testing...</Badge>;
    }
    
    if (!ftpConnectionQuery.data) {
      return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Not Tested</Badge>;
    }
    
    return ftpConnectionQuery.data.success
      ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Connected</Badge>
      : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Failed</Badge>;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">FTP Connection Status</CardTitle>
          {renderConfigStatus()}
        </div>
        <CardDescription>
          Check and verify the FTP server connection
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* FTP Server Information */}
        <div className="space-y-2">
          <div className="text-sm font-medium">FTP Server</div>
          {ftpEnvQuery.isPending ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading configuration...
            </div>
          ) : ftpEnvQuery.isError ? (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <XCircle className="h-4 w-4" />
              Error loading configuration
            </div>
          ) : (
            <div className="rounded-md border p-3 bg-muted/50">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Host:</span>
                  <span className="font-medium truncate">
                    {ftpEnvQuery.data?.FTP_HOST.set 
                      ? ftpEnvQuery.data?.FTP_HOST.value 
                      : <span className="text-red-500">Not set</span>}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Port:</span>
                  <span className="font-medium">
                    {ftpEnvQuery.data?.FTP_PORT.set 
                      ? ftpEnvQuery.data?.FTP_PORT.value 
                      : <span className="text-red-500">Not set</span>}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Username:</span>
                  <span className="font-medium">
                    {ftpEnvQuery.data?.FTP_USERNAME.set 
                      ? "••••••••" 
                      : <span className="text-red-500">Not set</span>}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Password:</span>
                  <span className="font-medium">
                    {ftpEnvQuery.data?.FTP_PASSWORD.set 
                      ? "••••••••" 
                      : <span className="text-red-500">Not set</span>}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Connection Test Results */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Connection Test</div>
            {renderConnectionStatus()}
          </div>
          
          {ftpConnectionQuery.isPending ? (
            <div className="rounded-md border p-4 bg-muted/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Testing FTP connection...</p>
              </div>
            </div>
          ) : !ftpConnectionQuery.data ? (
            <div className="rounded-md border p-4 bg-muted/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Server className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click the button below to test connection</p>
              </div>
            </div>
          ) : ftpConnectionQuery.data.success ? (
            <div className="rounded-md border p-4 bg-green-50 border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-green-700">{ftpConnectionQuery.data.message}</p>
                  {ftpConnectionQuery.data.details && (
                    <p className="text-sm text-green-600">{ftpConnectionQuery.data.details}</p>
                  )}
                  <p className="text-xs text-green-600">
                    Last tested: {formatTimestamp(ftpConnectionQuery.data.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border p-4 bg-red-50 border-red-100">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-red-700">{ftpConnectionQuery.data.message}</p>
                  {ftpConnectionQuery.data.details && (
                    <p className="text-sm text-red-600 break-words">{ftpConnectionQuery.data.details}</p>
                  )}
                  <p className="text-xs text-red-600">
                    Last tested: {formatTimestamp(ftpConnectionQuery.data.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="gap-1"
                  disabled={getConfigStatus() === 'unconfigured' || ftpConnectionQuery.isPending}
                  onClick={testConnection}
                >
                  {ftpConnectionQuery.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-1" />
                  )}
                  Test Connection
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {getConfigStatus() === 'unconfigured' 
                ? "FTP server must be configured before testing" 
                : "Test connection to the FTP server"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Info className="h-3 w-3 mr-1" />
          {ftpEnvQuery.data?.timestamp 
            ? `Config last updated: ${formatTimestamp(ftpEnvQuery.data.timestamp)}` 
            : 'FTP configuration not loaded'
          }
        </div>
      </CardFooter>
    </Card>
  );
};

export default FTPConnectionStatus;