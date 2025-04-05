import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, FolderPlus, Trash2, FileUp, List } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FileItem {
  name: string;
  type: string;
  size: number;
  modified: string;
  path: string;
}

const FTPManagement: React.FC = () => {
  const { toast } = useToast();
  const [directoryPath, setDirectoryPath] = useState('');
  const [filePath, setFilePath] = useState('');
  const [createParents, setCreateParents] = useState(true);
  const [listPath, setListPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListing, setIsListing] = useState(false);

  const handleCreateDirectory = async () => {
    if (!directoryPath) {
      toast({
        title: 'Error',
        description: 'Directory path is required',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/export/create-directory', {
        method: 'POST',
        body: JSON.stringify({
          path: directoryPath,
          createParents
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `Directory "${directoryPath}" created successfully`,
          variant: 'default'
        });
        setDirectoryPath('');
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to create directory',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating directory:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while creating the directory',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!filePath) {
      toast({
        title: 'Error',
        description: 'File path is required',
        variant: 'destructive'
      });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the file "${filePath}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/api/export/file', {
        method: 'DELETE',
        body: JSON.stringify({
          path: filePath
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        toast({
          title: 'Success',
          description: `File "${filePath}" deleted successfully`,
          variant: 'default'
        });
        setFilePath('');
        
        // If we're listing files and the deleted file is in the current directory,
        // refresh the file list
        if (isListing && filePath.startsWith(listPath)) {
          handleListFiles();
        }
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to delete file',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while deleting the file',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListFiles = async () => {
    setIsListing(true);
    try {
      const response = await apiRequest(`/api/export/list-files?path=${encodeURIComponent(listPath)}`, {
        method: 'GET'
      });

      if (response.success) {
        setFiles(response.files || []);
        toast({
          title: 'Success',
          description: `Listed ${response.files?.length || 0} items in "${listPath}"`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Error',
          description: response.message || 'Failed to list files',
          variant: 'destructive'
        });
        setFiles([]);
      }
    } catch (error) {
      console.error('Error listing files:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while listing files',
        variant: 'destructive'
      });
      setFiles([]);
    } finally {
      setIsListing(false);
    }
  };

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const navigateToDirectory = (path: string) => {
    setListPath(path);
    setFiles([]);
    setTimeout(() => {
      handleListFiles();
    }, 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>FTP File Management</CardTitle>
          <CardDescription>
            Manage files and directories on the FTP server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create Directory Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Create Directory</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="directoryPath">Directory Path</Label>
                <Input
                  id="directoryPath"
                  placeholder="/path/to/new/directory"
                  value={directoryPath}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDirectoryPath(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createParents"
                  checked={createParents}
                  onCheckedChange={(checked: boolean | "indeterminate") => setCreateParents(checked === true)}
                />
                <Label
                  htmlFor="createParents"
                  className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Create parent directories if they don't exist
                </Label>
              </div>
              <Button
                onClick={handleCreateDirectory}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Create Directory
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Delete File Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Delete File</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="filePath">File Path</Label>
                <Input
                  id="filePath"
                  placeholder="/path/to/file.txt"
                  value={filePath}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilePath(e.target.value)}
                />
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteFile}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete File
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* List Files Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">List Files</h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="listPath">Path</Label>
                <Input
                  id="listPath"
                  placeholder="/"
                  value={listPath}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setListPath(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={handleListFiles}
                disabled={isListing}
              >
                {isListing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listing...
                  </>
                ) : (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    List Files
                  </>
                )}
              </Button>
            </div>

            {files.length > 0 && (
              <div className="border rounded-md mt-4">
                <div className="grid grid-cols-4 gap-4 p-4 font-medium text-sm border-b">
                  <div>Name</div>
                  <div>Type</div>
                  <div>Size</div>
                  <div>Modified</div>
                </div>
                <div className="divide-y">
                  {files.map((file, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 p-4 text-sm">
                      <div className="flex items-center">
                        {file.type === 'directory' ? (
                          <button
                            className="text-blue-600 hover:underline flex items-center"
                            onClick={() => navigateToDirectory(file.path)}
                          >
                            <FolderPlus className="mr-2 h-4 w-4" />
                            {file.name}
                          </button>
                        ) : (
                          <div className="flex items-center">
                            <FileUp className="mr-2 h-4 w-4" />
                            {file.name}
                          </div>
                        )}
                      </div>
                      <div>{file.type}</div>
                      <div>{file.type === 'file' ? formatFileSize(file.size) : '-'}</div>
                      <div>{file.modified ? new Date(file.modified).toLocaleString() : '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FTPManagement;