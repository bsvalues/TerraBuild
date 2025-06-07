import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Map, 
  Calculator, 
  TrendingUp, 
  FileText, 
  Settings, 
  Database,
  Users,
  BarChart3,
  Building,
  Layers,
  Zap,
  ChevronDown,
  ChevronRight,
  Activity,
  Target,
  Brain,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavigationItem {
  id: string;
  title: string;
  icon: any;
  path?: string;
  badge?: string;
  children?: NavigationItem[];
  description?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'overview',
    title: 'Command Center',
    icon: LayoutDashboard,
    path: '/',
    description: 'Executive dashboard with real-time county metrics'
  },
  {
    id: 'intelligence',
    title: 'AI Intelligence',
    icon: Brain,
    children: [
      {
        id: 'predictive',
        title: 'Predictive Analytics',
        icon: TrendingUp,
        path: '/predictive',
        badge: 'AI',
        description: 'Market trend forecasting and risk assessment'
      },
      {
        id: 'insights',
        title: 'Smart Insights',
        icon: Eye,
        path: '/insights',
        badge: 'New',
        description: 'Automated pattern recognition and recommendations'
      }
    ]
  },
  {
    id: 'assessment',
    title: 'Property Assessment',
    icon: Building,
    children: [
      {
        id: 'properties',
        title: 'Property Browser',
        icon: Database,
        path: '/properties',
        description: 'Search and analyze property records'
      },
      {
        id: 'calculator',
        title: 'Valuation Engine',
        icon: Calculator,
        path: '/calculator',
        description: 'Advanced cost calculation tools'
      },
      {
        id: 'cost-factors',
        title: 'Cost Factor Tables',
        icon: Layers,
        path: '/cost-factors',
        description: 'Building cost matrices and multipliers'
      }
    ]
  },
  {
    id: 'geographic',
    title: 'Geographic Intelligence',
    icon: Map,
    children: [
      {
        id: 'maps',
        title: 'Interactive Maps',
        icon: Map,
        path: '/maps',
        description: 'Geospatial property visualization'
      },
      {
        id: 'benton-county',
        title: 'Benton County Analysis',
        icon: Target,
        path: '/benton-county',
        description: 'Regional assessment overview'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Business Intelligence',
    icon: BarChart3,
    children: [
      {
        id: 'dashboards',
        title: 'Executive Dashboards',
        icon: LayoutDashboard,
        path: '/dashboards',
        description: 'KPI monitoring and performance metrics'
      },
      {
        id: 'reports',
        title: 'Advanced Reports',
        icon: FileText,
        path: '/reports',
        description: 'Custom reporting and data export'
      },
      {
        id: 'trend-analysis',
        title: 'Trend Analysis',
        icon: Activity,
        path: '/trend-analysis',
        description: 'Historical data patterns and projections'
      }
    ]
  },
  {
    id: 'administration',
    title: 'System Administration',
    icon: Settings,
    children: [
      {
        id: 'settings',
        title: 'System Settings',
        icon: Settings,
        path: '/settings',
        description: 'Platform configuration and preferences'
      },
      {
        id: 'users',
        title: 'User Management',
        icon: Users,
        path: '/users',
        description: 'Access control and role management'
      },
      {
        id: 'diagnostic',
        title: 'System Diagnostics',
        icon: Activity,
        path: '/diagnostic',
        description: 'Performance monitoring and health checks'
      }
    ]
  }
];

interface TerraFusionSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const TerraFusionSidebar: React.FC<TerraFusionSidebarProps> = ({ 
  isCollapsed = false, 
  onToggle 
}) => {
  const [location] = useLocation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'assessment', 'geographic'])
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const isActive = (path: string) => {
    return location === path || (path !== '/' && location.startsWith(path));
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const Icon = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.id);
    const active = item.path ? isActive(item.path) : false;

    if (hasChildren) {
      return (
        <Collapsible key={item.id} open={isExpanded} onOpenChange={() => toggleSection(item.id)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={`w-full justify-start px-3 py-2 h-auto text-left transition-all duration-200 ${
                isCollapsed ? 'px-2' : ''
              } ${
                active 
                  ? 'bg-cyan-400/10 text-cyan-400 border-r-2 border-cyan-400' 
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                      )}
                    </div>
                  )}
                </div>
                {!isCollapsed && hasChildren && (
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <Badge variant="outline" className="text-xs bg-cyan-400/20 text-cyan-400 border-cyan-400">
                        {item.badge}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          {!isCollapsed && (
            <CollapsibleContent className="space-y-1">
              <div className="ml-6 pl-4 border-l border-slate-700">
                {item.children?.map(child => renderNavigationItem(child, level + 1))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      );
    }

    const content = (
      <Button
        variant="ghost"
        className={`w-full justify-start px-3 py-2 h-auto text-left transition-all duration-200 ${
          isCollapsed ? 'px-2' : ''
        } ${
          active 
            ? 'bg-cyan-400/10 text-cyan-400 border-r-2 border-cyan-400' 
            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{item.title}</div>
                {item.description && (
                  <div className="text-xs text-slate-500 truncate">{item.description}</div>
                )}
              </div>
            )}
          </div>
          {!isCollapsed && item.badge && (
            <Badge variant="outline" className="text-xs bg-cyan-400/20 text-cyan-400 border-cyan-400">
              {item.badge}
            </Badge>
          )}
        </div>
      </Button>
    );

    return item.path ? (
      <Link key={item.id} href={item.path}>
        {content}
      </Link>
    ) : (
      <div key={item.id}>{content}</div>
    );
  };

  return (
    <aside className={`bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } flex flex-col h-full`}>
      
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-bold text-white">Navigation</h2>
              <p className="text-xs text-slate-400">TerraFusion Platform</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-slate-400 hover:text-white"
          >
            <Zap className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigationItems.map(item => renderNavigationItem(item))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className={`${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="text-xs text-slate-400">System Health</div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">CPU Usage</span>
                <span className="text-green-400">23%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Memory</span>
                <span className="text-cyan-400">67%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Database</span>
                <span className="text-green-400">Online</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto"></div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default TerraFusionSidebar;