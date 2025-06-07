import React, { useState } from 'react';
import TerraFusionHeader from './TerraFusionHeader';
import TerraFusionSidebar from './TerraFusionSidebar';

interface TerraFusionLayoutProps {
  children: React.ReactNode;
}

const TerraFusionLayout: React.FC<TerraFusionLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <TerraFusionHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <TerraFusionSidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
        
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
          <div className="h-full p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TerraFusionLayout;