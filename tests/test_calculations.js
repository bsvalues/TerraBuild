/**
 * Tests for Building Cost Calculation Logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../server/storage';

describe('Building Cost Calculation Tests', () => {
  let storage;
  
  // Setup fresh storage instance before each test
  beforeEach(() => {
    storage = new MemStorage();
    
    // Add sample cost matrix entries
    const costMatrix = {
      id: 1,
      region: 'West Richland',
      buildingType: 'SFR',
      buildingTypeDescription: 'Single Family Residence',
      baseCost: '150.00',
      matrixYear: 2025,
      sourceMatrixId: 1,
      matrixDescription: 'SFR - West Richland - 2025',
      dataPoints: 100,
      minCost: '120.00',
      maxCost: '180.00',
      complexityFactorBase: '1.20',
      qualityFactorBase: '1.10',
      conditionFactorBase: '1.00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    storage.costMatrixEntries.set(costMatrix.id, costMatrix);
    
    // Add sample material types
    const materialTypes = [
      {
        id: 1,
        code: 'FDN',
        name: 'Foundation',
        description: 'Building foundation',
        unit: 'sqft',
        createdAt: new Date()
      },
      {
        id: 2,
        code: 'FRM',
        name: 'Framing',
        description: 'Structural framing',
        unit: 'sqft',
        createdAt: new Date()
      },
      {
        id: 3,
        code: 'EXT',
        name: 'Exterior',
        description: 'Exterior finishes',
        unit: 'sqft',
        createdAt: new Date()
      }
    ];
    
    materialTypes.forEach(material => {
      storage.materialTypes.set(material.id, material);
    });
    
    // Add sample material costs
    const materialCosts = [
      {
        id: 1,
        materialTypeId: 1, // Foundation
        buildingType: 'SFR',
        region: 'West Richland',
        costPerUnit: '20.00',
        percentage: '15.00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        materialTypeId: 2, // Framing
        buildingType: 'SFR',
        region: 'West Richland',
        costPerUnit: '35.00',
        percentage: '25.00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        materialTypeId: 3, // Exterior
        buildingType: 'SFR',
        region: 'West Richland',
        costPerUnit: '30.00',
        percentage: '20.00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    materialCosts.forEach(cost => {
      storage.materialCosts.set(cost.id, cost);
    });
  });
  
  // Test basic cost calculation
  it('should calculate basic cost with minimum parameters', async () => {
    const result = await storage.calculateMaterialsBreakdown(
      'West Richland',
      'SFR',
      2000 // square footage
    );
    
    expect(result).toBeDefined();
    expect(result.totalCost).toBeDefined();
    expect(result.costPerSqft).toBe('150.00');
    expect(result.totalCost).toBe('300000.00'); // 2000 sqft * $150/sqft
    expect(result.materials).toBeInstanceOf(Array);
    expect(result.materials.length).toBeGreaterThan(0);
  });
  
  // Test cost calculation with complexity factor
  it('should calculate cost with complexity factor correctly', async () => {
    const result = await storage.calculateMaterialsBreakdown(
      'West Richland',
      'SFR',
      2000, // square footage
      1.5 // complexity multiplier (1.5 * base factor 1.2 = 1.8 total)
    );
    
    expect(result).toBeDefined();
    expect(result.totalCost).toBeDefined();
    // Base cost * complexity factor
    // $150/sqft * 1.8 complexity factor = $270/sqft
    expect(parseFloat(result.costPerSqft)).toBeCloseTo(270.00);
    // 2000 sqft * $270/sqft = $540,000
    expect(parseFloat(result.totalCost)).toBeCloseTo(540000.00);
  });
  
  // Test material breakdown calculation
  it('should calculate material breakdown correctly', async () => {
    const result = await storage.calculateMaterialsBreakdown(
      'West Richland',
      'SFR',
      2000 // square footage
    );
    
    expect(result).toBeDefined();
    expect(result.materials).toBeInstanceOf(Array);
    
    // Check that percentages add up correctly
    const totalPercentage = result.materials.reduce((sum, material) => {
      return sum + parseFloat(material.percentage);
    }, 0);
    
    // The total percentage might not be exactly 100.00 due to rounding
    // but should be close
    expect(totalPercentage).toBeCloseTo(60.00); // Our sample data adds up to 60%
    
    // Check individual materials
    const foundation = result.materials.find(m => m.code === 'FDN');
    expect(foundation).toBeDefined();
    expect(foundation.percentage).toBe('15.00');
    expect(parseFloat(foundation.cost)).toBeCloseTo(45000.00); // 15% of $300,000
    
    const framing = result.materials.find(m => m.code === 'FRM');
    expect(framing).toBeDefined();
    expect(framing.percentage).toBe('25.00');
    expect(parseFloat(framing.cost)).toBeCloseTo(75000.00); // 25% of $300,000
  });
  
  // Test edge case with large square footage
  it('should handle large square footage values correctly', async () => {
    const result = await storage.calculateMaterialsBreakdown(
      'West Richland',
      'SFR',
      100000 // very large square footage
    );
    
    expect(result).toBeDefined();
    expect(result.totalCost).toBeDefined();
    expect(result.costPerSqft).toBe('150.00');
    expect(result.totalCost).toBe('15000000.00'); // 100000 sqft * $150/sqft
  });
  
  // Test edge case with small square footage
  it('should handle small square footage values correctly', async () => {
    const result = await storage.calculateMaterialsBreakdown(
      'West Richland',
      'SFR',
      10 // very small square footage
    );
    
    expect(result).toBeDefined();
    expect(result.totalCost).toBeDefined();
    expect(result.costPerSqft).toBe('150.00');
    expect(result.totalCost).toBe('1500.00'); // 10 sqft * $150/sqft
  });
});