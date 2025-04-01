/**
 * MCP Schemas
 * 
 * This file contains JSON schema definitions for the Building Cost Building System
 * following the Model Content Protocol (MCP) principles. Each schema defines
 * the structure, constraints, and validation rules for a specific data type.
 */

import { JSONSchemaType } from 'ajv';

/**
 * Cost Matrix schema definition
 * Represents a building cost matrix entry in the system
 */
export interface CostMatrix {
  id: number;
  region: string;
  buildingType: string;
  baseCost: number;
  county: string;
  state: string;
  complexityFactorBase: number;
  qualityFactorBase: number;
  conditionFactorBase: number;
  year: number;
}

export const costMatrixSchema: JSONSchemaType<CostMatrix> = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    region: { type: 'string' },
    buildingType: { type: 'string' },
    baseCost: { type: 'number', minimum: 0 },
    county: { type: 'string' },
    state: { type: 'string' },
    complexityFactorBase: { type: 'number', minimum: 0 },
    qualityFactorBase: { type: 'number', minimum: 0 },
    conditionFactorBase: { type: 'number', minimum: 0 },
    year: { type: 'integer', minimum: 2000 }
  },
  required: [
    'id', 
    'region', 
    'buildingType', 
    'baseCost', 
    'county', 
    'state', 
    'complexityFactorBase',
    'qualityFactorBase',
    'conditionFactorBase',
    'year'
  ],
  additionalProperties: false
};

/**
 * Building Type schema definition
 * Represents a building type with its characteristics
 */
export interface BuildingType {
  code: string;
  name: string;
  description: string;
  category: string;
  defaultComplexity: number;
}

export const buildingTypeSchema: JSONSchemaType<BuildingType> = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string' },
    category: { type: 'string' },
    defaultComplexity: { type: 'number', minimum: 0 }
  },
  required: ['code', 'name', 'description', 'category', 'defaultComplexity'],
  additionalProperties: false
};

/**
 * Region schema definition
 * Represents a geographic region with cost factors
 */
export interface Region {
  code: string;
  name: string;
  state: string;
  costFactor: number;
  description?: string;
}

export const regionSchema: JSONSchemaType<Region> = {
  type: 'object',
  properties: {
    code: { type: 'string' },
    name: { type: 'string' },
    state: { type: 'string' },
    costFactor: { type: 'number', minimum: 0 },
    description: { type: 'string', nullable: true }
  },
  required: ['code', 'name', 'state', 'costFactor'],
  additionalProperties: false
};

/**
 * Building Calculation Input schema definition
 * Represents input parameters for building cost calculation
 */
export interface BuildingCalculationInput {
  region: string;
  buildingType: string;
  squareFootage: number;
  complexityFactor: number;
  conditionFactor: number;
  yearBuilt: number;
  condition?: string;
  materials?: string[];
  qualityGrade?: string;
  stories?: number;
  occupancyType?: string;
}

export const buildingCalculationInputSchema: JSONSchemaType<BuildingCalculationInput> = {
  type: 'object',
  properties: {
    region: { type: 'string' },
    buildingType: { type: 'string' },
    squareFootage: { type: 'number', minimum: 0 },
    complexityFactor: { type: 'number', minimum: 0 },
    conditionFactor: { type: 'number', minimum: 0 },
    yearBuilt: { type: 'integer', minimum: 1800 },
    condition: { type: 'string', nullable: true },
    materials: { type: 'array', items: { type: 'string' }, nullable: true },
    qualityGrade: { type: 'string', nullable: true },
    stories: { type: 'integer', nullable: true, minimum: 1 },
    occupancyType: { type: 'string', nullable: true }
  },
  required: [
    'region',
    'buildingType',
    'squareFootage',
    'complexityFactor',
    'conditionFactor',
    'yearBuilt'
  ],
  additionalProperties: false
};

/**
 * Building Calculation Result schema definition
 * Represents the result of a building cost calculation
 */
export interface BuildingCalculationResult {
  baseCost: number;
  adjustedCost?: number;
  totalCost: number;
  regionalFactor?: number;
  buildingTypeFactor?: number;
  complexityAdjustment?: number;
  conditionAdjustment?: number;
  depreciationAdjustment?: number;
  depreciationRate?: number;
  materialCosts?: Record<string, number>;
  breakdown?: Record<string, number>;
  error?: string;
}

export const buildingCalculationResultSchema: JSONSchemaType<BuildingCalculationResult> = {
  type: 'object',
  properties: {
    baseCost: { type: 'number', minimum: 0 },
    adjustedCost: { type: 'number', nullable: true, minimum: 0 },
    totalCost: { type: 'number', minimum: 0 },
    regionalFactor: { type: 'number', nullable: true },
    buildingTypeFactor: { type: 'number', nullable: true },
    complexityAdjustment: { type: 'number', nullable: true },
    conditionAdjustment: { type: 'number', nullable: true },
    depreciationAdjustment: { type: 'number', nullable: true },
    depreciationRate: { type: 'number', nullable: true },
    materialCosts: {
      type: 'object',
      nullable: true,
      additionalProperties: { type: 'number' }
    },
    breakdown: {
      type: 'object',
      nullable: true,
      additionalProperties: { type: 'number' }
    },
    error: { type: 'string', nullable: true }
  },
  required: ['baseCost', 'totalCost'],
  additionalProperties: false
};