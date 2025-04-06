/**
 * Cost Calculation Routes
 * 
 * This module provides routes for calculating building costs with better error handling.
 */

import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { calculateBuildingCost } from "../calculationEngine";
import { 
  handleValidationError, 
  handleCalculationError,
  handleNotFoundError,
  ErrorCode,
  sendErrorResponse
} from "../utils/errorHandler";

/**
 * Calculate material costs based on total cost and building type
 * @param totalCost - The total building cost
 * @param buildingType - The type of building
 * @returns Object with material cost breakdown
 */
function calculateMaterialCosts(totalCost: number, buildingType: string) {
  // Define keys for type safety
  type MaterialKey = 'foundations' | 'framing' | 'exterior' | 'roofing' | 'interior' | 
                    'electrical' | 'plumbing' | 'hvac' | 'finishes';
  
  // Default material breakdown percentages
  const defaultBreakdown: Record<MaterialKey, number> = {
    "foundations": 0.10,
    "framing": 0.15,
    "exterior": 0.12,
    "roofing": 0.08,
    "interior": 0.20,
    "electrical": 0.10,
    "plumbing": 0.10,
    "hvac": 0.08,
    "finishes": 0.07
  };
  
  // Specific adjustments based on building type
  const adjustments: Record<string, Partial<Record<MaterialKey, number>>> = {
    "RESIDENTIAL": {
      "interior": 0.22,
      "finishes": 0.09
    },
    "COMMERCIAL": {
      "electrical": 0.12,
      "hvac": 0.10,
      "interior": 0.17
    },
    "INDUSTRIAL": {
      "foundations": 0.15,
      "interior": 0.15,
      "electrical": 0.12
    },
    "OFFICE": {
      "electrical": 0.12,
      "hvac": 0.10,
      "finishes": 0.09
    }
  };
  
  // Apply adjustments based on building type
  const breakdown = { ...defaultBreakdown };
  if (buildingType && adjustments[buildingType]) {
    Object.entries(adjustments[buildingType]).forEach(([key, value]) => {
      const materialKey = key as MaterialKey;
      if (breakdown[materialKey] !== undefined && value !== undefined) {
        breakdown[materialKey] = value;
      }
    });
  }
  
  // Calculate costs
  const result: Record<string, number> = {};
  let totalPercentage = 0;
  
  Object.entries(breakdown).forEach(([key, percentage]) => {
    totalPercentage += percentage;
    result[key] = Math.round(totalCost * percentage);
  });
  
  // Ensure our percentages sum to 100%
  if (Math.abs(totalPercentage - 1.0) > 0.01) {
    // Normalize if needed
    const normalizationFactor = 1.0 / totalPercentage;
    Object.keys(result).forEach(key => {
      result[key] = Math.round(result[key] * normalizationFactor);
    });
  }
  
  return result;
}

const router = Router();

/**
 * Basic cost calculation
 * Calculates building cost based on region, building type, and square footage
 */
router.post("/calculate", async (req: Request, res: Response) => {
  try {
    const { region, buildingType, squareFootage, complexityMultiplier = 1 } = req.body;
    
    // Input validation
    if (!region || !buildingType || !squareFootage) {
      return sendErrorResponse(
        res, 
        400, 
        "Missing required parameters: region, buildingType, squareFootage",
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    // Get the cost factor for the region and building type
    const costFactor = await storage.getCostFactorsByRegionAndType(region, buildingType);
    
    if (!costFactor) {
      return handleNotFoundError(
        res, 
        "Cost Factor", 
        `${region}/${buildingType}`
      );
    }
    
    // Calculate the cost
    const baseCost = costFactor.baseCost;
    const regionFactor = costFactor.regionFactor;
    const complexityFactorValue = Number(costFactor.complexityFactor);
    const complexityMultiplierValue = Number(complexityMultiplier);
    const calculatedComplexityFactor = complexityFactorValue * complexityMultiplierValue;
    
    // Apply factors to calculate cost per square foot
    const costPerSqft = Number(baseCost) * Number(regionFactor) * calculatedComplexityFactor;
    
    // Calculate total cost
    const totalCost = costPerSqft * Number(squareFootage);
    
    // Log the activity if user is authenticated
    if (req.user?.id) {
      await storage.createActivity({
        action: `Calculated cost for ${squareFootage} sqft ${buildingType} in ${region}`,
        icon: "ri-calculator-line",
        iconColor: "primary"
      });
    }
    
    // Return the result
    res.status(200).json({
      region,
      buildingType,
      squareFootage: Number(squareFootage),
      baseCost: costFactor.baseCost.toString(),
      regionFactor: costFactor.regionFactor.toString(),
      complexityFactor: calculatedComplexityFactor,
      costPerSqft,
      totalCost: Math.round(totalCost)
    });
  } catch (error) {
    handleCalculationError(res, error);
  }
});

/**
 * Calculate materials breakdown
 * Provides a detailed materials breakdown for building costs
 */
router.post("/calculate-materials", async (req: Request, res: Response) => {
  try {
    const { region, buildingType, squareFootage, complexityMultiplier = 1 } = req.body;
    
    // Input validation
    if (!region || !buildingType || !squareFootage) {
      return sendErrorResponse(
        res, 
        400, 
        "Missing required parameters: region, buildingType, squareFootage",
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    try {
      const materialsBreakdown = await storage.calculateMaterialsBreakdown(
        region, 
        buildingType, 
        Number(squareFootage), 
        Number(complexityMultiplier)
      );
      
      // Log activity
      if (req.user?.id) {
        await storage.createActivity({
          action: `Calculated materials breakdown for ${buildingType} in ${region}`,
          icon: "ri-stack-line",
          iconColor: "primary"
        });
      }
      
      // If user is authenticated, save to calculation history
      if (req.user?.id) {
        const userId = req.user.id;
        // Create calculation history with fields matching the database schema
        const calculationData = {
          userId,
          name: `${buildingType} Building in ${region}`,
          region,
          buildingType,
          squareFootage: Number(squareFootage),
          baseCost: materialsBreakdown.baseCost.toString(),
          regionFactor: materialsBreakdown.regionFactor.toString(),
          complexity: "Standard", // Required field in the DB
          complexityFactor: materialsBreakdown.complexityFactor.toString(),
          costPerSqft: materialsBreakdown.costPerSqft.toString(),
          totalCost: materialsBreakdown.totalCost.toString(),
          adjustedCost: materialsBreakdown.totalCost.toString() // Required field in the DB
        };
        
        await storage.createCalculationHistory(calculationData);
      }
      
      res.status(200).json(materialsBreakdown);
    } catch (error) {
      handleCalculationError(res, error);
    }
  } catch (error) {
    handleCalculationError(res, error);
  }
});

/**
 * Calculate detailed building cost
 * Calculates building cost with advanced factors and options
 */
router.post("/building-cost/calculate", async (req: Request, res: Response) => {
  try {
    // Validate input data
    const { 
      region, 
      buildingType, 
      squareFootage, 
      complexityFactor = 1.0, 
      conditionFactor = 1.0, 
      yearBuilt = new Date().getFullYear(),
      quality = "STANDARD",
      condition,
      stories,
      qualityGrade,
      occupancyType
    } = req.body;
    
    if (!region || !buildingType || !squareFootage || squareFootage <= 0) {
      return sendErrorResponse(
        res, 
        400, 
        "Invalid input. Region, building type, and square footage are required.",
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    if (complexityFactor < 0.5 || complexityFactor > 3.0) {
      return sendErrorResponse(
        res, 
        400, 
        "Complexity factor must be between 0.5 and 3.0",
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    if (conditionFactor < 0.6 || conditionFactor > 1.1) {
      return sendErrorResponse(
        res, 
        400, 
        "Condition factor must be between 0.6 and 1.1",
        ErrorCode.VALIDATION_ERROR
      );
    }
    
    // Calculate building cost (using the properties that match the BuildingCostOptions interface)
    const calculationResult = await calculateBuildingCost({
      region,
      buildingType,
      squareFootage: Number(squareFootage),
      complexityFactor: Number(complexityFactor),
      conditionFactor: Number(conditionFactor),
      yearBuilt: Number(yearBuilt),
      quality
    });
    
    // Calculate material costs
    const materialCosts = calculateMaterialCosts(Number(calculationResult.totalCost), buildingType);
    
    // Create response object with all needed fields
    const response = {
      ...calculationResult,
      region,
      buildingType,
      squareFootage: Number(squareFootage),
      complexityFactor: Number(complexityFactor),
      conditionFactor: Number(conditionFactor),
      materialCosts
    };
    
    // Log the activity
    if (req.user?.id) {
      await storage.createActivity({
        action: `Calculated detailed building cost for ${squareFootage} sqft ${buildingType} in ${region}`,
        icon: "ri-building-2-line",
        iconColor: "success"
      });
    }
    if (req.user?.id) {
      // Calculate cost per square foot based on total cost and square footage
      const costPerSqft = Number(calculationResult.totalCost) / Number(squareFootage);
      
      await storage.createCalculationHistory({
        userId: req.user.id,
        name: `${buildingType} Building in ${region}`,
        region,
        buildingType,
        squareFootage: Number(squareFootage),
        baseCost: calculationResult.baseCost.toString(),
        complexity: "Standard", // Required field in the DB
        complexityFactor: String(complexityFactor),
        totalCost: calculationResult.totalCost.toString(),
        adjustedCost: calculationResult.adjustedCost.toString(),
        costPerSqft: costPerSqft.toString(), // Add the required field
        regionFactor: "1.0" // Add default value for the required field
      });
    }
    
    res.status(200).json(response);
  } catch (error) {
    handleCalculationError(res, error);
  }
});

export default router;