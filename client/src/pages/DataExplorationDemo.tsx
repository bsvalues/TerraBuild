/**
 * Data Exploration Demo Page
 * 
 * This page demonstrates the advanced data point exploration features
 * with micro-interactions for different visualization components.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegionalCostComparison } from '@/components/visualizations/RegionalCostComparison';
import { Separator } from '@/components/ui/separator';
import { 
  Info, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DataExplorationDemo() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showIntroduction, setShowIntroduction] = useState(true);
  
  // Fetch cost matrix data for visualizations
  const { data: costMatrixData, isLoading, error } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Extract building types from data for filtering
  const buildingTypes = costMatrixData && Array.isArray(costMatrixData)
    ? Array.from(new Set(costMatrixData.map((item: any) => item.buildingType)))
    : [];

  // Prepare data for visualizations with additional metadata
  const prepareVisualizationData = () => {
    if (!costMatrixData || !Array.isArray(costMatrixData)) return [];

    return costMatrixData.map((item: any) => ({
      region: item.region,
      baseCost: item.baseCost,
      adjustedCost: item.baseCost * (1 + 
        (item.complexityFactorBase || 0) + 
        (item.qualityFactorBase || 0) + 
        (item.conditionFactorBase || 0)),
      buildingType: item.buildingType,
      costFactors: {
        quality: item.qualityFactorBase || 0,
        complexity: item.complexityFactorBase || 0,
        condition: item.conditionFactorBase || 0,
      },
      metadata: {
        county: item.county || 'N/A',
        state: item.state || 'Washington',
        yearBuilt: 2020 + Math.floor(Math.random() * 5), // Sample data for demo
        lastUpdated: new Date().toLocaleDateString(),
      }
    }));
  };

  // Auto-dismiss the introduction after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntroduction(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle selecting a region for detailed exploration
  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    // Additional logic for region selection could be added here
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Exploration</h1>
          <p className="text-muted-foreground">
            Explore building cost data with enhanced interactive visualizations
          </p>
        </div>
      </div>

      {showIntroduction && (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Interactive Data Points</AlertTitle>
          <AlertDescription className="text-blue-700">
            Try hovering over and clicking on data points in the visualizations below. 
            Each data point provides detailed information and context through micro-interactions.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-7">
        <div className="md:col-span-7">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Interactive Data Exploration Demo</CardTitle>
              <CardDescription>
                Demonstrating micro-interactions for data point exploration
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading data...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
                  <p>Error loading data. Please try again later.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <HelpCircle className="h-4 w-4" />
                    <p>
                      Hover over bars to see quick info, click for detailed view, and explore relationships between data points.
                    </p>
                  </div>
                  
                  <RegionalCostComparison 
                    data={prepareVisualizationData()} 
                    onRegionSelect={handleRegionSelect}
                    buildingTypes={buildingTypes}
                  />
                  
                  {selectedRegion && (
                    <div className="mt-6 p-4 border rounded-md bg-slate-50">
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowRight className="h-4 w-4 text-blue-600" />
                        <h3 className="font-medium">Region Selected: {selectedRegion}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You've selected the {selectedRegion} region for exploration. In a full implementation, 
                        this would trigger a detailed analysis view or filter other visualizations to focus on this region.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Interaction Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contextual Tooltips</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hover over any data point to see a contextual tooltip with key information, enhancing data comprehension at a glance.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detailed Popovers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click on data points to see detailed popovers with comprehensive metadata, relationships, and actionable insights.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visual Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Smooth animations and visual cues help users understand relationships between data points and identify patterns.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}