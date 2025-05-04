/**
 * Property Heatmap API Routes
 * 
 * This module provides API endpoints for the property value heatmap feature,
 * including aggregated property values and trend indicators.
 */

import { Router } from 'express';
import { z } from 'zod';
import { propertyHeatmapService } from '../services/propertyHeatmapService';
import { logger } from '../utils/logger';
import { errorHandler, GeographicServiceError } from '../utils/errors';

const router = Router();

// Validation schemas
const areaParamSchema = z.object({
  type: z.enum(['region', 'municipality', 'neighborhood']),
  id: z.string().or(z.number()).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  )
});

const trendParamSchema = z.object({
  months: z.coerce.number().int().positive().default(12)
});

/**
 * Get property value heatmap data for regions
 */
router.get('/regions', async (req, res, next) => {
  try {
    const heatmapData = await propertyHeatmapService.getRegionalHeatmap();
    res.json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get property value heatmap data for municipalities
 */
router.get('/municipalities', async (req, res, next) => {
  try {
    const heatmapData = await propertyHeatmapService.getMunicipalHeatmap();
    res.json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get property value heatmap data for neighborhoods
 */
router.get('/neighborhoods', async (req, res, next) => {
  try {
    const heatmapData = await propertyHeatmapService.getNeighborhoodHeatmap();
    res.json({
      success: true,
      data: heatmapData
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get property value trend data for a specific area
 */
router.get('/trends/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = areaParamSchema.parse({
      type: req.params.type,
      id: req.params.id
    });
    
    const { months } = trendParamSchema.parse(req.query);
    
    const trendData = await propertyHeatmapService.getAreaValueTrend(
      type as 'region' | 'municipality' | 'neighborhood',
      id,
      months
    );
    
    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Initialize property value history
 * This is an administrative endpoint that should be protected
 */
router.post('/history/initialize', async (req, res, next) => {
  try {
    await propertyHeatmapService.initializePropertyValueHistory();
    res.json({
      success: true,
      message: 'Property value history initialized successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Clear heatmap caches
 * This is an administrative endpoint that should be protected
 */
router.post('/cache/clear', async (req, res, next) => {
  try {
    propertyHeatmapService.clearCaches();
    res.json({
      success: true,
      message: 'Property heatmap caches cleared successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Apply error handling middleware
router.use(errorHandler);

export const propertyHeatmapRoutes = router;