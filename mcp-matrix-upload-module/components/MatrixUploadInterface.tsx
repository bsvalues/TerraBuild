import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function MatrixUploadInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [errors, setErrors] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrors(null);
    setValidationResult(null);
    setParsedData(null);
    setInsights(null);
    
    // First, validate that it's an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setErrors('Please upload an Excel file (.xlsx or .xls)');
      toast({
        title: "Invalid file format",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // In a real implementation, we would send the file to the backend
      // For now, we'll simulate the responses
      
      // Simulate Inquisitor Agent validation
      setLoading('validating');
      
      // Instead of actually calling the agent, we'll simulate a successful validation
      setTimeout(() => {
        const mockValidation = {
          success: true,
          message: 'File validated successfully',
          summary: {
            regions: ['Kennewick', 'Richland', 'West Richland', 'Prosser'],
            buildingTypes: ['Residential', 'Commercial', 'Industrial', 'Agricultural'],
            costRanges: {
              min: 120,
              max: 450,
              avg: 220
            }
          },
          details: [
            { type: 'info', message: 'File structure is valid' },
            { type: 'info', message: 'All required sheets found' },
            { type: 'info', message: 'Matrix contains 4 building types' }
          ]
        };
        
        setValidationResult(mockValidation);
        setLoading('interpreting');

        // Simulate Interpreter Agent parsing
        setTimeout(() => {
          const mockParsed = {
            data: [
              { id: 1, buildingType: 'Residential', region: 'Kennewick', cost: 225, unit: 'sqft' },
              { id: 2, buildingType: 'Commercial', region: 'Richland', cost: 335, unit: 'sqft' },
              { id: 3, buildingType: 'Industrial', region: 'West Richland', cost: 410, unit: 'sqft' },
              { id: 4, buildingType: 'Agricultural', region: 'Prosser', cost: 145, unit: 'sqft' }
            ],
            preview: "Cost matrix parsed with 4 rows",
            rawData: {
              matrixCount: 4,
              regionCount: 4,
              buildingTypeCount: 4
            }
          };
          
          setParsedData(mockParsed);
          setLoading('visualizing');

          // Simulate Visualizer Agent insights
          setTimeout(() => {
            const mockInsights = {
              insights: [
                {
                  type: 'cost_trend',
                  title: 'Cost Variation by Region',
                  description: 'Richland shows 15% higher costs than Kennewick for similar building types.',
                  severity: 'info'
                },
                {
                  type: 'anomaly',
                  title: 'Potential Cost Anomaly',
                  description: 'Industrial building costs in West Richland are 20% above county average.',
                  severity: 'warning'
                },
                {
                  type: 'recommendation',
                  title: 'Data Improvement',
                  description: 'Consider adding more granular cost categories for Agricultural buildings.',
                  severity: 'info'
                }
              ]
            };
            
            setInsights(mockInsights);
            setLoading(null);
            
            toast({
              title: "Processing complete",
              description: "Matrix file analyzed successfully",
              variant: "default"
            });
          }, 1000);
        }, 1500);
      }, 2000);

    } catch (err) {
      console.error(err);
      setErrors('Upload or processing failed.');
      setLoading(null);
      toast({
        title: "Error",
        description: "Upload or processing failed",
        variant: "destructive"
      });
    }
  };

  // Generate loading message based on current step
  const loadingMessage = () => {
    switch(loading) {
      case 'validating':
        return 'Validating matrix file structure...';
      case 'interpreting':
        return 'Parsing cost matrix data...';
      case 'visualizing':
        return 'Generating cost insights...';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UploadCloud className="mr-2 h-5 w-5" />
            Upload Cost Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-2">
              <FileSpreadsheet className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to upload your cost matrix Excel file
              </p>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleFileUpload}
                className="hidden" 
                id="fileUpload"
              />
              <Button 
                onClick={() => document.getElementById('fileUpload')?.click()} 
                variant="outline"
              >
                Select File
              </Button>
              {selectedFile && (
                <p className="text-sm font-medium mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="bg-muted/40">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p>{loadingMessage()}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {errors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{errors}</AlertDescription>
        </Alert>
      )}

      {/* Validation Results */}
      {validationResult && (
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4 text-muted-foreground">{validationResult.message}</p>
            
            {validationResult.details && validationResult.details.length > 0 && (
              <div className="space-y-2">
                {validationResult.details.map((detail: any, index: number) => (
                  <div key={index} className={`flex items-start space-x-2 text-sm ${
                    detail.type === 'error' ? 'text-red-600' :
                    detail.type === 'warning' ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    <div className="h-4 w-4 mt-0.5">
                      {detail.type === 'error' ? '❌' : 
                       detail.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                    <p>{detail.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          
          {validationResult.summary && (
            <CardFooter className="border-t pt-4 flex-col items-start">
              {validationResult.summary.regions && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">Detected Regions:</p>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.summary.regions.map((region: string, i: number) => (
                      <Badge key={i} variant="outline">{region}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {validationResult.summary.buildingTypes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Detected Building Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {validationResult.summary.buildingTypes.map((type: string, i: number) => (
                      <Badge key={i} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      )}

      {/* Matrix Preview */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle>Matrix Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-left text-sm font-medium">ID</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Building Type</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Region</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Cost (per unit)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.data && parsedData.data.map((row: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-4 py-2 text-sm">{row.id}</td>
                      <td className="px-4 py-2 text-sm">{row.buildingType}</td>
                      <td className="px-4 py-2 text-sm">{row.region}</td>
                      <td className="px-4 py-2 text-sm">${row.cost} / {row.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Showing {parsedData.data?.length || 0} of {parsedData.rawData?.matrixCount || 0} cost matrix entries
            </p>
          </CardFooter>
        </Card>
      )}

      {/* Insights Panel */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.insights && insights.insights.map((insight: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <h3 className="font-medium flex items-center">
                    {insight.type === 'anomaly' && <AlertCircle className="h-4 w-4 mr-2 text-amber-500" />}
                    {insight.type === 'cost_trend' && <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-500" />}
                    {insight.type === 'recommendation' && <CheckCircle className="h-4 w-4 mr-2 text-green-500" />}
                    {insight.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  <div className="mt-2">
                    <Badge variant={
                      insight.severity === 'warning' ? 'destructive' : 
                      insight.severity === 'info' ? 'secondary' : 'outline'
                    }>
                      {insight.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}