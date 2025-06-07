/**
 * Tests for Cost Matrix API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { setupRoutes } from '../server/routes';
import { MemStorage } from '../server/storage';

describe('Cost Matrix API Endpoint Tests', () => {
  let app;
  let storage;
  
  // Setup test app with in-memory storage before tests
  beforeAll(() => {
    app = express();
    storage = new MemStorage();
    
    // Add sample cost matrix data to storage
    const sampleData = [
      {
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
        complexityFactorBase: '1.00',
        qualityFactorBase: '1.00',
        conditionFactorBase: '1.00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        region: 'Kennewick',
        buildingType: 'SFR',
        buildingTypeDescription: 'Single Family Residence',
        baseCost: '145.00',
        matrixYear: 2025,
        sourceMatrixId: 2,
        matrixDescription: 'SFR - Kennewick - 2025',
        dataPoints: 120,
        minCost: '115.00',
        maxCost: '175.00',
        complexityFactorBase: '1.00',
        qualityFactorBase: '1.00',
        conditionFactorBase: '1.00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        region: 'West Richland',
        buildingType: 'MFR',
        buildingTypeDescription: 'Multi-Family Residence',
        baseCost: '135.00',
        matrixYear: 2025,
        sourceMatrixId: 3,
        matrixDescription: 'MFR - West Richland - 2025',
        dataPoints: 80,
        minCost: '110.00',
        maxCost: '160.00',
        complexityFactorBase: '1.00',
        qualityFactorBase: '1.00',
        conditionFactorBase: '1.00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Add data to storage
    sampleData.forEach(entry => {
      storage.costMatrixEntries.set(entry.id, entry);
    });
    
    // Setup routes with our test storage
    setupRoutes(app, storage);
  });
  
  // Test GET all cost matrix entries
  it('GET /api/cost-matrix should return all cost matrix entries', async () => {
    const response = await request(app).get('/api/cost-matrix');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(3);
  });
  
  // Test GET cost matrix entries filtered by region
  it('GET /api/cost-matrix?region=X should return entries filtered by region', async () => {
    const response = await request(app).get('/api/cost-matrix?region=West%20Richland');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2); // We should get 2 entries for West Richland
    expect(response.body[0].region).toBe('West Richland');
    expect(response.body[1].region).toBe('West Richland');
  });
  
  // Test GET cost matrix entries filtered by building type
  it('GET /api/cost-matrix?buildingType=Y should return entries filtered by building type', async () => {
    const response = await request(app).get('/api/cost-matrix?buildingType=SFR');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2); // We should get 2 entries for SFR
    expect(response.body[0].buildingType).toBe('SFR');
    expect(response.body[1].buildingType).toBe('SFR');
  });
  
  // Test GET specific cost matrix entry by region and building type
  it('GET /api/cost-matrix?region=X&buildingType=Y should return specific entry', async () => {
    const response = await request(app).get('/api/cost-matrix?region=West%20Richland&buildingType=SFR');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(1);
    expect(response.body[0].region).toBe('West Richland');
    expect(response.body[0].buildingType).toBe('SFR');
  });
  
  // Test GET list of all regions
  it('GET /api/cost-matrix/regions should return list of all regions', async () => {
    const response = await request(app).get('/api/cost-matrix/regions');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2); // We have 2 unique regions
    expect(response.body).toContain('West Richland');
    expect(response.body).toContain('Kennewick');
  });
  
  // Test GET list of all building types
  it('GET /api/cost-matrix/building-types should return list of all building types', async () => {
    const response = await request(app).get('/api/cost-matrix/building-types');
    
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(2); // We have 2 unique building types
    expect(response.body).toContain('SFR');
    expect(response.body).toContain('MFR');
  });
});