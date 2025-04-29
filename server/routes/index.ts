import express from 'express';
import healthRoutes from './health';
// Import other route files as needed

export function registerRoutes(app: express.Express): void {
  // Mount API routes
  app.use('/api', healthRoutes);
  
  // Add other routes as needed
}