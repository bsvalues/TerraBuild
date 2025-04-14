import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileIcon,
  XIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface FileDetail {
  file: string;
  status: string;
  phase?: string;
  success: boolean;
  errors?: string[];
  warnings?: string[];
  reason?: string;
  duplicateOf?: string;
  matrices?: number;
  details?: number;
  year?: number;
  types?: string[];
  regions?: string[];
  importResult?: {
    matricesInserted: number;
    detailsInserted: number;
  };
}

interface ImportResultsProps {
  results: {
    success: boolean;
    totalFiles: number;
    processed: number;
    failed: number;
    skipped?: number;
    details: FileDetail[];
    startTime?: number;
    endTime?: number;
    elapsedTimeMs?: number;
  };
  onClose?: () => void;
}

const ImportResults: React.FC<ImportResultsProps> = ({ results, onClose }) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});
  
  const toggleDetail = (filename: string) => {
    setExpandedDetails(prev => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };
  
  const formatTime = (timeMs: number) => {
    const seconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}.${(timeMs % 1000).toString().padStart(3, '0')}s`;
  };
  
  const getStatusBadge = (detail: FileDetail) => {
    if (detail.status === 'skipped') {
      return <Badge variant="outline" className="text-yellow-600">Skipped</Badge>;
    } else if (detail.success) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };
  
  const getStatusIcon = (detail: FileDetail) => {
    if (detail.status === 'skipped') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else if (detail.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };
  
  // Filter for viewing specific types of results
  const [filter, setFilter] = useState<'all' | 'success' | 'failed' | 'skipped'>('all');
  
  const filteredDetails = results.details.filter(detail => {
    if (filter === 'all') return true;
    if (filter === 'success') return detail.success && detail.status !== 'skipped';
    if (filter === 'failed') return !detail.success && detail.status !== 'skipped';
    if (filter === 'skipped') return detail.status === 'skipped';
    return true;
  });
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Cost Matrix Import Results</CardTitle>
            <CardDescription>
              Summary of the batch import operation
            </CardDescription>
          </div>
          <Badge variant={results.success ? 'success' : 'destructive'} className="px-3 py-1">
            {results.success ? 'Import Completed' : 'Import Failed'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">File Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Total Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{results.totalFiles}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Processed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{results.processed}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{results.failed}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Skipped</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{results.skipped || 0}</div>
                </CardContent>
              </Card>
            </div>
            
            {results.elapsedTimeMs && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Processing time:</span> {formatTime(results.elapsedTimeMs)}
                  {results.startTime && results.endTime && (
                    <>
                      <span className="ml-2">
                        (Started: {format(results.startTime, 'h:mm:ss a')} - 
                        Completed: {format(results.endTime, 'h:mm:ss a')})
                      </span>
                    </>
                  )}
                </p>
              </div>
            )}
            
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Matrices Inserted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {results.details.reduce((sum, detail) => 
                        sum + (detail.importResult?.matricesInserted || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Matrix Details Inserted</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {results.details.reduce((sum, detail) => 
                        sum + (detail.importResult?.detailsInserted || 0), 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Building Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {Array.from(new Set(
                        results.details.flatMap(detail => detail.types || [])
                      )).map(type => (
                        <Badge key={type} variant="outline" className="mb-1">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Regions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {Array.from(new Set(
                        results.details.flatMap(detail => detail.regions || [])
                      )).map(region => (
                        <Badge key={region} variant="outline" className="mb-1">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Matrix Years</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(
                        results.details.map(detail => detail.year).filter(Boolean)
                      )).map(year => (
                        <Badge key={year} variant="outline" className="mb-1">
                          {year}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Processed Files</h3>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={filter === 'all' ? 'default' : 'outline'} 
                  onClick={() => setFilter('all')}
                >
                  All ({results.details.length})
                </Button>
                <Button 
                  size="sm" 
                  variant={filter === 'success' ? 'default' : 'outline'} 
                  onClick={() => setFilter('success')}
                >
                  Success ({results.details.filter(d => d.success && d.status !== 'skipped').length})
                </Button>
                <Button 
                  size="sm" 
                  variant={filter === 'failed' ? 'default' : 'outline'} 
                  onClick={() => setFilter('failed')}
                >
                  Failed ({results.details.filter(d => !d.success && d.status !== 'skipped').length})
                </Button>
                <Button 
                  size="sm" 
                  variant={filter === 'skipped' ? 'default' : 'outline'} 
                  onClick={() => setFilter('skipped')}
                >
                  Skipped ({results.details.filter(d => d.status === 'skipped').length})
                </Button>
              </div>
            </div>
            
            {filteredDetails.length === 0 ? (
              <div className="text-center py-8">
                <p>No files match the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto px-1">
                {filteredDetails.map((detail, index) => (
                  <Collapsible 
                    key={index}
                    open={expandedDetails[detail.file]}
                    onOpenChange={() => toggleDetail(detail.file)}
                    className="border rounded-md"
                  >
                    <div className={`px-4 py-3 flex items-center justify-between ${
                      detail.success 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : detail.status === 'skipped'
                          ? 'bg-yellow-50 dark:bg-yellow-900/20'
                          : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div>
                          {getStatusIcon(detail)}
                        </div>
                        <div>
                          <div className="font-medium flex items-center">
                            <FileIcon className="h-4 w-4 mr-2" />
                            {detail.file}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {detail.phase || (detail.status === 'skipped' 
                              ? `Skipped: ${detail.reason || 'Unknown reason'}`
                              : detail.success 
                                ? `Imported successfully`
                                : `Failed: ${(detail.errors && detail.errors[0]) || 'Unknown error'}`
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(detail)}
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedDetails[detail.file] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </div>
                    </div>
                    
                    <CollapsibleContent>
                      <div className="px-4 py-3 space-y-3">
                        {detail.duplicateOf && (
                          <div className="text-sm">
                            <span className="font-medium">Duplicate of:</span> {detail.duplicateOf}
                          </div>
                        )}
                        
                        {detail.success && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-1">Import Results</h4>
                              <div className="text-sm space-y-1">
                                <div><span className="font-medium">Matrices Inserted:</span> {detail.importResult?.matricesInserted || 0}</div>
                                <div><span className="font-medium">Details Inserted:</span> {detail.importResult?.detailsInserted || 0}</div>
                                {detail.year && <div><span className="font-medium">Year:</span> {detail.year}</div>}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-1">Content Summary</h4>
                              <div className="text-sm space-y-1">
                                {detail.types && detail.types.length > 0 && (
                                  <div>
                                    <span className="font-medium">Building Types:</span> {detail.types.join(', ')}
                                  </div>
                                )}
                                {detail.regions && detail.regions.length > 0 && (
                                  <div>
                                    <span className="font-medium">Regions:</span> {detail.regions.join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {detail.errors && detail.errors.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-red-600 mb-1">Errors</h4>
                            <ul className="list-disc list-inside text-sm text-red-600">
                              {detail.errors.map((error, i) => (
                                <li key={i}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {detail.warnings && detail.warnings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-yellow-600 mb-1">Warnings</h4>
                            <ul className="list-disc list-inside text-sm text-yellow-600">
                              {detail.warnings.map((warning, i) => (
                                <li key={i}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </CardFooter>
    </Card>
  );
};

export default ImportResults;