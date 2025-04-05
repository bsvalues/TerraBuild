import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { checkFTPConnectionStatus } from '@/utils/ftp-connection-helper';
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface FTPConnectionStatusProps {
  connectionId: number;
  connectionName: string;
  onRefresh?: () => void;
  onStatusChange?: (isConnected: boolean) => void;
}

export function FTPConnectionStatus({ 
  connectionId, 
  connectionName,
  onRefresh,
  onStatusChange
}: FTPConnectionStatusProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/ftp/connections', connectionId, 'status'],
    queryFn: () => checkFTPConnectionStatus(connectionId),
  });
  
  useEffect(() => {
    if (onStatusChange && data) {
      onStatusChange(data.status === 'connected');
    }
  }, [data, onStatusChange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    if (onRefresh) {
      onRefresh();
    }
    setIsRefreshing(false);
  };
  
  const renderStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Checking connection...</span>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to check connection status. Please try again.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (!data) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Unknown
        </Badge>
      );
    }
    
    switch(data.status) {
      case 'connected':
        return (
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="text-green-500 border-green-500">Connected</Badge>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
              Disconnected
            </Badge>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <Badge variant="outline" className="text-red-500 border-red-500">Error</Badge>
            </div>
            {data.message && (
              <p className="text-sm text-muted-foreground mt-1">{data.message}</p>
            )}
          </div>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Unknown
          </Badge>
        );
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md font-medium">
            {connectionName}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {(isLoading || isRefreshing) ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Status:</span>
            {renderStatus()}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Connection ID:</span>
            <span className="text-sm text-muted-foreground">{connectionId}</span>
          </div>
          
          {data?.details && (
            <div className="border-t pt-2 mt-2">
              <span className="text-sm font-medium">Connection Details:</span>
              <pre className="text-xs mt-1 p-2 bg-muted rounded-md overflow-x-auto">
                {JSON.stringify(data.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FTPConnectionStatus;