import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  BarChart, 
  Settings, 
  Layers, 
  PlayCircle, 
  PauseCircle,
  Clock3, 
  RotateCcw, 
  Calendar, 
  PlusCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { resetWorkflow } from './WorkflowProvider';
import { WorkflowStep } from './WorkflowVisualizer';

// Interface for workflow metadata
export interface WorkflowMetadata {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused' | 'error';
  steps: WorkflowStep[];
  lastUpdated?: Date;
  percentComplete: number;
  route: string;
  thumbnail?: string;
  tags?: string[];
  estimatedTime?: string;
  createdBy?: string;
}

// Workflow categories interface
interface WorkflowCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  description?: string;
}

// Props for the workflow dashboard
interface WorkflowDashboardProps {
  workflows: WorkflowMetadata[];
  categories: WorkflowCategory[];
  userRole?: 'admin' | 'manager' | 'user';
  className?: string;
  onCreateWorkflow?: () => void;
  onResetWorkflow?: (workflowId: string) => void;
}

// Card component to display a workflow
const WorkflowCard: React.FC<{
  workflow: WorkflowMetadata;
  onReset: (workflowId: string) => void;
  isNew?: boolean;
}> = ({ workflow, onReset, isNew = false }) => {
  const [location, navigate] = useLocation();
  
  // Function to get status indicator
  const getStatusBadge = () => {
    switch (workflow.status) {
      case 'completed':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge className="bg-blue-500 text-white">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> In Progress
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-amber-500 text-white">
            <PauseCircle className="h-3 w-3 mr-1" /> Paused
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500 text-white">
            <XCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            <Clock className="h-3 w-3 mr-1" /> Not Started
          </Badge>
        );
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn(
        "overflow-hidden transition-all",
        "hover:shadow-md hover:-translate-y-1",
        isNew && "border-2 border-blue-500"
      )}>
        {workflow.thumbnail && (
          <div className="h-32 overflow-hidden">
            <img 
              src={workflow.thumbnail} 
              alt={workflow.title} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        
        <CardHeader className="p-4">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{workflow.title}</CardTitle>
            {isNew && (
              <Badge className="bg-blue-500 text-white">New</Badge>
            )}
          </div>
          {workflow.description && (
            <CardDescription className="text-xs">
              {workflow.description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-1 mb-3">
            {workflow.tags?.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Layers className="h-3 w-3 mr-1" />
                <span>{workflow.steps.length} steps</span>
              </div>
              
              <div className="flex items-center">
                <Clock3 className="h-3 w-3 mr-1" />
                <span>{workflow.estimatedTime || 'N/A'}</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="bg-blue-500 h-1.5 rounded-full" 
                style={{ width: `${workflow.percentComplete}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>{getStatusBadge()}</div>
              
              {workflow.lastUpdated && (
                <div className="text-xs text-gray-500">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(workflow.lastUpdated).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReset(workflow.id)}
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
          
          <Button
            size="sm"
            onClick={() => navigate(workflow.route)}
            className="text-xs"
          >
            {workflow.status === 'not-started' ? (
              <>
                <PlayCircle className="h-3 w-3 mr-1" />
                Start
              </>
            ) : workflow.status === 'paused' || workflow.status === 'in-progress' ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Continue
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3 mr-1" />
                View
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// Create workflow card component
const CreateWorkflowCard: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-dashed border-2 cursor-pointer hover:border-blue-500 h-full flex flex-col items-center justify-center min-h-[250px]" onClick={onClick}>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="h-8 w-8 text-blue-500" />
          </div>
          
          <CardTitle className="text-base mb-2">Create New Workflow</CardTitle>
          <CardDescription className="text-xs">
            Start a new workflow from scratch
          </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Main dashboard component
export const WorkflowDashboard: React.FC<WorkflowDashboardProps> = ({
  workflows,
  categories,
  userRole = 'user',
  className,
  onCreateWorkflow,
  onResetWorkflow,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filteredWorkflows, setFilteredWorkflows] = useState<WorkflowMetadata[]>(workflows);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Filter workflows when active category changes
  useEffect(() => {
    let filtered = [...workflows];
    
    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter(
        workflow => workflow.category === activeCategory
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        workflow => 
          workflow.title.toLowerCase().includes(query) ||
          workflow.description?.toLowerCase().includes(query) ||
          workflow.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    setFilteredWorkflows(filtered);
  }, [workflows, activeCategory, searchQuery]);
  
  // Handle resetting a workflow
  const handleReset = (workflowId: string) => {
    const success = resetWorkflow(workflowId);
    
    if (success && onResetWorkflow) {
      onResetWorkflow(workflowId);
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Workflow Dashboard</h1>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <BarChart className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
        
        <p className="text-gray-500">
          Select a workflow to continue or start a new one
        </p>
      </header>
      
      <div className="flex flex-col">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-4 overflow-x-auto">
            <TabsTrigger 
              value="all" 
              onClick={() => setActiveCategory('all')}
              className="min-w-max"
            >
              All Workflows
            </TabsTrigger>
            
            {categories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                onClick={() => setActiveCategory(category.id)}
                className="min-w-max"
              >
                <span className="flex items-center">
                  {category.icon}
                  <span className="ml-2">{category.name}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {userRole !== 'user' && (
                <CreateWorkflowCard onClick={onCreateWorkflow || (() => {})} />
              )}
              
              {filteredWorkflows.map(workflow => (
                <WorkflowCard 
                  key={workflow.id} 
                  workflow={workflow} 
                  onReset={handleReset}
                  isNew={new Date(workflow.lastUpdated || 0) > new Date(Date.now() - 86400000)} // New if < 24h old
                />
              ))}
              
              {filteredWorkflows.length === 0 && (
                <div className="col-span-full text-center p-8 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">No workflows found in this category.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="m-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {userRole !== 'user' && (
                  <CreateWorkflowCard onClick={onCreateWorkflow || (() => {})} />
                )}
                
                {filteredWorkflows.map(workflow => (
                  <WorkflowCard 
                    key={workflow.id} 
                    workflow={workflow} 
                    onReset={handleReset} 
                    isNew={new Date(workflow.lastUpdated || 0) > new Date(Date.now() - 86400000)}
                  />
                ))}
                
                {filteredWorkflows.length === 0 && (
                  <div className="col-span-full text-center p-8 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">No workflows found in this category.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default WorkflowDashboard;