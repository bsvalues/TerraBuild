import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Download, FileText, Image as ImageIcon, File, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

interface FTPFilePreviewProps {
  filePath: string;
  fileName: string;
  fileType: 'file' | 'directory';
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const FTPFilePreview: React.FC<FTPFilePreviewProps> = ({
  filePath,
  fileName,
  fileType,
  isOpen,
  onClose,
  onDownload
}) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('preview');
  
  // Determine file extension
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Check if the file is an image
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension);
  
  // Check if the file is text-based
  const isText = ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'md', 'log', 'sql', 'py', 'java', 'c', 'cpp', 'h', 'ini', 'cfg', 'conf'].includes(extension);
  
  // Check if the file is a known binary format
  const isBinary = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'tar', 'gz', 'exe', 'dll', 'so', 'bin'].includes(extension);
  
  useEffect(() => {
    if (!isOpen || !filePath || fileType !== 'file') return;
    
    setLoading(true);
    setError(null);
    
    const fetchFileContent = async () => {
      try {
        // Fetch file content from server
        const response = await apiRequest(`/api/ftp/preview?path=${encodeURIComponent(filePath)}`);
        
        if (response.success) {
          setContent(response.content);
        } else {
          setError(response.message || 'Failed to load file content');
        }
      } catch (err) {
        setError('Error loading file content. The file might be too large or in an unsupported format.');
        console.error('Error loading file preview:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileContent();
  }, [isOpen, filePath, fileType]);
  
  const renderFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5 mr-2" />;
    if (isText) return <FileText className="h-5 w-5 mr-2" />;
    return <File className="h-5 w-5 mr-2" />;
  };
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">Loading file content...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    if (isImage && content) {
      // For images, we'll use base64 data
      return (
        <div className="flex justify-center p-4 bg-muted/30 rounded-md">
          <img 
            src={`data:image/${extension};base64,${content}`}
            alt={fileName}
            className="max-w-full max-h-[500px] object-contain"
          />
        </div>
      );
    }
    
    if (isText && content) {
      // For text files, show the content in a pre tag
      return (
        <ScrollArea className="h-[500px] border rounded-md p-4 bg-muted/30 text-sm font-mono">
          <pre className="whitespace-pre-wrap break-words">{content}</pre>
        </ScrollArea>
      );
    }
    
    if (isBinary) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 rounded-md p-6 text-center">
          <File className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Binary File</p>
          <p className="text-sm text-muted-foreground mb-4">
            This file type cannot be previewed directly. Please download the file to view its contents.
          </p>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download File
          </Button>
        </div>
      );
    }
    
    // For unknown file types
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-muted/20 rounded-md p-6 text-center">
        <File className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Unsupported File Type</p>
        <p className="text-sm text-muted-foreground mb-4">
          Preview is not available for this file type. Please download the file to view its contents.
        </p>
        <Button onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {renderFileIcon()}
            {fileName}
          </DialogTitle>
          <DialogDescription>
            Path: {filePath}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="preview" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="info">File Info</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="py-2">
            {renderContent()}
          </TabsContent>
          
          <TabsContent value="info" className="py-2">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 p-4 rounded-md bg-muted/20">
                <div className="font-semibold">File Name</div>
                <div className="col-span-2">{fileName}</div>
                
                <div className="font-semibold">Path</div>
                <div className="col-span-2 break-all">{filePath}</div>
                
                <div className="font-semibold">Type</div>
                <div className="col-span-2">
                  {isImage && 'Image File'}
                  {isText && 'Text File'}
                  {isBinary && 'Binary File'}
                  {!isImage && !isText && !isBinary && 'Unknown'}
                </div>
                
                <div className="font-semibold">Extension</div>
                <div className="col-span-2">.{extension}</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex justify-between items-center pt-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={onDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FTPFilePreview;