import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import TerraFusionLogo from '../TerraFusionLogo';
import { useAuth } from '@/hooks/use-auth';
import {
  Home,
  BarChart2,
  Map,
  Calculator,
  Settings,
  User,
  HelpCircle,
  BellRing,
  Search,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/hooks/use-sidebar';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  toggleSidebar?: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { isExpanded, toggle } = useSidebar();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/auth');
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="border-b border-blue-900/30 bg-gradient-to-r from-blue-950 to-blue-900 p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 text-blue-300 hover:bg-blue-900/50 hover:text-blue-200"
            onClick={toggleSidebar || toggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link href="/">
            <a className="flex items-center">
              <TerraFusionLogo variant="square" size="sm" className="mr-2" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-cyan-300">
                TerraFusion
              </span>
            </a>
          </Link>
          
          <div className="hidden md:flex items-center ml-8 space-x-1">
            <NavButton href="/dashboard" icon={<Home size={18} />} label="Dashboard" />
            <NavButton href="/calculator" icon={<Calculator size={18} />} label="Calculator" />
            <NavButton href="/analytics" icon={<BarChart2 size={18} />} label="Analytics" />
            <NavButton href="/visualizations" icon={<Map size={18} />} label="Visualizations" />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Expandable search */}
          <div className={`relative ${isSearchExpanded ? 'w-64' : 'w-9'} transition-all duration-300 ease-in-out`}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
              <Search className="h-4 w-4 text-blue-400" />
            </div>
            <Input 
              className={`pl-8 bg-blue-900/30 border-blue-700/30 text-blue-200 placeholder:text-blue-500 focus:border-cyan-600 focus:ring-cyan-600/50 transition-all duration-300 ${isSearchExpanded ? 'opacity-100 w-full' : 'opacity-0 md:opacity-100 w-0 md:w-full'}`}
              placeholder="Search..." 
              onFocus={() => setIsSearchExpanded(true)}
              onBlur={() => setIsSearchExpanded(false)}
            />
          </div>

          {/* Notification bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-blue-300 hover:bg-blue-900/50 hover:text-blue-200">
                <BellRing className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-cyan-500 text-xs">
                  2
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72 mr-4 bg-blue-950 border border-blue-800 shadow-xl shadow-blue-900/20">
              <DropdownMenuLabel className="text-blue-300">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-blue-800/50" />
              
              <div className="max-h-96 overflow-auto py-1">
                <NotificationItem 
                  title="System Update Complete" 
                  description="TerraFusion core was updated to version 2.5" 
                  time="10 min ago" 
                />
                <NotificationItem 
                  title="New Analytics Available" 
                  description="Regional cost comparison report is ready to view" 
                  time="1 hour ago" 
                  isNew
                />
                <NotificationItem 
                  title="Calculation Completed" 
                  description="Your batch valuation process has finished" 
                  time="Yesterday" 
                />
              </div>
              
              <DropdownMenuSeparator className="bg-blue-800/50" />
              <div className="p-2">
                <Button variant="outline" className="w-full text-blue-300 border-blue-700 hover:bg-blue-900/50">
                  View All Notifications
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-blue-700/50 ml-1 bg-blue-900/30 hover:bg-blue-900/50 p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage || ''} alt={user.username || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm">
                      {user.fullName ? getInitials(user.fullName) : user.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mr-2 bg-blue-950 border border-blue-800 shadow-xl shadow-blue-900/20">
                <DropdownMenuLabel className="text-blue-300">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-blue-800/50" />
                <DropdownMenuItem className="text-blue-300 focus:bg-blue-900/70 focus:text-cyan-300">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-blue-300 focus:bg-blue-900/70 focus:text-cyan-300">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-blue-300 focus:bg-blue-900/70 focus:text-cyan-300">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-blue-800/50" />
                <DropdownMenuItem 
                  className="text-blue-300 focus:bg-blue-900/70 focus:text-cyan-300"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}

// Helper component for navigation buttons
function NavButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
        isActive 
          ? 'bg-cyan-500/20 text-cyan-300' 
          : 'text-blue-300 hover:bg-blue-800/50 hover:text-cyan-200'
      }`}>
        <span className="mr-2">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </a>
    </Link>
  );
}

// Helper component for notification items
function NotificationItem({ 
  title, 
  description, 
  time, 
  isNew = false 
}: { 
  title: string; 
  description: string; 
  time: string; 
  isNew?: boolean 
}) {
  return (
    <div className={`px-3 py-2 hover:bg-blue-900/40 ${isNew ? 'border-l-2 border-cyan-500' : ''}`}>
      <div className="flex justify-between items-start">
        <p className="font-medium text-blue-200">{title}</p>
        <span className="text-xs text-blue-400">{time}</span>
      </div>
      <p className="text-sm text-blue-400 mt-1">{description}</p>
    </div>
  );
}