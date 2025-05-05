import React from 'react';
import { ClipboardList, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

interface ValidationStatus {
  success: boolean;
  message: string;
  details?: ValidationDetail[];
  summary?: ValidationSummary;
}

interface ValidationDetail {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
}

interface ValidationSummary {
  totalRows?: number;
  processedRows?: number;
  issues?: number;
  matrixYear?: string;
  regions?: string[];
  buildingTypes?: string[];
}

interface ImportStatusPanelProps {
  status: ValidationStatus;
}

export default function ImportStatusPanel({ status }: ImportStatusPanelProps) {
  if (!status || Object.keys(status).length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
            Waiting for file upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload a cost matrix file to begin validation
          </p>
        </CardContent>
      </Card>
    );
  }

  const summary = status.summary || {};
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          {status.success ? (
            <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="mr-2 h-5 w-5 text-red-500" />
          )}
          {status.success ? 'Validation Successful' : 'Validation Issues'}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm mb-4">{status.message}</p>

        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {summary.totalRows !== undefined && (
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-xl font-semibold">{summary.totalRows}</p>
              </div>
            )}
            
            {summary.processedRows !== undefined && (
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Processed</p>
                <p className="text-xl font-semibold">{summary.processedRows}</p>
              </div>
            )}
            
            {summary.issues !== undefined && (
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-xl font-semibold">{summary.issues}</p>
              </div>
            )}
            
            {summary.matrixYear && (
              <div className="bg-gray-50 p-3 rounded-md text-center">
                <p className="text-sm text-muted-foreground">Matrix Year</p>
                <p className="text-xl font-semibold">{summary.matrixYear}</p>
              </div>
            )}
          </div>
        )}

        {/* Details List */}
        {status.details && status.details.length > 0 && (
          <div className="border rounded-md mt-4">
            <div className="bg-gray-50 p-2 border-b">
              <h4 className="text-sm font-medium flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Validation Log
              </h4>
            </div>
            
            <ul className="divide-y">
              {status.details.map((detail, index) => (
                <li key={index} className="p-3 text-sm flex items-start">
                  {detail.type === 'error' && <XCircle className="mr-2 h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                  {detail.type === 'warning' && <AlertTriangle className="mr-2 h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                  {detail.type === 'info' && <ClipboardList className="mr-2 h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                  {detail.type === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />}
                  
                  <p>{detail.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      
      {summary && ((summary.regions && summary.regions.length > 0) || (summary.buildingTypes && summary.buildingTypes.length > 0)) && (
        <CardFooter className="border-t pt-4 flex-col items-start">
          {summary.regions && summary.regions.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-muted-foreground mb-1">Detected Regions:</p>
              <div className="flex flex-wrap gap-1">
                {summary.regions.map((region, i) => (
                  <Badge key={i} variant="outline">{region}</Badge>
                ))}
              </div>
            </div>
          )}
          
          {summary.buildingTypes && summary.buildingTypes.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Detected Building Types:</p>
              <div className="flex flex-wrap gap-1">
                {summary.buildingTypes.map((type, i) => (
                  <Badge key={i} variant="outline">{type}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
}