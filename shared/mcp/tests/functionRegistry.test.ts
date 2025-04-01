/**
 * Function Registry Tests
 * 
 * This file contains tests for the MCP Function Registry functionality
 * which validates the registration, retrieval, and execution capabilities
 * of functions within the MCP framework.
 */

import { FunctionRegistry, FunctionExecutor } from '../functionRegistry';
import { SchemaRegistry } from '../schemaRegistry';
import { buildingCalculationInputSchema, buildingCalculationResultSchema } from '../schemas';

// Sample function for testing
const calculateBuildingCostMock = async (params: any) => {
  if (!params.region || !params.buildingType || !params.squareFootage) {
    throw new Error('Invalid parameters');
  }
  
  return {
    baseCost: 100 * params.squareFootage,
    totalCost: 100 * params.squareFootage * 1.2
  };
};

describe('FunctionRegistry', () => {
  let registry: FunctionRegistry;
  let schemaRegistry: SchemaRegistry;

  beforeEach(() => {
    schemaRegistry = new SchemaRegistry();
    schemaRegistry.register('BuildingCalculationInput', buildingCalculationInputSchema);
    schemaRegistry.register('BuildingCalculationResult', buildingCalculationResultSchema);
    
    registry = new FunctionRegistry(schemaRegistry);
  });

  test('should register and retrieve functions', () => {
    registry.register({
      name: 'calculateBuildingCost',
      description: 'Calculate building cost based on parameters',
      inputSchema: 'BuildingCalculationInput',
      outputSchema: 'BuildingCalculationResult',
      fn: calculateBuildingCostMock
    });
    
    const func = registry.get('calculateBuildingCost');
    expect(func).toBeDefined();
    expect(func.name).toBe('calculateBuildingCost');
    expect(func.description).toBe('Calculate building cost based on parameters');
    expect(func.inputSchema).toBe('BuildingCalculationInput');
    expect(func.outputSchema).toBe('BuildingCalculationResult');
    expect(typeof func.fn).toBe('function');
  });

  test('should check if function exists', () => {
    registry.register({
      name: 'calculateBuildingCost',
      description: 'Calculate building cost based on parameters',
      inputSchema: 'BuildingCalculationInput',
      outputSchema: 'BuildingCalculationResult',
      fn: calculateBuildingCostMock
    });
    
    expect(registry.exists('calculateBuildingCost')).toBe(true);
    expect(registry.exists('nonExistentFunction')).toBe(false);
  });

  test('should list all registered functions', () => {
    registry.register({
      name: 'calculateBuildingCost',
      description: 'Calculate building cost based on parameters',
      inputSchema: 'BuildingCalculationInput',
      outputSchema: 'BuildingCalculationResult',
      fn: calculateBuildingCostMock
    });
    
    registry.register({
      name: 'calculateDepreciation',
      description: 'Calculate depreciation based on year',
      inputSchema: 'BuildingCalculationInput',
      outputSchema: 'BuildingCalculationResult',
      fn: calculateBuildingCostMock // Using same mock function for simplicity
    });
    
    const functionList = registry.listAll();
    expect(functionList).toHaveLength(2);
    expect(functionList).toContain('calculateBuildingCost');
    expect(functionList).toContain('calculateDepreciation');
  });

  test('should throw error when getting non-existent function', () => {
    expect(() => registry.get('nonExistentFunction')).toThrow(
      'Function nonExistentFunction not found in registry'
    );
  });
});

describe('FunctionExecutor', () => {
  let functionRegistry: FunctionRegistry;
  let schemaRegistry: SchemaRegistry;
  let executor: FunctionExecutor;

  beforeEach(() => {
    schemaRegistry = new SchemaRegistry();
    schemaRegistry.register('BuildingCalculationInput', buildingCalculationInputSchema);
    schemaRegistry.register('BuildingCalculationResult', buildingCalculationResultSchema);
    
    functionRegistry = new FunctionRegistry(schemaRegistry);
    functionRegistry.register({
      name: 'calculateBuildingCost',
      description: 'Calculate building cost based on parameters',
      inputSchema: 'BuildingCalculationInput',
      outputSchema: 'BuildingCalculationResult',
      fn: calculateBuildingCostMock
    });
    
    executor = new FunctionExecutor(functionRegistry, schemaRegistry);
  });

  test('should execute function with valid parameters', async () => {
    const validParams = {
      region: 'Western',
      buildingType: 'residential',
      squareFootage: 2000,
      complexityFactor: 1.1,
      conditionFactor: 1.0,
      yearBuilt: 2020
    };
    
    const result = await executor.execute('calculateBuildingCost', validParams);
    expect(result).toBeDefined();
    expect(result.baseCost).toBe(200000); // 100 * 2000
    expect(result.totalCost).toBe(240000); // 100 * 2000 * 1.2
  });

  test('should throw error when executing with invalid parameters', async () => {
    const invalidParams = {
      // Missing required fields
      region: 'Western',
      buildingType: 'residential'
      // No squareFootage, etc.
    };
    
    await expect(executor.execute('calculateBuildingCost', invalidParams))
      .rejects
      .toThrow();
  });

  test('should throw error when executing non-existent function', async () => {
    const params = { /* valid params */ };
    
    await expect(executor.execute('nonExistentFunction', params))
      .rejects
      .toThrow('Function nonExistentFunction not found in registry');
  });
});