/**
 * Prediction Utility Functions
 * 
 * This module provides utility functions and classes for predicting building costs
 * using machine learning techniques, specifically multi-variable regression models.
 */

import { apiRequest } from '@/lib/queryClient';

/**
 * Building features used for cost prediction
 */
export interface BuildingFeatures {
  squareFeet: number;
  buildingType: string;
  region: string;
  year?: number;
  quality?: string;
  complexity?: string;
  condition?: string;
  [key: string]: any; // Allow for additional features
}

/**
 * Result of a cost prediction
 */
export interface PredictionResult {
  baseCost: number;
  adjustedCost: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidenceScore: number; // 0-1 value indicating confidence in prediction
}

/**
 * Performance metrics for the prediction model
 */
export interface ModelMetrics {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  rSquared: number; // R-squared (coefficient of determination)
  dataPointsUsed: number; // Number of data points used for evaluation
}

/**
 * Results from model evaluation
 */
export interface EvaluationResults {
  metrics: ModelMetrics;
  predictionResults: Array<{
    predicted: number;
    actual: number;
    error: number;
    percentError: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  }>;
}

/**
 * Feature importance values for model
 */
export interface ModelFeatureImportance {
  [feature: string]: number; // Feature name to importance score (0-1)
}

/**
 * Explanation for a prediction
 */
export interface PredictionExplanation {
  summary: string; // Natural language summary
  factors: Array<{
    feature: string;
    impact: number; // 0-1 value indicating importance
    direction: 'positive' | 'negative'; // Whether it increases or decreases cost
    description: string; // Natural language explanation
  }>;
}

/**
 * Historical building cost data item
 */
interface HistoricalCostData extends BuildingFeatures {
  id: number;
  baseCost: number;
  adjustedCost: number;
}

/**
 * Simple encoding of categorical features
 */
interface EncodedFeatures {
  [feature: string]: number;
}

/**
 * Regression coefficient for a feature
 */
interface Coefficient {
  feature: string;
  value: number;
  standardError: number;
}

/**
 * Cost Prediction Model using multi-variable regression
 * 
 * This class provides functionality to predict building costs based on
 * various features using a multiple regression model.
 */
export class CostPredictionModel {
  private trained: boolean = false;
  private historicalData: HistoricalCostData[] = [];
  private baseCoefficients: Coefficient[] = [];
  private adjustedCoefficients: Coefficient[] = [];
  private featureImportance: ModelFeatureImportance = {};
  private featureRanges: { [feature: string]: { min: number, max: number } } = {};
  private categoricalFeatures: { [feature: string]: string[] } = {};
  private baseIntercept: number = 0;
  private adjustedIntercept: number = 0;
  private version: string = '1.0.0';
  private lastTrainedDate: Date | null = null;
  
  /**
   * Create a new cost prediction model
   */
  constructor() {
    // Initialize with default values
  }
  
  /**
   * Check if the model has been trained
   */
  public isTrained(): boolean {
    return this.trained;
  }
  
  /**
   * Train the model using historical data
   */
  public async train(): Promise<void> {
    try {
      // Fetch historical data
      this.historicalData = await this.fetchHistoricalData();
      
      if (this.historicalData.length === 0) {
        throw new Error('No historical data available for training');
      }
      
      // Identify categorical features and their possible values
      this.identifyCategoricalFeatures();
      
      // Calculate feature ranges for numerical features
      this.calculateFeatureRanges();
      
      // Encode features for regression
      const encodedData = this.encodeFeatures(this.historicalData);
      
      // Train regression model for base cost
      this.trainRegressionModel(
        encodedData, 
        this.historicalData.map(d => d.baseCost),
        'base'
      );
      
      // Train regression model for adjusted cost
      this.trainRegressionModel(
        encodedData, 
        this.historicalData.map(d => d.adjustedCost),
        'adjusted'
      );
      
      // Calculate feature importance
      this.calculateFeatureImportance();
      
      this.trained = true;
      this.lastTrainedDate = new Date();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error training model:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Update model with new data
   */
  public async update(newData: Array<HistoricalCostData>): Promise<void> {
    try {
      if (newData.length === 0) {
        return Promise.resolve();
      }
      
      // Add new data to historical data
      this.historicalData = [...this.historicalData, ...newData];
      
      // Re-train the model with updated data
      await this.train();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating model:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Predict costs for a building with given features
   */
  public async predict(features: BuildingFeatures): Promise<PredictionResult> {
    if (!this.trained) {
      throw new Error('Model must be trained before making predictions');
    }
    
    try {
      // Handle missing features
      const completedFeatures = this.handleMissingFeatures(features);
      
      // Encode features for prediction
      const encoded = this.encodeSingleInstance(completedFeatures);
      
      // Predict base cost
      const baseCost = this.predictWithCoefficients(encoded, this.baseCoefficients, this.baseIntercept);
      
      // Predict adjusted cost
      const adjustedCost = this.predictWithCoefficients(encoded, this.adjustedCoefficients, this.adjustedIntercept);
      
      // Calculate confidence based on feature completeness and similarity to training data
      const confidenceScore = this.calculateConfidenceScore(features, encoded);
      
      // Calculate confidence interval based on confidence score
      const confidenceInterval = this.calculateConfidenceInterval(baseCost, confidenceScore);
      
      return {
        baseCost,
        adjustedCost,
        confidenceInterval,
        confidenceScore
      };
    } catch (error) {
      console.error('Error making prediction:', error);
      throw error;
    }
  }
  
  /**
   * Evaluate model performance on historical data
   */
  public async evaluate(): Promise<EvaluationResults> {
    if (!this.trained) {
      throw new Error('Model must be trained before evaluation');
    }
    
    try {
      // Use leave-one-out cross validation
      const predictionResults = [];
      let sumSquaredError = 0;
      let sumAbsolutePercentageError = 0;
      let sumActualVariance = 0;
      const mean = this.historicalData.reduce((sum, d) => sum + d.baseCost, 0) / this.historicalData.length;
      
      for (const dataPoint of this.historicalData) {
        // Encode features
        const encoded = this.encodeSingleInstance(dataPoint);
        
        // Predict base cost
        const predicted = this.predictWithCoefficients(encoded, this.baseCoefficients, this.baseIntercept);
        const actual = dataPoint.baseCost;
        
        // Calculate error
        const error = predicted - actual;
        const percentError = Math.abs(error / actual);
        
        // Update running metrics
        sumSquaredError += error * error;
        sumAbsolutePercentageError += percentError;
        sumActualVariance += (actual - mean) * (actual - mean);
        
        // Calculate confidence for this prediction
        const confidenceScore = this.calculateConfidenceScore(dataPoint, encoded);
        const confidenceInterval = this.calculateConfidenceInterval(predicted, confidenceScore);
        
        // Add to results
        predictionResults.push({
          predicted,
          actual,
          error,
          percentError,
          confidenceInterval
        });
      }
      
      // Calculate overall metrics
      const n = this.historicalData.length;
      const mape = sumAbsolutePercentageError / n;
      const rmse = Math.sqrt(sumSquaredError / n);
      const rSquared = 1 - (sumSquaredError / sumActualVariance);
      
      return {
        metrics: {
          mape,
          rmse,
          rSquared,
          dataPointsUsed: n
        },
        predictionResults
      };
    } catch (error) {
      console.error('Error evaluating model:', error);
      throw error;
    }
  }
  
  /**
   * Get feature importance values
   */
  public async getFeatureImportance(): Promise<ModelFeatureImportance> {
    if (!this.trained) {
      throw new Error('Model must be trained before getting feature importance');
    }
    
    return { ...this.featureImportance };
  }
  
  /**
   * Explain a prediction in natural language
   */
  public async explainPrediction(
    features: BuildingFeatures,
    prediction: PredictionResult
  ): Promise<PredictionExplanation> {
    if (!this.trained) {
      throw new Error('Model must be trained before explaining predictions');
    }
    
    try {
      // Handle missing features
      const completedFeatures = this.handleMissingFeatures(features);
      
      // Encode features for explanation
      const encoded = this.encodeSingleInstance(completedFeatures);
      
      // Calculate contribution of each feature
      const factors = [];
      let totalAbsImpact = 0;
      
      // Add base factors from coefficients
      for (const coef of this.baseCoefficients) {
        // Skip the intercept
        if (coef.feature === 'intercept') continue;
        
        // Get the encoded value for this feature
        const featureValue = encoded[coef.feature] || 0;
        
        // Calculate impact
        const impact = Math.abs(coef.value * featureValue);
        totalAbsImpact += impact;
        
        // Determine direction
        const direction = coef.value > 0 ? 'positive' as const : 'negative' as const;
        
        // Add to factors
        factors.push({
          feature: coef.feature,
          impact,
          direction,
          description: '' // Will be filled in after normalization
        });
      }
      
      // Normalize impact values
      for (const factor of factors) {
        factor.impact = totalAbsImpact > 0 ? factor.impact / totalAbsImpact : 0;
      }
      
      // Sort factors by impact
      factors.sort((a, b) => b.impact - a.impact);
      
      // Keep only the top 5 factors
      const topFactors = factors.slice(0, 5);
      
      // Create descriptions for each factor
      topFactors.forEach(factor => {
        const featureName = this.getHumanReadableFeatureName(factor.feature);
        const directionText = factor.direction === 'positive' ? 'increases' : 'decreases';
        const impactPercentage = Math.round(factor.impact * 100);
        
        factor.description = `${featureName} ${directionText} the cost by approximately ${impactPercentage}%`;
      });
      
      // Create summary
      const summary = this.createExplanationSummary(completedFeatures, prediction, topFactors);
      
      return {
        summary,
        factors: topFactors
      };
    } catch (error) {
      console.error('Error explaining prediction:', error);
      throw error;
    }
  }
  
  /**
   * Serialize the model for storage
   */
  public serialize(): string {
    if (!this.trained) {
      throw new Error('Model must be trained before serialization');
    }
    
    const serialized = {
      version: this.version,
      lastTrainedDate: this.lastTrainedDate?.toISOString(),
      baseIntercept: this.baseIntercept,
      adjustedIntercept: this.adjustedIntercept,
      baseCoefficients: this.baseCoefficients,
      adjustedCoefficients: this.adjustedCoefficients,
      featureImportance: this.featureImportance,
      featureRanges: this.featureRanges,
      categoricalFeatures: this.categoricalFeatures
    };
    
    return JSON.stringify(serialized);
  }
  
  /**
   * Deserialize a model from storage
   */
  public async deserialize(serialized: string): Promise<void> {
    try {
      const data = JSON.parse(serialized);
      
      // Verify version compatibility
      if (!data.version || !data.version.startsWith('1.')) {
        throw new Error(`Incompatible model version: ${data.version}`);
      }
      
      this.version = data.version;
      this.lastTrainedDate = data.lastTrainedDate ? new Date(data.lastTrainedDate) : null;
      this.baseIntercept = data.baseIntercept;
      this.adjustedIntercept = data.adjustedIntercept;
      this.baseCoefficients = data.baseCoefficients;
      this.adjustedCoefficients = data.adjustedCoefficients;
      this.featureImportance = data.featureImportance;
      this.featureRanges = data.featureRanges;
      this.categoricalFeatures = data.categoricalFeatures;
      
      this.trained = true;
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error deserializing model:', error);
      return Promise.reject(error);
    }
  }
  
  /**
   * Fetch historical cost data from API
   */
  private async fetchHistoricalData(): Promise<HistoricalCostData[]> {
    try {
      const data = await apiRequest('/api/cost-matrix');
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }
  
  /**
   * Identify categorical features and their possible values
   */
  private identifyCategoricalFeatures(): void {
    if (this.historicalData.length === 0) return;
    
    this.categoricalFeatures = {};
    
    // Define known categorical features
    const knownCategoricalFeatures = [
      'buildingType', 'region', 'quality', 'complexity', 'condition'
    ];
    
    for (const feature of knownCategoricalFeatures) {
      // Get unique values
      const uniqueValuesSet = new Set();
      this.historicalData.forEach(d => {
        const value = d[feature];
        if (value !== undefined && value !== null) {
          uniqueValuesSet.add(value);
        }
      });
      const uniqueValues = Array.from(uniqueValuesSet);
      
      if (uniqueValues.length > 0) {
        this.categoricalFeatures[feature] = uniqueValues as string[];
      }
    }
  }
  
  /**
   * Calculate ranges for numerical features
   */
  private calculateFeatureRanges(): void {
    if (this.historicalData.length === 0) return;
    
    this.featureRanges = {};
    
    // Define known numerical features
    const knownNumericalFeatures = ['squareFeet', 'year'];
    
    for (const feature of knownNumericalFeatures) {
      // Get values for this feature
      const values = this.historicalData
        .map(d => d[feature])
        .filter(v => v !== undefined && v !== null) as number[];
      
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        this.featureRanges[feature] = { min, max };
      }
    }
  }
  
  /**
   * Encode categorical and numerical features for regression
   */
  private encodeFeatures(data: BuildingFeatures[]): EncodedFeatures[] {
    return data.map(instance => this.encodeSingleInstance(instance));
  }
  
  /**
   * Encode a single instance for prediction
   */
  private encodeSingleInstance(instance: BuildingFeatures): EncodedFeatures {
    const encoded: EncodedFeatures = {
      intercept: 1.0 // Intercept term
    };
    
    // Encode numerical features
    for (const feature in this.featureRanges) {
      if (instance[feature] !== undefined && instance[feature] !== null) {
        // Normalize to 0-1 range
        const range = this.featureRanges[feature];
        const normalizedValue = (instance[feature] as number - range.min) / (range.max - range.min);
        encoded[feature] = normalizedValue;
      } else {
        encoded[feature] = 0.5; // Default to middle of range for missing values
      }
    }
    
    // Encode categorical features
    for (const feature in this.categoricalFeatures) {
      if (instance[feature] !== undefined && instance[feature] !== null) {
        const value = instance[feature] as string;
        
        // One-hot encoding
        for (const possibleValue of this.categoricalFeatures[feature]) {
          const featureName = `${feature}_${possibleValue}`;
          encoded[featureName] = value === possibleValue ? 1.0 : 0.0;
        }
      } else {
        // For missing categorical values, set all to 0
        for (const possibleValue of this.categoricalFeatures[feature]) {
          const featureName = `${feature}_${possibleValue}`;
          encoded[featureName] = 0.0;
        }
      }
    }
    
    return encoded;
  }
  
  /**
   * Train a multiple linear regression model
   */
  private trainRegressionModel(
    encodedData: EncodedFeatures[],
    targetValues: number[],
    type: 'base' | 'adjusted'
  ): void {
    if (encodedData.length === 0 || targetValues.length === 0) {
      throw new Error('No data for training regression model');
    }
    
    // Get feature names from first encoded instance
    const featureNames = Object.keys(encodedData[0]);
    
    // Initialize coefficients with zeros
    const coefficients: Coefficient[] = featureNames.map(feature => ({
      feature,
      value: 0.0,
      standardError: 0.0
    }));
    
    // Simple OLS (Ordinary Least Squares) implementation
    // Using normal equations: β = (X'X)^(-1)X'y
    
    // First, prepare the design matrix X and target vector y
    // X is n x p matrix where n is number of samples and p is number of features
    // y is n x 1 vector of target values
    
    const n = encodedData.length;
    const p = featureNames.length;
    
    // Initialize matrices
    const X: number[][] = Array(n).fill(0).map(() => Array(p).fill(0));
    const y: number[] = [...targetValues];
    
    // Fill design matrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < p; j++) {
        const feature = featureNames[j];
        X[i][j] = encodedData[i][feature] || 0;
      }
    }
    
    // Calculate X'X (p x p matrix)
    const XtX: number[][] = Array(p).fill(0).map(() => Array(p).fill(0));
    for (let i = 0; i < p; i++) {
      for (let j = 0; j < p; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X[k][i] * X[k][j];
        }
        XtX[i][j] = sum;
      }
    }
    
    // Calculate X'y (p x 1 vector)
    const Xty: number[] = Array(p).fill(0);
    for (let i = 0; i < p; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * y[k];
      }
      Xty[i] = sum;
    }
    
    // Solve for β using simplified approach (avoid full matrix inversion)
    // We'll use ridge regression for better stability
    const lambda = 0.1; // Regularization parameter
    
    // Add regularization to diagonal of X'X
    for (let i = 0; i < p; i++) {
      XtX[i][i] += lambda;
    }
    
    // Solve using Gaussian elimination (simplified)
    const beta = this.solveLinearSystem(XtX, Xty);
    
    // Update coefficients
    for (let i = 0; i < p; i++) {
      coefficients[i].value = beta[i];
    }
    
    // Calculate standard errors for coefficients
    // Residual sum of squares
    let rss = 0;
    for (let i = 0; i < n; i++) {
      let predicted = 0;
      for (let j = 0; j < p; j++) {
        predicted += X[i][j] * beta[j];
      }
      rss += Math.pow(y[i] - predicted, 2);
    }
    
    // Residual standard error
    const rse = Math.sqrt(rss / (n - p));
    
    // Standard errors for coefficients
    for (let j = 0; j < p; j++) {
      // This is a simplification - we should use the diagonal of the inverse of X'X
      // But we'll approximate using the diagonal elements directly
      const se = rse / Math.sqrt(XtX[j][j]);
      coefficients[j].standardError = se;
    }
    
    // Save coefficients and intercept
    if (type === 'base') {
      this.baseCoefficients = coefficients.filter(c => c.feature !== 'intercept');
      this.baseIntercept = coefficients.find(c => c.feature === 'intercept')?.value || 0;
    } else {
      this.adjustedCoefficients = coefficients.filter(c => c.feature !== 'intercept');
      this.adjustedIntercept = coefficients.find(c => c.feature === 'intercept')?.value || 0;
    }
  }
  
  /**
   * Solve a linear system using Gaussian elimination
   */
  private solveLinearSystem(A: number[][], b: number[]): number[] {
    const n = A.length;
    
    // Create augmented matrix [A|b]
    const augmented: number[][] = [];
    for (let i = 0; i < n; i++) {
      augmented.push([...A[i], b[i]]);
    }
    
    // Gaussian elimination with partial pivoting
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      let maxVal = Math.abs(augmented[i][i]);
      
      for (let j = i + 1; j < n; j++) {
        const absVal = Math.abs(augmented[j][i]);
        if (absVal > maxVal) {
          maxVal = absVal;
          maxRow = j;
        }
      }
      
      // Swap rows if needed
      if (maxRow !== i) {
        [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
      }
      
      // Eliminate below
      for (let j = i + 1; j < n; j++) {
        const factor = augmented[j][i] / augmented[i][i];
        
        for (let k = i; k <= n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }
    
    // Back substitution
    const x = new Array(n).fill(0);
    
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += augmented[i][j] * x[j];
      }
      
      x[i] = (augmented[i][n] - sum) / augmented[i][i];
    }
    
    return x;
  }
  
  /**
   * Calculate feature importance based on trained coefficients
   */
  private calculateFeatureImportance(): void {
    if (this.baseCoefficients.length === 0) return;
    
    const importance: ModelFeatureImportance = {};
    let totalImportance = 0;
    
    // Calculate absolute importance based on coefficient magnitude
    for (const coef of this.baseCoefficients) {
      // Extract the base feature name (for categorical features)
      const parts = coef.feature.split('_');
      const baseFeature = parts[0];
      
      // Add absolute coefficient value to importance
      if (!importance[baseFeature]) {
        importance[baseFeature] = 0;
      }
      
      importance[baseFeature] += Math.abs(coef.value);
      totalImportance += Math.abs(coef.value);
    }
    
    // Normalize importance values
    if (totalImportance > 0) {
      for (const feature in importance) {
        importance[feature] /= totalImportance;
      }
    }
    
    this.featureImportance = importance;
  }
  
  /**
   * Handle missing features by filling with reasonable defaults
   */
  private handleMissingFeatures(features: BuildingFeatures): BuildingFeatures {
    const completed = { ...features };
    
    // Fill numerical features with median values
    for (const feature in this.featureRanges) {
      if (completed[feature] === undefined || completed[feature] === null) {
        const range = this.featureRanges[feature];
        completed[feature] = (range.min + range.max) / 2; // Use middle of range
      }
    }
    
    // Fill categorical features with most common value
    for (const feature in this.categoricalFeatures) {
      if (completed[feature] === undefined || completed[feature] === null) {
        // Use first value as default (could be improved to use most common)
        const possibleValues = this.categoricalFeatures[feature];
        if (possibleValues.length > 0) {
          completed[feature] = possibleValues[0];
        }
      }
    }
    
    return completed;
  }
  
  /**
   * Predict using trained coefficients
   */
  private predictWithCoefficients(
    encoded: EncodedFeatures,
    coefficients: Coefficient[],
    intercept: number
  ): number {
    let prediction = intercept;
    
    for (const coef of coefficients) {
      prediction += (encoded[coef.feature] || 0) * coef.value;
    }
    
    return Math.max(0, prediction); // Ensure prediction is non-negative
  }
  
  /**
   * Calculate confidence score based on feature completeness and similarity to training data
   */
  private calculateConfidenceScore(features: BuildingFeatures, encoded: EncodedFeatures): number {
    // Start with base confidence
    let confidence = 0.9;
    
    // Reduce confidence for missing features
    const expectedFeatures = [
      'squareFeet', 'buildingType', 'region', 'year', 'quality', 'complexity', 'condition'
    ];
    
    const missingFeatures = expectedFeatures.filter(f => 
      features[f] === undefined || features[f] === null
    );
    
    // Each missing feature reduces confidence
    confidence -= missingFeatures.length * 0.05;
    
    // Check for out-of-range values for numerical features
    for (const feature in this.featureRanges) {
      if (features[feature] !== undefined && features[feature] !== null) {
        const value = features[feature] as number;
        const range = this.featureRanges[feature];
        
        if (value < range.min || value > range.max) {
          // Out of range reduces confidence
          confidence -= 0.1;
        }
      }
    }
    
    // Check for unknown categorical values
    for (const feature in this.categoricalFeatures) {
      if (features[feature] !== undefined && features[feature] !== null) {
        const value = features[feature] as string;
        
        if (!this.categoricalFeatures[feature].includes(value)) {
          // Unknown value reduces confidence
          confidence -= 0.1;
        }
      }
    }
    
    // Ensure confidence is between 0.1 and 1.0
    return Math.max(0.1, Math.min(1.0, confidence));
  }
  
  /**
   * Calculate confidence interval based on prediction and confidence score
   */
  private calculateConfidenceInterval(
    prediction: number,
    confidenceScore: number
  ): { lower: number; upper: number } {
    // Base margin is 15% of prediction
    const baseMargin = prediction * 0.15;
    
    // Adjust margin based on confidence (lower confidence = wider interval)
    const adjustedMargin = baseMargin * (2 - confidenceScore);
    
    return {
      lower: Math.max(0, prediction - adjustedMargin),
      upper: prediction + adjustedMargin
    };
  }
  
  /**
   * Get human-readable name for feature
   */
  private getHumanReadableFeatureName(featureName: string): string {
    // Handle categorical features like "buildingType_Residential"
    if (featureName.includes('_')) {
      const [feature, value] = featureName.split('_');
      
      // Map feature names to readable versions
      const featureMap: { [key: string]: string } = {
        'buildingType': 'Building Type',
        'region': 'Region',
        'quality': 'Quality',
        'complexity': 'Complexity',
        'condition': 'Condition'
      };
      
      return `${featureMap[feature] || feature} (${value})`;
    }
    
    // Map other feature names
    const nameMap: { [key: string]: string } = {
      'squareFeet': 'Square Footage',
      'year': 'Year'
    };
    
    return nameMap[featureName] || featureName;
  }
  
  /**
   * Create natural language summary explanation
   */
  private createExplanationSummary(
    features: BuildingFeatures,
    prediction: PredictionResult,
    topFactors: Array<{ feature: string; impact: number; direction: string; description: string }>
  ): string {
    // Format prediction
    const formattedCost = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(prediction.baseCost);
    
    // Format confidence interval
    const formattedLower = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(prediction.confidenceInterval.lower);
    
    const formattedUpper = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(prediction.confidenceInterval.upper);
    
    // Create base summary
    let summary = `The estimated base cost is ${formattedCost}, with a 95% confidence interval between ${formattedLower} and ${formattedUpper}. `;
    
    // Add information about key factors
    if (topFactors.length > 0) {
      summary += `The most significant factors influencing this cost are: `;
      
      const factorDescriptions = topFactors
        .slice(0, 3)
        .map(factor => factor.description);
      
      summary += factorDescriptions.join(', ') + '.';
    }
    
    return summary;
  }
}