import { Router, Request, Response } from 'express';
import { GISAnalysisEngine } from '../services/gisAnalysisEngine';
import { db } from '../db';
import { 
  gisLayers, gisFeatures, spatialAnalysis, propertyGeometry,
  marketAreas, valuationZones, gisAnalysisResults,
  insertGisLayerSchema, insertGisFeatureSchema, insertPropertyGeometrySchema
} from '../../shared/gis-schema';
import { properties } from '../../shared/schema';
import { eq, and, sql, desc, like, or } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();
const gisEngine = new GISAnalysisEngine();

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
    console.error('Layers query error:', error);
    res.status(500).json({ error: 'Failed to fetch layers' });
  }
});

router.post('/layers', async (req: Request, res: Response) => {
  try {
    const layerData = insertGisLayerSchema.parse(req.body);
    const [layer] = await db.insert(gisLayers).values(layerData).returning();
    res.status(201).json(layer);
  } catch (error) {
    console.error('Layer creation error:', error);
    res.status(500).json({ error: 'Failed to create layer' });
  }
});

router.get('/features/:layerId', async (req: Request, res: Response) => {
  try {
    const layerId = parseInt(req.params.layerId);
    if (isNaN(layerId)) {
      return res.status(400).json({ error: 'Invalid layer ID' });
    }

    const { bbox, limit = '100' } = req.query;
    
    let query = db.select().from(gisFeatures).where(eq(gisFeatures.layer_id, layerId));
    
    if (bbox && typeof bbox === 'string') {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      if (minLng && minLat && maxLng && maxLat) {
        query = query.where(
          and(
            sql`${gisFeatures.centroid_lng} >= ${minLng}`,
            sql`${gisFeatures.centroid_lat} >= ${minLat}`,
            sql`${gisFeatures.centroid_lng} <= ${maxLng}`,
            sql`${gisFeatures.centroid_lat} <= ${maxLat}`
          )
        );
      }
    }
    
    const features = await query
      .limit(parseInt(limit as string))
      .orderBy(gisFeatures.id);
    
    res.json(features);
  } catch (error) {
    console.error('Features query error:', error);
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

router.post('/features', async (req: Request, res: Response) => {
  try {
    const featureData = insertGisFeatureSchema.parse(req.body);
    const [feature] = await db.insert(gisFeatures).values(featureData).returning();
    res.status(201).json(feature);
  } catch (error) {
    console.error('Feature creation error:', error);
    res.status(500).json({ error: 'Failed to create feature' });
  }
});

router.get('/market-areas', async (req: Request, res: Response) => {
  try {
    const { type, bbox } = req.query;
    
    let query = db.select().from(marketAreas);
    
    if (type) {
      query = query.where(eq(marketAreas.market_type, type as string));
    }
    
    const areas = await query.orderBy(marketAreas.name);
    res.json(areas);
  } catch (error) {
    console.error('Market areas query error:', error);
    res.status(500).json({ error: 'Failed to fetch market areas' });
  }
});

router.get('/valuation-zones', async (req: Request, res: Response) => {
  try {
    const { bbox } = req.query;
    
    const zones = await db.select()
      .from(valuationZones)
      .orderBy(valuationZones.zone_code);
    
    res.json(zones);
  } catch (error) {
    console.error('Valuation zones query error:', error);
    res.status(500).json({ error: 'Failed to fetch valuation zones' });
  }
});

router.get('/property-geometry/:propertyId', async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }

    const geometry = await db.select()
      .from(propertyGeometry)
      .where(eq(propertyGeometry.property_id, propertyId))
      .limit(1);

    if (geometry.length === 0) {
      return res.status(404).json({ error: 'Property geometry not found' });
    }

    res.json(geometry[0]);
  } catch (error) {
    console.error('Property geometry query error:', error);
    res.status(500).json({ error: 'Failed to fetch property geometry' });
  }
});

router.post('/property-geometry', async (req: Request, res: Response) => {
  try {
    const geometryData = insertPropertyGeometrySchema.parse(req.body);
    const [geometry] = await db.insert(propertyGeometry).values(geometryData).returning();
    res.status(201).json(geometry);
  } catch (error) {
    console.error('Property geometry creation error:', error);
    res.status(500).json({ error: 'Failed to create property geometry' });
  }
});

router.get('/spatial-search', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '1000', type } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = parseFloat(radius as string);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(searchRadius)) {
      return res.status(400).json({ error: 'Invalid coordinates or radius' });
    }

    let query = `
      SELECT 
        p.*,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326)
        ) * 111319.9 as distance_meters
      FROM properties p
      WHERE p.latitude IS NOT NULL 
        AND p.longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326),
          ST_SetSRID(ST_MakePoint($1, $2), 4326),
          $3 / 111319.9
        )
    `;

    const params = [longitude, latitude, searchRadius];

    if (type) {
      query += ` AND p.property_type = $4`;
      params.push(type as string);
    }

    query += ` ORDER BY distance_meters LIMIT 50`;

    const result = await db.execute(sql.raw(query, params));
    res.json(result.rows || []);
  } catch (error) {
    console.error('Spatial search error:', error);
    res.status(500).json({ error: 'Failed to perform spatial search' });
  }
});

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
      .limit(10);

    res.json(results);
  } catch (error) {
    console.error('Analysis results query error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis results' });
  }
});

router.post('/spatial-analysis', async (req: Request, res: Response) => {
  try {
    const { analysis_type, input_layers, parameters } = req.body;
    
    if (!analysis_type || !input_layers) {
      return res.status(400).json({ error: 'Analysis type and input layers required' });
    }

    const analysisData = {
      analysis_type,
      input_layers,
      parameters: parameters || {},
      status: 'pending',
      started_at: new Date(),
      created_by: (req as any).user?.id || null
    };

    const [analysis] = await db.insert(spatialAnalysis).values(analysisData).returning();

    setTimeout(async () => {
      try {
        const results = await performSpatialAnalysis(analysis_type, input_layers, parameters);
        
        await db.update(spatialAnalysis)
          .set({
            results,
            status: 'completed',
            completed_at: new Date()
          })
          .where(eq(spatialAnalysis.id, analysis.id));
      } catch (error) {
        console.error('Spatial analysis processing error:', error);
        await db.update(spatialAnalysis)
          .set({ status: 'failed', completed_at: new Date() })
          .where(eq(spatialAnalysis.id, analysis.id));
      }
    }, 1000);

    res.status(201).json(analysis);
  } catch (error) {
    console.error('Spatial analysis creation error:', error);
    res.status(500).json({ error: 'Failed to create spatial analysis' });
  }
});

router.get('/heatmap/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { bbox, resolution = '0.01' } = req.query;
    
    let query = '';
    let params: any[] = [];
    
    switch (type) {
      case 'property-values':
        query = `
          SELECT 
            ROUND(latitude::numeric, 2) as lat,
            ROUND(longitude::numeric, 2) as lng,
            AVG(market_value) as value,
            COUNT(*) as count
          FROM properties 
          WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL 
            AND market_value IS NOT NULL
        `;
        break;
        
      case 'density':
        query = `
          SELECT 
            ROUND(latitude::numeric, 2) as lat,
            ROUND(longitude::numeric, 2) as lng,
            COUNT(*) as value,
            COUNT(*) as count
          FROM properties 
          WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid heatmap type' });
    }
    
    if (bbox && typeof bbox === 'string') {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      if (minLng && minLat && maxLng && maxLat) {
        query += ` AND latitude BETWEEN $1 AND $3 AND longitude BETWEEN $2 AND $4`;
        params = [minLat, minLng, maxLat, maxLng];
      }
    }
    
    query += ` GROUP BY ROUND(latitude::numeric, 2), ROUND(longitude::numeric, 2) HAVING COUNT(*) > 0`;
    
    const result = await db.execute(sql.raw(query, params));
    res.json(result.rows || []);
  } catch (error) {
    console.error('Heatmap query error:', error);
    res.status(500).json({ error: 'Failed to generate heatmap data' });
  }
});

async function performSpatialAnalysis(type: string, layers: any, parameters: any): Promise<any> {
  switch (type) {
    case 'buffer':
      return performBufferAnalysis(layers, parameters);
    case 'intersection':
      return performIntersectionAnalysis(layers, parameters);
    case 'proximity':
      return performProximityAnalysis(layers, parameters);
    default:
      throw new Error('Unknown analysis type');
  }
}

async function performBufferAnalysis(layers: any, parameters: any): Promise<any> {
  const { distance = 1000 } = parameters;
  return {
    type: 'buffer',
    distance,
    features_count: 0,
    area: 0,
    completed_at: new Date().toISOString()
  };
}

async function performIntersectionAnalysis(layers: any, parameters: any): Promise<any> {
  return {
    type: 'intersection',
    intersections: [],
    total_area: 0,
    completed_at: new Date().toISOString()
  };
}

async function performProximityAnalysis(layers: any, parameters: any): Promise<any> {
  const { max_distance = 5000 } = parameters;
  return {
    type: 'proximity',
    max_distance,
    nearby_features: [],
    completed_at: new Date().toISOString()
  };
}

export default router;