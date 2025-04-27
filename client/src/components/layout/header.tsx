import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  Shield, 
  PanelLeft,
  Search,
  Bell,
  Sun,
  Moon,
  HelpCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface HeaderProps {
  isLanding?: boolean;
}

export default function Header({ isLanding = false }: HeaderProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [hasNotifications, setHasNotifications] = React.useState(true);

  const handleLogout = () => {
    if (logout) {
      try {
        logout();
        // The redirect will be handled by the Auth Provider
      } catch (error) {
        console.error('Logout error:', error);
      }
    } else {
      // Fallback for direct redirect if the logout method is not available
      window.location.href = '/api/logout';
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Here you would implement actual theme switching logic
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-white shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90",
      isLanding && "bg-transparent border-none shadow-none backdrop-blur-none supports-[backdrop-filter]:bg-transparent"
    )}>
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center">
          {!isLanding && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2 md:hidden"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}
          
          <Link href="/" className="flex items-center space-x-2">
            <div className="hidden md:flex">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#29B7D3] to-[#243E4D] flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-lg">TB</span>
                </div>
                <span className={cn(
                  "text-xl font-bold",
                  isLanding ? "text-white" : "text-[#243E4D]"
                )}>TerraBuild</span>
              </div>
            </div>
            <div className="flex md:hidden">
              <div className="h-8 w-8 rounded-md bg-gradient-to-r from-[#29B7D3] to-[#243E4D] flex items-center justify-center">
                <span className="text-white font-bold text-lg">TB</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex-1 md:ml-8">
          {!isLanding && (
            <div className="hidden md:flex relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search properties, calculations, reports..." 
                className="pl-8 bg-gray-50 border-gray-200 focus:bg-white" 
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <TooltipProvider>
            <div className="hidden md:flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleTheme}>
                    {isDarkMode ? 
                      <Moon className="h-5 w-5 text-gray-600" /> : 
                      <Sun className="h-5 w-5 text-amber-500" />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/documentation">
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-5 w-5 text-gray-600" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Help & Documentation</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {hasNotifications && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notifications</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="flex items-center">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "flex items-center gap-2 px-2 md:px-3 rounded-full border",
                      "hover:bg-gray-50 transition-colors"
                    )}
                  >
                    <div className="h-8 w-8 rounded-full bg-[#29B7D3]/10 flex items-center justify-center border border-[#29B7D3]/20">
                      <User className="h-4 w-4 text-[#29B7D3]" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-700">{user?.firstName || user?.username}</p>
                      <p className="text-xs text-gray-500">{user?.role || 'User'}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 hidden md:block text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <div className="p-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-mode" className="text-xs">Dark Mode</Label>
                      <Switch
                        id="dark-mode"
                        checked={isDarkMode}
                        onCheckedChange={toggleTheme}
                        className="data-[state=checked]:bg-[#29B7D3]"
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate('/login')} className="text-[#29B7D3] border-[#29B7D3]/30">
                  Login
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile search bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            type="search" 
            placeholder="Search..." 
            className="pl-8 bg-gray-50 border-gray-200 w-full"
          />
        </div>
      </div>
    </header>
  );
}