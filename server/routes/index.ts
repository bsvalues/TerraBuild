import express from 'express';
import healthRoutes from './health';
import swarmRoutes from './swarmRoutes';
// Import other route files as needed

export function registerRoutes(app: express.Express): void {
  // Mount API routes
  app.use('/api', healthRoutes);
  app.use('/api/swarm', swarmRoutes);
  
  // Add other routes as needed
}