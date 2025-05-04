/**
 * Property Heatmap API Routes
 * 
 * This module provides API endpoints for the property value heatmap feature,
 * including aggregated property values and trend indicators.
 */

import express from 'express';
import { z } from 'zod';
import { propertyHeatmapService } from '../services/propertyHeatmapService';

const router = express.Router();

/**
 * Get property value heatmap data for regions
 */
router.get('/regions', async (req, res) => {
  try {
    const data = await propertyHeatmapService.getRegionalHeatmap();
    return res.json(data);
  } catch (error) {
    console.error('Error in regional heatmap route:', error);
    return res.status(500).json({
      error: 'Failed to retrieve regional heatmap data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get property value heatmap data for municipalities
 */
router.get('/municipalities', async (req, res) => {
  try {
    const data = await propertyHeatmapService.getMunicipalHeatmap();
    return res.json(data);
  } catch (error) {
    console.error('Error in municipal heatmap route:', error);
    return res.status(500).json({
      error: 'Failed to retrieve municipal heatmap data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get property value heatmap data for neighborhoods
 */
router.get('/neighborhoods', async (req, res) => {
  try {
    const data = await propertyHeatmapService.getNeighborhoodHeatmap();
    return res.json(data);
  } catch (error) {
    console.error('Error in neighborhood heatmap route:', error);
    return res.status(500).json({
      error: 'Failed to retrieve neighborhood heatmap data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get property value trend data for a specific area
 */
router.get('/trends/:areaType/:areaId', async (req, res) => {
  try {
    const areaTypeSchema = z.enum(['region', 'municipality', 'neighborhood']);
    const areaIdSchema = z.coerce.number().positive();
    const monthsSchema = z.coerce.number().positive().default(12);

    const validatedAreaType = areaTypeSchema.safeParse(req.params.areaType);
    const validatedAreaId = areaIdSchema.safeParse(req.params.areaId);
    const validatedMonths = monthsSchema.safeParse(req.query.months);

    if (!validatedAreaType.success) {
      return res.status(400).json({
        error: 'Invalid area type',
        message: 'Area type must be one of: region, municipality, neighborhood'
      });
    }

    if (!validatedAreaId.success) {
      return res.status(400).json({
        error: 'Invalid area ID',
        message: 'Area ID must be a positive number'
      });
    }

    const months = validatedMonths.success ? validatedMonths.data : 12;

    const trends = await propertyHeatmapService.getAreaValueTrend(
      validatedAreaType.data,
      validatedAreaId.data,
      months
    );

    return res.json(trends);
  } catch (error) {
    console.error('Error in value trend route:', error);
    return res.status(500).json({
      error: 'Failed to retrieve property value trends',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Initialize property value history
 * This is an administrative endpoint that should be protected
 */
router.post('/initialize-history', async (req, res) => {
  try {
    // This should be protected by admin authentication
    // For now, we'll check for an admin flag in the request
    // In production, this would use proper authentication middleware
    if (req.body.adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'This endpoint requires administrative privileges'
      });
    }

    await propertyHeatmapService.initializePropertyValueHistory();
    return res.json({
      success: true,
      message: 'Property value history initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing property value history:', error);
    return res.status(500).json({
      error: 'Failed to initialize property value history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Clear heatmap caches
 * This is an administrative endpoint that should be protected
 */
router.post('/clear-cache', async (req, res) => {
  try {
    // This should be protected by admin authentication
    // For now, we'll check for an admin flag in the request
    // In production, this would use proper authentication middleware
    if (req.body.adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({
        error: 'Unauthorized',
        message: 'This endpoint requires administrative privileges'
      });
    }

    propertyHeatmapService.clearCaches();
    return res.json({
      success: true,
      message: 'Heatmap caches cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing heatmap caches:', error);
    return res.status(500).json({
      error: 'Failed to clear heatmap caches',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export const propertyHeatmapRoutes = router;