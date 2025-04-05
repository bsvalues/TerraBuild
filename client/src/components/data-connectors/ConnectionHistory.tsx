import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Database, 
  FolderSync, 
  Globe, 
  HelpCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Filter,
  X,
  ChevronDown
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
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Interface for sort config
type SortConfig = {
  key: 'connectionType' | 'status' | 'message' | 'timestamp';
  direction: 'asc' | 'desc';
}

// Interface for filters
type Filters = {
  connectionType: string[];
  status: string[];
  search: string;
}

const ConnectionHistory: React.FC = () => {
  // State for selected connection for details modal
  const [selectedConnection, setSelectedConnection] = useState<ConnectionHistoryItem | null>(null);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'timestamp',
    direction: 'desc'
  });
  
  // State for filters
  const [filters, setFilters] = useState<Filters>({
    connectionType: [],
    status: [],
    search: '',
  });
  
  // State for filtered and sorted data
  const [filteredData, setFilteredData] = useState<ConnectionHistoryItem[]>([]);
  
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
  
  // Process data with filters and sorting
  useEffect(() => {
    if (!data) return;
    
    let processed = [...data];
    
    // Apply connection type filter
    if (filters.connectionType.length > 0) {
      processed = processed.filter(item => 
        filters.connectionType.includes(item.connectionType)
      );
    }
    
    // Apply status filter
    if (filters.status.length > 0) {
      processed = processed.filter(item => 
        filters.status.includes(item.status)
      );
    }
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      processed = processed.filter(item => 
        item.message.toLowerCase().includes(searchLower) ||
        formatConnectionType(item.connectionType).toLowerCase().includes(searchLower) ||
        item.status.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply sorting
    processed.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      // For timestamp, convert to Date objects for comparison
      if (sortConfig.key === 'timestamp') {
        const aDate = new Date(aValue as string).getTime();
        const bDate = new Date(bValue as string).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // For other string values
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredData(processed);
  }, [data, filters, sortConfig]);
  
  // Get unique values for filters
  const getUniqueValues = (key: 'connectionType' | 'status') => {
    if (!data) return [];
    return Array.from(new Set(data.map(item => item[key])));
  };
  
  const connectionTypes = getUniqueValues('connectionType');
  const statuses = getUniqueValues('status');
  
  // Handle sorting change
  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => {
      if (current.key === key) {
        // Toggle direction if same key
        return { 
          key, 
          direction: current.direction === 'asc' ? 'desc' : 'asc' 
        };
      }
      // Default to descending for new sort key
      return { key, direction: 'desc' };
    });
  };
  
  // Handle filter changes
  const handleFilterChange = (
    filterType: 'connectionType' | 'status',
    value: string,
    checked: boolean
  ) => {
    setFilters(current => {
      const currentValues = [...current[filterType]];
      
      if (checked && !currentValues.includes(value)) {
        return { ...current, [filterType]: [...currentValues, value] };
      }
      
      if (!checked && currentValues.includes(value)) {
        return { 
          ...current, 
          [filterType]: currentValues.filter(v => v !== value) 
        };
      }
      
      return current;
    });
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(current => ({ ...current, search: e.target.value }));
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      connectionType: [],
      status: [],
      search: '',
    });
    
    setSortConfig({
      key: 'timestamp',
      direction: 'desc'
    });
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  // Show connection details in a modal
  const showConnectionDetails = (connection: ConnectionHistoryItem) => {
    setSelectedConnection(connection);
  };
  
  // Close the details modal
  const closeConnectionDetails = () => {
    setSelectedConnection(null);
  };
  
  // Get sort direction icon
  const getSortIcon = (key: SortConfig['key']) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronDown className="h-4 w-4 ml-1" /> : 
      <ChevronDown className="h-4 w-4 ml-1 transform rotate-180" />;
  };
  
  // Count active filters
  const activeFilterCount = filters.connectionType.length + filters.status.length + (filters.search ? 1 : 0);
  
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
  
  // Display connection history with filters and sorting
  return (
    <div className="space-y-4">
      {/* Header with title, filters, and refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h3 className="text-lg font-medium">Connection History</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              className="pl-8 w-full sm:w-[250px]"
              value={filters.search}
              onChange={handleSearchChange}
            />
            {filters.search && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => setFilters(f => ({ ...f, search: '' }))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">{activeFilterCount}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter Connections</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <h4 className="text-sm font-medium mb-1">Connection Type</h4>
                {connectionTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`type-${type}`}
                      checked={filters.connectionType.includes(type)}
                      onChange={(e) => handleFilterChange('connectionType', type, e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor={`type-${type}`} className="text-sm flex items-center gap-1">
                      <ConnectionTypeIcon type={type} />
                      {formatConnectionType(type)}
                    </label>
                  </div>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <h4 className="text-sm font-medium mb-1">Status</h4>
                {statuses.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id={`status-${status}`}
                      checked={filters.status.includes(status)}
                      onChange={(e) => handleFilterChange('status', status, e.target.checked)}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <label htmlFor={`status-${status}`} className="text-sm">
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </label>
                  </div>
                ))}
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={handleResetFilters}
                  disabled={activeFilterCount === 0}
                >
                  Reset Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Results summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredData.length} of {data.length} connections
        {activeFilterCount > 0 && ' (filtered)'}
      </div>
      
      {/* Connection history table with sorting */}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('connectionType')}
              >
                <div className="flex items-center">
                  Connection Type
                  {getSortIcon('connectionType')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('message')}
              >
                <div className="flex items-center">
                  Message
                  {getSortIcon('message')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('timestamp')}
              >
                <div className="flex items-center">
                  Time
                  {getSortIcon('timestamp')}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No connections match the current filters
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item: ConnectionHistoryItem) => (
                <TableRow 
                  key={item.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => showConnectionDetails(item)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <ConnectionTypeIcon type={item.connectionType} />
                      <span>{formatConnectionType(item.connectionType)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="max-w-md truncate">{item.message}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Connection details dialog */}
      <Dialog open={!!selectedConnection} onOpenChange={(open) => !open && closeConnectionDetails()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedConnection && (
                <>
                  <ConnectionTypeIcon type={selectedConnection.connectionType} />
                  {formatConnectionType(selectedConnection.connectionType)} Connection Details
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedConnection && (
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={selectedConnection.status} />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedConnection.timestamp), 'MMMM d, yyyy h:mm:ss a')}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedConnection && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Message</h3>
                <p className="text-sm">{selectedConnection.message}</p>
              </div>
              
              {selectedConnection.details && Object.keys(selectedConnection.details).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Connection Details</h3>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedConnection.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeConnectionDetails}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConnectionHistory;