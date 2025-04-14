import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, PlayCircle, AlertCircle, CheckCircle, PauseCircle, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@shared/schema';
import { useFileUploads } from '@/hooks/use-file-uploads';
import FileUploader from '../common/FileUploader';

// Status badge colors
const statusColors: Record<string, string> = {
  uploaded: 'bg-blue-500 hover:bg-blue-600',
  processing: 'bg-yellow-500 hover:bg-yellow-600',
  completed: 'bg-green-600 hover:bg-green-700',
  error: 'bg-red-500 hover:bg-red-600',
  validating: 'bg-purple-500 hover:bg-purple-600',
  waiting: 'bg-gray-500 hover:bg-gray-600',
};

interface BatchImportHandlerProps {
  title?: string;
  description?: string;
}

const BatchImportHandler: React.FC<BatchImportHandlerProps> = ({
  title = 'Matrix Import',
  description = 'Upload and process cost matrix Excel files',
}) => {
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const { getAll, importExcel } = useFileUploads();
  const { data: fileUploads = [], isLoading, refetch } = getAll;
  
  const handleFileUploadComplete = (fileId: number) => {
    // Refresh the file list
    refetch();
    
    // Select the newly uploaded file
    const newFile = fileUploads.find(file => file.id === fileId);
    if (newFile) {
      setSelectedFile(newFile);
    }
  };
  
  const handleImport = async (fileId: number) => {
    try {
      await importExcel.mutateAsync(fileId);
      // Refresh the list after import
      refetch();
    } catch (error) {
      console.error("Import failed:", error);
    }
  };
  
  // Sort files by most recent first
  const sortedFiles = [...(fileUploads || [])].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploader 
            title="Upload Excel File" 
            description="Drag and drop your Excel cost matrix file here or click to browse."
            buttonText="Upload Excel File"
            onUploadComplete={handleFileUploadComplete}
          />
        </CardContent>
      </Card>
      
      {selectedFile && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Selected File</CardTitle>
              <Badge className={statusColors[selectedFile.status] || 'bg-gray-500'}>
                {selectedFile.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <FileSpreadsheet className="h-8 w-8 mr-3 text-blue-500" />
              <div>
                <h3 className="font-medium">{selectedFile.filename}</h3>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(selectedFile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {selectedFile.status === 'processing' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>
                    {selectedFile.processedItems} / {selectedFile.totalItems || '?'} items
                  </span>
                </div>
                <Progress 
                  value={selectedFile.totalItems ? (selectedFile.processedItems / selectedFile.totalItems) * 100 : 50} 
                  className="h-2"
                />
              </div>
            )}
            
            {selectedFile.status === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Import Failed</AlertTitle>
                <AlertDescription>
                  {selectedFile.errorCount} errors occurred during processing.
                </AlertDescription>
              </Alert>
            )}
            
            {selectedFile.status === 'completed' && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Import Complete</AlertTitle>
                <AlertDescription>
                  Successfully processed {selectedFile.processedItems} items.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex gap-2">
            {selectedFile.status === 'uploaded' && (
              <Button 
                onClick={() => handleImport(selectedFile.id)}
                disabled={importExcel.isPending}
                className="w-full"
              >
                {importExcel.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Import
                  </>
                )}
              </Button>
            )}
            
            {selectedFile.status === 'processing' && (
              <Button variant="outline" className="w-full" disabled>
                <PauseCircle className="mr-2 h-4 w-4" />
                Processing...
              </Button>
            )}
            
            {(selectedFile.status === 'completed' || selectedFile.status === 'error') && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleImport(selectedFile.id)}
                disabled={importExcel.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reimport
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-4 text-center text-muted-foreground">Loading...</div>
          ) : sortedFiles.length === 0 ? (
            <div className="py-4 text-center text-muted-foreground">No files uploaded yet</div>
          ) : (
            <div className="space-y-2">
              {sortedFiles.slice(0, 5).map((file) => (
                <div 
                  key={file.id}
                  className={`p-3 rounded-md border flex justify-between items-center cursor-pointer hover:bg-muted ${
                    selectedFile?.id === file.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColors[file.status] || 'bg-gray-500'}>
                    {file.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {fileUploads && fileUploads.length > 5 && (
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All ({fileUploads.length})
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default BatchImportHandler;