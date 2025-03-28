import React, { useState } from "react";
import { useApiEndpoints } from "@/hooks/use-api-endpoints";
import { Badge } from "@/components/ui/badge";
import { StatusIcon } from "@/components/ui/status-card";
import { API_METHODS, STATUS_TYPES, STATUS_VARIANTS } from "@/data/constants";
import { Button } from "@/components/ui/button";
import { Plus, Search, RefreshCw, Check, X, Edit, Trash2, Terminal, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertApiEndpoint, ApiEndpoint } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ApiManager() {
  const { toast } = useToast();
  const { apiEndpoints, isLoading, createEndpoint, updateEndpointStatus, deleteEndpoint } = useApiEndpoints();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [testResponse, setTestResponse] = useState<{ status: number; body: any } | null>(null);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Define validation schema for API endpoint form
  const formSchema = z.object({
    path: z.string().min(1, "Path is required"),
    method: z.string().min(1, "Method is required"),
    status: z.string().default("online"),
    requiresAuth: z.boolean().default(true),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      path: "",
      method: "GET",
      status: "online",
      requiresAuth: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createEndpoint.mutateAsync(values as InsertApiEndpoint);
      toast({
        title: "Success",
        description: "API endpoint created successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create API endpoint",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (endpoint: ApiEndpoint, newStatus: string) => {
    try {
      await updateEndpointStatus.mutateAsync({ id: endpoint.id, status: newStatus });
      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedEndpoint) return;
    
    try {
      await deleteEndpoint.mutateAsync(selectedEndpoint.id);
      toast({
        title: "Success",
        description: "API endpoint deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedEndpoint(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API endpoint",
        variant: "destructive",
      });
    }
  };

  const handleTestEndpoint = async () => {
    if (!selectedEndpoint) return;
    
    setIsTestLoading(true);
    setTestResponse(null);
    
    try {
      const response = await apiRequest(
        selectedEndpoint.method as any, 
        selectedEndpoint.path,
        undefined
      );
      
      let responseBody;
      try {
        responseBody = await response.json();
      } catch (e) {
        responseBody = { message: "Could not parse response as JSON" };
      }
      
      setTestResponse({
        status: response.status,
        body: responseBody,
      });
    } catch (error) {
      setTestResponse({
        status: 500,
        body: { error: "Failed to connect to the endpoint" },
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET": return "default";
      case "POST": return "success";
      case "PUT": case "PATCH": return "warning";
      case "DELETE": return "danger";
      default: return "default";
    }
  };

  const filteredEndpoints = apiEndpoints?.filter(endpoint => 
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden mt-6">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">API Endpoints</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-10 bg-neutral-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-neutral-600 mb-4">API Manager</h2>
      
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">API Endpoints</h3>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Input
                placeholder="Search endpoints..."
                className="h-8 text-xs w-48"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                startIcon={<Search className="h-3.5 w-3.5" />}
              />
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> New Endpoint
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New API Endpoint</DialogTitle>
                  <DialogDescription>
                    Add a new API endpoint to monitor and manage.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="path"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Path</FormLabel>
                          <FormControl>
                            <Input placeholder="/api/example" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the API endpoint path (e.g., /api/users)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Method</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {API_METHODS.map(method => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose HTTP method for this endpoint
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="requiresAuth"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Requires Authentication
                            </FormLabel>
                            <FormDescription>
                              Enable if this endpoint requires authentication
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" type="button">Cancel</Button>
                      </DialogClose>
                      <Button type="submit">Add Endpoint</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Endpoint</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Method</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Auth</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-100">
              {filteredEndpoints?.map((endpoint) => (
                <tr key={endpoint.id} className="hover:bg-neutral-50">
                  <td className="px-6 py-3 whitespace-nowrap text-sm font-mono text-neutral-600">{endpoint.path}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <Badge variant={getMethodBadgeColor(endpoint.method)}>{endpoint.method}</Badge>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <StatusIcon status={endpoint.status as any} />
                      <div className="ml-2 flex items-center space-x-1">
                        <span className={`text-xs ${endpoint.status === 'degraded' ? 'text-warning' : endpoint.status === 'offline' ? 'text-danger' : 'text-neutral-600'}`}>
                          {endpoint.status === 'online' ? 'Online' : endpoint.status === 'degraded' ? 'Degraded' : 'Offline'}
                        </span>
                        <div className="relative ml-2 group">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-6 w-6 rounded-full"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <div className="absolute left-0 mt-2 bg-white border border-neutral-200 rounded shadow-lg p-2 hidden group-hover:block z-10 w-28">
                            <button 
                              className="flex items-center space-x-2 px-2 py-1 text-xs text-success hover:bg-neutral-100 w-full text-left rounded"
                              onClick={() => handleStatusChange(endpoint, 'online')}
                            >
                              <Check className="h-3 w-3" />
                              <span>Online</span>
                            </button>
                            <button 
                              className="flex items-center space-x-2 px-2 py-1 text-xs text-warning hover:bg-neutral-100 w-full text-left rounded"
                              onClick={() => handleStatusChange(endpoint, 'degraded')}
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Degraded</span>
                            </button>
                            <button 
                              className="flex items-center space-x-2 px-2 py-1 text-xs text-danger hover:bg-neutral-100 w-full text-left rounded"
                              onClick={() => handleStatusChange(endpoint, 'offline')}
                            >
                              <X className="h-3 w-3" />
                              <span>Offline</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-600">
                    {endpoint.requiresAuth ? 'Required' : 'Optional'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-xs text-neutral-400">
                    <div className="flex space-x-2">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                        onClick={() => {
                          setSelectedEndpoint(endpoint);
                          setIsTestDialogOpen(true);
                        }}
                      >
                        <Terminal className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 text-danger hover:text-danger hover:bg-danger/10"
                        onClick={() => {
                          setSelectedEndpoint(endpoint);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-3 flex items-center justify-between border-t border-neutral-200 bg-neutral-50">
          <div className="text-xs text-neutral-500">
            Showing {filteredEndpoints?.length} of {apiEndpoints?.length} endpoints
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" className="h-6 w-6" disabled>
              <i className="ri-arrow-left-s-line"></i>
            </Button>
            <Button size="icon" className="h-6 w-6">1</Button>
            <Button variant="outline" size="icon" className="h-6 w-6">
              <i className="ri-arrow-right-s-line"></i>
            </Button>
          </div>
        </div>
      </div>

      {/* Test Endpoint Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Test API Endpoint</DialogTitle>
            <DialogDescription>
              {selectedEndpoint && (
                <span className="font-mono">
                  {selectedEndpoint.method} {selectedEndpoint.path}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="flex justify-end">
              <Button 
                onClick={handleTestEndpoint} 
                disabled={isTestLoading}
                size="sm"
              >
                {isTestLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Terminal className="h-4 w-4 mr-2" />
                    Test Endpoint
                  </>
                )}
              </Button>
            </div>
            
            {testResponse && (
              <div className="border rounded-md overflow-hidden">
                <div className={`px-4 py-2 text-white text-sm ${
                  testResponse.status >= 200 && testResponse.status < 300
                    ? 'bg-success'
                    : testResponse.status >= 400
                    ? 'bg-danger'
                    : 'bg-warning'
                }`}>
                  Status: {testResponse.status}
                </div>
                <div className="bg-neutral-900 p-4 font-mono text-xs text-white overflow-auto max-h-80">
                  <pre>{JSON.stringify(testResponse.body, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsTestDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API endpoint?
              {selectedEndpoint && (
                <div className="mt-2 font-mono text-sm bg-neutral-100 p-2 rounded">
                  {selectedEndpoint.method} {selectedEndpoint.path}
                </div>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
