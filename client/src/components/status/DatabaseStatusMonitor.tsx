/**
 * Database Status Monitor Component
 * 
 * This component displays the current status of database connections,
 * showing which storage provider is active and the connection health.
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Database, HardDrive, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';

/**
 * DatabaseStatusMonitor component
 */
export const DatabaseStatusMonitor: React.FC = () => {
  const { 
    status, 
    isLoading, 
    isError, 
    isRefreshing, 
    handleRefresh, 
    formatDate 
  } = useConnectionStatus();
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Database Connection Status
        </CardTitle>
        <CardDescription>Current database connectivity information</CardDescription>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-4">
            <RefreshCw className="animate-spin h-6 w-6 text-primary" />
            <span className="ml-2">Loading connection status...</span>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-md bg-destructive/10 text-destructive">
            Unable to fetch connection status. The system monitoring endpoint may be unavailable.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Active Storage:</span>
                <Badge 
                  className="ml-2" 
                  variant={status?.activeProvider === 'supabase' ? 'default' : 'outline'}
                >
                  {status?.activeProvider === 'supabase' ? 'Supabase (Cloud)' : 'PostgreSQL (Local)'}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center">
                  <Database className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">Supabase (Cloud)</h3>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={status?.supabase.available ? 'default' : 'outline'} className={status?.supabase.available ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}>
                      {status?.supabase.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Configured:</span>
                    <Badge variant={status?.supabase.configured ? 'outline' : 'default'} className={status?.supabase.configured ? '' : 'opacity-70'}>
                      {status?.supabase.configured ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Checked:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(status?.supabase.lastChecked ? new Date(status.supabase.lastChecked) : null)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last time Supabase connectivity was checked</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-3">
                <div className="flex items-center">
                  <HardDrive className="h-4 w-4 mr-2 text-primary" />
                  <h3 className="font-medium">PostgreSQL (Local)</h3>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={status?.postgres.available ? 'default' : 'outline'} className={status?.postgres.available ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}>
                      {status?.postgres.available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Configured:</span>
                    <Badge variant={status?.postgres.configured ? 'outline' : 'default'} className={status?.postgres.configured ? '' : 'opacity-70'}>
                      {status?.postgres.configured ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Checked:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(status?.postgres.lastChecked ? new Date(status.postgres.lastChecked) : null)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Last time PostgreSQL connectivity was checked</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end pt-0">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleRefresh}
          disabled={isLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DatabaseStatusMonitor;