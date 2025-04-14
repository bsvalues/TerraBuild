import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { FileIcon, XIcon, UploadCloudIcon, AlertCircleIcon, CheckCircleIcon } from 'lucide-react';
import { useFileUploads } from '@/hooks/use-file-uploads';

interface FileUploaderProps {
  title?: string;
  description?: string;
  acceptedFileTypes?: Record<string, string[]>;
  maxFiles?: number;
  onUploadComplete?: (fileId: number) => void;
  allowMultiple?: boolean;
  buttonText?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  title = 'Upload File',
  description = 'Drag & drop your file here, or click to browse',
  acceptedFileTypes = {
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
  },
  maxFiles = 1,
  onUploadComplete,
  allowMultiple = false,
  buttonText = 'Upload'
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  
  const { create } = useFileUploads();
  
  // Reset progress when file changes
  useEffect(() => {
    setUploadProgress(0);
    setError(null);
    setUploadedFileId(null);
  }, [file]);
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: acceptedFileTypes,
    maxFiles,
    multiple: allowMultiple,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
    onDropRejected: (rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        setError(error.message);
        toast({
          title: 'Invalid file',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  });
  
  const clearFile = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadedFileId(null);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }
    
    setUploading(true);
    setUploadProgress(10);
    setError(null);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the API to upload the file
      const response = await fetch('/api/file-uploads/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      // Simulate progress
      setUploadProgress(50);
      
      // Get the file ID from response
      const data = await response.json();
      
      // Create a file upload record
      await create.mutateAsync({
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        status: 'uploaded',
        processedItems: 0,
        totalItems: null,
        errorCount: 0,
        errors: [],
        uploadedBy: 1  // Default to admin user id=1
      });
      
      setUploadProgress(100);
      setUploadedFileId(data.fileId);
      
      toast({
        title: 'Upload successful',
        description: 'Your file has been uploaded.',
      });
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(data.fileId);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to upload file');
      setUploadProgress(0);
      
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {!file ? (
        <div 
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors"
          {...getRootProps()}
        >
          <input {...getInputProps()} />
          <UploadCloudIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {description}
          </p>
          {error && (
            <div className="flex items-center mt-4 text-red-500 text-sm">
              <AlertCircleIcon className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileIcon className="h-8 w-8 mr-3 text-blue-500" />
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            
            {uploadProgress > 0 && (
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{uploading ? 'Uploading...' : 'Upload complete'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {uploadedFileId !== null && (
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">File uploaded successfully</span>
              </div>
            )}
          </div>
          
          {!uploadedFileId && (
            <Button 
              onClick={handleUpload} 
              disabled={uploading || !file}
              className="w-full"
            >
              {buttonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;