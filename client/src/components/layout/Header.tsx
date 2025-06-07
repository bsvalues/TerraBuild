import React, { useState } from 'react';
import { Bell, HelpCircle, Menu, Settings, User, LogOut } from 'lucide-react';
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

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {

  return (
    <header className="h-16 z-30 bg-gradient-to-r from-[#083344] to-[#0891B2] border-b border-cyan-800/40 flex items-center px-4 justify-between">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          onClick={toggleSidebar} 
          className="mr-2 text-cyan-300 hover:text-cyan-100 hover:bg-cyan-800/30 lg:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        
        <div className="mr-6 hidden lg:flex">
          <TerraFusionLogo variant="with-text" textContent="TerraFusion" size="sm" className="h-8" />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex">
          <Button variant="outline" size="sm" className="text-cyan-300 border-cyan-800 bg-[#083344]/40 hover:bg-cyan-800/60 mr-2">
            <HelpCircle className="h-4 w-4 mr-1" />
            Help
          </Button>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative p-1 rounded-full text-cyan-300 hover:text-cyan-100 hover:bg-cyan-800/30">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-[#2DD4BF]"></span>
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 bg-[#083344] border-cyan-800 text-cyan-100" align="end">
            <div className="flex items-center justify-between px-4 py-2 border-b border-cyan-800/40">
              <span className="font-semibold">Notifications</span>
              <Button variant="link" className="text-cyan-400 hover:text-cyan-300 h-auto p-0">
                Mark all as read
              </Button>
            </div>
            <div className="py-2 px-4 text-cyan-400 text-sm">
              No new notifications
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 rounded-full hover:bg-cyan-800/30 p-1">
              <Avatar className="h-8 w-8 border border-cyan-800 bg-cyan-800">
                <AvatarFallback className="bg-gradient-to-br from-[#2DD4BF]/20 to-[#0891B2]/40 text-cyan-100 font-medium">
                  TF
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#083344] border-cyan-800 text-cyan-100" align="end">
            <div className="px-4 py-3 border-b border-cyan-800/40">
              <p className="text-sm font-medium text-cyan-100">TerraFusion User</p>
              <p className="text-xs text-cyan-400 mt-0.5">Property Analyst</p>
            </div>
            <DropdownMenuItem className="hover:bg-cyan-800/30 text-cyan-200 focus:bg-cyan-800/50 focus:text-cyan-100">
              <User className="mr-2 h-4 w-4 text-cyan-400" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-cyan-800/30 text-cyan-200 focus:bg-cyan-800/50 focus:text-cyan-100">
              <Settings className="mr-2 h-4 w-4 text-cyan-400" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-cyan-800/40" />
            <DropdownMenuItem className="hover:bg-cyan-800/30 text-cyan-200 focus:bg-cyan-800/50 focus:text-cyan-100">
              <Settings className="mr-2 h-4 w-4 text-cyan-400" />
              <span>Help & Support</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}