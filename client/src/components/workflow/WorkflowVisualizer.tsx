import React, { useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Check, 
  ChevronRight, 
  AlertCircle, 
  HelpCircle, 
  Info, 
  ArrowRight, 
  ExternalLink
} from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

// Define workflow step types with enhanced metadata
export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  helpText?: string;
  estimatedTime?: string;
  prerequisites?: string[];
  skippable?: boolean;
  requiredData?: string[];
  status?: 'not-started' | 'in-progress' | 'completed' | 'error' | 'warning' | 'skipped';
}

// Context to manage the workflow state
export interface WorkflowContextType {
  currentStep: string;
  steps: WorkflowStep[];
  setCurrentStep: (step: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (stepId: string) => void;
  isStepComplete: (stepId: string) => boolean;
  isActiveStep: (stepId: string) => boolean;
  isNextStepAvailable: () => boolean;
  completedSteps: string[];
  markStepComplete: (stepId: string) => void;
  stepStatus: (stepId: string) => WorkflowStep['status'];
  updateStepStatus: (stepId: string, status: WorkflowStep['status']) => void;
  workflow: {
    id: string;
    title: string;
    description?: string;
    startedAt?: Date;
    lastUpdatedAt?: Date;
    percentComplete?: number;
    estimatedTimeRemaining?: string;
  };
}

// Create a context for the workflow
export const WorkflowContext = React.createContext<WorkflowContextType | undefined>(undefined);

// Hook to use the workflow context
export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

// Props for the WorkflowVisualizer component
interface WorkflowVisualizerProps {
  steps: WorkflowStep[];
  currentStep?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  onStepClick?: (stepId: string) => void;
  className?: string;
  showStatus?: boolean;
  animated?: boolean;
  variant?: 'default' | 'minimal' | 'detailed';
  showHelp?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

// Function to get color based on step status
const getStatusColors = (status: WorkflowStep['status'], theme: 'light' | 'dark' | 'system' = 'light') => {
  const isDark = theme === 'dark';
  
  switch (status) {
    case 'completed':
      return {
        bg: isDark ? 'bg-green-700' : 'bg-green-500',
        text: 'text-white',
        border: isDark ? 'border-green-600' : 'border-green-400'
      };
    case 'in-progress':
      return {
        bg: isDark ? 'bg-blue-700' : 'bg-blue-500',
        text: 'text-white',
        border: isDark ? 'border-blue-600' : 'border-blue-400'
      };
    case 'error':
      return {
        bg: isDark ? 'bg-red-700' : 'bg-red-500',
        text: 'text-white',
        border: isDark ? 'border-red-600' : 'border-red-400'
      };
    case 'warning':
      return {
        bg: isDark ? 'bg-amber-700' : 'bg-amber-500',
        text: 'text-white',
        border: isDark ? 'border-amber-600' : 'border-amber-400'
      };
    case 'skipped':
      return {
        bg: isDark ? 'bg-gray-700' : 'bg-gray-400',
        text: 'text-white',
        border: isDark ? 'border-gray-600' : 'border-gray-300'
      };
    default:
      return {
        bg: isDark ? 'bg-gray-800' : 'bg-gray-200',
        text: isDark ? 'text-gray-300' : 'text-gray-600',
        border: isDark ? 'border-gray-700' : 'border-gray-300'
      };
  }
};

// Function to get status icon
const getStatusIcon = (status: WorkflowStep['status']) => {
  switch (status) {
    case 'completed':
      return <Check className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <Info className="h-4 w-4" />;
    case 'skipped':
      return <ArrowRight className="h-4 w-4" />;
    default:
      return null;
  }
};

// Visualization component for workflow steps
export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  steps,
  currentStep: externalCurrentStep,
  showLabels = true,
  orientation = 'horizontal',
  size = 'medium',
  onStepClick,
  className,
  showStatus = true,
  animated = true,
  variant = 'default',
  showHelp = true,
  theme = 'light'
}) => {
  // Get context if available, otherwise use props
  const workflowContext = useContext(WorkflowContext);
  
  // Determine which currentStep to use
  const currentStep = workflowContext?.currentStep || externalCurrentStep || steps[0].id;
  
  // Get step status, active status, and completion status
  const getStepStatus = useCallback((step: WorkflowStep) => {
    if (workflowContext?.stepStatus) {
      return workflowContext.stepStatus(step.id);
    }
    return step.status || 'not-started';
  }, [workflowContext]);

  const isActiveStep = useCallback((stepId: string) => {
    if (workflowContext?.isActiveStep) {
      return workflowContext.isActiveStep(stepId);
    }
    return stepId === currentStep;
  }, [workflowContext, currentStep]);
  
  const isStepComplete = useCallback((stepId: string) => {
    if (workflowContext?.isStepComplete) {
      return workflowContext.isStepComplete(stepId);
    }
    
    // If no context, consider all steps before current as completed
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    return stepIndex < currentIndex;
  }, [workflowContext, steps, currentStep]);

  const handleStepClick = useCallback((stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else if (workflowContext) {
      workflowContext.goToStep(stepId);
    }
  }, [onStepClick, workflowContext]);

  // Size mappings
  const sizeClasses = {
    small: 'h-6 w-6 text-xs',
    medium: 'h-8 w-8 text-sm',
    large: 'h-10 w-10 text-base',
  };

  const stepSize = sizeClasses[size];
  const isVertical = orientation === 'vertical';

  return (
    <div 
      className={cn(
        'relative',
        isVertical ? 'flex flex-col space-y-2' : 'flex items-center justify-between w-full space-x-2',
        variant === 'minimal' ? 'gap-1' : 'gap-2',
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = isActiveStep(step.id);
        const isComplete = isStepComplete(step.id);
        const stepStatus = getStepStatus(step);
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;
        const statusColors = getStatusColors(stepStatus, theme);
        const statusIcon = getStatusIcon(stepStatus);

        return (
          <div 
            key={step.id}
            className={cn(
              'relative',
              isVertical ? 'w-full' : 'flex-1',
              isVertical && !isLast && 'mb-4'
            )}
          >
            {/* Step - different appearance based on variant */}
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      onClick={() => handleStepClick(step.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'rounded-full flex items-center justify-center transition-all',
                        stepSize,
                        variant === 'detailed' && 'shadow-md',
                        isComplete ? cn('bg-emerald-500 text-white', animated && 'animate-pulse') : 
                        isActive ? 'bg-blue-500/20 text-blue-500 border-2 border-blue-500' :
                        'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      )}
                      disabled={!isComplete && !isActive}
                      initial={animated ? { opacity: 0, y: 10 } : undefined}
                      animate={animated ? { opacity: 1, y: 0 } : undefined}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AnimatePresence mode="wait">
                        {isComplete ? (
                          <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Check className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="number"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <span>{index + 1}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </TooltipTrigger>
                  {variant !== 'detailed' && step.description && (
                    <TooltipContent side={isVertical ? "right" : "top"} className="max-w-xs p-4">
                      <div className="font-medium">{step.label}</div>
                      <p className="text-sm text-gray-500 mt-1">{step.description}</p>
                      {step.estimatedTime && (
                        <div className="text-xs text-gray-400 mt-2">
                          Estimated time: {step.estimatedTime}
                        </div>
                      )}
                      {step.requiredData && step.requiredData.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-500">Required data:</div>
                          <ul className="text-xs text-gray-400 list-disc pl-4">
                            {step.requiredData.map((data, i) => (
                              <li key={i}>{data}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              {showLabels && (
                <div className={cn(
                  'ml-3',
                  isVertical ? 'flex-1' : '',
                  variant === 'minimal' ? 'text-xs' : ''
                )}>
                  <motion.div
                    className={cn(
                      'font-medium whitespace-nowrap flex items-center gap-1.5',
                      isActive ? 'text-blue-500' : 'text-gray-700'
                    )}
                    initial={animated ? { opacity: 0, x: -5 } : undefined}
                    animate={animated ? { opacity: 1, x: 0 } : undefined}
                    transition={{ delay: index * 0.1 + 0.1 }}
                  >
                    {step.label}
                    
                    {/* Status indicator (shown if explicitly set) */}
                    {showStatus && stepStatus && stepStatus !== 'not-started' && (
                      <span className={cn(
                        'ml-2 px-1.5 py-0.5 rounded-full text-xs inline-flex items-center gap-0.5',
                        statusColors.bg, statusColors.text
                      )}>
                        {statusIcon}
                        <span className="hidden sm:inline">{stepStatus}</span>
                      </span>
                    )}
                    
                    {/* Help icon */}
                    {showHelp && step.helpText && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1 inline-flex items-center">
                              <HelpCircle className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-sm">{step.helpText}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </motion.div>
                  
                  {/* Description - only shown in detailed variant or on non-minimal views */}
                  {(variant === 'detailed' || (variant !== 'minimal' && step.description)) && (
                    <motion.div 
                      className="text-xs text-gray-500 hidden sm:block mt-0.5"
                      initial={animated ? { opacity: 0 } : undefined}
                      animate={animated ? { opacity: 1 } : undefined}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      {step.description}
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Connector line between steps */}
            {!isLast && (
              <motion.div 
                className={cn(
                  isVertical 
                    ? 'absolute left-4 top-8 bottom-0 w-0.5' 
                    : 'hidden sm:block absolute top-4 h-0.5',
                  isComplete ? 'bg-emerald-500' : 'bg-gray-200'
                )}
                style={
                  isVertical 
                    ? {} 
                    : { 
                        left: `calc(100% - ${isVertical ? '0px' : '8px'})`, 
                        right: `calc(${isVertical ? '0px' : '8px'})` 
                      }
                }
                initial={animated ? { 
                  scaleX: isVertical ? 1 : 0, 
                  scaleY: isVertical ? 0 : 1,
                  transformOrigin: isVertical ? 'top' : 'left' 
                } : undefined}
                animate={animated ? { 
                  scaleX: isVertical ? 1 : 1, 
                  scaleY: isVertical ? 1 : 1 
                } : undefined}
                transition={{ delay: index * 0.1 + 0.1, duration: 0.4 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Navigation component for workflow
export const WorkflowNavigation: React.FC<{
  className?: string;
  showNextButton?: boolean;
  showBackButton?: boolean;
  nextButtonLabel?: string;
  backButtonLabel?: string;
  onNext?: () => void;
  onBack?: () => void;
  nextButtonDisabled?: boolean;
  variant?: 'default' | 'outline' | 'minimal';
}> = ({
  className,
  showNextButton = true,
  showBackButton = true,
  nextButtonLabel = 'Next Step',
  backButtonLabel = 'Previous',
  onNext,
  onBack,
  nextButtonDisabled = false,
  variant = 'default',
}) => {
  const { nextStep, previousStep, isNextStepAvailable } = useWorkflow();

  const handleNextClick = () => {
    if (onNext) {
      onNext();
    } else {
      nextStep();
    }
  };

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      previousStep();
    }
  };

  return (
    <div className={cn('flex items-center justify-between mt-6', className)}>
      {showBackButton && (
        <motion.button
          onClick={handleBackClick}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            variant === 'outline' 
              ? "border border-gray-300 text-gray-600 hover:bg-gray-50" 
              : variant === 'minimal' 
                ? "text-gray-600 hover:text-gray-900 p-2" 
                : "text-gray-600 hover:text-gray-900"
          )}
        >
          {backButtonLabel}
        </motion.button>
      )}
      
      {showNextButton && (!nextButtonDisabled && isNextStepAvailable()) && (
        <motion.button
          onClick={handleNextClick}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md flex items-center transition-colors",
            variant === 'outline' 
              ? "border border-blue-500 text-blue-500 hover:bg-blue-50" 
              : variant === 'minimal' 
                ? "text-blue-500 hover:text-blue-600 p-2" 
                : "bg-blue-500 text-white hover:bg-blue-600"
          )}
        >
          {nextButtonLabel}
          <ChevronRight className="ml-1 h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
};

// Optional progress bar for workflow
export const WorkflowProgressBar: React.FC<{
  className?: string;
  showPercentage?: boolean;
  showStepCount?: boolean;
  variant?: 'default' | 'slim' | 'gradient';
  animated?: boolean;
}> = ({
  className,
  showPercentage = true,
  showStepCount = false,
  variant = 'default',
  animated = true,
}) => {
  const { steps, completedSteps } = useWorkflow();
  
  const percentage = (completedSteps.length / steps.length) * 100;
  
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showStepCount && (
          <div className="text-xs text-gray-500">
            Step {completedSteps.length + 1} of {steps.length}
          </div>
        )}
        {showPercentage && (
          <div className="text-xs text-gray-500 font-medium">
            {Math.round(percentage)}% Complete
          </div>
        )}
      </div>
      
      <div 
        className={cn(
          "w-full bg-gray-200 rounded-full overflow-hidden",
          variant === 'slim' ? 'h-1' : 'h-2'
        )}
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            variant === 'gradient' 
              ? "bg-gradient-to-r from-blue-400 to-emerald-500" 
              : "bg-blue-500"
          )}
          style={{ width: `${percentage}%` }}
          initial={animated ? { width: 0 } : undefined}
          animate={animated ? { width: `${percentage}%` } : undefined}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default WorkflowVisualizer;