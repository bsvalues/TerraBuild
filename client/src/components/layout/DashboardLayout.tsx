import React, { ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import TerraFusionLogo from '@/components/TerraFusionLogo';
import { Loader2, Sparkles } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { toggle, isExpanded } = useSidebar();

  return (
    <div className="flex h-screen bg-blue-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Header toggleSidebar={toggle} />
        <Navbar />
        
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