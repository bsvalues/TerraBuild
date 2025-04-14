import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';
import { Menu, X } from 'lucide-react';
import { Logo } from '../ui/logo';

interface MenuItem {
  label: string;
  href: string;
  protected?: boolean;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Dashboard',
    href: '/dashboard',
    protected: true,
  },
  {
    label: 'Cost Calculator',
    href: '/calculator',
    protected: true,
  },
  {
    label: 'AI Tools',
    href: '#',
    protected: true,
    children: [
      { label: 'AI Cost Wizard', href: '/ai-cost-wizard', protected: true },
      { label: 'What-If Scenarios', href: '/what-if-scenarios', protected: true },
      { label: 'AR Visualization', href: '/ar-visualization', protected: true },
    ],
  },
  {
    label: 'Data',
    href: '#',
    protected: true,
    children: [
      { label: 'Data Import', href: '/data-import', protected: true },
      { label: 'Properties', href: '/properties', protected: true },
      { label: 'Geo Assessment', href: '/geo-assessment', protected: true },
      { label: 'Benchmarking', href: '/benchmarking', protected: true },
    ],
  },
  {
    label: 'Analytics',
    href: '#',
    protected: true,
    children: [
      { label: 'Visualizations', href: '/visualizations', protected: true },
      { label: 'Data Exploration', href: '/data-exploration', protected: true },
      { label: 'Comparative Analysis', href: '/comparative-analysis', protected: true },
      { label: 'Cost Trend Analysis', href: '/cost-trend-analysis', protected: true },
      { label: 'Regional Cost Comparison', href: '/regional-cost-comparison', protected: true },
    ],
  },
  {
    label: 'Shared Projects',
    href: '/shared-projects',
    protected: true,
  },
  {
    label: 'Help',
    href: '#',
    children: [
      { label: 'Documentation', href: '/documentation' },
      { label: 'Tutorials', href: '/tutorials' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
];

export function SimpleTopMenu() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: string]: boolean }>({});
  
  // A ref to hold the active user (mock implementation)
  const user = useRef({ role: 'admin' }); // Mock user for protected routes
  
  // Close dropdowns when clicking elsewhere on the page
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
      const dropdownMenus = document.querySelectorAll('.dropdown-menu');
      
      let clickedInside = false;
      
      dropdownToggles.forEach((toggle) => {
        if (toggle.contains(event.target as Node)) {
          clickedInside = true;
        }
      });
      
      dropdownMenus.forEach((menu) => {
        if (menu.contains(event.target as Node)) {
          clickedInside = true;
        }
      });
      
      if (!clickedInside) {
        setOpenDropdowns({});
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleDropdown = (label: string) => {
    setOpenDropdowns(prev => {
      const newState = { ...prev };
      // Close all other dropdowns
      Object.keys(newState).forEach(key => {
        if (key !== label) {
          newState[key] = false;
        }
      });
      // Toggle the clicked dropdown
      newState[label] = !prev[label];
      return newState;
    });
  };
  
  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };
  
  const isActive = (href: string) => {
    return location === href;
  };
  
  const canAccess = (item: MenuItem) => {
    return !item.protected || user.current?.role === 'admin';
  };
  
  const renderMenuItem = (item: MenuItem, index: number, isMobile = false) => {
    if (!canAccess(item)) {
      return null;
    }
    
    if (item.children) {
      return (
        <li key={index} className={`relative ${isMobile ? 'w-full' : ''}`}>
          <button
            className={`dropdown-toggle flex items-center px-3 py-2 text-sm font-medium transition-colors ${
              isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'
            } ${isMobile ? 'w-full justify-between' : ''}`}
            onClick={() => toggleDropdown(item.label)}
            aria-expanded={openDropdowns[item.label] || false}
          >
            {item.label}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`ml-1 h-4 w-4 transition-transform ${
                openDropdowns[item.label] ? 'rotate-180' : ''
              }`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {openDropdowns[item.label] && (
            <ul
              className={`dropdown-menu z-10 ${
                isMobile
                  ? 'w-full pl-4'
                  : 'absolute left-0 top-full min-w-[180px] rounded-md border bg-background p-2 shadow-lg'
              }`}
            >
              {item.children.map((child, childIndex) => {
                if (!canAccess(child)) {
                  return null;
                }
                return (
                  <li key={childIndex}>
                    <div 
                      className={`block px-3 py-2 text-sm transition-colors ${
                        isActive(child.href)
                          ? 'text-primary'
                          : 'text-foreground hover:text-primary'
                      } ${isMobile ? '' : 'rounded-sm'} cursor-pointer`}
                      onClick={() => {
                        closeAllDropdowns();
                        window.location.href = child.href;
                      }}
                    >
                      {child.label}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    }
    
    return (
      <li key={index} className={isMobile ? 'w-full' : ''}>
        <div
          className={`block px-3 py-2 text-sm font-medium transition-colors ${
            isActive(item.href) ? 'text-primary' : 'text-foreground hover:text-primary'
          } cursor-pointer`}
          onClick={() => {
            closeAllDropdowns();
            window.location.href = item.href;
          }}
        >
          {item.label}
        </div>
      </li>
    );
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <div 
            className="flex items-center space-x-2 cursor-pointer" 
            onClick={() => window.location.href = '/'}
          >
            <Logo className="h-6 w-6" />
            <span className="font-bold">BCBS</span>
          </div>
        </div>
        
        {/* Desktop Menu */}
        <nav className="hidden flex-1 md:flex">
          <ul className="flex items-center gap-1">
            {menuItems.map((item, index) => renderMenuItem(item, index))}
          </ul>
        </nav>
        
        <div className="flex flex-1 items-center justify-end gap-2">
          <ThemeSwitcher />
          
          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="container md:hidden">
          <nav className="flex flex-col py-4">
            <ul className="flex flex-col gap-1">
              {menuItems.map((item, index) => renderMenuItem(item, index, true))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}