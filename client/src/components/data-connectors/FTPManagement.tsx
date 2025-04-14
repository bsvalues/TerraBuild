import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import FTPFilePreview from "./FTPFilePreview";
import FTPBreadcrumb from "./FTPBreadcrumb";
import FileTypeIcon from "./FileTypeIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  Upload,
  FileType,
  Folder,
  Download,
  File as FileIcon,
  FolderPlus,
  ArrowUp,
  ArrowLeft,
  Trash2,
  RefreshCw,
  FolderOpen,
  AlertCircle,
  CheckCircle,
  Ban,
  Loader2,
  FileText,
  Eye,
  ArrowUpDown,
  ArrowDownUp,
  SortAsc,
  SortDesc
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

// Define file type returned from API
type FileListItem = {
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: string;
  permissions?: string;
  owner?: string;
};

// Component for FTP management
const FTPManagement: React.FC = () => {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDirName, setNewDirName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [createDirOpen, setCreateDirOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileListItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileListItem | null>(null);
  const [sortField, setSortField] = useState<'name' | 'size' | 'lastModified'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Test FTP connection
  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // This endpoint is actually calling testConnection() in the ftpService
      const response = await fetch('/api/export/test-connection');
      const data = await response.json();
      
      if (data.success) {
        setConnectionStatus(true);
        toast({
          title: "Connection Successful",
          description: data.message || "Connected to FTP server successfully",
          variant: "default",
        });
      } else {
        setConnectionStatus(false);
        setError(data.message || "Connection failed");
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to FTP server",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setConnectionStatus(false);
      setError(err.message || "Error testing connection");
      toast({
        title: "Connection Error",
        description: err.message || "An error occurred while testing connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load files from current directory
  const loadFiles = async (path: string = currentPath) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/export/list-files?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (data.success) {
        // Sort: directories first, then files alphabetically
        const sortedFiles = [...(data.files || [])].sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        
        setFiles(sortedFiles);
        setCurrentPath(data.path || path);
        setConnectionStatus(true);
      } else {
        setError(data.message || "Failed to load files");
        setFiles([]);
        toast({
          title: "Error Loading Files",
          description: data.message || "Failed to load files from FTP server",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error loading files");
      setFiles([]);
      toast({
        title: "Error Loading Files",
        description: err.message || "An error occurred while loading files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Navigate to a directory
  const navigateToDirectory = (dirName: string) => {
    let newPath;
    
    if (dirName === '..') {
      // Go up one directory level
      const pathParts = currentPath.split('/').filter(Boolean);
      pathParts.pop();
      newPath = pathParts.length ? `/${pathParts.join('/')}/` : '/';
    } else {
      // Go into the directory
      newPath = currentPath.endsWith('/') 
        ? `${currentPath}${dirName}/` 
        : `${currentPath}/${dirName}/`;
    }
    
    loadFiles(newPath);
  };
  
  // Create a new directory
  const createDirectory = async () => {
    if (!newDirName) {
      toast({
        title: "Error",
        description: "Directory name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const dirPath = currentPath.endsWith('/') 
      ? `${currentPath}${newDirName}` 
      : `${currentPath}/${newDirName}`;
    
    try {
      const response = await fetch('/api/export/create-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: dirPath })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Directory Created",
          description: `Created directory "${newDirName}" successfully`,
          variant: "default",
        });
        setNewDirName('');
        setCreateDirOpen(false);
        loadFiles(); // Refresh file list
      } else {
        setError(data.message || "Failed to create directory");
        toast({
          title: "Error Creating Directory",
          description: data.message || "Failed to create directory",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error creating directory");
      toast({
        title: "Error Creating Directory",
        description: err.message || "An error occurred while creating directory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a file
  const deleteFile = async (filePath: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/export/file', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "File Deleted",
          description: `Deleted "${filePath}" successfully`,
          variant: "default",
        });
        setSelectedFile(null);
        loadFiles(); // Refresh file list
      } else {
        setError(data.message || "Failed to delete file");
        toast({
          title: "Error Deleting File",
          description: data.message || "Failed to delete file",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error deleting file");
      toast({
        title: "Error Deleting File",
        description: err.message || "An error occurred while deleting file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Upload a file
  const uploadFileToFTP = async () => {
    if (!uploadFile) {
      toast({
        title: "Error",
        description: "No file selected for upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    // Determine upload path
    const uploadPathToUse = uploadPath || currentPath;
    
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('remotePath', uploadPathToUse);
    formData.append('createDir', 'true');
    
    try {
      const response = await fetch('/api/export/file', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "File Uploaded",
          description: `Uploaded "${uploadFile.name}" successfully`,
          variant: "default",
        });
        setUploadFile(null);
        setUploadPath('');
        loadFiles(); // Refresh file list
      } else {
        setError(data.message || "Failed to upload file");
        toast({
          title: "Error Uploading File",
          description: data.message || "Failed to upload file",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setError(err.message || "Error uploading file");
      toast({
        title: "Error Uploading File",
        description: err.message || "An error occurred while uploading file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Download a file from FTP server
  const downloadFile = async (file: FileListItem) => {
    if (file.type !== 'file') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const filePath = currentPath.endsWith('/')
        ? `${currentPath}${file.name}`
        : `${currentPath}/${file.name}`;
      
      toast({
        title: "Downloading File",
        description: `Starting download of ${file.name}`,
        variant: "default",
      });
      
      // Create a download link and trigger it
      const downloadUrl = `/api/data-connections/ftp/download?path=${encodeURIComponent(filePath)}`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.name);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err: any) {
      setError(err.message || "Error downloading file");
      toast({
        title: "Download Error",
        description: err.message || "An error occurred while downloading the file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Open file preview
  const previewFileContent = (file: FileListItem) => {
    if (file.type !== 'file') return;
    setPreviewFile(file);
  };
  
  // Handle file selection for upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };
  
  // Load files on initial render and when path changes
  useEffect(() => {
    testConnection().then(() => {
      loadFiles('/');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (bytes === undefined) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };
  
  // Format date
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };
  
  // Toggle sort field or direction
  const toggleSort = (field: 'name' | 'size' | 'lastModified') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and reset direction to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Get sorted files
  const sortedFiles = useMemo(() => {
    if (!files.length) return [];
    
    return [...files].sort((a, b) => {
      // Always put directories first
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      
      // Then sort by the specified field
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'size':
          const aSize = a.size || 0;
          const bSize = b.size || 0;
          return (aSize - bSize) * direction;
        case 'lastModified':
          const aDate = a.lastModified ? new Date(a.lastModified).getTime() : 0;
          const bDate = b.lastModified ? new Date(b.lastModified).getTime() : 0;
          return (aDate - bDate) * direction;
        default:
          return 0;
      }
    });
  }, [files, sortField, sortDirection]);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">FTP Management</CardTitle>
            <CardDescription>
              Browse, upload, and manage files on the FTP server
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => testConnection()} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Test Connection
            </Button>
            {connectionStatus !== null && (
              connectionStatus ? (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" /> Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  <Ban className="h-3 w-3 mr-1" /> Disconnected
                </Badge>
              )
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              onClick={() => navigateToDirectory('..')} 
              variant="outline" 
              size="sm"
              disabled={loading || currentPath === '/'}
            >
              <ArrowUp className="h-4 w-4 mr-1" /> Up
            </Button>
            
            <div className="flex-1">
              <FTPBreadcrumb 
                path={currentPath || '/'} 
                onNavigate={(path) => loadFiles(path)} 
              />
            </div>
            
            <Dialog open={createDirOpen} onOpenChange={setCreateDirOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={loading}
                >
                  <FolderPlus className="h-4 w-4 mr-1" /> New Directory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Directory</DialogTitle>
                  <DialogDescription>
                    Enter a name for the new directory to be created at the current location.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="dirName">Directory Name</Label>
                    <Input
                      id="dirName"
                      value={newDirName}
                      onChange={(e) => setNewDirName(e.target.value)}
                      placeholder="Enter directory name"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Will be created at: {currentPath}
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={createDirectory} 
                    disabled={!newDirName || loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FolderPlus className="h-4 w-4 mr-2" />}
                    Create Directory
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-1" /> Upload File
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload File to FTP</DialogTitle>
                  <DialogDescription>
                    Select a file to upload to the current directory.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">File to Upload</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {uploadFile && (
                      <div className="text-sm font-medium">
                        Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uploadPath">Remote Path (Optional)</Label>
                    <Input
                      id="uploadPath"
                      value={uploadPath}
                      onChange={(e) => setUploadPath(e.target.value)}
                      placeholder={`Default: ${currentPath}`}
                    />
                    <div className="text-xs text-muted-foreground">
                      Leave empty to use current directory ({currentPath})
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-center">{uploadProgress}% Complete</div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline" disabled={isUploading}>Cancel</Button>
                  </DialogClose>
                  <Button 
                    onClick={uploadFileToFTP} 
                    disabled={!uploadFile || isUploading}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {isUploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={() => loadFiles(currentPath)}
              variant="outline" 
              size="sm" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Refresh
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-2 p-2 bg-muted font-medium text-sm border-b">
              <div className="col-span-1"></div>
              <div 
                className="col-span-5 flex items-center cursor-pointer" 
                onClick={() => toggleSort('name')}
              >
                <span>Name</span>
                {sortField === 'name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                  </span>
                )}
              </div>
              <div 
                className="col-span-2 flex items-center cursor-pointer" 
                onClick={() => toggleSort('size')}
              >
                <span>Size</span>
                {sortField === 'size' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                  </span>
                )}
              </div>
              <div 
                className="col-span-3 flex items-center cursor-pointer" 
                onClick={() => toggleSort('lastModified')}
              >
                <span>Last Modified</span>
                {sortField === 'lastModified' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />}
                  </span>
                )}
              </div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            
            <ScrollArea className="h-[350px]">
              {loading ? (
                <div className="flex justify-center items-center h-[350px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : files.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-[350px] text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mb-2" />
                  <p>No files found in this directory</p>
                </div>
              ) : (
                <div>
                  {sortedFiles.map((file, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2 hover:bg-muted/50 border-b last:border-b-0">
                      <div className="col-span-1 flex items-center">
                        <FileTypeIcon 
                          filename={file.name} 
                          type={file.type} 
                          className="h-5 w-5 text-primary" 
                        />
                      </div>
                      <div className="col-span-5 flex items-center truncate">
                        {file.type === 'directory' ? (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto font-normal justify-start" 
                            onClick={() => navigateToDirectory(file.name)}
                          >
                            {file.name}
                          </Button>
                        ) : (
                          <span className="truncate">{file.name}</span>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center text-sm">
                        {file.type === 'directory' ? (
                          <Badge variant="outline" className="font-normal">Directory</Badge>
                        ) : (
                          formatFileSize(file.size)
                        )}
                      </div>
                      <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                        {formatDate(file.lastModified)}
                      </div>
                      <div className="col-span-1 flex justify-end items-center space-x-1">
                        {file.type === 'file' && (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => previewFileContent(file)}
                                    className="h-8 w-8"
                                  >
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Preview File
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => downloadFile(file)}
                                    className="h-8 w-8"
                                  >
                                    <Download className="h-4 w-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Download File
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setSelectedFile(file)}
                                className="h-8 w-8"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Delete {file.type === 'directory' ? 'Directory' : 'File'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Confirmation Dialog for Delete */}
          <Dialog open={selectedFile !== null} onOpenChange={(open) => !open && setSelectedFile(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-destructive">Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete{' '}
                  <span className="font-medium">
                    {selectedFile?.name}
                  </span>?
                  {selectedFile?.type === 'directory' && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        This will delete the directory and all its contents. This action cannot be undone.
                      </AlertDescription>
                    </Alert>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (selectedFile) {
                      const path = currentPath.endsWith('/') 
                        ? `${currentPath}${selectedFile.name}` 
                        : `${currentPath}/${selectedFile.name}`;
                      deleteFile(path);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete {selectedFile?.type}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* File Preview Dialog */}
          {previewFile && (
            <FTPFilePreview
              filePath={`${currentPath.endsWith('/') ? currentPath : currentPath + '/'}${previewFile.name}`}
              fileName={previewFile.name}
              fileType={previewFile.type}
              isOpen={Boolean(previewFile)}
              onClose={() => setPreviewFile(null)}
              onDownload={() => downloadFile(previewFile)}
            />
          )}
        </CardContent>
        
        <CardFooter className="bg-muted/30 flex items-center justify-between px-6 py-3">
          <div className="text-sm text-muted-foreground">
            <FileType className="h-4 w-4 inline-block mr-1" />
            {files.length} items in directory
          </div>
          
          <div className="text-sm">
            {files.filter(f => f.type === 'directory').length} directories, {files.filter(f => f.type === 'file').length} files
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default FTPManagement;