import React from 'react';
import { Bell, Search, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { APP_NAME } from '@/data/constants';
import { useAuth } from '@/contexts/auth-context';
import BentonBranding from '@/components/BentonBranding';

const Topbar: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <header className="border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <BentonBranding className="w-32 mr-6" />
          <h1 className="text-lg font-semibold">{APP_NAME}</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end md:justify-center px-6">
          <div className="w-full max-w-md">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full rounded-md border pl-8 pr-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <div className="mr-2 hidden md:block">
              <div className="text-sm font-medium">{user?.name || user?.username}</div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;