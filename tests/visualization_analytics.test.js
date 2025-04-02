/**
 * @jest
 * Visualization and Analytics Tests for BCBS Application
 * 
 * These tests verify the enhanced visualization capabilities
 * including time-series analysis, comparative visualizations,
 * and exportable reports.
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../server/app');
const { db } = require('../server/pg-storage');
const { TEST_CONFIG } = require('../test-config');

describe('Enhanced Visualization and Analytics', () => {
  // Setup test data
  before(async () => {
    // Ensure we have sufficient test data
    await setupVisualizationTestData();
  });

  describe('Time Series Analysis', () => {
    it('should generate time series data for cost trends', async () => {
      const response = await request(app)
        .get('/api/analytics/time-series')
        .query({ 
          buildingType: 'commercial', 
          startYear: 2020, 
          endYear: 2025,
          region: 'Eastern'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
      expect(response.body[0]).to.have.property('date');
      expect(response.body[0]).to.have.property('value');
    });

    it('should handle invalid time series parameters', async () => {
      const response = await request(app)
        .get('/api/analytics/time-series')
        .query({ 
          buildingType: 'commercial', 
          startYear: 2026,  // Future year with no data
          endYear: 2025,    // End before start
          region: 'Eastern'
        });
      
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('Regional Cost Comparison', () => {
    it('should generate comparison data across regions', async () => {
      const response = await request(app)
        .get('/api/analytics/regional-comparison')
        .query({ 
          buildingType: 'residential', 
          year: 2025,
          squareFootage: 2000
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('regions');
      expect(response.body).to.have.property('values');
      expect(response.body.regions.length).to.equal(response.body.values.length);
      expect(response.body.regions).to.include('Eastern');
    });
  });

  describe('Building Type Comparison', () => {
    it('should compare costs across building types', async () => {
      const response = await request(app)
        .get('/api/analytics/building-type-comparison')
        .query({ 
          region: 'Eastern', 
          year: 2025,
          squareFootage: 2000
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('buildingTypes');
      expect(response.body).to.have.property('values');
      expect(response.body.buildingTypes.length).to.equal(response.body.values.length);
      expect(response.body.buildingTypes).to.include('commercial');
    });
  });

  describe('Cost Breakdown Analysis', () => {
    it('should provide detailed cost breakdown for a calculation', async () => {
      // First create a calculation to analyze
      const calcResponse = await request(app)
        .post('/api/calculations')
        .send({
          squareFootage: 2500,
          buildingType: 'commercial',
          complexityFactor: 'moderate',
          conditionFactor: 'average',
          region: 'Eastern',
          name: 'Test Calculation'
        });
      
      expect(calcResponse.status).to.equal(201);
      
      const calculationId = calcResponse.body.id;
      
      const response = await request(app)
        .get(`/api/analytics/cost-breakdown/${calculationId}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('categories');
      expect(response.body).to.have.property('values');
      expect(response.body.categories).to.include('materials');
      expect(response.body.categories).to.include('labor');
    });
  });

  describe('Report Generation', () => {
    it('should generate an exportable JSON report', async () => {
      // Create a calculation first
      const calcResponse = await request(app)
        .post('/api/calculations')
        .send({
          squareFootage: 3000,
          buildingType: 'residential',
          complexityFactor: 'complex',
          conditionFactor: 'good',
          region: 'Western',
          name: 'Export Test Calculation'
        });
      
      const calculationId = calcResponse.body.id;
      
      const response = await request(app)
        .get(`/api/reports/export/${calculationId}`)
        .query({ format: 'json' });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('calculation');
      expect(response.body).to.have.property('costBreakdown');
      expect(response.body).to.have.property('generatedAt');
    });
    
    it('should return 404 for non-existent calculation', async () => {
      const response = await request(app)
        .get('/api/reports/export/999999')
        .query({ format: 'json' });
      
      expect(response.status).to.equal(404);
    });
  });
});

/**
 * Helper function to set up test data for visualization tests
 */
async function setupVisualizationTestData() {
  // Check if we already have test data
  const checkData = await db.select().from('cost_matrix').limit(1);
  
  if (checkData.length > 0) {
    console.log('Visualization test data already exists');
    return;
  }
  
  console.log('Setting up visualization test data');
  
  // Sample data for different regions, building types, and years
  const testData = [
    // Eastern region data
    {
      region: 'Eastern',
      buildingType: 'commercial',
      baseCost: '125.50',
      matrixYear: 2020,
      matrixDescription: 'Commercial 2020 Eastern',
      buildingTypeDescription: 'Commercial Buildings',
      regionDescription: 'Eastern Washington',
      cityName: 'Spokane',
      county: 'Benton',
      state: 'WA',
      costFactor: '1.0',
      isActive: true
    },
    {
      region: 'Eastern',
      buildingType: 'commercial',
      baseCost: '135.75',
      matrixYear: 2021,
      matrixDescription: 'Commercial 2021 Eastern',
      buildingTypeDescription: 'Commercial Buildings',
      regionDescription: 'Eastern Washington',
      cityName: 'Spokane',
      county: 'Benton',
      state: 'WA',
      costFactor: '1.0',
      isActive: true
    },
    {
      region: 'Eastern',
      buildingType: 'commercial',
      baseCost: '142.30',
      matrixYear: 2022,
      matrixDescription: 'Commercial 2022 Eastern',
      buildingTypeDescription: 'Commercial Buildings',
      regionDescription: 'Eastern Washington',
      cityName: 'Spokane',
      county: 'Benton',
      state: 'WA',
      costFactor: '1.0',
      isActive: true
    },
    // More test data would be added here
  ];
  
  // Insert test data using transaction
  try {
    // In a real implementation, you would use the actual storage interface
    // This is simplified for the test
    for (const data of testData) {
      await db.insert(tables.costMatrix).values(data);
    }
  } catch (error) {
    console.error('Error setting up test data:', error);
  }
}