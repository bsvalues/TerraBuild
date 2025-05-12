import React from 'react';
import { CostFactorTable } from '../components/CostFactorTable';

/**
 * Cost Factor Tables Page
 * 
 * Displays and manages cost factor tables for different sources
 */
export default function CostFactorTablesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Cost Factor Tables</h1>
        <p className="text-gray-500 mb-6">
          View and manage the cost factors used in building cost calculations. 
          Toggle between Marshall & Swift and RS Means data sources.
        </p>
        
        <div className="grid gap-6">
          <CostFactorTable />
        </div>
      </div>
    </div>
  );
}