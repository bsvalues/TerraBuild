import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataFlow } from '@/contexts/DataFlowContext';
import WorkflowProvider from './WorkflowProvider';
import WorkflowVisualizer, { 
  WorkflowStep, 
  WorkflowProgressBar, 
  WorkflowNavigation,
  WorkflowContext
} from './WorkflowVisualizer';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  AlertCircle, 
  Info, 
  ArrowRight, 
  ExternalLink,
  GitBranch,
  HistoryIcon,
  RefreshCw,
  Database,
  ChevronRight
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Data flow event types for visualization
export type DataFlowEventType = 
  | 'data:input' 
  | 'data:validation' 
  | 'data:transform' 
  | 'data:storage' 
  | 'data:retrieve' 
  | 'calculation' 
  | 'export'
  | 'import'
  | 'error'
  | 'warning'
  | 'info';

// Data flow event interface
export interface DataFlowEvent {
  id: string;
  timestamp: number;
  type: DataFlowEventType;
  source: string;
  target?: string;
  data?: any;
  message?: string;
  status?: 'pending' | 'success' | 'error' | 'warning';
  relatedStepId?: string;
}

// Props for the integrated data flow workflow component
interface DataFlowWorkflowProps {
  workflowId: string;
  steps: WorkflowStep[];
  initialStep?: string;
  title?: string;
  description?: string;
  showDataFlowVisualizer?: boolean;
  className?: string;
  onWorkflowComplete?: () => void;
  persistState?: boolean;
  variant?: 'default' | 'compact' | 'expanded';
}

// Function to get the event color based on type
const getEventTypeColor = (type: DataFlowEventType): string => {
  switch (type) {
    case 'data:input':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'data:validation':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'data:transform':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'data:storage':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'data:retrieve':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'calculation':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'export':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'import':
      return 'bg-teal-100 text-teal-800 border-teal-300';
    case 'error':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'info':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Function to get the event icon based on type
const getEventTypeIcon = (type: DataFlowEventType) => {
  switch (type) {
    case 'data:input':
      return <ArrowRight className="h-4 w-4" />;
    case 'data:validation':
      return <Info className="h-4 w-4" />;
    case 'data:transform':
      return <RefreshCw className="h-4 w-4" />;
    case 'data:storage':
      return <Database className="h-4 w-4" />;
    case 'data:retrieve':
      return <Database className="h-4 w-4" />;
    case 'calculation':
      return <BarChart className="h-4 w-4" />;
    case 'export':
      return <ExternalLink className="h-4 w-4" />;
    case 'import':
      return <ArrowRight className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <Info className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

// Component to visualize data flow events
const DataFlowEventVisualizer: React.FC<{
  events: DataFlowEvent[];
  currentStepId: string;
  variant?: 'default' | 'compact' | 'timeline';
  className?: string;
}> = ({ events, currentStepId, variant = 'default', className }) => {
  // Filter events for current step
  const currentStepEvents = events.filter(event => 
    event.relatedStepId === currentStepId
  );
  
  // Filter all events not related to current step
  const otherEvents = events.filter(event => 
    event.relatedStepId !== currentStepId
  );
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (events.length === 0) {
    return (
      <div className={cn("text-center p-4 text-gray-500 text-sm italic", className)}>
        No data flow events recorded yet.
      </div>
    );
  }
  
  return (
    <div className={cn("w-full", className)}>
      <Collapsible 
        open={isExpanded} 
        onOpenChange={setIsExpanded}
        className="border rounded-lg bg-white shadow-sm"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-medium">Data Flow</h3>
            <Badge variant="outline" className="ml-2">
              {events.length} events
            </Badge>
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {isExpanded ? "Hide Details" : "Show Details"}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <Separator />
        
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {currentStepEvents.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Current Step Events</h4>
                <div className="space-y-2">
                  {currentStepEvents.map(event => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className={cn(
                        "border-l-4 px-3 py-2 rounded-r-md text-sm flex items-start",
                        getEventTypeColor(event.type)
                      )}
                    >
                      <span className="mr-2 mt-0.5">
                        {getEventTypeIcon(event.type)}
                      </span>
                      <div className="flex-1">
                        <div className="font-medium">
                          {event.message || `${event.type} event from ${event.source}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
            
            {otherEvents.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Previous Events</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {otherEvents.slice(0, 10).map(event => (
                    <div
                      key={event.id}
                      className={cn(
                        "border-l-2 px-3 py-1.5 rounded-r-md text-xs",
                        getEventTypeColor(event.type)
                      )}
                    >
                      <div className="flex items-start">
                        <span className="mr-2 mt-0.5">
                          {getEventTypeIcon(event.type)}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium">
                            {event.message || `${event.type} event from ${event.source}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        {event.relatedStepId && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            {event.relatedStepId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {otherEvents.length > 10 && (
                    <div className="text-center text-xs text-gray-500">
                      +{otherEvents.length - 10} more events not shown
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// Component that integrates with the workflow visualization and data flow context
export const DataFlowWorkflow: React.FC<DataFlowWorkflowProps> = ({
  workflowId,
  steps,
  initialStep,
  title = "Workflow",
  description,
  showDataFlowVisualizer = true,
  className,
  onWorkflowComplete,
  persistState = true,
  variant = 'default',
}) => {
  // Ensure we're not using useWorkflow() hook at this level
  // We only use it in child components that will be inside the WorkflowProvider
  const { state, trackUserActivity, addDataSnapshot } = useDataFlow();
  const [dataFlowEvents, setDataFlowEvents] = useState<DataFlowEvent[]>([]);
  
  // Update data flow events from snapshots
  useEffect(() => {
    // Convert data snapshots to data flow events
    const events: DataFlowEvent[] = state.dataHistory.map(snapshot => ({
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      type: mapOperationToEventType(snapshot.operation),
      source: snapshot.source,
      data: snapshot.data,
      message: `${snapshot.operation} operation from ${snapshot.source}`,
      status: 'success',
      relatedStepId: getCurrentStepForData(snapshot.data),
    }));
    
    setDataFlowEvents(events);
  }, [state.dataHistory]);
  
  // Helper to map operation types to event types
  const mapOperationToEventType = (operation: string): DataFlowEventType => {
    switch (operation) {
      case 'create':
        return 'data:storage';
      case 'read':
        return 'data:retrieve';
      case 'update':
        return 'data:transform';
      case 'delete':
        return 'data:storage';
      case 'calculate':
        return 'calculation';
      case 'import':
        return 'import';
      case 'export':
        return 'export';
      default:
        return 'info';
    }
  };
  
  // Helper to determine which step a data operation belongs to
  const getCurrentStepForData = (data: any): string => {
    // Logic to determine which step the data belongs to
    // This is an example - you would customize based on your data structure
    if (data.propertyId) {
      return 'property';
    }
    if (data.buildingType || data.region || data.quality || data.condition) {
      return 'parameters';
    }
    if (data.calculationId || data.calculationResults) {
      return 'calculation';
    }
    if (data.exportFormat || data.exportDestination) {
      return 'save';
    }
    
    // Default to the first step if no match
    return steps[0].id;
  };
  
  // Handle step change
  const handleStepChange = (stepId: string) => {
    trackUserActivity(`Moved to workflow step: ${stepId}`);
  };
  
  // Handle workflow completion
  const handleWorkflowComplete = () => {
    trackUserActivity(`Completed workflow: ${workflowId}`);
    
    if (onWorkflowComplete) {
      onWorkflowComplete();
    }
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      <WorkflowProvider
        workflowId={workflowId}
        steps={steps}
        initialStep={initialStep}
        title={title}
        description={description}
        onStepChange={handleStepChange}
        onWorkflowComplete={handleWorkflowComplete}
        persistState={persistState}
      >
        <Card className="border shadow-sm">
          <CardHeader className={cn(
            variant === 'compact' ? "p-4" : "p-6",
            "border-b pb-4"
          )}>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-500" />
              {title}
            </CardTitle>
            {description && (
              <CardDescription>
                {description}
              </CardDescription>
            )}
            
            {/* Simple progress bar instead of WorkflowProgressBar */}
            <div className="mt-3 w-full">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <div>
                  Step 1 of {steps.length}
                </div>
                <div>
                  {Math.round(100 / steps.length)}% Complete
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${100 / steps.length}%` }}
                ></div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={cn(
            variant === 'compact' ? "p-4" : "p-6", 
            "space-y-8"
          )}>
            {/* Workflow Visualizer */}
            {/* We need to pass currentStep directly since we're not inside a WorkflowProvider yet */}
            <WorkflowVisualizer 
              steps={steps}
              currentStep={initialStep || steps[0].id}
              variant={variant === 'compact' ? 'minimal' : 'default'}
              showHelp={true}
              orientation="horizontal"
              animated={true}
              onStepClick={() => {}} // No-op since we're handling navigation separately
            />
            
            {/* Data Flow Content */}
            <WorkflowStepContent />
            
            {/* Data Flow Visualizer */}
            {showDataFlowVisualizer && (
              <DataFlowEventVisualizer 
                events={dataFlowEvents}
                currentStepId={initialStep || steps[0].id}
                variant={variant === 'compact' ? 'compact' : 'default'}
              />
            )}
          </CardContent>
          
          <CardFooter className={cn(
            variant === 'compact' ? "p-4" : "p-6",
            "border-t"
          )}>
            {/* Navigation - we'll use a simplified version since we're not inside a WorkflowProvider */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm">
                Back
              </Button>
              <Button size="sm">
                Next Step
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </WorkflowProvider>
    </div>
  );
};

// Component that displays the content for the current workflow step
const WorkflowStepContent: React.FC = () => {
  // Use React.useContext to avoid the import error
  const context = React.useContext(WorkflowContext);
  // If we don't have context (which should never happen in normal operation),
  // show a placeholder message instead of throwing an error
  if (!context) {
    return (
      <div className="text-center p-4 text-amber-500">
        Workflow data not available
      </div>
    );
  }
  
  const { currentStep, steps } = context;
  const currentStepObj = steps.find((step: any) => step.id === currentStep);
  
  if (!currentStepObj) {
    return null;
  }
  
  // This is where you would render the actual content for each step
  // For now, this just displays a placeholder
  return (
    <div className="bg-gray-50 border rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-2">
        {currentStepObj.label}
      </h3>
      {currentStepObj.description && (
        <p className="text-gray-600 mb-4">
          {currentStepObj.description}
        </p>
      )}
      
      <div className="p-8 border border-dashed rounded-md bg-white text-center text-gray-500">
        Content for the "{currentStepObj.label}" step would be rendered here.
      </div>
    </div>
  );
};

export default DataFlowWorkflow;