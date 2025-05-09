import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useSidebarState } from '@/hooks/useSidebarState';
import {
  ChevronLeft, ChevronRight,
  Home, Calculator, BarChart2,
  HelpCircle, Settings, Users, 
  Map, FileText, Database, Search,
  Sparkles, Gauge, Brain, LineChart,
  UploadCloud, Download, Layers, 
  FileSpreadsheet
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TerraFusionLogo from '../TerraFusionLogo';

export default function Sidebar() {
  const { user } = useAuth();
  const { isExpanded, toggle } = useSidebarState();
  const [location] = useLocation();

  const isActiveRoute = (path: string) => {
    if (path === "/") return location === path;
    return location.startsWith(path);
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-blue-900/30 bg-gradient-to-b from-blue-950 to-blue-900 transition-all duration-300 overflow-hidden",
        isExpanded ? "w-[240px]" : "w-[68px]"
      )}
    >
      <div className="flex justify-between items-center p-3 h-16">
        {isExpanded ? (
          <div className="flex items-center pl-2">
            <TerraFusionLogo variant="square" size="sm" />
            <span className="ml-2 text-lg font-semibold text-white">TerraFusion</span>
          </div>
        ) : (
          <div className="mx-auto">
            <TerraFusionLogo variant="square" size="sm" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className={cn(
            "text-blue-300 hover:text-cyan-300 hover:bg-blue-800/50",
            isExpanded ? "ml-auto" : "absolute right-2 opacity-0 group-hover:opacity-100"
          )}
        >
          {isExpanded ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button>
      </div>

      <Separator className="bg-blue-900/50" />

      <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
        <TooltipProvider delayDuration={0}>
          <div className="space-y-1 py-1">
            {!isExpanded && (
              <div className="h-8 w-full flex items-center justify-center my-3">
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                  <span className="text-xs font-medium text-cyan-500">TF</span>
                </div>
              </div>
            )}

            {isExpanded && (
              <h3 className="mb-2 px-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Main Menu
              </h3>
            )}
            
            <NavItem
              icon={<Home className="h-5 w-5" />}
              title="Dashboard"
              path="/"
              isActive={isActiveRoute("/")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<Search className="h-5 w-5" />}
              title="Property Search"
              path="/properties"
              isActive={isActiveRoute("/properties")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<Calculator className="h-5 w-5" />}
              title="Cost Calculator"
              path="/calculator"
              isActive={isActiveRoute("/calculator")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<Brain className="h-5 w-5" />}
              title="AI Cost Wizard"
              path="/ai-wizard"
              isActive={isActiveRoute("/ai-wizard")}
              isCollapsed={!isExpanded}
              badge="New"
            />
            
            {isExpanded && (
              <h3 className="mt-5 mb-2 px-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Analysis
              </h3>
            )}
            
            <NavItem
              icon={<BarChart2 className="h-5 w-5" />}
              title="Analytics Dashboard"
              path="/analytics"
              isActive={isActiveRoute("/analytics")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<LineChart className="h-5 w-5" />}
              title="Cost Trends"
              path="/cost-trends"
              isActive={isActiveRoute("/cost-trends")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<Map className="h-5 w-5" />}
              title="Geo Visualization"
              path="/visualization"
              isActive={isActiveRoute("/visualization")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<Layers className="h-5 w-5" />}
              title="Cost Comparison"
              path="/comparison"
              isActive={isActiveRoute("/comparison")}
              isCollapsed={!isExpanded}
            />
            
            {isExpanded && (
              <h3 className="mt-5 mb-2 px-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Data Management
              </h3>
            )}
            
            <NavItem
              icon={<Database className="h-5 w-5" />}
              title="Cost Matrix"
              path="/cost-matrix"
              isActive={isActiveRoute("/cost-matrix")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<UploadCloud className="h-5 w-5" />}
              title="Import Data"
              path="/import"
              isActive={isActiveRoute("/import")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<FileText className="h-5 w-5" />}
              title="Reports"
              path="/reports"
              isActive={isActiveRoute("/reports")}
              isCollapsed={!isExpanded}
            />
            <NavItem
              icon={<Download className="h-5 w-5" />}
              title="Export & Share"
              path="/export"
              isActive={isActiveRoute("/export")}
              isCollapsed={!isExpanded}
            />
          </div>

          {user?.role === "admin" && (
            <div className="pt-4">
              {isExpanded && (
                <h3 className="mb-2 px-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Administration
                </h3>
              )}
              <NavItem
                icon={<Users className="h-5 w-5" />}
                title="User Management"
                path="/admin/users"
                isActive={isActiveRoute("/admin/users")}
                isCollapsed={!isExpanded}
              />
              <NavItem
                icon={<Settings className="h-5 w-5" />}
                title="System Settings"
                path="/admin/settings"
                isActive={isActiveRoute("/admin/settings")}
                isCollapsed={!isExpanded}
              />
            </div>
          )}
        </TooltipProvider>
      </div>

      <Separator className="bg-blue-900/50" />

      <div className="p-3">
        <TooltipProvider delayDuration={0}>
          <NavItem
            icon={<HelpCircle className="h-5 w-5" />}
            title="Help & Support"
            path="/help"
            isActive={isActiveRoute("/help")}
            isCollapsed={!isExpanded}
          />
        </TooltipProvider>
        
        {isExpanded && (
          <div className="pt-2">
            <div className="flex items-center space-x-3 mt-3 bg-blue-900/30 p-2 rounded-md border border-blue-800/50">
              <div className="h-8 w-8 flex-shrink-0">
                <div className="h-full w-full rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/30 flex items-center justify-center border border-cyan-500/20 shadow-glow-sm">
                  <span className="text-xs font-medium text-cyan-500">AI</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-blue-200 font-medium block">TerraFusion</span>
                <span className="text-xs text-blue-400 block">v2.5.1 Pro</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  title: string;
  path: string;
  isActive: boolean;
  isCollapsed: boolean;
  badge?: string;
}

function NavItem({ icon, title, path, isActive, isCollapsed, badge }: NavItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={path}>
          <a
            className={cn(
              "flex h-9 items-center rounded-md px-3 text-sm transition-colors relative group",
              isActive
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/20"
                : "text-blue-300 hover:bg-blue-800/40 hover:text-cyan-200",
              isCollapsed ? "justify-center" : "justify-start"
            )}
          >
            <span className={cn(isCollapsed ? "" : "mr-2", isActive ? "text-cyan-400" : "")}>{icon}</span>
            {!isCollapsed && <span>{title}</span>}
            {!isCollapsed && badge && (
              <span className="ml-auto bg-cyan-500 text-[10px] text-cyan-950 font-semibold px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            {isActive && (
              <div className="absolute inset-0 rounded-md opacity-20 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0 animate-pulse-slow pointer-events-none"></div>
            )}
          </a>
        </Link>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right" className="bg-blue-900 border-blue-700 text-blue-100">
          <div className="flex items-center space-x-2">
            <span>{title}</span>
            {badge && (
              <span className="bg-cyan-500 text-[10px] text-cyan-950 font-semibold px-1.5 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
        </TooltipContent>
      )}
    </Tooltip>
  );
}