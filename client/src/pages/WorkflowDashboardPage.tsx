import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { WorkflowDashboard, WorkflowMetadata } from '@/components/workflow';
import { 
  Calculator, 
  BarChart, 
  Database, 
  Map, 
  FileBarChart, 
  Building2,
  GitBranch
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataFlow } from '@/contexts/DataFlowContext';

// Demo workflow categories
const demoCategories = [
  {
    id: 'calculator',
    name: 'Cost Calculators',
    icon: <Calculator className="h-4 w-4 mr-1" />,
    description: 'Tools for estimating and calculating building costs',
  },
  {
    id: 'analytics',
    name: 'Analytics Tools',
    icon: <BarChart className="h-4 w-4 mr-1" />,
    description: 'Data analysis and visualization tools',
  },
  {
    id: 'data',
    name: 'Data Management',
    icon: <Database className="h-4 w-4 mr-1" />,
    description: 'Tools for importing, exporting, and managing data',
  },
  {
    id: 'visualizations',
    name: 'Visualizations',
    icon: <FileBarChart className="h-4 w-4 mr-1" />,
    description: 'Interactive data visualization tools',
  },
  {
    id: 'property',
    name: 'Property Management',
    icon: <Building2 className="h-4 w-4 mr-1" />,
    description: 'Property data management tools',
  },
];

// Demo workflow data
const demoWorkflows: WorkflowMetadata[] = [
  {
    id: 'cost-calculator',
    title: 'Building Cost Calculator',
    description: 'Calculate building costs based on property characteristics, building type, and regional factors.',
    category: 'calculator',
    status: 'in-progress',
    percentComplete: 60,
    lastUpdated: new Date(),
    route: '/calculator',
    steps: [
      { id: 'property', label: 'Property Selection' },
      { id: 'parameters', label: 'Building Parameters' },
      { id: 'calculation', label: 'Cost Calculation' },
      { id: 'results', label: 'Results Analysis' },
      { id: 'save', label: 'Save & Export' },
    ],
    estimatedTime: '10-15 mins',
    tags: ['Cost', 'Calculator', 'Building'],
    thumbnail: 'https://images.unsplash.com/photo-1582610116397-edb318620f90?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'cost-comparison',
    title: 'Cost Comparison Wizard',
    description: 'Compare multiple cost calculation scenarios side-by-side for better decision making.',
    category: 'calculator',
    status: 'not-started',
    percentComplete: 0,
    route: '/comparison',
    steps: [
      { id: 'scenarios', label: 'Define Scenarios' },
      { id: 'data', label: 'Enter Data' },
      { id: 'compare', label: 'Compare Results' },
      { id: 'report', label: 'Generate Report' },
    ],
    estimatedTime: '15-20 mins',
    tags: ['Cost', 'Comparison', 'Scenarios'],
  },
  {
    id: 'data-import',
    title: 'Data Import Wizard',
    description: 'Import and validate cost matrix and other data files.',
    category: 'data',
    status: 'completed',
    percentComplete: 100,
    lastUpdated: new Date(Date.now() - 3600000), // 1 hour ago
    route: '/data-import',
    steps: [
      { id: 'source', label: 'Select Source' },
      { id: 'mappings', label: 'Map Fields' },
      { id: 'validation', label: 'Validate Data' },
      { id: 'import', label: 'Import Data' },
      { id: 'confirmation', label: 'Confirmation' },
    ],
    estimatedTime: '5-10 mins',
    tags: ['Data', 'Import', 'CSV'],
  },
  {
    id: 'data-exploration',
    title: 'Data Exploration Tool',
    description: 'Explore and analyze building cost data to identify trends and patterns.',
    category: 'analytics',
    status: 'error',
    percentComplete: 25,
    lastUpdated: new Date(Date.now() - 86400000), // 1 day ago
    route: '/data-exploration',
    steps: [
      { id: 'data-selection', label: 'Select Data' },
      { id: 'filters', label: 'Apply Filters' },
      { id: 'visualization', label: 'Visualize Data' },
      { id: 'analysis', label: 'Analyze Results' },
      { id: 'export', label: 'Export Analysis' },
    ],
    estimatedTime: '15-30 mins',
    tags: ['Data', 'Exploration', 'Analysis'],
  },
  {
    id: 'cost-trends',
    title: 'Cost Trend Analysis',
    description: 'Analyze cost trends over time to forecast future building costs.',
    category: 'analytics',
    status: 'paused',
    percentComplete: 50,
    lastUpdated: new Date(Date.now() - 172800000), // 2 days ago
    route: '/cost-trend-analysis',
    steps: [
      { id: 'data-selection', label: 'Select Time Period' },
      { id: 'visualization', label: 'View Trends' },
      { id: 'analysis', label: 'Analyze Patterns' },
      { id: 'forecast', label: 'Generate Forecast' },
      { id: 'export', label: 'Export Report' },
    ],
    estimatedTime: '20-30 mins',
    tags: ['Trends', 'Analysis', 'Forecast'],
  },
  {
    id: 'regional-comparison',
    title: 'Regional Cost Comparison',
    description: 'Compare building costs across different regions.',
    category: 'visualizations',
    status: 'in-progress',
    percentComplete: 75,
    lastUpdated: new Date(Date.now() - 43200000), // 12 hours ago
    route: '/regional-cost-comparison',
    steps: [
      { id: 'regions', label: 'Select Regions' },
      { id: 'building-types', label: 'Building Types' },
      { id: 'visualization', label: 'View Comparison' },
      { id: 'analysis', label: 'Analyze Differences' },
      { id: 'export', label: 'Export Comparison' },
    ],
    estimatedTime: '10-15 mins',
    tags: ['Regional', 'Comparison', 'Map'],
  },
  {
    id: 'property-browser',
    title: 'Property Browser',
    description: 'Browse and manage property data.',
    category: 'property',
    status: 'not-started',
    percentComplete: 0,
    route: '/properties',
    steps: [
      { id: 'filters', label: 'Set Filters' },
      { id: 'browse', label: 'Browse Properties' },
      { id: 'details', label: 'View Details' },
      { id: 'edit', label: 'Edit Property' },
      { id: 'save', label: 'Save Changes' },
    ],
    estimatedTime: '5-10 mins',
    tags: ['Property', 'Browser', 'Management'],
  },
  {
    id: 'geo-assessment',
    title: 'Geographic Assessment',
    description: 'Perform geographic assessment of properties and their costs.',
    category: 'visualizations',
    status: 'not-started',
    percentComplete: 0,
    route: '/geo-assessment',
    steps: [
      { id: 'location', label: 'Select Location' },
      { id: 'data', label: 'Load Data' },
      { id: 'mapping', label: 'Map Visualization' },
      { id: 'analysis', label: 'Spatial Analysis' },
      { id: 'report', label: 'Generate Report' },
    ],
    estimatedTime: '20-30 mins',
    tags: ['Geographic', 'Assessment', 'Map'],
  },
];

// Workflow Dashboard Page Component
const WorkflowDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const { trackUserActivity } = useDataFlow();
  
  // Handle creating a new workflow
  const handleCreateWorkflow = () => {
    toast({
      title: 'Create Workflow',
      description: 'Workflow creation wizard would be launched here.',
      duration: 3000,
    });
    
    trackUserActivity('Initiated workflow creation');
  };
  
  // Handle resetting a workflow
  const handleResetWorkflow = (workflowId: string) => {
    toast({
      title: 'Workflow Reset',
      description: `Workflow "${workflowId}" has been reset.`,
      duration: 3000,
    });
    
    trackUserActivity(`Reset workflow: ${workflowId}`);
  };
  
  return (
    <MainLayout
      pageTitle="Workflow Dashboard"
      pageDescription="Manage and track all your workflows in one place"
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Workflows', href: '/workflows' },
      ]}
    >
      <WorkflowDashboard 
        workflows={demoWorkflows}
        categories={demoCategories}
        userRole="admin"
        onCreateWorkflow={handleCreateWorkflow}
        onResetWorkflow={handleResetWorkflow}
      />
    </MainLayout>
  );
};

export default WorkflowDashboardPage;