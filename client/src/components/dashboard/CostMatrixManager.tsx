import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCostMatrix } from "@/hooks/use-cost-matrix";
import { useFileUploads } from "@/hooks/use-file-uploads";
import { toast } from "@/hooks/use-toast";
import { FileUpload } from "@shared/schema";
import { DownloadIcon, FileUpIcon, RefreshCwIcon, FileIcon, DatabaseIcon, XIcon, AlertCircleIcon, CheckIcon, ServerIcon } from "lucide-react";
import { format } from "date-fns";
import BatchImportHandler from "./BatchImportHandler";

export const CostMatrixManager: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("upload");
  
  const { getAll: getAllMatrices } = useCostMatrix();
  const { 
    getAll: getAllFileUploads,
    create: createFileUpload,
    importExcelMatrix,
  } = useFileUploads();
  
  const matrices = getAllMatrices.data || [];
  const fileUploads = getAllFileUploads.data || [];
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file is Excel
      if (!file.type.includes('spreadsheet') && !file.type.includes('excel')) {
        toast({
          title: "Invalid file type",
          description: "Please select an Excel file (.xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      // First, create a file upload record
      const fileRecord = await createFileUpload.mutateAsync({
        filename: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        status: "pending",
        processedItems: 0,
        totalItems: null,
        errorCount: 0,
        errors: []
      });
      
      // In a real implementation, we would upload the file to server storage here
      // For this demo, we'll just simulate the upload and immediately process it
      
      // Import the Excel file into the cost matrix
      await importExcelMatrix.mutateAsync(fileRecord.id);
      
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      setActiveTab("history");
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload Excel file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch(status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      return <FileIcon className="h-4 w-4 text-green-500" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cost Matrix Manager</CardTitle>
        <CardDescription>Upload and manage cost matrices for building cost calculations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload Matrix</TabsTrigger>
            <TabsTrigger value="batch">Batch Import</TabsTrigger>
            <TabsTrigger value="history">Upload History</TabsTrigger>
            <TabsTrigger value="matrices">Cost Matrices</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Excel Cost Matrix</CardTitle>
                <CardDescription>
                  Upload Benton County cost matrix Excel files to import into the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div 
                    className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUpIcon className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : "Click to select or drag & drop Excel file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports .xlsx and .xls files
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" 
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {selectedFile && (
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-md p-3">
                      <div className="flex items-center">
                        {getFileIcon(selectedFile.name)}
                        <span className="ml-2 text-sm">{selectedFile.name}</span>
                        <span className="ml-2 text-xs text-gray-500">({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={handleFileUpload} 
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Upload Matrix
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="batch" className="pt-4">
            <BatchImportHandler />
          </TabsContent>
          
          <TabsContent value="history" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>File Upload History</CardTitle>
                <CardDescription>
                  View all cost matrix file uploads and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fileUploads.length === 0 ? (
                  <div className="text-center py-10">
                    <FileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No file uploads found</p>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>List of uploaded cost matrix files</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fileUploads.map((file: FileUpload) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            {getFileIcon(file.filename)}
                            {file.filename}
                          </TableCell>
                          <TableCell>
                            {format(new Date(file.createdAt), 'MMM d, yyyy h:mm a')}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(file.status)}
                          </TableCell>
                          <TableCell>
                            <div className="w-full max-w-[120px]">
                              {file.status === 'processing' && file.totalItems ? (
                                <div>
                                  <Progress 
                                    value={(file.processedItems / file.totalItems) * 100} 
                                    className="h-2" 
                                  />
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {file.processedItems} / {file.totalItems}
                                  </div>
                                </div>
                              ) : file.status === 'completed' ? (
                                <CheckIcon className="h-4 w-4 text-green-500" />
                              ) : file.status === 'failed' ? (
                                <AlertCircleIcon className="h-4 w-4 text-red-500" />
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="matrices" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cost Matrices</CardTitle>
                <CardDescription>
                  View all imported cost matrices in the system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matrices.length === 0 ? (
                  <div className="text-center py-10">
                    <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">No cost matrices found</p>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>List of cost matrices in the system</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>Building Type</TableHead>
                        <TableHead>Base Cost</TableHead>
                        <TableHead>Matrix Year</TableHead>
                        <TableHead>Data Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrices.map((matrix) => (
                        <TableRow key={matrix.id}>
                          <TableCell className="font-medium">{matrix.region}</TableCell>
                          <TableCell>{matrix.buildingType}</TableCell>
                          <TableCell>${parseFloat(matrix.baseCost).toFixed(2)}</TableCell>
                          <TableCell>{matrix.matrixYear}</TableCell>
                          <TableCell>{matrix.dataPoints || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CostMatrixManager;