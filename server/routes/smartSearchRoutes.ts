/**
 * Smart Search Routes
 * 
 * This module provides API endpoints for intelligent property search functionality
 * including predictive neighborhood suggestions.
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { logger } from '../utils/logger';
import * as schema from '../../shared/schema';
import format from 'pg-format';

const router = Router();

// Validation schemas
const searchQuerySchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().int().positive().optional().default(10),
  neighborhood: z.boolean().optional().default(true),
  property: z.boolean().optional().default(true)
});

/**
 * Search API for properties and neighborhoods with predictive suggestions
 * GET /api/search?query=<search_term>&limit=10&neighborhood=true&property=true
 */
router.get('/', async (req, res) => {
  try {
    const { query, limit, neighborhood, property } = searchQuerySchema.parse({
      query: req.query.query,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      neighborhood: req.query.neighborhood !== 'false',
      property: req.query.property !== 'false'
    });

    const results: any = { 
      neighborhoods: [],
      properties: []
    };

    // Get neighborhood suggestions if requested
    if (neighborhood) {
      try {
        // Find neighborhoods that match the query using pg-format
        const searchPattern = `%${query}%`;
        const neighborhoodQuery = format(
          `SELECT DISTINCT hood_cd, COUNT(*) as property_count 
           FROM properties 
           WHERE hood_cd IS NOT NULL 
             AND hood_cd != '' 
             AND hood_cd::text LIKE %L
           GROUP BY hood_cd 
           ORDER BY property_count DESC 
           LIMIT %s`,
          searchPattern,
          limit
        );
        
        const neighborhoodResults = await db.execute(neighborhoodQuery);

        if (neighborhoodResults.rows && neighborhoodResults.rows.length > 0) {
          results.neighborhoods = neighborhoodResults.rows.map(row => ({
            hood_cd: row.hood_cd,
            name: `Neighborhood ${row.hood_cd}`,
            propertyCount: parseInt(row.property_count),
            confidence: 0.9
          }));
        }
      } catch (error) {
        logger.error(`Error searching neighborhoods: ${error.message}`);
      }
    }

    // Get property suggestions if requested
    if (property) {
      try {
        // Find properties that match the query using pg-format
        const searchPattern = `%${query}%`;
        const propertyQuery = format(
          `SELECT id, hood_cd, geo_id, legal_desc, prop_id
           FROM properties 
           WHERE (geo_id::text LIKE %L OR 
                 prop_id::text LIKE %L OR 
                 legal_desc::text LIKE %L)
           LIMIT %s`,
          searchPattern,
          searchPattern,
          searchPattern,
          limit
        );
        
        const propertyResults = await db.execute(propertyQuery);

        if (propertyResults.rows && propertyResults.rows.length > 0) {
          results.properties = propertyResults.rows.map(row => ({
            id: row.id,
            geo_id: row.geo_id,
            prop_id: row.prop_id,
            address: row.legal_desc || `Property ID: ${row.prop_id || row.geo_id || row.id}`,
            neighborhood: row.hood_cd,
            description: row.legal_desc ? 
              (row.legal_desc.length > 100 ? 
                `${row.legal_desc.substring(0, 100)}...` : 
                row.legal_desc) : 
              'No description available'
          }));
        }
      } catch (error) {
        logger.error(`Error searching properties: ${error.message}`);
      }
    }

    res.json({
      success: true,
      query,
      data: results
    });
  } catch (error) {
    logger.error(`Smart search error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid search query',
      error: error.toString()
    });
  }
});

/**
 * Get neighborhood suggestions based on query
 * GET /api/search/neighborhoods?query=<search_term>&limit=10
 */
router.get('/neighborhoods', async (req, res) => {
  try {
    const { query = "", limit = 10 } = req.query;
    const queryStr = query as string;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit as number;

    // Find neighborhoods that match the query using pg-format
    const searchPattern = `%${queryStr}%`;
    const formattedQuery = format(
      `SELECT DISTINCT hood_cd, COUNT(*) as property_count 
       FROM properties 
       WHERE hood_cd IS NOT NULL 
         AND hood_cd != '' 
         AND hood_cd::text LIKE %L
       GROUP BY hood_cd 
       ORDER BY property_count DESC 
       LIMIT %s`,
      searchPattern,
      limitNum
    );
    
    const neighborhoodResults = await db.execute(formattedQuery);

    const neighborhoods = [];
    
    if (neighborhoodResults.rows && neighborhoodResults.rows.length > 0) {
      neighborhoods.push(...neighborhoodResults.rows.map(row => ({
        hood_cd: row.hood_cd,
        name: `Neighborhood ${row.hood_cd}`,
        propertyCount: parseInt(row.property_count),
        confidence: 0.9
      })));
    }

    res.json({
      success: true,
      query,
      data: neighborhoods
    });
  } catch (error) {
    logger.error(`Neighborhood search error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid search query',
      error: error.toString()
    });
  }
});

/**
 * Get property suggestions based on query
 * GET /api/search/properties?query=<search_term>&limit=10
 */
router.get('/properties', async (req, res) => {
  try {
    const { query = "", limit = 10 } = req.query;
    const queryStr = query as string;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit as number;

    // Find properties that match the query using pg-format
    const searchPattern = `%${queryStr}%`;
    const formattedQuery = format(
      `SELECT id, hood_cd, geo_id, legal_desc, prop_id
       FROM properties 
       WHERE (geo_id::text LIKE %L OR 
             prop_id::text LIKE %L OR 
             legal_desc::text LIKE %L)
       LIMIT %s`,
      searchPattern,
      searchPattern,
      searchPattern,
      limitNum
    );
    
    const propertyResults = await db.execute(formattedQuery);

    const properties = [];
    
    if (propertyResults.rows && propertyResults.rows.length > 0) {
      properties.push(...propertyResults.rows.map(row => ({
        id: row.id,
        geo_id: row.geo_id,
        prop_id: row.prop_id,
        address: row.legal_desc || `Property ID: ${row.prop_id || row.geo_id || row.id}`,
        neighborhood: row.hood_cd,
        description: row.legal_desc ? 
          (row.legal_desc.length > 100 ? 
            `${row.legal_desc.substring(0, 100)}...` : 
            row.legal_desc) : 
          'No description available'
      })));
    }

    res.json({
      success: true,
      query,
      data: properties
    });
  } catch (error) {
    logger.error(`Property search error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid search query',
      error: error.toString()
    });
  }
});

export const smartSearchRoutes = router;