import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import bentonSeal from '@assets/BC.png';
import {
  Home,
  Calculator,
  BarChart3,
  BarChart2,
  BrainCircuit,
  Glasses,
  LineChart,
  Activity,
  Database,
  Map,
  Users,
  Share2,
  BookOpen,
  HelpCircle,
  Settings,
  Menu,
  X,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

// Simple nav link component
const NavLink = ({ 
  href, 
  label, 
  icon, 
  onClick, 
  className 
}: { 
  href: string; 
  label: string; 
  icon?: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <a
      href={href}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md",
        isActive 
          ? "bg-[#e6eef2] text-[#243E4D]" 
          : "text-muted-foreground hover:text-primary hover:bg-accent/30",
        className
      )}
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
        window.history.pushState({}, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      {icon && (
        <span className={cn("mr-2", isActive ? "text-[#29B7D3]" : "")}>
          {icon}
        </span>
      )}
      {label}
    </a>
  );
};

// Section component for dropdowns
const MenuSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h4 className="font-medium text-sm text-muted-foreground mb-2 px-3">{title}</h4>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

// Dropdown menu component
const DropdownMenu = ({ 
  isOpen, 
  children,
  width = "240px" 
}: { 
  isOpen: boolean; 
  children: React.ReactNode;
  width?: string;
}) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-md border border-gray-200 z-50 overflow-hidden"
      style={{ width }}
    >
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

export default function SimpleTopMenu() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation
  useEffect(() => {
    setActiveMenu(null);
    setMobileMenuOpen(false);
  }, [location]);

  // Handle clicking outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Menu toggle functions
  const toggleMenu = (menuName: string) => {
    setActiveMenu(prev => prev === menuName ? null : menuName);
  };
  
  const closeAllMenus = () => setActiveMenu(null);

  return (
    <div ref={menuRef} className="relative w-full">
      {/* Mobile menu toggle */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>
      
      {/* Main nav container */}
      <div className={cn(
        "flex items-center",
        mobileMenuOpen ? "flex-col absolute top-10 left-0 w-full bg-white z-50 p-4 shadow-md" : "flex-row",
        !mobileMenuOpen && "md:flex hidden"
      )}>
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 mr-6 cursor-pointer"
          onClick={() => {
            closeAllMenus();
            window.history.pushState({}, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
        >
          <img src={bentonSeal} alt="Benton County Seal" className="h-8 w-8" />
          <span className="font-semibold text-xl text-[#243E4D]">BCBS</span>
        </div>
        
        {/* Main navigation links */}
        <div className={cn(
          "flex items-center gap-1",
          mobileMenuOpen ? "flex-col w-full items-start mt-4" : "flex-row"
        )}>
          <NavLink
            href="/"
            label="Dashboard"
            icon={<Home className="h-4 w-4" />}
          />
          
          <NavLink
            href="/calculator"
            label="Cost Calculator"
            icon={<Calculator className="h-4 w-4" />}
          />
          
          <NavLink
            href="/properties"
            label="Property Browser"
            icon={<Building2 className="h-4 w-4" />}
            className="bg-[#f5e9e9] hover:bg-[#f0d6d6]"
          />
          
          {/* Analytics dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                activeMenu === 'analytics' && "bg-accent",
                location.includes("analytics") && "bg-[#e6eef2] text-[#243E4D]"
              )}
              onClick={() => toggleMenu('analytics')}
            >
              <LineChart className="h-4 w-4 mr-2" /> Analytics
            </Button>
            
            <DropdownMenu isOpen={activeMenu === 'analytics'} width="500px">
              <div className="grid grid-cols-2 gap-4">
                <MenuSection title="Analytics">
                  <NavLink
                    href="/analytics"
                    label="Analytics Dashboard"
                    icon={<BarChart3 className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/benchmarking"
                    label="Cost Benchmarking"
                    icon={<BarChart2 className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                </MenuSection>
                
                <MenuSection title="Advanced Analysis">
                  <NavLink
                    href="/visualizations"
                    label="Visualization Lab"
                    icon={<LineChart className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/what-if-scenarios"
                    label="What-If Scenarios"
                    icon={<Activity className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/regional-cost-comparison"
                    label="Regional Comparison"
                    icon={<Map className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                </MenuSection>
              </div>
            </DropdownMenu>
          </div>
          
          {/* MCP Framework dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                activeMenu === 'mcp' && "bg-accent",
                location.includes("mcp-") && "bg-[#e6eef2] text-[#243E4D]"
              )}
              onClick={() => toggleMenu('mcp')}
            >
              <BrainCircuit className="h-4 w-4 mr-2" /> MCP Framework
            </Button>
            
            <DropdownMenu isOpen={activeMenu === 'mcp'} width="300px">
              <MenuSection title="Model Content Protocol">
                <NavLink
                  href="/mcp-overview"
                  label="MCP Overview"
                  icon={<BrainCircuit className="h-4 w-4" />}
                  onClick={closeAllMenus}
                />
                <NavLink
                  href="/mcp-dashboard"
                  label="MCP Dashboard"
                  icon={<Activity className="h-4 w-4" />}
                  className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                  onClick={closeAllMenus}
                />
                <NavLink
                  href="/mcp-visualizations"
                  label="MCP Visualizations"
                  icon={<LineChart className="h-4 w-4" />}
                  className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                  onClick={closeAllMenus}
                />
              </MenuSection>
            </DropdownMenu>
          </div>
          
          {/* Data dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                activeMenu === 'data' && "bg-accent",
                location.includes("data-") && "bg-[#e6eef2] text-[#243E4D]"
              )}
              onClick={() => toggleMenu('data')}
            >
              <Database className="h-4 w-4 mr-2" /> Data
            </Button>
            
            <DropdownMenu isOpen={activeMenu === 'data'} width="500px">
              <div className="grid grid-cols-2 gap-4">
                <MenuSection title="Data Management">
                  <NavLink
                    href="/data-import"
                    label="Data Import"
                    icon={<Database className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/properties"
                    label="Property Browser"
                    icon={<Building2 className="h-4 w-4" />}
                    className="font-semibold text-[#47AD55]"
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/data-exploration"
                    label="Data Exploration"
                    icon={<Map className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/contextual-data"
                    label="Contextual Data"
                    icon={<BarChart2 className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                </MenuSection>
                
                <MenuSection title="AI & Visualization">
                  <NavLink
                    href="/geo-assessment"
                    label="GeoAssessment"
                    icon={<Map className="h-4 w-4" />}
                    className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/ai-tools"
                    label="AI Tools"
                    icon={<BrainCircuit className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/ar-visualization"
                    label="AR Visualization"
                    icon={<Glasses className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                </MenuSection>
              </div>
            </DropdownMenu>
          </div>
          
          {/* Admin dropdown (conditional) */}
          {isAdmin && (
            <div className="relative">
              <Button 
                variant="ghost" 
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                  activeMenu === 'admin' && "bg-accent",
                  (location.includes("users") || location.includes("shared-projects")) && "bg-[#e6eef2] text-[#243E4D]"
                )}
                onClick={() => toggleMenu('admin')}
              >
                <Settings className="h-4 w-4 mr-2" /> Admin
              </Button>
              
              <DropdownMenu isOpen={activeMenu === 'admin'} width="240px">
                <MenuSection title="Administration">
                  <NavLink
                    href="/users"
                    label="User Management"
                    icon={<Users className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/shared-projects"
                    label="Shared Projects"
                    icon={<Share2 className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/data-connections"
                    label="Data Connections"
                    icon={<Database className="h-4 w-4" />}
                    onClick={closeAllMenus}
                  />
                  <NavLink
                    href="/supabase-test"
                    label="Supabase Test"
                    icon={<Database className="h-4 w-4" />}
                    className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                    onClick={closeAllMenus}
                  />
                </MenuSection>
              </DropdownMenu>
            </div>
          )}
          
          {/* Help dropdown */}
          <div className="relative">
            <Button 
              variant="ghost" 
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                activeMenu === 'help' && "bg-accent",
                (location.includes("documentation") || location.includes("tutorials") || location.includes("faq")) && "bg-[#e6eef2] text-[#243E4D]"
              )}
              onClick={() => toggleMenu('help')}
            >
              <HelpCircle className="h-4 w-4 mr-2" /> Help
            </Button>
            
            <DropdownMenu isOpen={activeMenu === 'help'} width="240px">
              <MenuSection title="Help & Support">
                <NavLink
                  href="/documentation"
                  label="Documentation"
                  icon={<BookOpen className="h-4 w-4" />}
                  onClick={closeAllMenus}
                />
                <NavLink
                  href="/tutorials"
                  label="Tutorials"
                  icon={<BookOpen className="h-4 w-4" />}
                  onClick={closeAllMenus}
                />
                <NavLink
                  href="/faq"
                  label="FAQ"
                  icon={<HelpCircle className="h-4 w-4" />}
                  onClick={closeAllMenus}
                />
              </MenuSection>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Theme switcher (always visible) */}
        <div className={cn(
          "flex items-center",
          mobileMenuOpen ? "mt-4 self-start" : "ml-auto"
        )}>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}