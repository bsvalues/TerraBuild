import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, ArrowRight, BarChart3, ClipboardList } from 'lucide-react';
import { useMCP } from '@/hooks/use-mcp';

interface MatrixToXREGBridgeProps {
  matrixId?: string;
  propertyId?: string;
}

/**
 * MatrixToXREGBridge Component
 * 
 * This component serves as a bridge between the Matrix Upload system and the XREG
 * valuation dashboard. It handles the transformation of matrix data into a format
 * that can be used by the XREG system for explainable AI-driven valuation.
 */
export function MatrixToXREGBridge({ matrixId, propertyId }: MatrixToXREGBridgeProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState(false);
  const { analyzeMatrix, isAnalyzing, isError, error } = useMCP();

  // If matrixId is not provided, use the last uploaded matrix ID from localStorage
  useEffect(() => {
    if (!matrixId) {
      const lastUploadedMatrixId = localStorage.getItem('lastUploadedMatrixId');
      if (lastUploadedMatrixId) {
        // Update URL to include the matrix ID for better sharing/bookmarking
        navigate(`/matrix-xreg-integration?matrixId=${lastUploadedMatrixId}${propertyId ? `&propertyId=${propertyId}` : ''}`, { replace: true });
      }
    }
  }, [matrixId, propertyId, navigate]);

  const processMatrix = async () => {
    if (!matrixId) {
      toast({
        title: "No Matrix Selected",
        description: "Please upload or select a matrix first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Step 1: Prepare matrix data
      setProcessingStep('preparing');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing time
      
      // Step 2: Transform for XREG
      setProcessingStep('transforming');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time
      
      // Step 3: Process through AI agents
      setProcessingStep('analyzing');
      const result = await analyzeMatrix({ matrixId, propertyId });
      
      if (!result.success) {
        throw new Error(result.error || "Analysis failed");
      }
      
      // Processing complete
      setProcessingStep('complete');
      setProcessingComplete(true);
      
      toast({
        title: "Matrix Processed Successfully",
        description: "The matrix is now ready for XREG analysis",
        variant: "default"
      });
    } catch (err) {
      console.error('Error processing matrix for XREG:', err);
      setProcessingStep(null);
      
      toast({
        title: "Processing Error",
        description: err instanceof Error ? err.message : "An error occurred during processing",
        variant: "destructive"
      });
    }
  };

  const navigateToValuationDashboard = () => {
    navigate(`/valuation-dashboard?matrixId=${matrixId}${propertyId ? `&propertyId=${propertyId}` : ''}`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connect to XREG</CardTitle>
        <CardDescription>
          Process the cost matrix for XREG explainable AI valuation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!matrixId ? (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              No matrix selected. Please upload a matrix first or select an existing one.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                Matrix ID: <span className="font-mono text-sm">{matrixId}</span>
                {propertyId && <> • Property ID: <span className="font-mono text-sm">{propertyId}</span></>}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Processing Steps:</h3>
              <div className="space-y-2">
                <div className={`flex items-center space-x-2 p-2 rounded ${processingStep === 'preparing' ? 'bg-blue-50' : processingStep && processingStep !== 'preparing' ? 'bg-green-50' : ''}`}>
                  <div className={`w-4 h-4 rounded-full ${processingStep === 'preparing' ? 'bg-blue-500 animate-pulse' : processingStep && processingStep !== 'preparing' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span>1. Prepare matrix data</span>
                </div>
                
                <div className={`flex items-center space-x-2 p-2 rounded ${processingStep === 'transforming' ? 'bg-blue-50' : processingStep === 'analyzing' || processingStep === 'complete' ? 'bg-green-50' : ''}`}>
                  <div className={`w-4 h-4 rounded-full ${processingStep === 'transforming' ? 'bg-blue-500 animate-pulse' : processingStep === 'analyzing' || processingStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span>2. Transform for XREG analysis</span>
                </div>
                
                <div className={`flex items-center space-x-2 p-2 rounded ${processingStep === 'analyzing' ? 'bg-blue-50' : processingStep === 'complete' ? 'bg-green-50' : ''}`}>
                  <div className={`w-4 h-4 rounded-full ${processingStep === 'analyzing' ? 'bg-blue-500 animate-pulse' : processingStep === 'complete' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  <span>3. Process through AI agents</span>
                </div>
              </div>
            </div>

            {!processingComplete ? (
              <Button 
                onClick={processMatrix} 
                disabled={!!processingStep || isAnalyzing}
                className="w-full"
              >
                {isAnalyzing || processingStep ? 'Processing...' : 'Process for XREG Analysis'}
              </Button>
            ) : (
              <div className="space-y-3">
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Matrix successfully processed and ready for XREG analysis!
                  </AlertDescription>
                </Alert>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button onClick={navigateToValuationDashboard} className="flex items-center justify-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Open Valuation Dashboard</span>
                  </Button>
                  
                  <Button variant="outline" className="flex items-center justify-center space-x-2">
                    <ClipboardList className="h-4 w-4" />
                    <span>View Processing Details</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default MatrixToXREGBridge;