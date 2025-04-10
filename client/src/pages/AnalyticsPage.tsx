import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, LineChart, PieChart, TrendingUp, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';

/**
 * Analytics Page
 * 
 * This page provides analytics and visualizations for building cost data:
 * - Cost Trends: Timeline analysis of cost changes
 * - Regional Analysis: Geographic comparison of costs
 * - Building Type Analysis: Comparison across building categories
 * - Predictive Analysis: Forward-looking cost projections
 */
const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cost-trends');
  const [timeRange, setTimeRange] = useState('1-year');
  const [region, setRegion] = useState('all');
  const [buildingType, setBuildingType] = useState('all');
  
  // Mock data for visualizations
  const costTrendsData = [
    { month: 'Jan', value: 2350 },
    { month: 'Feb', value: 2400 },
    { month: 'Mar', value: 2200 },
    { month: 'Apr', value: 2500 },
    { month: 'May', value: 2700 },
    { month: 'Jun', value: 2900 },
    { month: 'Jul', value: 3100 },
    { month: 'Aug', value: 3200 },
    { month: 'Sep', value: 3150 },
    { month: 'Oct', value: 3300 },
    { month: 'Nov', value: 3400 },
    { month: 'Dec', value: 3500 },
  ];
  
  // Regional data for map visualization
  const regionalData = [
    { region: 'Eastern', value: 3200 },
    { region: 'Western', value: 3500 },
    { region: 'Northern', value: 3100 },
    { region: 'Southern', value: 3300 },
    { region: 'Central', value: 3400 },
  ];
  
  // Building type data for comparison
  const buildingTypeData = [
    { type: 'Residential', value: 3200 },
    { type: 'Commercial', value: 3900 },
    { type: 'Industrial', value: 4200 },
    { type: 'Agricultural', value: 2800 },
    { type: 'Special Purpose', value: 3700 },
  ];
  
  // Placeholder for visualization components
  const renderCostTrendsChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm h-[400px] flex items-center justify-center">
      <div className="text-center">
        <LineChart className="w-16 h-16 mx-auto mb-4 text-[#29B7D3]" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Cost Trends Visualization</h3>
        <p className="text-gray-500 mb-4">Interactive time series chart showing building cost trends over time</p>
        <Button size="sm" variant="outline">View Full Data</Button>
      </div>
    </div>
  );
  
  const renderRegionalAnalysisChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm h-[400px] flex items-center justify-center">
      <div className="text-center">
        <Map className="w-16 h-16 mx-auto mb-4 text-[#47AD55]" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Regional Cost Map</h3>
        <p className="text-gray-500 mb-4">Geographic heatmap showing building costs across different regions</p>
        <Button size="sm" variant="outline">View Full Data</Button>
      </div>
    </div>
  );
  
  const renderBuildingTypeChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm h-[400px] flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-[#7B61FF]" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Building Type Comparison</h3>
        <p className="text-gray-500 mb-4">Bar chart comparing costs across different building types and categories</p>
        <Button size="sm" variant="outline">View Full Data</Button>
      </div>
    </div>
  );
  
  const renderPredictiveAnalysisChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-sm h-[400px] flex items-center justify-center">
      <div className="text-center">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-[#F59E0B]" />
        <h3 className="text-lg font-medium text-gray-800 mb-2">Predictive Analysis</h3>
        <p className="text-gray-500 mb-4">Forecast charts showing projected building costs for future periods</p>
        <Button size="sm" variant="outline">View Full Data</Button>
      </div>
    </div>
  );
  
  // Filter controls
  const renderFilterControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger>
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-month">1 Month</SelectItem>
            <SelectItem value="3-months">3 Months</SelectItem>
            <SelectItem value="6-months">6 Months</SelectItem>
            <SelectItem value="1-year">1 Year</SelectItem>
            <SelectItem value="5-years">5 Years</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
        <Select value={region} onValueChange={setRegion}>
          <SelectTrigger>
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="eastern">Eastern</SelectItem>
            <SelectItem value="western">Western</SelectItem>
            <SelectItem value="northern">Northern</SelectItem>
            <SelectItem value="southern">Southern</SelectItem>
            <SelectItem value="central">Central</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Building Type</label>
        <Select value={buildingType} onValueChange={setBuildingType}>
          <SelectTrigger>
            <SelectValue placeholder="Select building type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
            <SelectItem value="agricultural">Agricultural</SelectItem>
            <SelectItem value="special">Special Purpose</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
  
  return (
    <LayoutWrapper>
      <MainContent title="Analytics">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold flex items-center">
              <BarChart3 className="mr-2 h-6 w-6 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and visualizations for building cost data
            </p>
          </div>
          
          {renderFilterControls()}
          
          <Tabs defaultValue="cost-trends" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="cost-trends">
                <LineChart className="h-4 w-4 mr-2" />
                Cost Trends
              </TabsTrigger>
              <TabsTrigger value="regional">
                <Map className="h-4 w-4 mr-2" />
                Regional Analysis
              </TabsTrigger>
              <TabsTrigger value="building-type">
                <BarChart3 className="h-4 w-4 mr-2" />
                Building Type
              </TabsTrigger>
              <TabsTrigger value="predictive">
                <TrendingUp className="h-4 w-4 mr-2" />
                Predictive Analysis
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="cost-trends" className="mt-0">
                {renderCostTrendsChart()}
              </TabsContent>
              
              <TabsContent value="regional" className="mt-0">
                {renderRegionalAnalysisChart()}
              </TabsContent>
              
              <TabsContent value="building-type" className="mt-0">
                {renderBuildingTypeChart()}
              </TabsContent>
              
              <TabsContent value="predictive" className="mt-0">
                {renderPredictiveAnalysisChart()}
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Summary of important analytics findings</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-[#47AD55] mr-2 mt-0.5" />
                    <span>Building costs have increased by an average of 5.8% over the past year</span>
                  </li>
                  <li className="flex items-start">
                    <Map className="h-5 w-5 text-[#29B7D3] mr-2 mt-0.5" />
                    <span>Eastern region shows the highest growth rate at 7.2% year-over-year</span>
                  </li>
                  <li className="flex items-start">
                    <BarChart3 className="h-5 w-5 text-[#7B61FF] mr-2 mt-0.5" />
                    <span>Commercial buildings show cost increases 1.5× residential rates</span>
                  </li>
                  <li className="flex items-start">
                    <PieChart className="h-5 w-5 text-[#F59E0B] mr-2 mt-0.5" />
                    <span>Material costs represent the largest contributing factor to increases</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Actions based on current analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-[#47AD55] flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-white text-xs">1</span>
                    </div>
                    <span>Review cost matrices for Eastern region to ensure accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-[#29B7D3] flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-white text-xs">2</span>
                    </div>
                    <span>Consider adjusting commercial building complexity factors</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-[#7B61FF] flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-white text-xs">3</span>
                    </div>
                    <span>Monitor material cost trends in the quarterly data analysis</span>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-[#F59E0B] flex items-center justify-center mr-2 mt-0.5">
                      <span className="text-white text-xs">4</span>
                    </div>
                    <span>Implement predictive analytics for agricultural building sectors</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
};

export default AnalyticsPage;