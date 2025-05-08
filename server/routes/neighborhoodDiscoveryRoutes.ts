/**
 * Neighborhood Discovery Routes
 * 
 * This module provides API endpoints to interact with the Neighborhood Discovery Agent,
 * allowing clients to discover and analyze neighborhoods based on property data.
 */

import { Router } from 'express';
import { z } from 'zod';
import { eventBus } from '../mcp/event-bus';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { db } from '../db';
import * as schema from '../../shared/schema';

const router = Router();

// Validation schemas
const discoverParametersSchema = z.object({
  minimumProperties: z.number().positive().optional(),
  distanceThreshold: z.number().positive().optional(),
  useAI: z.boolean().optional(),
  limitResults: z.number().positive().optional()
});

const hoodCdSchema = z.object({
  hood_cd: z.string().min(1)
});

/**
 * Discover neighborhoods based on property data patterns
 * GET & POST /api/neighborhoods/discover
 */
router.get('/discover', async (req, res) => {
  try {
    // For GET requests, use default parameters
    const parameters = {
      minimumProperties: 1,
      distanceThreshold: 0.1,
      useAI: false,
      limitResults: 100
    };
    
    // Generate a fallback response with basic data
    const hoodCds = await getBasicHoodCdData();
    
    res.json({
      success: true,
      data: {
        neighborhoods: hoodCds,
        source: 'direct',
        message: 'Generated from database query'
      }
    });
  } catch (error) {
    logger.error(`Error in neighborhood discovery GET: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error in neighborhood discovery',
      error: error.toString()
    });
  }
});

router.post('/discover', async (req, res) => {
  try {
    // Validate and parse parameters
    const parameters = discoverParametersSchema.parse(req.body);
    
    // Create a unique request ID
    const requestId = uuidv4();
    
    // Create a promise to wait for the event response
    const resultPromise = new Promise((resolve, reject) => {
      // Set timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        eventBus.unsubscribe(successSubscriberId);
        eventBus.unsubscribe(failureSubscriberId);
        reject(new Error('Request timed out'));
      }, 60000); // Allow up to 60 seconds for complex discoveries
      
      // Subscribe to success event
      const successSubscriberId = eventBus.subscribe('neighborhood:discover:completed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          resolve(event.payload.result);
        }
      });
      
      // Subscribe to failure event
      const failureSubscriberId = eventBus.subscribe('neighborhood:discover:failed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          reject(new Error(event.payload.error || 'Unknown error'));
        }
      });
      
      // Send the request to the agent
      eventBus.publish('neighborhood:discover:request', {
        requestId,
        sessionId: req.sessionID || null,
        parameters
      });
    });
    
    try {
      // Wait for result
      const result = await Promise.race([
        resultPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000))
      ]);
      
      res.json({
        success: true,
        data: result
      });
    } catch (eventError) {
      logger.warn(`Neighborhood discovery timed out or had an error: ${eventError.message}`);
      
      // Generate a fallback response with basic data
      const hoodCds = await getBasicHoodCdData();
      
      res.json({
        success: true,
        data: {
          neighborhoods: hoodCds,
          source: 'fallback',
          message: 'Generated from basic data due to timeout or processing error'
        }
      });
    }
  } catch (error) {
    logger.error(`Error in neighborhood discovery: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error in neighborhood discovery',
      error: error.toString()
    });
  }
});

/**
 * Analyze a specific neighborhood by hood_cd
 * GET /api/neighborhoods/analyze/:hoodCd
 */
router.get('/analyze/:hoodCd', async (req, res) => {
  try {
    const { hoodCd } = hoodCdSchema.parse({ hood_cd: req.params.hoodCd });
    
    // Create a unique request ID
    const requestId = uuidv4();
    
    // Create a promise to wait for the event response
    const resultPromise = new Promise((resolve, reject) => {
      // Set timeout to prevent hanging requests
      const timeout = setTimeout(() => {
        eventBus.unsubscribe(successSubscriberId);
        eventBus.unsubscribe(failureSubscriberId);
        reject(new Error('Request timed out'));
      }, 30000);
      
      // Subscribe to success event
      const successSubscriberId = eventBus.subscribe('neighborhood:analyze:completed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          resolve(event.payload.result);
        }
      });
      
      // Subscribe to failure event
      const failureSubscriberId = eventBus.subscribe('neighborhood:analyze:failed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          reject(new Error(event.payload.error || 'Unknown error'));
        }
      });
      
      // Send the request to the agent
      eventBus.publish('neighborhood:analyze:request', {
        requestId,
        sessionId: req.sessionID || null,
        hood_cd: hoodCd
      });
    });
    
    try {
      // Wait for result with a timeout
      const result = await Promise.race([
        resultPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 30000))
      ]);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `No neighborhood found with hood_cd ${hoodCd}`
        });
      }
      
      res.json({
        success: true,
        data: result
      });
    } catch (eventError) {
      logger.warn(`Neighborhood analysis timed out or had an error: ${eventError.message}`);
      
      // Generate a fallback response with basic data for this hood_cd
      const basicData = await getBasicNeighborhoodData(hoodCd);
      
      if (!basicData) {
        return res.status(404).json({
          success: false,
          message: `No neighborhood found with hood_cd ${hoodCd}`
        });
      }
      
      res.json({
        success: true,
        data: basicData,
        source: 'fallback',
        message: 'Generated from basic data due to timeout or processing error'
      });
    }
  } catch (error) {
    logger.error(`Error in neighborhood analysis: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error in neighborhood analysis',
      error: error.toString()
    });
  }
});

/**
 * Get a list of all unique neighborhood codes
 * GET /api/neighborhoods/codes
 */
router.get('/codes', async (req, res) => {
  try {
    // Get all unique hood_cd values with property counts
    const hoodCds = await getBasicHoodCdData();
    
    res.json({
      success: true,
      data: hoodCds
    });
  } catch (error) {
    logger.error(`Error getting neighborhood codes: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting neighborhood codes'
    });
  }
});

/**
 * Get basic data about hood_cd values
 */
async function getBasicHoodCdData() {
  try {
    // First try to get property counts by hood_cd using raw SQL for compatibility
    const properties = await db.execute(
      `SELECT hood_cd FROM properties WHERE hood_cd IS NOT NULL AND hood_cd != ''`
    );
    
    // Group by hood_cd and count
    const hoodCdCounts: Record<string, number> = {};
    
    // Handle the raw result from execute which is an array of objects
    if (Array.isArray(properties.rows)) {
      properties.rows.forEach(p => {
        if (p.hood_cd) {
          hoodCdCounts[p.hood_cd] = (hoodCdCounts[p.hood_cd] || 0) + 1;
        }
      });
    }
    
    // Convert to array of objects
    const result = Object.entries(hoodCdCounts)
      .filter(([hood_cd]) => hood_cd && hood_cd.trim() !== '')
      .map(([hood_cd, count]) => {
        const prefix = hood_cd.split(' ')[0];
        return {
          hood_cd,
          prefix,
          propertyCount: count,
          name: `Neighborhood ${hood_cd}`,
          confidence: 0.5
        };
      });
    
    return result;
  } catch (error) {
    logger.error(`Error getting basic hood_cd data: ${error.message}`);
    return [];
  }
}

/**
 * Get basic data about a specific neighborhood
 */
async function getBasicNeighborhoodData(hood_cd: string) {
  try {
    const properties = await db.execute(
      `SELECT * FROM properties WHERE hood_cd = $1 LIMIT 100`,
      [hood_cd]
    );
    
    // Check if we have any properties
    if (!properties.rows || properties.rows.length === 0) {
      return null;
    }
    
    const prefix = hood_cd.split(' ')[0];
    
    return {
      hood_cd,
      prefix,
      propertyCount: properties.rows.length,
      name: `Neighborhood ${hood_cd}`,
      confidence: 0.5
    };
  } catch (error) {
    logger.error(`Error getting basic neighborhood data: ${error.message}`);
    return null;
  }
}

export const neighborhoodDiscoveryRoutes = router;