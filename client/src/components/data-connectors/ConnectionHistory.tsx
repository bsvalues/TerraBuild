import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  FolderSync, 
  Globe, 
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// Connection history type from API
type ConnectionHistoryItem = {
  id: number;
  connectionType: string;
  status: string;
  message: string;
  details: Record<string, any>;
  userId?: number;
  timestamp: string;
};

// Icon mappings for connection types
const ConnectionTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'ftp':
      return <FolderSync className="h-4 w-4" />;
    case 'arcgis':
      return <Globe className="h-4 w-4" />;
    case 'sqlserver':
      return <Database className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

// Format the connection type for display
const formatConnectionType = (type: string): string => {
  switch (type) {
    case 'ftp':
      return 'FTP';
    case 'arcgis':
      return 'ArcGIS REST API';
    case 'sqlserver':
      return 'SQL Server';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'success':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'not_configured':
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 flex items-center">
          <HelpCircle className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
};

const ConnectionHistory: React.FC = () => {
  // Fetch connection history data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/data-connections/history'],
    refetchOnWindowFocus: false,
  }) as { 
    data: ConnectionHistoryItem[] | undefined, 
    isLoading: boolean, 
    isError: boolean, 
    refetch: () => void 
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Handle error state
  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error Loading Connection History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            There was an error loading the connection history. Please try again later.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // No data scenario
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="bg-muted rounded-full p-3">
          <Database className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium">No Connection History</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            No connection tests have been performed yet. Try testing connections to see the history here.
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
    );
  }
  
  // Display connection history
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Recent Connections</h3>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Connection Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item: ConnectionHistoryItem) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium flex items-center space-x-2">
                <ConnectionTypeIcon type={item.connectionType} />
                <span>{formatConnectionType(item.connectionType)}</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="max-w-md truncate">{item.message}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ConnectionHistory;