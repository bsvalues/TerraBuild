/**
 * Enhanced Geographic API Routes
 * 
 * This module provides optimized API endpoints for geographic data operations with:
 * - Standardized error handling
 * - Improved validation
 * - Performance optimization
 */

import { Router } from 'express';
import { z } from 'zod';
import { enhancedGeographicService } from '../services/enhancedGeographicService';
import { geographicDataMigration } from '../services/geographicDataMigration';
import { logger } from '../utils/logger';
import { errorHandler, GeographicServiceError } from '../utils/errors';

const router = Router();

// Enhanced validation schemas
const idParam = z.object({
  id: z.coerce.number().positive('ID must be a positive number')
});

const codeParam = z.object({
  code: z.string().min(1, 'Code cannot be empty')
});

const regionCreateSchema = z.object({
  regionCode: z.string().min(2, 'Region code must be at least 2 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

const regionUpdateSchema = z.object({
  regionCode: z.string().min(2, 'Region code must be at least 2 characters').optional(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional()
});

const townshipRangeSchema = z.object({
  township: z.string().min(1, 'Township code cannot be empty'),
  range: z.string().min(1, 'Range code cannot be empty')
});

const migrationSchema = z.object({
  confirm: z.boolean().refine(val => val === true, {
    message: 'Confirmation required to run migration'
  })
});

/**
 * Get all regions
 */
router.get('/regions', async (req, res, next) => {
  try {
    const regions = await enhancedGeographicService.getRegions();
    res.json({ success: true, data: regions });
  } catch (error) {
    next(error);
  }
});

/**
 * Get region by ID
 */
router.get('/regions/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const region = await enhancedGeographicService.getRegionById(id);
    res.json({ success: true, data: region });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region ID',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Create a new region
 */
router.post('/regions', async (req, res, next) => {
  try {
    const regionData = regionCreateSchema.parse(req.body);
    const region = await enhancedGeographicService.createRegion(regionData);
    res.status(201).json({ success: true, data: region });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid region data',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Update a region
 */
router.patch('/regions/:id', async (req, res, next) => {
  try {
    const { id } = idParam.parse(req.params);
    const regionData = regionUpdateSchema.parse(req.body);
    const region = await enhancedGeographicService.updateRegion(id, regionData);
    res.json({ success: true, data: region });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Get geographic hierarchy by hood_cd
 */
router.get('/hierarchy/by-hood-cd/:code', async (req, res, next) => {
  try {
    const { code } = codeParam.parse(req.params);
    const hierarchy = await enhancedGeographicService.getGeographicHierarchyByHoodCd(code);
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hood_cd',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Map township/range to geography
 */
router.get('/map/township-range', async (req, res, next) => {
  try {
    const { township, range } = townshipRangeSchema.parse(req.query);
    
    const geography = await enhancedGeographicService.mapTownshipRangeToGeography(township, range);
    res.json({ success: true, data: geography });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid township/range parameters',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Map TCA to geography
 */
router.get('/map/tca/:code', async (req, res, next) => {
  try {
    const { code } = codeParam.parse(req.params);
    const geography = await enhancedGeographicService.mapTcaToGeography(code);
    res.json({ success: true, data: geography });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid TCA code',
        errors: error.errors
      });
    }
    next(error);
  }
});

/**
 * Clear caches
 * This is an administrative endpoint that should be protected
 */
router.post('/cache/clear', async (req, res, next) => {
  try {
    enhancedGeographicService.clearCaches();
    logger.info('Geographic service caches cleared');
    res.json({
      success: true,
      message: 'Geographic caches cleared successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Run geographic data migration
 * This is an administrative endpoint that should be protected
 */
router.post('/migrate', async (req, res, next) => {
  try {
    const { confirm } = migrationSchema.parse(req.body);
    
    logger.info('Starting geographic data migration...');
    const result = await geographicDataMigration.runMigration();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Geographic data migration failed',
        stats: result.stats
      });
    }
    
    // Clear caches after migration
    enhancedGeographicService.clearCaches();
    
    logger.success('Geographic data migration completed successfully');
    res.json({
      success: true,
      message: 'Geographic data migration completed successfully',
      stats: result.stats
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Set "confirm": true in the request body to proceed.',
        errors: error.errors
      });
    }
    next(error);
  }
});

// Apply error handling middleware
router.use(errorHandler);

export const enhancedGeographicRoutes = router;