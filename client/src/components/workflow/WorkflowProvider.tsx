import React, { useState, useEffect, ReactNode } from 'react';
import { WorkflowContext, WorkflowStep, useWorkflow } from './WorkflowVisualizer';

interface WorkflowProviderProps {
  children: ReactNode;
  workflowId: string;
  steps: WorkflowStep[];
  initialStep?: string;
  title?: string;
  description?: string;
  onStepChange?: (stepId: string) => void;
  onWorkflowComplete?: () => void;
  persistState?: boolean;
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({
  children,
  workflowId,
  steps,
  initialStep,
  title = "Workflow",
  description,
  onStepChange,
  onWorkflowComplete,
  persistState = true,
}) => {
  // State for tracking workflow progress
  const [currentStep, setCurrentStep] = useState<string>(initialStep || steps[0].id);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stepStatuses, setStepStatuses] = useState<Record<string, WorkflowStep['status']>>({});
  const [startedAt] = useState<Date>(new Date());
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>(new Date());

  // Load saved state on mount if persistence is enabled
  useEffect(() => {
    if (persistState) {
      try {
        const savedState = localStorage.getItem(`workflow-${workflowId}`);
        if (savedState) {
          const { currentStep: savedStep, completedSteps: savedCompleted, stepStatuses: savedStatuses } = JSON.parse(savedState);
          if (savedStep && steps.some(step => step.id === savedStep)) {
            setCurrentStep(savedStep);
          }
          if (Array.isArray(savedCompleted)) {
            setCompletedSteps(savedCompleted.filter(stepId => steps.some(step => step.id === stepId)));
          }
          if (savedStatuses && typeof savedStatuses === 'object') {
            setStepStatuses(savedStatuses);
          }
        }
      } catch (error) {
        console.error('Failed to load workflow state:', error);
      }
    }
  }, [workflowId, steps, persistState, initialStep]);

  // Save state when it changes
  useEffect(() => {
    if (persistState) {
      try {
        localStorage.setItem(`workflow-${workflowId}`, JSON.stringify({
          currentStep,
          completedSteps,
          stepStatuses,
        }));
      } catch (error) {
        console.error('Failed to save workflow state:', error);
      }
    }
    setLastUpdatedAt(new Date());
  }, [workflowId, currentStep, completedSteps, stepStatuses, persistState]);

  // Call onStepChange when current step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }
  }, [currentStep, onStepChange]);

  // Helper function to get the current step index
  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  // Move to the next step
  const nextStep = () => {
    const currentIndex = getCurrentStepIndex();
    
    if (currentIndex < steps.length - 1) {
      markStepComplete(currentStep);
      
      const nextStepId = steps[currentIndex + 1].id;
      setCurrentStep(nextStepId);
      
      // Update status of the next step to in-progress
      updateStepStatus(nextStepId, 'in-progress');
    } else if (currentIndex === steps.length - 1) {
      // If this is the last step, mark it as complete
      markStepComplete(currentStep);
      
      // Call onWorkflowComplete if all steps are completed
      if (onWorkflowComplete && completedSteps.length === steps.length - 1) {
        onWorkflowComplete();
      }
    }
  };

  // Move to the previous step
  const previousStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  // Go to a specific step, with validation
  const goToStep = (stepId: string) => {
    const targetStepIndex = steps.findIndex(step => step.id === stepId);
    const currentIndex = getCurrentStepIndex();
    
    // Determine if the step can be accessed
    const canAccess = 
      completedSteps.includes(stepId) || // Step is completed
      targetStepIndex === currentIndex + 1 || // It's the next step
      targetStepIndex === currentIndex || // It's the current step
      targetStepIndex < currentIndex; // It's a previous step
    
    if (canAccess && targetStepIndex >= 0) {
      setCurrentStep(stepId);
      
      // If moving to a step that isn't marked in-progress or completed, mark it in-progress
      if (!completedSteps.includes(stepId) && stepStatuses[stepId] !== 'in-progress') {
        updateStepStatus(stepId, 'in-progress');
      }
    }
  };

  // Check if a step is complete
  const isStepComplete = (stepId: string) => {
    return completedSteps.includes(stepId);
  };

  // Check if a step is the active one
  const isActiveStep = (stepId: string) => {
    return currentStep === stepId;
  };

  // Mark a step as complete
  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
      updateStepStatus(stepId, 'completed');
    }
  };

  // Check if the next step is available
  const isNextStepAvailable = () => {
    const currentIndex = getCurrentStepIndex();
    return currentIndex < steps.length - 1;
  };

  // Get the status of a specific step
  const stepStatus = (stepId: string): WorkflowStep['status'] => {
    return stepStatuses[stepId] || 'not-started';
  };

  // Update the status of a specific step
  const updateStepStatus = (stepId: string, status: WorkflowStep['status']) => {
    setStepStatuses(prev => ({
      ...prev,
      [stepId]: status,
    }));
  };

  // Calculate overall workflow progress percentage
  const calculatePercentComplete = () => {
    return (completedSteps.length / steps.length) * 100;
  };

  // Workflow metadata
  const workflow = {
    id: workflowId,
    title,
    description,
    startedAt,
    lastUpdatedAt,
    percentComplete: calculatePercentComplete(),
    estimatedTimeRemaining: "Calculating...", // This would be calculated based on remaining steps
  };

  // Value provided by the context
  const value = {
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
    stepStatus,
    updateStepStatus,
    workflow,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

// Reset a workflow's state
export const resetWorkflow = (workflowId: string): boolean => {
  try {
    localStorage.removeItem(`workflow-${workflowId}`);
    return true;
  } catch (error) {
    console.error('Failed to reset workflow:', error);
    return false;
  }
};

export default WorkflowProvider;