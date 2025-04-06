import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Search,
  Bell,
  MessageSquare,
  HelpCircle,
  Settings,
  User,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface TopNavbarProps {
  toggleSidebar?: () => void;
}

export default function TopNavbar({ toggleSidebar }: TopNavbarProps) {
  const [showSearchInput, setShowSearchInput] = useState(false);

  return (
    <div 
      className="bg-white border-b border-neutral-200 py-2 px-4 flex items-center justify-between h-16"
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Left section: Logo and hamburger menu */}
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2 md:hidden" 
          onClick={toggleSidebar}
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(1px)'
          }}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <div 
          className="flex items-center mr-8"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(2px)'
          }}
        >
          <img 
            src="@assets/BC.png" 
            alt="Benton County" 
            className="h-10 w-10 mr-2" 
          />
          <span className="text-lg font-semibold text-[#243E4D]">Building Cost System</span>
        </div>

        {/* Quick navigation links */}
        <div className="hidden md:flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-neutral-600 hover:text-[#29B7D3]"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(1px)'
            }}
          >
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-neutral-600 hover:text-[#29B7D3]"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(1px)'
            }}
          >
            <Link href="/reports">Reports</Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-neutral-600 hover:text-[#29B7D3]"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(1px)'
            }}
          >
            <Link href="/analytics">Analytics</Link>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="text-neutral-600 hover:text-[#29B7D3] relative"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(1px)'
            }}
          >
            <Link href="/cost-matrix">
              <span>Cost Matrix</span>
              <Badge 
                className="absolute -top-1 -right-1 bg-[#29B7D3] hover:bg-[#29B7D3] text-white"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(2px)'
                }}
              >
                New
              </Badge>
            </Link>
          </Button>
        </div>
      </div>

      {/* Right section: Search, Notifications, User */}
      <div className="flex items-center space-x-2">
        {/* Search */}
        <div className="relative">
          {showSearchInput ? (
            <div className="animate-in fade-in-0 zoom-in-95 absolute right-0 top-0 z-10 bg-white border border-neutral-200 rounded-md shadow-md py-1 px-2 flex items-center">
              <Input 
                type="text" 
                placeholder="Search..." 
                className="w-64 h-9 text-sm bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0" 
                autoFocus
                onBlur={() => setShowSearchInput(false)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-neutral-500"
                onClick={() => setShowSearchInput(false)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              className="text-neutral-500 hover:text-neutral-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(1px)'
              }}
              onClick={() => setShowSearchInput(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="relative text-neutral-500 hover:text-neutral-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(1px)'
              }}
            >
              <Bell className="h-5 w-5" />
              <span 
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'translateZ(2px)'
                }}
              >
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-2 text-sm font-medium">Notifications</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start">
              <div className="font-medium">New cost matrix uploaded</div>
              <div className="text-xs text-muted-foreground">2 minutes ago</div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start">
              <div className="font-medium">System update completed</div>
              <div className="text-xs text-muted-foreground">1 hour ago</div>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start">
              <div className="font-medium">New regional costs available</div>
              <div className="text-xs text-muted-foreground">Yesterday</div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-[#29B7D3]">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button 
          variant="ghost" 
          size="icon"
          className="text-neutral-500 hover:text-neutral-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(1px)'
          }}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Messages */}
        <Button 
          variant="ghost" 
          size="icon"
          className="text-neutral-500 hover:text-neutral-700 hidden md:flex"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(1px)'
          }}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="rounded-full h-10 w-10 overflow-hidden border border-neutral-200"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(1px)'
              }}
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="p-2 text-sm font-medium">John Assessor</div>
            <div className="px-2 pb-2 text-xs text-muted-foreground">Benton County, WA</div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}