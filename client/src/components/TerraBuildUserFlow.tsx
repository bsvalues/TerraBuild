import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

// Define the step type for our workflow
export interface WorkflowStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

// Define common workflow steps for the calculator
export const calculationWorkflowSteps: WorkflowStep[] = [
  {
    id: 'property',
    label: 'Property',
    description: 'Select a property',
  },
  {
    id: 'parameters',
    label: 'Parameters',
    description: 'Define building parameters',
  },
  {
    id: 'calculation',
    label: 'Calculate',
    description: 'Run the calculation',
  },
  {
    id: 'results',
    label: 'Results',
    description: 'View calculation results',
  },
  {
    id: 'save',
    label: 'Save & Export',
    description: 'Save and export results',
  },
];

// Context to manage the workflow state
interface WorkflowContextType {
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
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

interface WorkflowProviderProps {
  children: ReactNode;
  workflowId: string;
  steps: WorkflowStep[];
  initialStep?: string;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  children,
  workflowId,
  steps,
  initialStep,
}) => {
  const [currentStep, setCurrentStep] = useState<string>(initialStep || steps[0].id);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < steps.length - 1) {
      markStepComplete(currentStep);
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const previousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const goToStep = (stepId: string) => {
    const targetStepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();
    
    // Only allow going to steps that are completed or the next one
    if (
      completedSteps.includes(stepId) || // Step is completed
      targetStepIndex === currentIndex + 1 || // It's the next step
      targetStepIndex === currentIndex // It's the current step
    ) {
      setCurrentStep(stepId);
    }
  };

  const isStepComplete = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  const isActiveStep = (stepId: string) => {
    return currentStep === stepId;
  };

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const isNextStepAvailable = () => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex < steps.length - 1;
  };

  return (
    <WorkflowContext.Provider
      value={{
        currentStep,
        steps,
        setCurrentStep,
        nextStep,
        previousStep,
        goToStep,
        isStepComplete,
        isActiveStep,
        isNextStepAvailable,
        completedSteps,
        markStepComplete,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

// Props for the TerraBuildUserFlow component
interface TerraBuildUserFlowProps {
  steps: WorkflowStep[];
  currentStep?: string;
  showLabels?: boolean;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  onStepClick?: (stepId: string) => void;
  className?: string;
}

// Display component for visualizing the workflow steps
export const TerraBuildUserFlow: React.FC<TerraBuildUserFlowProps> = ({
  steps,
  currentStep: externalCurrentStep,
  showLabels = true,
  orientation = 'horizontal',
  size = 'medium',
  onStepClick,
  className,
}) => {
  // Get context if available, otherwise use props
  const workflowContext = useContext(WorkflowContext);
  
  // Determine which currentStep and isActiveStep to use
  const currentStep = workflowContext?.currentStep || externalCurrentStep || steps[0].id;
  
  const isActiveStep = (stepId: string) => {
    if (workflowContext) {
      return workflowContext.isActiveStep(stepId);
    }
    return stepId === currentStep;
  };
  
  const isStepComplete = (stepId: string) => {
    if (workflowContext) {
      return workflowContext.isStepComplete(stepId);
    }
    
    // If no context, consider all steps before current as completed
    const stepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    return stepIndex < currentIndex;
  };

  const handleStepClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else if (workflowContext) {
      workflowContext.goToStep(stepId);
    }
  };

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
        'flex items-center justify-between w-full',
        isVertical ? 'flex-col space-y-2' : 'space-x-2',
        className
      )}
    >
      {steps.map((step, index) => {
        const isActive = isActiveStep(step.id);
        const isComplete = isStepComplete(step.id);
        const isFirst = index === 0;
        const isLast = index === steps.length - 1;

        return (
          <div 
            key={step.id}
            className={cn(
              'flex items-center',
              isVertical ? 'w-full' : 'flex-1',
              isVertical && !isLast && 'pb-2'
            )}
          >
            {/* Step */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleStepClick(step.id)}
                className={cn(
                  'rounded-full flex items-center justify-center transition-colors',
                  stepSize,
                  isComplete ? 'bg-[#29B7D3] text-white' : 
                  isActive ? 'bg-[#29B7D3]/20 text-[#29B7D3] border-2 border-[#29B7D3]' :
                  'bg-gray-100 text-gray-400 hover:bg-gray-200'
                )}
                disabled={!isComplete && !isActive}
              >
                {isComplete ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              
              {showLabels && (
                <div className={cn(
                  'ml-2',
                  isVertical ? 'flex-1' : '' 
                )}>
                  <div className={cn(
                    'font-medium whitespace-nowrap',
                    isActive ? 'text-[#29B7D3]' : 'text-gray-700'
                  )}>
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500 hidden md:block">
                      {step.description}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Connector line between steps */}
            {!isLast && (
              <div className={cn(
                'flex-1',
                isVertical ? 'border-l-2 h-4 ml-4 mt-1' : 'border-t-2 mx-2',
                isComplete ? 'border-[#29B7D3]' : 'border-gray-200'
              )} />
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
}> = ({
  className,
  showNextButton = true,
  showBackButton = true,
  nextButtonLabel = 'Next Step',
  backButtonLabel = 'Previous',
}) => {
  const { nextStep, previousStep, isNextStepAvailable } = useWorkflow();

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {showBackButton && (
        <button
          onClick={previousStep}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          {backButtonLabel}
        </button>
      )}
      
      {showNextButton && isNextStepAvailable() && (
        <button
          onClick={nextStep}
          className="px-4 py-2 text-sm font-medium text-white bg-[#29B7D3] rounded-md hover:bg-[#29B7D3]/90 flex items-center"
        >
          {nextButtonLabel}
          <ChevronRight className="ml-1 h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default TerraBuildUserFlow;