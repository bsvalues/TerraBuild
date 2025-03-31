import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { APP_NAME } from "@/data/constants";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart3,
  Home,
  Calculator,
  Users,
  Settings,
  Layers,
  BrainCircuit
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

interface SidebarItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
}

function SidebarItem({ href, title, icon }: SidebarItemProps) {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <Link href={href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start",
          isActive && "bg-secondary font-medium"
        )}
      >
        {React.cloneElement(icon as React.ReactElement, {
          className: "mr-2 h-4 w-4",
        })}
        {title}
      </Button>
    </Link>
  );
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className={cn("pb-12 border-r", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <div className="flex items-center mb-6">
            <Layers className="h-6 w-6 text-primary mr-2" />
            <h2 className="text-lg font-semibold tracking-tight">
              {APP_NAME}
            </h2>
          </div>
          <div className="space-y-1">
            <SidebarItem
              href="/"
              title="Dashboard"
              icon={<Home />}
            />
            <SidebarItem
              href="/calculator"
              title="Cost Calculator"
              icon={<Calculator />}
            />
            <SidebarItem
              href="/analytics"
              title="Analytics"
              icon={<BarChart3 />}
            />
            <SidebarItem
              href="/ai-tools"
              title="AI Tools"
              icon={<BrainCircuit />}
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
          </div>
        </div>
        <div className="px-4 py-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            API Management
          </div>
          <ScrollArea className="h-[300px]">
            <div className="space-y-1 py-2">
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                <i className="ri-api-line mr-2"></i>
                Endpoints
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                <i className="ri-server-line mr-2"></i>
                Environments
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start font-normal"
              >
                <i className="ri-git-repository-line mr-2"></i>
                Repository
              </Button>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}