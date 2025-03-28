import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { APP_NAME } from "@/data/constants";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to: string;
  icon: string;
  children: React.ReactNode;
  active?: boolean;
}

const SidebarItem = ({ to, icon, children, active }: SidebarItemProps) => (
  <Link href={to}>
    <a
      className={cn(
        "sidebar-item flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1",
        active
          ? "text-primary bg-primary bg-opacity-5 border-l-3 border-primary"
          : "text-neutral-500 hover:text-primary hover:bg-primary hover:bg-opacity-5"
      )}
    >
      <i className={cn(`${icon} mr-2`)}></i>
      {children}
    </a>
  </Link>
);

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
}

const SidebarSection = ({ title, children }: SidebarSectionProps) => (
  <div className="mb-2">
    <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider px-3 py-2">
      {title}
    </p>
    {children}
  </div>
);

export default function Sidebar() {
  const [location] = useLocation();
  const [selectedEnvironment, setSelectedEnvironment] = useState("Development");

  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-600">
            <span className="text-primary font-bold">BCBS</span> Building Cost
          </h1>
          <button className="text-neutral-400 hover:text-neutral-600">
            <i className="ri-menu-fold-line"></i>
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-neutral-200">
        <label className="block text-xs font-medium text-neutral-500 mb-1">Environment</label>
        <div className="relative">
          <select
            className="w-full bg-neutral-100 border border-neutral-200 rounded px-3 py-2 text-sm text-neutral-600 appearance-none"
            value={selectedEnvironment}
            onChange={(e) => setSelectedEnvironment(e.target.value)}
          >
            <option>Development</option>
            <option>Staging</option>
            <option>Production</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <i className="ri-arrow-down-s-line text-neutral-400"></i>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-2">
        <SidebarSection title="Mission Control">
          <SidebarItem to="/" icon="ri-dashboard-line" active={location === "/"}>
            Dashboard
          </SidebarItem>
          <SidebarItem to="/repository" icon="ri-git-repository-line" active={location === "/repository"}>
            Repository
          </SidebarItem>
          <SidebarItem to="/database" icon="ri-database-2-line" active={location === "/database"}>
            Database
          </SidebarItem>
          <SidebarItem to="/dev-tools" icon="ri-terminal-window-line" active={location === "/dev-tools"}>
            Dev Tools
          </SidebarItem>
        </SidebarSection>

        <SidebarSection title="API Management">
          <SidebarItem to="/endpoints" icon="ri-api-line" active={location === "/endpoints"}>
            Endpoints
          </SidebarItem>
          <SidebarItem to="/authentication" icon="ri-key-2-line" active={location === "/authentication"}>
            Authentication
          </SidebarItem>
          <SidebarItem to="/webhooks" icon="ri-share-line" active={location === "/webhooks"}>
            Webhooks
          </SidebarItem>
        </SidebarSection>

        <SidebarSection title="Settings">
          <SidebarItem to="/users" icon="ri-user-settings-line" active={location === "/users"}>
            Users
          </SidebarItem>
          <SidebarItem to="/configuration" icon="ri-settings-3-line" active={location === "/configuration"}>
            Configuration
          </SidebarItem>
          <SidebarItem to="/scheduled-tasks" icon="ri-calendar-check-line" active={location === "/scheduled-tasks"}>
            Scheduled Tasks
          </SidebarItem>
        </SidebarSection>
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-medium text-sm">
            AD
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-neutral-600">Admin User</p>
            <p className="text-xs text-neutral-400">Administrator</p>
          </div>
          <button className="ml-auto text-neutral-400 hover:text-neutral-600">
            <i className="ri-logout-box-r-line"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
