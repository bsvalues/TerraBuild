import React, { ReactNode, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./header";
import Footer from "./Footer";
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDataFlow } from "@/contexts/DataFlowContext";
import { AnimatePresence, motion } from "framer-motion";

interface MainLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  hideFooter?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  isLanding?: boolean;
  error?: {
    title?: string;
    message: string;
    type?: 'error' | 'warning';
  };
  breadcrumbs?: { label: string; href?: string }[];
  showDataFlow?: boolean;
  trackPageView?: boolean;
}

export default function MainLayout({ 
  children, 
  pageTitle, 
  pageDescription,
  hideFooter = false,
  fullWidth = false,
  loading = false,
  isLanding = false,
  error,
  breadcrumbs,
  showDataFlow = false,
  trackPageView = true
}: MainLayoutProps) {
  const { isExpanded } = useSidebar();
  const { isLoading: authLoading } = useAuth();
  const { trackUserActivity } = useDataFlow();
  
  // Show loading state if either auth is loading or component-specific loading
  const isLoading = authLoading || loading;

  // Track page view in the data flow system
  useEffect(() => {
    if (trackPageView && pageTitle) {
      trackUserActivity(`Viewed page: ${pageTitle}`);
    }
  }, [pageTitle, trackPageView, trackUserActivity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white rounded-lg shadow-lg flex flex-col items-center" 
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
            Loading TerraBuild...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
      <Header isLanding={isLanding} />
      <div className="flex flex-1 overflow-hidden">
        {!isLanding && <Sidebar />}
        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300",
            !isLanding && (isExpanded ? "ml-0 md:ml-56" : "ml-0 md:ml-16")
          )}
        >
          <main className="flex-1 overflow-auto p-4 md:p-6" 
            style={{ 
              perspective: '1000px',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Error/Warning notifications */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6"
                >
                  <Alert variant={error.type === 'warning' ? 'default' : 'destructive'}>
                    {error.type === 'warning' ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {error.title && <AlertTitle>{error.title}</AlertTitle>}
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          
            {/* Page header with title and description */}
            {(pageTitle || pageDescription) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                {pageTitle && <h1 className="text-2xl md:text-3xl font-bold text-[#243E4D]">{pageTitle}</h1>}
                {pageDescription && <p className="mt-2 text-gray-600">{pageDescription}</p>}
              </motion.div>
            )}
            
            {/* Main content */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "mx-auto",
                fullWidth ? "w-full" : "max-w-7xl"
              )}
            >
              {children}
            </motion.div>
          </main>
          {!hideFooter && <Footer />}
        </div>
      </div>
    </div>
  );
}