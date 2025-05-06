import express from 'express';
import storage from '../storage';

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
    const { search, county, limit = 10 } = req.query;
    
    // Validate search term
    if (!search || typeof search !== 'string' || search.length < 3) {
      return res.status(400).json({ 
        message: 'Search term must be at least 3 characters long' 
      });
    }
    
    // Construct filter based on query params
    const filter: Record<string, any> = {};
    
    if (county && typeof county === 'string') {
      filter.county = county;
    }
    
    // Set limit for results
    const parsedLimit = parseInt(limit as string);
    const resultsLimit = isNaN(parsedLimit) ? 10 : Math.min(parsedLimit, 50);
    
    // Call storage method
    const properties = await storage.searchProperties(
      search, 
      filter, 
      resultsLimit
    );
    
    res.json(properties);
  } catch (error) {
    console.error('Error searching properties:', error);
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
    const property = await storage.getPropertyById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

/**
 * GET /api/properties/parcel/:parcelId
 * 
 * Get a property by parcel ID
 */
router.get('/parcel/:parcelId', async (req, res) => {
  try {
    const property = await storage.getPropertyByParcelId(req.params.parcelId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('Error fetching property by parcel ID:', error);
    res.status(500).json({ message: 'Failed to fetch property' });
  }
});

export default router;