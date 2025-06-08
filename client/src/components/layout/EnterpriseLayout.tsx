import React, { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Calculator, 
  BarChart3, 
  Map, 
  Settings, 
  FileText, 
  Database, 
  TrendingUp,
  Users,
  Import,
  Menu,
  X,
  Home,
  Bot,
  HelpCircle,
  ChevronDown,
  Bell,
  Search,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import TerraFusionLogo from '@/components/TerraFusionLogo';

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  description?: string;
  children?: NavigationItem[];
  badge?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/',
    description: 'Overview and quick access'
  },
  {
    id: 'valuation',
    label: 'Property Valuation',
    icon: Building2,
    href: '/properties',
    description: 'Property search and analysis',
    children: [
      { id: 'properties', label: 'Property Browser', icon: Building2, href: '/properties' },
      { id: 'benton-county', label: 'Benton County', icon: Map, href: '/benton-county' },
      { id: 'maps', label: 'Geographic Analysis', icon: Map, href: '/maps' }
    ]
  },
  {
    id: 'analysis',
    label: 'Cost Analysis',
    icon: Calculator,
    href: '/calculator',
    description: 'Building cost calculations',
    children: [
      { id: 'calculator', label: 'Cost Calculator', icon: Calculator, href: '/calculator' },
      { id: 'cost-wizard', label: 'Cost Wizard', icon: Calculator, href: '/cost-wizard' },
      { id: 'cost-factors', label: 'Cost Factors', icon: Database, href: '/cost-factors' }
    ]
  },
  {
    id: 'data',
    label: 'Data Management',
    icon: Database,
    href: '/matrix',
    description: 'Data import and matrix management',
    children: [
      { id: 'matrix', label: 'Cost Matrix', icon: Database, href: '/matrix' },
      { id: 'import', label: 'Data Import', icon: Import, href: '/import' },
      { id: 'diagnostic', label: 'Data Diagnostics', icon: TrendingUp, href: '/diagnostic' }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    href: '/dashboards',
    description: 'Business intelligence and reporting',
    children: [
      { id: 'dashboards', label: 'Analytics Dashboard', icon: BarChart3, href: '/dashboards' },
      { id: 'reports', label: 'Reports', icon: FileText, href: '/reports' },
      { id: 'trend-analysis', label: 'Trend Analysis', icon: TrendingUp, href: '/trend-analysis' }
    ]
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: Bot,
    href: '/agents',
    description: 'AI-powered analysis and automation',
    badge: 'New'
  },
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    href: '/help',
    description: 'Documentation and support resources'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'System configuration and preferences'
  }
];

const bottomNavigationItems: NavigationItem[] = [
  {
    id: 'help',
    label: 'Help & Support',
    icon: HelpCircle,
    href: '/help',
    description: 'Documentation and support'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    description: 'Application preferences'
  }
];

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(['valuation']);
  const [location] = useLocation();
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const getActiveParent = () => {
    for (const item of navigationItems) {
      if (item.children) {
        for (const child of item.children) {
          if (isActiveRoute(child.href)) {
            return item.id;
          }
        }
      }
      if (isActiveRoute(item.href)) {
        return item.id;
      }
    }
    return null;
  };

  useEffect(() => {
    const activeParent = getActiveParent();
    if (activeParent && !expandedItems.includes(activeParent)) {
      setExpandedItems(prev => [...prev, activeParent]);
    }
  }, [location]);

  const NavigationItem: React.FC<{ item: NavigationItem; level?: number }> = ({ 
    item, 
    level = 0 
  }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isActiveRoute(item.href);
    const isParentActive = item.children?.some(child => isActiveRoute(child.href));

    return (
      <div>
        <div
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group',
            level > 0 && 'ml-6 py-2',
            isActive || isParentActive
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            }
          }}
        >
          {!hasChildren ? (
            <Link href={item.href} className="flex items-center gap-3 flex-1">
              <item.icon className={cn(
                'h-5 w-5 flex-shrink-0',
                level > 0 && 'h-4 w-4'
              )} />
              {sidebarOpen && (
                <span className={cn(
                  'font-medium truncate',
                  level > 0 && 'text-sm'
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="font-medium truncate flex-1">{item.label}</span>
                  <ChevronDown className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )} />
                </>
              )}
            </div>
          )}

          {item.badge && sidebarOpen && (
            <span className="px-2 py-0.5 text-xs font-medium bg-sky-500/20 text-sky-400 rounded-md border border-sky-500/30">
              {item.badge}
            </span>
          )}

          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-500 rounded-r-full" />
          )}
        </div>

        {hasChildren && isExpanded && sidebarOpen && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => (
              <NavigationItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar */}
      <div className={cn(
        'flex flex-col bg-slate-900/90 border-r border-slate-700/50 backdrop-blur-sm transition-all duration-300',
        sidebarOpen ? 'w-72' : 'w-16'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <TerraFusionLogo variant="circular" size="md" />
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-slate-100">TerraFusion</h1>
                <p className="text-xs text-sky-400">AI That Understands Land</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {navigationItems.map(item => (
              <NavigationItem key={item.id} item={item} />
            ))}
          </div>

          <div className="px-4 py-2">
            <div className="h-px bg-slate-700/50" />
          </div>

          <div className="px-4 pb-4 space-y-2">
            {bottomNavigationItems.map(item => (
              <NavigationItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* User section */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                <User className="h-4 w-4 text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user?.name || user?.username || 'User'}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  Property Analyst
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 border-b border-slate-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search properties, analyses, reports..."
                className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 w-96"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-300">
              <Bell className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span>System Operational</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EnterpriseLayout;