import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, User } from 'lucide-react';
import { SimpleTopMenu } from './SimpleTopMenu';

interface TopNavbarProps {
  toggleSidebar?: () => void; // Made optional for backward compatibility
}

export default function TopNavbar({ toggleSidebar }: TopNavbarProps) {
  // Use default values for the user since authentication is disabled
  const mockUser = {
    name: 'County Assessor',
    role: 'Admin'
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-30 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex-1 flex items-center">
          <SimpleTopMenu />
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <div className="flex items-center border-l border-border pl-3">
            <div className="mr-2 text-right">
              <div className="text-sm font-medium">{mockUser.name}</div>
              <div className="text-xs text-muted-foreground">{mockUser.role}</div>
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