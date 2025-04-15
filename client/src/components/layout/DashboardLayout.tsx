import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { BentonColors } from '@/components/BentonBranding';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WindowProvider } from '@/contexts/WindowContext';
import { cn } from "@/lib/utils";
import { useSidebar } from '@/contexts/SidebarContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

function DashboardLayoutContent({ children }: DashboardLayoutProps) {
  const { isLoading } = useAuth();
  const { isExpanded, toggleSidebar } = useSidebar();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
        <div className="p-6 bg-white rounded-lg shadow-lg flex flex-col items-center" 
          style={{ 
            perspective: '1000px',
            transformStyle: 'preserve-3d' 
          }}
        >
          <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-[#243E4D] to-[#29B7D3] flex items-center justify-center"
            style={{ transform: 'translateZ(10px)', boxShadow: '0 6px 16px -8px rgba(0, 0, 0, 0.2)' }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-[#243E4D] font-medium" style={{ transform: 'translateZ(5px)' }}>
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
      <TopNavbar toggleSidebar={toggleSidebar} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            isExpanded ? "ml-0" : "ml-0" // We're not shifting the content here but could if needed
          )}
        >
          <main className="flex-1 overflow-auto p-6" 
            style={{ 
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            <div className="relative" style={{ transform: 'translateZ(2px)' }}>
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <WindowProvider>
        <DashboardLayoutContent>
          {children}
        </DashboardLayoutContent>
      </WindowProvider>
    </SidebarProvider>
  );
}