import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import bentonSeal from '@assets/BC.png';
import { useNavigationMenu } from "@/hooks/use-navigation-menu";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/auth-context";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";

interface NavLinkProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink = ({ href, label, icon, className, onClick }: NavLinkProps) => {
  const [location] = useLocation();
  const isActive = location === href;

  return (
    <div 
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-md cursor-pointer",
        isActive 
          ? "bg-[#e6eef2] text-[#243E4D] transform-gpu" 
          : "text-muted-foreground hover:text-primary hover:bg-accent/30",
        className
      )}
      onClick={(e) => {
        if (onClick) onClick();
        
        // Use the wouter navigation mechanism
        window.history.pushState({}, '', href);
        // Dispatch a popstate event to notify wouter of the change
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      {icon && (
        <span className={cn("mr-2", isActive ? "text-[#29B7D3]" : "")}>
          {icon}
        </span>
      )}
      {label}
    </div>
  );
};

interface DropdownSectionProps {
  label: string;
  children: React.ReactNode;
}

const DropdownSection = ({ label, children }: DropdownSectionProps) => (
  <div className="mb-4">
    <h4 className="font-medium text-sm text-muted-foreground mb-2 px-3">{label}</h4>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

export default function TopNavMenu() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeMenu, toggleMenu, closeAllMenus } = useNavigationMenu();
  const menuRef = useRef<HTMLDivElement>(null);

  // Check screen size for responsive design
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Close mobile menu when navigating
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [location, mobileMenuOpen]);

  // Monitor window resize events
  useEffect(() => {
    const handleResize = () => {
      // If window gets bigger, close mobile menu
      if (window.innerWidth >= 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);
  
  // Handle outside clicks to close dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close menus when clicking outside or on navigation items
      if (
        (menuRef.current && !menuRef.current.contains(event.target as Node)) ||
        (event.target as HTMLElement).closest('a, [role="link"], [role="button"], .cursor-pointer')
      ) {
        closeAllMenus();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeAllMenus]);

  // We no longer need these local functions since we're using the hook
  // All menu logic is now handled by useNavigationMenu()

  return (
    <>
      {/* Mobile menu toggle button - only visible on small screens */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Desktop navigation - hidden on mobile unless menu is open */}
      <NavigationMenu ref={menuRef} className={cn(
        "max-w-full justify-start",
        isMobile && !mobileMenuOpen ? "hidden" : "",
        isMobile && mobileMenuOpen ? "fixed inset-0 bg-white z-50 pt-16 px-4 overflow-auto flex flex-col" : ""
      )}>
        <NavigationMenuList className={cn(
          "flex", 
          isMobile ? "flex-col w-full" : "flex-row"
        )}>
          <NavigationMenuItem className="mr-0">
            <div
              className="flex items-center space-x-2 mr-6 cursor-pointer"
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              <img src={bentonSeal} alt="Benton County Seal" className="h-8 w-8" />
              <span className="font-semibold text-xl text-[#243E4D]">BCBS</span>
            </div>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavLink
              href="/"
              label="Dashboard"
              icon={<Home className="h-4 w-4" />}
            />
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavLink
              href="/calculator"
              label="Cost Calculator"
              icon={<Calculator className="h-4 w-4" />}
            />
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavLink
              href="/properties"
              label="Property Browser"
              icon={<Building2 className="h-4 w-4" />}
              className="bg-[#f5e9e9] hover:bg-[#f0d6d6]"
            />
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger 
              onClick={() => toggleMenu('analytics')}
              className={cn(
                location.includes('visualizations') || location.includes('what-if-scenarios') 
                  ? "bg-[#e6eef2] text-[#243E4D]" 
                  : ""
              )}
            >
              <LineChart className="h-4 w-4 mr-2" /> Analytics
            </NavigationMenuTrigger>
            <NavigationMenuContent 
              forceMount={true} 
              className={cn(
                "fixed top-[42px] left-auto z-50 rounded-md shadow-md border border-gray-200 mt-1 w-[500px]",
                activeMenu === 'analytics' ? 'block' : 'hidden'
              )}>
              <div className="grid grid-cols-2 gap-2 p-4 w-full bg-white rounded-md">
                <DropdownSection label="Analytics">
                  <NavLink
                    href="/analytics"
                    label="Analytics Dashboard"
                    icon={<BarChart3 className="h-4 w-4" />}
                    onClick={() => closeAllMenus()}
                  />
                  <NavLink
                    href="/benchmarking"
                    label="Cost Benchmarking"
                    icon={<BarChart2 className="h-4 w-4" />}
                  />
                </DropdownSection>
                
                <DropdownSection label="Advanced Analysis">
                  <NavLink
                    href="/visualizations"
                    label="Visualization Lab"
                    icon={<LineChart className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/what-if-scenarios"
                    label="What-If Scenarios"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/regional-cost-comparison"
                    label="Regional Comparison"
                    icon={<Map className="h-4 w-4" />}
                  />
                </DropdownSection>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              onClick={() => toggleMenu('mcp')}
              className={cn(
                location.includes('mcp-') 
                  ? "bg-[#e6eef2] text-[#243E4D]" 
                  : ""
              )}
            >
              <BrainCircuit className="h-4 w-4 mr-2" /> MCP Framework
            </NavigationMenuTrigger>
            <NavigationMenuContent 
              forceMount={true} 
              className={cn(
                "fixed top-[42px] left-auto z-50 rounded-md shadow-md border border-gray-200 mt-1 w-[300px]",
                activeMenu === 'mcp' ? 'block' : 'hidden'
              )}>
              <div className="p-4 w-full bg-white rounded-md">
                <DropdownSection label="Model Content Protocol">
                  <NavLink
                    href="/mcp-overview"
                    label="MCP Overview"
                    icon={<BrainCircuit className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/mcp-dashboard"
                    label="MCP Dashboard"
                    icon={<Activity className="h-4 w-4" />}
                    className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                  />
                  <NavLink
                    href="/mcp-visualizations"
                    label="MCP Visualizations"
                    icon={<LineChart className="h-4 w-4" />}
                    className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                  />
                </DropdownSection>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger 
              onClick={() => toggleMenu('data')}
              className={cn(
                location.includes('data-') ? "bg-[#e6eef2] text-[#243E4D]" : ""
              )}
            >
              <Database className="h-4 w-4 mr-2" /> Data
            </NavigationMenuTrigger>
            <NavigationMenuContent 
              forceMount={true} 
              className={cn(
                "fixed top-[42px] left-auto z-50 rounded-md shadow-md border border-gray-200 mt-1 w-[500px]",
                activeMenu === 'data' ? 'block' : 'hidden'
              )}>
              <div className="grid grid-cols-2 gap-2 p-4 w-full bg-white rounded-md">
                <DropdownSection label="Data Management">
                  <NavLink
                    href="/data-import"
                    label="Data Import"
                    icon={<Database className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/properties"
                    label="Property Browser"
                    icon={<Building2 className="h-4 w-4" />}
                    className="font-semibold text-[#47AD55]"
                  />
                  <NavLink
                    href="/data-exploration"
                    label="Data Exploration"
                    icon={<Map className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/contextual-data"
                    label="Contextual Data"
                    icon={<BarChart2 className="h-4 w-4" />}
                  />
                </DropdownSection>
                
                <DropdownSection label="AI & Visualization">
                  <NavLink
                    href="/geo-assessment"
                    label="GeoAssessment"
                    icon={<Map className="h-4 w-4" />}
                    className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                  />
                  <NavLink
                    href="/ai-tools"
                    label="AI Tools"
                    icon={<BrainCircuit className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/ar-visualization"
                    label="AR Visualization"
                    icon={<Glasses className="h-4 w-4" />}
                  />
                </DropdownSection>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {isAdmin && (
            <NavigationMenuItem>
              <NavigationMenuTrigger 
                onClick={() => toggleMenu('admin')}
                className={cn(
                  location.includes('users') || location.includes('shared-projects') 
                    ? "bg-[#e6eef2] text-[#243E4D]" 
                    : ""
                )}
              >
                <Settings className="h-4 w-4 mr-2" /> Admin
              </NavigationMenuTrigger>
              <NavigationMenuContent 
                forceMount={true}
                className={cn(
                  "fixed top-[42px] left-auto z-50 rounded-md shadow-md border border-gray-200 mt-1 w-[240px]",
                  activeMenu === 'admin' ? 'block' : 'hidden'
                )}>
                <div className="p-4 w-full bg-white rounded-md">
                  <DropdownSection label="Administration">
                    <NavLink
                      href="/users"
                      label="User Management"
                      icon={<Users className="h-4 w-4" />}
                    />
                    <NavLink
                      href="/shared-projects"
                      label="Shared Projects"
                      icon={<Share2 className="h-4 w-4" />}
                    />
                    <NavLink
                      href="/data-connections"
                      label="Data Connections"
                      icon={<Database className="h-4 w-4" />}
                    />
                    <NavLink
                      href="/supabase-test"
                      label="Supabase Test"
                      icon={<Database className="h-4 w-4" />}
                      className="bg-[#e8f8fb]/50 font-medium text-[#243E4D]"
                    />
                  </DropdownSection>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )}

          <NavigationMenuItem>
            <NavigationMenuTrigger 
              onClick={() => toggleMenu('help')}
              className={cn(
                location.includes('documentation') || location.includes('tutorials') || location.includes('faq') 
                  ? "bg-[#e6eef2] text-[#243E4D]" 
                  : ""
              )}
            >
              <HelpCircle className="h-4 w-4 mr-2" /> Help
            </NavigationMenuTrigger>
            <NavigationMenuContent 
              forceMount={true} 
              className={cn(
                "fixed top-[42px] left-auto z-50 rounded-md shadow-md border border-gray-200 mt-1 w-[240px]",
                activeMenu === 'help' ? 'block' : 'hidden'
              )}>
              <div className="p-4 w-full bg-white rounded-md">
                <DropdownSection label="Help & Support">
                  <NavLink
                    href="/documentation"
                    label="Documentation"
                    icon={<BookOpen className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/tutorials"
                    label="Tutorials"
                    icon={<BookOpen className="h-4 w-4" />}
                  />
                  <NavLink
                    href="/faq"
                    label="FAQ"
                    icon={<HelpCircle className="h-4 w-4" />}
                  />
                </DropdownSection>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          
          {/* Theme switcher */}
          <NavigationMenuItem className="ml-auto">
            <div className="flex items-center">
              <ThemeSwitcher />
            </div>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </>
  );
}