import React, { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MainContent from "@/components/layout/MainContent";
import StatusCards from "@/components/dashboard/StatusCards";
import RepositoryCloneStatus from "@/components/dashboard/RepositoryCloneStatus";
import ConfigurationTab from "@/components/dashboard/ConfigurationTab";
import DevelopmentTools from "@/components/dashboard/DevelopmentTools";
import ApiManager from "@/components/dashboard/ApiManager";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ApplicationDetails from "@/components/dashboard/ApplicationDetails";
import BuildingCostCalculator from "@/components/dashboard/BuildingCostCalculator";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("configuration");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <MainContent 
        title="Mission Control Panel" 
        actionButton={{
          label: "Configure",
          icon: "ri-settings-3-line",
          onClick: () => console.log("Configure clicked")
        }}
      >
        <StatusCards />
        <RepositoryCloneStatus />
        
        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden mb-6">
          <div className="border-b border-neutral-200">
            <nav className="flex">
              <button 
                className={`px-4 py-3 font-medium text-sm ${activeTab === "configuration" ? "border-b-2 border-primary text-primary" : "text-neutral-500 hover:text-neutral-700"}`}
                onClick={() => setActiveTab("configuration")}
              >
                Configuration
              </button>
              <button 
                className={`px-4 py-3 font-medium text-sm ${activeTab === "api" ? "border-b-2 border-primary text-primary" : "text-neutral-500 hover:text-neutral-700"}`}
                onClick={() => setActiveTab("api")}
              >
                API Manager
              </button>
              <button 
                className={`px-4 py-3 font-medium text-sm ${activeTab === "devtools" ? "border-b-2 border-primary text-primary" : "text-neutral-500 hover:text-neutral-700"}`}
                onClick={() => setActiveTab("devtools")}
              >
                Dev Tools
              </button>
              <button 
                className={`px-4 py-3 font-medium text-sm ${activeTab === "monitoring" ? "border-b-2 border-primary text-primary" : "text-neutral-500 hover:text-neutral-700"}`}
                onClick={() => setActiveTab("monitoring")}
              >
                Monitoring
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === "configuration" && <ConfigurationTab />}
            {activeTab === "devtools" && <DevelopmentTools />}
            {activeTab === "api" && <ApiManager />}
            {activeTab === "monitoring" && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Monitoring & Tools</h2>
                <p className="text-neutral-600 mb-6">Monitoring tools and utilities for the BCBS Building Cost application.</p>
                <BuildingCostCalculator />
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions and Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <QuickActions />
          <RecentActivity />
          <ApplicationDetails />
        </div>
      </MainContent>
    </div>
  );
}
