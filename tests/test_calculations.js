/**
 * Tests for Building Cost Calculation Engine
 * 
 * This file contains tests for the core calculation functionality
 * of the Benton County Building Cost Building System (BCBS).
 */

const { db } = require('../server/db');
const { calculateBuildingCost, applyComplexityFactor, applyConditionFactor, applyRegionalFactor } = require('../server/calculationEngine');

describe('Building Cost Calculation Engine', () => {
  // Test basic cost calculation accuracy
  test('should calculate correct base cost for standard building', async () => {
    // Mock cost matrix data
    const mockMatrix = {
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      baseCost: '100.00',  // $100 per sqft
      matrixYear: 2025
    };
    
    // Spy on db.query to return our mock data
    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [mockMatrix]
    });
    
    const result = await calculateBuildingCost({
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      squareFootage: 2000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    expect(result.baseCost).toBe(200000); // 2000 sqft * $100/sqft
    expect(result.totalCost).toBe(200000); // No adjustment factors applied
  });

  // Test complex factor adjustment
  test('should apply complexity factor correctly', async () => {
    const baseValue = 200000;
    const complexityFactor = 1.5;
    
    const result = applyComplexityFactor(baseValue, complexityFactor);
    
    expect(result).toBe(300000); // 200000 * 1.5
  });

  // Test condition factor adjustment
  test('should apply condition factor correctly', async () => {
    const baseValue = 200000;
    const conditionFactor = 0.8; // Poor condition
    
    const result = applyConditionFactor(baseValue, conditionFactor);
    
    expect(result).toBe(160000); // 200000 * 0.8
  });

  // Test region adjustment
  test('should apply regional cost variations correctly', async () => {
    // Mock cost data
    const urbanCost = {
      region: 'Urban',
      buildingType: 'COMMERCIAL',
      baseCost: '180.00',  // $180 per sqft
      matrixYear: 2025
    };
    
    const ruralCost = {
      region: 'Rural',
      buildingType: 'COMMERCIAL',
      baseCost: '150.00',  // $150 per sqft
      matrixYear: 2025
    };
    
    // Spy on db.query to return our mock data
    const dbSpy = jest.spyOn(db, 'query');
    dbSpy.mockResolvedValueOnce({ rows: [urbanCost] })
         .mockResolvedValueOnce({ rows: [ruralCost] });
    
    const urbanResult = await calculateBuildingCost({
      region: 'Urban',
      buildingType: 'COMMERCIAL',
      squareFootage: 5000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    const ruralResult = await calculateBuildingCost({
      region: 'Rural',
      buildingType: 'COMMERCIAL',
      squareFootage: 5000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    // Assuming urban costs more than rural
    expect(urbanResult.totalCost).toBeGreaterThan(ruralResult.totalCost);
    expect(urbanResult.baseCost).toBe(900000); // 5000 sqft * $180/sqft
    expect(ruralResult.baseCost).toBe(750000); // 5000 sqft * $150/sqft
  });

  // Test regional factor function
  test('should calculate regional factor correctly', () => {
    const baseValue = 100000;
    const result1 = applyRegionalFactor(baseValue, 'Urban');
    const result2 = applyRegionalFactor(baseValue, 'Rural');
    
    // Urban typically has higher costs
    expect(result1).toBeGreaterThan(baseValue);
    // Rural typically has lower costs
    expect(result2).toBeLessThan(baseValue);
  });

  // Test depreciation by age
  test('should apply depreciation based on building age', async () => {
    // Mock cost matrix data
    const mockMatrix = {
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      baseCost: '100.00',  // $100 per sqft
      matrixYear: 2025
    };
    
    // Spy on db.query to return our mock data
    jest.spyOn(db, 'query').mockResolvedValue({
      rows: [mockMatrix]
    });
    
    const newBuildingResult = await calculateBuildingCost({
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      squareFootage: 2000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    const olderBuildingResult = await calculateBuildingCost({
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      squareFootage: 2000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2000
    });
    
    // Older building should have lower value due to depreciation
    expect(olderBuildingResult.totalCost).toBeLessThan(newBuildingResult.totalCost);
    expect(olderBuildingResult.depreciationRate).toBeGreaterThan(0);
  });

  // Test edge cases
  test('should handle zero square footage gracefully', async () => {
    const result = await calculateBuildingCost({
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      squareFootage: 0,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    expect(result.totalCost).toBe(0);
    expect(result.error).toBeDefined();
  });

  test('should handle missing building type gracefully', async () => {
    const result = await calculateBuildingCost({
      region: 'Benton',
      buildingType: '',
      squareFootage: 2000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    expect(result.error).toBeDefined();
  });

  test('should handle missing region gracefully', async () => {
    const result = await calculateBuildingCost({
      region: '',
      buildingType: 'RESIDENTIAL',
      squareFootage: 2000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    expect(result.error).toBeDefined();
  });

  // Test negative complexity factor
  test('should handle negative complexity factor gracefully', async () => {
    const result = await calculateBuildingCost({
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      squareFootage: 2000,
      complexityFactor: -0.5,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    expect(result.error).toBeDefined();
  });

  // Test region-specific building type costs
  test('should use the correct matrix for region and building type', async () => {
    // Mock different costs for the same building type in different regions
    const bentonResidential = {
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      baseCost: '100.00',
      matrixYear: 2025
    };
    
    const franklinResidential = {
      region: 'Franklin',
      buildingType: 'RESIDENTIAL',
      baseCost: '110.00',
      matrixYear: 2025
    };
    
    // Spy on db.query to return our mock data
    const dbSpy = jest.spyOn(db, 'query');
    dbSpy.mockResolvedValueOnce({ rows: [bentonResidential] })
         .mockResolvedValueOnce({ rows: [franklinResidential] });
    
    const bentonResult = await calculateBuildingCost({
      region: 'Benton',
      buildingType: 'RESIDENTIAL',
      squareFootage: 1000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    const franklinResult = await calculateBuildingCost({
      region: 'Franklin',
      buildingType: 'RESIDENTIAL',
      squareFootage: 1000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: 2023
    });
    
    expect(bentonResult.baseCost).toBe(100000); // 1000 sqft * $100/sqft
    expect(franklinResult.baseCost).toBe(110000); // 1000 sqft * $110/sqft
  });
});