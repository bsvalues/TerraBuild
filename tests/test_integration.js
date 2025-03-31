/**
 * Integration Tests for Cost Matrix Functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupRoutes } from '../server/routes';
import { MemStorage } from '../server/storage';

describe('Cost Matrix Integration Tests', () => {
  let app;
  let storage;
  
  // Setup test app with in-memory storage
  beforeAll(() => {
    app = express();
    storage = new MemStorage();
    
    // Add sample cost matrix data
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
    
    // Add material types
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
      }
    ];
    
    materialTypes.forEach(material => {
      storage.materialTypes.set(material.id, material);
    });
    
    // Add material costs
    const materialCosts = [
      {
        id: 1,
        materialTypeId: 1,
        buildingType: 'SFR',
        region: 'West Richland',
        costPerUnit: '20.00',
        percentage: '15.00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        materialTypeId: 2,
        buildingType: 'SFR',
        region: 'West Richland',
        costPerUnit: '35.00',
        percentage: '25.00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    materialCosts.forEach(cost => {
      storage.materialCosts.set(cost.id, cost);
    });
    
    // Setup routes
    setupRoutes(app, storage);
  });
  
  // Test integration of data retrieval and calculation
  it('should fetch cost matrix data and perform calculations', async () => {
    // Get cost matrix entry
    const costMatrixResponse = await request(app)
      .get('/api/cost-matrix?region=West%20Richland&buildingType=SFR');
    
    expect(costMatrixResponse.status).toBe(200);
    expect(costMatrixResponse.body).toBeInstanceOf(Array);
    expect(costMatrixResponse.body.length).toBe(1);
    
    const costMatrix = costMatrixResponse.body[0];
    expect(costMatrix.region).toBe('West Richland');
    expect(costMatrix.buildingType).toBe('SFR');
    expect(costMatrix.baseCost).toBe('150.00');
    
    // Perform calculation using retrieved cost matrix
    const calculationResponse = await request(app)
      .post('/api/cost-matrix/calculate')
      .send({
        region: costMatrix.region,
        buildingType: costMatrix.buildingType,
        squareFootage: 2000,
        complexityMultiplier: 1.5
      });
    
    expect(calculationResponse.status).toBe(200);
    expect(calculationResponse.body.totalCost).toBeDefined();
    expect(calculationResponse.body.materials).toBeInstanceOf(Array);
    
    // Base cost is 150.00, complexity factor base is 1.20
    // With multiplier of 1.5, final complexity factor is 1.5 * 1.20 = 1.80
    // Cost per sqft = 150.00 * 1.80 = 270.00
    // Total cost = 270.00 * 2000 = 540,000.00
    expect(parseFloat(calculationResponse.body.costPerSqft)).toBeCloseTo(270.00);
    expect(parseFloat(calculationResponse.body.totalCost)).toBeCloseTo(540000.00);
    
    // Verify material breakdown
    expect(calculationResponse.body.materials.length).toBe(2);
    
    const foundation = calculationResponse.body.materials.find(m => m.code === 'FDN');
    expect(foundation).toBeDefined();
    expect(foundation.percentage).toBe('15.00');
    expect(parseFloat(foundation.cost)).toBeCloseTo(81000.00); // 15% of 540,000
    
    const framing = calculationResponse.body.materials.find(m => m.code === 'FRM');
    expect(framing).toBeDefined();
    expect(framing.percentage).toBe('25.00');
    expect(parseFloat(framing.cost)).toBeCloseTo(135000.00); // 25% of 540,000
  });
  
  // Test database import and UI reflection
  it('should update UI after database import', async () => {
    // Initial count of cost matrix entries
    const initialResponse = await request(app).get('/api/cost-matrix');
    const initialCount = initialResponse.body.length;
    
    // Import new cost matrix entry
    const importData = [
      {
        region: 'Kennewick',
        buildingType: 'MFR',
        buildingTypeDescription: 'Multi-Family Residence',
        baseCost: '140.00',
        matrixYear: 2025,
        sourceMatrixId: 2,
        matrixDescription: 'MFR - Kennewick - 2025',
        dataPoints: 80,
        complexityFactorBase: '1.15',
        qualityFactorBase: '1.05',
        conditionFactorBase: '0.95',
        isActive: true
      }
    ];
    
    const importResponse = await request(app)
      .post('/api/cost-matrix/import')
      .send(importData);
    
    expect(importResponse.status).toBe(200);
    expect(importResponse.body.imported).toBe(1);
    
    // Verify UI shows updated data
    const updatedResponse = await request(app).get('/api/cost-matrix');
    expect(updatedResponse.body.length).toBe(initialCount + 1);
    
    // Check that the new region is in the list of available regions
    const regionsResponse = await request(app).get('/api/cost-matrix/regions');
    expect(regionsResponse.body).toContain('Kennewick');
    
    // Check that the new building type is in the list of available building types
    const buildingTypesResponse = await request(app).get('/api/cost-matrix/building-types');
    expect(buildingTypesResponse.body).toContain('MFR');
  });
  
  // Test cost factors affecting calculation results
  it('should apply cost factors appropriately to calculation results', async () => {
    // First calculation - standard complexity
    const standardResponse = await request(app)
      .post('/api/cost-matrix/calculate')
      .send({
        region: 'West Richland',
        buildingType: 'SFR',
        squareFootage: 2000,
        complexityMultiplier: 1.0 // standard
      });
    
    expect(standardResponse.status).toBe(200);
    const standardCost = parseFloat(standardResponse.body.totalCost);
    
    // Second calculation - higher complexity
    const complexResponse = await request(app)
      .post('/api/cost-matrix/calculate')
      .send({
        region: 'West Richland',
        buildingType: 'SFR',
        squareFootage: 2000,
        complexityMultiplier: 2.0 // higher complexity
      });
    
    expect(complexResponse.status).toBe(200);
    const complexCost = parseFloat(complexResponse.body.totalCost);
    
    // Higher complexity should result in higher cost
    expect(complexCost).toBeGreaterThan(standardCost);
    
    // The ratio should be proportional to the difference in complexity multipliers
    // 2.0 / 1.0 = 2.0
    const costRatio = complexCost / standardCost;
    expect(costRatio).toBeCloseTo(2.0);
  });
});