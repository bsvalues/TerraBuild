import express from 'express';
import { db } from '../db';
import { eq, like, or } from 'drizzle-orm';
import { logger } from '../utils/logger';

// Define a type that matches the actual properties table in the database
interface Property {
  id: number;
  legal_desc?: string;
  geo_id?: string;
  property_use_desc?: string;
  assessed_val?: number;
  appraised_val?: number;
  property_use_cd?: string;
  hood_cd?: string;
}

const router = express.Router();

/**
 * GET /api/properties
 * 
 * Search for properties by legal description, geo_id, or property ID
 * Query parameters:
 *   search: string - Search term for property fields
 *   county: string - Optional filter by county (not used in current schema)
 *   limit: number - Maximum number of results to return (default: 10)
 */
router.get('/', async (req, res) => {
  try {
    const { search, limit = 10 } = req.query;
    
    // Validate search term
    if (!search || typeof search !== 'string' || search.length < 3) {
      return res.status(400).json({ 
        message: 'Search term must be at least 3 characters long' 
      });
    }
    
    // Set limit for results
    const parsedLimit = parseInt(limit as string);
    const resultsLimit = isNaN(parsedLimit) ? 10 : Math.min(parsedLimit, 50);
    
    // Query directly using db instance since the schema in storage.ts doesn't match
    const searchPattern = `%${search}%`;
    
    // Run the query against the actual schema in the database
    const properties = await db.query.properties.findMany({
      where: or(
        like(db.query.properties.legal_desc, searchPattern),
        like(db.query.properties.geo_id, searchPattern),
        like(db.query.properties.property_use_desc, searchPattern),
        like(db.query.properties.hood_cd, searchPattern)
      ),
      limit: resultsLimit
    });
    
    res.json(properties);
  } catch (error) {
    logger.error('Error searching properties:', error);
    res.status(500).json({ message: 'Failed to search properties' });
  }
});

/**
 * GET /api/properties/:id
 * 
 * Get a specific property by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    const [property] = await db.query.properties.findMany({
      where: eq(db.query.properties.id, id),
      limit: 1
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    logger.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

/**
 * GET /api/properties/geo/:geoId
 * 
 * Get a property by geo_id
 */
router.get('/geo/:geoId', async (req, res) => {
  try {
    const geoId = req.params.geoId;
    
    const [property] = await db.query.properties.findMany({
      where: eq(db.query.properties.geo_id, geoId),
      limit: 1
    });
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    logger.error('Error fetching property by geo_id:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

export default router;