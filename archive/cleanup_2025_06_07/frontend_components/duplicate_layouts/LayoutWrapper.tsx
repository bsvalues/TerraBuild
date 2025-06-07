import React, { ReactNode } from "react";
import TopNavbar from "./TopNavbar";
import Footer from "./Footer";

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]">
      <TopNavbar />
      <div className="flex-1 flex flex-col transition-all duration-300">
        {children}
        <Footer />
      </div>
    </div>
  );
}