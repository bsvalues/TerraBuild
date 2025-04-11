/**
 * Experience Module Exports for Model Content Protocol
 * 
 * This file exports all experience sharing and coordination components
 * for easy importing throughout the application.
 */

// Export the experience replay buffer
export { experienceReplayBuffer } from './replayBuffer';

// Export the training coordinator
export { trainingCoordinator } from './trainingCoordinator';

// Export the agent coordinator
export { 
  agentCoordinator,
  TaskType,
  TaskStatus,
  type Task,
  type PerformanceMetrics,
  type AgentHealthStatus
} from './agentCoordinator';