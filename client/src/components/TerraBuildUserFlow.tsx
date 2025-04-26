import React from 'react';
import { useLocation, Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChevronRight,
  Home,
  Calculator,
  FileSpreadsheet,
  Map,
  BarChart3,
  Database,
  PenTool,
  Save,
  ListChecks,
  HardDrive,
  Search,
  Building2,
  ArrowRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FlowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  status?: 'completed' | 'current' | 'upcoming';
}

interface WorkflowProps {
  steps: FlowStep[];
  currentStep: string;
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export const TerraBuildUserFlow: React.FC<WorkflowProps> = ({
  steps,
  currentStep,
  variant = 'horizontal',
  size = 'medium',
  showLabels = true,
  onStepClick,
  className
}) => {
  const [, navigate] = useLocation();
  
  const iconSize = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6',
  }[size];
  
  const stepSize = {
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-12 w-12',
  }[size];
  
  const getStepStatus = (step: FlowStep) => {
    if (step.status) return step.status;
    
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    const stepIndex = steps.findIndex(s => s.id === step.id);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };
  
  const getStatusStyles = (status: 'completed' | 'current' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-700',
          icon: 'text-green-600',
        };
      case 'current':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-700',
          icon: 'text-blue-600',
        };
      case 'upcoming':
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-300',
          text: 'text-gray-500',
          icon: 'text-gray-500',
        };
    }
  };
  
  const handleStepClick = (step: FlowStep) => {
    if (onStepClick) {
      onStepClick(step.id);
    } else if (step.path) {
      navigate(step.path);
    }
  };
  
  return (
    <div className={cn(
      'flex',
      variant === 'horizontal' ? 'flex-row items-center' : 'flex-col items-start',
      className
    )}>
      {steps.map((step, index) => {
        const status = getStepStatus(step);
        const styles = getStatusStyles(status);
        const isLast = index === steps.length - 1;
        
        return (
          <React.Fragment key={step.id}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={cn(
                      'flex items-center gap-2 cursor-pointer transition-all',
                      variant === 'vertical' ? 'mb-4' : '',
                      status === 'current' ? 'scale-110' : 'hover:scale-105'
                    )}
                    onClick={() => handleStepClick(step)}
                  >
                    <div 
                      className={cn(
                        `${stepSize} rounded-full flex items-center justify-center border-2`,
                        styles.bg, styles.border,
                        status === 'current' ? 'shadow-md' : ''
                      )}
                    >
                      {status === 'completed' ? (
                        <Check className={cn(iconSize, 'text-green-600')} />
                      ) : (
                        React.cloneElement(step.icon as React.ReactElement, {
                          className: cn(iconSize, styles.icon)
                        })
                      )}
                    </div>
                    {showLabels && (
                      <span className={cn('text-sm font-medium', styles.text, variant === 'vertical' ? 'block' : 'hidden md:block')}>
                        {step.title}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <div className="font-semibold">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {!isLast && (
              variant === 'horizontal' ? (
                <div className={cn(
                  'h-0.5 w-8 mx-1',
                  status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                )} />
              ) : (
                <div className={cn(
                  'w-0.5 h-6 ml-5',
                  status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                )} />
              )
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface WorkflowCardProps {
  title: string;
  description?: string;
  steps: FlowStep[];
  currentStep: string;
  variant?: 'horizontal' | 'vertical';
  onStepClick?: (stepId: string) => void;
  className?: string;
  actions?: React.ReactNode;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  title,
  description,
  steps,
  currentStep,
  variant = 'horizontal',
  onStepClick,
  className,
  actions
}) => {
  return (
    <Card className={cn('shadow-sm', className)}>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#243E4D]">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        
        <TerraBuildUserFlow
          steps={steps}
          currentStep={currentStep}
          variant={variant}
          onStepClick={onStepClick}
        />
        
        {actions && (
          <div className="mt-4 flex justify-end">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface WorkflowContextProps {
  workflowId: string;
  steps: FlowStep[];
  currentStep: string;
  setCurrentStep: (stepId: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  goToStep: (stepId: string) => void;
  getStepById: (stepId: string) => FlowStep | undefined;
  getNextStepId: () => string | null;
  getPreviousStepId: () => string | null;
}

const WorkflowContext = React.createContext<WorkflowContextProps | undefined>(undefined);

export const useWorkflow = () => {
  const context = React.useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

interface WorkflowProviderProps {
  workflowId: string;
  steps: FlowStep[];
  initialStep?: string;
  onStepChange?: (stepId: string) => void;
  children: React.ReactNode;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  workflowId,
  steps,
  initialStep,
  onStepChange,
  children
}) => {
  const [currentStep, setCurrentStepState] = React.useState<string>(initialStep || steps[0]?.id);
  
  const setCurrentStep = (stepId: string) => {
    setCurrentStepState(stepId);
    if (onStepChange) {
      onStepChange(stepId);
    }
  };
  
  const currentStepIndex = React.useMemo(() => {
    return steps.findIndex(step => step.id === currentStep);
  }, [steps, currentStep]);
  
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  const nextStep = () => {
    if (isLastStep) return;
    setCurrentStep(steps[currentStepIndex + 1].id);
  };
  
  const previousStep = () => {
    if (isFirstStep) return;
    setCurrentStep(steps[currentStepIndex - 1].id);
  };
  
  const goToStep = (stepId: string) => {
    setCurrentStep(stepId);
  };
  
  const getStepById = (stepId: string) => {
    return steps.find(step => step.id === stepId);
  };
  
  const getNextStepId = () => {
    if (isLastStep) return null;
    return steps[currentStepIndex + 1].id;
  };
  
  const getPreviousStepId = () => {
    if (isFirstStep) return null;
    return steps[currentStepIndex - 1].id;
  };
  
  const value = {
    workflowId,
    steps,
    currentStep,
    setCurrentStep,
    nextStep,
    previousStep,
    isFirstStep,
    isLastStep,
    goToStep,
    getStepById,
    getNextStepId,
    getPreviousStepId
  };
  
  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Reusable calculation workflow steps
export const calculationWorkflowSteps: FlowStep[] = [
  {
    id: 'property',
    title: 'Property Selection',
    description: 'Select or enter property details',
    icon: <Building2 />,
    path: '/calculator/property'
  },
  {
    id: 'parameters',
    title: 'Parameters',
    description: 'Set building parameters',
    icon: <PenTool />,
    path: '/calculator/parameters'
  },
  {
    id: 'calculation',
    title: 'Calculate',
    description: 'Run cost calculation',
    icon: <Calculator />,
    path: '/calculator/calculate'
  },
  {
    id: 'results',
    title: 'Results',
    description: 'View calculation results',
    icon: <FileSpreadsheet />,
    path: '/calculator/results'
  },
  {
    id: 'save',
    title: 'Save & Export',
    description: 'Save or export calculation',
    icon: <Save />,
    path: '/calculator/export'
  }
];

// Reusable data import workflow steps
export const dataImportWorkflowSteps: FlowStep[] = [
  {
    id: 'select',
    title: 'Select Data',
    description: 'Choose data source',
    icon: <Search />,
    path: '/data-import/select'
  },
  {
    id: 'validate',
    title: 'Validate',
    description: 'Validate data format',
    icon: <ListChecks />,
    path: '/data-import/validate'
  },
  {
    id: 'import',
    title: 'Import',
    description: 'Import data into system',
    icon: <Database />,
    path: '/data-import/import'
  },
  {
    id: 'confirm',
    title: 'Confirm',
    description: 'Verify imported data',
    icon: <Check />,
    path: '/data-import/confirm'
  }
];

// Navigation buttons for workflow
interface WorkflowNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  disableBack?: boolean;
  disableNext?: boolean;
}

export const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel = 'Next',
  disableBack = false,
  disableNext = false
}) => {
  return (
    <div className="flex justify-between mt-6">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={disableBack}
      >
        {backLabel}
      </Button>
      <Button
        onClick={onNext}
        disabled={disableNext}
        className="bg-[#29B7D3] hover:bg-[#29B7D3]/90"
      >
        {nextLabel} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default TerraBuildUserFlow;