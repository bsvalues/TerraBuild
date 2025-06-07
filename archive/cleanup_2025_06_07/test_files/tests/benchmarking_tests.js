/**
 * Benchmarking API Tests
 * 
 * This module tests the enhanced benchmarking API functionality.
 */
import { expect } from 'chai';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Base URL for API endpoints
const BASE_URL = 'http://localhost:3000';

// Test user credentials for authenticated endpoints
const TEST_USER = {
  username: 'test_user',
  password: 'test_password'
};

// Helper function to login and get auth cookie
async function login() {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(TEST_USER)
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  // Extract cookies from response headers
  const cookies = response.headers.get('set-cookie');
  return cookies;
}

describe('Benchmarking API Tests', function() {
  let authCookie;
  
  // Login before running tests that require authentication
  before(async function() {
    try {
      authCookie = await login();
    } catch (error) {
      console.warn('Authentication failed, some tests may fail:', error.message);
    }
  });
  
  describe('Basic Endpoints', function() {
    it('should retrieve all counties', async function() {
      const response = await fetch(`${BASE_URL}/api/benchmarking/counties`);
      expect(response.status).to.equal(200);
      
      const counties = await response.json();
      expect(counties).to.be.an('array');
      expect(counties.length).to.be.greaterThan(0);
      expect(counties.includes('Benton')).to.be.true;
    });
    
    it('should retrieve all states', async function() {
      const response = await fetch(`${BASE_URL}/api/benchmarking/states`);
      expect(response.status).to.equal(200);
      
      const states = await response.json();
      expect(states).to.be.an('array');
      expect(states.length).to.be.greaterThan(0);
      expect(states.includes('Washington')).to.be.true;
    });
    
    it('should retrieve building types for a county', async function() {
      const response = await fetch(`${BASE_URL}/api/benchmarking/counties/Benton/building-types`);
      expect(response.status).to.equal(200);
      
      const buildingTypes = await response.json();
      expect(buildingTypes).to.be.an('array');
      expect(buildingTypes.length).to.be.greaterThan(0);
    });
  });
  
  describe('Authenticated Endpoints', function() {
    it('should retrieve cost matrix for a county when authenticated', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/counties/Benton`, {
        headers: {
          'Cookie': authCookie
        }
      });
      
      expect(response.status).to.equal(200);
      
      const costMatrix = await response.json();
      expect(costMatrix).to.be.an('array');
      expect(costMatrix.length).to.be.greaterThan(0);
      
      // Check structure of cost matrix entry
      const entry = costMatrix[0];
      expect(entry).to.have.property('region');
      expect(entry).to.have.property('buildingType');
      expect(entry).to.have.property('baseCost');
      expect(entry).to.have.property('county');
    });
    
    it('should retrieve stats for a county when authenticated', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/counties/Benton/stats`, {
        headers: {
          'Cookie': authCookie
        }
      });
      
      expect(response.status).to.equal(200);
      
      const stats = await response.json();
      expect(stats).to.have.property('minCost');
      expect(stats).to.have.property('maxCost');
      expect(stats).to.have.property('avgCost');
      expect(stats).to.have.property('buildingTypeCount');
    });
    
    it('should successfully query cost matrix with filters', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const filters = {
        state: 'Washington',
        buildingType: 'RESIDENTIAL'
      };
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify(filters)
      });
      
      expect(response.status).to.equal(200);
      
      const results = await response.json();
      expect(results).to.be.an('array');
      
      // Verify all results match the filters
      results.forEach(result => {
        expect(result.state).to.equal('Washington');
        expect(result.buildingType).to.equal('RESIDENTIAL');
      });
    });
  });
});

// Tests for new enhanced API endpoints (to be implemented)
describe('Enhanced Benchmarking API Tests', function() {
  let authCookie;
  
  before(async function() {
    try {
      authCookie = await login();
    } catch (error) {
      console.warn('Authentication failed, some tests may fail:', error.message);
    }
  });
  
  describe('Cross-Region Comparison Endpoints', function() {
    it('should compare costs across multiple counties', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/counties/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          counties: ['Benton', 'Franklin'],
          buildingType: 'RESIDENTIAL'
        })
      });
      
      expect(response.status).to.equal(200);
      
      const results = await response.json();
      expect(results).to.be.an('object');
      expect(results).to.have.property('counties');
      expect(results.counties).to.be.an('array');
      expect(results.counties.length).to.equal(2);
      
      // Each county should have cost data
      results.counties.forEach(county => {
        expect(county).to.have.property('name');
        expect(county).to.have.property('avgCost');
        expect(county).to.have.property('buildingTypes');
      });
    });
    
    it('should compare costs across multiple states', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/states/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          states: ['Washington', 'Oregon'],
          buildingType: 'COMMERCIAL'
        })
      });
      
      expect(response.status).to.equal(200);
      
      const results = await response.json();
      expect(results).to.be.an('object');
      expect(results).to.have.property('states');
      expect(results.states).to.be.an('array');
      expect(results.states.length).to.equal(2);
      
      // Each state should have cost data
      results.states.forEach(state => {
        expect(state).to.have.property('name');
        expect(state).to.have.property('avgCost');
        expect(state).to.have.property('counties');
      });
    });
  });
  
  describe('Time-Series Benchmarking', function() {
    it('should retrieve cost trends over time for a region', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/trends/region`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          region: 'East',
          buildingType: 'RESIDENTIAL',
          years: 3  // Get 3 years of data
        })
      });
      
      expect(response.status).to.equal(200);
      
      const results = await response.json();
      expect(results).to.be.an('object');
      expect(results).to.have.property('region');
      expect(results).to.have.property('buildingType');
      expect(results).to.have.property('trends');
      expect(results.trends).to.be.an('array');
      
      // Should have data points for each year
      expect(results.trends.length).to.be.at.least(1);
      
      // Each trend should have year and cost
      results.trends.forEach(trend => {
        expect(trend).to.have.property('year');
        expect(trend).to.have.property('cost');
      });
    });
    
    it('should retrieve cost trends over time across counties', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/trends/counties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          counties: ['Benton', 'Franklin'],
          buildingType: 'RESIDENTIAL',
          years: 2  // Get 2 years of data
        })
      });
      
      expect(response.status).to.equal(200);
      
      const results = await response.json();
      expect(results).to.be.an('object');
      expect(results).to.have.property('counties');
      expect(results.counties).to.be.an('array');
      expect(results.counties.length).to.equal(2);
      
      // Each county should have trend data
      results.counties.forEach(county => {
        expect(county).to.have.property('name');
        expect(county).to.have.property('trends');
        expect(county.trends).to.be.an('array');
        
        // Each trend should have year and cost
        county.trends.forEach(trend => {
          expect(trend).to.have.property('year');
          expect(trend).to.have.property('cost');
        });
      });
    });
  });
  
  describe('Material Cost Breakdown Comparison', function() {
    it('should compare material costs across regions', async function() {
      // Skip if auth failed
      if (!authCookie) this.skip();
      
      const response = await fetch(`${BASE_URL}/api/benchmarking/materials/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': authCookie
        },
        body: JSON.stringify({
          regions: ['East', 'West'],
          buildingType: 'RESIDENTIAL'
        })
      });
      
      expect(response.status).to.equal(200);
      
      const results = await response.json();
      expect(results).to.be.an('object');
      expect(results).to.have.property('regions');
      expect(results.regions).to.be.an('array');
      expect(results.regions.length).to.equal(2);
      
      // Each region should have material cost data
      results.regions.forEach(region => {
        expect(region).to.have.property('name');
        expect(region).to.have.property('materials');
        expect(region.materials).to.be.an('array');
        
        // Each material should have cost and percentage
        region.materials.forEach(material => {
          expect(material).to.have.property('name');
          expect(material).to.have.property('cost');
          expect(material).to.have.property('percentage');
        });
      });
    });
  });
});