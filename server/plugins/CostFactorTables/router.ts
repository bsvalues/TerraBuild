/**
 * Cost Factor Tables Plugin Router
 * 
 * Defines API routes for cost factor tables
 */

import express from 'express';
import { 
  getCostFactors, 
  getCurrentSource, 
  getAvailableCostSources,
  updateCostSource
} from './controller';

export const router = express.Router();

// Get cost factors
router.get('/api/cost-factors', getCostFactors);

// Get current cost source
router.get('/api/cost-factors/source', getCurrentSource);

// Get available cost sources
router.get('/api/cost-factors/sources', getAvailableCostSources);

// Update cost source
router.put('/api/cost-factors/source', updateCostSource);