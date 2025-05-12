import express from 'express';
import { costFactorRouter } from './router';

/**
 * CostFactorTables plugin - provides access to cost factor data for different building types,
 * regions, quality grades, etc. for the Benton County Building Cost Assessment System.
 */
export function register(app: express.Express): void {
  // Register cost factor API routes
  app.use('/api/cost-factors', costFactorRouter);
  
  console.log('CostFactorTables initialized successfully from source: Benton County Building Cost Standards');
}