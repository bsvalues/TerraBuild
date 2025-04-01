import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/data/constants";
import { useAuth } from "@/hooks/use-auth";
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
  BookOpen
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

function SidebarItem({ href, title, icon, badge, badgeColor = "bg-blue-100 text-blue-700" }: SidebarItemProps) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start mb-1 border-l-2 border-transparent rounded-r-md rounded-l-none",
          isActive 
            ? "bg-blue-50 text-blue-800 border-l-blue-600 font-medium" 
            : "text-gray-600 hover:bg-blue-50/50 hover:text-blue-700"
        )}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: cn("mr-2 h-4 w-4", isActive ? "text-blue-600" : "text-gray-500"),
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
              badgeColor="bg-blue-100 text-blue-700"
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
              badgeColor="bg-green-100 text-green-700"
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
              badgeColor="bg-purple-100 text-purple-700"
            />
            <SidebarItem
              href="/mcp-overview"
              title="MCP Overview"
              icon={<BookOpen />}
              badge="New"
              badgeColor="bg-blue-100 text-blue-700"
            />
            <SidebarItem
              href="/data-exploration"
              title="Data Explorer"
              icon={<LineChart />}
              badge="New"
              badgeColor="bg-violet-100 text-violet-700"
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
              badgeColor="bg-green-100 text-green-700"
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
          <div className="bg-blue-50 rounded-md p-3 mb-3">
            <p className="text-xs text-blue-700 mb-2">Need help with cost calculations?</p>
            <Button size="sm" variant="outline" className="w-full text-xs h-7 bg-white border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800">
              View Documentation
            </Button>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-md p-3 text-white">
            <p className="text-xs font-medium mb-1">Benton County</p>
            <p className="text-[10px] mb-2 opacity-80">Building Cost Assessment System v2.0</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">March 2025</span>
              <span className="text-[10px]">Pro License</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}