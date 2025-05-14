import React from 'react';
import RegionValidationTester from '../../components/diagnostic/RegionValidationTester';

const DiagnosticPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Benton County Diagnostic Tools</h1>
      
      <div className="mb-6">
        <p className="text-gray-600">
          These diagnostic tools help validate and test the enhanced capabilities
          of the TerraBuild system for Benton County, focusing on region-specific 
          validation, cost matrix analysis, and agent functionality.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <RegionValidationTester />
        </div>
        
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Cost Matrix Validation</h2>
          <p className="text-gray-600 mb-4">
            Test the Data Quality Agent's ability to validate cost matrix data and detect anomalies.
          </p>
          <div className="p-8 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
            <p className="text-gray-500">Coming Soon</p>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">System Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Data Quality Agent</h3>
            <div className="flex items-center">
              <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
              <span className="text-green-700 font-medium">Active</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Handles region validation, cost data quality, and anomaly detection
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Compliance Agent</h3>
            <div className="flex items-center">
              <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
              <span className="text-green-700 font-medium">Active</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Manages regulation compliance and standards enforcement
            </p>
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Cost Analysis Agent</h3>
            <div className="flex items-center">
              <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
              <span className="text-green-700 font-medium">Active</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Performs cost estimates and comparative analysis
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;