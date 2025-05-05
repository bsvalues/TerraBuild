import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  FileUp,
  RefreshCw,
  ChevronDown,
  X,
  Info
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MatrixUploadInterfaceProps {
  onMatrixUploaded?: (matrixId: string) => void;
  className?: string;
}

/**
 * MatrixUploadInterface Component
 * 
 * This component provides a user interface for uploading and processing
 * cost matrix files through the MCP (Model Content Protocol) framework.
 */
export default function MatrixUploadInterface({ 
  onMatrixUploaded,
  className
}: MatrixUploadInterfaceProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for file selection and upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedMatrixId, setUploadedMatrixId] = useState<string | null>(null);
  
  // State for agent feedback
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [agentFeedback, setAgentFeedback] = useState<Array<{agent: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}>>([]);
  
  // When user selects a file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadStatus('idle');
      setUploadProgress(0);
      setAgentFeedback([]);
    }
  };
  
  // Trigger file dialog
  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAgentFeedback([]);
  };
  
  // Handle dropping files
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadStatus('idle');
      setUploadProgress(0);
    }
  };
  
  // Prevent default for drag events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };
  
  // Process the uploaded file
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // Start upload process
    setUploadStatus('uploading');
    setUploadProgress(0);
    setAgentFeedback([]);
    
    // Create a unique ID for this upload
    const uploadId = `matrix_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(uploadInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);
      
      // Simulate network delay for file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear upload interval and set to 100%
      clearInterval(uploadInterval);
      setUploadProgress(100);
      
      // Move to processing state
      setUploadStatus('processing');
      addAgentFeedback('inquisitorAgent', 'Starting matrix analysis...', 'info');
      
      // Simulate agent processing
      setTimeout(() => {
        addAgentFeedback('inquisitorAgent', 'Matrix file structure verified', 'success');
      }, 1200);
      
      setTimeout(() => {
        addAgentFeedback('interpreterAgent', 'Parsing cost data from matrix', 'info');
      }, 2500);
      
      setTimeout(() => {
        addAgentFeedback('interpreterAgent', 'Identified 145 building cost entries', 'success');
      }, 3800);
      
      setTimeout(() => {
        addAgentFeedback('visualizerAgent', 'Generating data visualizations', 'info');
      }, 5000);
      
      setTimeout(() => {
        // Complete the process
        setUploadStatus('success');
        setUploadedMatrixId(uploadId);
        
        addAgentFeedback('visualizerAgent', 'Visualizations and matrix schema complete', 'success');
        
        // Call the onMatrixUploaded callback if provided
        if (onMatrixUploaded) {
          onMatrixUploaded(uploadId);
        }
        
        toast({
          title: "Upload Successful",
          description: "Matrix file has been processed successfully",
        });
      }, 6500);
      
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus('error');
      addAgentFeedback('inquisitorAgent', 'Error processing matrix file', 'error');
      toast({
        title: "Upload Failed",
        description: "There was an error processing your file",
        variant: "destructive",
      });
    }
  };
  
  // Add agent feedback message
  const addAgentFeedback = (agent: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setAgentFeedback(prev => [...prev, { agent, message, type }]);
  };
  
  // Determine if the upload button should be disabled
  const isUploadDisabled = !selectedFile || uploadStatus === 'uploading' || uploadStatus === 'processing';
  
  // Render status badge
  const renderStatusBadge = () => {
    switch (uploadStatus) {
      case 'uploading':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Uploading</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Processing</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Completed</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Failed</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".xlsx,.xls,.csv"
      />
      
      {/* File drop area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          border-2 border-dashed rounded-lg p-6 transition-all
          ${selectedFile ? 'border-muted-foreground/20' : 'border-muted-foreground/50'}
          ${selectedFile ? 'bg-muted/40' : 'hover:bg-muted/20 cursor-pointer'}
        `}
        onClick={selectedFile ? undefined : handleSelectFileClick}
      >
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center py-4">
            <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-lg font-medium">Drop your matrix file here</p>
            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
            <p className="text-xs text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV files</p>
          </div>
        ) : (
          <div className="py-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FileText className="h-6 w-6 mr-2 text-muted-foreground" />
                <div>
                  <p className="font-medium truncate max-w-[260px]">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                {renderStatusBadge()}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress indicator */}
            {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>{uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            {/* Success message */}
            {uploadStatus === 'success' && (
              <Alert className="mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Upload Successful</AlertTitle>
                <AlertDescription>
                  Matrix file has been processed and is ready for use.
                  {uploadedMatrixId && (
                    <p className="text-xs mt-1">
                      Matrix ID: <code className="bg-muted-foreground/10 px-1 py-0.5 rounded">{uploadedMatrixId}</code>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Error message */}
            {uploadStatus === 'error' && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>
                  There was an error processing your file. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Agent feedback */}
            {agentFeedback.length > 0 && (
              <Collapsible open={showAgentDetails} onOpenChange={setShowAgentDetails} className="mb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex w-full justify-between p-2 text-sm">
                    <span>Agent Activity Log</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showAgentDetails ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-muted/30 rounded-md p-3 mt-2 max-h-36 overflow-y-auto text-sm">
                    {agentFeedback.map((feedback, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <div className="flex items-center">
                          {feedback.type === 'info' && <Info className="h-3 w-3 text-blue-500 mr-1" />}
                          {feedback.type === 'success' && <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />}
                          {feedback.type === 'warning' && <AlertCircle className="h-3 w-3 text-yellow-500 mr-1" />}
                          {feedback.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mr-1" />}
                          <span className="font-medium text-xs mr-2">{feedback.agent}:</span>
                          <span className="text-xs text-muted-foreground">{feedback.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4">
              {uploadStatus !== 'success' ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  disabled={isUploadDisabled}
                >
                  {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload &amp; Process
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile();
                  }}
                  variant="outline"
                >
                  Upload Another
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}