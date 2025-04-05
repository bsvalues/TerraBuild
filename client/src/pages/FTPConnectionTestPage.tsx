import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { testFTPConnection } from '@/utils/ftp-connection-helper';
import { FTPConnectionStatus } from '@/components/data-connectors/FTPConnectionStatus';

export function FTPConnectionTestPage() {
  const [status, setStatus] = useState<{
    isLoading: boolean;
    result: any | null;
    error: string | null;
  }>({
    isLoading: false,
    result: null,
    error: null,
  });

  const handleTestConnection = async () => {
    setStatus({
      isLoading: true,
      result: null,
      error: null,
    });

    try {
      const result = await testFTPConnection();
      setStatus({
        isLoading: false,
        result,
        error: null,
      });
    } catch (error: any) {
      setStatus({
        isLoading: false,
        result: null,
        error: error?.message || 'Failed to test FTP connection',
      });
    }
  };

  const renderStatusBadge = () => {
    if (status.isLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Testing connection...</span>
        </div>
      );
    }

    if (status.error) {
      return (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      );
    }

    if (!status.result) {
      return null;
    }

    if (status.result.status === 'connected') {
      return (
        <div className="flex items-center space-x-2 mt-4">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-green-500 font-medium">Connected successfully!</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center space-x-2 mt-4">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-500 font-medium">Connection failed: {status.result.message}</span>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">FTP Connection Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the FTP connection using environment variables from the server
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Environment Connection Test</CardTitle>
            <CardDescription>
              Test the connection to the FTP server using environment variables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The test will use the following environment variables configured on the server:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>FTP_HOST</li>
              <li>FTP_PORT</li>
              <li>FTP_USERNAME</li>
              <li>FTP_PASSWORD</li>
            </ul>
            {renderStatusBadge()}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleTestConnection} 
              disabled={status.isLoading}
            >
              {status.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Connection
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Connections</CardTitle>
            <CardDescription>
              Check status of saved FTP connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Example of a saved connection */}
              <FTPConnectionStatus 
                connectionId={1}
                connectionName="Default FTP Connection"
                onStatusChange={(isConnected) => 
                  console.log('Connection status changed:', isConnected)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FTPConnectionTestPage;