import React from "react";
import { useAuth } from "@/hooks/use-auth";
import BuildingCostCalculator from "@/components/dashboard/BuildingCostCalculator";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";

export default function CalculatorPage() {
  const { user } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent 
        title="Building Cost Calculator" 
        actionButton={{
          label: "View History",
          icon: "ri-history-line",
          onClick: () => console.log("View history clicked")
        }}
      >
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
      </MainContent>
    </div>
  );
}