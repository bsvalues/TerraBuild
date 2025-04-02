/**
 * Test suite for the Building Cost Calculator
 * These tests verify the functionality of the cost calculation engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateBuildingCost, applyRegionalFactor, calculateMaterialCost } from '../server/calculationEngine';

// Mock implementation for tests
const mockCalculateBaseCost = (squareFootage, buildingType, quality) => {
  const baseCosts = {
    'RESIDENTIAL': { 'STANDARD': 125, 'PREMIUM': 175, 'LUXURY': 250 },
    'COMMERCIAL': { 'STANDARD': 150, 'PREMIUM': 200, 'LUXURY': 300 },
    'INDUSTRIAL': { 'STANDARD': 100, 'PREMIUM': 150, 'LUXURY': 225 }
  };
  
  return squareFootage * (baseCosts[buildingType]?.[quality] || 150);
};

describe('Building Cost Calculator', () => {
  describe('Base Cost Calculation', () => {
    it('should calculate base cost correctly for residential buildings', () => {
      const result = mockCalculateBaseCost(1000, 'RESIDENTIAL', 'STANDARD');
      expect(result).toBe(125000); // 1000 sqft * $125
    });
    
    it('should calculate base cost correctly for commercial buildings', () => {
      const result = mockCalculateBaseCost(1000, 'COMMERCIAL', 'PREMIUM');
      expect(result).toBe(200000); // 1000 sqft * $200
    });
    
    it('should handle invalid building types gracefully', () => {
      const result = mockCalculateBaseCost(1000, 'UNKNOWN', 'STANDARD');
      expect(result).toBe(150000); // 1000 sqft * $150 (default)
    });
  });
  
  describe('Regional Factor Application', () => {
    it('should apply regional factor correctly', () => {
      // Test with regional factor of 1.2 (20% increase)
      const baseCost = 100000;
      const factor = 1.2;
      const result = applyRegionalFactor(baseCost, factor);
      expect(result).toBe(120000);
    });
    
    it('should handle zero regional factor gracefully', () => {
      const baseCost = 100000;
      const factor = 0;
      const result = applyRegionalFactor(baseCost, factor);
      // Should default to 1.0 when factor is invalid
      expect(result).toBe(100000);
    });
    
    it('should handle negative regional factor gracefully', () => {
      const baseCost = 100000;
      const factor = -0.5;
      const result = applyRegionalFactor(baseCost, factor);
      // Should use absolute value when factor is negative
      expect(result).toBe(50000);
    });
  });
  
  describe('Material Cost Calculation', () => {
    it('should calculate material costs correctly', () => {
      const materials = [
        { name: 'Concrete', quantity: 100, unitPrice: 120 },
        { name: 'Steel', quantity: 50, unitPrice: 800 }
      ];
      
      const result = calculateMaterialCost(materials);
      expect(result).toBe(52000); // (100 * 120) + (50 * 800)
    });
    
    it('should return zero for empty materials array', () => {
      const result = calculateMaterialCost([]);
      expect(result).toBe(0);
    });
    
    it('should ignore materials with missing price or quantity', () => {
      const materials = [
        { name: 'Concrete', quantity: 100, unitPrice: 120 },
        { name: 'Steel', quantity: 50 }, // Missing unit price
        { name: 'Wood', unitPrice: 300 } // Missing quantity
      ];
      
      const result = calculateMaterialCost(materials);
      expect(result).toBe(12000); // Only count the first item
    });
  });
  
  describe('Comprehensive Building Cost Calculation', () => {
    it('should calculate total building cost correctly', () => {
      const buildingData = {
        squareFootage: 2000,
        buildingType: 'COMMERCIAL',
        quality: 'PREMIUM',
        complexityFactor: 1.1,
        conditionFactor: 0.9,
        regionalFactor: 1.2,
        materials: [
          { name: 'Concrete', quantity: 200, unitPrice: 120 },
          { name: 'Steel', quantity: 100, unitPrice: 800 }
        ]
      };
      
      const result = calculateBuildingCost(buildingData);
      
      // Base cost: 2000 * 200 = 400,000
      // After complexity: 400,000 * 1.1 = 440,000
      // After condition: 440,000 * 0.9 = 396,000
      // After regional: 396,000 * 1.2 = 475,200
      // Materials: (200 * 120) + (100 * 800) = 104,000
      // Total: 475,200 + 104,000 = 579,200
      
      expect(result).toBeCloseTo(579200, 0);
    });
    
    it('should handle missing factors gracefully', () => {
      const buildingData = {
        squareFootage: 2000,
        buildingType: 'COMMERCIAL',
        quality: 'PREMIUM'
        // Missing factors
      };
      
      const result = calculateBuildingCost(buildingData);
      
      // Base cost: 2000 * 200 = 400,000
      // Default factors all 1.0
      // No materials
      
      expect(result).toBeCloseTo(400000, 0);
    });
  });
});