/**
 * MCP Types
 * 
 * This module defines types used throughout the MCP framework.
 */

// Define the event interface (instead of importing from event-bus to avoid circular dependency)
export interface MCPEvent {
  id: string;
  topic: string;
  timestamp: number;
  payload?: any;
}

// Agent status type
export type AgentStatus = 'active' | 'inactive' | 'error';

// Agent type
export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  capabilities: string[];
  metadata?: Record<string, any>;
  lastUpdated: number;
}

// Agent registry type
export interface AgentRegistry {
  agents: Record<string, Agent>;
}

// Task status type
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

// Task type
export interface Task {
  id: string;
  agentId: string;
  operation: string;
  status: TaskStatus;
  created: number;
  updated: number;
  data?: any;
  result?: any;
  error?: string;
}

// Task result type
export interface TaskResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
}

// Geographic entities
export interface Region {
  id: number;
  code: string;
  name: string;
  description?: string;
  county: string;
}

export interface Municipality {
  id: number;
  regionId: number;
  name: string;
  code: string;
  description?: string;
}

export interface Neighborhood {
  id: number;
  municipalityId: number;
  hood_cd: string;
  name?: string;
  description?: string;
}

export interface GeographicMapping {
  property?: {
    prop_id: string;
    geo_id: string;
    hood_cd: string;
  };
  neighborhood?: Neighborhood;
  municipality?: Municipality;
  region?: Region;
  confidence: number;
}