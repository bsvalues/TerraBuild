/**
 * AI-Powered Cost Prediction Engine
 * 
 * This module provides functions for predicting building costs using AI/ML techniques,
 * including multi-variable regression models and integration with OpenAI API for
 * enhanced cost predictions and explanations.
 */

import { z } from 'zod';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import { IStorage } from '../storage';

// Load environment variables
dotenv.config();

// Initialize cache for prediction results (TTL: 30 minutes)
const predictionCache = new NodeCache({ stdTTL: 1800, checkperiod: 120 });

// OpenAI client initialization
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

// Schema for prediction requests
export const costPredictionRequestSchema = z.object({
  buildingType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL']),
  region: z.string(),
  squareFootage: z.number().positive(),
  quality: z.enum(['ECONOMY', 'AVERAGE', 'GOOD', 'PREMIUM', 'LUXURY']).optional(),
  buildingAge: z.number().min(0).optional(),
  yearBuilt: z.number().min(1900).optional(),
  complexityFactor: z.number().min(0.5).max(1.5).optional(),
  conditionFactor: z.number().min(0.5).max(1.5).optional(),
  targetYear: z.number().min(2023).max(2050).optional(),
  features: z.array(z.string()).optional(),
});

// Types for prediction results
export interface PredictionFeatureImportance {
  feature: string;
  importance: number; // 0-1 scale
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface PredictionResult {
  predictedCost: number;
  totalCost: number;
  costPerSquareFoot: number;
  confidenceInterval: [number, number];
  confidenceScore: number; // 0-1 value indicating confidence
  yearPredicted: number;
  predictionFactors: PredictionFeatureImportance[];
  materialRecommendations?: MaterialSubstitutionRecommendation[];
  errorMargin: number; // Percentage
  timestamp: string;
}

export interface MaterialSubstitutionRecommendation {
  originalMaterial: string;
  suggestedAlternative: string;
  potentialSavings: number;
  qualityImpact: 'none' | 'minor' | 'moderate' | 'significant';
  sustainabilityScore: number; // 0-100
  reasonForRecommendation: string;
}

// Helper class for the basic statistical model
class MultiVariableRegressionModel {
  private coefficients: Record<string, number> = {};
  private intercept: number = 0;
  private features: string[] = [];
  private trainingDataSize: number = 0;
  private rSquared: number = 0;
  private standardError: number = 0;
  
  constructor(initialCoefficients?: Record<string, number>, intercept?: number) {
    if (initialCoefficients) {
      this.coefficients = initialCoefficients;
      this.features = Object.keys(initialCoefficients);
    }
    if (intercept !== undefined) {
      this.intercept = intercept;
    }
  }
  
  // Fit model to training data
  public async train(data: Array<Record<string, number | string>>, targetVariable: string): Promise<void> {
    // Implementation would use linear algebra libraries for matrix operations
    // For now, we'll use pre-defined coefficients as a placeholder
    
    this.features = Object.keys(data[0]).filter(key => key !== targetVariable);
    this.trainingDataSize = data.length;
    
    // Placeholder coefficients based on domain knowledge
    this.coefficients = {
      'squareFootage': 1.2,
      'buildingAge': -0.5,
      'complexityFactor': 0.8,
      'conditionFactor': 0.7,
      'qualityScore': 1.5,
      'regionFactor': 0.6
    };
    
    this.intercept = 100; // Base cost intercept
    this.rSquared = 0.85; // Placeholder R-squared value
    this.standardError = 10; // Placeholder standard error
  }
  
  // Make prediction with input features
  public predict(features: Record<string, number | string>): {
    prediction: number;
    confidenceInterval: [number, number];
  } {
    let prediction = this.intercept;
    
    // Apply coefficients to features
    for (const [feature, coefficient] of Object.entries(this.coefficients)) {
      if (feature in features && typeof features[feature] === 'number') {
        prediction += coefficient * (features[feature] as number);
      }
    }
    
    // Calculate confidence interval (simplified)
    const marginOfError = 1.96 * this.standardError;
    const confidenceInterval: [number, number] = [
      Math.max(0, prediction - marginOfError),
      prediction + marginOfError
    ];
    
    return { prediction, confidenceInterval };
  }
  
  // Get model performance metrics
  public getMetrics(): { rSquared: number; standardError: number; dataPoints: number } {
    return {
      rSquared: this.rSquared,
      standardError: this.standardError,
      dataPoints: this.trainingDataSize
    };
  }
  
  // Get feature importance
  public getFeatureImportance(): Record<string, number> {
    const totalImpact = Object.values(this.coefficients).reduce((sum, coef) => sum + Math.abs(coef), 0);
    
    const importance: Record<string, number> = {};
    for (const [feature, coefficient] of Object.entries(this.coefficients)) {
      importance[feature] = Math.abs(coefficient) / totalImpact;
    }
    
    return importance;
  }
}

// The main prediction engine
class AIBuildingCostPredictionEngine {
  private storage: IStorage | null = null;
  private baseModel: MultiVariableRegressionModel;
  private modelTrained: boolean = false;
  
  constructor(storage?: IStorage) {
    if (storage) {
      this.storage = storage;
    }
    
    // Initialize base statistical model
    this.baseModel = new MultiVariableRegressionModel();
  }
  
  // Test connection to OpenAI API
  public async testConnection() {
    if (!openai) {
      return { status: 'not_configured', message: 'OpenAI API key not configured' };
    }
    
    try {
      // Simple test request to verify API access
      await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Simple connection test' }],
        max_tokens: 5
      });
      
      return { status: 'connected', message: 'Successfully connected to OpenAI API' };
    } catch (error: any) {
      return { 
        status: 'error', 
        message: `Failed to connect to OpenAI API: ${error.message}` 
      };
    }
  }
  
  // Train the base statistical model with historical data
  public async trainModel() {
    if (!this.storage) {
      throw new Error('Storage not initialized for training data access');
    }
    
    try {
      // Get all cost matrix data from storage
      const costMatrixData = await this.storage.getAllCostMatrix();
      
      // Convert to array if single object was returned
      const matrixData = Array.isArray(costMatrixData) ? costMatrixData : [costMatrixData];
      
      if (!matrixData || matrixData.length === 0) {
        throw new Error('No cost matrix data available for training');
      }
      
      // Transform data for training
      const trainingData = matrixData.map((entry: any) => ({
        squareFootage: 1000, // Placeholder, would come from historical projects
        buildingAge: 0,
        complexityFactor: 1,
        conditionFactor: 1,
        qualityScore: this.mapQualityToScore(entry.quality || 'AVERAGE'),
        regionFactor: this.getRegionalFactor(entry.region),
        baseCost: entry.baseCost
      }));
      
      // Train the model
      await this.baseModel.train(trainingData, 'baseCost');
      this.modelTrained = true;
      
      return { 
        success: true, 
        metrics: this.baseModel.getMetrics() 
      };
    } catch (error: any) {
      console.error('Error training prediction model:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  // Generate a detailed cost prediction using combined approach:
  // 1. Base statistical model
  // 2. Enhanced with OpenAI for complex factors and explanations
  public async generateCostPrediction(
    buildingType: string,
    region: string,
    targetYear: number = new Date().getFullYear() + 1,
    options: {
      squareFootage?: number;
      quality?: string;
      buildingAge?: number;
      complexityFactor?: number;
      conditionFactor?: number;
      features?: string[];
    } = {}
  ): Promise<PredictionResult | { error: { message: string } }> {
    // Check for cached prediction
    const cacheKey = `prediction:${buildingType}:${region}:${targetYear}:${JSON.stringify(options)}`;
    const cachedResult = predictionCache.get<PredictionResult>(cacheKey);
    
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Validate inputs
      if (!['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].includes(buildingType)) {
        throw new Error(`Invalid building type: ${buildingType}`);
      }
      
      if (targetYear < new Date().getFullYear() || targetYear > 2050) {
        throw new Error(`Target year must be between current year and 2050`);
      }
      
      // Default values
      const squareFootage = options.squareFootage || 2000;
      const quality = options.quality || 'AVERAGE';
      const buildingAge = options.buildingAge || 0;
      const complexityFactor = options.complexityFactor || 1.0;
      const conditionFactor = options.conditionFactor || 1.0;
      const features = options.features || [];
      
      // Ensure model is trained
      if (!this.modelTrained && this.storage) {
        await this.trainModel();
      }
      
      // 1. Get base prediction from statistical model
      const inputFeatures = {
        squareFootage,
        buildingAge,
        complexityFactor,
        conditionFactor,
        qualityScore: this.mapQualityToScore(quality),
        regionFactor: this.getRegionalFactor(region)
      };
      
      const baseResult = this.baseModel.predict(inputFeatures);
      const baseFeatureImportance = this.baseModel.getFeatureImportance();
      
      // 2. If OpenAI is available, enhance prediction with AI insights
      let enhancedPrediction = baseResult.prediction;
      let confidenceScore = 0.85; // Default confidence
      let predictionFactors: PredictionFeatureImportance[] = [];
      let materialRecommendations: MaterialSubstitutionRecommendation[] = [];
      
      if (openai) {
        // Get AI-enhanced prediction and explanations
        const aiEnhancement = await this.getAIEnhancedPrediction(
          buildingType,
          region,
          squareFootage,
          targetYear,
          quality,
          buildingAge,
          complexityFactor,
          conditionFactor,
          features,
          baseResult.prediction
        );
        
        if (aiEnhancement) {
          // Blend base statistical and AI predictions (70/30 weight)
          enhancedPrediction = (baseResult.prediction * 0.7) + (aiEnhancement.adjustedCost * 0.3);
          confidenceScore = aiEnhancement.confidenceScore;
          predictionFactors = aiEnhancement.factors;
          
          if (aiEnhancement.materialRecommendations) {
            materialRecommendations = aiEnhancement.materialRecommendations;
          }
        }
      } else {
        // If AI enhancement unavailable, create basic factors from statistical model
        predictionFactors = Object.entries(baseFeatureImportance).map(([feature, importance]) => ({
          feature: this.formatFeatureName(feature),
          importance,
          impact: importance > 0.15 ? 'positive' : importance < 0.1 ? 'negative' : 'neutral',
          explanation: `${this.formatFeatureName(feature)} contributes ${(importance * 100).toFixed(1)}% to the overall cost prediction.`
        }));
      }
      
      // Calculate cost per square foot
      const costPerSquareFoot = enhancedPrediction / squareFootage;
      
      // Prepare final prediction result
      const result: PredictionResult = {
        predictedCost: baseResult.prediction,
        totalCost: enhancedPrediction,
        costPerSquareFoot,
        confidenceInterval: baseResult.confidenceInterval,
        confidenceScore,
        yearPredicted: targetYear,
        predictionFactors,
        materialRecommendations: materialRecommendations.length > 0 ? materialRecommendations : undefined,
        errorMargin: (1 - confidenceScore) * 100,
        timestamp: new Date().toISOString()
      };
      
      // Cache the result
      predictionCache.set(cacheKey, result);
      
      return result;
    } catch (error: any) {
      console.error('Error generating cost prediction:', error);
      return { 
        error: { 
          message: error.message || 'Failed to generate prediction' 
        } 
      };
    }
  }
  
  // Get AI-enhanced prediction using OpenAI
  private async getAIEnhancedPrediction(
    buildingType: string,
    region: string,
    squareFootage: number,
    targetYear: number,
    quality: string,
    buildingAge: number,
    complexityFactor: number,
    conditionFactor: number,
    features: string[],
    basePrediction: number
  ): Promise<{
    adjustedCost: number;
    confidenceScore: number;
    factors: PredictionFeatureImportance[];
    materialRecommendations?: MaterialSubstitutionRecommendation[];
  } | null> {
    if (!openai) {
      return null;
    }
    
    try {
      // Create prompt for GPT to enhance the prediction
      const prompt = `
      You are an expert construction cost estimator with decades of experience in the building industry.
      I need you to provide an enhanced cost prediction and explanation for the following building:
      
      Building Type: ${buildingType}
      Region: ${region}
      Square Footage: ${squareFootage}
      Target Year: ${targetYear}
      Quality Level: ${quality}
      Building Age: ${buildingAge} years
      Complexity Factor: ${complexityFactor}
      Condition Factor: ${conditionFactor}
      Additional Features: ${features.join(', ') || 'None specified'}
      
      Base Statistical Prediction: $${basePrediction.toFixed(2)}
      
      Please provide:
      1. An adjusted cost prediction taking into account market trends, inflation, and regional factors
      2. A confidence score between 0 and 1 for this prediction
      3. The top 3-5 factors affecting this price, with their importance (0-1), impact (positive/negative/neutral), and an explanation
      4. Optional: 2-3 material substitution recommendations to reduce costs while maintaining quality
      
      Format your response as a JSON object without any additional text.
      `;
      
      // Get completion from OpenAI
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.5,
        response_format: { type: 'json_object' }
      });
      
      // Extract and parse JSON response
      const response = completion.choices[0]?.message.content;
      if (!response) {
        throw new Error('Empty response from OpenAI API');
      }
      
      try {
        const parsedResponse = JSON.parse(response);
        
        // Structure the factors consistently
        const factors: PredictionFeatureImportance[] = (parsedResponse.factors || []).map((factor: any) => ({
          feature: factor.feature || factor.name || 'Unknown factor',
          importance: typeof factor.importance === 'number' ? factor.importance : 0.5,
          impact: factor.impact || 'neutral',
          explanation: factor.explanation || `This factor affects the building cost.`
        }));
        
        // Structure material recommendations if present
        let materialRecommendations: MaterialSubstitutionRecommendation[] = [];
        if (parsedResponse.materialRecommendations && Array.isArray(parsedResponse.materialRecommendations)) {
          materialRecommendations = parsedResponse.materialRecommendations.map((rec: any) => ({
            originalMaterial: rec.originalMaterial || rec.original || 'Standard material',
            suggestedAlternative: rec.suggestedAlternative || rec.alternative || 'Alternative material',
            potentialSavings: typeof rec.potentialSavings === 'number' ? rec.potentialSavings : 0,
            qualityImpact: rec.qualityImpact || 'minor',
            sustainabilityScore: typeof rec.sustainabilityScore === 'number' ? rec.sustainabilityScore : 50,
            reasonForRecommendation: rec.reasonForRecommendation || rec.reason || 'Cost savings'
          }));
        }
        
        return {
          adjustedCost: parsedResponse.adjustedCost || parsedResponse.predictedCost || basePrediction,
          confidenceScore: parsedResponse.confidenceScore || 0.8,
          factors,
          materialRecommendations: materialRecommendations.length > 0 ? materialRecommendations : undefined
        };
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        return null;
      }
    } catch (error) {
      console.error('Error getting AI-enhanced prediction:', error);
      return null;
    }
  }
  
  // Helper functions
  private mapQualityToScore(quality: string): number {
    const qualityMap: Record<string, number> = {
      'ECONOMY': 0.6,
      'AVERAGE': 1.0,
      'GOOD': 1.2,
      'PREMIUM': 1.5,
      'LUXURY': 2.0
    };
    
    return qualityMap[quality] || 1.0;
  }
  
  private getRegionalFactor(region: string): number {
    // Simplified regional factors based on common cost variations
    // In a real app, these would be sourced from a database
    const regionMap: Record<string, number> = {
      'Northeast': 1.2,
      'West': 1.15,
      'Midwest': 0.95,
      'South': 0.9,
      'Benton County': 1.05,
      'Franklin County': 1.02,
      'Eastern Washington': 1.0,
      'Western Washington': 1.12
    };
    
    // Default to 1.0 for unknown regions
    return regionMap[region] || 1.0;
  }
  
  private formatFeatureName(feature: string): string {
    // Convert camelCase to Title Case with spaces
    const formatted = feature
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
    
    return formatted;
  }
}

// Create and export the prediction engine instance
const predictionEngine = new AIBuildingCostPredictionEngine();

export default predictionEngine;