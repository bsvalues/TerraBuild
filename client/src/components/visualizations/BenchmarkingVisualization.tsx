import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  VisualizationController, 
  useVisualization 
} from './VisualizationController';
import { VisualizationFilterControl } from './VisualizationFilterControl';
import { RegionalCostHeatmap } from './RegionalCostHeatmap';
import { HierarchicalCostVisualization } from './HierarchicalCostVisualization';
import { CorrelationAnalysis } from './CorrelationAnalysis';
import { VisualizationExporter } from './VisualizationExporter';

// Inner component that uses the visualization context
function BenchmarkingContent() {
  const { 
    filters,
    regionalCostsQuery,
    hierarchicalCostsQuery,
    statisticalDataQuery
  } = useVisualization();
  
  // Extract data and loading states from queries
  const regionalData = regionalCostsQuery.data?.counties || [];
  const isRegionalLoading = regionalCostsQuery.isLoading;
  
  const hierarchicalData = hierarchicalCostsQuery.data?.data || null;
  const isHierarchicalLoading = hierarchicalCostsQuery.isLoading;
  
  const statisticalData = statisticalDataQuery.data || { buildings: [], costs: [], correlations: null };
  const isStatisticalLoading = statisticalDataQuery.isLoading;
  
  // Handle county selection in heatmap
  const handleCountySelect = (county: string) => {
    console.log(`Selected county: ${county}`);
    // You could filter other visualizations based on this county
  };
  
  // Handle node selection in hierarchical view
  const handleNodeSelect = (nodePath: string[]) => {
    console.log(`Selected node path: ${nodePath.join('/')}`);
    // You could filter other visualizations based on this node
  };
  
  // Handle data point selection in correlation analysis
  const handleDataPointSelect = (buildingId: number | string) => {
    console.log(`Selected building: ${buildingId}`);
    // You could show more details about this building
  };
  
  return (
    <div className="space-y-6">
      <VisualizationFilterControl />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {filters.region} - {filters.buildingType} Building Costs
        </h2>
        <VisualizationExporter />
      </div>
      
      <Tabs defaultValue="heatmap" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="heatmap">Regional Heatmap</TabsTrigger>
          <TabsTrigger value="hierarchical">Hierarchical View</TabsTrigger>
          <TabsTrigger value="correlation">Statistical Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="heatmap" className="mt-4">
          <RegionalCostHeatmap
            data={regionalData}
            region={filters.region}
            buildingType={filters.buildingType}
            isLoading={isRegionalLoading}
            onCountySelect={handleCountySelect}
          />
        </TabsContent>
        
        <TabsContent value="hierarchical" className="mt-4">
          <HierarchicalCostVisualization
            data={hierarchicalData}
            isLoading={isHierarchicalLoading}
            onNodeSelect={handleNodeSelect}
          />
        </TabsContent>
        
        <TabsContent value="correlation" className="mt-4">
          <CorrelationAnalysis
            buildings={statisticalData.buildings || []}
            costs={statisticalData.costs || []}
            correlations={statisticalData.correlations}
            isLoading={isStatisticalLoading}
            onDataPointSelect={handleDataPointSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Benchmarking Visualization Component
 * 
 * Main container for all benchmarking visualizations
 */
export function BenchmarkingVisualization() {
  return (
    <VisualizationController>
      <BenchmarkingContent />
    </VisualizationController>
  );
}