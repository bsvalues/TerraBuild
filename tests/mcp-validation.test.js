/**
 * Tests for MCP Data Validation and Sanitization
 * 
 * This file contains tests for the validation and sanitization functions
 * used in the Model Content Protocol (MCP) module.
 */

const { expect } = require('chai');
const { 
  validateBuildingType,
  validateRegion,
  validateSquareFootage,
  validateYearBuilt,
  validateCondition,
  normalizeInputData,
  detectAnomalies
} = require('../shared/mcp-validation');

describe('MCP Data Validation', () => {
  // Building Type Validation Tests
  describe('validateBuildingType()', () => {
    it('should accept valid building types', () => {
      expect(validateBuildingType('residential')).to.be.true;
      expect(validateBuildingType('commercial')).to.be.true;
      expect(validateBuildingType('industrial')).to.be.true;
    });
    
    it('should reject invalid building types', () => {
      expect(validateBuildingType('')).to.be.false;
      expect(validateBuildingType(null)).to.be.false;
      expect(validateBuildingType('invalid_type')).to.be.false;
    });
    
    it('should normalize case variations', () => {
      expect(validateBuildingType('RESIDENTIAL')).to.be.true;
      expect(validateBuildingType('Commercial')).to.be.true;
    });
  });
  
  // Region Validation Tests
  describe('validateRegion()', () => {
    it('should accept valid regions', () => {
      expect(validateRegion('north')).to.be.true;
      expect(validateRegion('south')).to.be.true;
      expect(validateRegion('central')).to.be.true;
    });
    
    it('should reject invalid regions', () => {
      expect(validateRegion('')).to.be.false;
      expect(validateRegion(null)).to.be.false;
      expect(validateRegion('invalid_region')).to.be.false;
    });
    
    it('should normalize case and format variations', () => {
      expect(validateRegion('NORTH')).to.be.true;
      expect(validateRegion('South Region')).to.be.true;
    });
  });
  
  // Square Footage Validation Tests
  describe('validateSquareFootage()', () => {
    it('should accept valid square footage values', () => {
      expect(validateSquareFootage(1000)).to.be.true;
      expect(validateSquareFootage(5000.5)).to.be.true;
      expect(validateSquareFootage('2500')).to.be.true;
    });
    
    it('should reject invalid square footage values', () => {
      expect(validateSquareFootage(0)).to.be.false;
      expect(validateSquareFootage(-100)).to.be.false;
      expect(validateSquareFootage('abc')).to.be.false;
      expect(validateSquareFootage(null)).to.be.false;
      expect(validateSquareFootage(10000000)).to.be.false; // Unreasonably large
    });
  });
  
  // Year Built Validation Tests
  describe('validateYearBuilt()', () => {
    it('should accept valid year built values', () => {
      expect(validateYearBuilt(1950)).to.be.true;
      expect(validateYearBuilt(2023)).to.be.true;
      expect(validateYearBuilt('2000')).to.be.true;
    });
    
    it('should reject invalid year built values', () => {
      expect(validateYearBuilt(1800)).to.be.false; // Too old
      expect(validateYearBuilt(2050)).to.be.false; // Future year
      expect(validateYearBuilt('abc')).to.be.false;
      expect(validateYearBuilt(null)).to.be.false;
    });
  });
  
  // Condition Validation Tests
  describe('validateCondition()', () => {
    it('should accept valid condition values', () => {
      expect(validateCondition('excellent')).to.be.true;
      expect(validateCondition('good')).to.be.true;
      expect(validateCondition('average')).to.be.true;
      expect(validateCondition('fair')).to.be.true;
      expect(validateCondition('poor')).to.be.true;
    });
    
    it('should reject invalid condition values', () => {
      expect(validateCondition('')).to.be.false;
      expect(validateCondition('bad')).to.be.false; // Not in allowed list
      expect(validateCondition(null)).to.be.false;
    });
    
    it('should normalize case variations', () => {
      expect(validateCondition('EXCELLENT')).to.be.true;
      expect(validateCondition('Good')).to.be.true;
    });
  });
  
  // Input Normalization Tests
  describe('normalizeInputData()', () => {
    it('should normalize input data correctly', () => {
      const input = {
        buildingType: 'Residential',
        region: 'NORTH',
        squareFootage: '2500',
        yearBuilt: '1995',
        condition: 'GOOD'
      };
      
      const normalized = normalizeInputData(input);
      
      expect(normalized.buildingType).to.equal('residential');
      expect(normalized.region).to.equal('north');
      expect(normalized.squareFootage).to.equal(2500);
      expect(normalized.yearBuilt).to.equal(1995);
      expect(normalized.condition).to.equal('good');
    });
    
    it('should handle incomplete data', () => {
      const input = {
        buildingType: 'commercial',
        region: 'south',
        squareFootage: 3000
      };
      
      const normalized = normalizeInputData(input);
      
      expect(normalized.buildingType).to.equal('commercial');
      expect(normalized.region).to.equal('south');
      expect(normalized.squareFootage).to.equal(3000);
      expect(normalized.yearBuilt).to.be.undefined;
      expect(normalized.condition).to.be.undefined;
    });
  });
  
  // Anomaly Detection Tests
  describe('detectAnomalies()', () => {
    it('should detect anomalies in cost prediction inputs', () => {
      // Anomalously large square footage for residential
      const anomalousInput1 = {
        buildingType: 'residential',
        region: 'north',
        squareFootage: 50000,
        yearBuilt: 2010
      };
      
      // Very old building with excellent condition
      const anomalousInput2 = {
        buildingType: 'commercial',
        region: 'central',
        squareFootage: 5000,
        yearBuilt: 1910,
        condition: 'excellent'
      };
      
      // Normal input
      const normalInput = {
        buildingType: 'industrial',
        region: 'east',
        squareFootage: 10000,
        yearBuilt: 2015,
        condition: 'good'
      };
      
      expect(detectAnomalies(anomalousInput1).hasAnomalies).to.be.true;
      expect(detectAnomalies(anomalousInput2).hasAnomalies).to.be.true;
      expect(detectAnomalies(normalInput).hasAnomalies).to.be.false;
    });
  });
});