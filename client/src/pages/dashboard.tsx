import React, { useState, useEffect, useRef } from "react";
import MainContent from "@/components/layout/MainContent";
import { useWindow } from "@/contexts/WindowContext";
import { ExternalLink } from "lucide-react";
import QuickExportButton from "../components/QuickExportButton";
import StatusCards from "@/components/dashboard/StatusCards";
import RepositoryCloneStatus from "@/components/dashboard/RepositoryCloneStatus";
import ConfigurationTab from "@/components/dashboard/ConfigurationTab";
import DevelopmentTools from "@/components/dashboard/DevelopmentTools";
import ApiManager from "@/components/dashboard/ApiManager";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentActivity from "@/components/dashboard/RecentActivity";
import ApplicationDetails from "@/components/dashboard/ApplicationDetails";
import BuildingCostCalculator from "@/components/dashboard/BuildingCostCalculator";
import { CostMatrixManager } from "@/components/dashboard/CostMatrixManager";
import { CostComparisonWizard } from "@/components/dashboard/CostComparisonWizard";
import { CostFactorWeightSlider } from "@/components/dashboard/CostFactorWeightSlider";
import CostMatrixCompare from "@/components/dashboard/CostMatrixCompare";

// Defining the TabButton component with 3D effects and tear-away capability
interface TabButtonProps {
  id: string;
  title: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ id, title, icon, active, onClick }: TabButtonProps) {
  const { detachWindow, isDetached } = useWindow();
  const [isHovering, setIsHovering] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // We'll use client-side only code for the hover effect
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    
    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);
    
    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);
  
  const handleDetach = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const windowId = `tab-${id}`;
    detachWindow({
      id: windowId,
      title: `${title} - Benton County Cost Calculator`,
      route: `/${id}`,
      content: `<div style="text-align: center; padding: 20px;">
        <h3>${title} is loading...</h3>
        <p>This tab will appear in a separate window.</p>
      </div>`
    });
  };
  
  return (
    <button
      ref={buttonRef}
      data-tab-id={id}
      className={`
        relative px-4 py-3 font-medium text-sm flex items-center gap-1.5
        transition-all duration-200 overflow-hidden group
        ${active 
          ? 'text-[#243E4D] font-semibold' 
          : 'text-gray-500 hover:text-[#29B7D3]'
        }
      `}
      style={{
        transformStyle: 'preserve-3d',
        transform: active ? 'translateZ(2px)' : 'translateZ(0)',
        textShadow: active ? '0 0.5px 0 rgba(0,0,0,0.05)' : 'none'
      }}
      onClick={onClick}
    >
      {/* Background hover effect */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-r from-[#e8f8fb]/0 via-[#e8f8fb]/90 to-[#e8f8fb]/0
          transition-opacity duration-700 opacity-0 group-hover:opacity-100
          transform -translate-x-full group-hover:translate-x-full
        `} 
        style={{
          transformStyle: 'preserve-3d',
          transform: `translateZ(-1px) ${isHovering ? 'translateX(100%)' : 'translateX(-100%)'}`,
          opacity: isHovering ? 0.8 : 0,
          transition: 'transform 0.7s ease-out, opacity 0.3s ease-out'
        }}
      />
      
      {/* Tab content with icon */}
      <span className="inline-block mr-1 transform transition-transform group-hover:scale-110" style={{ 
        transformStyle: 'preserve-3d', 
        transform: active ? 'translateZ(1px)' : 'translateZ(0)' 
      }}>
        {icon}
      </span>
      
      <span style={{ 
        transformStyle: 'preserve-3d', 
        transform: active ? 'translateZ(1px)' : 'translateZ(0)' 
      }}>
        {title}
      </span>
      
      {/* The tearaway button - only show on hover */}
      <span
        className={`
          ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150
          text-gray-400 hover:text-[#243E4D] p-0.5 rounded-full inline-flex
          hover:bg-[#e8f8fb] transform transition-transform hover:scale-110 cursor-pointer
        `}
        onClick={handleDetach}
        title="Open in new window"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'translateZ(1px)'
        }}
      >
        <ExternalLink className="h-3 w-3" />
      </span>
      
      {/* Active indicator - only visible for active tab */}
      {active && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#29B7D3]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(1px)',
            boxShadow: '0 1px 2px rgba(41, 183, 211, 0.2)'
          }}
        />
      )}
    </button>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    transform: 'translateX(0)',
  });
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  
  // Update the indicator position whenever the active tab changes
  useEffect(() => {
    const updateIndicator = () => {
      const activeTabElement = document.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement;
      const tabsContainer = tabsContainerRef.current;
      
      if (activeTabElement && tabsContainer) {
        const tabRect = activeTabElement.getBoundingClientRect();
        const containerRect = tabsContainer.getBoundingClientRect();
        
        setIndicatorStyle({
          width: tabRect.width,
          transform: `translateX(${tabRect.left - containerRect.left}px)`,
        });
      }
    };
    
    // Run once on mount and when activeTab changes
    updateIndicator();
    
    // Also run on window resize
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab]);
  
  return (
    <div className="flex h-screen overflow-hidden">
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
          <div className="border-b border-neutral-200 relative" ref={tabsContainerRef}>
            <div
              className="absolute bottom-0 left-0 h-[2px] bg-[#29B7D3] transition-all duration-300 z-10"
              style={{
                width: indicatorStyle.width,
                transform: indicatorStyle.transform,
                transformStyle: 'preserve-3d',
                boxShadow: '0 1px 4px rgba(41, 183, 211, 0.2)'
              }}
            />
            <nav className="flex relative" style={{ perspective: '1000px' }}>
              <TabButton 
                id="calculator"
                active={activeTab === "calculator"}
                onClick={() => setActiveTab("calculator")}
                icon="🧮"
                title="Cost Calculator"
              />
              <TabButton 
                id="comparison"
                active={activeTab === "comparison"}
                onClick={() => setActiveTab("comparison")}
                icon="📊"
                title="Cost Comparison"
              />
              <TabButton 
                id="costfactors"
                active={activeTab === "costfactors"}
                onClick={() => setActiveTab("costfactors")}
                icon="⚖️"
                title="Cost Factors"
              />
              <TabButton 
                id="costmatrix"
                active={activeTab === "costmatrix"}
                onClick={() => setActiveTab("costmatrix")}
                icon="🔢"
                title="Cost Matrix"
              />
              <TabButton 
                id="matrixcompare"
                active={activeTab === "matrixcompare"}
                onClick={() => setActiveTab("matrixcompare")}
                icon="🔄"
                title="Matrix Compare"
              />
              <TabButton 
                id="configuration"
                active={activeTab === "configuration"}
                onClick={() => setActiveTab("configuration")}
                icon="⚙️"
                title="Configuration"
              />
              <TabButton 
                id="api"
                active={activeTab === "api"}
                onClick={() => setActiveTab("api")}
                icon="🔌"
                title="API Manager"
              />
              <TabButton 
                id="devtools"
                active={activeTab === "devtools"}
                onClick={() => setActiveTab("devtools")}
                icon="🛠️"
                title="Dev Tools"
              />
              <TabButton 
                id="monitoring"
                active={activeTab === "monitoring"}
                onClick={() => setActiveTab("monitoring")}
                icon="📈"
                title="Monitoring"
              />
            </nav>
          </div>
          
          <div 
            className="p-6" 
            style={{ 
              transformStyle: 'preserve-3d',
              perspective: '1000px' 
            }}
          >
            {activeTab === "calculator" && (
              <div 
                className="transition-all duration-300 bg-white rounded-lg p-6 shadow-sm" 
                style={{ 
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(4px) rotateX(0.5deg)', 
                  boxShadow: '0 10px 30px -15px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.05)' 
                }}
              >
                <h2 className="text-lg font-semibold text-[#243E4D] mb-4 flex items-center gap-2">
                  <span 
                    className="inline-block"
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(2px)'
                    }}
                  >
                    🧮
                  </span>
                  <span
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(1px)'
                    }}
                  >
                    Building Cost Calculator
                  </span>
                </h2>
                <p className="text-neutral-600 mb-6">Calculate building costs based on region, building type, square footage, and complexity.</p>
                <div 
                  style={{ 
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(2px)'
                  }}
                >
                  <div className="mb-4 flex justify-end">
                    <QuickExportButton 
                      contentSelector=".dashboard-content" 
                      filename={`benton-county-cost-calculator-${new Date().toISOString().split('T')[0]}`}
                    />
                  </div>
                  <div className="dashboard-content">
                    <BuildingCostCalculator />
                  </div>
                </div>
              </div>
            )}
            {activeTab === "comparison" && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Building Cost Comparison Wizard</h2>
                <p className="text-neutral-600 mb-6">Compare multiple cost calculation scenarios side-by-side for better decision making.</p>
                <CostComparisonWizard />
              </div>
            )}
            {activeTab === "costfactors" && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Cost Factor Weighting</h2>
                <p className="text-neutral-600 mb-6">Customize how different cost factors influence building assessments for Benton County.</p>
                <CostFactorWeightSlider />
              </div>
            )}
            {activeTab === "costmatrix" && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Cost Matrix Manager</h2>
                <p className="text-neutral-600 mb-6">Manage cost matrix entries for Benton County, Washington building assessment.</p>
                <CostMatrixManager />
              </div>
            )}
            {activeTab === "matrixcompare" && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Cost Matrix Comparison</h2>
                <p className="text-neutral-600 mb-6">Compare cost matrices across different years to analyze trends and variations.</p>
                <CostMatrixCompare />
              </div>
            )}
            {activeTab === "configuration" && <ConfigurationTab />}
            {activeTab === "devtools" && <DevelopmentTools />}
            {activeTab === "api" && <ApiManager />}
            {activeTab === "monitoring" && (
              <div>
                <h2 className="text-lg font-semibold text-neutral-600 mb-4">Monitoring & Tools</h2>
                <p className="text-neutral-600 mb-6">Monitoring tools and utilities for the BCBS Building Cost application.</p>
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
