import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Switch } from './switch';
import { Eye, Grid, AlertCircle } from 'lucide-react';

interface MatrixPreviewTableProps {
  data: any[];
  rawData?: any[];
  errors?: Record<string, any[]>;
}

export default function MatrixPreviewTable({ 
  data, 
  rawData, 
  errors = {} 
}: MatrixPreviewTableProps) {
  const [viewType, setViewType] = useState<'processed' | 'raw'>('processed');
  const [showHighlights, setShowHighlights] = useState(true);
  
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Matrix Preview</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Grid className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No data to preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Get the headers from the first item
  const headers = Object.keys(data[0]);
  
  // Limit to 10 rows for preview
  const previewData = data.slice(0, 10);
  const previewRawData = rawData?.slice(0, 10) || [];
  
  // Check if a cell has an error
  const hasError = (rowIndex: number, columnName: string) => {
    if (!showHighlights || !errors[columnName]) return false;
    return errors[columnName].includes(rowIndex);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex justify-between items-center">
          <CardTitle>Matrix Preview</CardTitle>
          
          <div className="flex items-center space-x-6">
            {rawData && rawData.length > 0 && (
              <Tabs 
                defaultValue="processed" 
                value={viewType}
                onValueChange={(v) => setViewType(v as 'processed' | 'raw')}
                className="w-[260px]"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="processed">Processed</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="highlights" 
                checked={showHighlights}
                onCheckedChange={setShowHighlights}
              />
              <label 
                htmlFor="highlights" 
                className="text-sm cursor-pointer select-none"
              >
                Highlight Issues
              </label>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="border rounded-md overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                {viewType === 'processed' && headers.map((header) => (
                  <TableHead key={header}>{header}</TableHead>
                ))}
                {viewType === 'raw' && rawData && rawData.length > 0 && 
                  Object.keys(rawData[0]).map((header) => (
                    <TableHead key={header}>{header}</TableHead>
                  ))
                }
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {viewType === 'processed' && previewData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                  {headers.map((header) => {
                    const hasRowError = hasError(rowIndex, header);
                    
                    return (
                      <TableCell 
                        key={`${rowIndex}-${header}`}
                        className={hasRowError ? "bg-red-50" : ""}
                      >
                        <div className="flex items-center">
                          {hasRowError && (
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1 flex-shrink-0" />
                          )}
                          <span className={hasRowError ? "text-red-600" : ""}>
                            {typeof row[header] === 'object' 
                              ? JSON.stringify(row[header]) 
                              : String(row[header] || '')}
                          </span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              
              {viewType === 'raw' && previewRawData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell className="font-medium">{rowIndex + 1}</TableCell>
                  {Object.keys(row).map((key) => (
                    <TableCell key={`${rowIndex}-${key}`}>
                      {typeof row[key] === 'object' 
                        ? JSON.stringify(row[key]) 
                        : String(row[key] || '')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {data.length > 10 && (
          <div className="mt-2 text-xs text-muted-foreground">
            Showing 10 of {data.length} rows
          </div>
        )}
      </CardContent>
    </Card>
  );
}