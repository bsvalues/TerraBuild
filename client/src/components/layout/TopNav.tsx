import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  LogOut, 
  User, 
  Settings, 
  Search, 
  LayoutDashboard, 
  Shield, 
  Building2
} from "lucide-react";
import { APP_NAME } from "@/data/constants";
import BentonBranding, { BentonColors } from '@/components/BentonBranding';

export default function TopNav() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="shadow-md">
      {/* Top gradient header with Benton County branding colors */}
      <div className="bg-gradient-to-r from-[#243E4D] to-[#496980] text-white">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#3CAB36] rounded-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <BentonBranding variant="horizontal" size="sm" showTagline={true} />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-2.5 py-1.5 bg-[#243E4D]/70 rounded-full text-xs flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Mission Control Panel</span>
            </div>
            
            <Button 
              size="sm" 
              className="bg-[#3CAB36] hover:bg-[#3CAB36]/90 text-white border-none rounded-md shadow-sm"
            >
              <LayoutDashboard className="mr-1 h-3.5 w-3.5" />
              Configure
            </Button>
          </div>
        </div>
      </div>
      
      {/* Secondary navigation */}
      <div className="bg-white border-b">
        <div className="flex h-14 items-center px-4 justify-between">
          {/* Status indicators */}
          <div className="flex gap-4">
            <div className="flex items-center text-sm">
              <span className="h-2 w-2 rounded-full bg-[#3CAB36] mr-2"></span>
              <span className="font-medium text-[#243E4D]">API Status:</span>
              <span className="ml-1 text-gray-600">Online</span>
            </div>
            
            <div className="flex items-center text-sm">
              <span className="h-2 w-2 rounded-full bg-[#3CAB36] mr-2"></span>
              <span className="font-medium text-[#243E4D]">System:</span>
              <span className="ml-1 text-gray-600">Healthy</span>
            </div>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search..."
                className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 pl-8 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#243E4D] focus:border-[#243E4D] transition-colors h-9 w-[250px]"
              />
            </div>

            <Button variant="outline" size="icon" className="relative border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#29B7D3]">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#F09E1D]"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50 rounded-full flex items-center gap-2 h-9 pr-2 pl-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#243E4D] to-[#29B7D3] text-white">
                    {user?.name ? (
                      user.name.charAt(0).toUpperCase()
                    ) : user?.username ? (
                      user.username.charAt(0).toUpperCase()
                    ) : (
                      'U'
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{user?.name || user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-gray-700 hover:text-[#29B7D3]">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-700 hover:text-[#29B7D3]">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}