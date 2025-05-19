/**
 * API Routes Main Entry Point
 * 
 * This file serves as the central hub for all API routes in the application.
 * It imports and registers all route modules for the Benton County Building Cost System.
 */

import express from 'express';
import propertyImportRoutes from './property-import.js';
import dataQualityRoutes from './data-quality.js';

const router = express.Router();

// Register all route modules
router.use('/property-import', propertyImportRoutes);
router.use('/data-quality', dataQualityRoutes);

// Basic health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Use named export instead of default for TypeScript compatibility
export { router };