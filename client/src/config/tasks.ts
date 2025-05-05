import { WorkflowTask } from '@/contexts/WorkflowContext';
import { 
  Building2,
  Calculator,
  Map,
  BarChart3,
  Database,
  FileText,
  LineChart,
  AreaChart,
  BrainCircuit,
  Users,
  Settings,
  RefreshCw,
  ClipboardList,
  Home,
  FileBarChart
} from 'lucide-react';
import React from 'react';

// Define all application tasks with their relationships and requirements
export const TASKS: WorkflowTask[] = [
  // Property Assessment Tasks
  {
    id: 'property-search',
    label: 'Property Search',
    description: 'Search and select a property for assessment',
    route: '/property-assessment/search',
    category: 'property-assessment',
    icon: React.createElement(Map)
  },
  {
    id: 'building-details',
    label: 'Building Details',
    description: 'Enter building details and specifications',
    route: '/property-assessment/building-details',
    category: 'property-assessment',
    icon: React.createElement(Building2),
    dependencies: ['property-search']
  },
  {
    id: 'condition-assessment',
    label: 'Condition Assessment',
    description: 'Assess the condition of the property',
    route: '/property-assessment/condition',
    category: 'property-assessment',
    icon: React.createElement(ClipboardList),
    dependencies: ['building-details']
  },
  {
    id: 'cost-calculation',
    label: 'Cost Calculation',
    description: 'Calculate property value based on building details',
    route: '/property-assessment/cost-calculation',
    category: 'property-assessment',
    icon: React.createElement(Calculator),
    dependencies: ['condition-assessment']
  },
  {
    id: 'review-assessment',
    label: 'Review Assessment',
    description: 'Review the assessment before finalizing',
    route: '/property-assessment/review',
    category: 'property-assessment',
    icon: React.createElement(FileBarChart),
    dependencies: ['cost-calculation']
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    description: 'Generate final assessment report',
    route: '/property-assessment/report',
    category: 'property-assessment',
    icon: React.createElement(FileText),
    dependencies: ['review-assessment']
  },
  
  // Dashboard - General management tasks
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Main dashboard with overview of all activities',
    route: '/dashboard',
    category: 'management',
    icon: React.createElement(Home)
  },
  
  // Assessment workflow
  {
    id: 'property_selection',
    label: 'Property Selection',
    description: 'Find and select properties for assessment',
    route: '/properties',
    category: 'assessment',
    icon: React.createElement(Building2)
  },
  {
    id: 'property_details',
    label: 'Property Details',
    description: 'View detailed property information',
    route: '/properties/:id',
    requiredTasks: ['property_selection'],
    requiredData: ['propertyId'],
    category: 'assessment',
    icon: React.createElement(Building2)
  },
  {
    id: 'assessment_parameters',
    label: 'Building Parameters',
    description: 'Set assessment parameters',
    route: '/calculator-v2',
    requiredTasks: ['property_selection'],
    requiredData: ['propertyId'],
    category: 'assessment',
    icon: React.createElement(Calculator)
  },
  {
    id: 'calculate_costs',
    label: 'Calculate Costs',
    description: 'Perform cost calculations',
    route: '/calculator-v2/results',
    requiredTasks: ['assessment_parameters'],
    category: 'assessment',
    icon: React.createElement(Calculator)
  },
  {
    id: 'review_results',
    label: 'Review Results',
    description: 'Review calculation results',
    route: '/calculator-v2/summary',
    requiredTasks: ['calculate_costs'],
    category: 'assessment',
    icon: React.createElement(FileText)
  },
  {
    id: 'geo_assessment',
    label: 'GeoAssessment',
    description: 'Geographic property assessment',
    route: '/geo-assessment',
    category: 'assessment',
    icon: React.createElement(Map)
  },
  {
    id: 'batch_assessment',
    label: 'Batch Assessment',
    description: 'Assess multiple properties simultaneously',
    route: '/batch-assessment',
    category: 'assessment',
    icon: React.createElement(ClipboardList)
  },
  
  // Analysis Tasks
  {
    id: 'regional_comparison',
    label: 'Regional Comparison',
    description: 'Compare costs across regions',
    route: '/regional-cost-comparison',
    category: 'analysis',
    icon: React.createElement(Map)
  },
  {
    id: 'cost_trend_analysis',
    label: 'Cost Trends',
    description: 'Analyze cost trends over time',
    route: '/cost-trend-analysis',
    category: 'analysis',
    icon: React.createElement(LineChart)
  },
  {
    id: 'comparative_analysis',
    label: 'Comparative Analysis',
    description: 'Compare properties and assessments',
    route: '/comparative-analysis',
    category: 'analysis',
    icon: React.createElement(BarChart3)
  },
  {
    id: 'statistical_analysis',
    label: 'Statistical Analysis',
    description: 'Statistical analysis of cost data',
    route: '/statistical-analysis',
    category: 'analysis',
    icon: React.createElement(AreaChart)
  },
  {
    id: 'predictive_analysis',
    label: 'Predictive Analysis',
    description: 'Predict future cost trends',
    route: '/predictive-cost-analysis',
    category: 'analysis',
    icon: React.createElement(BrainCircuit)
  },
  {
    id: 'benchmarking',
    label: 'Benchmarking',
    description: 'Compare against industry benchmarks',
    route: '/benchmarking',
    category: 'analysis',
    icon: React.createElement(FileBarChart)
  },
  {
    id: 'xreg_dashboard',
    label: 'XREG Dashboard',
    description: 'Explainable AI cost valuation insights',
    route: '/xreg',
    category: 'analysis',
    icon: React.createElement(BrainCircuit)
  },
  {
    id: 'matrix_xreg_integration',
    label: 'Matrix-XREG Integration',
    description: 'Connect cost matrix uploads to explainable AI valuation',
    route: '/matrix-xreg-integration',
    category: 'analysis',
    icon: React.createElement(BrainCircuit)
  },
  
  // Data Management Tasks
  {
    id: 'data_import',
    label: 'Data Import',
    description: 'Import property and cost data',
    route: '/data-import',
    category: 'management',
    icon: React.createElement(Database)
  },
  {
    id: 'data_connections',
    label: 'Data Connections',
    description: 'Configure external data connections',
    route: '/data-connections',
    category: 'management',
    icon: React.createElement(Database)
  },
  {
    id: 'users',
    label: 'User Management',
    description: 'Manage user accounts and permissions',
    route: '/users',
    category: 'management',
    icon: React.createElement(Users)
  },
  {
    id: 'workflows',
    label: 'Workflow Management',
    description: 'Configure assessment workflows',
    route: '/workflows',
    category: 'management',
    icon: React.createElement(RefreshCw)
  },
  {
    id: 'system_settings',
    label: 'System Settings',
    description: 'Configure system settings',
    route: '/settings',
    category: 'management',
    icon: React.createElement(Settings)
  },
  
  // Visualization Tasks
  {
    id: 'visualizations',
    label: 'Visualization Lab',
    description: 'Interactive data visualizations',
    route: '/visualizations',
    category: 'visualization',
    icon: React.createElement(BarChart3)
  },
  {
    id: 'mcp_visualizations',
    label: 'MCP Visualizations',
    description: 'Advanced MCP visualizations',
    route: '/mcp-visualizations',
    category: 'visualization',
    icon: React.createElement(BarChart3)
  },
  {
    id: 'data_exploration',
    label: 'Data Exploration',
    description: 'Explore and analyze property data',
    route: '/data-exploration',
    category: 'visualization',
    icon: React.createElement(Map)
  },
  {
    id: 'what_if_scenarios',
    label: 'What-If Scenarios',
    description: 'Explore alternative scenarios',
    route: '/what-if-scenarios',
    category: 'visualization',
    icon: React.createElement(BrainCircuit)
  }
];

// Group tasks by category for easier access
export const TASKS_BY_CATEGORY = TASKS.reduce((acc, task) => {
  const { category } = task;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(task);
  return acc;
}, {} as Record<string, WorkflowTask[]>);

// Define category metadata
export const CATEGORIES = [
  {
    id: 'property-assessment',
    label: 'Property Assessment',
    description: 'Comprehensive property assessment workflow',
    icon: React.createElement(Building2),
    priority: 1
  },
  {
    id: 'assessment',
    label: 'Assessment Tools',
    description: 'Property assessment workflows',
    icon: React.createElement(ClipboardList),
    priority: 2
  },
  {
    id: 'analysis',
    label: 'Analysis',
    description: 'Data analysis tools',
    icon: React.createElement(BarChart3),
    priority: 2
  },
  {
    id: 'visualization',
    label: 'Visualization',
    description: 'Data visualization tools',
    icon: React.createElement(Map),
    priority: 3
  },
  {
    id: 'management',
    label: 'Management',
    description: 'System management tools',
    icon: React.createElement(Settings),
    priority: 4
  }
];

// Helper function to find a task by its ID
export const getTaskById = (taskId: string): WorkflowTask | undefined => {
  return TASKS.find(task => task.id === taskId);
};

// Helper function to find tasks by their category
export const getTasksByCategory = (categoryId: string): WorkflowTask[] => {
  return TASKS_BY_CATEGORY[categoryId] || [];
};

// Helper function to get the next task in a workflow sequence
export const getNextTask = (currentTaskId: string): WorkflowTask | undefined => {
  const currentTask = getTaskById(currentTaskId);
  if (!currentTask) return undefined;
  
  // For property assessment workflow, we can use the dependencies
  if (currentTask.category === 'property-assessment') {
    return TASKS.find(task => 
      task.dependencies?.includes(currentTaskId) && 
      task.category === 'property-assessment'
    );
  }
  
  // For older assessment tasks, look for tasks that require the current task
  if (currentTask.category === 'assessment') {
    return TASKS.find(task => 
      task.requiredTasks?.includes(currentTaskId) && 
      task.category === 'assessment'
    );
  }
  
  return undefined;
};