import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import BentonBranding from '@/components/BentonBranding';
import TaskNavigation from '@/components/layout/TaskNavigation';
import {
  ChevronLeft,
  ChevronRight,
  Pin,
  PinOff,
} from "lucide-react";
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from "@/hooks/use-auth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const { isExpanded, isPinned, toggleExpanded, togglePinned, expandSidebar, collapseSidebar } = useSidebar();
  const [autoHideEnabled, setAutoHideEnabled] = useState(true);
  
  const handleMouseEnter = () => {
    expandSidebar();
  };
  
  const handleMouseLeave = () => {
    if (!isPinned) {
      collapseSidebar();
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 bg-white relative z-20",
        isExpanded ? "w-56" : "w-16",
        "border-r border-gray-200 overflow-hidden",
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        boxShadow: '0 4px 20px -10px rgba(0, 0, 0, 0.1), 0 2px 8px -4px rgba(0, 0, 0, 0.12)',
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* 3D styled toggle button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute top-3 right-3 z-50 h-6 w-6 rounded-full shadow-md transition-all border border-gray-100",
          "hover:bg-[#e8f8fb] hover:border-[#29B7D3]/30",
          "focus:outline-none focus:ring-2 focus:ring-[#29B7D3]/30 focus:ring-offset-0",
          "bg-white text-gray-600",
          isPinned ? "opacity-100" : "opacity-70 hover:opacity-100"
        )}
        onClick={toggleExpanded}
        style={{
          transform: 'translateZ(5px)',
          boxShadow: '0 2px 8px -4px rgba(0, 0, 0, 0.15)',
        }}
      >
        {isExpanded ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Pin/Auto-hide controls */}
      {isExpanded && (
        <div className="absolute top-14 right-3 z-50 flex flex-col space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 rounded-full shadow-sm transition-all border",
                    isPinned 
                      ? "bg-[#e8f8fb] text-[#29B7D3] border-[#29B7D3]/30" 
                      : "bg-white text-gray-500 border-gray-100 opacity-70 hover:opacity-100"
                  )}
                  onClick={togglePinned}
                  style={{
                    transform: 'translateZ(5px)',
                  }}
                >
                  {isPinned ? (
                    <Pin className="h-3.5 w-3.5" />
                  ) : (
                    <PinOff className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{isPinned ? 'Unpin sidebar' : 'Pin sidebar'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Auto-hide toggle in sidebar footer */}
      {isExpanded && (
        <div className="absolute bottom-4 left-0 right-0 px-4 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-hide" className="text-xs text-gray-500">Auto-hide</Label>
            <Switch
              id="auto-hide"
              checked={autoHideEnabled}
              onCheckedChange={setAutoHideEnabled}
              className="scale-75 data-[state=checked]:bg-[#29B7D3]"
            />
          </div>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-120px)]">
        <div className="py-4">
          {/* App branding and workspace label */}
          <div className="px-4 mb-4 flex items-center">
            {isExpanded ? (
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[#243E4D]">TerraBuild</span>
                <span className="text-xs text-gray-500">Benton County Assessor</span>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <BentonBranding variant="icon-only" size={32} />
              </div>
            )}
          </div>
          
          {/* Use the new TaskNavigation component */}
          <TaskNavigation className={isExpanded ? "" : "px-0"} />
        </div>
      </ScrollArea>
      
      {/* Bottom empty space for auto-hide toggle */}
      <div className="h-14"></div>
    </div>
  );
}