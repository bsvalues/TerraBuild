/**
 * Statistical Analysis Demo Page
 * 
 * This page demonstrates the statistical analysis capabilities
 * for building cost data, including summary statistics, distribution
 * analysis, outlier detection, and correlation analysis.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, HelpCircle, Lightbulb } from 'lucide-react';
import { StatisticalAnalysisDashboard } from '@/components/visualizations/StatisticalAnalysisDashboard';
import { FilterControlPanel } from '@/components/visualizations/FilterControlPanel';
import { Separator } from '@/components/ui/separator';
import { VisualizationContextProvider } from '@/contexts/visualization-context';

export default function StatisticalAnalysisDemo() {
  const [showIntroduction, setShowIntroduction] = useState(true);

  return (
    <VisualizationContextProvider>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Statistical Analysis</h1>
            <p className="text-muted-foreground">
              Advanced statistical insights for building cost data
            </p>
          </div>
        </div>

        {showIntroduction && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Interactive Statistical Analysis</AlertTitle>
            <AlertDescription className="text-blue-700">
              This dashboard provides advanced statistical analysis of building cost data.
              Explore summary statistics, distribution analysis, outlier detection, and correlation analysis.
              Use the filters to focus on specific regions or building types.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-2">
            <FilterControlPanel
              allowedFilters={['regions', 'buildingTypes']}
              compact={true}
            />
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Statistical Insights</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <span className="font-medium text-foreground">Summary Statistics</span>: View key metrics like mean, median, and standard deviation to understand data central tendency and spread.
                </p>
                <p>
                  <span className="font-medium text-foreground">Distribution Analysis</span>: Visualize how values are distributed and identify patterns in the data.
                </p>
                <p>
                  <span className="font-medium text-foreground">Outlier Detection</span>: Identify data points that fall significantly outside the expected range.
                </p>
                <p>
                  <span className="font-medium text-foreground">Correlation Analysis</span>: Discover relationships between different cost factors and metrics.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5">
            <StatisticalAnalysisDashboard />
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <CardTitle className="text-sm">Data-Driven Decisions</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Use statistical insights to make informed business decisions based on actual data patterns rather than intuition.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <CardTitle className="text-sm">Anomaly Detection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Quickly identify unusual data points that may represent errors or special cases requiring attention.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <CardTitle className="text-sm">Relationship Insights</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Understand how different cost factors influence each other to better predict and manage overall costs.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Understanding Statistical Analysis</h2>
          
          <div className="bg-slate-50 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-md">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">How to Interpret Statistical Data</h3>
                <p className="text-muted-foreground mb-3">
                  Statistical analysis provides insights into the patterns, trends, and relationships in building cost data.
                  Use these insights to make informed decisions, identify areas for further investigation, and understand the factors that drive costs.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Central Tendency</h4>
                    <p className="text-xs text-muted-foreground">
                      The mean (average) and median (middle value) help understand typical values. When mean and median differ significantly, the data is skewed.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Dispersion</h4>
                    <p className="text-xs text-muted-foreground">
                      Standard deviation and range indicate how spread out the data is. Higher values suggest greater variability in costs.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Correlations</h4>
                    <p className="text-xs text-muted-foreground">
                      Values near +1 or -1 indicate strong relationships between metrics. Values near 0 suggest independence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-md">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Best Practices for Analysis</h3>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
                  <li>Compare similar building types and regions for more meaningful insights</li>
                  <li>Be cautious about drawing conclusions from small sample sizes</li>
                  <li>Consider outliers carefully - they may represent errors or genuine special cases</li>
                  <li>Remember that correlation does not imply causation</li>
                  <li>Use distribution charts to understand the full range of values, not just averages</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VisualizationContextProvider>
  );
}