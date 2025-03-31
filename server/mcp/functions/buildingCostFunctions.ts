/**
 * Building Cost Functions for Model Content Protocol
 * 
 * This file defines and registers functions related to building cost calculations
 * using the Model Content Protocol framework.
 */

import { functionRegistry } from './functionRegistry';
import { FunctionDefinition, FunctionParameter } from '../schemas/types';
import { aiService } from '../services/aiService';

// Function parameter definitions
const buildingTypeParam: FunctionParameter = {
  name: 'buildingType',
  description: 'Type of the building (e.g., RESIDENTIAL, COMMERCIAL, INDUSTRIAL)',
  type: 'STRING',
  required: true
};

const squareFootageParam: FunctionParameter = {
  name: 'squareFootage',
  description: 'Total square footage of the building',
  type: 'NUMBER',
  required: true
};

const regionParam: FunctionParameter = {
  name: 'region',
  description: 'Geographic region of the building',
  type: 'STRING',
  required: true
};

const conditionParam: FunctionParameter = {
  name: 'condition',
  description: 'Condition of the building (EXCELLENT, GOOD, AVERAGE, FAIR, POOR)',
  type: 'STRING',
  required: false
};

const yearBuiltParam: FunctionParameter = {
  name: 'yearBuilt',
  description: 'Year the building was constructed',
  type: 'NUMBER',
  required: false
};

const featuresParam: FunctionParameter = {
  name: 'features',
  description: 'Special features of the building',
  type: 'ARRAY',
  required: false
};

const costFactorsParam: FunctionParameter = {
  name: 'costFactors',
  description: 'Custom cost factors to apply to the calculation',
  type: 'OBJECT',
  required: false
};

const matrixDataParam: FunctionParameter = {
  name: 'matrixData',
  description: 'Cost matrix data to analyze',
  type: 'OBJECT',
  required: true
};

const calculationDataParam: FunctionParameter = {
  name: 'calculationData',
  description: 'Building cost calculation data to explain',
  type: 'OBJECT',
  required: true
};

// Function definitions
const predictCostFunction: FunctionDefinition = {
  name: 'predictBuildingCost',
  description: 'Predict the cost of a building based on its characteristics',
  parameters: [
    buildingTypeParam,
    squareFootageParam,
    regionParam,
    conditionParam,
    yearBuiltParam,
    featuresParam,
    costFactorsParam
  ],
  returnType: 'OBJECT'
};

const analyzeCostMatrixFunction: FunctionDefinition = {
  name: 'analyzeCostMatrix',
  description: 'Analyze a cost matrix to identify patterns and insights',
  parameters: [matrixDataParam],
  returnType: 'OBJECT'
};

const explainCalculationFunction: FunctionDefinition = {
  name: 'explainCalculation',
  description: 'Generate a natural language explanation of a building cost calculation',
  parameters: [calculationDataParam],
  returnType: 'STRING'
};

// Function implementations
async function predictBuildingCostImpl(params: any) {
  const { buildingType, squareFootage, region, condition, yearBuilt, features, costFactors } = params;
  
  return aiService.predictBuildingCost({
    buildingType,
    squareFootage,
    region,
    condition,
    yearBuilt,
    features,
    costFactors
  });
}

async function analyzeCostMatrixImpl(params: any) {
  const { matrixData } = params;
  return aiService.analyzeCostMatrix(matrixData);
}

async function explainCalculationImpl(params: any) {
  const { calculationData } = params;
  return aiService.explainCalculation(calculationData);
}

// Register the functions with the registry
export function registerBuildingCostFunctions() {
  functionRegistry.registerFunction(predictCostFunction, predictBuildingCostImpl);
  functionRegistry.registerFunction(analyzeCostMatrixFunction, analyzeCostMatrixImpl);
  functionRegistry.registerFunction(explainCalculationFunction, explainCalculationImpl);
  
  console.log('Building cost functions registered successfully');
}

// Export the individual function implementations for testing
export {
  predictBuildingCostImpl,
  analyzeCostMatrixImpl,
  explainCalculationImpl
};