import React, { useState } from 'react';
import { useMCP } from '@/hooks/use-mcp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, Upload, ChevronRight, ChevronDown, FileText, BarChart3 } from 'lucide-react';
import EditableMatrixView from './EditableMatrixView';
import InsightSummaryCard from './InsightSummaryCard';
import ValuationTimelineChart from './ValuationTimelineChart';
import ValueScenarioCompare from './ValueScenarioCompare';
import ExportJustification from './ExportJustification';
import AgentFeed from '../xreg/AgentFeed';

interface ValuationDashboardProps {
  matrixId?: string;
  propertyId?: string;
}

/**
 * ValuationDashboard Component
 * 
 * A comprehensive dashboard for property valuation analysis that integrates:
 * - Editable matrix data
 * - AI-powered insights
 * - Valuation timeline visualization
 * - Scenario comparison
 * - Export capabilities
 */
export function ValuationDashboard({ matrixId, propertyId }: ValuationDashboardProps) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [matrixLoaded, setMatrixLoaded] = useState<boolean>(!!matrixId);
  const [analysisComplete, setAnalysisComplete] = useState<boolean>(false);
  const { analyzeMatrix, isAnalyzing, isError, error } = useMCP();

  // Handler for analyzing a matrix
  const handleAnalyzeMatrix = async () => {
    if (!matrixId) return;
    
    try {
      const result = await analyzeMatrix({ matrixId, propertyId });
      if (result.success) {
        setAnalysisComplete(true);
      }
    } catch (error) {
      console.error("Error analyzing matrix:", error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Valuation Control Center</h1>
        {matrixLoaded && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Matrix ID: {matrixId}</span>
            {propertyId && <span className="text-sm text-muted-foreground">Property ID: {propertyId}</span>}
          </div>
        )}
      </div>

      {!matrixLoaded ? (
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Upload or select a cost matrix to begin the valuation process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                The XREG system uses AI agents to analyze cost matrices and provide explainable valuations
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button className="flex items-center space-x-2" onClick={() => setMatrixLoaded(true)}>
                <ChevronRight className="h-4 w-4" />
                <span>Select Existing Matrix</span>
              </Button>
              <Button className="flex items-center space-x-2" variant="outline">
                <Upload className="h-4 w-4" />
                <span>Upload New Matrix</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="matrix">Matrix Data</TabsTrigger>
              <TabsTrigger value="insights">Agent Insights</TabsTrigger>
              <TabsTrigger value="export">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Matrix Analysis</CardTitle>
                    <CardDescription>
                      Cost matrix from {matrixId?.includes('_') ? matrixId.split('_')[0] : 'Benton County'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!analysisComplete ? (
                      <Button 
                        onClick={handleAnalyzeMatrix} 
                        disabled={isAnalyzing}
                        className="w-full"
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                      </Button>
                    ) : (
                      <Alert>
                        <CheckIcon className="h-4 w-4" />
                        <AlertDescription>
                          Analysis complete! View insights and visualizations
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                
                <InsightSummaryCard />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full flex justify-between items-center">
                      <span>Edit Matrix Data</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full flex justify-between items-center">
                      <span>View Explanation Factors</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="w-full flex justify-between items-center">
                      <span>Export Report</span>
                      <FileText className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ValuationTimelineChart />
                <ValueScenarioCompare />
              </div>
            </TabsContent>

            <TabsContent value="matrix">
              <Card>
                <CardHeader>
                  <CardTitle>Matrix Data Editor</CardTitle>
                  <CardDescription>
                    View and edit cost matrix data to see how changes affect valuation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EditableMatrixView />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Valuation Factors</CardTitle>
                    <CardDescription>
                      Key factors influencing property value calculation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Base Cost (per sqft)</span>
                        <span className="font-medium">$124.50</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Regional Multiplier</span>
                        <span className="font-medium">1.15</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Age Factor</span>
                        <span className="font-medium">0.92</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Quality Adjustment</span>
                        <span className="font-medium">1.08</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Market Condition Factor</span>
                        <span className="font-medium">1.04</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Insight Feed</CardTitle>
                    <CardDescription>
                      Live AI agent insights and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AgentFeed />
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>AI Analysis Insights</CardTitle>
                  <CardDescription>
                    Detailed analysis and recommendations from AI agents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-50 rounded-md">
                      <p className="font-medium">Anomaly Detected</p>
                      <p className="text-sm text-gray-700">Commercial building costs in zone A3 are 18% higher than surrounding areas</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-md">
                      <p className="font-medium">Cost Efficiency</p>
                      <p className="text-sm text-gray-700">Residential class R2 costs can be harmonized with recent regional updates</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-md">
                      <p className="font-medium">Recommendation</p>
                      <p className="text-sm text-gray-700">Consider updating depreciation schedule for buildings older than 50 years</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>
                      Download valuation data in various formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExportJustification />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                    <CardDescription>
                      Complete history of changes and agent activities
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Matrix Upload</span>
                        <span className="text-sm text-gray-500">Today, 12:45 PM</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Initial Analysis</span>
                        <span className="text-sm text-gray-500">Today, 12:46 PM</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Cost Factor Adjustment</span>
                        <span className="text-sm text-gray-500">Today, 12:50 PM</span>
                      </div>
                      <div className="flex justify-between p-2 bg-gray-50 rounded">
                        <span>Revalidation</span>
                        <span className="text-sm text-gray-500">Today, 12:52 PM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

// Helper icon component
const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default ValuationDashboard;