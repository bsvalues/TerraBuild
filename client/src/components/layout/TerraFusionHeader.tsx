import React, { useState } from 'react';
import { Bell, Search, Settings, User, Globe, Zap, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TerraFusionCommandPalette from './TerraFusionCommandPalette';
import TerraFusionNotificationCenter from '../notifications/TerraFusionNotificationCenter';
import TerraFusionLogo from '@/components/TerraFusionLogo';

interface TerraFusionHeaderProps {
  countyName?: string;
  userRole?: string;
}

const TerraFusionHeader: React.FC<TerraFusionHeaderProps> = ({ 
  countyName = "Benton County", 
  userRole = "Senior Assessor" 
}) => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-cyan-400/20 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="relative group">
                <TerraFusionLogo variant="circular" size="sm" className="transition-transform hover:scale-105" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TerraFusion
                </h1>
                <p className="text-xs text-slate-400">Enterprise Infrastructure Intelligence</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-700"></div>
            
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-white">{countyName}</span>
              <Badge variant="outline" className="bg-green-400/20 text-green-400 border-green-400 text-xs">
                Active
              </Badge>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setCommandPaletteOpen(true)}
                className="w-full justify-start text-left bg-slate-800/50 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <Search className="h-4 w-4 mr-2" />
                Search TerraFusion...
                <div className="ml-auto flex items-center space-x-1">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </div>
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-medium text-white">Sarah Mitchell</div>
                <div className="text-xs text-slate-400">{userRole}</div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">SM</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-700"></div>

            <Button 
              variant="ghost" 
              size="sm" 
              className="relative text-slate-400 hover:text-white"
              onClick={() => setNotificationCenterOpen(true)}
            >
              <Bell className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                <DropdownMenuLabel className="text-slate-200">Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 hover:bg-slate-700">
                  <Settings className="mr-2 h-4 w-4" />
                  System Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem className="text-red-400 hover:bg-slate-700">
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-6 py-2 bg-slate-900/50 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-6 text-slate-400">
              <span>System Status: <span className="text-green-400">Operational</span></span>
              <span>Last Sync: <span className="text-cyan-400">2 minutes ago</span></span>
              <span>Processing: <span className="text-yellow-400">847 assessments</span></span>
            </div>
            <div className="flex items-center space-x-2 text-slate-400">
              <span>AI Confidence:</span>
              <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-green-400 to-cyan-400 rounded-full"></div>
              </div>
              <span className="text-cyan-400">98.7%</span>
            </div>
          </div>
        </div>
      </header>

      <TerraFusionCommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
      
      <TerraFusionNotificationCenter
        isOpen={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
      />
    </>
  );
};

export default TerraFusionHeader;