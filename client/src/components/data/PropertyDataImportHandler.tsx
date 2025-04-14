import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@shared/schema';
import { useFileUploads } from '@/hooks/use-file-uploads';
import FileUploader from '../common/FileUploader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// Status badge colors
const statusColors: Record<string, string> = {
  uploaded: 'bg-blue-500 hover:bg-blue-600',
  processing: 'bg-yellow-500 hover:bg-yellow-600',
  completed: 'bg-green-600 hover:bg-green-700',
  error: 'bg-red-500 hover:bg-red-600',
  validating: 'bg-purple-500 hover:bg-purple-600',
  waiting: 'bg-gray-500 hover:bg-gray-600',
};

interface PropertyDataImportHandlerProps {
  title?: string;
  description?: string;
}

/**
 * PropertyDataImportHandler Component
 * 
 * Handles the upload and import of property data CSV files
 */
const PropertyDataImportHandler: React.FC<PropertyDataImportHandlerProps> = ({
  title = 'Property Data Import',
  description = 'Upload and process property data CSV files',
}) => {
  const [selectedFiles, setSelectedFiles] = useState<{
    improvementsFile?: FileUpload;
    improvementDetailsFile?: FileUpload;
    improvementItemsFile?: FileUpload;
    landDetailsFile?: FileUpload;
    propertiesFile?: FileUpload;
  }>({});
  
  const [batchSize, setBatchSize] = useState<number>(100);
  const { getAll, importPropertyData } = useFileUploads();
  const { data: fileUploads = [], isLoading, refetch } = getAll;
  
  // Filter CSV files only
  const csvFiles = (fileUploads || []).filter(file => 
    file.filename.toLowerCase().endsWith('.csv')
  );
  
  // Sort files by most recent first
  const sortedFiles = [...csvFiles].sort((a, b) => {
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
  
  const handleFileUploadComplete = (fileId: number) => {
    // Refresh the file list
    refetch();
  };
  
  const handleImport = async () => {
    // Validate required files
    if (!selectedFiles.improvementsFile ||
        !selectedFiles.improvementDetailsFile ||
        !selectedFiles.improvementItemsFile ||
        !selectedFiles.landDetailsFile) {
      toast({
        title: 'Missing files',
        description: 'Please select all required CSV files for property data import',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await importPropertyData.mutateAsync({
        improvementsFile: selectedFiles.improvementsFile.id,
        improvementDetailsFile: selectedFiles.improvementDetailsFile.id,
        improvementItemsFile: selectedFiles.improvementItemsFile.id,
        landDetailsFile: selectedFiles.landDetailsFile.id,
        propertiesFile: selectedFiles.propertiesFile?.id,
        batchSize
      });
      
      // Reset selection after successful import
      setSelectedFiles({});
      
      // Refresh the list after import
      refetch();
    } catch (error) {
      console.error("Import failed:", error);
    }
  };
  
  const isReadyForImport = 
    selectedFiles.improvementsFile &&
    selectedFiles.improvementDetailsFile &&
    selectedFiles.improvementItemsFile &&
    selectedFiles.landDetailsFile;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Tabs defaultValue="upload">
              <TabsList className="mb-4">
                <TabsTrigger value="upload">Upload Files</TabsTrigger>
                <TabsTrigger value="select">Select & Import</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <FileUploader 
                  title="Upload CSV File" 
                  description="Drag and drop your property data CSV file here or click to browse"
                  acceptedFileTypes={{
                    'text/csv': ['.csv'],
                    'application/vnd.ms-excel': ['.csv']
                  }}
                  buttonText="Upload CSV File"
                  onUploadComplete={handleFileUploadComplete}
                />
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Required Files</AlertTitle>
                  <AlertDescription>
                    Property data import requires the following CSV files:
                    <ul className="list-disc pl-5 mt-2">
                      <li>Improvements (imprv.csv)</li>
                      <li>Improvement Details (imprv_detail.csv)</li>
                      <li>Improvement Items (imprv_items.csv)</li>
                      <li>Land Details (land_detail.csv)</li>
                      <li>Properties (optional)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </TabsContent>
              
              <TabsContent value="select" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="improvements-file">Improvements File</Label>
                    <Select 
                      value={selectedFiles.improvementsFile?.id.toString() || ''}
                      onValueChange={(value) => {
                        const file = sortedFiles.find(f => f.id.toString() === value);
                        setSelectedFiles(prev => ({ ...prev, improvementsFile: file }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select improvements file" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedFiles.map(file => (
                          <SelectItem key={`improvements-${file.id}`} value={file.id.toString()}>
                            {file.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="improvement-details-file">Improvement Details File</Label>
                    <Select 
                      value={selectedFiles.improvementDetailsFile?.id.toString() || ''}
                      onValueChange={(value) => {
                        const file = sortedFiles.find(f => f.id.toString() === value);
                        setSelectedFiles(prev => ({ ...prev, improvementDetailsFile: file }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select improvement details file" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedFiles.map(file => (
                          <SelectItem key={`details-${file.id}`} value={file.id.toString()}>
                            {file.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="improvement-items-file">Improvement Items File</Label>
                    <Select 
                      value={selectedFiles.improvementItemsFile?.id.toString() || ''}
                      onValueChange={(value) => {
                        const file = sortedFiles.find(f => f.id.toString() === value);
                        setSelectedFiles(prev => ({ ...prev, improvementItemsFile: file }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select improvement items file" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedFiles.map(file => (
                          <SelectItem key={`items-${file.id}`} value={file.id.toString()}>
                            {file.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="land-details-file">Land Details File</Label>
                    <Select 
                      value={selectedFiles.landDetailsFile?.id.toString() || ''}
                      onValueChange={(value) => {
                        const file = sortedFiles.find(f => f.id.toString() === value);
                        setSelectedFiles(prev => ({ ...prev, landDetailsFile: file }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select land details file" />
                      </SelectTrigger>
                      <SelectContent>
                        {sortedFiles.map(file => (
                          <SelectItem key={`land-${file.id}`} value={file.id.toString()}>
                            {file.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="properties-file">Properties File (Optional)</Label>
                    <Select 
                      value={selectedFiles.propertiesFile?.id.toString() || ''}
                      onValueChange={(value) => {
                        const file = sortedFiles.find(f => f.id.toString() === value);
                        setSelectedFiles(prev => ({ ...prev, propertiesFile: file }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select properties file (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {sortedFiles.map(file => (
                          <SelectItem key={`properties-${file.id}`} value={file.id.toString()}>
                            {file.filename}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="batch-size">Batch Size</Label>
                    <Input
                      id="batch-size"
                      type="number"
                      min={10}
                      max={1000}
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value) || 100)}
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={handleImport}
                  disabled={!isReadyForImport || importPropertyData.isPending}
                  className="w-full mt-6"
                >
                  {importPropertyData.isPending ? 'Importing...' : 'Import Property Data'}
                </Button>
                
                {importPropertyData.isPending && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importing</AlertTitle>
                    <AlertDescription>
                      Importing property data. This may take a few minutes depending on file size.
                    </AlertDescription>
                  </Alert>
                )}
                
                {importPropertyData.isSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle>Import Complete</AlertTitle>
                    <AlertDescription>
                      Property data has been successfully imported.
                    </AlertDescription>
                  </Alert>
                )}
                
                {importPropertyData.isError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Import Failed</AlertTitle>
                    <AlertDescription>
                      {importPropertyData.error instanceof Error 
                        ? importPropertyData.error.message 
                        : 'Failed to import property data'}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Recent uploads */}
            {sortedFiles.length > 0 && (
              <div className="space-y-2 mt-6">
                <h3 className="text-sm font-medium">Recent uploads</h3>
                <div className="space-y-2">
                  {sortedFiles.slice(0, 5).map(file => (
                    <div 
                      key={file.id}
                      className="p-3 rounded-md border flex justify-between items-center"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-blue-500" />
                        <div>
                          <p className="font-medium">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500">
                        Uploaded
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        {sortedFiles && sortedFiles.length > 5 && (
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All ({sortedFiles.length})
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default PropertyDataImportHandler;