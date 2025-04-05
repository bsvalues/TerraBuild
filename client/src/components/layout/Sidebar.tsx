import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/data/constants";
import { useAuth } from "@/hooks/use-auth";
import BentonBranding, { BentonColors } from '@/components/BentonBranding';
import {
  BarChart3,
  Home,
  Calculator,
  Users,
  Settings,
  BrainCircuit,
  Glasses,
  Database,
  Building2,
  FileBarChart,
  HelpCircle,
  Zap,
  Activity,
  BarChart2,
  LineChart,
  BookOpen,
  Share2,
  UsersRound,
  Map
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface SidebarItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

function SidebarItem({ href, title, icon, badge, badgeColor = "bg-[#e6eef2] text-[#243E4D]" }: SidebarItemProps) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start mb-1 border-l-2 border-transparent rounded-r-md rounded-l-none",
          isActive 
            ? "bg-[#e6eef2] text-[#243E4D] border-l-[#243E4D] font-medium" 
            : "text-gray-600 hover:bg-[#f0f4f7] hover:text-[#243E4D]"
        )}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: cn("mr-2 h-4 w-4", isActive ? "text-[#29B7D3]" : "text-gray-500"),
        })}
        {title}
        {badge && (
          <span className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </Button>
    </Link>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function SidebarSection({ title, children, icon }: SidebarSectionProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center px-4 mb-2">
        {icon && React.cloneElement(icon as React.ReactElement, {
          className: "h-4 w-4 text-gray-500 mr-2",
        })}
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {title}
        </span>
      </div>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className={cn("w-56 border-r border-gray-200 bg-white shadow-sm", className)}>
      <div className="py-4">
        {/* We don't need app name here as it's in the TopNav */}
        
        <div className="mt-2">
          <SidebarSection title="Main Menu" icon={<FileBarChart />}>
            <SidebarItem
              href="/"
              title="Dashboard"
              icon={<Home />}
            />
            <SidebarItem
              href="/calculator"
              title="Cost Calculator"
              icon={<Calculator />}
              badge="New"
              badgeColor="bg-[#e6eef2] text-[#243E4D]"
            />
            <SidebarItem
              href="/analytics"
              title="Analytics"
              icon={<BarChart3 />}
            />
            <SidebarItem
              href="/benchmarking"
              title="Benchmarking"
              icon={<BarChart2 />}
              badge="New"
              badgeColor="bg-[#dcf0db] text-[#3CAB36]"
            />
          </SidebarSection>
          
          <SidebarSection title="AI & Visualization" icon={<Zap />}>
            <SidebarItem
              href="/ai-tools"
              title="AI Tools"
              icon={<BrainCircuit />}
            />
            <SidebarItem
              href="/ar-visualization"
              title="AR Visualization"
              icon={<Glasses />}
              badge="Beta"
              badgeColor="bg-[#e8f8fb] text-[#29B7D3]"
            />
            <SidebarItem
              href="/mcp-overview"
              title="MCP Overview"
              icon={<BookOpen />}
              badge="New"
              badgeColor="bg-[#e6eef2] text-[#243E4D]"
            />
            <SidebarItem
              href="/data-exploration"
              title="Data Explorer"
              icon={<LineChart />}
              badge="New"
              badgeColor="bg-[#e8f8fb] text-[#29B7D3]"
            />
            <SidebarItem
              href="/regional-cost-comparison"
              title="Regional Costs"
              icon={<Map />}
              badge="New"
              badgeColor="bg-[#dcf0db] text-[#3CAB36]"
            />
          </SidebarSection>
          
          <SidebarSection title="Collaboration" icon={<UsersRound />}>
            <SidebarItem
              href="/shared-projects"
              title="Shared Projects"
              icon={<Share2 />}
              badge="New"
              badgeColor="bg-[#dcf0db] text-[#3CAB36]"
            />
          </SidebarSection>
          
          <SidebarSection title="Data & Management" icon={<Building2 />}>
            <SidebarItem
              href="/data-import"
              title="Data Import"
              icon={<Database size={16} />}
            />
            <SidebarItem
              href="/system-status"
              title="System Status"
              icon={<Activity />}
              badge="Healthy"
              badgeColor="bg-[#dcf0db] text-[#3CAB36]"
            />
            {isAdmin && (
              <SidebarItem
                href="/users"
                title="User Management"
                icon={<Users />}
              />
            )}
            <SidebarItem
              href="/settings"
              title="Settings"
              icon={<Settings />}
            />
          </SidebarSection>
        </div>
        
        <Separator className="my-4 mx-4" />
        
        <div className="px-4 pt-2">
          <div className="mb-2 px-2 flex items-center">
            <HelpCircle className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Resources
            </span>
          </div>
          <div className="bg-[#e6eef2] rounded-md p-3 mb-3">
            <p className="text-xs text-[#243E4D] mb-2">Need help with cost calculations?</p>
            <Button size="sm" variant="outline" className="w-full text-xs h-7 bg-white border-[#29B7D3]/30 text-[#243E4D] hover:bg-[#e8f8fb] hover:text-[#29B7D3]">
              View Documentation
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-[#243E4D] to-[#132731] rounded-md p-3 text-white">
            <p className="text-xs font-medium mb-1">Benton County</p>
            <p className="text-[10px] mb-2 opacity-80">Building Cost Assessment System v2.0</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-[#3CAB36]/20 px-1.5 py-0.5 rounded">March 2025</span>
              <span className="text-[10px]">Pro License</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}