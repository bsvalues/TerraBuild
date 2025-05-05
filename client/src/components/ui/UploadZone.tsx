import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent } from './card';
import { Button } from './button';

interface UploadZoneProps {
  onUpload: (file: File) => void;
  acceptedFileTypes?: string[];
}

export default function UploadZone({ 
  onUpload, 
  acceptedFileTypes = ['.xlsx', '.xls'] 
}: UploadZoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) {
      setError('No valid files were dropped');
      return;
    }

    const selectedFile = acceptedFiles[0];
    
    // Check if the file is an Excel file
    const isExcel = /\.(xlsx|xls)$/i.test(selectedFile.name);
    if (!isExcel) {
      setError('Please upload an Excel (.xlsx or .xls) file');
      return;
    }

    setFile(selectedFile);
    onUpload(selectedFile);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
            ${error ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="flex flex-col items-center justify-center">
              <div className="bg-green-100 text-green-800 p-3 rounded-full mb-4">
                <Check className="w-8 h-8" />
              </div>
              <FileSpreadsheet className="w-12 h-12 text-primary mb-4" />
              <p className="text-lg font-medium mb-1">{file.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button 
                variant="outline" 
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Change File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {error ? (
                <>
                  <div className="bg-red-100 text-red-800 p-3 rounded-full mb-4">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="text-red-600 mb-4">{error}</p>
                </>
              ) : (
                <div className="bg-primary/10 text-primary p-3 rounded-full mb-4">
                  <Upload className="w-8 h-8" />
                </div>
              )}
              
              <h3 className="text-lg font-medium mb-2">
                {isDragActive ? 'Drop your file here' : 'Upload Cost Matrix'}
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Drag & drop your Excel file or click to browse
              </p>
              
              <div className="flex flex-col space-y-2 items-center">
                <p className="text-xs text-gray-400">Required sheets:</p>
                <div className="flex space-x-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">matrix</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">matrix_detail</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">region_codes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}