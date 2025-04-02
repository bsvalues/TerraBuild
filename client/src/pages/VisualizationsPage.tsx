import React from 'react';
import DataVisualization from '../components/DataVisualization';

/**
 * Visualizations Page Component
 * 
 * This page displays interactive data visualizations for building cost data
 * including time series analysis, regional comparisons, building type comparisons,
 * and cost breakdowns.
 */
const VisualizationsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Data Visualizations</h1>
        <p className="text-gray-500">
          Explore interactive visualizations and analytics for building cost data
        </p>
      </div>
      
      <DataVisualization />
    </div>
  );
};

export default VisualizationsPage;