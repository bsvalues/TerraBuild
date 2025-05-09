import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Building2,
  ChevronsLeft,
  ChevronsRight,
  Home,
  ImageDown,
  Layers,
  Map,
  Menu,
  Building,
  Calculator,
  AreaChart,
  Files,
  Upload,
  Settings,
  HelpCircle,
  History,
  BookOpen
} from 'lucide-react';
import TerraFusionLogo from '@/components/TerraFusionLogo';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const [location] = useLocation();
  const { isExpanded, toggle } = useSidebar();

  const mainNavItems = [
    {
      title: "Home",
      href: "/",
      icon: Home
    },
    {
      title: "Dashboards",
      href: "/dashboards",
      icon: BarChart3
    },
    {
      title: "Properties",
      href: "/properties",
      icon: Building
    },
    {
      title: "Matrix Explorer",
      href: "/matrix",
      icon: Layers
    },
    {
      title: "Valuation Maps",
      href: "/maps",
      icon: Map
    }
  ];

  const toolsNavItems = [
    {
      title: "Cost Calculator",
      href: "/cost-calculator",
      icon: Calculator
    },
    {
      title: "Trend Analysis",
      href: "/trend-analysis",
      icon: AreaChart
    },
    {
      title: "Report Generator",
      href: "/reports",
      icon: Files
    },
    {
      title: "Data Import",
      href: "/import",
      icon: Upload
    }
  ];

  const NavItem = ({ 
    href, 
    icon: Icon, 
    title 
  }: { 
    href: string; 
    icon: React.ElementType; 
    title: string;
  }) => {
    const isActive = location === href;
    
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href}>
              <Button
                variant="ghost"
                size={isExpanded ? "default" : "icon"}
                className={cn(
                  "w-full mb-1 justify-start text-blue-400",
                  isActive 
                    ? "bg-blue-900/60 text-blue-200 hover:text-blue-100" 
                    : "hover:bg-blue-900/40 hover:text-blue-300"
                )}
              >
                <Icon className={cn("h-5 w-5", isExpanded ? "mr-3" : "")} />
                {isExpanded && <span>{title}</span>}
              </Button>
            </Link>
          </TooltipTrigger>
          {!isExpanded && (
            <TooltipContent side="right">
              {title}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div
      className={cn(
        "h-screen bg-gradient-to-b from-blue-950 to-blue-900 border-r border-blue-800/40 py-2 transition-all duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex justify-between items-center px-3 mb-6">
        {isExpanded ? (
          <Link href="/">
            <a className="flex items-center gap-2 text-xl font-semibold">
              <TerraFusionLogo variant="default" size="md" />
            </a>
          </Link>
        ) : (
          <Link href="/">
            <a className="flex justify-center w-full">
              <TerraFusionLogo variant="circular" size="md" />
            </a>
          </Link>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/40"
        >
          {isExpanded ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="px-3 py-2">
          {isExpanded && (
            <div className="mb-1 px-4 text-xs font-semibold text-blue-400/70 uppercase tracking-wider">
              Main
            </div>
          )}
          {mainNavItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              title={item.title} 
            />
          ))}
          
          {isExpanded && (
            <div className="mt-6 mb-1 px-4 text-xs font-semibold text-blue-400/70 uppercase tracking-wider">
              Tools
            </div>
          )}
          {!isExpanded && <div className="my-6 border-t border-blue-800/40" />}
          
          {toolsNavItems.map((item) => (
            <NavItem 
              key={item.href} 
              href={item.href} 
              icon={item.icon} 
              title={item.title} 
            />
          ))}
          
          {isExpanded && (
            <div className="mt-6 mb-1 px-4 text-xs font-semibold text-blue-400/70 uppercase tracking-wider">
              Support
            </div>
          )}
          {!isExpanded && <div className="my-6 border-t border-blue-800/40" />}
          
          <NavItem href="/settings" icon={Settings} title="Settings" />
          <NavItem href="/documentation" icon={BookOpen} title="Documentation" />
          <NavItem href="/history" icon={History} title="History" />
          <NavItem href="/help" icon={HelpCircle} title="Help & Support" />
        </div>
      </ScrollArea>
      
      {isExpanded && (
        <div className="mt-auto px-3 py-4 border-t border-blue-800/40">
          <div className="rounded-md bg-blue-900/40 p-3">
            <p className="text-sm text-blue-300 mb-2">TerraFusion v2.5.1</p>
            <div className="text-xs text-blue-400 mb-3">
              © 2025 TerraFusion Analytics
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-blue-300 border-blue-700 bg-blue-900/60 hover:bg-blue-900/80"
            >
              Check for Updates
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}