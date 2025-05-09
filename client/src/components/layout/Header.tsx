import React from 'react';
import { Link } from 'wouter';
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Settings,
  ChevronDown, 
  Sun, 
  Moon,
  Database,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import TerraFusionLogo from '@/components/TerraFusionLogo';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="border-b border-blue-800/40 bg-blue-950 py-2 px-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Left section - search */}
        <div className="flex items-center">
          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-blue-300" />
            <Input
              type="search"
              placeholder="Search properties, calculations..."
              className="pl-8 bg-blue-900/50 border-blue-700 placeholder:text-blue-300/50 text-blue-100 focus-visible:ring-cyan-400"
            />
          </div>
        </div>
        
        {/* Right section - user info & actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-blue-400 hover:text-blue-200 hover:bg-blue-900/40">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-medium text-white">3</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-blue-900 border-blue-700 text-blue-200">
              <DropdownMenuLabel className="text-cyan-300">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-800/60" />
              <div className="max-h-80 overflow-y-auto">
                {[1, 2, 3].map((item) => (
                  <DropdownMenuItem key={item} className="py-3 flex flex-col items-start cursor-pointer hover:bg-blue-800/50">
                    <div className="flex justify-between w-full">
                      <span className="font-medium text-blue-100">Cost matrix updated</span>
                      <span className="text-xs text-blue-400">2h ago</span>
                    </div>
                    <p className="text-sm text-blue-300 mt-1">New regional cost factors available for downtown area</p>
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator className="bg-blue-800/60" />
              <DropdownMenuItem className="justify-center text-cyan-400 hover:bg-blue-800/50 hover:text-cyan-300">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-2 text-blue-300 hover:bg-blue-900/40 hover:text-blue-100"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/70 to-blue-700/70 flex items-center justify-center border border-blue-700/50">
                  <User className="h-4 w-4 text-blue-100" />
                </div>
                {user && (
                  <>
                    <div className="text-left">
                      <p className="text-sm font-medium">{user.fullName || user.username}</p>
                      <p className="text-xs text-blue-400">{user.role || "Analyst"}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-blue-400" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-blue-900 border-blue-700 text-blue-100">
              <DropdownMenuLabel className="text-cyan-300">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-800/60" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <User className="mr-2 h-4 w-4 text-blue-300" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <Settings className="mr-2 h-4 w-4 text-blue-300" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <Database className="mr-2 h-4 w-4 text-blue-300" />
                  <span>My Data</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-blue-800/60" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <Sun className="mr-2 h-4 w-4 text-blue-300" />
                  <span>Light Mode</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <Moon className="mr-2 h-4 w-4 text-blue-300" />
                  <span>Dark Mode</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-blue-800/60" />
              <DropdownMenuGroup>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <HelpCircle className="mr-2 h-4 w-4 text-blue-300" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-blue-800/50">
                  <ExternalLink className="mr-2 h-4 w-4 text-blue-300" />
                  <span>Documentation</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-blue-800/60" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-300 hover:bg-red-900/20 hover:text-red-200"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}