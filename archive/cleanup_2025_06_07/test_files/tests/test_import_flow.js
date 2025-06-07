/**
 * Tests for Cost Matrix Import Flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../server/storage';
import fs from 'fs';
import path from 'path';

describe('Cost Matrix Import Flow Tests', () => {
  let storage;
  
  // Setup fresh storage instance before each test
  beforeEach(() => {
    storage = new MemStorage();
  });
  
  // Test import validation
  it('should validate data structure before import', async () => {
    // Sample valid import data
    const validData = [
      {
        region: 'West Richland',
        buildingType: 'SFR',
        buildingTypeDescription: 'Single Family Residence',
        baseCost: '150.00',
        matrixYear: 2025,
        sourceMatrixId: 1,
        matrixDescription: 'SFR - West Richland - 2025',
        dataPoints: 100,
        complexityFactorBase: '1.20',
        qualityFactorBase: '1.10',
        conditionFactorBase: '1.00'
      }
    ];
    
    // Sample invalid import data (missing required fields)
    const invalidData = [
      {
        region: 'West Richland',
        // missing buildingType
        buildingTypeDescription: 'Single Family Residence',
        baseCost: '150.00',
        matrixYear: 2025
      }
    ];
    
    // Test valid data
    const validResult = await storage.importCostMatrixFromJson(validData);
    expect(validResult.imported).toBe(1);
    expect(validResult.errors.length).toBe(0);
    
    // Test invalid data
    const invalidResult = await storage.importCostMatrixFromJson(invalidData);
    expect(invalidResult.imported).toBe(0);
    expect(invalidResult.errors.length).toBe(1);
  });
  
  // Test handling of duplicate entries
  it('should handle duplicate entries correctly', async () => {
    // First import
    const firstImport = [
      {
        region: 'West Richland',
        buildingType: 'SFR',
        buildingTypeDescription: 'Single Family Residence',
        baseCost: '150.00',
        matrixYear: 2025,
        sourceMatrixId: 1,
        matrixDescription: 'SFR - West Richland - 2025',
        dataPoints: 100,
        complexityFactorBase: '1.20',
        qualityFactorBase: '1.10',
        conditionFactorBase: '1.00'
      }
    ];
    
    // Second import with same region/buildingType/year but different values
    const secondImport = [
      {
        region: 'West Richland',
        buildingType: 'SFR',
        buildingTypeDescription: 'Single Family Residence',
        baseCost: '155.00', // changed base cost
        matrixYear: 2025,
        sourceMatrixId: 1,
        matrixDescription: 'SFR - West Richland - 2025 - Updated',
        dataPoints: 120, // increased data points
        complexityFactorBase: '1.25', // changed complexity factor
        qualityFactorBase: '1.10',
        conditionFactorBase: '1.00'
      }
    ];
    
    // First import should succeed
    const firstResult = await storage.importCostMatrixFromJson(firstImport);
    expect(firstResult.imported).toBe(1);
    
    // Second import should update existing entry
    const secondResult = await storage.importCostMatrixFromJson(secondImport);
    expect(secondResult.imported).toBe(0); // Nothing new imported
    
    // Verify the entry was updated
    const matrixEntries = await storage.getAllCostMatrix();
    expect(matrixEntries.length).toBe(1); // Still only one entry
    expect(matrixEntries[0].baseCost).toBe('155.00'); // Updated value
    expect(matrixEntries[0].dataPoints).toBe(120); // Updated value
    expect(matrixEntries[0].complexityFactorBase).toBe('1.25'); // Updated value
    expect(matrixEntries[0].matrixDescription).toBe('SFR - West Richland - 2025 - Updated'); // Updated value
  });
  
  // Test importing large datasets
  it('should handle large datasets efficiently', async () => {
    // Generate large test dataset
    const largeDataset = [];
    for (let i = 0; i < 100; i++) {
      largeDataset.push({
        region: `Region ${i % 10}`,
        buildingType: `Type ${i % 5}`,
        buildingTypeDescription: `Building Type ${i % 5}`,
        baseCost: `${100 + i}.00`,
        matrixYear: 2025,
        sourceMatrixId: i,
        matrixDescription: `Type ${i % 5} - Region ${i % 10} - 2025`,
        dataPoints: 50 + i,
        complexityFactorBase: '1.20',
        qualityFactorBase: '1.10',
        conditionFactorBase: '1.00'
      });
    }
    
    // Import the large dataset
    const result = await storage.importCostMatrixFromJson(largeDataset);
    
    // Verify import results
    expect(result.imported).toBe(100);
    expect(result.errors.length).toBe(0);
    
    // Verify data was imported correctly
    const matrixEntries = await storage.getAllCostMatrix();
    expect(matrixEntries.length).toBe(100);
    
    // Check that the correct number of unique regions exist
    const regions = await storage.getCostMatrixRegions();
    expect(regions.length).toBe(10); // 10 unique regions
    
    // Check that the correct number of unique building types exist
    const buildingTypes = await storage.getCostMatrixBuildingTypes();
    expect(buildingTypes.length).toBe(5); // 5 unique building types
  });
  
  // Test error reporting during import
  it('should provide accurate error reporting during import', async () => {
    // Dataset with mixed valid and invalid entries
    const mixedDataset = [
      // Valid entry
      {
        region: 'West Richland',
        buildingType: 'SFR',
        buildingTypeDescription: 'Single Family Residence',
        baseCost: '150.00',
        matrixYear: 2025,
        sourceMatrixId: 1,
        matrixDescription: 'SFR - West Richland - 2025',
        dataPoints: 100,
        complexityFactorBase: '1.20',
        qualityFactorBase: '1.10',
        conditionFactorBase: '1.00'
      },
      // Invalid entry - missing buildingType
      {
        region: 'Kennewick',
        // buildingType missing
        buildingTypeDescription: 'Multi-Family Residence',
        baseCost: '145.00',
        matrixYear: 2025,
        sourceMatrixId: 2,
        matrixDescription: 'MFR - Kennewick - 2025',
        dataPoints: 90,
        complexityFactorBase: '1.15',
        qualityFactorBase: '1.05',
        conditionFactorBase: '1.00'
      },
      // Invalid entry - invalid base cost
      {
        region: 'Richland',
        buildingType: 'COM',
        buildingTypeDescription: 'Commercial',
        baseCost: 'not-a-number', // Invalid base cost
        matrixYear: 2025,
        sourceMatrixId: 3,
        matrixDescription: 'COM - Richland - 2025',
        dataPoints: 80,
        complexityFactorBase: '1.25',
        qualityFactorBase: '1.15',
        conditionFactorBase: '1.00'
      }
    ];
    
    // Import the mixed dataset
    const result = await storage.importCostMatrixFromJson(mixedDataset);
    
    // Verify import results
    expect(result.imported).toBe(1); // Only 1 valid entry
    expect(result.errors.length).toBe(2); // 2 invalid entries
    
    // Check that error messages are descriptive
    expect(result.errors[0]).toContain('Kennewick');
    expect(result.errors[0]).toContain('buildingType');
    
    expect(result.errors[1]).toContain('Richland');
    expect(result.errors[1]).toContain('baseCost');
    
    // Verify only valid data was imported
    const matrixEntries = await storage.getAllCostMatrix();
    expect(matrixEntries.length).toBe(1);
    expect(matrixEntries[0].region).toBe('West Richland');
    expect(matrixEntries[0].buildingType).toBe('SFR');
  });
});