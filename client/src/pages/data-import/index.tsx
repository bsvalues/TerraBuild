import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Check,
  File, 
  FileText, 
  FileSpreadsheet,
  Database,
  AlertCircle,
  Loader2,
  Filter,
  Info,
  UploadCloud,
  ChevronDown,
  Home,
  Building,
  FileArchive,
  FileCode,
  Trash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample import jobs
const importJobs = [
  {
    id: 1,
    name: 'Cost Matrix 2025.xlsx',
    date: '2025-05-14',
    status: 'Completed',
    type: 'Cost Matrix',
    format: 'Excel',
    records: 1520,
    errors: 0,
    warnings: 5,
    size: '3.2 MB',
  },
  {
    id: 2,
    name: 'Benton County Properties Q2.csv',
    date: '2025-05-10',
    status: 'Completed',
    type: 'Property Data',
    format: 'CSV',
    records: 4250,
    errors: 0,
    warnings: 12,
    size: '8.7 MB',
  },
  {
    id: 3,
    name: 'Region Boundaries 2025.json',
    date: '2025-05-08',
    status: 'Failed',
    type: 'Region Data',
    format: 'JSON',
    records: 0,
    errors: 3,
    warnings: 0,
    size: '1.4 MB',
  },
  {
    id: 4,
    name: 'Building Improvement Data.xlsx',
    date: '2025-05-02',
    status: 'Completed',
    type: 'Improvement Data',
    format: 'Excel',
    records: 2340,
    errors: 0,
    warnings: 8,
    size: '5.1 MB',
  },
  {
    id: 5,
    name: 'Hood_Code_Mapping.csv',
    date: '2025-04-30',
    status: 'Processing',
    type: 'Region Mapping',
    format: 'CSV',
    records: 0,
    errors: 0,
    warnings: 0,
    size: '0.8 MB',
  },
];

// Sample data import templates
const importTemplates = [
  {
    id: 1,
    name: 'Standard Cost Matrix Template',
    description: 'Template for importing cost matrix data',
    type: 'Excel',
    lastUpdated: '2025-04-15',
    icon: FileSpreadsheet,
  },
  {
    id: 2,
    name: 'Property Data Import Template',
    description: 'Template for importing property details',
    type: 'CSV',
    lastUpdated: '2025-05-01',
    icon: FileText,
  },
  {
    id: 3,
    name: 'Region Mapping Template',
    description: 'Template for mapping region codes to boundaries',
    type: 'CSV',
    lastUpdated: '2025-03-20',
    icon: FileText,
  },
  {
    id: 4,
    name: 'Improvement Data Template',
    description: 'Template for importing building improvements',
    type: 'Excel',
    lastUpdated: '2025-04-10',
    icon: FileSpreadsheet,
  },
];

const DataImportPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importType, setImportType] = useState('cost-matrix');
  const [validationMode, setValidationMode] = useState('strict');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  
  // Filter import jobs based on search
  const filteredJobs = importJobs.filter(job => 
    job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  // Reset file selection
  const handleReset = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Data Import</h1>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="upload" className="data-[state=active]:bg-blue-800/50">
            <Upload className="h-4 w-4 mr-2" />
            Upload Data
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-800/50">
            <FileText className="h-4 w-4 mr-2" />
            Import History
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-blue-800/50">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-blue-800/50">
            <Database className="h-4 w-4 mr-2" />
            Database Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Import New Data</CardTitle>
              <CardDescription className="text-blue-300">
                Upload a new file to import data into the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-blue-200">Import Type</Label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="cost-matrix">Cost Matrix</SelectItem>
                      <SelectItem value="property-data">Property Data</SelectItem>
                      <SelectItem value="region-mapping">Region Mapping</SelectItem>
                      <SelectItem value="improvement-data">Improvement Data</SelectItem>
                      <SelectItem value="custom">Custom Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-lg p-6 ${
                    dragActive ? 'border-blue-500 bg-blue-900/40' : 'border-blue-800/40 bg-blue-900/20'
                  } ${selectedFile ? 'border-green-500/30' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  {!selectedFile ? (
                    <div className="text-center py-8">
                      <UploadCloud className="h-12 w-12 text-blue-600/50 mx-auto mb-2" />
                      <h3 className="text-blue-100 font-medium">Drag and drop file here or</h3>
                      <p className="text-blue-400 text-sm mt-1 mb-4">
                        Supported formats: .xlsx, .csv, .json
                      </p>
                      <div>
                        <label className="cursor-pointer">
                          <Button variant="outline" className="border-blue-700 text-blue-200">
                            <Upload className="h-4 w-4 mr-2" />
                            Browse Files
                          </Button>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".xlsx,.csv,.json"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-500/20 rounded-full p-2">
                            <Check className="h-5 w-5 text-green-400" />
                          </div>
                          <div>
                            <h3 className="text-blue-100 font-medium">{selectedFile.name}</h3>
                            <p className="text-blue-400 text-sm">
                              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {
                                selectedFile.name.split('.').pop()?.toUpperCase()
                              }
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleReset}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-blue-200">Validation Mode</Label>
                    <Select value={validationMode} onValueChange={setValidationMode}>
                      <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                        <SelectValue placeholder="Select validation mode" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                        <SelectItem value="strict">Strict (Stop on Error)</SelectItem>
                        <SelectItem value="lenient">Lenient (Continue with Warnings)</SelectItem>
                        <SelectItem value="report-only">Report Only (No Import)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-blue-200">Region Handling</Label>
                    <Select defaultValue="auto-detect">
                      <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                        <SelectValue placeholder="Select region handling" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                        <SelectItem value="auto-detect">Auto-detect Region Format</SelectItem>
                        <SelectItem value="hood-code">Hood Code (52100 XXX)</SelectItem>
                        <SelectItem value="township">Township/Range (10N-24E)</SelectItem>
                        <SelectItem value="tca">Tax Code Area (TCA)</SelectItem>
                        <SelectItem value="city">City Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="overwrite" 
                      checked={overwriteExisting}
                      onCheckedChange={(checked) => {
                        if (typeof checked === 'boolean') {
                          setOverwriteExisting(checked);
                        }
                      }}
                    />
                    <Label htmlFor="overwrite" className="text-blue-300">Overwrite existing data if found</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="verify" defaultChecked />
                    <Label htmlFor="verify" className="text-blue-300">Perform data quality verification</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="backup" defaultChecked />
                    <Label htmlFor="backup" className="text-blue-300">Create backup before import</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" className="border-blue-700 text-blue-200">
                    Validate Only
                  </Button>
                  <Button 
                    className="bg-blue-700 hover:bg-blue-600"
                    disabled={!selectedFile}
                  >
                    Start Import
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Import Guidelines</CardTitle>
              <CardDescription className="text-blue-300">
                Follow these guidelines for a successful data import.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="format" className="border-blue-800/40">
                  <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-400" />
                      File Format Requirements
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Excel files (.xlsx) should have a dedicated sheet named "matrix" for cost matrix data</li>
                      <li>CSV files should use comma (,) as the delimiter with UTF-8 encoding</li>
                      <li>Column names should match the template exactly, including capitalization</li>
                      <li>Dates should be in YYYY-MM-DD format</li>
                      <li>Numbers should not include currency symbols or thousand separators</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="region" className="border-blue-800/40">
                  <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                    <div className="flex items-center">
                      <Home className="mr-2 h-4 w-4 text-blue-400" />
                      Region Code Formatting
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Hood codes should be in the format "52100 XXX" (e.g., "52100 100" for Richland)</li>
                      <li>Township/Range should be formatted as "10N-24E" with section identifiers if applicable</li>
                      <li>Tax Code Areas (TCAs) should match the county's official designation (e.g., "1111H")</li>
                      <li>City names should match official spellings (Richland, Kennewick, Prosser, etc.)</li>
                      <li>Multiple region formats can be included in the same file but must be clearly labeled</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="validation" className="border-blue-800/40">
                  <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                    <div className="flex items-center">
                      <AlertCircle className="mr-2 h-4 w-4 text-blue-400" />
                      Data Validation Process
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-300">
                    <p>The system performs the following validation checks during import:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>Field type validation (text, number, date)</li>
                      <li>Required field checking</li>
                      <li>Value range validation for numeric fields</li>
                      <li>Region code verification against county records</li>
                      <li>Duplicate detection based on primary keys</li>
                      <li>Referential integrity checking for related records</li>
                      <li>Historical data consistency verification</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="best-practices" className="border-blue-800/40">
                  <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                    <div className="flex items-center">
                      <Info className="mr-2 h-4 w-4 text-blue-400" />
                      Best Practices
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Always use the provided templates for consistent data formatting</li>
                      <li>Validate your data in "Report Only" mode before performing the actual import</li>
                      <li>Schedule large imports during off-peak hours</li>
                      <li>Keep a copy of the original data files for reference</li>
                      <li>For cost matrices, ensure all region and building type codes are standardized</li>
                      <li>Include effective dates for all cost data to maintain historical records</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Import History</CardTitle>
              <CardDescription className="text-blue-300">
                View and manage previous data imports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search imports..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="rounded-md border border-blue-800/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-900/50">
                    <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                      <TableHead className="text-blue-300">File Name</TableHead>
                      <TableHead className="text-blue-300">Date</TableHead>
                      <TableHead className="text-blue-300">Type</TableHead>
                      <TableHead className="text-blue-300">Status</TableHead>
                      <TableHead className="text-blue-300">Records</TableHead>
                      <TableHead className="text-blue-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.length > 0 ? (
                      filteredJobs.map((job) => (
                        <TableRow key={job.id} className="hover:bg-blue-900/40 border-blue-800/40">
                          <TableCell className="font-medium text-blue-200">
                            <div className="flex items-center">
                              {job.format === 'Excel' ? (
                                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-400" />
                              ) : job.format === 'CSV' ? (
                                <FileText className="h-4 w-4 mr-2 text-amber-400" />
                              ) : (
                                <FileCode className="h-4 w-4 mr-2 text-purple-400" />
                              )}
                              {job.name}
                            </div>
                            <span className="text-xs text-blue-400 block mt-1">{job.size}</span>
                          </TableCell>
                          <TableCell className="text-blue-300">{job.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700/50">
                              {job.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {job.status === 'Completed' ? (
                              <div className="flex items-center">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                                <span className="text-emerald-400">Completed</span>
                              </div>
                            ) : job.status === 'Processing' ? (
                              <div className="flex items-center">
                                <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2 animate-pulse"></span>
                                <span className="text-amber-400">Processing</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <span className="flex h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                                <span className="text-red-400">Failed</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-blue-300">
                            {job.records > 0 ? (
                              <div>
                                {job.records.toLocaleString()}
                                {job.warnings > 0 && (
                                  <span className="text-xs text-amber-400 ml-2">
                                    ({job.warnings} warnings)
                                  </span>
                                )}
                              </div>
                            ) : job.errors > 0 ? (
                              <span className="text-xs text-red-400">
                                {job.errors} errors
                              </span>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                <Info className="h-4 w-4 text-blue-400" />
                              </Button>
                              {job.status === 'Completed' && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <FileArchive className="h-4 w-4 text-blue-400" />
                                </Button>
                              )}
                              {job.status === 'Failed' && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <AlertCircle className="h-4 w-4 text-red-400" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-blue-400">
                          No import jobs found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Import Templates</CardTitle>
              <CardDescription className="text-blue-300">
                Download templates for different data import types.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {importTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="p-4 rounded-lg border border-blue-800/40 bg-blue-900/40 hover:bg-blue-900/50"
                  >
                    <div className="flex items-start">
                      <div className="bg-blue-900/70 p-3 rounded-lg mr-4">
                        <template.icon className="h-6 w-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-blue-100 font-medium">{template.name}</h3>
                          <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700/50">
                            {template.type}
                          </Badge>
                        </div>
                        <p className="text-blue-400 text-sm mt-1">{template.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-blue-500">Last updated: {template.lastUpdated}</span>
                          <Button size="sm" variant="outline" className="border-blue-700 text-blue-200">
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg border border-blue-800/40 bg-blue-900/50">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-amber-400 mr-2" />
                  <h3 className="text-blue-100 font-medium">Need a Custom Template?</h3>
                </div>
                <p className="text-blue-300 mt-2">
                  If you need a custom import template for specific data formats, contact the administrator to request a specialized template design.
                </p>
                <Button className="mt-3 bg-blue-700 hover:bg-blue-600">
                  Request Custom Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Database Status</CardTitle>
              <CardDescription className="text-blue-300">
                View current database status and statistics.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-blue-900/40 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-400">Total Properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">42,158</div>
                    <p className="text-xs text-blue-400 mt-1">+126 this month</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900/40 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-400">Cost Matrix Entries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">15,420</div>
                    <p className="text-xs text-blue-400 mt-1">Last updated 3 days ago</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900/40 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-400">Mapped Regions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">324</div>
                    <p className="text-xs text-blue-400 mt-1">98.2% coverage</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900/40 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-blue-400">Database Size</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-100">2.8 GB</div>
                    <p className="text-xs text-blue-400 mt-1">72% of allocated space</p>
                  </CardContent>
                </Card>
              </div>

              <h3 className="text-blue-100 font-medium mb-3">Table Status</h3>
              <div className="rounded-md border border-blue-800/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-900/50">
                    <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                      <TableHead className="text-blue-300">Table Name</TableHead>
                      <TableHead className="text-blue-300">Records</TableHead>
                      <TableHead className="text-blue-300">Last Update</TableHead>
                      <TableHead className="text-blue-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                      <TableCell className="font-medium text-blue-200">properties</TableCell>
                      <TableCell className="text-blue-300">42,158</TableCell>
                      <TableCell className="text-blue-300">2025-05-10</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-emerald-400">Healthy</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                      <TableCell className="font-medium text-blue-200">cost_matrices</TableCell>
                      <TableCell className="text-blue-300">15,420</TableCell>
                      <TableCell className="text-blue-300">2025-05-14</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-emerald-400">Healthy</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                      <TableCell className="font-medium text-blue-200">regions</TableCell>
                      <TableCell className="text-blue-300">324</TableCell>
                      <TableCell className="text-blue-300">2025-04-30</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-emerald-400">Healthy</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                      <TableCell className="font-medium text-blue-200">improvements</TableCell>
                      <TableCell className="text-blue-300">85,624</TableCell>
                      <TableCell className="text-blue-300">2025-05-02</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                          <span className="text-emerald-400">Healthy</span>
                        </div>
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                      <TableCell className="font-medium text-blue-200">assessment_history</TableCell>
                      <TableCell className="text-blue-300">128,945</TableCell>
                      <TableCell className="text-blue-300">2025-05-12</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="flex h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                          <span className="text-amber-400">Needs Optimization</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" className="border-blue-700 text-blue-200">
                  Run Database Check
                </Button>
                <Button className="bg-blue-700 hover:bg-blue-600">
                  Optimize Database
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataImportPage;