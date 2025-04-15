/**
 * Database Status Monitor Component
 * 
 * This component displays the current status of database connections,
 * showing which storage provider is active and the connection health.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CircleCheck, CircleX, CloudOff, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Database connection status interface
 */
interface ConnectionStatus {
  supabase: {
    available: boolean;
    configured: boolean;
    lastChecked: Date | null;
  };
  postgres: {
    available: boolean;
    configured: boolean;
    lastChecked: Date | null;
  };
  activeProvider: 'supabase' | 'postgres';
}

/**
 * DatabaseStatusMonitor component
 */
export const DatabaseStatusMonitor: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    supabase: { available: false, configured: false, lastChecked: null },
    postgres: { available: true, configured: true, lastChecked: new Date() },
    activeProvider: 'postgres'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  /**
   * Fetch the current database connection status
   */
  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/system/connection-status');
      if (!response.ok) {
        throw new Error('Failed to fetch connection status');
      }
      
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching database status:', error);
      toast({
        title: 'Connection Status Error',
        description: 'Failed to fetch database connection status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Format date in a readable way
   */
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Database Connection Status</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStatus} 
            disabled={loading}
            title="Refresh Status"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Current database connection health and active provider
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Badge 
                variant={status.activeProvider === 'supabase' ? 'default' : 'outline'}
                className="p-1"
              >
                {status.activeProvider === 'supabase' ? 'ACTIVE' : 'STANDBY'}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1.5">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Supabase</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Supabase cloud database connection status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              {status.supabase.configured ? (
                <>
                  {status.supabase.available ? (
                    <CircleCheck className="h-5 w-5 text-green-500" />
                  ) : (
                    <CloudOff className="h-5 w-5 text-amber-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Last check: {formatDate(status.supabase.lastChecked)}
                  </span>
                </>
              ) : (
                <>
                  <CircleX className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Configured</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Badge 
                variant={status.activeProvider === 'postgres' ? 'default' : 'outline'}
                className="p-1"
              >
                {status.activeProvider === 'postgres' ? 'ACTIVE' : 'STANDBY'}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-1.5">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">PostgreSQL</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Local PostgreSQL database connection status</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2">
              {status.postgres.configured ? (
                <>
                  {status.postgres.available ? (
                    <CircleCheck className="h-5 w-5 text-green-500" />
                  ) : (
                    <CircleX className="h-5 w-5 text-red-500" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Last check: {formatDate(status.postgres.lastChecked)}
                  </span>
                </>
              ) : (
                <>
                  <CircleX className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Not Configured</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseStatusMonitor;