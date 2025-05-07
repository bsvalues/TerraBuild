/**
 * Geographic Mapping API Routes
 * 
 * This module provides API endpoints to interact with the Geographic Mapping Agent
 * to map properties to their correct geographic entities based on real data.
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
const propertyIdSchema = z.object({
  propId: z.coerce.number().positive()
});

const hoodCdSchema = z.object({
  hoodCd: z.string().min(1)
});

const createNeighborhoodSchema = z.object({
  hood_cd: z.string().min(1),
  municipalityId: z.coerce.number().positive(),
  name: z.string().optional()
});

/**
 * Get geographic mapping for a property by ID
 */
router.get('/property/:propId/geography', async (req, res) => {
  try {
    const { propId } = propertyIdSchema.parse(req.params);
    
    // Get property data
    const property = await db.select().from(schema.properties)
      .where(db.eq(schema.properties.prop_id, propId));
    
    if (!property || property.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Property with ID ${propId} not found`
      });
    }
    
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
      const successSubscriberId = eventBus.subscribe('geography:map:completed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          resolve(event.payload.result);
        }
      });
      
      // Subscribe to failure event
      const failureSubscriberId = eventBus.subscribe('geography:map:failed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          reject(new Error(event.payload.error || 'Unknown error'));
        }
      });
      
      // Send the request to the agent
      eventBus.publish('geography:map:property', {
        propertyData: property[0],
        requestId,
        sessionId: req.sessionID || null
      });
    });
    
    // Wait for result
    const result = await resultPromise;
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error mapping property geography: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error mapping property geography',
      error: error.stack
    });
  }
});

/**
 * Get geographic mapping for a neighborhood by hood_cd
 */
router.get('/neighborhood/:hoodCd/geography', async (req, res) => {
  try {
    const { hoodCd } = hoodCdSchema.parse(req.params);
    
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
      const successSubscriberId = eventBus.subscribe('geography:map:completed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          resolve(event.payload.result);
        }
      });
      
      // Subscribe to failure event
      const failureSubscriberId = eventBus.subscribe('geography:map:failed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          reject(new Error(event.payload.error || 'Unknown error'));
        }
      });
      
      // Send the request to the agent
      eventBus.publish('geography:map:property', {
        propertyData: { hood_cd: hoodCd },
        requestId,
        sessionId: req.sessionID || null
      });
    });
    
    // Wait for result
    const result = await resultPromise;
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error mapping neighborhood geography: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error mapping neighborhood geography',
      error: error.stack
    });
  }
});

/**
 * Create a new neighborhood mapping
 */
router.post('/neighborhood', async (req, res) => {
  try {
    const { hood_cd, municipalityId, name } = createNeighborhoodSchema.parse(req.body);
    
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
      const successSubscriberId = eventBus.subscribe('geography:neighborhood:completed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          resolve(event.payload.result);
        }
      });
      
      // Subscribe to failure event
      const failureSubscriberId = eventBus.subscribe('geography:neighborhood:failed', (event) => {
        if (event.payload?.requestId === requestId) {
          clearTimeout(timeout);
          eventBus.unsubscribe(successSubscriberId);
          eventBus.unsubscribe(failureSubscriberId);
          reject(new Error(event.payload.error || 'Unknown error'));
        }
      });
      
      // Send the request to the agent
      eventBus.publish('geography:neighborhood:create', {
        hood_cd,
        municipalityId,
        name,
        requestId,
        sessionId: req.sessionID || null
      });
    });
    
    // Wait for result
    const result = await resultPromise;
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error(`Error creating neighborhood: ${error.message}`);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Error creating neighborhood',
      error: error.stack
    });
  }
});

/**
 * Analyze a sample of property data to extract common neighborhood patterns
 */
router.get('/analyze/neighborhoods', async (req, res) => {
  try {
    // Get a sample of properties
    const properties = await db.select().from(schema.properties).limit(100);
    
    // Extract unique hood_cd values
    const hoodCds = [...new Set(properties.map(p => p.hood_cd).filter(Boolean))];
    
    // Analyze patterns
    const patterns = hoodCds.map(code => {
      const prefix = code.split(' ')[0];
      return {
        hood_cd: code,
        prefix: prefix,
        possibleCity: determineCityFromPrefix(prefix)
      };
    });
    
    res.json({
      success: true,
      data: {
        uniqueHoodCds: hoodCds.length,
        patterns
      }
    });
  } catch (error) {
    logger.error(`Error analyzing neighborhoods: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message || 'Error analyzing neighborhoods'
    });
  }
});

// Helper function to determine city from hood_cd prefix
function determineCityFromPrefix(prefix: string): string {
  // This is based on the patterns we observed in the CSV file
  const prefixMappings: Record<string, string> = {
    '530300': 'Richland',
    '540100': 'Kennewick',
    '550000': 'Prosser',
    '520200': 'West Richland',
    '560100': 'Benton City',
    '570200': 'Finley'
  };
  
  return prefixMappings[prefix] || 'Unknown';
}

export const geoMappingRoutes = router;