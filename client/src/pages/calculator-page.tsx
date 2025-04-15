import React, { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import BuildingCostCalculator from "@/components/dashboard/BuildingCostCalculator";
import { CalculationHistory } from "@/components/dashboard/CalculationHistory";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Calculator } from "lucide-react";

export default function CalculatorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent 
        title="Building Cost Calculator" 
        subtitle="Calculate and track building costs across different regions and building types"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="calculator" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Calculator
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Calculation History
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="calculator" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Cost Calculator</h2>
                <p className="text-neutral-600 mb-6">
                  Calculate construction costs for various building types across different regions.
                  Adjust parameters like square footage and complexity to get accurate estimates.
                </p>
                <BuildingCostCalculator />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            <CalculationHistory />
          </TabsContent>
        </Tabs>
      </MainContent>
    </div>
  );
}