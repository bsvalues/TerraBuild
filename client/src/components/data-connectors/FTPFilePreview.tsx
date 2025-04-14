import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertCircle, Download, File, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FTPFilePreviewProps {
  connectionId: number;
  filePath: string;
  filename: string;
  fileType?: string;
  onDownload?: () => void;
}

const FTPFilePreview: React.FC<FTPFilePreviewProps> = ({
  connectionId,
  filePath,
  filename,
  fileType,
  onDownload
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('preview');
  const { toast } = useToast();

  const getFileTypeFromName = (name: string): string => {
    const extension = name.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'svg':
        return 'image';
      case 'txt':
      case 'log':
      case 'md':
      case 'csv':
        return 'text';
      case 'json':
        return 'json';
      case 'xml':
        return 'xml';
      case 'html':
      case 'htm':
        return 'html';
      case 'pdf':
        return 'pdf';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'doc':
      case 'docx':
        return 'word';
      default:
        return 'binary';
    }
  };

  const determinedFileType = fileType || getFileTypeFromName(filename);

  const fetchFilePreview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/data-connectors/ftp/preview`, {
        params: {
          connectionId,
          path: filePath,
          filename
        }
      });

      setFileContent(response.data.content);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch file preview');
      setLoading(false);
    }
  };

  const downloadFile = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/api/data-connectors/ftp/download`, {
        params: {
          connectionId,
          path: filePath,
          filename
        },
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Download Complete",
        description: `File "${filename}" has been downloaded successfully.`
      });
      
      if (onDownload) {
        onDownload();
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to download file');
      setLoading(false);
      
      toast({
        title: "Download Error",
        description: `Failed to download "${filename}". ${err.response?.data?.error || err.message || ''}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (determinedFileType === 'text' || determinedFileType === 'json' || determinedFileType === 'xml' || determinedFileType === 'html') {
      fetchFilePreview();
    }
  }, [connectionId, filePath, filename, determinedFileType]);

  const renderFilePreview = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-60">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (!fileContent && (determinedFileType === 'text' || determinedFileType === 'json' || determinedFileType === 'xml' || determinedFileType === 'html')) {
      return (
        <div className="flex flex-col justify-center items-center h-60">
          <File className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">File preview not available</p>
          <Button variant="outline" className="mt-4" onClick={fetchFilePreview}>
            Retry Preview
          </Button>
        </div>
      );
    }

    switch (determinedFileType) {
      case 'image':
        return (
          <div className="flex justify-center items-center p-4">
            <img 
              src={`/api/data-connectors/ftp/preview?connectionId=${connectionId}&path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(filename)}&raw=true`} 
              alt={filename}
              className="max-w-full max-h-[500px] object-contain"
            />
          </div>
        );
      case 'text':
        return (
          <ScrollArea className="h-[400px] w-full border rounded-md bg-muted/20 p-4">
            <pre className="text-sm">{fileContent}</pre>
          </ScrollArea>
        );
      case 'json':
        try {
          const jsonContent = fileContent ? JSON.parse(fileContent) : null;
          return (
            <ScrollArea className="h-[400px] w-full border rounded-md bg-muted/20 p-4">
              <pre className="text-sm">{JSON.stringify(jsonContent, null, 2)}</pre>
            </ScrollArea>
          );
        } catch (e) {
          return (
            <ScrollArea className="h-[400px] w-full border rounded-md bg-muted/20 p-4">
              <pre className="text-sm">{fileContent}</pre>
            </ScrollArea>
          );
        }
      case 'xml':
      case 'html':
        return (
          <ScrollArea className="h-[400px] w-full border rounded-md bg-muted/20 p-4">
            <pre className="text-sm">{fileContent}</pre>
          </ScrollArea>
        );
      case 'pdf':
        return (
          <div className="flex flex-col justify-center items-center h-60">
            <File className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">PDF preview not available</p>
            <p className="text-sm text-muted-foreground mb-4">Download the file to view its contents</p>
          </div>
        );
      case 'excel':
      case 'word':
      default:
        return (
          <div className="flex flex-col justify-center items-center h-60">
            <File className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">{determinedFileType.toUpperCase()} file</p>
            <p className="text-sm text-muted-foreground mb-4">Preview not available for this file type</p>
          </div>
        );
    }
  };

  const renderFileDetails = () => {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">File Name:</p>
            <p className="text-sm text-muted-foreground">{filename}</p>
          </div>
          <div>
            <p className="text-sm font-medium">File Type:</p>
            <p className="text-sm text-muted-foreground">{determinedFileType.toUpperCase()}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Location:</p>
            <p className="text-sm text-muted-foreground">{filePath}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Connection ID:</p>
            <p className="text-sm text-muted-foreground">{connectionId}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <File className="mr-2 h-5 w-5" />
          {filename}
        </CardTitle>
        <CardDescription>
          File preview from FTP connection
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="preview" value={activeView} onValueChange={setActiveView}>
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-5">
            <TabsTrigger value="preview" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Preview
            </TabsTrigger>
            <TabsTrigger value="details" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              Details
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="pt-4">
            {renderFilePreview()}
          </TabsContent>
          <TabsContent value="details">
            {renderFileDetails()}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between pt-6 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (activeView === 'preview') {
              fetchFilePreview();
            }
          }}
          disabled={loading || activeView !== 'preview'}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </>
          )}
        </Button>
        <Button 
          size="sm"
          onClick={downloadFile} 
          disabled={loading}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> Download
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FTPFilePreview;