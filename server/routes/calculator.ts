import express from 'express';
import { z } from 'zod';
import { storage } from '../storage-factory';

const router = express.Router();

// Schema for building cost calculation request
const calculationSchema = z.object({
  region: z.string(),
  buildingType: z.string(),
  squareFootage: z.number().positive(),
  complexityFactor: z.number().min(0.5).max(3.0),
  conditionFactor: z.number().min(0.6).max(1.1),
  yearBuilt: z.number().min(1900).max(new Date().getFullYear()),
  condition: z.string().optional(),
  stories: z.number().min(1).optional(),
  qualityGrade: z.string().optional(),
  occupancyType: z.string().optional()
});

// Handler for building cost calculation
router.post('/building-cost/calculate', async (req, res) => {
  try {
    // Validate request data
    const data = calculationSchema.parse(req.body);
    
    // Find base cost for this building type in this region
    const matrices = await storage.getCostMatrices({
      buildingType: data.buildingType,
      region: data.region
    });
    
    if (!matrices || matrices.length === 0) {
      return res.status(404).json({
        message: `No cost matrix found for building type '${data.buildingType}' in region '${data.region}'`
      });
    }
    
    // Use the most recent matrix (or the one for the current year)
    const currentYear = new Date().getFullYear();
    const matrix = matrices.reduce((latest, current) => {
      // If we have a matrix for current year, prefer it
      if (current.matrix_year === currentYear) return current;
      // Otherwise, get the most recent one
      return (!latest || current.matrix_year > latest.matrix_year) ? current : latest;
    }, null);
    
    if (!matrix) {
      return res.status(404).json({
        message: `No valid cost matrix found for building type '${data.buildingType}' in region '${data.region}'`
      });
    }
    
    // Calculate age factor based on year built
    const age = currentYear - data.yearBuilt;
    let ageFactor = 1.0;
    if (age > 0) {
      // Simple age factor calculation (decreases by 0.5% per year up to a maximum of 30%)
      ageFactor = Math.max(0.7, 1 - (age * 0.005));
    }
    
    // Calculate base cost
    const baseRate = matrix.base_cost;
    const totalSquareFeet = data.squareFootage;
    
    // Apply all factors to calculate total cost
    const calculatedValue = baseRate * totalSquareFeet * data.complexityFactor * data.conditionFactor * ageFactor;
    
    // If user is authenticated, save the calculation
    let savedCalculation = null;
    if (req.user && req.user.id) {
      try {
        // Save calculation to database if user is logged in
        savedCalculation = await storage.createCalculation({
          property_id: null, // Not associated with a specific property
          improvement_id: null, // Not associated with a specific improvement
          matrix_id: matrix.id,
          base_cost: baseRate,
          quality_factor: data.complexityFactor,
          condition_factor: data.conditionFactor,
          age_factor: ageFactor,
          region_factor: 1.0, // Default region factor
          calculated_value: calculatedValue
        });
      } catch (error) {
        console.error("Failed to save calculation:", error);
        // Continue without saving - don't fail the whole request
      }
    }
    
    // Return calculation result
    return res.status(200).json({
      buildingType: data.buildingType,
      region: data.region,
      squareFootage: data.squareFootage,
      baseRate,
      complexityFactor: data.complexityFactor,
      conditionFactor: data.conditionFactor,
      ageFactor,
      totalCost: calculatedValue,
      costPerSquareFoot: calculatedValue / totalSquareFeet,
      matrixYear: matrix.matrix_year,
      calculationId: savedCalculation?.id || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Calculation error:", error);
    if (error.errors) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.errors
      });
    }
    return res.status(500).json({
      message: "Failed to calculate building cost",
      error: error.message
    });
  }
});

// Handler for saving calculation to history
router.post('/calculation-history', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "You must be logged in to save calculations"
      });
    }
    
    // Save calculation to database
    const calculation = await storage.createCalculation({
      ...req.body,
      property_id: req.body.propertyId || null,
      improvement_id: req.body.improvementId || null,
      matrix_id: req.body.matrixId || null
    });
    
    return res.status(201).json(calculation);
  } catch (error) {
    console.error("Failed to save calculation:", error);
    return res.status(500).json({
      message: "Failed to save calculation to history",
      error: error.message
    });
  }
});

// Handler for getting calculation history
router.get('/calculation-history', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        message: "You must be logged in to view calculation history"
      });
    }
    
    // Get calculations for this user
    const calculations = await storage.getCalculations();
    
    return res.status(200).json(calculations);
  } catch (error) {
    console.error("Failed to get calculation history:", error);
    return res.status(500).json({
      message: "Failed to retrieve calculation history",
      error: error.message
    });
  }
});

export default router;