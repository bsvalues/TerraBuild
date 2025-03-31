import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileIcon, XIcon, UploadCloudIcon, CheckCircleIcon, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImportResults from './ImportResults';
import { apiRequest } from '@/lib/queryClient';

const BatchImportHandler: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [options, setOptions] = useState({
    detectDuplicates: true,
    standardizeData: true,
    useTransaction: true
  });
  const [importResults, setImportResults] = useState<any>(null);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const { toast } = useToast();
  
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 10,
    onDrop: (acceptedFiles) => {
      // Add only files that don't already exist in the files array
      const newFiles = acceptedFiles.filter(
        newFile => !files.some(f => f.name === newFile.name && f.size === newFile.size)
      );
      
      setFiles([...files, ...newFiles]);
    }
  });
  
  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const clearFiles = () => {
    setFiles([]);
  };
  
  const validateFiles = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one Excel file to validate.',
        variant: 'destructive'
      });
      return;
    }
    
    setValidationResults([]);
    setShowValidationDialog(true);
    let validationResults = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('strictMode', options.standardizeData ? 'false' : 'true');
      
      try {
        const result = await apiRequest({
          url: '/api/matrix/validate',
          method: 'POST',
          body: formData
        });
        
        validationResults.push({
          fileName: file.name,
          ...result
        });
      } catch (error) {
        validationResults.push({
          fileName: file.name,
          success: false,
          errors: ['Failed to validate file']
        });
      }
    }
    
    setValidationResults(validationResults);
  };
  
  const startImport = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one Excel file to import.',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if all files have been validated and passed
    if (validationResults.length < files.length || validationResults.some(r => !r.success)) {
      toast({
        title: 'Validation required',
        description: 'Please validate all files before importing.',
        variant: 'destructive'
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setImportResults(null);
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Add options
      formData.append('detectDuplicates', options.detectDuplicates.toString());
      formData.append('standardizeData', options.standardizeData.toString());
      formData.append('useTransaction', options.useTransaction.toString());
      
      const result = await apiRequest({
        url: '/api/matrix/batch-import',
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setImportResults(result);
      
      toast({
        title: 'Import complete',
        description: `Processed ${result.processed} files successfully`,
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Import failed',
        description: error.message || 'Failed to import files',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };
  
  const closeResultsAndReset = () => {
    setImportResults(null);
    setFiles([]);
    setValidationResults([]);
  };
  
  return (
    <>
      {importResults ? (
        <ImportResults results={importResults} onClose={closeResultsAndReset} />
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Batch Cost Matrix Import</CardTitle>
            <CardDescription>
              Upload multiple cost matrix Excel files for batch processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg border border-dashed flex flex-col items-center justify-center cursor-pointer" {...getRootProps()}>
                <input {...getInputProps()} />
                <UploadCloudIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop Excel files here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xls and .xlsx files (max 10 files)
                </p>
              </div>
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between mb-2">
                    <h3 className="text-sm font-medium">Selected Files ({files.length})</h3>
                    <Button variant="outline" size="sm" onClick={clearFiles}>Clear All</Button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 border-b last:border-b-0"
                      >
                        <div className="flex items-center">
                          <FileIcon className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[250px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {validationResults[index] && (
                            <div className="mr-2">
                              {validationResults[index].success ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <XIcon className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeFile(index)}
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-3 pt-3 border-t">
                <h3 className="text-sm font-medium">Import Options</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="detectDuplicates">Detect Duplicates</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip importing duplicate files
                    </p>
                  </div>
                  <Switch
                    id="detectDuplicates"
                    checked={options.detectDuplicates}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, detectDuplicates: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="standardizeData">Standardize Data</Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically normalize and correct data formats
                    </p>
                  </div>
                  <Switch
                    id="standardizeData"
                    checked={options.standardizeData}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, standardizeData: checked }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useTransaction">Use Transaction</Label>
                    <p className="text-xs text-muted-foreground">
                      All files must import successfully or none will be imported
                    </p>
                  </div>
                  <Switch
                    id="useTransaction"
                    checked={options.useTransaction}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, useTransaction: checked }))
                    }
                  />
                </div>
              </div>
            </div>
            
            {uploading && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading and processing files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={validateFiles}
              disabled={files.length === 0 || uploading}
            >
              Validate Files
            </Button>
            <Button
              onClick={startImport}
              disabled={files.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Start Import'
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File Validation Results</DialogTitle>
            <DialogDescription>
              Validation results for the selected Excel files
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            {validationResults.length > 0 ? (
              <div className="space-y-4">
                {validationResults.map((result, index) => (
                  <Card key={index} className={`${result.success ? 'border-green-200' : 'border-red-200'}`}>
                    <CardHeader className="py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center">
                          <FileIcon className="h-4 w-4 mr-2" />
                          {result.fileName}
                        </CardTitle>
                        {result.success ? (
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">Valid</div>
                        ) : (
                          <div className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">Invalid</div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      {result.success ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium">Detected Year:</span> {result.year || 'Unknown'}
                            </div>
                            <div>
                              <span className="font-medium">Sheets:</span> {result.sheets?.join(', ') || 'None'}
                            </div>
                          </div>
                          
                          {result.detectedTypes?.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Building Types:</span> {result.detectedTypes.join(', ')}
                            </div>
                          )}
                          
                          {result.detectedRegions?.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Regions:</span> {result.detectedRegions.join(', ')}
                            </div>
                          )}
                          
                          {result.warnings?.length > 0 && (
                            <div className="text-sm mt-2">
                              <span className="font-medium text-amber-600">Warnings ({result.warnings.length}):</span>
                              <ul className="list-disc pl-5 text-amber-600">
                                {result.warnings.map((warning: string, i: number) => (
                                  <li key={i} className="text-xs">{warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-red-600">
                            <span className="font-medium">Errors:</span>
                            <ul className="list-disc pl-5">
                              {result.errors?.map((error: string, i: number) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                Validating files...
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>Close</Button>
            <Button 
              disabled={validationResults.some(r => !r.success)}
              onClick={() => {
                setShowValidationDialog(false);
                startImport();
              }}
            >
              Proceed to Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BatchImportHandler;