/**
 * Tests for Predictive Cost Model
 * 
 * This suite tests the functionality of the multi-variable regression model
 * for predicting building costs based on various factors.
 */

import { 
  CostPredictionModel, 
  ModelMetrics,
  PredictionResult,
  ModelFeatureImportance
} from '../client/src/utils/prediction-utils';

// Helper functions for testing
function calculateMAPE(predictions: number[], actuals: number[]): number {
  if (predictions.length !== actuals.length || predictions.length === 0) {
    return Infinity;
  }
  
  let sumPercentageError = 0;
  for (let i = 0; i < predictions.length; i++) {
    if (actuals[i] === 0) continue; // Skip if actual is zero to avoid division by zero
    sumPercentageError += Math.abs((predictions[i] - actuals[i]) / actuals[i]);
  }
  
  return sumPercentageError / predictions.length;
}

function countContainedValues(actuals: number[], confidenceIntervals: {lower: number, upper: number}[]): number {
  let count = 0;
  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] >= confidenceIntervals[i].lower && actuals[i] <= confidenceIntervals[i].upper) {
      count++;
    }
  }
  return count;
}

// Test data
const TEST_BUILDING_FEATURES = [
  { 
    squareFeet: 2500, 
    buildingType: 'Residential', 
    region: 'Eastern',
    year: 2022,
    quality: 'Standard',
    complexity: 'Medium',
    condition: 'Good'
  },
  { 
    squareFeet: 10000, 
    buildingType: 'Commercial', 
    region: 'Western',
    year: 2021,
    quality: 'Premium',
    complexity: 'High',
    condition: 'Excellent'
  },
  { 
    squareFeet: 5000, 
    buildingType: 'Industrial', 
    region: 'Southern',
    year: 2023,
    quality: 'Basic',
    complexity: 'Low',
    condition: 'Fair'
  }
];

const MISSING_DATA_BUILDING = {
  squareFeet: 3000,
  buildingType: 'Residential',
  region: 'Eastern',
  // Missing year
  quality: 'Standard',
  // Missing complexity
  condition: 'Good'
};

// Mock the API call to get historical data
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation((url) => {
    if (url === '/api/cost-matrix') {
      // Return mock historical data
      return Promise.resolve([
        { id: 1, squareFeet: 2000, buildingType: 'Residential', region: 'Eastern', year: 2020, quality: 'Standard', complexity: 'Medium', condition: 'Good', baseCost: 250000, adjustedCost: 262500 },
        { id: 2, squareFeet: 2200, buildingType: 'Residential', region: 'Eastern', year: 2021, quality: 'Standard', complexity: 'Medium', condition: 'Good', baseCost: 275000, adjustedCost: 288750 },
        { id: 3, squareFeet: 2400, buildingType: 'Residential', region: 'Eastern', year: 2022, quality: 'Standard', complexity: 'Medium', condition: 'Good', baseCost: 300000, adjustedCost: 315000 },
        { id: 4, squareFeet: 8000, buildingType: 'Commercial', region: 'Western', year: 2020, quality: 'Premium', complexity: 'High', condition: 'Excellent', baseCost: 1200000, adjustedCost: 1260000 },
        { id: 5, squareFeet: 9000, buildingType: 'Commercial', region: 'Western', year: 2021, quality: 'Premium', complexity: 'High', condition: 'Excellent', baseCost: 1350000, adjustedCost: 1417500 },
        { id: 6, squareFeet: 10000, buildingType: 'Commercial', region: 'Western', year: 2022, quality: 'Premium', complexity: 'High', condition: 'Excellent', baseCost: 1500000, adjustedCost: 1575000 },
        { id: 7, squareFeet: 4000, buildingType: 'Industrial', region: 'Southern', year: 2021, quality: 'Basic', complexity: 'Low', condition: 'Fair', baseCost: 320000, adjustedCost: 336000 },
        { id: 8, squareFeet: 4500, buildingType: 'Industrial', region: 'Southern', year: 2022, quality: 'Basic', complexity: 'Low', condition: 'Fair', baseCost: 360000, adjustedCost: 378000 },
        { id: 9, squareFeet: 5000, buildingType: 'Industrial', region: 'Southern', year: 2023, quality: 'Basic', complexity: 'Low', condition: 'Fair', baseCost: 400000, adjustedCost: 420000 }
      ]);
    }
    return Promise.resolve([]);
  })
}));

describe('Cost Prediction Model', () => {
  let model: CostPredictionModel;

  beforeEach(() => {
    model = new CostPredictionModel();
    // Ensure model is trained before each test
    return model.train();
  });

  test('Model can be instantiated and trained', async () => {
    expect(model).toBeInstanceOf(CostPredictionModel);
    
    // Training should complete successfully
    await expect(model.train()).resolves.not.toThrow();
    
    // Model should be marked as trained
    expect(model.isTrained()).toBe(true);
  });

  test('Model can make predictions for building features', async () => {
    const predictions = await Promise.all(
      TEST_BUILDING_FEATURES.map(features => model.predict(features))
    );
    
    // Should return prediction results for all test buildings
    expect(predictions.length).toBe(TEST_BUILDING_FEATURES.length);
    
    // Each prediction should have the required properties
    predictions.forEach(prediction => {
      expect(prediction.baseCost).toBeDefined();
      expect(prediction.adjustedCost).toBeDefined();
      expect(prediction.confidenceInterval).toBeDefined();
      expect(prediction.confidenceInterval.lower).toBeDefined();
      expect(prediction.confidenceInterval.upper).toBeDefined();
      expect(prediction.confidenceScore).toBeDefined();
    });
    
    // Predictions should be realistic
    predictions.forEach(prediction => {
      expect(prediction.baseCost).toBeGreaterThan(0);
      expect(prediction.adjustedCost).toBeGreaterThan(prediction.baseCost * 0.9);
      expect(prediction.confidenceInterval.lower).toBeLessThan(prediction.baseCost);
      expect(prediction.confidenceInterval.upper).toBeGreaterThan(prediction.baseCost);
      expect(prediction.confidenceScore).toBeGreaterThan(0);
      expect(prediction.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  test('Model handles missing building features gracefully', async () => {
    // Should not throw when missing data
    await expect(model.predict(MISSING_DATA_BUILDING)).resolves.not.toThrow();
    
    // Get predictions with complete and incomplete data
    const completeData = {
      ...MISSING_DATA_BUILDING,
      year: 2022,
      complexity: 'Medium'
    };
    
    const predictionMissing = await model.predict(MISSING_DATA_BUILDING);
    const predictionComplete = await model.predict(completeData);
    
    // Prediction with missing data should have wider confidence interval
    const missingWidth = predictionMissing.confidenceInterval.upper - predictionMissing.confidenceInterval.lower;
    const completeWidth = predictionComplete.confidenceInterval.upper - predictionComplete.confidenceInterval.lower;
    
    expect(missingWidth).toBeGreaterThan(completeWidth);
    
    // Confidence score should be lower for prediction with missing data
    expect(predictionMissing.confidenceScore).toBeLessThan(predictionComplete.confidenceScore);
  });

  test('Model achieves reasonable accuracy on test data', async () => {
    const { metrics } = await model.evaluate();
    
    // Mean Absolute Percentage Error should be under 20%
    expect(metrics.mape).toBeLessThan(0.2);
    
    // R-squared should be positive (indicates some predictive power)
    expect(metrics.rSquared).toBeGreaterThan(0);
    
    // Should have information about number of data points used
    expect(metrics.dataPointsUsed).toBeGreaterThan(0);
  });

  test('Model produces consistent feature importance values', async () => {
    const featureImportance = await model.getFeatureImportance();
    
    // Should have importance values for all features
    expect(Object.keys(featureImportance).length).toBeGreaterThan(3);
    
    // Square footage should be an important feature
    expect(featureImportance.squareFeet).toBeDefined();
    expect(featureImportance.squareFeet).toBeGreaterThan(0);
    
    // Building type should be an important feature
    expect(featureImportance.buildingType).toBeDefined();
    expect(featureImportance.buildingType).toBeGreaterThan(0);
    
    // All importance values should sum to approximately 1.0
    const sum = Object.values(featureImportance).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 2);
  });

  test('Model can generate prediction explanations', async () => {
    const features = TEST_BUILDING_FEATURES[0];
    const prediction = await model.predict(features);
    const explanation = await model.explainPrediction(features, prediction);
    
    // Explanation should include contributing factors
    expect(explanation.factors.length).toBeGreaterThan(0);
    
    // Each factor should have a feature name, impact, and direction
    explanation.factors.forEach(factor => {
      expect(factor.feature).toBeDefined();
      expect(factor.impact).toBeDefined();
      expect(factor.direction).toBeDefined();
    });
    
    // Explanation should include a natural language summary
    expect(explanation.summary).toBeDefined();
    expect(explanation.summary.length).toBeGreaterThan(20);
  });

  test('Model provides confidence intervals with correct coverage', async () => {
    const { predictionResults } = await model.evaluate();
    
    // Count how many actual values fall within the 95% confidence interval
    const containedCount = countContainedValues(
      predictionResults.map(r => r.actual),
      predictionResults.map(r => r.confidenceInterval)
    );
    
    // Should be approximately 95% of values (allow for small variance)
    const containedRate = containedCount / predictionResults.length;
    expect(containedRate).toBeGreaterThan(0.85); // Allow some flexibility due to small sample
    expect(containedRate).toBeLessThanOrEqual(1.0);
  });

  test('Model can be serialized and deserialized', async () => {
    // Get prediction from original model
    const originalPrediction = await model.predict(TEST_BUILDING_FEATURES[0]);
    
    // Serialize model
    const serialized = model.serialize();
    expect(serialized).toBeDefined();
    
    // Create new model and deserialize
    const newModel = new CostPredictionModel();
    await newModel.deserialize(serialized);
    
    // New model should be marked as trained
    expect(newModel.isTrained()).toBe(true);
    
    // Predictions should be the same from both models
    const newPrediction = await newModel.predict(TEST_BUILDING_FEATURES[0]);
    expect(newPrediction.baseCost).toBeCloseTo(originalPrediction.baseCost, 2);
    expect(newPrediction.adjustedCost).toBeCloseTo(originalPrediction.adjustedCost, 2);
  });

  test('Model adapts to new data correctly', async () => {
    // Train model
    await model.train();
    
    // Get initial prediction for test case
    const testCase = TEST_BUILDING_FEATURES[0];
    const initialPrediction = await model.predict(testCase);
    
    // Update model with new data that suggests higher costs
    const newData = [{
      squareFeet: testCase.squareFeet,
      buildingType: testCase.buildingType,
      region: testCase.region,
      year: testCase.year,
      quality: testCase.quality,
      complexity: testCase.complexity,
      condition: testCase.condition,
      baseCost: initialPrediction.baseCost * 1.2, // 20% higher than predicted
      adjustedCost: initialPrediction.adjustedCost * 1.2
    }];
    
    await model.update(newData);
    
    // Get updated prediction
    const updatedPrediction = await model.predict(testCase);
    
    // Prediction should be higher after incorporating new data
    expect(updatedPrediction.baseCost).toBeGreaterThan(initialPrediction.baseCost);
  });
});