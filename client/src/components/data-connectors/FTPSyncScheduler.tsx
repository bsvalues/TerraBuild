import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Folder,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash,
  AlertTriangle
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Validation schema for sync schedule
const scheduleFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  connectionId: z.number(),
  source: z.object({
    type: z.enum(["ftp", "local"]),
    path: z.string().min(1, "Source path is required"),
  }),
  destination: z.object({
    type: z.enum(["ftp", "local"]),
    path: z.string().min(1, "Destination path is required"),
  }),
  frequency: z.enum(["manual", "hourly", "daily", "weekly", "monthly"]),
  time: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  options: z.object({
    deleteAfterSync: z.boolean().default(false),
    overwriteExisting: z.boolean().default(true),
    includeSubfolders: z.boolean().default(true),
    filePatterns: z.array(z.string()).default([]),
  }),
  enabled: z.boolean().default(true),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Default values for the form
const defaultValues: Partial<ScheduleFormValues> = {
  name: "",
  source: {
    type: "ftp",
    path: "/",
  },
  destination: {
    type: "local",
    path: "./uploads",
  },
  frequency: "daily",
  time: "00:00",
  options: {
    deleteAfterSync: false,
    overwriteExisting: true,
    includeSubfolders: true,
    filePatterns: [],
  },
  enabled: true,
};

interface FTPSyncSchedulerProps {
  connectionId: number;
}

export const FTPSyncScheduler: React.FC<FTPSyncSchedulerProps> = ({ connectionId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [filePattern, setFilePattern] = useState("");
  const [activeTab, setActiveTab] = useState("schedules");

  // Form setup
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues,
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateDialogOpen) {
      form.reset(defaultValues);
    }
  }, [isCreateDialogOpen, form]);

  // Fetch sync schedules
  const {
    data: schedules,
    isLoading: isLoadingSchedules,
    error: schedulesError
  } = useQuery({
    queryKey: ['syncSchedules', connectionId],
    queryFn: async () => {
      const response = await axios.get(`/api/data-connectors/ftp-sync/schedules/${connectionId}`);
      return response.data;
    },
  });

  // Fetch sync history
  const {
    data: history,
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery({
    queryKey: ['syncHistory', connectionId],
    queryFn: async () => {
      const response = await axios.get(`/api/data-connectors/ftp-sync/history/${connectionId}`);
      return response.data;
    },
  });

  // Create a new sync schedule
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormValues) => {
      const response = await axios.post('/api/data-connectors/ftp-sync/schedules', {
        ...data,
        connectionId,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncSchedules', connectionId] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Schedule Created",
        description: "Your sync schedule has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Creating Schedule",
        description: error.response?.data?.error || error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Update a sync schedule
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { id: number; data: Partial<ScheduleFormValues> }) => {
      const response = await axios.patch(`/api/data-connectors/ftp-sync/schedules/${data.id}`, data.data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncSchedules', connectionId] });
      toast({
        title: "Schedule Updated",
        description: "Your sync schedule has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Schedule",
        description: error.response?.data?.error || error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Delete a sync schedule
  const deleteScheduleMutation = useMutation({
    mutationFn: async (data: { connectionId: number; name: string }) => {
      const response = await axios.delete(`/api/data-connectors/ftp-sync/schedules/${data.connectionId}/${data.name}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncSchedules', connectionId] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Schedule Deleted",
        description: "Your sync schedule has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Deleting Schedule",
        description: error.response?.data?.error || error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Run a sync job
  const runSyncJobMutation = useMutation({
    mutationFn: async (data: { connectionId: number; name: string }) => {
      const response = await axios.post(`/api/data-connectors/ftp-sync/run/${data.connectionId}/${data.name}`);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Sync Job Started",
        description: "Your sync job has been started successfully. Check the history tab for updates.",
      });
      // After a short delay, refresh the history to show the new job
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['syncHistory', connectionId] });
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error Starting Sync Job",
        description: error.response?.data?.error || error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });

  // Add file pattern to form
  const addFilePattern = () => {
    if (!filePattern) return;
    
    const currentPatterns = form.getValues("options.filePatterns") || [];
    form.setValue("options.filePatterns", [...currentPatterns, filePattern]);
    setFilePattern("");
  };

  // Remove file pattern from form
  const removeFilePattern = (index: number) => {
    const currentPatterns = form.getValues("options.filePatterns") || [];
    currentPatterns.splice(index, 1);
    form.setValue("options.filePatterns", [...currentPatterns]);
  };

  // Handle form submission
  const onSubmit = (values: ScheduleFormValues) => {
    createScheduleMutation.mutate(values);
  };

  // Toggle schedule enabled state
  const toggleScheduleEnabled = (schedule: any) => {
    updateScheduleMutation.mutate({
      id: schedule.id,
      data: {
        enabled: !schedule.enabled
      }
    });
  };

  // Start a sync job
  const runSyncJob = (schedule: any) => {
    runSyncJobMutation.mutate({
      connectionId,
      name: schedule.name
    });
  };

  // Confirm delete schedule
  const confirmDeleteSchedule = () => {
    if (!selectedSchedule) return;
    
    deleteScheduleMutation.mutate({
      connectionId,
      name: selectedSchedule.name
    });
  };

  // Get status badge for schedule
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">Success</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      default:
        return <Badge variant="secondary">Idle</Badge>;
    }
  };

  // Format the date with time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get frequency display text
  const getFrequencyText = (schedule: any) => {
    switch (schedule.frequency) {
      case 'hourly':
        return 'Every hour';
      case 'daily':
        return `Daily at ${schedule.time || '00:00'}`;
      case 'weekly':
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Weekly on ${days[schedule.dayOfWeek || 0]} at ${schedule.time || '00:00'}`;
      case 'monthly':
        return `Monthly on day ${schedule.dayOfMonth || 1} at ${schedule.time || '00:00'}`;
      default:
        return 'Manual only';
    }
  };

  // Render error if failed to load schedules
  if (schedulesError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load sync schedules. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="schedules">Sync Schedules</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
          </TabsList>

          {activeTab === "schedules" && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          )}
        </div>

        <TabsContent value="schedules" className="space-y-4">
          {isLoadingSchedules ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !schedules || schedules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No sync schedules found. Create your first schedule to start syncing data.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule: any) => (
                <Card key={schedule.id} className={!schedule.enabled ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="truncate">{schedule.name}</CardTitle>
                      <div className="flex space-x-1">
                        {getStatusBadge(schedule.status)}
                        {schedule.enabled ? (
                          <Badge variant="outline" className="bg-green-100">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{getFrequencyText(schedule)}</CardDescription>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">From:</span>
                        <span className="truncate">{`${schedule.source.type}:${schedule.source.path}`}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Folder className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">To:</span>
                        <span className="truncate">{`${schedule.destination.type}:${schedule.destination.path}`}</span>
                      </div>
                      {schedule.lastRun && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Last run:</span>
                          <span>{formatDateTime(schedule.lastRun)}</span>
                        </div>
                      )}
                      {schedule.nextRun && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Next run:</span>
                          <span>{formatDateTime(schedule.nextRun)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleScheduleEnabled(schedule)}
                      >
                        {schedule.enabled ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => runSyncJob(schedule)}
                      disabled={!schedule.enabled || schedule.status === 'running'}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {isLoadingHistory ? (
            <div className="flex justify-center items-center h-40">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !history || history.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-40">
                <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No sync history found. Run a sync job to see the history.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
                <CardDescription>Recent sync job executions</CardDescription>
              </CardHeader>
              <ScrollArea className="h-[500px]">
                <CardContent>
                  <div className="space-y-4">
                    {history.map((record: any) => {
                      const statusIcon = record.status === 'success' ? (
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                      ) : record.status === 'failed' ? (
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                        </div>
                      );

                      return (
                        <div key={record.id} className="flex items-start space-x-4 pb-4 border-b">
                          {statusIcon}
                          <div className="space-y-1 flex-1">
                            <div>
                              <div className="font-medium mb-1">{record.scheduleName}</div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Status:</span>
                                <span className="text-sm font-medium capitalize">{record.status}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Started:</span>
                                <span className="text-sm">{formatDateTime(record.startTime)}</span>
                              </div>
                              {record.endTime && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">Completed:</span>
                                  <span className="text-sm">{formatDateTime(record.endTime)}</span>
                                </div>
                              )}
                              {record.filesTransferred !== undefined && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-muted-foreground">Files:</span>
                                  <span className="text-sm">{record.filesTransferred} files ({Math.round(record.totalBytes / 1024)} KB)</span>
                                </div>
                              )}
                              {record.errors && record.errors.length > 0 && (
                                <div className="mt-2 p-2 bg-red-50 rounded-md">
                                  <div className="text-sm font-medium text-red-800 mb-1">Errors:</div>
                                  <ul className="text-xs text-red-700 list-disc pl-4">
                                    {record.errors.map((error: string, idx: number) => (
                                      <li key={idx}>{error}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Schedule Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Sync Schedule</DialogTitle>
            <DialogDescription>
              Configure a new synchronization schedule between FTP and local storage.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Daily CAMA Data Sync" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive name for this sync schedule
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Source</h4>
                  <FormField
                    control={form.control}
                    name="source.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ftp">FTP Server</SelectItem>
                            <SelectItem value="local">Local Storage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source.path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Path</FormLabel>
                        <FormControl>
                          <Input placeholder="/path/to/source" {...field} />
                        </FormControl>
                        <FormDescription>
                          {form.watch("source.type") === "ftp" 
                            ? "Path on the FTP server"
                            : "Path on the local filesystem"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Destination</h4>
                  <FormField
                    control={form.control}
                    name="destination.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ftp">FTP Server</SelectItem>
                            <SelectItem value="local">Local Storage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="destination.path"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Path</FormLabel>
                        <FormControl>
                          <Input placeholder="/path/to/destination" {...field} />
                        </FormControl>
                        <FormDescription>
                          {form.watch("destination.type") === "ftp" 
                            ? "Path on the FTP server"
                            : "Path on the local filesystem"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Schedule</h4>
                  <FormField
                    control={form.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manual">Manual Only</SelectItem>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("frequency") !== "manual" && form.watch("frequency") !== "hourly" && (
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("frequency") === "weekly" && (
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Week</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Sunday</SelectItem>
                              <SelectItem value="1">Monday</SelectItem>
                              <SelectItem value="2">Tuesday</SelectItem>
                              <SelectItem value="3">Wednesday</SelectItem>
                              <SelectItem value="4">Thursday</SelectItem>
                              <SelectItem value="5">Friday</SelectItem>
                              <SelectItem value="6">Saturday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {form.watch("frequency") === "monthly" && (
                    <FormField
                      control={form.control}
                      name="dayOfMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Month</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 31 }, (_, i) => (
                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Options</h4>
                  <FormField
                    control={form.control}
                    name="options.deleteAfterSync"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Delete source files after sync</FormLabel>
                          <FormDescription>
                            Files will be removed from the source after successful transfer
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="options.overwriteExisting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Overwrite existing files</FormLabel>
                          <FormDescription>
                            Existing files at the destination will be overwritten
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="options.includeSubfolders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include subfolders</FormLabel>
                          <FormDescription>
                            Sync will recursively process subfolders
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <FormLabel>File Patterns (Optional)</FormLabel>
                <div className="flex space-x-2 mb-2">
                  <Input
                    value={filePattern}
                    onChange={(e) => setFilePattern(e.target.value)}
                    placeholder="*.xml, data*.json, etc."
                  />
                  <Button type="button" onClick={addFilePattern} size="sm">
                    Add
                  </Button>
                </div>
                <FormDescription>
                  Only files matching these patterns will be included in the sync
                </FormDescription>

                <div className="flex flex-wrap gap-2 mt-2">
                  {form.watch("options.filePatterns")?.map((pattern, index) => (
                    <Badge key={index} variant="secondary" className="px-2 py-1">
                      {pattern}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => removeFilePattern(index)}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable schedule</FormLabel>
                      <FormDescription>
                        The schedule will be active and run automatically
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScheduleMutation.isPending}>
                  {createScheduleMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Schedule"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the schedule "{selectedSchedule?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={confirmDeleteSchedule}
              disabled={deleteScheduleMutation.isPending}
            >
              {deleteScheduleMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FTPSyncScheduler;