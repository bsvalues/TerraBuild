/**
 * Cost Trend Analysis Demo Page
 * 
 * This page demonstrates the cost trend analysis capabilities
 * for building cost data, including trend detection, seasonality analysis,
 * forecasting, and growth rate calculation.
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
import { Info, HelpCircle, Lightbulb, LineChart, PieChart, BarChart2 } from 'lucide-react';
import { CostTrendAnalysis } from '@/components/visualizations/CostTrendAnalysis';
import { FilterControlPanel } from '@/components/visualizations/FilterControlPanel';
import { Separator } from '@/components/ui/separator';
import { VisualizationContextProvider } from '@/contexts/visualization-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CostTrendAnalysisDemo() {
  const [showIntroduction, setShowIntroduction] = useState(true);

  return (
    <VisualizationContextProvider>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cost Trend Analysis</h1>
            <p className="text-muted-foreground">
              Analyze building cost trends over time with advanced visualizations
            </p>
          </div>
        </div>

        {showIntroduction && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Time Series Trend Analysis</AlertTitle>
            <AlertDescription className="text-blue-700">
              This dashboard provides advanced time series analysis of building cost trends.
              Explore trend detection, seasonality analysis, forecasting, and growth rate calculation.
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
                <CardTitle className="text-base">Analysis Features</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <span className="font-medium text-foreground">Trend Detection</span>: Automatically identify upward, downward, or neutral trends in your cost data with statistical confidence.
                </p>
                <p>
                  <span className="font-medium text-foreground">Seasonality Analysis</span>: Discover recurring seasonal patterns in your data across quarterly, monthly, or yearly periods.
                </p>
                <p>
                  <span className="font-medium text-foreground">Forecasting</span>: Project future cost trends based on historical patterns with confidence intervals.
                </p>
                <p>
                  <span className="font-medium text-foreground">Growth Rate Calculation</span>: Calculate annualized growth rates to understand the pace of cost changes.
                </p>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Usage Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <span className="font-medium text-foreground">Filtering</span>: Use the region and building type filters to focus on specific segments of your data.
                </p>
                <p>
                  <span className="font-medium text-foreground">Time Periods</span>: Switch between yearly, quarterly, and monthly views to see different patterns.
                </p>
                <p>
                  <span className="font-medium text-foreground">Moving Average</span>: Enable this option to smooth out short-term fluctuations and highlight longer-term trends.
                </p>
                <p>
                  <span className="font-medium text-foreground">Date Range</span>: Use the brush tool below the chart to zoom in on specific time periods.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5">
            <Tabs defaultValue="trends" className="space-y-4">
              <TabsList>
                <TabsTrigger value="trends" className="flex items-center gap-1">
                  <LineChart className="h-4 w-4" />
                  Cost Trends
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  About Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="trends" className="space-y-4">
                <CostTrendAnalysis />
              </TabsContent>
              
              <TabsContent value="about" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Understanding Cost Trend Analysis</CardTitle>
                    <CardDescription>
                      How to interpret and use the trend analysis capabilities
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-blue-500" />
                        Trend Detection
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our trend detection algorithm uses linear regression analysis to identify statistically 
                        significant trends in your data. The confidence level indicates how sure we are about 
                        the detected trend, while the trend strength (R² value) shows how well the trend line 
                        fits the actual data points.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        Seasonality Analysis
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Seasonality refers to regular, predictable patterns that repeat over a specific time period. 
                        Our algorithm detects these patterns using autocorrelation function (ACF) analysis. When 
                        seasonality is detected, you'll see the cycle length (e.g., quarterly or monthly patterns) 
                        and can use this to forecast more accurately.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-green-500" />
                        Growth Rate Calculation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The growth rate shown is the Compound Annual Growth Rate (CAGR), which measures the 
                        constant rate at which costs have grown over the selected time period. This accounts for 
                        compounding effects and provides a clearer picture of long-term trends than simple 
                        percentage changes.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <PieChart className="h-4 w-4 text-purple-500" />
                        Forecasting
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Our forecasting model combines trend and seasonality components to predict future values. 
                        The shaded area represents the confidence interval – the range within which we expect the 
                        actual values to fall. Wider intervals indicate greater uncertainty in the prediction.
                      </p>
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200 mt-4">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Pro Tip</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        For the most accurate analysis, try to use at least 8-12 data points. Forecasts become 
                        less reliable the further they extend into the future. Always consider the confidence 
                        intervals when making decisions based on forecasts.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <CardTitle className="text-sm">Strategic Planning</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Use trend analysis to inform budgeting and resource allocation for future building projects.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    <CardTitle className="text-sm">Pattern Recognition</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Identify seasonal patterns and cyclical behavior in building costs to time purchases optimally.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <CardTitle className="text-sm">Growth Forecasting</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Anticipate future costs and growth rates to prepare accurate estimates for upcoming projects.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </VisualizationContextProvider>
  );
}