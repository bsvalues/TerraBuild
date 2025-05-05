import React from 'react';
import MatrixUploadInterface from '@/components/MatrixUploadInterface';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileSpreadsheet } from 'lucide-react';

export default function MatrixUploadPage() {
  return (
    <div className="container max-w-7xl mx-auto p-4 space-y-6">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center">
            <FileSpreadsheet className="mr-2 h-6 w-6 text-primary" />
            <CardTitle>Matrix Upload & Validation</CardTitle>
          </div>
          <CardDescription>
            Upload, validate, and analyze Benton County cost matrix files with AI assistance
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This interface provides a seamless process for uploading cost matrix files and validating their content.
            The system uses intelligent agents to check for issues, standardize the data format, and provide
            useful insights about cost trends and anomalies.
          </p>
        </CardContent>
      </Card>
      
      <MatrixUploadInterface />
    </div>
  );
}