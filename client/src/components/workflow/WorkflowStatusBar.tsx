import React from 'react';
import { useWorkflow } from '@/contexts/WorkflowContext';
import { TASKS } from '@/config/tasks';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, CircleDot, Circle, ChevronRight, AlertCircle, Timer } from 'lucide-react';

interface WorkflowStatusBarProps {
  taskIds: string[];
  className?: string;
  onTaskClick?: (taskId: string) => void;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function WorkflowStatusBar({
  taskIds,
  className,
  onTaskClick,
  showLabels = true,
  size = 'md'
}: WorkflowStatusBarProps) {
  const { state, getTaskStatus, navigateToTask, canAccessTask } = useWorkflow();
  
  // Filter tasks to only include those in the taskIds array
  const workflow = TASKS.filter(task => taskIds.includes(task.id));
  
  // Calculate sizes based on the size prop
  const getSize = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 'h-3 w-3',
          height: 'h-8',
          fontSize: 'text-xs',
          spacing: 'space-x-1'
        };
      case 'lg':
        return {
          iconSize: 'h-5 w-5',
          height: 'h-14',
          fontSize: 'text-sm',
          spacing: 'space-x-3'
        };
      case 'md':
      default:
        return {
          iconSize: 'h-4 w-4',
          height: 'h-10',
          fontSize: 'text-xs',
          spacing: 'space-x-2'
        };
    }
  };
  
  const { iconSize, height, fontSize, spacing } = getSize();
  
  // Get the status icon based on the task status
  const getStatusIcon = (taskId: string) => {
    const status = getTaskStatus(taskId);
    
    switch (status) {
      case 'completed':
        return <CheckCircle2 className={cn(iconSize, "text-green-500")} />;
      case 'current':
        return <CircleDot className={cn(iconSize, "text-blue-500")} />;
      case 'locked':
        return <AlertCircle className={cn(iconSize, "text-gray-400")} />;
      case 'pending':
      default:
        return <Circle className={cn(iconSize, "text-gray-400")} />;
    }
  };
  
  // Get elapsed time since workflow started if available
  const getElapsedTime = () => {
    if (state.workflowHistory.length === 0) return null;
    
    const startTime = state.workflowHistory[0].timestamp;
    const elapsed = Math.floor((Date.now() - startTime) / 1000); // seconds
    
    if (elapsed < 60) {
      return `${elapsed}s`;
    } else if (elapsed < 3600) {
      return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    } else {
      return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
    }
  };
  
  return (
    <div className={cn("px-4 py-2 bg-white border rounded-md shadow-sm", className)}>
      <div className={cn("flex items-center", spacing)}>
        {/* Workflow Steps */}
        {workflow.map((task, index) => {
          const isAccessible = canAccessTask(task.id);
          const status = getTaskStatus(task.id);
          
          return (
            <React.Fragment key={task.id}>
              {/* Step Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "flex items-center rounded-full border",
                          height,
                          status === 'current' && "border-blue-500 bg-blue-50",
                          status === 'completed' && "border-green-500 bg-green-50",
                          status === 'locked' && "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed",
                          status === 'pending' && "border-gray-200 hover:border-gray-300"
                        )}
                        onClick={() => {
                          if (isAccessible && onTaskClick) {
                            onTaskClick(task.id);
                          } else if (isAccessible) {
                            navigateToTask(task.id);
                          }
                        }}
                        disabled={!isAccessible}
                      >
                        {getStatusIcon(task.id)}
                        {showLabels && (
                          <span className={cn("ml-2", fontSize)}>
                            {task.label}
                          </span>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="text-sm font-medium">{task.label}</div>
                    <div className="text-xs text-gray-500">{task.description}</div>
                    <div className="mt-1">
                      <Badge variant={status === 'locked' ? "outline" : "secondary"} className="text-[10px]">
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Connector Line */}
              {index < workflow.length - 1 && (
                <ChevronRight className={cn("text-gray-300", iconSize)} />
              )}
            </React.Fragment>
          );
        })}
        
        {/* Elapsed Time (if available) */}
        {state.workflowHistory.length > 0 && (
          <div className="ml-auto flex items-center text-gray-500">
            <Timer className="h-3 w-3 mr-1" />
            <span className="text-xs">{getElapsedTime()}</span>
          </div>
        )}
      </div>
    </div>
  );
}