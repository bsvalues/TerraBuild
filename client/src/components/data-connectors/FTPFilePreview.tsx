import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Download, 
  FileText, 
  FileImage, 
  File as FileIcon,
  X 
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FTPFilePreviewProps {
  filePath: string;
  fileName: string;
  fileType: string;
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
  onDownload,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("preview");

  // Determine if file is previewable based on extension
  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const extension = getFileExtension(fileName);
  
  // List of extensions we can preview
  const textExtensions = ['txt', 'csv', 'json', 'xml', 'html', 'css', 'js', 'ts', 'md', 'log'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
  
  const isTextFile = textExtensions.includes(extension);
  const isImageFile = imageExtensions.includes(extension);
  const isPreviewable = isTextFile || isImageFile;

  useEffect(() => {
    if (isOpen && isPreviewable) {
      loadPreview();
    }
  }, [isOpen, filePath]);

  const loadPreview = async () => {
    if (!isPreviewable) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the file content
      const response = await fetch(`/api/data-connections/ftp/preview?path=${encodeURIComponent(filePath)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to load file preview');
      }
      
      if (isImageFile) {
        // For images, we'll use a data URL
        const blob = await response.blob();
        const dataUrl = URL.createObjectURL(blob);
        setPreview(dataUrl);
      } else {
        // For text files, we'll use the text content
        const text = await response.text();
        setPreview(text);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading preview');
      console.error("Preview error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImageFile ? (
              <FileImage className="h-5 w-5 text-primary" />
            ) : isTextFile ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <FileIcon className="h-5 w-5 text-primary" />
            )}
            File Preview: {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isPreviewable ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="border rounded-md h-[60vh] overflow-auto p-2">
                {loading ? (
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    {isImageFile && preview && (
                      <div className="flex justify-center overflow-auto">
                        <img 
                          src={preview} 
                          alt={fileName} 
                          className="max-w-full object-contain"
                        />
                      </div>
                    )}
                    
                    {isTextFile && preview && (
                      <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
                        {preview}
                      </pre>
                    )}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="details" className="h-[60vh] overflow-auto">
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-medium">File Name:</span>
                    <span className="col-span-2">{fileName}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-medium">File Path:</span>
                    <span className="col-span-2 break-all">{filePath}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-medium">File Type:</span>
                    <span className="col-span-2">{fileType || 'Unknown'}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 border-b pb-2">
                    <span className="font-medium">Extension:</span>
                    <span className="col-span-2">{extension || 'None'}</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
              <FileIcon className="h-16 w-16 text-muted-foreground" />
              <p className="text-xl font-medium text-muted-foreground">
                Preview not available for this file type
              </p>
              <p className="text-sm text-muted-foreground">
                Files with the extension ".{extension}" cannot be previewed. Please download the file to view its contents.
              </p>
              <Button onClick={onDownload} className="mt-4">
                <Download className="h-4 w-4 mr-2" /> Download File
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center mt-4 sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {isPreviewable ? "Preview mode may not display all file features correctly." : ""}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" /> Close
            </Button>
            <Button onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FTPFilePreview;