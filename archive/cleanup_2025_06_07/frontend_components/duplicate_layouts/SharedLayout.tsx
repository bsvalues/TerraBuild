import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from "@/lib/utils";

interface SharedLayoutProps {
  children: ReactNode;
}

export default function SharedLayout({ children }: SharedLayoutProps) {
  const { isExpanded, toggleSidebar } = useSidebar();

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
          <main className="flex-1 overflow-auto" 
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