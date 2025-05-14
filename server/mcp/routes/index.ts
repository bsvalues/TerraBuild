/**
 * MCP Routes Index
 * 
 * This module exports a router that combines all MCP route handlers.
 */

import express from 'express';
import testRoutes from './test';
import diagnosticRoutes from './diagnostic';

const router = express.Router();

// Register all route handlers
router.use('/test', testRoutes);
router.use('/diagnostic', diagnosticRoutes);

export default router;