import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import PropertyDataImportHandler from '@/components/data/PropertyDataImportHandler';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Sheet, 
  SheetClose, 
  SheetContent, 
  SheetDescription, 
  SheetFooter, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileSpreadsheet, 
  Upload, 
  FileCheck, 
  AlertCircle, 
  Download, 
  Info, 
  RefreshCw, 
  ChevronDown, 
  FileText, 
  FileX, 
  Database as DatabaseIcon, 
  Activity 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportFile {
  id: number;
  filename: string;
  uploadDate: string;
  fileSize: number;
  status: "pending" | "processing" | "completed" | "failed";
  message?: string;
  records?: number;
}

interface ImportHistoryItem {
  id: number;
  fileId: number;
  filename: string;
  importDate: string;
  status: "success" | "partial" | "failed";
  recordsProcessed: number;
  recordsImported: number;
  message?: string;
}

interface ImportPreviewItem {
  id: string;
  region: string;
  buildingType: string;
  year: number;
  baseCost: number;
  status: "new" | "updated" | "duplicate" | "error";
}

const DataImportPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedImportId, setSelectedImportId] = useState<number | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewItem[]>([]);
  const [selectedDetails, setSelectedDetails] = useState<ImportHistoryItem | null>(null);
  
  // Dropzone for file uploads
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        
        // Reset states
        setImportProgress(0);
        setPreviewData([]);
      }
    }
  });

  // Query to fetch uploaded files
  const { data: uploadedFiles = [], isLoading: isLoadingFiles } = useQuery({
    queryKey: ['/api/files'],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: '/api/files',
        method: 'GET' 
      });
      return response.json() as Promise<ImportFile[]>;
    }
  });

  // Query to fetch import history
  const { data: importHistory = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/import-history'],
    queryFn: async () => {
      const response = await apiRequest({ 
        url: '/api/import-history',
        method: 'GET' 
      });
      return response.json() as Promise<ImportHistoryItem[]>;
    }
  });

  // Mutation for file upload
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiRequest({
        url: '/api/upload',
        method: 'POST',
        body: formData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      });
      setSelectedFile(null);
      setActiveTab("files");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Mutation for file preview (validation)
  const previewMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest({
        url: `/api/preview-import/${fileId}`,
        method: 'GET'
      });
      return response.json() as Promise<ImportPreviewItem[]>;
    },
    onSuccess: (data) => {
      setPreviewData(data);
      toast({
        title: "Preview Generated",
        description: "Preview of import data has been generated.",
      });
    },
    onError: (error) => {
      console.error("Preview error:", error);
      toast({
        title: "Preview Failed",
        description: "Failed to generate preview. Please check the file format.",
        variant: "destructive"
      });
    }
  });

  // Mutation for import execution
  const importMutation = useMutation({
    mutationFn: async (fileId: number) => {
      setIsImporting(true);
      setImportProgress(0);
      
      // Start progress simulation
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);
      
      try {
        const result = await apiRequest({
          url: '/api/import',
          method: 'POST',
          body: { fileId }
        });
        
        clearInterval(interval);
        setImportProgress(100);
        
        // Give visual feedback that 100% is reached before resetting
        setTimeout(() => {
          setIsImporting(false);
          setImportProgress(0);
        }, 1000);
        
        return result;
      } catch (error) {
        clearInterval(interval);
        setImportProgress(0);
        setIsImporting(false);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/import-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cost-matrix'] });
      
      toast({
        title: "Import Successful",
        description: "The cost matrix data has been imported successfully.",
      });
      
      setShowConfirmDialog(false);
      setActiveTab("history");
    },
    onError: (error) => {
      console.error("Import error:", error);
      toast({
        title: "Import Failed",
        description: "There was an error during the import process.",
        variant: "destructive"
      });
      setShowConfirmDialog(false);
    }
  });

  // Mutation for deleting an uploaded file
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => {
      return apiRequest({
        url: `/api/files/${fileId}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "File Deleted",
        description: "The file has been deleted successfully.",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file.",
        variant: "destructive"
      });
    }
  });

  // Handle file upload
  const handleUpload = async () => {
    if (selectedFile) {
      await uploadMutation.mutateAsync(selectedFile);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
    }
  };

  // Handle file preview
  const handlePreview = async (fileId: number) => {
    await previewMutation.mutateAsync(fileId);
  };

  // Open import confirmation dialog
  const confirmImport = (fileId: number) => {
    setSelectedImportId(fileId);
    setShowConfirmDialog(true);
  };

  // Handle file import
  const handleImport = async () => {
    if (selectedImportId) {
      await importMutation.mutateAsync(selectedImportId);
    }
  };

  // Show import details in side sheet
  const showImportDetails = (item: ImportHistoryItem) => {
    setSelectedDetails(item);
    setShowDetailsSheet(true);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Get status icon and color based on status
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return { icon: <Info className="h-4 w-4" />, color: "text-blue-500" };
      case "processing":
        return { icon: <RefreshCw className="h-4 w-4 animate-spin" />, color: "text-yellow-500" };
      case "completed":
        return { icon: <FileCheck className="h-4 w-4" />, color: "text-green-500" };
      case "failed":
        return { icon: <AlertCircle className="h-4 w-4" />, color: "text-red-500" };
      case "success":
        return { icon: <FileCheck className="h-4 w-4" />, color: "text-green-500" };
      case "partial":
        return { icon: <AlertCircle className="h-4 w-4" />, color: "text-yellow-500" };
      default:
        return { icon: <Info className="h-4 w-4" />, color: "text-gray-500" };
    }
  };
  
  return (
    <LayoutWrapper>
      <MainContent title="Data Import">
        <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Benton County Data Import</h1>
      </div>
      
      <Tabs 
        defaultValue="upload" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" /> Cost Matrix
          </TabsTrigger>
          <TabsTrigger value="property-data">
            <FileText className="h-4 w-4 mr-2" /> Property Data
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Manage Files
          </TabsTrigger>
          <TabsTrigger value="history">
            <Activity className="h-4 w-4 mr-2" /> Import History
          </TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Cost Matrix File</CardTitle>
              <CardDescription>
                Upload Benton County Cost Matrix Excel files (.xlsx, .xls). 
                Files should follow the expected format with matrix and matrix_detail sheets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                {...getRootProps()} 
                className={cn(
                  "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                  isDragActive 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-300 hover:border-primary hover:bg-primary/5"
                )}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-lg font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-medium">
                      {isDragActive ? "Drop the file here" : "Drag & drop a file here, or click to select"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Supported file types: .xlsx, .xls
                    </p>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button 
                onClick={handleUpload} 
                disabled={!selectedFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>File Format Requirements</CardTitle>
              <CardDescription>
                The Excel file should follow Benton County's Cost Matrix format for successful import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Required Sheets</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>matrix:</strong> Main cost matrix data with axes and values</li>
                    <li><strong>matrix_detail:</strong> Detailed cost breakdown information</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Required Columns</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>matrix sheet:</strong> matrix_id, matrix_yr, col_desc, row_desc, cell_value</li>
                    <li><strong>matrix_detail sheet:</strong> matrix_id, detail_type, detail_code, detail_desc, detail_value</li>
                  </ul>
                </div>
                
                <div className="border rounded-md p-4 bg-yellow-50">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium mb-1">Important Note</h3>
                      <p className="text-sm">
                        If you are unsure about the file format, please refer to the sample file or contact support.
                        Incorrect file formats may lead to failed imports or data inconsistencies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download Sample File
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Property Data Tab */}
        <TabsContent value="property-data">
          <PropertyDataImportHandler 
            title="Property Data Import" 
            description="Upload and import Benton County property data CSV files"
          />
        </TabsContent>
        
        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                Manage your uploaded cost matrix files and preview their data before importing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFiles ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Loading files...</p>
                </div>
              ) : uploadedFiles.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                  <FileText className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-2 text-lg font-medium">No files uploaded</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload files from the Upload tab to see them here.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("upload")}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Go to Upload
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableCaption>List of uploaded cost matrix files</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Filename</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadedFiles.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-500" />
                            {file.filename}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(file.uploadDate).toLocaleString()}</TableCell>
                        <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={cn("mr-2", getStatusDisplay(file.status).color)}>
                              {getStatusDisplay(file.status).icon}
                            </span>
                            <span className="capitalize">{file.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(file.id)}
                              disabled={previewMutation.isPending || file.status !== "completed"}
                            >
                              Preview
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => confirmImport(file.id)}
                              disabled={importMutation.isPending || file.status !== "completed"}
                            >
                              Import
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFileMutation.mutateAsync(file.id)}
                              disabled={deleteFileMutation.isPending}
                            >
                              <FileX className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Preview Data Panel */}
          {previewData.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Import Preview</CardTitle>
                <CardDescription>
                  Preview of data that will be imported from the selected file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Building Type</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Base Cost</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.region}</TableCell>
                        <TableCell>{item.buildingType}</TableCell>
                        <TableCell>{item.year}</TableCell>
                        <TableCell>${item.baseCost.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            item.status === "new" && "bg-green-100 text-green-800",
                            item.status === "updated" && "bg-blue-100 text-blue-800",
                            item.status === "duplicate" && "bg-yellow-100 text-yellow-800",
                            item.status === "error" && "bg-red-100 text-red-800",
                          )}>
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.length > 10 && (
                  <div className="text-center mt-4 text-sm text-gray-500">
                    Showing 10 of {previewData.length} records
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-between">
                <div className="text-sm text-gray-500">
                  <span className="font-medium">{previewData.length}</span> records ready to import
                </div>
                <Button
                  onClick={() => {
                    if (selectedImportId) {
                      confirmImport(selectedImportId);
                    }
                  }}
                  disabled={!selectedImportId || importMutation.isPending}
                >
                  <DatabaseIcon className="h-4 w-4 mr-2" />
                  {importMutation.isPending ? "Importing..." : "Import to Database"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Import History</CardTitle>
              <CardDescription>
                View the history of all cost matrix data imports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 mx-auto animate-spin text-gray-400" />
                  <p className="mt-2 text-gray-500">Loading import history...</p>
                </div>
              ) : importHistory.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed">
                  <Activity className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-2 text-lg font-medium">No import history</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Import data from the Files tab to see history.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("files")}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Go to Files
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableCaption>Import history of cost matrix data</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Import Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-500" />
                            {item.filename}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(item.importDate).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className={cn("mr-2", getStatusDisplay(item.status).color)}>
                              {getStatusDisplay(item.status).icon}
                            </span>
                            <span className="capitalize">{item.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.recordsImported} / {item.recordsProcessed}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => showImportDetails(item)}
                          >
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Import Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to import this cost matrix data? 
              This will add or update records in the database. This action can be time-consuming for large datasets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isImporting && (
            <div className="py-2">
              <p className="text-sm text-gray-500 mb-2">Import in progress...</p>
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1 text-right">{importProgress}%</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isImporting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                "Import Data"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Import Details Sheet */}
      <Sheet open={showDetailsSheet} onOpenChange={setShowDetailsSheet}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Import Details</SheetTitle>
            <SheetDescription>
              Detailed information about this import.
            </SheetDescription>
          </SheetHeader>
          {selectedDetails && (
            <div className="py-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">File</Label>
                    <p className="font-medium">{selectedDetails.filename}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Import Date</Label>
                    <p className="font-medium">{new Date(selectedDetails.importDate).toLocaleString()}</p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-gray-500">Status</Label>
                  <div className="flex items-center mt-1">
                    <span className={cn("mr-2", getStatusDisplay(selectedDetails.status).color)}>
                      {getStatusDisplay(selectedDetails.status).icon}
                    </span>
                    <span className="font-medium capitalize">{selectedDetails.status}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Records Processed</Label>
                    <p className="font-medium">{selectedDetails.recordsProcessed}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Records Imported</Label>
                    <p className="font-medium">{selectedDetails.recordsImported}</p>
                  </div>
                </div>
                
                {selectedDetails.message && (
                  <div>
                    <Label className="text-xs text-gray-500">Message</Label>
                    <div className="p-3 mt-1 bg-gray-50 rounded-md text-sm">
                      {selectedDetails.message}
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Processing Summary</p>
                      <p className="text-xs text-blue-700 mt-1">
                        {selectedDetails.recordsImported === selectedDetails.recordsProcessed ? (
                          "All records were successfully imported."
                        ) : (
                          `${selectedDetails.recordsImported} out of ${selectedDetails.recordsProcessed} records were imported. Some records may have been skipped due to validation errors or duplicates.`
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button variant="secondary">Close</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
      </MainContent>
    </LayoutWrapper>
  );
};

export default DataImportPage;