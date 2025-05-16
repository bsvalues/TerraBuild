import React, { useState } from 'react';
import { Bell, HelpCircle, Menu, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context-fixed';
import TerraFusionLogo from '@/components/TerraFusionLogo';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const userInitials = user ? getInitials(user.name || user.username || '') : 'U';

  return (
    <header className="h-16 z-30 bg-gradient-to-r from-blue-950 to-blue-900 border-b border-blue-800/40 flex items-center px-4 justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          onClick={toggleSidebar} 
          className="mr-2 text-blue-300 hover:text-blue-100 hover:bg-blue-800/30 lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        
        <div className="mr-6 hidden lg:flex">
          <TerraFusionLogo variant="with-text" textContent="TerraFusion Build" size="sm" className="h-8" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex">
          <Button variant="outline" size="sm" className="text-blue-300 border-blue-800 bg-blue-900/40 hover:bg-blue-800/60 mr-2">
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative p-1 rounded-full text-blue-300 hover:text-blue-100 hover:bg-blue-800/30">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-cyan-500"></span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-blue-900 border-blue-800 text-blue-100" align="end">
            <div className="flex items-center justify-between px-4 py-2 border-b border-blue-800/40">
              <span className="font-semibold">Notifications</span>
              <Button variant="link" className="text-cyan-400 hover:text-cyan-300 h-auto p-0">
                Mark all as read
              </Button>
            </div>
            <div className="py-2 px-4 text-blue-400 text-sm">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 rounded-full hover:bg-blue-800/30 p-1">
              <Avatar className="h-8 w-8 border border-blue-800 bg-blue-800">
                <AvatarFallback className="bg-gradient-to-br from-cyan-500/20 to-blue-700/40 text-blue-100 font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-blue-900 border-blue-800 text-blue-100" align="end">
            <div className="px-4 py-3 border-b border-blue-800/40">
              <p className="text-sm font-medium text-blue-100">{user?.name || user?.username}</p>
              <p className="text-xs text-blue-400 mt-0.5">{user?.role}</p>
            </div>
            <DropdownMenuItem className="hover:bg-blue-800/30 text-blue-200 focus:bg-blue-800/50 focus:text-blue-100">
              <User className="mr-2 h-4 w-4 text-blue-400" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-blue-800/30 text-blue-200 focus:bg-blue-800/50 focus:text-blue-100">
              <Settings className="mr-2 h-4 w-4 text-blue-400" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-blue-800/40" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="hover:bg-blue-800/30 text-blue-200 focus:bg-blue-800/50 focus:text-blue-100"
            >
              <LogOut className="mr-2 h-4 w-4 text-blue-400" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}