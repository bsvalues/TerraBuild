// Unit tests for cost calculation functionality
const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals');
const { calculateBuildingCost } = require('../../server/services/cost-calculation');
const { pool } = require('../../server/db');

// Mock the database
jest.mock('../../server/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Cost Calculation Service', () => {
  // Clean up mocks after each test
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('calculateBuildingCost', () => {
    // Mock data for testing
    const mockCostMatrix = [
      {
        id: 1,
        building_type: 'residential',
        region: 'center',
        quality: 'standard',
        base_cost: 150.0,
        year: 2025
      },
      {
        id: 2,
        building_type: 'commercial',
        region: 'center',
        quality: 'standard',
        base_cost: 200.0,
        year: 2025
      }
    ];
    
    // Setup database mock return values
    beforeEach(() => {
      pool.query.mockResolvedValue({
        rows: mockCostMatrix,
        rowCount: mockCostMatrix.length
      });
    });
    
    test('should calculate cost for residential building correctly', async () => {
      // Arrange
      const params = {
        buildingType: 'residential',
        region: 'center',
        squareFootage: 2000,
        quality: 'standard',
        yearBuilt: 2020
      };
      
      // Act
      const result = await calculateBuildingCost(params);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.totalCost).toBe(300000); // 2000 sq ft * $150/sq ft
      expect(result.costPerSquareFoot).toBe(150);
      expect(result.confidenceLevel).toBeDefined();
      
      // Verify database was queried with correct parameters
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['residential', 'center', 'standard'])
      );
    });
    
    test('should calculate cost for commercial building correctly', async () => {
      // Arrange
      const params = {
        buildingType: 'commercial',
        region: 'center',
        squareFootage: 5000,
        quality: 'standard',
        yearBuilt: 2022
      };
      
      // Act
      const result = await calculateBuildingCost(params);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.totalCost).toBe(1000000); // 5000 sq ft * $200/sq ft
      expect(result.costPerSquareFoot).toBe(200);
      expect(result.confidenceLevel).toBeDefined();
    });
    
    test('should apply age depreciation for older buildings', async () => {
      // Arrange
      const params = {
        buildingType: 'residential',
        region: 'center',
        squareFootage: 2000,
        quality: 'standard',
        yearBuilt: 2000 // 25 years old in 2025
      };
      
      // Act
      const result = await calculateBuildingCost(params);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.totalCost).toBeLessThan(300000); // Should be less due to depreciation
      expect(result.ageDepreciationFactor).toBeLessThan(1.0);
    });
    
    test('should throw error if no matching cost matrix entry found', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [], rowCount: 0 });
      
      const params = {
        buildingType: 'industrial', // Not in our mock data
        region: 'center',
        squareFootage: 2000,
        quality: 'standard',
        yearBuilt: 2020
      };
      
      // Act & Assert
      await expect(calculateBuildingCost(params))
        .rejects
        .toThrow('No cost matrix entry found for the given parameters');
    });
    
    test('should handle database errors properly', async () => {
      // Arrange
      const dbError = new Error('Database connection error');
      pool.query.mockRejectedValue(dbError);
      
      const params = {
        buildingType: 'residential',
        region: 'center',
        squareFootage: 2000,
        quality: 'standard',
        yearBuilt: 2020
      };
      
      // Act & Assert
      await expect(calculateBuildingCost(params))
        .rejects
        .toThrow('Database connection error');
    });
  });
});