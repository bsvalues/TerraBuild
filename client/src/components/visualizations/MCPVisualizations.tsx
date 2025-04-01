/**
 * MCP Visualizations
 * 
 * This component demonstrates the use of the MCP Visualization Controller
 * with different visualization types that follow the Model Content Protocol.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MCPVisualizationController, useMCPVisualization } from './MCPVisualizationController';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Download, BarChart, Map, Network, TrendingUp } from 'lucide-react';

// Sample Building Types for the dropdown
const buildingTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'mixed_use', label: 'Mixed Use' }
];

// Component that uses the MCP context
function VisualizationContent() {
  const [activeTab, setActiveTab] = useState('regional');
  const { 
    filters, 
    setFilters, 
    regionalCostsQuery, 
    hierarchicalCostsQuery, 
    statisticalDataQuery,
    isProcessing,
    exportData
  } = useMCPVisualization();

  const handleExport = async (format: string) => {
    await exportData(format);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Visualization Controls</CardTitle>
          <CardDescription>Configure the visualization parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Building Type</label>
              <Select
                value={filters.buildingType}
                onValueChange={(value) => setFilters({ buildingType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Building Type" />
                </SelectTrigger>
                <SelectContent>
                  {buildingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Year Range</label>
              <div className="flex gap-2">
                <Select
                  value={filters.startYear.toString()}
                  onValueChange={(value) => setFilters({ startYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={filters.endYear.toString()}
                  onValueChange={(value) => setFilters({ endYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2020, 2021, 2022, 2023, 2024, 2025].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-2 flex items-end">
              <div className="flex gap-2 w-full">
                <Button 
                  className="flex-1"
                  onClick={() => setFilters(defaultFilters)}
                  variant="outline"
                >
                  Reset Filters
                </Button>
                
                <Button 
                  className="flex-1"
                  onClick={() => handleExport('csv')}
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isProcessing && (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Processing visualization data...</p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Regional Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="hierarchical" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            <span>Hierarchical Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="statistical" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Statistical Analysis</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <CardTitle>Regional Cost Analysis</CardTitle>
              <CardDescription>
                Cost comparison across different regions for {findBuildingTypeLabel(filters.buildingType)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {regionalCostsQuery.isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : regionalCostsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {(regionalCostsQuery.error as Error).message || 'Failed to load regional cost data'}
                  </AlertDescription>
                </Alert>
              ) : !regionalCostsQuery.data ? (
                <div className="text-center p-6 text-muted-foreground">
                  Select regions, counties, or states to view regional cost analysis
                </div>
              ) : (
                <div className="h-80 w-full">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Regional cost visualization will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hierarchical">
          <Card>
            <CardHeader>
              <CardTitle>Hierarchical Cost Analysis</CardTitle>
              <CardDescription>
                Hierarchical breakdown of costs for {findBuildingTypeLabel(filters.buildingType)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hierarchicalCostsQuery.isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : hierarchicalCostsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {(hierarchicalCostsQuery.error as Error).message || 'Failed to load hierarchical cost data'}
                  </AlertDescription>
                </Alert>
              ) : !hierarchicalCostsQuery.data ? (
                <div className="text-center p-6 text-muted-foreground">
                  No hierarchical cost data available
                </div>
              ) : (
                <div className="h-80 w-full">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Network className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Hierarchical cost visualization will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistical">
          <Card>
            <CardHeader>
              <CardTitle>Statistical Analysis</CardTitle>
              <CardDescription>
                Statistical correlations and trends for {findBuildingTypeLabel(filters.buildingType)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statisticalDataQuery.isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : statisticalDataQuery.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {(statisticalDataQuery.error as Error).message || 'Failed to load statistical data'}
                  </AlertDescription>
                </Alert>
              ) : !statisticalDataQuery.data ? (
                <div className="text-center p-6 text-muted-foreground">
                  No statistical data available
                </div>
              ) : (
                <div className="h-80 w-full">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <TrendingUp className="h-16 w-16 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Statistical correlation visualization will be displayed here
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Default filters for MCP Visualizations
const defaultFilters = {
  buildingType: 'residential',
  regions: [],
  counties: [],
  states: [],
  startYear: 2020,
  endYear: 2025
};

// Helper function to get building type label
function findBuildingTypeLabel(value: string): string {
  const type = buildingTypes.find(type => type.value === value);
  return type ? type.label : value;
}

// Main component that wraps the content with the controller
export function MCPVisualizations() {
  return (
    <MCPVisualizationController>
      <VisualizationContent />
    </MCPVisualizationController>
  );
}