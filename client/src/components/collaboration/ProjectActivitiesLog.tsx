import React, { useEffect, useState, useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Users, CheckSquare, Calendar, 
  FileArchive, RefreshCw, FileUp, FileDown,
  Link as LinkIcon, MessageSquare, Settings, 
  Layers, Database, Upload, Download, Activity,
  Search, Filter, SortAsc, SortDesc, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, X
} from 'lucide-react';

// Activity types with their corresponding icons
const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  'created_project': <FileText className="h-4 w-4 text-blue-500" />,
  'updated_project': <FileText className="h-4 w-4 text-yellow-500" />,
  'deleted_project': <FileText className="h-4 w-4 text-red-500" />,
  'added_member': <Users className="h-4 w-4 text-green-500" />,
  'removed_member': <Users className="h-4 w-4 text-red-500" />,
  'updated_member_role': <Users className="h-4 w-4 text-yellow-500" />,
  'completed_task': <CheckSquare className="h-4 w-4 text-green-500" />,
  'added_milestone': <Calendar className="h-4 w-4 text-purple-500" />,
  'added_document': <FileArchive className="h-4 w-4 text-blue-500" />,
  'updated_document': <FileArchive className="h-4 w-4 text-yellow-500" />,
  'synced_data': <RefreshCw className="h-4 w-4 text-blue-500" />,
  'uploaded_file': <FileUp className="h-4 w-4 text-green-500" />,
  'downloaded_file': <FileDown className="h-4 w-4 text-blue-500" />,
  'shared_link': <LinkIcon className="h-4 w-4 text-purple-500" />,
  'added_comment': <MessageSquare className="h-4 w-4 text-blue-500" />,
  'updated_settings': <Settings className="h-4 w-4 text-yellow-500" />,
  'added_item': <Layers className="h-4 w-4 text-green-500" />,
  'removed_item': <Layers className="h-4 w-4 text-red-500" />,
  'updated_item': <Layers className="h-4 w-4 text-yellow-500" />,
  'connected_database': <Database className="h-4 w-4 text-purple-500" />,
  'ftp_upload': <Upload className="h-4 w-4 text-green-500" />,
  'ftp_download': <Download className="h-4 w-4 text-blue-500" />,
  'ftp_sync_started': <RefreshCw className="h-4 w-4 text-blue-500" />,
  'ftp_sync_completed': <RefreshCw className="h-4 w-4 text-green-500" />,
  'ftp_sync_failed': <RefreshCw className="h-4 w-4 text-red-500" />,
};

interface ActivityItem {
  id: number;
  projectId: number;
  userId: number;
  type: string;
  createdAt: string;
  data?: Record<string, any>;
  user?: {
    id: number;
    name?: string;
    username?: string;
    avatarUrl?: string;
  };
}

interface ProjectActivitiesLogProps {
  // Direct activities array (optional)
  activities?: ActivityItem[];
  // Or project ID to fetch activities
  projectId?: number;
  // Style and display props
  title?: string;
  description?: string;
  isLoading?: boolean;
  className?: string;
  limit?: number;
  showCard?: boolean;
  // Pagination options
  useServerPagination?: boolean;
  defaultItemsPerPage?: number;
}

// Define filter types
type FilterType = 'all' | 'member' | 'item' | 'document' | 'ftp' | 'comment';
type SortOrder = 'newest' | 'oldest';
type TimeRange = 'all' | 'today' | 'week' | 'month';

// Helper to get activity types for a filter
const getActivityTypesByFilter = (filter: FilterType): string[] => {
  switch (filter) {
    case 'member':
      return ['added_member', 'removed_member', 'updated_member_role'];
    case 'item':
      return ['added_item', 'removed_item', 'updated_item'];
    case 'document':
      return ['added_document', 'updated_document', 'uploaded_file', 'downloaded_file'];
    case 'ftp':
      return ['ftp_upload', 'ftp_download', 'ftp_sync_started', 'ftp_sync_completed', 'ftp_sync_failed'];
    case 'comment':
      return ['added_comment'];
    default:
      return []; // 'all' filter returns empty array to match all types
  }
};

// Helper to get date range for time filter
const getDateRangeForTimeFilter = (timeRange: TimeRange): Date | null => {
  const now = new Date();
  switch (timeRange) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'week':
      return subDays(now, 7);
    case 'month':
      return subDays(now, 30);
    default:
      return null; // 'all' time range
  }
};

const ProjectActivitiesLog: React.FC<ProjectActivitiesLogProps> = ({
  activities: propActivities,
  projectId,
  title = "Recent Activities",
  description = "Recent project activities and updates",
  isLoading: propIsLoading,
  className = "",
  limit = 50,
  showCard = true,
  useServerPagination = false,
  defaultItemsPerPage = 15
}) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeRange>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  
  // Fetch activities if projectId is provided and activities are not
  // For server-side pagination, we need to add page and itemsPerPage to the query params
  const queryParams = useServerPagination ? { page, limit: itemsPerPage } : undefined;
  
  const { data, isLoading: queryIsLoading, error } = useQuery({
    queryKey: projectId ? 
      [`/api/projects/${projectId}/activities`, useServerPagination, page, itemsPerPage] : 
      null,
    enabled: !!projectId && !propActivities,
    // Only add these URL params for server-side pagination
    ...(useServerPagination && { 
      // If server-side pagination is enabled, send the pagination parameters
      meta: { params: queryParams }
    })
  });
  
  // Use provided activities or fetched activities - data shape depends on server response
  // For server-side pagination, the response will contain activities and pagination metadata
  // For client-side pagination, the response will be just an array of activities
  const rawActivities = propActivities || 
    (useServerPagination ? (data?.activities as ActivityItem[]) : (data as ActivityItem[])) || 
    [];
    
  // For server pagination, we need the total count from the server response
  // For client pagination, we calculate it from the activities array
  const totalCount = useServerPagination ? 
    (data?.totalCount as number) || 0 : 
    rawActivities.length;
  const isLoading = propIsLoading || queryIsLoading;
  
  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading activities",
        description: "There was a problem fetching project activities.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Apply filters and sorting
  const filteredAndSortedActivities = useMemo(() => {
    if (!rawActivities.length) return [];
    
    let result = [...rawActivities];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      const activityTypes = getActivityTypesByFilter(typeFilter);
      result = result.filter(activity => activityTypes.includes(activity.type));
    }
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const dateThreshold = getDateRangeForTimeFilter(timeFilter);
      if (dateThreshold) {
        result = result.filter(activity => {
          const activityDate = new Date(activity.createdAt);
          return activityDate >= dateThreshold;
        });
      }
    }
    
    // Apply search filter (search in user name or activity data)
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      result = result.filter(activity => {
        const userName = activity.user?.name || activity.user?.username || `User ${activity.userId}`;
        const activityData = activity.data ? JSON.stringify(activity.data).toLowerCase() : '';
        const activityType = activity.type.toLowerCase();
        
        return userName.toLowerCase().includes(searchLower) || 
               activityData.includes(searchLower) ||
               activityType.includes(searchLower);
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [rawActivities, typeFilter, timeFilter, search, sortOrder]);
  
  // Calculate pagination
  // For server-side pagination, use the total count from the server to calculate pages
  // For client-side, use the filtered activities length after applying filters
  const totalPages = useServerPagination 
    ? Math.ceil(totalCount / itemsPerPage)
    : Math.ceil(filteredAndSortedActivities.length / itemsPerPage);
    
  // For server-side pagination, we don't need to slice the activities as the server already paginated
  // For client-side, we need to slice the activities based on the current page
  const activities = useMemo(() => {
    if (useServerPagination) {
      return filteredAndSortedActivities; // Server already paginated the data
    } else {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredAndSortedActivities.slice(start, end);
    }
  }, [filteredAndSortedActivities, page, useServerPagination, itemsPerPage]);

  // Loading state
  if (isLoading) {
    return showCard ? (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="flex items-start space-x-4 pb-4 border-b">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="space-y-4">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="flex items-start space-x-4 pb-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return showCard ? (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/60 mb-3" />
            <p className="text-muted-foreground font-medium">No activities found</p>
            <p className="text-muted-foreground/70 text-sm">
              When project activities occur, they will be shown here
            </p>
          </div>
        </CardContent>
      </Card>
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/60 mb-3" />
        <p className="text-muted-foreground font-medium">No activities found</p>
        <p className="text-muted-foreground/70 text-sm">
          When project activities occur, they will be shown here
        </p>
      </div>
    );
  }

  // Format the activity message based on type
  const getActivityMessage = (activity: ActivityItem) => {
    const { type, data } = activity;
    
    switch (type) {
      case 'created_project':
        return `created project "${data?.projectName || 'Unnamed project'}"`;
      case 'updated_project':
        return `updated project details`;
      case 'deleted_project':
        return `deleted project "${data?.projectName || 'Unnamed project'}"`;
      case 'added_member':
        return `added ${data?.memberName || 'a new member'} to the project`;
      case 'removed_member':
        return `removed ${data?.memberName || 'a member'} from the project`;
      case 'updated_member_role':
        return `updated ${data?.memberName || 'a member'}'s role to ${data?.newRole || 'a new role'}`;
      case 'completed_task':
        return `completed task "${data?.taskName || 'Unnamed task'}"`;
      case 'added_milestone':
        return `added milestone "${data?.milestoneName || 'Unnamed milestone'}"`;
      case 'added_document':
        return `added document "${data?.documentName || 'Unnamed document'}"`;
      case 'updated_document':
        return `updated document "${data?.documentName || 'Unnamed document'}"`;
      case 'synced_data':
        return `synced data with ${data?.source || 'external system'}`;
      case 'uploaded_file':
        return `uploaded file "${data?.filename || 'a file'}"`;
      case 'downloaded_file':
        return `downloaded file "${data?.filename || 'a file'}"`;
      case 'shared_link':
        return `shared a link to the project`;
      case 'added_comment':
        return `commented on ${data?.itemType || 'an item'}`;
      case 'updated_settings':
        return `updated project settings`;
      case 'added_item':
        return `added ${data?.itemType || 'an item'} "${data?.itemName || 'Unnamed item'}"`;
      case 'removed_item':
        return `removed ${data?.itemType || 'an item'} "${data?.itemName || 'Unnamed item'}"`;
      case 'updated_item':
        return `updated ${data?.itemType || 'an item'} "${data?.itemName || 'Unnamed item'}"`;
      case 'connected_database':
        return `connected to database "${data?.databaseName || 'Unnamed database'}"`;
      case 'ftp_upload':
        return `uploaded file "${data?.filename || 'a file'}" via FTP`;
      case 'ftp_download':
        return `downloaded file "${data?.filename || 'a file'}" via FTP`;
      case 'ftp_sync_started':
        return `started FTP sync job "${data?.jobName || 'Unnamed job'}"`;
      case 'ftp_sync_completed':
        return `completed FTP sync job "${data?.jobName || 'Unnamed job'}"`;
      case 'ftp_sync_failed':
        return `failed FTP sync job "${data?.jobName || 'Unnamed job'}"`;
      default:
        return `performed action "${type}"`;
    }
  };

  // Limit the number of activities to display
  const limitedActivities = activities.slice(0, limit);

  // Filter controls
  const filterControls = (
    <div className="space-y-4 mb-4">
      {/* Search, filter, sort row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search activities..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to page 1 when searching
            }}
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 w-9 p-0"
              onClick={() => setSearch('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Type filter */}
        <div className="md:w-48">
          <Select
            value={typeFilter}
            onValueChange={(value: FilterType) => {
              setTypeFilter(value);
              setPage(1); // Reset to page 1 when filter changes
            }}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2 text-sm">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue placeholder="Filter by type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All activities</SelectItem>
              <SelectItem value="member">Team members</SelectItem>
              <SelectItem value="item">Project items</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="ftp">FTP operations</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Time filter */}
        <div className="md:w-44">
          <Select
            value={timeFilter}
            onValueChange={(value: TimeRange) => {
              setTimeFilter(value);
              setPage(1); // Reset to page 1 when time filter changes
            }}
          >
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-3.5 w-3.5" />
                <SelectValue placeholder="Time range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Sort order */}
        <Button
          variant="outline"
          size="sm"
          className="md:w-auto h-10"
          onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        >
          {sortOrder === 'newest' ? (
            <>
              <SortDesc className="h-4 w-4 mr-2" />
              Newest first
            </>
          ) : (
            <>
              <SortAsc className="h-4 w-4 mr-2" />
              Oldest first
            </>
          )}
        </Button>
      </div>
      
      {/* Active filters display */}
      {(typeFilter !== 'all' || timeFilter !== 'all' || search) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="flex gap-1 items-center">
              <span>Type: {typeFilter}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setTypeFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {timeFilter !== 'all' && (
            <Badge variant="secondary" className="flex gap-1 items-center">
              <span>Time: {timeFilter}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setTimeFilter('all')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {search && (
            <Badge variant="secondary" className="flex gap-1 items-center">
              <span>Search: {search}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1"
                onClick={() => setSearch('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => {
              setTypeFilter('all');
              setTimeFilter('all');
              setSearch('');
              setPage(1);
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
      
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredAndSortedActivities.length === 0 ? (
          <span>No activities match the current filters</span>
        ) : filteredAndSortedActivities.length === 1 ? (
          <span>1 activity found</span>
        ) : (
          <span>{filteredAndSortedActivities.length} activities found</span>
        )}
        {filteredAndSortedActivities.length > 0 && rawActivities.length !== filteredAndSortedActivities.length && (
          <span> (out of {rawActivities.length} total)</span>
        )}
      </div>
    </div>
  );
  
  // The activity list component (shared between card and non-card views)
  const activityList = (
    <>
      <ScrollArea className="pr-4" style={{ height: showCard ? '350px' : 'auto' }}>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground/60 mb-3" />
              <p className="text-muted-foreground font-medium">No matching activities</p>
              <p className="text-muted-foreground/70 text-sm">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            activities.map((activity) => {
              const activityIcon = ACTIVITY_ICONS[activity.type] || 
                <FileText className="h-4 w-4 text-muted-foreground" />;
              const formattedDate = activity.createdAt ? 
                format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a') : 
                'Unknown date';
                
              // Get user name (handle different API response structures)
              const userName = activity.user?.name || 
                              activity.user?.username || 
                              `User ${activity.userId}`;
              
              return (
                <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user?.avatarUrl} alt={userName} />
                    <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{userName}</span>
                      <span className="text-muted-foreground">{getActivityMessage(activity)}</span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {activityIcon}
                      <span className="ml-1">{formattedDate}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col space-y-2 pt-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  // If total pages are 5 or less, show all pages
                  pageNum = i + 1;
                } else if (page <= 3) {
                  // If current page is near the start
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  // If current page is near the end
                  pageNum = totalPages - 4 + i;
                } else {
                  // If current page is in the middle
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Items per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setPage(1); // Reset to page 1 when changing items per page
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // Return either a card or just the activity list based on showCard prop
  return showCard ? (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {filterControls}
        <Separator className="my-4" />
        {activityList}
      </CardContent>
    </Card>
  ) : (
    <div className={className}>
      {filterControls}
      <Separator className="my-4" />
      {activityList}
    </div>
  );
};

export default ProjectActivitiesLog;