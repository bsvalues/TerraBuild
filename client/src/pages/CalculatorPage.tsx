import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calculator, BarChart3 } from 'lucide-react';
import BCBSCostCalculatorSimple from '@/components/BCBSCostCalculatorSimple';
import BCBSCostCalculatorAPI from '@/components/BCBSCostCalculatorAPI';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';

const CalculatorPage = () => {
  const [calculatorType, setCalculatorType] = useState<string>("api");

  return (
    <LayoutWrapper>
      <MainContent title="Calculator">
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Building Cost Calculator</h1>
            <p className="text-gray-600">
              Use this calculator to estimate building costs based on various parameters including
              building type, square footage, quality, and regional factors.
            </p>
          </div>

          <div className="mb-6">
            <Tabs value={calculatorType} onValueChange={setCalculatorType}>
              <TabsList className="w-full grid grid-cols-2 mb-6">
                <TabsTrigger value="api" className="py-3">
                  <div className="flex items-center">
                    <BarChart3 className="mr-2" size={18} />
                    <span>API-Based Calculator</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger value="client" className="py-3">
                  <div className="flex items-center">
                    <Calculator className="mr-2" size={18} />
                    <span>Client-Side Calculator</span>
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="api">
                <BCBSCostCalculatorAPI />
              </TabsContent>

              <TabsContent value="client">
                <BCBSCostCalculatorSimple />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">How to Use This Calculator</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Enter the square footage of the building</li>
              <li>Select the building type (Residential, Commercial, or Industrial)</li>
              <li>Choose the quality level of construction</li>
              <li>Select the region where the building is located</li>
              <li>Adjust the complexity and condition factors if needed</li>
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

            <div className="mt-4 pt-4 border-t border-blue-200">
              <h3 className="font-medium mb-1">Calculator Types:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>API-Based Calculator:</strong> Uses the Benton County Building Cost API for more 
                  accurate calculations including official regional factors and material breakdowns.
                </li>
                <li>
                  <strong>Client-Side Calculator:</strong> Uses local calculations and allows for 
                  additional material entries and customization.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
};

export default CalculatorPage;