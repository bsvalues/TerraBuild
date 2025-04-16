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

// Regional comparison data - support both naming conventions for compatibility
router.get('/regional-comparison', getRegionalComparison);
router.get('/regional-costs', getRegionalComparison);

// Building type comparison data - support both naming conventions for compatibility
router.get('/building-type-comparison', getBuildingTypeComparison);
router.get('/hierarchical-costs', getBuildingTypeComparison);

// Statistical correlations for time series data (alias for time-series)
router.get('/statistical-correlations', getTimeSeriesData);

// Cost breakdown for a specific calculation
router.get('/cost-breakdown/:id', getCostBreakdown);

export default router;