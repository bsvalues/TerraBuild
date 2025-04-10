import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, Bell, User, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import bentonSeal from '@assets/BC.png';

interface TopNavbarProps {
  toggleSidebar: () => void;
}

export default function TopNavbar({ toggleSidebar }: TopNavbarProps) {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSidebar}
            className="mr-2 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <img src={bentonSeal} alt="Benton County Seal" className="h-8 w-8 mr-2" />
            <h1 className="font-semibold text-xl text-[#243E4D]">
              BCBS
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center border-l border-border pl-3">
            <div className="mr-2 text-right">
              <div className="text-sm font-medium">{user?.name || 'County Assessor'}</div>
              <div className="text-xs text-muted-foreground">{user?.role || 'Admin'}</div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-[#f0f4f7]">
              <User className="h-5 w-5 text-[#243E4D]" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}