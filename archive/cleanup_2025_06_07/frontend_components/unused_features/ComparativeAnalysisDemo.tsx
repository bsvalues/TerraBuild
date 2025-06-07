/**
 * Comparative Analysis Demo Page
 * 
 * This page demonstrates the comparative analysis capabilities
 * for building cost data analysis across regions and building types.
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
import { Info, HelpCircle } from 'lucide-react';
import { ComparativeAnalysis } from '@/components/visualizations/ComparativeAnalysis';
import { FilterControlPanel } from '@/components/visualizations/FilterControlPanel';
import { Separator } from '@/components/ui/separator';
import { VisualizationContextProvider } from '@/contexts/visualization-context';

export default function ComparativeAnalysisDemo() {
  const [showIntroduction, setShowIntroduction] = useState(true);

  return (
    <VisualizationContextProvider>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Comparative Analysis</h1>
            <p className="text-muted-foreground">
              Compare building costs across different regions and building types
            </p>
          </div>
        </div>

        {showIntroduction && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Interactive Comparison Tool</AlertTitle>
            <AlertDescription className="text-blue-700">
              This tool allows you to compare building costs across multiple regions and building types.
              Add items to the comparison, and view the data in different visualization formats.
              You can also export the comparison data for further analysis.
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
                <CardTitle className="text-base">Usage Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <span className="font-medium text-foreground">Add items</span>: Click the 'Add' button to select regions and building types for comparison.
                </p>
                <p>
                  <span className="font-medium text-foreground">Change visualization</span>: Toggle between different chart types using the tabs above the chart.
                </p>
                <p>
                  <span className="font-medium text-foreground">View details</span>: Scroll down to see the detailed comparison table with percentage differences.
                </p>
                <p>
                  <span className="font-medium text-foreground">Export data</span>: Click the 'Export' button to download the comparison data as a CSV file.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5">
            <ComparativeAnalysis />
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <CardTitle className="text-sm">Regional Variation</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Compare costs across regions to identify regional pricing variations and optimize location-based decisions.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <CardTitle className="text-sm">Building Type Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Analyze how costs differ between building types to better understand category-specific pricing factors.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <CardTitle className="text-sm">Cost Factor Breakdown</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Examine how complexity, quality, and condition factors contribute to the total cost across different scenarios.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Understanding Comparative Analysis</h2>
          
          <div className="bg-slate-50 rounded-lg p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-md">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">Why Compare Building Costs?</h3>
                <p className="text-muted-foreground mb-3">
                  Comparative analysis helps identify cost variations across different regions and building types,
                  providing valuable insights for budgeting, planning, and decision-making in construction projects.
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Base vs. Adjusted Cost</h4>
                    <p className="text-xs text-muted-foreground">
                      Compare the baseline costs against adjusted costs that include complexity, quality, and condition factors.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Percentage Differences</h4>
                    <p className="text-xs text-muted-foreground">
                      Easily identify the percentage differences between regions or building types to spot significant variations.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Factor Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      Understand how different factors contribute to the total cost and how these factors vary across scenarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </VisualizationContextProvider>
  );
}