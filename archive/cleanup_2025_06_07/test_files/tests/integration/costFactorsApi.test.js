/**
 * Cost Factors API Integration Tests
 * 
 * This file contains integration tests for the cost factors API endpoints.
 */

import request from 'supertest';
import express from 'express';
import { router as costFactorTablesRouter } from '../../server/plugins/CostFactorTables';
import * as costFactorLoader from '../../server/services/costEngine/costFactorLoader';

// Mock the costFactorLoader module
jest.mock('../../server/services/costEngine/costFactorLoader', () => ({
  getCostSource: jest.fn(),
  loadCostFactors: jest.fn(),
  getAvailableSources: jest.fn(),
  isCostSourceAvailable: jest.fn()
}));

describe('Cost Factors API Endpoints', () => {
  let app;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use(costFactorTablesRouter);
    
    // Set up mock data
    costFactorLoader.getCostSource.mockReturnValue('marshallSwift');
    costFactorLoader.getAvailableSources.mockReturnValue(['marshallSwift', 'rsmeans']);
    costFactorLoader.isCostSourceAvailable.mockImplementation(source => 
      source === 'marshallSwift' || source === 'rsmeans'
    );
    
    // Mock loadCostFactors with test data
    costFactorLoader.loadCostFactors.mockImplementation(source => {
      if (source === 'marshallSwift') {
        return {
          buildingTypes: [
            { code: 'RES', name: 'Residential', description: 'Single family homes', baseCost: 150.00 }
          ],
          regions: [
            { code: 'BC-NORTH', name: 'North Benton County', factor: 1.10 }
          ],
          quality: [
            { level: 'STANDARD', description: 'Standard quality', factor: 1.00 }
          ]
        };
      } else if (source === 'rsmeans') {
        return {
          buildingTypes: [
            { code: 'RES', name: 'Residential', description: 'Single family homes', baseCost: 160.00 }
          ],
          regions: [
            { code: 'BC-NORTH', name: 'North Benton County', factor: 1.05 }
          ]
        };
      }
      return {};
    });
  });
  
  describe('GET /api/cost-factors', () => {
    it('should return cost factors for the default source', async () => {
      const response = await request(app).get('/api/cost-factors');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('marshallSwift');
      expect(response.body.factors).toBeDefined();
      expect(costFactorLoader.loadCostFactors).toHaveBeenCalledWith('marshallSwift');
    });
    
    it('should return cost factors for the specified source', async () => {
      const response = await request(app)
        .get('/api/cost-factors')
        .query({ source: 'rsmeans' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('rsmeans');
      expect(costFactorLoader.loadCostFactors).toHaveBeenCalledWith('rsmeans');
    });
    
    it('should return specific factors when property type and region are provided', async () => {
      const response = await request(app)
        .get('/api/cost-factors')
        .query({ 
          source: 'marshallSwift',
          propertyType: 'RES',
          region: 'BC-NORTH'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('marshallSwift');
      expect(response.body.factors).toBeDefined();
      // Would need to mock the CostFactorTablesService for more specific assertions
    });
  });
  
  describe('GET /api/cost-factors/source', () => {
    it('should return the current cost source', async () => {
      const response = await request(app).get('/api/cost-factors/source');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('marshallSwift');
      expect(costFactorLoader.getCostSource).toHaveBeenCalled();
    });
  });
  
  describe('GET /api/cost-factors/sources', () => {
    it('should return the available cost sources', async () => {
      const response = await request(app).get('/api/cost-factors/sources');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.sources).toEqual(['marshallSwift', 'rsmeans']);
      expect(costFactorLoader.getAvailableSources).toHaveBeenCalled();
    });
  });
  
  describe('PUT /api/cost-factors/source', () => {
    it('should update the current cost source', async () => {
      // We need to mock fs for this test
      const fs = require('fs');
      jest.mock('fs', () => ({
        existsSync: jest.fn(() => true),
        readFileSync: jest.fn(() => JSON.stringify({ costEngine: { costSource: 'marshallSwift' } })),
        writeFileSync: jest.fn()
      }));
      
      const response = await request(app)
        .put('/api/cost-factors/source')
        .send({ source: 'rsmeans' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.source).toBe('rsmeans');
    });
    
    it('should return 400 if source is missing', async () => {
      const response = await request(app)
        .put('/api/cost-factors/source')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
    
    it('should return 400 if source is invalid', async () => {
      costFactorLoader.isCostSourceAvailable.mockReturnValue(false);
      
      const response = await request(app)
        .put('/api/cost-factors/source')
        .send({ source: 'invalid' });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});