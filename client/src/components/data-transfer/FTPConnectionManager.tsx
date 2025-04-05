import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen,
  RefreshCw,
  ArrowUp,
  Upload,
  Download,
  File,
  Folder,
  ArrowUpDown,
  Search,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  FileCog,
  FileSpreadsheet,
  FileImage,
  FilePlus2,
  Home
} from 'lucide-react';

// Types for FTP operations
interface FTPFile {
  name: string;
  type: string;
  size: number;
  modifiedDate: string;
  permissions: string;
}

interface FTPResponse {
  success: boolean;
  message: string;
  files?: FTPFile[];
}

interface ConnectionStatus {
  success: boolean;
  message: string;
}

interface TransferProgress {
  filename: string;
  percent: number;
  bytesTransferred: number;
  totalBytes: number;
  status: 'progress' | 'completed' | 'error';
  error?: string;
}

export function FTPConnectionManager() {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState('/');
  const [pathHistory, setPathHistory] = useState<string[]>(['/']);
  const [selectedFiles, setSelectedFiles] = useState<FTPFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [transferProgress, setTransferProgress] = useState<TransferProgress | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Function to get file icon based on file type and name
  const getFileIcon = (file: FTPFile) => {
    if (file.type === 'directory') return <Folder className="h-5 w-5 text-blue-500" />;
    
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'txt':
      case 'log':
        return <FileText className="h-5 w-5 text-gray-600" />;
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'c':
      case 'cpp':
      case 'php':
      case 'html':
      case 'css':
        return <FileCog className="h-5 w-5 text-amber-600" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Convert bytes to human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Query to list files
  const { data: filesData, isLoading, isError, error, refetch } = useQuery<FTPResponse>({
    queryKey: ['ftp', 'list', currentPath],
    queryFn: () => apiRequest(`/api/ftp/list?path=${encodeURIComponent(currentPath)}`),
    retry: 1,
  });

  // Connection status query
  const { data: connectionStatus } = useQuery<ConnectionStatus>({
    queryKey: ['ftp', 'status'],
    queryFn: () => apiRequest('/api/ftp/status'),
    retry: 1,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/ftp/connect', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Successful',
        description: data.message || 'Successfully connected to FTP server.',
        variant: 'default',
      });
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: 'Connection Failed',
        description: err?.message || 'Failed to connect to FTP server.',
        variant: 'destructive',
      });
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return apiRequest('/api/ftp/upload', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload Successful',
        description: data.message || 'File uploaded successfully.',
        variant: 'default',
      });
      setUploadFile(null);
      setTransferProgress(null);
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: 'Upload Failed',
        description: err?.message || 'Failed to upload file.',
        variant: 'destructive',
      });
      setTransferProgress({
        ...transferProgress!,
        status: 'error',
        error: err?.message || 'Failed to upload file',
      });
    },
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (filename: string) => {
      const response = await fetch(`/api/ftp/download?path=${encodeURIComponent(currentPath)}&filename=${encodeURIComponent(filename)}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      return { success: true, message: 'Download successful' };
    },
    onSuccess: (data) => {
      toast({
        title: 'Download Successful',
        description: data.message || 'File downloaded successfully.',
        variant: 'default',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Download Failed',
        description: err?.message || 'Failed to download file.',
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ path, filename }: { path: string; filename: string }) => {
      return apiRequest('/api/ftp/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, filename }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Delete Successful',
        description: data.message || 'Item deleted successfully.',
        variant: 'default',
      });
      setSelectedFiles([]);
      refetch();
    },
    onError: (err: any) => {
      toast({
        title: 'Delete Failed',
        description: err?.message || 'Failed to delete item.',
        variant: 'destructive',
      });
    },
  });

  // Filtered files based on search query
  const filteredFiles = filesData?.files?.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Handle directory change
  const navigateToDirectory = (directoryName: string) => {
    let newPath;
    
    if (directoryName === '..') {
      // Go up one directory
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      newPath = pathParts.length ? '/' + pathParts.join('/') : '/';
    } else if (directoryName === '/') {
      // Go to root
      newPath = '/';
    } else {
      // Navigate to subdirectory
      newPath = currentPath.endsWith('/') 
        ? `${currentPath}${directoryName}` 
        : `${currentPath}/${directoryName}`;
    }
    
    setCurrentPath(newPath);
    setPathHistory([...pathHistory, newPath]);
    setSelectedFiles([]);
  };

  // Handle file selection
  const handleFileSelection = (file: FTPFile) => {
    if (file.type === 'directory') {
      navigateToDirectory(file.name);
    } else {
      const isSelected = selectedFiles.some(selected => selected.name === file.name);
      
      if (isSelected) {
        setSelectedFiles(selectedFiles.filter(selected => selected.name !== file.name));
      } else {
        setSelectedFiles([...selectedFiles, file]);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadFile(files[0]);
      
      setTransferProgress({
        filename: files[0].name,
        percent: 0,
        bytesTransferred: 0,
        totalBytes: files[0].size,
        status: 'progress'
      });
      
      const formData = new FormData();
      formData.append('file', files[0]);
      formData.append('path', currentPath);
      
      uploadMutation.mutate(formData);
    }
  };

  // Handle file download
  const handleFileDownload = (filename: string) => {
    downloadMutation.mutate(filename);
  };

  // Handle file deletion
  const handleFileDelete = (filename: string) => {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      deleteMutation.mutate({ path: currentPath, filename });
    }
  };

  // Breadcrumb navigation
  const renderBreadcrumbs = () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    
    return (
      <div className="flex items-center text-sm mb-2 overflow-x-auto pb-1">
        <button 
          onClick={() => navigateToDirectory('/')}
          className="flex items-center text-blue-600 hover:text-blue-800 mr-1"
        >
          <Home className="h-3 w-3 mr-1" />
          <span>root</span>
        </button>
        
        {pathParts.length > 0 && <ChevronRight className="h-3 w-3 mx-1 text-gray-500" />}
        
        {pathParts.map((part, index) => (
          <React.Fragment key={index}>
            <button 
              onClick={() => {
                const path = '/' + pathParts.slice(0, index + 1).join('/');
                setCurrentPath(path);
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              {part}
            </button>
            {index < pathParts.length - 1 && (
              <ChevronRight className="h-3 w-3 mx-1 text-gray-500" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Progress indicator component
  const FileTransferProgress = ({ progress }: { progress: TransferProgress }) => {
    return (
      <div className="mb-4 p-3 border rounded-md">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{progress.filename}</span>
          <span className="text-sm font-medium">{progress.percent.toFixed(0)}%</span>
        </div>
        <Progress value={progress.percent} className="h-2 mb-1" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(progress.bytesTransferred)} of {formatFileSize(progress.totalBytes)}</span>
          <span>
            {progress.status === 'progress' && <Clock className="h-3 w-3 inline mr-1" />}
            {progress.status === 'completed' && <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />}
            {progress.status === 'error' && <AlertCircle className="h-3 w-3 inline mr-1 text-red-500" />}
            {progress.status === 'progress' && 'Transferring...'}
            {progress.status === 'completed' && 'Completed'}
            {progress.status === 'error' && 'Failed'}
          </span>
        </div>
        {progress.status === 'error' && progress.error && (
          <div className="mt-1 text-xs text-red-500">{progress.error}</div>
        )}
      </div>
    );
  };

  // Simulated progress for the demo (will be replaced with actual progress from server)
  useEffect(() => {
    if (transferProgress && transferProgress.status === 'progress') {
      const timer = setInterval(() => {
        setTransferProgress(prev => {
          if (!prev || prev.status !== 'progress' || prev.percent >= 100) {
            clearInterval(timer);
            if (prev?.percent && prev.percent >= 100) {
              return { 
                ...prev, 
                status: 'completed' as const, 
                percent: 100,
                filename: prev.filename,
                bytesTransferred: prev.bytesTransferred,
                totalBytes: prev.totalBytes
              };
            }
            return prev;
          }
          
          const newPercent = prev.percent + (Math.random() * 10);
          const bytesTransferred = Math.floor((newPercent / 100) * prev.totalBytes);
          
          return {
            ...prev,
            percent: Math.min(newPercent, 99), // Cap at 99% until complete
            bytesTransferred
          };
        });
      }, 300);
      
      return () => clearInterval(timer);
    }
  }, [transferProgress]);

  const filesExist = filesData?.files && filesData.files.length > 0;
  const isConnected = connectionStatus?.success || false;

  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center mb-2">
          <div>
            <CardTitle>FTP Connection Manager</CardTitle>
            <CardDescription>
              Browse, upload, and download files from the FTP server
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <label htmlFor="file-upload" className="cursor-pointer">
            <Input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!isConnected || uploadMutation.isPending}
            />
            <Button 
              variant="outline" 
              size="icon"
              disabled={!isConnected || uploadMutation.isPending}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </label>
          <Button 
            variant="outline" 
            size="icon"
            disabled={!isConnected || selectedFiles.length === 0 || downloadMutation.isPending}
            onClick={() => selectedFiles.length === 1 && handleFileDownload(selectedFiles[0].name)}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            disabled={!isConnected || selectedFiles.length === 0 || deleteMutation.isPending}
            onClick={() => selectedFiles.length === 1 && handleFileDelete(selectedFiles[0].name)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        {/* Breadcrumb Navigation */}
        {renderBreadcrumbs()}
        
        {/* Progress indicator if any file is being uploaded */}
        {transferProgress && <FileTransferProgress progress={transferProgress} />}
        
        {/* Connection Error Message */}
        {isError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to connect to FTP server'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* File Browser */}
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPath !== '/' && (
                <TableRow 
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => navigateToDirectory('..')}
                >
                  <TableCell className="flex items-center">
                    <ArrowUp className="h-4 w-4 mr-2 text-blue-500" />
                    <span>..</span>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              )}
              
              {!isLoading && !filesExist && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {currentPath === '/' ? 'Root directory is empty' : 'This directory is empty'}
                  </TableCell>
                </TableRow>
              )}
              
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                    <div className="mt-2">Loading files...</div>
                  </TableCell>
                </TableRow>
              )}
              
              {filteredFiles.map((file) => (
                <TableRow 
                  key={file.name}
                  className={`cursor-pointer hover:bg-muted ${
                    selectedFiles.some(selected => selected.name === file.name) ? 'bg-muted' : ''
                  }`}
                  onClick={() => handleFileSelection(file)}
                >
                  <TableCell className="flex items-center">
                    {getFileIcon(file)}
                    <span className="ml-2">{file.name}</span>
                  </TableCell>
                  <TableCell>{file.type === 'directory' ? '-' : formatFileSize(file.size)}</TableCell>
                  <TableCell>{formatDate(file.modifiedDate)}</TableCell>
                  <TableCell>{file.permissions}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        <div className="text-xs text-muted-foreground">
          {filesData?.files?.length || 0} items • {selectedFiles.length} selected
        </div>
        <div className="text-xs text-muted-foreground">
          {isConnected ? 'Connected to FTP server' : 'Not connected to FTP server'}
        </div>
      </CardFooter>
    </Card>
  );
}

export default FTPConnectionManager;