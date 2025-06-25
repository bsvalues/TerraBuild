import { Router, Request, Response } from 'express';
import { db } from '../db';
import { GISAnalysisEngine } from '../services/gisAnalysisEngine';
import { 
  gisLayers, gisFeatures, spatialAnalysis, propertyGeometry,
  marketAreas, valuationZones, gisAnalysisResults 
} from '../../shared/gis-schema';
import { properties } from '../../shared/schema';
import { eq, and, sql, desc, like, or } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();
const gisEngine = new GISAnalysisEngine();

// Get all GIS layers
router.get('/layers', async (req: Request, res: Response) => {
  try {
    const { type, active } = req.query;
    
    let query = db.select().from(gisLayers);
    
    if (type) {
      query = query.where(eq(gisLayers.type, type as string));
    }
    
    if (active === 'true') {
      query = query.where(eq(gisLayers.is_active, true));
    }
    
    const layers = await query.orderBy(gisLayers.name);
    res.json(layers);
  } catch (error) {
    console.error('Error fetching GIS layers:', error);
    res.status(500).json({ error: 'Failed to fetch GIS layers' });
  }
});

// Spatial search for properties
router.get('/spatial-search', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = parseInt(radius as string);

    // Convert radius from meters to degrees (approximate)
    const radiusDegrees = searchRadius / 111000;

    const searchResults = await db.select()
      .from(properties)
      .where(
        and(
          sql`latitude IS NOT NULL`,
          sql`longitude IS NOT NULL`,
          sql`latitude BETWEEN ${latitude - radiusDegrees} AND ${latitude + radiusDegrees}`,
          sql`longitude BETWEEN ${longitude - radiusDegrees} AND ${longitude + radiusDegrees}`
        )
      )
      .limit(100);

    res.json(searchResults);
  } catch (error) {
    console.error('Error in spatial search:', error);
    res.status(500).json({ error: 'Failed to perform spatial search' });
  }
});

// Get heatmap data
router.get('/heatmap/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    let heatmapData;
    
    switch (type) {
      case 'property-values':
        heatmapData = await db.execute(sql`
          SELECT 
            latitude::text as lat,
            longitude::text as lng,
            total_value as value,
            CASE 
              WHEN total_value > 1000000 THEN 1.0
              WHEN total_value > 500000 THEN 0.7
              WHEN total_value > 250000 THEN 0.5
              ELSE 0.3
            END as intensity
          FROM properties 
          WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL 
            AND total_value > 0
          LIMIT 1000
        `);
        break;
        
      case 'density':
        heatmapData = await db.execute(sql`
          SELECT 
            latitude::text as lat,
            longitude::text as lng,
            COUNT(*) OVER (
              PARTITION BY 
                ROUND(latitude::numeric, 3), 
                ROUND(longitude::numeric, 3)
            ) as value,
            0.6 as intensity
          FROM properties 
          WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL
          LIMIT 1000
        `);
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid heatmap type' });
    }

    res.json(heatmapData.rows || []);
  } catch (error) {
    console.error('Error generating heatmap data:', error);
    res.status(500).json({ error: 'Failed to generate heatmap data' });
  }
});

// Analyze property
router.post('/analyze/property/:id', async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const analysis = await gisEngine.performComprehensiveAnalysis(propertyId);
    res.json(analysis);
  } catch (error) {
    console.error('Property analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze property' });
  }
});

// Get analysis results for a property
router.get('/analysis-results/:propertyId', async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const results = await db.select()
      .from(gisAnalysisResults)
      .where(eq(gisAnalysisResults.property_id, propertyId))
      .orderBy(desc(gisAnalysisResults.analysis_date))
      .limit(5);

    res.json(results);
  } catch (error) {
    console.error('Error fetching analysis results:', error);
    res.status(500).json({ error: 'Failed to fetch analysis results' });
  }
});

// Initialize GIS data (for testing and demo purposes)
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    // Create sample GIS layers
    await db.insert(gisLayers).values([
      {
        name: 'Schools',
        type: 'schools',
        geometry_type: 'Point',
        is_active: true,
        metadata: { description: 'Educational facilities' }
      },
      {
        name: 'Parks',
        type: 'recreation',
        geometry_type: 'Polygon',
        is_active: true,
        metadata: { description: 'Parks and recreational areas' }
      },
      {
        name: 'Commercial',
        type: 'commercial',
        geometry_type: 'Polygon',
        is_active: true,
        metadata: { description: 'Commercial zones and buildings' }
      },
      {
        name: 'Transportation',
        type: 'transportation',
        geometry_type: 'LineString',
        is_active: true,
        metadata: { description: 'Roads and transit systems' }
      }
    ]).onConflictDoNothing();

    // Create sample market areas
    await db.insert(marketAreas).values([
      {
        name: 'Downtown Core',
        area_code: 'DC001',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.2812, 46.2382],
            [-119.2612, 46.2382],
            [-119.2612, 46.2582],
            [-119.2812, 46.2582],
            [-119.2812, 46.2382]
          ]]
        },
        market_type: 'urban',
        price_per_sqft_avg: 185.50,
        appreciation_rate: 0.058,
        inventory_months: 2.3,
        sales_volume: 45
      },
      {
        name: 'Suburban West',
        area_code: 'SW001',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-119.3012, 46.2182],
            [-119.2812, 46.2182],
            [-119.2812, 46.2382],
            [-119.3012, 46.2382],
            [-119.3012, 46.2182]
          ]]
        },
        market_type: 'suburban',
        price_per_sqft_avg: 162.75,
        appreciation_rate: 0.042,
        inventory_months: 3.1,
        sales_volume: 72
      }
    ]).onConflictDoNothing();

    res.json({ message: 'GIS system initialized successfully' });
  } catch (error) {
    console.error('Error initializing GIS data:', error);
    res.status(500).json({ error: 'Failed to initialize GIS system' });
  }
});

export default router;