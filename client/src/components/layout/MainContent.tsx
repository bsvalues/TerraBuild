import React, { useState } from "react";
import { RefreshCw, Settings, Maximize2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWindow } from "@/contexts/WindowContext";

export interface MainContentProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionButton?: {
    label: string;
    icon: string;
    onClick: () => void;
  };
}

export default function MainContent({ title, subtitle, children, actionButton }: MainContentProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { detachWindow, isDetached } = useWindow();
  
  // Unique id for this content panel
  const contentId = `window-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const detached = isDetached(contentId);

  const handleDetach = () => {
    // Create a simple representation of the content
    detachWindow({
      id: contentId,
      title: title,
      route: '/',
      content: `<div style="text-align: center; padding: 20px;">
        <h3>${title} content is loading...</h3>
        <p>This window will show ${title} content.</p>
      </div>`
    });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gradient-to-r from-[#f0f4f7] to-[#e6eef2]" 
      style={{ 
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      <header 
        className="bg-white border-b border-gray-200 py-4 px-6 shadow-sm relative overflow-hidden"
        style={{ 
          transformStyle: 'preserve-3d',
          boxShadow: '0 4px 12px -6px rgba(0, 0, 0, 0.1)'
        }}
      >
        {/* Decorative gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#243E4D] via-[#29B7D3] to-[#3CAB36]"></div>
        
        <div className="flex items-center justify-between">
          <div style={{ transform: 'translateZ(2px)' }}>
            <h1 className="text-xl font-semibold text-[#243E4D] flex items-center">
              {title}
              {subtitle && (
                <span className="ml-2 text-sm font-normal text-[#29B7D3]">({subtitle})</span>
              )}
            </h1>
            {subtitle && !subtitle.includes("(") && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-2" style={{ transform: 'translateZ(3px)' }}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-[#29B7D3] hover:bg-[#e8f8fb] transition-all flex items-center gap-1"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:text-[#29B7D3] hover:bg-[#e8f8fb] transition-all"
              onClick={handleDetach}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            
            {actionButton && (
              <Button
                variant="default"
                size="sm"
                className="bg-[#243E4D] hover:bg-[#243E4D]/90 text-white shadow-md transition-all flex items-center gap-1 overflow-hidden group"
                onClick={actionButton.onClick}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#29B7D3]/0 via-[#29B7D3]/30 to-[#29B7D3]/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out"></div>
                {actionButton.icon === 'ri-settings-3-line' ? (
                  <Settings className="h-4 w-4" />
                ) : (
                  <i className={`${actionButton.icon} mr-1`}></i>
                )}
                <span>{actionButton.label}</span>
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <div className="p-6">
        <div 
          className="relative"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: 'translateZ(1px)'
          }}
        >
          {children}
        </div>
      </div>
    </main>
  );
}
