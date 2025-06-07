import React, { useState, useEffect } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useLocation } from 'wouter';
import { 
  Search, 
  Calculator, 
  MapPin, 
  BarChart3, 
  Building, 
  Database, 
  Settings, 
  FileText,
  Users,
  Activity,
  Zap,
  Brain,
  Target
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: any;
  category: string;
  keywords: string[];
}

const commands: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Command Center',
    description: 'Executive dashboard with real-time metrics',
    path: '/',
    icon: Target,
    category: 'Navigation',
    keywords: ['dashboard', 'home', 'overview', 'metrics']
  },
  {
    id: 'properties',
    title: 'Property Assessment',
    description: 'Search and analyze property records',
    path: '/properties',
    icon: Building,
    category: 'Core Features',
    keywords: ['property', 'assessment', 'valuation', 'search']
  },
  {
    id: 'calculator',
    title: 'Valuation Engine',
    description: 'Advanced cost calculation tools',
    path: '/calculator',
    icon: Calculator,
    category: 'Core Features',
    keywords: ['calculator', 'valuation', 'cost', 'estimate']
  },
  {
    id: 'maps',
    title: 'Geographic Intelligence',
    description: 'Interactive property mapping',
    path: '/maps',
    icon: MapPin,
    category: 'Analytics',
    keywords: ['maps', 'geographic', 'spatial', 'gis']
  },
  {
    id: 'dashboards',
    title: 'Business Intelligence',
    description: 'Executive dashboards and KPI monitoring',
    path: '/dashboards',
    icon: BarChart3,
    category: 'Analytics',
    keywords: ['dashboard', 'analytics', 'bi', 'kpi', 'metrics']
  },
  {
    id: 'predictive',
    title: 'Predictive Analytics',
    description: 'AI-powered market forecasting',
    path: '/predictive',
    icon: Brain,
    category: 'AI Intelligence',
    keywords: ['ai', 'predictive', 'forecast', 'machine learning']
  },
  {
    id: 'cost-factors',
    title: 'Cost Factor Tables',
    description: 'Building cost matrices and multipliers',
    path: '/cost-factors',
    icon: Database,
    category: 'Data Management',
    keywords: ['cost', 'factors', 'tables', 'matrix', 'data']
  },
  {
    id: 'reports',
    title: 'Advanced Reports',
    description: 'Custom reporting and data export',
    path: '/reports',
    icon: FileText,
    category: 'Reporting',
    keywords: ['reports', 'export', 'documentation', 'analysis']
  },
  {
    id: 'settings',
    title: 'System Settings',
    description: 'Platform configuration and preferences',
    path: '/settings',
    icon: Settings,
    category: 'Administration',
    keywords: ['settings', 'config', 'preferences', 'system']
  },
  {
    id: 'users',
    title: 'User Management',
    description: 'Access control and role management',
    path: '/users',
    icon: Users,
    category: 'Administration',
    keywords: ['users', 'roles', 'permissions', 'access']
  },
  {
    id: 'diagnostic',
    title: 'System Diagnostics',
    description: 'Performance monitoring and health checks',
    path: '/diagnostic',
    icon: Activity,
    category: 'Administration',
    keywords: ['diagnostic', 'performance', 'health', 'monitoring']
  }
];

interface TerraFusionCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TerraFusionCommandPalette: React.FC<TerraFusionCommandPaletteProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [, setLocation] = useLocation();

  const handleSelect = (path: string) => {
    setLocation(path);
    onOpenChange(false);
  };

  const groupedCommands = commands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = [];
    }
    groups[command.category].push(command);
    return groups;
  }, {} as Record<string, CommandItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search TerraFusion features, navigate to pages..." 
        className="border-0 focus:ring-0"
      />
      <CommandList className="max-h-96">
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([category, items]) => (
          <CommandGroup key={category} heading={category}>
            {items.map((command) => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={`${command.title} ${command.description} ${command.keywords.join(' ')}`}
                  onSelect={() => handleSelect(command.path)}
                  className="flex items-center space-x-3 p-3 cursor-pointer"
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{command.title}</div>
                    <div className="text-xs text-slate-500">{command.description}</div>
                  </div>
                  <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                    {command.path}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default TerraFusionCommandPalette;