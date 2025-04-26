import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, BarChart3, Info } from 'lucide-react';
import BCBSCostCalculatorSimple from '@/components/BCBSCostCalculatorSimple';
import BCBSCostCalculatorAPI from '@/components/BCBSCostCalculatorAPI';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CalculatorPage = () => {
  const [calculatorType, setCalculatorType] = useState<string>("api");
  const [loading, setLoading] = useState(false);

  return (
    <MainLayout loading={loading}>
      <div className="space-y-6">
        <PageHeader
          title="TerraBuild Cost Calculator"
          description="Estimate building costs based on various parameters including building type, square footage, quality, and regional factors."
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Cost Calculator", href: "/calculator" }
          ]}
          helpText="The TerraBuild Cost Calculator allows you to estimate building costs with precision using the latest data from Benton County."
        />

        <div className="space-y-6">
          <Tabs value={calculatorType} onValueChange={setCalculatorType} className="space-y-6">
            <TabsList className="w-full grid grid-cols-2 max-w-md mx-auto">
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

            <TabsContent value="api" className="mt-6">
              <BCBSCostCalculatorAPI />
            </TabsContent>

            <TabsContent value="client" className="mt-6">
              <BCBSCostCalculatorSimple />
            </TabsContent>
          </Tabs>
          
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                <Info className="h-5 w-5 text-blue-500 mr-2" />
                How to Use This Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 text-[#243E4D]">Step-by-Step Instructions:</h3>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Enter the square footage of the building</li>
                  <li>Select the building type (Residential, Commercial, or Industrial)</li>
                  <li>Choose the quality level of construction</li>
                  <li>Select the region where the building is located</li>
                  <li>Adjust the complexity and condition factors if needed</li>
                  <li>Click "Calculate Cost" to see the estimated total cost</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-[#243E4D]">Understanding the Factors:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Complexity Factor:</strong> Adjusts the cost based on the building's complexity (higher for more complex designs)</li>
                  <li><strong>Condition Factor:</strong> Adjusts cost based on the building's condition (lower for poor condition)</li>
                  <li><strong>Regional Factor:</strong> Automatically applied based on the selected region</li>
                </ul>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2 text-[#243E4D]">Calculator Types:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Alert variant="default" className="bg-[#e6f7fb] border-[#29B7D3]/30">
                    <AlertTitle className="text-[#243E4D]">API-Based Calculator</AlertTitle>
                    <AlertDescription>
                      Uses the Benton County Building Cost API for more accurate calculations including official regional factors and material breakdowns.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="default" className="bg-[#f0f4f7] border-gray-200">
                    <AlertTitle className="text-[#243E4D]">Client-Side Calculator</AlertTitle>
                    <AlertDescription>
                      Uses local calculations and allows for additional material entries and customization without requiring server connectivity.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CalculatorPage;