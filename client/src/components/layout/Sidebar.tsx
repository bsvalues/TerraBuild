import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  Building2,
  LayoutDashboard,
  Calculator,
  FileText,
  Map,
  Settings,
  BarChart3,
  Users,
  HelpCircle,
  Home
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  user: any;
}

interface NavItemProps {
  icon: React.ReactNode;
  title: string;
  path: string;
  isCollapsed: boolean;
  badge?: string;
  isActive?: boolean;
}

function NavItem({ icon, title, path, isCollapsed, badge, isActive }: NavItemProps) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link href={path}>
          <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full justify-start mb-1",
              isActive 
                ? "bg-primary/10 text-primary hover:bg-primary/20" 
                : "hover:bg-muted"
            )}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              className: cn("h-5 w-5", isCollapsed ? "mx-auto" : "mr-2", isActive && "text-primary")
            })}
            {!isCollapsed && <span>{title}</span>}
            {!isCollapsed && badge && (
              <Badge variant="outline" className="ml-auto font-normal">
                {badge}
              </Badge>
            )}
          </Button>
        </Link>
      </TooltipTrigger>
      {isCollapsed && <TooltipContent side="right">{title}</TooltipContent>}
    </Tooltip>
  );
}

export default function Sidebar({ isCollapsed, onToggle, user }: SidebarProps) {
  const [location] = useLocation();

  const isActiveRoute = (path: string) => {
    if (path === "/") return location === path;
    return location.startsWith(path);
  };

  return (
    <div className="h-full flex flex-col py-2">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-6">
          {!isCollapsed && (
            <div className="flex items-center">
              <Building2 className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-lg">TerraBuild</span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-auto h-8 w-8"
            onClick={onToggle}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        <TooltipProvider delayDuration={0}>
          <div className="space-y-1">
            <NavItem
              icon={<Home />}
              title="Home"
              path="/"
              isActive={isActiveRoute("/")}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<LayoutDashboard />}
              title="Dashboard"
              path="/dashboard"
              isActive={isActiveRoute("/dashboard")}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<Calculator />}
              title="Cost Calculator"
              path="/calculator"
              isActive={isActiveRoute("/calculator")}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<Map />}
              title="Property Map"
              path="/map"
              isActive={isActiveRoute("/map")}
              isCollapsed={isCollapsed}
            />
            <NavItem
              icon={<FileText />}
              title="Reports"
              path="/reports"
              isActive={isActiveRoute("/reports")}
              isCollapsed={isCollapsed}
              badge="New"
            />
            <NavItem
              icon={<BarChart3 />}
              title="Analytics"
              path="/analytics"
              isActive={isActiveRoute("/analytics")}
              isCollapsed={isCollapsed}
            />
          </div>

          {!isCollapsed && <Separator className="my-4" />}

          {user?.role === "admin" && (
            <div className="pt-2">
              {!isCollapsed && (
                <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground">
                  Administration
                </h3>
              )}
              <NavItem
                icon={<Users />}
                title="User Management"
                path="/admin/users"
                isActive={isActiveRoute("/admin/users")}
                isCollapsed={isCollapsed}
              />
              <NavItem
                icon={<Settings />}
                title="System Settings"
                path="/admin/settings"
                isActive={isActiveRoute("/admin/settings")}
                isCollapsed={isCollapsed}
              />
            </div>
          )}
        </TooltipProvider>
      </div>

      <div className="mt-auto px-3 py-2">
        <TooltipProvider delayDuration={0}>
          <NavItem
            icon={<HelpCircle />}
            title="Help & Support"
            path="/help"
            isActive={isActiveRoute("/help")}
            isCollapsed={isCollapsed}
          />
        </TooltipProvider>
        
        {!isCollapsed && (
          <div className="pt-2">
            <p className="text-xs text-center text-muted-foreground mt-4">
              Benton County<br/>
              Cost Assessment v1.0
            </p>
          </div>
        )}
      </div>
    </div>
  );
}