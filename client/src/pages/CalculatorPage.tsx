import React from 'react';
import BCBSCostCalculator from '@/components/BCBSCostCalculator';

const CalculatorPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Building Cost Calculator</h1>
        <p className="text-gray-600">
          Use this calculator to estimate building costs based on various parameters including
          building type, square footage, quality, and regional factors.
        </p>
      </div>
      
      <BCBSCostCalculator />
      
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">How to Use This Calculator</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Enter the square footage of the building</li>
          <li>Select the building type (Residential, Commercial, or Industrial)</li>
          <li>Choose the quality level of construction</li>
          <li>Select the region where the building is located</li>
          <li>Adjust the complexity and condition factors if needed</li>
          <li>Add any specific building materials with quantities and unit prices</li>
          <li>Click "Calculate Cost" to see the estimated total cost</li>
        </ol>
        
        <div className="mt-4">
          <h3 className="font-medium mb-1">Understanding the Factors:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Complexity Factor:</strong> Adjusts the cost based on the building's complexity (higher for more complex designs)</li>
            <li><strong>Condition Factor:</strong> Adjusts cost based on the building's condition (lower for poor condition)</li>
            <li><strong>Regional Factor:</strong> Automatically applied based on the selected region</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;