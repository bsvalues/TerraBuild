/**
 * Tests for Cost Matrix schema validation
 */

import { describe, it, expect } from 'vitest';
import { 
  costMatrixSchema, 
  insertCostMatrixSchema 
} from '../shared/schema';

describe('Cost Matrix Schema Tests', () => {
  // Test valid cost matrix data
  it('should accept valid cost matrix data', () => {
    const validCostMatrix = {
      region: 'West Richland',
      buildingType: 'SFR',
      buildingTypeDescription: 'Single Family Residence',
      baseCost: '150.00',
      matrixYear: 2025,
      sourceMatrixId: 1234,
      matrixDescription: 'SFR - West Richland - 2025',
      dataPoints: 100,
      minCost: '120.00',
      maxCost: '180.00',
      complexityFactorBase: '1.00',
      qualityFactorBase: '1.00',
      conditionFactorBase: '1.00',
      isActive: true
    };
    
    const result = insertCostMatrixSchema.safeParse(validCostMatrix);
    expect(result.success).toBe(true);
  });
  
  // Test invalid cost matrix data
  it('should reject cost matrix data with missing required fields', () => {
    const invalidCostMatrix = {
      region: 'West Richland',
      // missing buildingType
      buildingTypeDescription: 'Single Family Residence',
      baseCost: '150.00',
      matrixYear: 2025
      // missing other required fields
    };
    
    const result = insertCostMatrixSchema.safeParse(invalidCostMatrix);
    expect(result.success).toBe(false);
  });
  
  // Test invalid field types
  it('should reject cost matrix data with invalid field types', () => {
    const invalidCostMatrix = {
      region: 'West Richland',
      buildingType: 'SFR',
      buildingTypeDescription: 'Single Family Residence',
      baseCost: 'not-a-number', // should be numeric string
      matrixYear: '2025', // should be number
      sourceMatrixId: 1234,
      matrixDescription: 'SFR - West Richland - 2025',
      dataPoints: 100,
      minCost: '120.00',
      maxCost: '180.00',
      complexityFactorBase: '1.00',
      qualityFactorBase: '1.00',
      conditionFactorBase: '1.00',
      isActive: true
    };
    
    const result = insertCostMatrixSchema.safeParse(invalidCostMatrix);
    expect(result.success).toBe(false);
  });
  
  // Test numeric constraints
  it('should reject cost matrix data with invalid numeric constraints', () => {
    const invalidCostMatrix = {
      region: 'West Richland',
      buildingType: 'SFR',
      buildingTypeDescription: 'Single Family Residence',
      baseCost: '-150.00', // should be positive
      matrixYear: 1900, // too far in the past
      sourceMatrixId: 1234,
      matrixDescription: 'SFR - West Richland - 2025',
      dataPoints: -10, // should be positive
      minCost: '200.00', // min > max error
      maxCost: '180.00',
      complexityFactorBase: '0.00', // should be positive
      qualityFactorBase: '1.00',
      conditionFactorBase: '1.00',
      isActive: true
    };
    
    const result = insertCostMatrixSchema.safeParse(invalidCostMatrix);
    expect(result.success).toBe(false);
  });
});