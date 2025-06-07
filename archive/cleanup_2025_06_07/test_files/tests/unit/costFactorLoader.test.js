/**
 * Cost Factor Loader Unit Tests
 * 
 * This file contains unit tests for the cost factor loader functionality.
 */

import fs from 'fs';
import path from 'path';
import { 
  loadCostFactors, 
  getCostSource, 
  isCostSourceAvailable, 
  getAvailableSources 
} from '../../server/services/costEngine/costFactorLoader';

// Mock fs and path modules
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

jest.mock('path', () => ({
  resolve: jest.fn()
}));

describe('Cost Factor Loader', () => {
  let mockConfig;
  let mockFactorData;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock config
    mockConfig = {
      costEngine: {
        costSource: 'marshallSwift',
        dataFile: 'data/costFactors.json'
      }
    };
    
    // Setup mock factor data
    mockFactorData = {
      version: '2025.1',
      lastUpdated: '2025-05-12',
      description: 'Test Cost Factors',
      marshallSwift: {
        buildingTypes: [
          { code: 'RES', name: 'Residential', baseCost: 150.00 }
        ],
        regions: [
          { code: 'BC-NORTH', name: 'North Benton County', factor: 1.10 }
        ]
      },
      rsmeans: {}
    };
    
    // Mock fs functions
    fs.existsSync.mockImplementation(filePath => true);
    fs.readFileSync.mockImplementation((filePath, encoding) => {
      if (filePath.includes('terra.json')) {
        return JSON.stringify(mockConfig);
      } else if (filePath.includes('costFactors.json')) {
        return JSON.stringify(mockFactorData);
      }
      return '';
    });
    
    // Mock path functions
    path.resolve.mockImplementation(filePath => filePath);
  });
  
  describe('getCostSource', () => {
    it('should return the cost source from config', () => {
      const source = getCostSource();
      expect(source).toBe('marshallSwift');
      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.readFileSync).toHaveBeenCalled();
    });
    
    it('should return default source if config file is missing', () => {
      fs.existsSync.mockReturnValueOnce(false);
      const source = getCostSource();
      expect(source).toBe('marshallSwift');
    });
    
    it('should return default source if config is invalid', () => {
      fs.readFileSync.mockImplementationOnce(() => '{invalid-json}');
      const source = getCostSource();
      expect(source).toBe('marshallSwift');
    });
  });
  
  describe('loadCostFactors', () => {
    it('should load factors for the specified source', () => {
      const factors = loadCostFactors('marshallSwift');
      expect(factors).toEqual(mockFactorData.marshallSwift);
    });
    
    it('should load factors for the default source if none specified', () => {
      const factors = loadCostFactors();
      expect(factors).toEqual(mockFactorData.marshallSwift);
    });
    
    it('should return empty object if data file is missing', () => {
      fs.existsSync.mockReturnValueOnce(true); // config exists
      fs.existsSync.mockReturnValueOnce(false); // data file missing
      const factors = loadCostFactors();
      expect(factors).toEqual({});
    });
    
    it('should return empty object if data file is invalid', () => {
      fs.readFileSync.mockImplementationOnce((filePath) => {
        if (filePath.includes('costFactors.json')) {
          return '{invalid-json}';
        }
        return JSON.stringify(mockConfig);
      });
      const factors = loadCostFactors();
      expect(factors).toEqual({});
    });
  });
  
  describe('isCostSourceAvailable', () => {
    it('should return true if source has data', () => {
      const available = isCostSourceAvailable('marshallSwift');
      expect(available).toBe(true);
    });
    
    it('should return false if source has no data', () => {
      const available = isCostSourceAvailable('rsmeans');
      expect(available).toBe(false);
    });
  });
  
  describe('getAvailableSources', () => {
    it('should return array of available sources', () => {
      // Mock rsmeans to have data
      mockFactorData.rsmeans = { buildingTypes: [{ code: 'RES' }] };
      const sources = getAvailableSources();
      expect(sources).toContain('marshallSwift');
      expect(sources).toContain('rsmeans');
    });
    
    it('should only return sources with data', () => {
      // Mock rsmeans to be empty
      mockFactorData.rsmeans = {};
      const sources = getAvailableSources();
      expect(sources).toContain('marshallSwift');
      expect(sources).not.toContain('rsmeans');
    });
  });
});