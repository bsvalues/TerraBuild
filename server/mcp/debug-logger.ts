/**
 * MCP Debug Logger
 * 
 * Debug utility to find where agent registry lookup failures are occurring
 */

import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current directory equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Creates a log file with detailed information about agent lookup failures
 * @param registry The agent registry to debug
 * @returns The decorated registry
 */
export function debugAgentRegistry(registry: any) {
  const originalGetAgent = registry.getAgent;
  const logFilePath = path.join(__dirname, 'agent-lookup-failures.log');
  
  // Clear the log file on startup
  try {
    fs.writeFileSync(logFilePath, `Agent Registry Debug Log - ${new Date().toISOString()}\n\n`);
  } catch (error) {
    console.error('Failed to create debug log file:', error);
  }
  
  // Track agents that have already been reported as missing to avoid log flooding
  const reportedMissing = new Set<string>();
  
  registry.getAgent = function(id: string) {
    const agent = originalGetAgent.call(this, id);
    
    if (!agent) {
      // Capture stack trace to find the source
      const error = new Error();
      const stackTrace = error.stack || '';
      const callerInfo = extractCallerInfo(stackTrace);
      
      // Only log each missing agent once from each caller location
      const key = `${id}:${callerInfo.file}:${callerInfo.line}`;
      
      if (!reportedMissing.has(key)) {
        reportedMissing.add(key);
        
        // Log to console
        logger.warn(`Agent '${id}' not found in registry, called from ${callerInfo.file}:${callerInfo.line}`);
        
        // Log to file with more details
        try {
          const logEntry = `[${new Date().toISOString()}] Missing agent: '${id}'\n` +
                           `  File: ${callerInfo.file}\n` +
                           `  Line: ${callerInfo.line}\n` +
                           `  Available agents: ${Object.keys(registry.agents).join(', ')}\n` +
                           `  Stack trace:\n    ${stackTrace.split('\n').slice(1).join('\n    ')}\n\n`;
                           
          fs.appendFileSync(logFilePath, logEntry);
        } catch (error) {
          console.error('Failed to write to debug log:', error);
        }
      }
      
      // Register missing critical agents on-demand
      if (['data-quality-agent', 'compliance-agent', 'cost-analysis-agent'].includes(id)) {
        logger.info(`Auto-registering missing critical agent: ${id}`);
        
        const newAgent = {
          id,
          name: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          status: 'active',
          capabilities: [],
          metadata: {
            description: `Auto-registered ${id}`
          },
          lastUpdated: Date.now()
        };
        
        registry.agents[id] = newAgent;
        return newAgent;
      }
    }
    
    return agent;
  };
  
  return registry;
}

/**
 * Extract file and line information from a stack trace
 */
function extractCallerInfo(stackTrace: string) {
  const lines = stackTrace.split('\n');
  let callerLine = '';
  
  // Skip the first line (Error message) and our wrapper function
  // to find the actual caller
  for (let i = 2; i < lines.length; i++) {
    if (!lines[i].includes('debug-logger.ts')) {
      callerLine = lines[i];
      break;
    }
  }
  
  // Extract file and line information using regex
  const matches = callerLine.match(/at\s+(?:\w+\.)*(\w+)\s+\(([^:]+):(\d+):(\d+)\)/);
  
  if (matches) {
    return {
      function: matches[1],
      file: matches[2],
      line: matches[3],
      column: matches[4]
    };
  }
  
  // Fallback for other stack trace formats
  return {
    function: 'unknown',
    file: 'unknown',
    line: '0',
    column: '0'
  };
}