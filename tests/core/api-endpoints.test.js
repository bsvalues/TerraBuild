/**
 * Core API Endpoints Test
 * 
 * Tests the basic API endpoints to ensure they are operational.
 * This is a fundamental test to verify application health.
 */

import { describe, it } from 'mocha';
import { strict as assert } from 'assert';
import fetch from 'node-fetch';
import { TEST_CONFIG, isServerRunning } from '../../test-config.js';

const BASE_URL = TEST_CONFIG.baseUrl;

describe('Core API Endpoints', function() {
  // Set timeout for all tests in this suite
  this.timeout(TEST_CONFIG.timeout);
  
  before(async function() {
    // Skip tests if server is not running
    const running = await isServerRunning();
    if (!running) {
      console.warn('Server is not running. Skipping API tests.');
      this.skip();
    }
  });
  
  describe('Repository Endpoint', function() {
    it('should return repository information', async function() {
      const response = await fetch(`${BASE_URL}/api/repository`);
      assert.equal(response.status, 200, 'Expected 200 status code');
      
      const data = await response.json();
      assert.ok(data, 'Expected data to be returned');
      assert.ok(data.id, 'Expected data to have an id');
      assert.ok(data.sourceRepo, 'Expected data to have a sourceRepo');
    });
  });
  
  describe('Cost Matrix Endpoint', function() {
    it('should return cost matrix data', async function() {
      const response = await fetch(`${BASE_URL}/api/cost-matrix`);
      assert.equal(response.status, 200, 'Expected 200 status code');
      
      const data = await response.json();
      assert.ok(Array.isArray(data), 'Expected an array of cost matrix entries');
      
      if (data.length > 0) {
        const firstEntry = data[0];
        assert.ok(firstEntry.region, 'Expected entries to have a region');
        assert.ok(firstEntry.buildingType, 'Expected entries to have a buildingType');
      }
    });
  });
  
  describe('Activities Endpoint', function() {
    it('should return activity logs', async function() {
      const response = await fetch(`${BASE_URL}/api/activities`);
      assert.equal(response.status, 200, 'Expected 200 status code');
      
      const data = await response.json();
      assert.ok(Array.isArray(data), 'Expected an array of activity logs');
      
      if (data.length > 0) {
        const firstLog = data[0];
        assert.ok(firstLog.action, 'Expected logs to have an action');
        assert.ok(firstLog.timestamp, 'Expected logs to have a timestamp');
      }
    });
  });
  
  describe('Regions Endpoint', function() {
    it('should return available regions', async function() {
      const response = await fetch(`${BASE_URL}/api/regions`);
      assert.equal(response.status, 200, 'Expected 200 status code');
      
      // Handle the response text first to debug
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        assert.ok(Array.isArray(data), 'Expected an array of regions');
      } catch (error) {
        assert.fail(`Failed to parse response as JSON: ${text.substring(0, 100)}...`);
      }
    });
  });
  
  describe('Benchmarking Endpoints', function() {
    it('should return benchmarking counties', async function() {
      const response = await fetch(`${BASE_URL}/api/benchmarking/counties`);
      assert.equal(response.status, 200, 'Expected 200 status code');
      
      const data = await response.json();
      assert.ok(Array.isArray(data), 'Expected an array of counties');
    });
    
    it('should return benchmarking states', async function() {
      const response = await fetch(`${BASE_URL}/api/benchmarking/states`);
      assert.equal(response.status, 200, 'Expected 200 status code');
      
      const data = await response.json();
      assert.ok(Array.isArray(data), 'Expected an array of states');
    });
  });
});