import React, { useState } from 'react';
import { Link } from 'wouter';
import TerraBuildLogo from './TerraBuildLogo';
import TerraBuildThemeSwitcher from './TerraBuildThemeSwitcher';
import { 
  Home, 
  Calculator, 
  BarChart, 
  Map, 
  Settings, 
  Menu, 
  X, 
  HelpCircle, 
  Activity,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TerraBuildAppBarProps {
  title?: string;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
}

export function TerraBuildAppBar({
  title = 'TerraBuild: Benton County',
  userName = 'Demo User',
  userRole = 'Assessor',
  userAvatar = ''
}: TerraBuildAppBarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', icon: <Home className="w-4 h-4 mr-2" />, path: '/' },
    { label: 'Cost Calculator', icon: <Calculator className="w-4 h-4 mr-2" />, path: '/calculator' },
    { label: 'Reports', icon: <BarChart className="w-4 h-4 mr-2" />, path: '/reports' },
    { label: 'Geo Assessment', icon: <Map className="w-4 h-4 mr-2" />, path: '/geo-assessment' },
    { label: 'Analytics', icon: <Activity className="w-4 h-4 mr-2" />, path: '/analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Desktop navigation */}
      <div className="bg-[#001529] text-white shadow-lg">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between h-16">
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <TerraBuildLogo size="sm" className="shrink-0" />
              <div className="hidden md:block">
                <h1 className="text-lg font-semibold">{title}</h1>
              </div>
            </div>

            {/* Desktop navigation links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-cyan-800/20 transition-colors">
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </Link>
              ))}
            </nav>

            {/* Right-side items */}
            <div className="flex items-center gap-2">
              <TerraBuildThemeSwitcher className="hidden lg:flex" />
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-cyan-800/20">
                <HelpCircle className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border-2 border-cyan-400">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback className="bg-cyan-700 text-white">
                        {userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userRole}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden text-white hover:bg-cyan-800/20"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#001529]/95 backdrop-blur-sm">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a 
                  className="flex items-center px-3 py-2 text-base font-medium rounded-md text-white hover:bg-cyan-800/20 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
            <div className="pt-2">
              <TerraBuildThemeSwitcher className="px-3 py-2" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default TerraBuildAppBar;