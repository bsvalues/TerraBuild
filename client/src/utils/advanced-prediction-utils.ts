import { apiRequest } from '@/lib/queryClient';

// Types for prediction input and results
export interface PredictionInput {
  buildingType: string;
  region: string;
  squareFootage: number;
  quality: string;
  complexity: string;
}

export interface PredictionResult {
  cost: number;
  costPerSqFt: number;
  confidence: number;
  error: number;
  confidenceInterval: [number, number];
  factors: {
    [key: string]: number;
  };
}

export interface FeatureImportance {
  name: string;
  impact: number;
  direction: 'positive' | 'negative';
  description: string;
}

export interface WhatIfParameter {
  parameter: string;
  values: any[];
}

export interface WhatIfResult {
  baselinePrediction: PredictionResult;
  variations: {
    parameter: string;
    parameterValue: any;
    prediction: PredictionResult;
    percentChange: number;
  }[];
}

export interface SensitivityAnalysisResult {
  parameter: string;
  sensitivity: number;
  description: string;
}

/**
 * Predict cost with confidence metrics
 * @param input PredictionInput containing building specifications
 * @returns Promise with PredictionResult including cost, confidence, and error margins
 */
export async function predictCostWithConfidence(input: PredictionInput): Promise<PredictionResult> {
  try {
    const response = await apiRequest<PredictionResult>({
      method: 'POST',
      url: '/api/ai/predict-cost-advanced',
      data: input
    });
    
    return response;
  } catch (error) {
    console.error('Error in advanced cost prediction:', error);
    // Return mock data for development purposes only
    // In production, handle the error appropriately
    return {
      cost: 0,
      costPerSqFt: 0,
      confidence: 0,
      error: 1,
      confidenceInterval: [0, 0],
      factors: {}
    };
  }
}

/**
 * Get the most influential factors for a building type
 * @param buildingType The building type to analyze
 * @returns Promise with FeatureImportance[] representing influential factors
 */
export async function getInfluentialFactors(buildingType: string): Promise<FeatureImportance[]> {
  try {
    const response = await apiRequest<FeatureImportance[]>({
      method: 'GET',
      url: `/api/ai/factor-importance?buildingType=${encodeURIComponent(buildingType)}`
    });
    
    return response;
  } catch (error) {
    console.error('Error getting influential factors:', error);
    // Return mock data for development purposes only
    return [];
  }
}

/**
 * Perform what-if analysis by varying parameters
 * @param baseInput Base building specifications
 * @param parameters Parameters to vary and their possible values
 * @returns Promise with WhatIfResult showing impact of variations
 */
export async function performWhatIfAnalysis(
  baseInput: PredictionInput,
  parameters: WhatIfParameter[]
): Promise<WhatIfResult> {
  try {
    const response = await apiRequest<WhatIfResult>({
      method: 'POST',
      url: '/api/ai/what-if-analysis',
      data: {
        baseInput,
        parameters
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error in what-if analysis:', error);
    // Return mock data for development purposes only
    return {
      baselinePrediction: {
        cost: 0,
        costPerSqFt: 0,
        confidence: 0,
        error: 0,
        confidenceInterval: [0, 0],
        factors: {}
      },
      variations: []
    };
  }
}

/**
 * Generate sensitivity analysis for input parameters
 * @param input Building specifications
 * @returns Promise with SensitivityAnalysisResult[] showing parameter sensitivities
 */
export async function generateSensitivityAnalysis(
  input: PredictionInput
): Promise<SensitivityAnalysisResult[]> {
  try {
    const response = await apiRequest<SensitivityAnalysisResult[]>({
      method: 'POST',
      url: '/api/ai/sensitivity-analysis',
      data: input
    });
    
    return response;
  } catch (error) {
    console.error('Error in sensitivity analysis:', error);
    // Return mock data for development purposes only
    return [];
  }
}

/**
 * Validate the prediction model's performance
 * @returns Promise with validation metrics
 */
export async function getModelValidation(): Promise<{
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
}> {
  try {
    const response = await apiRequest<{
      accuracy: number;
      precision: number;
      recall: number;
      f1Score: number;
    }>({
      method: 'GET',
      url: '/api/ai/model-validation'
    });
    
    return response;
  } catch (error) {
    console.error('Error getting model validation:', error);
    // Return mock data for development purposes only
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0
    };
  }
}

/**
 * Validate a specific prediction against historical data
 * @param predictionInput The prediction input to validate
 * @param actualCost The actual cost (if known)
 * @returns Promise with validation results
 */
export async function validatePrediction(
  predictionInput: PredictionInput,
  actualCost?: number
): Promise<{
  isValid: boolean;
  confidence: number;
  similarCases: number;
  averageError: number;
}> {
  try {
    const response = await apiRequest<{
      isValid: boolean;
      confidence: number;
      similarCases: number;
      averageError: number;
    }>({
      method: 'POST',
      url: '/api/ai/validate-prediction',
      data: {
        predictionInput,
        actualCost
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error validating prediction:', error);
    // Return mock data for development purposes only
    return {
      isValid: false,
      confidence: 0,
      similarCases: 0,
      averageError: 0
    };
  }
}