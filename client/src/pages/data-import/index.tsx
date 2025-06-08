import React, { useState } from 'react';
import { Upload, Database, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const DataImportPage = () => {
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);

  const recentImports = [
    {
      id: '1',
      filename: 'benton_county_parcels_2025.csv',
      type: 'Property Data',
      status: 'completed',
      records: 45672,
      date: '2025-06-07 14:30'
    },
    {
      id: '2',
      filename: 'cost_factors_Q2_2025.xlsx',
      type: 'Cost Factors',
      status: 'completed',
      records: 1234,
      date: '2025-06-06 09:15'
    },
    {
      id: '3',
      filename: 'assessments_batch_001.json',
      type: 'Assessments',
      status: 'processing',
      records: 892,
      date: '2025-06-08 11:45'
    }
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setImporting(true);
    setTimeout(() => setImporting(false), 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Data Import Center</h1>
          <p className="text-slate-400 mt-1">Import property data, cost factors, and assessment records</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Database className="h-4 w-4 mr-2" />
            Data Validation
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Import Template
          </Button>
        </div>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Upload Data Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragOver
                ? 'border-sky-500 bg-sky-500/10'
                : importing
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-slate-600 hover:border-slate-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {importing ? (
              <div className="space-y-4">
                <div className="animate-spin h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-slate-300 font-medium">Processing your files...</p>
                <Progress value={75} className="w-64 mx-auto" />
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-16 w-16 text-slate-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-medium text-slate-100 mb-2">
                    Drop files here or click to browse
                  </h3>
                  <p className="text-slate-400">
                    Supports CSV, Excel, JSON formats • Max file size: 100MB
                  </p>
                </div>
                <Button>
                  Select Files
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentImports.map((importRecord) => (
              <div key={importRecord.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-4">
                  {getStatusIcon(importRecord.status)}
                  <div>
                    <h3 className="font-medium text-slate-100">{importRecord.filename}</h3>
                    <p className="text-sm text-slate-400">
                      {importRecord.type} • {importRecord.records.toLocaleString()} records • {importRecord.date}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    importRecord.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : importRecord.status === 'processing'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {importRecord.status === 'completed' ? 'Completed' : 
                     importRecord.status === 'processing' ? 'Processing' : 'Error'}
                  </span>
                  
                  {importRecord.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Import Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-slate-300">Ensure data follows county formatting standards</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-slate-300">Include required fields: parcel ID, address, value</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-sky-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-slate-300">Run validation before final import</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Benton County GIS</span>
                <span className="text-emerald-400 text-xs">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Marshall Swift</span>
                <span className="text-emerald-400 text-xs">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">XREG Database</span>
                <span className="text-yellow-400 text-xs">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Import Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Total Records</span>
                <span className="text-slate-100 font-medium">47,798</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">This Month</span>
                <span className="text-slate-100 font-medium">892</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Success Rate</span>
                <span className="text-emerald-400 font-medium">99.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataImportPage;