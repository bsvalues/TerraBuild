import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CheckCircle, BrainCircuit, Upload } from 'lucide-react';

interface MatrixToXREGBridgeProps {
  matrixId?: string;
  propertyId?: string;
  className?: string;
}

/**
 * MatrixToXREGBridge - Integration component that connects the Matrix Upload
 * functionality with the XREG dashboard, allowing for seamless workflow between
 * uploading matrices and viewing explainable valuation results.
 */
export function MatrixToXREGBridge({ matrixId, propertyId, className }: MatrixToXREGBridgeProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<'idle' | 'processing' | 'ready' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');

  // Initialize with the provided matrixId and propertyId or use from local storage
  useEffect(() => {
    if (!matrixId) {
      const storedMatrixId = localStorage.getItem('lastUploadedMatrixId');
      if (storedMatrixId) {
        // We have a recently uploaded matrix
        setStatus('ready');
      }
    } else {
      // We have a matrix ID passed directly to the component
      setStatus('ready');
    }
  }, [matrixId]);

  // Navigate to upload matrix if needed
  const handleUploadMatrix = () => {
    navigate('/data-import');
    toast({
      title: 'Matrix Upload',
      description: 'Navigate to Matrix Upload to begin the process',
    });
  };

  // Navigate to XREG dashboard with the appropriate parameters
  const handleViewAnalysis = () => {
    const targetPropertyId = propertyId || localStorage.getItem('lastAnalyzedPropertyId') || '';
    const targetMatrixId = matrixId || localStorage.getItem('lastUploadedMatrixId') || '';
    
    if (targetPropertyId) {
      navigate(`/xreg?propertyId=${targetPropertyId}&matrixId=${targetMatrixId}`);
    } else {
      navigate('/xreg');
      toast({
        title: 'No Property Selected',
        description: 'Please select a property to analyze with XREG',
        variant: 'default',
      });
    }
  };

  // Process the matrix for XREG analysis
  const handleProcessMatrix = async () => {
    const targetMatrixId = matrixId || localStorage.getItem('lastUploadedMatrixId');
    
    if (!targetMatrixId) {
      toast({
        title: 'No Matrix Available',
        description: 'Please upload a cost matrix first',
        variant: 'destructive',
      });
      return;
    }

    setStatus('processing');
    setProcessingMessage('Preparing matrix data for XREG analysis...');

    try {
      // Simulating the processing time - in a real implementation this would
      // call the appropriate API endpoint to process the matrix
      setTimeout(() => {
        setProcessingMessage('Initializing feature extraction...');
      }, 1000);
      
      setTimeout(() => {
        setProcessingMessage('Running AI valuation models...');
      }, 3000);
      
      setTimeout(() => {
        setProcessingMessage('Generating explainability data...');
      }, 5000);
      
      setTimeout(() => {
        setStatus('ready');
        toast({
          title: 'XREG Processing Complete',
          description: 'Matrix data is ready for explainable analysis',
          variant: 'default',
        });
      }, 7000);
    } catch (error) {
      console.error('Error processing matrix:', error);
      setStatus('error');
      toast({
        title: 'Processing Error',
        description: 'An error occurred while processing the matrix data',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-5 w-5" />
          Matrix to XREG Integration
        </CardTitle>
        <CardDescription>
          Connect matrix uploads to explainable valuation results
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'idle' && (
          <div className="text-center py-6">
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No recent matrix uploads detected. Upload a cost matrix to begin the XREG analysis.
              </p>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="font-medium">Processing Matrix Data</span>
            </div>
            <p className="text-sm text-muted-foreground">{processingMessage}</p>
            <div className="w-full bg-muted h-2 rounded-full mt-4 overflow-hidden">
              <div className="bg-primary h-2 animate-pulse"></div>
            </div>
          </div>
        )}

        {status === 'ready' && (
          <div className="py-4">
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Matrix Data Ready</AlertTitle>
              <AlertDescription>
                Your matrix data has been processed and is ready for XREG analysis.
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Matrix ID</p>
                <p className="text-sm text-muted-foreground">
                  {matrixId || localStorage.getItem('lastUploadedMatrixId') || 'Unknown'}
                </p>
              </div>
              <Badge variant="outline" className="ml-2">
                Ready for Analysis
              </Badge>
            </div>
          </div>
        )}

        {status === 'error' && (
          <Alert variant="destructive" className="my-4">
            <AlertTitle>Processing Error</AlertTitle>
            <AlertDescription>
              An error occurred while processing the matrix data. Please try again or contact support if the issue persists.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {status === 'idle' && (
          <Button onClick={handleUploadMatrix} className="w-full">
            <Upload className="mr-2 h-4 w-4" />
            Upload Matrix
          </Button>
        )}

        {status === 'processing' && (
          <Button disabled className="w-full">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </Button>
        )}

        {status === 'ready' && (
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={handleUploadMatrix} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              New Upload
            </Button>
            <Button onClick={handleViewAnalysis} className="flex-1">
              <ArrowRight className="mr-2 h-4 w-4" />
              View in XREG
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={handleUploadMatrix} className="flex-1">
              <Upload className="mr-2 h-4 w-4" />
              New Upload
            </Button>
            <Button onClick={handleProcessMatrix} className="flex-1">
              Try Again
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

export default MatrixToXREGBridge;