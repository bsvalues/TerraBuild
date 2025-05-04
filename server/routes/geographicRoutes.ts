/**
 * Geographic API Routes
 * 
 * This module provides the API endpoints for geographic data operations,
 * including regions, municipalities, neighborhoods, and their relationships.
 */

import { Router } from 'express';
import { z } from 'zod';
import { geographicService } from '../services/geographicService';
import { geographicDataMigration } from '../services/geographicDataMigration';
import { logger } from '../utils/logger';

const router = Router();

// Validate request parameters
const idParam = z.object({
  id: z.coerce.number().positive()
});

const codeParam = z.object({
  code: z.string().min(1)
});

const migrationSchema = z.object({
  confirm: z.literal(true).optional()
});

/**
 * Get all geographic regions
 */
router.get('/regions', async (req, res) => {
  try {
    const regions = await geographicService.getRegions();
    res.json({ success: true, data: regions });
  } catch (error) {
    logger.error('Error getting regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get regions',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get a region by ID
 */
router.get('/regions/:id', async (req, res) => {
  try {
    const { id } = idParam.parse(req.params);
    const region = await geographicService.getRegionById(id);
    
    if (!region) {
      return res.status(404).json({
        success: false,
        message: `Region with ID ${id} not found`
      });
    }
    
    res.json({ success: true, data: region });
  } catch (error) {
    logger.error(`Error getting region by ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get region',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get all municipalities, optionally filtered by region
 */
router.get('/municipalities', async (req, res) => {
  try {
    const regionId = req.query.regionId ? parseInt(req.query.regionId as string) : undefined;
    const municipalities = await geographicService.getMunicipalities(regionId);
    res.json({ success: true, data: municipalities });
  } catch (error) {
    logger.error('Error getting municipalities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get municipalities',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get a municipality by ID
 */
router.get('/municipalities/:id', async (req, res) => {
  try {
    const { id } = idParam.parse(req.params);
    const municipality = await geographicService.getMunicipalityById(id);
    
    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: `Municipality with ID ${id} not found`
      });
    }
    
    res.json({ success: true, data: municipality });
  } catch (error) {
    logger.error(`Error getting municipality by ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get municipality',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get all neighborhoods, optionally filtered by municipality
 */
router.get('/neighborhoods', async (req, res) => {
  try {
    const municipalityId = req.query.municipalityId ? parseInt(req.query.municipalityId as string) : undefined;
    const neighborhoods = await geographicService.getNeighborhoods(municipalityId);
    res.json({ success: true, data: neighborhoods });
  } catch (error) {
    logger.error('Error getting neighborhoods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get neighborhoods',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get neighborhood by hood_cd
 */
router.get('/neighborhoods/by-code/:code', async (req, res) => {
  try {
    const { code } = codeParam.parse(req.params);
    const neighborhood = await geographicService.getNeighborhoodByHoodCd(code);
    
    if (!neighborhood) {
      return res.status(404).json({
        success: false,
        message: `Neighborhood with hood_cd ${code} not found`
      });
    }
    
    res.json({ success: true, data: neighborhood });
  } catch (error) {
    logger.error(`Error getting neighborhood by hood_cd ${req.params.code}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get neighborhood',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get geographic hierarchy by hood_cd
 */
router.get('/hierarchy/by-hood-cd/:code', async (req, res) => {
  try {
    const { code } = codeParam.parse(req.params);
    const hierarchy = await geographicService.getGeographicHierarchyByHoodCd(code);
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    logger.error(`Error getting geographic hierarchy for hood_cd ${req.params.code}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geographic hierarchy',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Map township/range to geography
 */
router.get('/map/township-range', async (req, res) => {
  try {
    const townshipCode = req.query.township as string;
    const rangeCode = req.query.range as string;
    
    if (!townshipCode || !rangeCode) {
      return res.status(400).json({
        success: false,
        message: 'Both township and range parameters are required'
      });
    }
    
    const geography = await geographicService.mapTownshipRangeToGeography(townshipCode, rangeCode);
    res.json({ success: true, data: geography });
  } catch (error) {
    logger.error('Error mapping township/range to geography:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to map township/range to geography',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Map TCA to geography
 */
router.get('/map/tca/:code', async (req, res) => {
  try {
    const { code } = codeParam.parse(req.params);
    const geography = await geographicService.mapTcaToGeography(code);
    res.json({ success: true, data: geography });
  } catch (error) {
    logger.error(`Error mapping TCA ${req.params.code} to geography:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to map TCA to geography',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get enhanced cost matrix data
 */
router.get('/matrix', async (req, res) => {
  try {
    const buildingTypeId = req.query.buildingType as string;
    const regionId = parseInt(req.query.regionId as string);
    const municipalityId = req.query.municipalityId ? parseInt(req.query.municipalityId as string) : undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    if (!buildingTypeId || isNaN(regionId)) {
      return res.status(400).json({
        success: false,
        message: 'buildingType and regionId parameters are required'
      });
    }
    
    const matrix = await geographicService.getEnhancedCostMatrix(buildingTypeId, regionId, municipalityId, year);
    
    if (!matrix) {
      return res.status(404).json({
        success: false,
        message: 'Cost matrix not found for the specified criteria'
      });
    }
    
    res.json({ success: true, data: matrix });
  } catch (error) {
    logger.error('Error getting enhanced cost matrix:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enhanced cost matrix',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Get region for property based on identifiers
 */
router.post('/region-for-property', async (req, res) => {
  try {
    const propertyData = {
      hoodCd: req.body.hoodCd,
      townshipCode: req.body.townshipCode,
      rangeCode: req.body.rangeCode,
      tca: req.body.tca
    };
    
    const region = await geographicService.getRegionForProperty(propertyData);
    
    if (!region) {
      return res.status(404).json({
        success: false,
        message: 'Could not determine region for the provided property data'
      });
    }
    
    res.json({ success: true, data: region });
  } catch (error) {
    logger.error('Error getting region for property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get region for property',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Run geographic data migration
 * This is an administrative endpoint that should be protected
 */
router.post('/migrate', async (req, res) => {
  try {
    const { confirm } = migrationSchema.parse(req.body);
    
    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Set "confirm": true in the request body to proceed.'
      });
    }
    
    logger.info('Starting geographic data migration...');
    const result = await geographicDataMigration.runMigration();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Geographic data migration failed',
        stats: result.stats
      });
    }
    
    logger.success('Geographic data migration completed successfully');
    res.json({
      success: true,
      message: 'Geographic data migration completed successfully',
      stats: result.stats
    });
  } catch (error) {
    logger.error('Error running geographic data migration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run geographic data migration',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export const geographicRoutes = router;