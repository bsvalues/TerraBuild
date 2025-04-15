/**
 * Analytics Routes for BCBS Application
 * 
 * These routes handle data visualization and analytics endpoints,
 * including time series data, regional comparisons, and building type comparisons.
 */

import { Router } from 'express';
import {
  getTimeSeriesData,
  getRegionalComparison,
  getBuildingTypeComparison,
  getCostBreakdown
} from '../controllers/analyticsController';

const router = Router();

// Time series data for cost trends
router.get('/time-series', getTimeSeriesData);

// Regional comparison data
router.get('/regional-comparison', getRegionalComparison);

// Building type comparison data
router.get('/building-type-comparison', getBuildingTypeComparison);

// Cost breakdown for a specific calculation
router.get('/cost-breakdown/:id', getCostBreakdown);

export default router;