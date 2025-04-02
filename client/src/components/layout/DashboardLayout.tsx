import React, { ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";
import Footer from "./Footer";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { BentonColors } from '@/components/BentonBranding';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
        <div className="p-6 bg-white rounded-lg shadow-lg flex flex-col items-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-[#243E4D] to-[#29B7D3] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <p className="text-[#243E4D] font-medium">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 overflow-auto p-6">{children}</main>
        <Footer />
      </div>
    </div>
  );
}