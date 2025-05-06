import express from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * GET /api/properties
 * 
 * Search for properties by address or parcel ID
 * Query parameters:
 *   search: string - Search term for address or parcel ID
 *   county: string - Optional filter by county
 *   limit: number - Maximum number of results to return (default: 10)
 */
router.get('/', async (req, res) => {
  try {
    const searchTerm = req.query.search as string || '';
    const county = req.query.county as string;
    const limit = parseInt(req.query.limit as string || '10');
    
    // Call the storage interface to search for properties
    const properties = await storage.searchProperties({
      searchTerm,
      county,
      limit
    });
    
    res.json(properties);
  } catch (error) {
    console.error('Error searching properties:', error);
    res.status(500).json({ error: 'Failed to search properties' });
  }
});

/**
 * GET /api/properties/:id
 * 
 * Get a specific property by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Call the storage interface to get the property
    const property = await storage.getPropertyById(propertyId);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({ error: 'Failed to get property' });
  }
});

export default router;