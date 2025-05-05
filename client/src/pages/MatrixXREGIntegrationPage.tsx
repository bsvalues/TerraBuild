import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatrixToXREGBridge } from '@/components/integration/MatrixToXREGBridge';
import MatrixUploadInterface from '@/components/matrix/MatrixUploadInterface';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { useLocation } from 'wouter';

/**
 * MatrixXREGIntegrationPage - A page that integrates the Matrix Upload
 * functionality with the XREG dashboard, creating a seamless workflow.
 */
export default function MatrixXREGIntegrationPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const matrixId = searchParams.get('matrixId') || undefined;
  const propertyId = searchParams.get('propertyId') || undefined;
  const [activeTab, setActiveTab] = useState(matrixId ? 'bridge' : 'upload');

  // Handler for when a matrix is successfully uploaded
  const handleMatrixUploaded = (id: string) => {
    // Store the matrix ID for future use
    localStorage.setItem('lastUploadedMatrixId', id);
    // Switch to the bridge tab
    setActiveTab('bridge');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Matrix &amp; XREG Integration</h1>
      
      <Alert className="mb-6">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          This page allows you to upload cost matrices and connect them to the XREG dashboard for explainable AI-driven valuation.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="upload">Upload Matrix</TabsTrigger>
              <TabsTrigger value="bridge">Connect to XREG</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Matrix Upload</CardTitle>
                  <CardDescription>
                    Upload cost matrices to be used in the XREG dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MatrixUploadInterface onMatrixUploaded={handleMatrixUploaded} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="bridge" className="mt-0">
              <MatrixToXREGBridge matrixId={matrixId} propertyId={propertyId} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Integration Guide</CardTitle>
              <CardDescription>
                How to connect matrices to XREG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">1. Upload Matrix</h3>
                  <p className="text-sm text-muted-foreground">
                    Start by uploading a cost matrix file using the Matrix Upload tab.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">2. Process for XREG</h3>
                  <p className="text-sm text-muted-foreground">
                    Once uploaded, switch to the Connect to XREG tab and process the matrix for analysis.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">3. View in XREG Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    After processing, view the results in the XREG dashboard with explainable AI insights.
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium mb-1">Data Flow</h3>
                  <p className="text-sm text-muted-foreground">
                    Matrix Data → AI Processing → Feature Extraction → Prediction → Explanation → XREG Visualization
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}