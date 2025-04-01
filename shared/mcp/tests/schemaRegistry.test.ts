/**
 * Schema Registry Tests
 * 
 * This file contains tests for the MCP Schema Registry functionality
 * which validates the registration, retrieval, and validation capabilities.
 */

import { SchemaRegistry, SchemaValidator } from '../schemaRegistry';
import { costMatrixSchema, buildingTypeSchema } from '../schemas';

describe('SchemaRegistry', () => {
  let registry: SchemaRegistry;

  beforeEach(() => {
    registry = new SchemaRegistry();
  });

  test('should register and retrieve schemas', () => {
    // Register schemas
    registry.register('CostMatrix', costMatrixSchema);
    registry.register('BuildingType', buildingTypeSchema);
    
    // Retrieve and verify schemas
    expect(registry.get('CostMatrix')).toEqual(costMatrixSchema);
    expect(registry.get('BuildingType')).toEqual(buildingTypeSchema);
  });

  test('should check if schema exists', () => {
    registry.register('CostMatrix', costMatrixSchema);
    
    expect(registry.exists('CostMatrix')).toBe(true);
    expect(registry.exists('NonExistentSchema')).toBe(false);
  });

  test('should list all registered schemas', () => {
    registry.register('CostMatrix', costMatrixSchema);
    registry.register('BuildingType', buildingTypeSchema);
    
    const schemaList = registry.listAll();
    expect(schemaList).toHaveLength(2);
    expect(schemaList).toContain('CostMatrix');
    expect(schemaList).toContain('BuildingType');
  });

  test('should throw error when getting non-existent schema', () => {
    expect(() => registry.get('NonExistentSchema')).toThrow(
      'Schema NonExistentSchema not found in registry'
    );
  });
});

describe('SchemaValidator', () => {
  let registry: SchemaRegistry;
  let validator: SchemaValidator;

  beforeEach(() => {
    registry = new SchemaRegistry();
    registry.register('CostMatrix', costMatrixSchema);
    
    validator = new SchemaValidator(registry);
  });

  test('should validate data against schema successfully', () => {
    const validCostMatrixData = {
      id: 1,
      region: 'Western',
      buildingType: 'residential',
      baseCost: 150.75,
      county: 'Benton',
      state: 'Washington',
      complexityFactorBase: 1.1,
      qualityFactorBase: 1.2,
      conditionFactorBase: 1.0,
      year: 2025
    };
    
    const result = validator.validate('CostMatrix', validCostMatrixData);
    expect(result.valid).toBe(true);
    expect(result.errors).toBeNull();
  });

  test('should return validation errors for invalid data', () => {
    const invalidCostMatrixData = {
      // Missing required fields
      region: 'Western',
      buildingType: 'residential'
      // No baseCost, county, state, etc.
    };
    
    const result = validator.validate('CostMatrix', invalidCostMatrixData);
    expect(result.valid).toBe(false);
    expect(result.errors).toBeTruthy();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  test('should throw error when validating against non-existent schema', () => {
    expect(() => validator.validate('NonExistentSchema', {})).toThrow(
      'Schema NonExistentSchema not found in registry'
    );
  });
});