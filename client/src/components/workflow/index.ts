// Export all workflow components
export { default as WorkflowVisualizer } from './WorkflowVisualizer';
export { default as WorkflowProvider } from './WorkflowProvider';
export { default as DataFlowWorkflow } from './DataFlowWorkflow';
export { default as WorkflowDashboard } from './WorkflowDashboard';

// Export types and interfaces
export type {
  WorkflowStep,
  WorkflowContextType,
} from './WorkflowVisualizer';

export type {
  DataFlowEvent,
  DataFlowEventType,
} from './DataFlowWorkflow';

export type {
  WorkflowMetadata,
} from './WorkflowDashboard';

// Export hooks and components
export {
  useWorkflow,
  WorkflowNavigation,
  WorkflowProgressBar,
} from './WorkflowVisualizer';

// Export helper functions
export {
  resetWorkflow,
} from './WorkflowProvider';

// Constants and configurations
export const DEFAULT_WORKFLOW_CONFIG = {
  showDataFlowEvents: true,
  preserveWorkflowState: true,
  animationEnabled: true,
  theme: 'light', // 'light' | 'dark' | 'system'
  detailLevel: 'default', // 'minimal' | 'default' | 'detailed'
};