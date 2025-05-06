/**
 * Calculation Routes for TerraBuild
 * 
 * This file provides API routes for cost calculations in the system,
 * including calculation based on versioned factor tables.
 */

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { storage } from '../storage-implementation';

export const calculationRoutes = Router();

// Define the calculation request schema
const calculateRequestSchema = z.object({
  buildingType: z.string(),
  region: z.string(),
  yearBuilt: z.number().int().min(1800).max(2100),
  quality: z.string(),
  condition: z.string(),
  complexity: z.string().optional(),
  squareFeet: z.number().int().positive()
});

// Helper function to get the latest factors file
function getLatestFactorsFile(): string {
  const dataDir = path.join(process.cwd(), 'data');
  const factorFiles = fs.readdirSync(dataDir)
    .filter(file => file.startsWith('factors-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (factorFiles.length === 0) {
    throw new Error('No factor files found');
  }
  
  return path.join(dataDir, factorFiles[0]);
}

// Helper function to read and cache factors data
let factorsCache: any = null;
let factorsCacheTimestamp = 0;

function getFactors() {
  const now = Date.now();
  
  // Check if cache needs refreshing (every 5 minutes)
  if (!factorsCache || now - factorsCacheTimestamp > 5 * 60 * 1000) {
    try {
      const filePath = getLatestFactorsFile();
      const fileContent = fs.readFileSync(filePath, 'utf8');
      factorsCache = JSON.parse(fileContent);
      factorsCacheTimestamp = now;
    } catch (error) {
      console.error('Error loading factors data:', error);
      throw error;
    }
  }
  
  return factorsCache;
}

/**
 * Calculate building cost
 * 
 * POST /api/calculate
 * Content-Type: application/json
 * Body: {
 *   buildingType: "RES",
 *   region: "BC-CENTRAL",
 *   yearBuilt: 2010,
 *   quality: "STANDARD",
 *   condition: "GOOD",
 *   complexity: "STANDARD",
 *   squareFeet: 2000
 * }
 */
calculationRoutes.post('/calculate', async (req, res) => {
  try {
    // Validate the request
    const parseResult = calculateRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: parseResult.error.format()
      });
    }
    
    const data = parseResult.data;
    
    // Get the factors data
    const factors = getFactors();
    
    // Find the base rate for the building type
    const buildingType = factors.factors.buildingTypes.find(
      (bt: any) => bt.code === data.buildingType
    );
    
    if (!buildingType) {
      return res.status(400).json({
        error: `Building type "${data.buildingType}" not found`
      });
    }
    
    // Find the region factor
    const region = factors.factors.regions.find(
      (r: any) => r.code === data.region
    );
    
    if (!region) {
      return res.status(400).json({
        error: `Region "${data.region}" not found`
      });
    }
    
    // Find the quality factor
    const quality = factors.factors.quality.find(
      (q: any) => q.level === data.quality
    );
    
    if (!quality) {
      return res.status(400).json({
        error: `Quality level "${data.quality}" not found`
      });
    }
    
    // Find the condition factor
    const condition = factors.factors.condition.find(
      (c: any) => c.level === data.condition
    );
    
    if (!condition) {
      return res.status(400).json({
        error: `Condition level "${data.condition}" not found`
      });
    }
    
    // Calculate the age factor
    const currentYear = new Date().getFullYear();
    const buildingAge = currentYear - data.yearBuilt;
    
    let ageFactor = factors.factors.age[factors.factors.age.length - 1];  // Default to oldest range
    for (const af of factors.factors.age) {
      const range = af.range.split('-');
      const minAge = parseInt(range[0], 10);
      const maxAge = range[1] === '+' ? Infinity : parseInt(range[1], 10);
      
      if (buildingAge >= minAge && buildingAge <= maxAge) {
        ageFactor = af;
        break;
      }
    }
    
    // Find the complexity factor if provided
    let complexityFactor = { factor: 1.0 };
    if (data.complexity) {
      complexityFactor = factors.factors.complexity.find(
        (c: any) => c.level === data.complexity
      ) || { factor: 1.0 };
    }
    
    // Calculate the cost
    const baseCost = buildingType.baseCost * data.squareFeet;
    const adjustedCost = baseCost * 
      region.factor * 
      quality.factor * 
      condition.factor * 
      ageFactor.factor * 
      complexityFactor.factor;
    
    // Prepare the result
    const result = {
      estimatedCost: Math.round(adjustedCost * 100) / 100,
      squareFeet: data.squareFeet,
      perSquareFoot: Math.round((adjustedCost / data.squareFeet) * 100) / 100,
      factorVersion: factors.version,
      factors: {
        base: buildingType.baseCost,
        region: region.factor,
        quality: quality.factor,
        condition: condition.factor,
        age: ageFactor.factor,
        complexity: complexityFactor.factor
      },
      breakdown: {
        baseCost,
        regionAdjustment: baseCost * (region.factor - 1),
        qualityAdjustment: baseCost * region.factor * (quality.factor - 1),
        conditionAdjustment: baseCost * region.factor * quality.factor * (condition.factor - 1),
        ageAdjustment: baseCost * region.factor * quality.factor * condition.factor * (ageFactor.factor - 1),
        complexityAdjustment: baseCost * region.factor * quality.factor * condition.factor * ageFactor.factor * (complexityFactor.factor - 1)
      }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});

export default calculationRoutes;