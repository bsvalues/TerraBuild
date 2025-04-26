import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./header";
import Footer from "./Footer";
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";

interface MainLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  hideFooter?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
}

export default function MainLayout({ 
  children, 
  pageTitle, 
  pageDescription,
  hideFooter = false,
  fullWidth = false,
  loading = false
}: MainLayoutProps) {
  const { isExpanded, toggleSidebar } = useSidebar();
  const { isLoading: authLoading } = useAuth();
  
  // Show loading state if either auth is loading or component-specific loading
  const isLoading = authLoading || loading;

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
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            isExpanded ? "ml-0 md:ml-56" : "ml-0 md:ml-16"
          )}
        >
          <main className="flex-1 overflow-auto p-4 md:p-6" 
            style={{ 
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {(pageTitle || pageDescription) && (
              <div className="mb-6">
                {pageTitle && <h1 className="text-2xl md:text-3xl font-bold text-[#243E4D]">{pageTitle}</h1>}
                {pageDescription && <p className="mt-2 text-gray-600">{pageDescription}</p>}
              </div>
            )}
            <div className={cn(
              "mx-auto",
              fullWidth ? "w-full" : "max-w-7xl"
            )}>
              {children}
            </div>
          </main>
          {!hideFooter && <Footer />}
        </div>
      </div>
    </div>
  );
}