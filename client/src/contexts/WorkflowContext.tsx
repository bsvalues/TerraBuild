import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

// Define the workflow state structure
export interface WorkflowState {
  currentTask: string;
  completedTasks: string[];
  activePropertyId?: number;
  assessmentInProgress?: boolean;
  savedState: Record<string, any>;
  lastActiveTime: number;
  workflowHistory: {
    taskId: string;
    timestamp: number;
    data?: any;
  }[];
}

// Define available actions for the workflow context
type WorkflowAction = 
  | { type: 'SET_CURRENT_TASK'; taskId: string }
  | { type: 'COMPLETE_TASK'; taskId: string }
  | { type: 'SET_ACTIVE_PROPERTY'; propertyId: number }
  | { type: 'START_ASSESSMENT' }
  | { type: 'COMPLETE_ASSESSMENT' }
  | { type: 'SAVE_STATE'; key: string; data: any }
  | { type: 'CLEAR_STATE'; key?: string }
  | { type: 'RESET_WORKFLOW' };

// Initial state for the workflow
const initialState: WorkflowState = {
  currentTask: '',
  completedTasks: [],
  savedState: {},
  lastActiveTime: Date.now(),
  workflowHistory: []
};

// Reducer function to handle state updates
function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_CURRENT_TASK':
      return {
        ...state,
        currentTask: action.taskId,
        lastActiveTime: Date.now(),
        workflowHistory: [
          ...state.workflowHistory,
          { taskId: action.taskId, timestamp: Date.now() }
        ]
      };
    
    case 'COMPLETE_TASK':
      return {
        ...state,
        completedTasks: state.completedTasks.includes(action.taskId) 
          ? state.completedTasks 
          : [...state.completedTasks, action.taskId],
        lastActiveTime: Date.now()
      };
    
    case 'SET_ACTIVE_PROPERTY':
      return {
        ...state,
        activePropertyId: action.propertyId,
        savedState: {
          ...state.savedState,
          propertyId: action.propertyId
        },
        lastActiveTime: Date.now(),
        workflowHistory: [
          ...state.workflowHistory,
          { 
            taskId: 'property_selection', 
            timestamp: Date.now(),
            data: { propertyId: action.propertyId }
          }
        ]
      };
    
    case 'START_ASSESSMENT':
      return {
        ...state,
        assessmentInProgress: true,
        lastActiveTime: Date.now(),
        workflowHistory: [
          ...state.workflowHistory,
          { taskId: 'assessment_started', timestamp: Date.now() }
        ]
      };
    
    case 'COMPLETE_ASSESSMENT':
      return {
        ...state,
        assessmentInProgress: false,
        lastActiveTime: Date.now(),
        workflowHistory: [
          ...state.workflowHistory,
          { taskId: 'assessment_completed', timestamp: Date.now() }
        ]
      };
    
    case 'SAVE_STATE':
      return {
        ...state,
        savedState: {
          ...state.savedState,
          [action.key]: action.data
        },
        lastActiveTime: Date.now()
      };
    
    case 'CLEAR_STATE':
      if (action.key) {
        const newSavedState = { ...state.savedState };
        delete newSavedState[action.key];
        return {
          ...state,
          savedState: newSavedState,
          lastActiveTime: Date.now()
        };
      }
      return {
        ...state,
        savedState: {},
        lastActiveTime: Date.now()
      };
    
    case 'RESET_WORKFLOW':
      return {
        ...initialState,
        lastActiveTime: Date.now(),
        workflowHistory: [
          ...state.workflowHistory,
          { taskId: 'workflow_reset', timestamp: Date.now() }
        ]
      };
    
    default:
      return state;
  }
}

// Define task structure
export interface WorkflowTask {
  id: string;
  label: string;
  description: string;
  route: string;
  requiredTasks?: string[];
  requiredData?: string[];
  category: 'assessment' | 'analysis' | 'management' | 'visualization';
  icon?: React.ReactNode;
}

// Create the context
interface WorkflowContextType {
  state: WorkflowState;
  setCurrentTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  setActiveProperty: (propertyId: number) => void;
  startAssessment: () => void;
  completeAssessment: () => void;
  saveState: (key: string, data: any) => void;
  clearState: (key?: string) => void;
  resetWorkflow: () => void;
  getTaskStatus: (taskId: string) => 'completed' | 'current' | 'pending' | 'locked';
  canAccessTask: (taskId: string) => boolean;
  navigateToTask: (taskId: string) => void;
  getTaskById: (taskId: string) => WorkflowTask | undefined;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider component
interface WorkflowProviderProps {
  children: ReactNode;
  tasks: WorkflowTask[];
}

export const WorkflowProvider: React.FC<WorkflowProviderProps> = ({ children, tasks }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);
  const [, navigate] = useLocation();
  
  // Load workflow state from local storage on mount
  useEffect(() => {
    const savedWorkflow = localStorage.getItem('terraBuild_workflow');
    if (savedWorkflow) {
      try {
        const parsedWorkflow = JSON.parse(savedWorkflow) as WorkflowState;
        
        // Only restore if the saved state is less than 24 hours old
        const hoursSinceLastActive = (Date.now() - parsedWorkflow.lastActiveTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastActive < 24) {
          // Use the parsed workflow to initialize state
          Object.entries(parsedWorkflow).forEach(([key, value]) => {
            if (key === 'activePropertyId' && value) {
              dispatch({ type: 'SET_ACTIVE_PROPERTY', propertyId: value as number });
            } else if (key === 'completedTasks' && Array.isArray(value)) {
              value.forEach(taskId => dispatch({ type: 'COMPLETE_TASK', taskId }));
            } else if (key === 'currentTask' && typeof value === 'string') {
              dispatch({ type: 'SET_CURRENT_TASK', taskId: value });
            } else if (key === 'savedState' && typeof value === 'object') {
              Object.entries(value as Record<string, any>).forEach(([stateKey, stateValue]) => {
                dispatch({ type: 'SAVE_STATE', key: stateKey, data: stateValue });
              });
            }
          });
        }
      } catch (error) {
        console.error('Error restoring workflow state:', error);
        localStorage.removeItem('terraBuild_workflow');
      }
    }
  }, []);
  
  // Save workflow state to local storage on state changes
  useEffect(() => {
    localStorage.setItem('terraBuild_workflow', JSON.stringify(state));
  }, [state]);
  
  // Function to set current task
  const setCurrentTask = (taskId: string) => {
    dispatch({ type: 'SET_CURRENT_TASK', taskId });
  };
  
  // Function to mark a task as completed
  const completeTask = (taskId: string) => {
    dispatch({ type: 'COMPLETE_TASK', taskId });
  };
  
  // Function to set active property
  const setActiveProperty = (propertyId: number) => {
    dispatch({ type: 'SET_ACTIVE_PROPERTY', propertyId });
  };
  
  // Function to start assessment
  const startAssessment = () => {
    dispatch({ type: 'START_ASSESSMENT' });
  };
  
  // Function to complete assessment
  const completeAssessment = () => {
    dispatch({ type: 'COMPLETE_ASSESSMENT' });
  };
  
  // Function to save state data
  const saveState = (key: string, data: any) => {
    dispatch({ type: 'SAVE_STATE', key, data });
  };
  
  // Function to clear state data
  const clearState = (key?: string) => {
    dispatch({ type: 'CLEAR_STATE', key });
  };
  
  // Function to reset workflow
  const resetWorkflow = () => {
    dispatch({ type: 'RESET_WORKFLOW' });
  };
  
  // Function to get task status
  const getTaskStatus = (taskId: string): 'completed' | 'current' | 'pending' | 'locked' => {
    if (state.completedTasks.includes(taskId)) {
      return 'completed';
    }
    
    if (state.currentTask === taskId) {
      return 'current';
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      return 'pending';
    }
    
    // Check if required tasks are completed
    if (task.requiredTasks && task.requiredTasks.some(req => !state.completedTasks.includes(req))) {
      return 'locked';
    }
    
    // Check if required data is available
    if (task.requiredData && task.requiredData.some(req => !state.savedState[req])) {
      return 'locked';
    }
    
    return 'pending';
  };
  
  // Function to check if a task can be accessed
  const canAccessTask = (taskId: string): boolean => {
    const status = getTaskStatus(taskId);
    return status !== 'locked';
  };
  
  // Function to navigate to a task
  const navigateToTask = (taskId: string) => {
    if (!canAccessTask(taskId)) {
      return;
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(taskId);
      navigate(task.route);
    }
  };
  
  // Function to get task by ID
  const getTaskById = (taskId: string): WorkflowTask | undefined => {
    return tasks.find(t => t.id === taskId);
  };
  
  return (
    <WorkflowContext.Provider
      value={{
        state,
        setCurrentTask,
        completeTask,
        setActiveProperty,
        startAssessment,
        completeAssessment,
        saveState,
        clearState,
        resetWorkflow,
        getTaskStatus,
        canAccessTask,
        navigateToTask,
        getTaskById
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

// Custom hook to use the workflow context
export const useWorkflow = (): WorkflowContextType => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};