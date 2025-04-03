import { Express } from 'express';
import mcpRouter from './routes';

export function initMCP(app: Express) {
  console.log('Initializing Model Content Protocol (MCP) framework...');
  
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OpenAI API key is not set. MCP features will not work properly.');
  } else {
    console.log('MCP initialized with OpenAI API key');
  }
  
  // Register MCP routes under /api/mcp path
  app.use('/api/mcp', mcpRouter);
  
  console.log('MCP framework initialized successfully');
}