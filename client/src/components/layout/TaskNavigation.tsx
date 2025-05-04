import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { useWorkflow } from '@/contexts/WorkflowContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/contexts/SidebarContext';
import { 
  Building2,
  Calculator,
  ChevronRight,
  ClipboardList,
  Map,
  BarChart3,
  Settings,
  Database,
  FileText,
  Home,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight
} from 'lucide-react';

// Define the task categories and their icons
const categoryIcons = {
  'property-assessment': <Building2 className="h-5 w-5" />,
  'assessment': <ClipboardList className="h-5 w-5" />,
  'analysis': <BarChart3 className="h-5 w-5" />,
  'management': <Settings className="h-5 w-5" />,
  'visualization': <Map className="h-5 w-5" />
};

// Define category titles
const categoryTitles = {
  'property-assessment': 'Property Assessment',
  'assessment': 'Assessment Tools',
  'analysis': 'Analysis Tools',
  'management': 'Data Management',
  'visualization': 'Visualization'
};

// Interface for a task category
interface TaskCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
}

interface TaskNavigationProps {
  className?: string;
}

export default function TaskNavigation({ className }: TaskNavigationProps) {
  const { state, navigateToTask, getTaskStatus, getTaskById } = useWorkflow();
  const { isExpanded } = useSidebar();
  const [location] = useLocation();

  // Get all available tasks from the workflow context
  const tasks = [
    // Assessment Tasks
    {
      id: 'property_selection',
      label: 'Property Selection',
      description: 'Find and select properties for assessment',
      route: '/properties',
      category: 'assessment',
      icon: <Building2 />
    },
    {
      id: 'assessment_parameters',
      label: 'Building Parameters',
      description: 'Set assessment parameters',
      route: '/calculator-v2',
      requiredTasks: ['property_selection'],
      requiredData: ['propertyId'],
      category: 'assessment',
      icon: <Calculator />
    },
    {
      id: 'calculate_costs',
      label: 'Calculate Costs',
      description: 'Perform cost calculations',
      route: '/calculator-v2/results',
      requiredTasks: ['assessment_parameters'],
      category: 'assessment',
      icon: <Calculator />
    },
    {
      id: 'review_results',
      label: 'Review Results',
      description: 'Review calculation results',
      route: '/calculator-v2/summary',
      requiredTasks: ['calculate_costs'],
      category: 'assessment',
      icon: <FileText />
    },
    {
      id: 'geo_assessment',
      label: 'GeoAssessment',
      description: 'Geographic property assessment',
      route: '/geo-assessment',
      category: 'assessment',
      icon: <Map />
    },
    // Analysis Tasks
    {
      id: 'regional_comparison',
      label: 'Regional Comparison',
      description: 'Compare costs across regions',
      route: '/regional-cost-comparison',
      category: 'analysis',
      icon: <Map />
    },
    {
      id: 'cost_trend_analysis',
      label: 'Cost Trends',
      description: 'Analyze cost trends over time',
      route: '/cost-trend-analysis',
      category: 'analysis',
      icon: <BarChart3 />
    },
    {
      id: 'predictive_analysis',
      label: 'Predictive Analysis',
      description: 'Predict future cost trends',
      route: '/predictive-cost-analysis',
      category: 'analysis',
      icon: <BarChart3 />
    },
    // Data Management Tasks
    {
      id: 'data_import',
      label: 'Data Import',
      description: 'Import property and cost data',
      route: '/data-import',
      category: 'management',
      icon: <Database />
    },
    {
      id: 'data_connections',
      label: 'Data Connections',
      description: 'Configure external data connections',
      route: '/data-connections',
      category: 'management',
      icon: <Database />
    },
    // Visualization Tasks
    {
      id: 'visualizations',
      label: 'Visualization Lab',
      description: 'Interactive data visualizations',
      route: '/visualizations',
      category: 'visualization',
      icon: <BarChart3 />
    },
    {
      id: 'mcp_visualizations',
      label: 'MCP Visualizations',
      description: 'Advanced MCP visualizations',
      route: '/mcp-visualizations',
      category: 'visualization',
      icon: <BarChart3 />
    }
  ] as const;

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    const { category } = task;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, typeof tasks>);

  // Sort categories in specific order
  const categories = ['property-assessment', 'assessment', 'analysis', 'visualization', 'management'];

  // Render a task item
  const renderTaskItem = (task: typeof tasks[0], isCollapsed: boolean) => {
    const taskStatus = getTaskStatus(task.id);
    const isActive = location === task.route;
    
    // Status indicators
    const statusIcon = () => {
      switch (taskStatus) {
        case 'completed':
          return <CheckCircle2 className="h-4 w-4 text-green-500" />;
        case 'current':
          return <ArrowRight className="h-4 w-4 text-blue-500" />;
        case 'locked':
          return <Lock className="h-4 w-4 text-gray-400" />;
        default:
          return null;
      }
    };

    if (isCollapsed) {
      return (
        <TooltipProvider key={task.id}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-center my-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative h-10 w-10 rounded-full",
                    isActive
                      ? "bg-[#e6eef2] text-[#243E4D]"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                    taskStatus === 'locked' && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => navigateToTask(task.id)}
                  disabled={taskStatus === 'locked'}
                >
                  {React.cloneElement(task.icon as React.ReactElement, {
                    className: "h-5 w-5",
                  })}
                  {statusIcon() && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full">
                      {statusIcon()}
                    </div>
                  )}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="flex flex-col gap-1">
              <p className="font-medium">{task.label}</p>
              <p className="text-xs text-gray-500">{task.description}</p>
              {taskStatus === 'locked' && (
                <div className="text-xs mt-1 text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Complete previous tasks first</span>
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <Button
        key={task.id}
        variant="ghost"
        className={cn(
          "w-full justify-start mb-1 border-l-2 border-transparent rounded-r-md rounded-l-none transition-all relative",
          isActive
            ? "bg-[#e6eef2] text-[#243E4D] border-l-[#243E4D] font-medium shadow-md"
            : "text-gray-600 hover:bg-[#f0f4f7] hover:text-[#243E4D] hover:shadow-sm",
          taskStatus === 'locked' && "opacity-70 cursor-not-allowed"
        )}
        onClick={() => navigateToTask(task.id)}
        disabled={taskStatus === 'locked'}
      >
        {React.cloneElement(task.icon as React.ReactElement, {
          className: cn("mr-2 h-4 w-4", isActive ? "text-[#29B7D3]" : "text-gray-500"),
        })}
        <span>{task.label}</span>
        <div className="ml-auto flex items-center">
          {statusIcon()}
        </div>
      </Button>
    );
  };

  // Render a category section
  const renderCategorySection = (categoryId: string, isCollapsed: boolean) => {
    if (!tasksByCategory[categoryId]) return null;

    if (isCollapsed) {
      return (
        <div key={categoryId} className="mb-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center mb-2">
                  <div
                    className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center"
                    style={{ transform: 'translateZ(3px)' }}
                  >
                    {categoryIcons[categoryId as keyof typeof categoryIcons]}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="min-w-[160px]">
                <p className="font-medium">{categoryTitles[categoryId as keyof typeof categoryTitles]}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div>
            {tasksByCategory[categoryId].map((task) => renderTaskItem(task, true))}
          </div>
        </div>
      );
    }

    return (
      <div key={categoryId} className="mb-6">
        <div className="flex items-center px-4 mb-2">
          {categoryIcons[categoryId as keyof typeof categoryIcons] && (
            React.cloneElement(
              categoryIcons[categoryId as keyof typeof categoryIcons] as React.ReactElement,
              { className: "h-4 w-4 text-gray-500 mr-2" }
            )
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {categoryTitles[categoryId as keyof typeof categoryTitles]}
          </span>
        </div>
        <div className="space-y-1">
          {tasksByCategory[categoryId].map((task) => renderTaskItem(task, false))}
        </div>
      </div>
    );
  };

  return (
    <ScrollArea className="h-[calc(100vh-120px)]">
      <div className="py-4">
        {/* Home link always visible at the top */}
        <div className="px-4 mb-6">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start mb-1 border-l-2 border-transparent rounded-r-md rounded-l-none transition-all",
              location === "/dashboard"
                ? "bg-[#e6eef2] text-[#243E4D] border-l-[#243E4D] font-medium shadow-md"
                : "text-gray-600 hover:bg-[#f0f4f7] hover:text-[#243E4D] hover:shadow-sm"
            )}
            onClick={() => navigateToTask('dashboard')}
          >
            <Home className={cn("mr-2 h-4 w-4", location === "/dashboard" ? "text-[#29B7D3]" : "text-gray-500")} />
            <span>Dashboard</span>
          </Button>
        </div>

        {/* Render all categories in the specific order */}
        {categories.map((categoryId) => renderCategorySection(categoryId, !isExpanded))}
      </div>
    </ScrollArea>
  );
}