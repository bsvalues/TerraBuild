import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FTPSyncScheduler } from '@/components/data-connectors/FTPSyncScheduler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';
import { ChevronLeft, Calendar, Clock, FolderSync, Settings, Info, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import FTPConnectionStatus from '@/components/data-connectors/FTPConnectionStatus';
import { useDocumentTitle } from '@/hooks/use-document-title';

const FTPSyncSchedulePage: React.FC = () => {
  useDocumentTitle('FTP Sync Scheduling - BCBS');
  const [ftpConnected, setFtpConnected] = useState<boolean | null>(null);
  const [connectionId, setConnectionId] = useState<number>(1); // Default connection ID

  // Fetch connection details
  const { data: connectionData, isLoading, error } = useQuery<{ id: number; isConfigured: boolean; host: string | null; port: number | null; username: string | null; }>({
    queryKey: ['/api/connections/ftp/details'],
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Update connection ID when data is loaded
  useEffect(() => {
    if (connectionData) {
      setConnectionId(connectionData.id);
    }
  }, [connectionData]);

  // Handle connection status change from FTPConnectionStatus component
  const handleConnectionStatusChange = (isConnected: boolean) => {
    setFtpConnected(isConnected);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/data-connections" className="inline-block">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Data Connections</span>
            </Button>
          </Link>
        </div>
        <Link href="/settings/ftp" className="inline-block">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Settings className="h-4 w-4" />
            <span>FTP Settings</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <FTPConnectionStatus 
            connectionId={connectionId} 
            connectionName="FTP Connection" 
            onStatusChange={handleConnectionStatusChange} 
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Sync Scheduling</CardTitle>
              <CardDescription>
                Automate file transfers between systems
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2 items-center text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>Schedule transfers to run automatically at set intervals</span>
              </div>
              <div className="flex space-x-2 items-center text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Choose hourly, daily, weekly, or monthly schedules</span>
              </div>
              <div className="flex space-x-2 items-center text-sm">
                <FolderSync className="h-4 w-4 text-primary" />
                <span>Sync between FTP and local storage in either direction</span>
              </div>
              
              <Separator className="my-2" />
              
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <div className="flex space-x-2 text-sm text-amber-800">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">About FTP Sync Schedules</p>
                    <p>Once created, sync schedules will run automatically at the specified times, even when you're not logged in to the system.</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <Link href="/data-connections" className="w-full inline-block">
                  <Button variant="outline" className="w-full">
                    Manage Data Connections
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load FTP connection details. Please ensure your FTP connection is configured properly.
              </AlertDescription>
            </Alert>
          ) : !ftpConnected && ftpConnected !== null ? (
            <Card>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <AlertCircle className="h-10 w-10 text-amber-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">FTP Connection Required</h3>
                  <p className="text-muted-foreground mb-4">
                    You need to establish a connection to the FTP server before you can create sync schedules.
                    Please test your connection using the panel on the left.
                  </p>
                  <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                    FTP connection is not established
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>FTP Sync Scheduler</CardTitle>
                <CardDescription>
                  Create and manage automated file synchronization schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FTPSyncScheduler connectionId={connectionId} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FTPSyncSchedulePage;