import React, { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import TerraFusionLogo from '@/components/TerraFusionLogo';
import { Loader2, Sparkles } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/contexts/auth-context-fixed';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { toggle, isExpanded } = useSidebar();
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
        <div className="p-8 rounded-lg flex flex-col items-center">
          <div className="w-20 h-20 mb-6 flex items-center justify-center">
            <TerraFusionLogo variant="default" size="lg" />
          </div>
          <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-700/40 flex items-center justify-center border border-cyan-500/30 shadow-glow">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
          <p className="text-blue-100 font-medium mt-4 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-cyan-400" />
            <span>Initializing TerraFusion...</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-blue-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Header toggleSidebar={toggle} />
        
        <ScrollArea className="flex-1 bg-gradient-to-br from-blue-950 to-blue-900">
          <main className="container mx-auto max-w-7xl px-4 py-6">
            {children}
          </main>
        </ScrollArea>
        
        <footer className="py-3 px-4 border-t border-blue-800/30 bg-blue-950 text-center text-xs text-blue-400">
          <p>© {new Date().getFullYear()} TerraFusion Analytics. All rights reserved.</p>
          <p className="text-xs mt-1 text-blue-500/80">Property Valuation Platform v2.5.1</p>
        </footer>
      </div>
    </div>
  );
}