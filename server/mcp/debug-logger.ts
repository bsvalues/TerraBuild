/**
 * MCP Debug Logger
 * 
 * Debug utility to find where agent registry lookup failures are occurring
 */

import { logger } from '../utils/logger';

// Wrap the original getAgent method to add debugging
export function debugAgentRegistry(registry: any) {
  const originalGetAgent = registry.getAgent;
  
  registry.getAgent = function(id: string) {
    const agent = originalGetAgent.call(this, id);
    
    if (!agent) {
      // Log the stack trace to find where this is being called from
      const stackTrace = new Error().stack;
      logger.warn(`Agent ${id} not found in registry, called from:\n${stackTrace}`);
    }
    
    return agent;
  };
  
  return registry;
}