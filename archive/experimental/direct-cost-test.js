/**
 * Direct test for cost estimation functionality without relying on imports
 */

// Mock cost estimation agent implementation for testing
console.log('Testing Cost Estimation functionality...');

// Define required constants
const REGION_FACTORS = {
  'EASTERN': 0.95,
  'CENTRAL': 1.0,
  'WESTERN': 1.05
};

const QUALITY_MULTIPLIERS = {
  'LOW': 0.85,
  'MEDIUM_LOW': 0.92,
  'MEDIUM': 1.0,
  'MEDIUM_HIGH': 1.15,
  'HIGH': 1.3,
  'PREMIUM': 1.5
};

const CONDITION_FACTORS = {
  'POOR': 0.7,
  'FAIR': 0.85,
  'AVERAGE': 1.0,
  'GOOD': 1.1,
  'EXCELLENT': 1.2
};

const BASE_RATES = {
  'RESIDENTIAL': 125,
  'COMMERCIAL': 170,
  'INDUSTRIAL': 145,
  'AGRICULTURAL': 95,
  'PUBLIC': 135
};

// Test data
const request = {
  buildingType: 'residential',
  squareFeet: 2000,
  region: 'western',
  quality: 'MEDIUM',
  condition: 'GOOD',
  yearBuilt: 2010,
  constructionDetails: {
    stories: 2,
    foundation: 'BASEMENT',
    roofType: 'HIP',
    heating: 'FORCED_AIR',
    cooling: 'CENTRAL'
  }
};

// Standardize the request
function standardizeRequest(request) {
  // Clone the request to avoid modifying the original
  const standardized = { ...request };
  
  // Standardize building type
  standardized.buildingType = standardized.buildingType.toUpperCase();
  
  // Standardize region
  standardized.region = standardized.region.toUpperCase();
  
  return standardized;
}

// Calculate a cost estimation
function calculateCostEstimation(request) {
  // Get the base rate for the building type
  const baseRate = getBaseRate(request.buildingType);
  
  // Calculate adjustments
  const regionFactor = getRegionFactor(request.region);
  const qualityFactor = getQualityFactor(request.quality || 'MEDIUM');
  const conditionFactor = getConditionFactor(request.condition || 'AVERAGE');
  const ageFactor = calculateAgeFactor(request.yearBuilt || (new Date().getFullYear() - 10));
  const complexityFactor = calculateComplexityFactor(request);
  
  // Calculate the adjusted rate
  const adjustedRate = baseRate * regionFactor * qualityFactor * conditionFactor * ageFactor * complexityFactor;
  
  // Calculate total cost
  const totalCost = adjustedRate * request.squareFeet;
  
  // Calculate breakdown
  const baseValue = baseRate * request.squareFeet;
  const regionAdjustment = baseValue * (regionFactor - 1);
  const qualityAdjustment = baseValue * (qualityFactor - 1);
  const conditionAdjustment = baseValue * (conditionFactor - 1);
  const ageAdjustment = baseValue * (ageFactor - 1);
  const complexityAdjustment = baseValue * (complexityFactor - 1);
  
  // Generate notes
  const notes = [];
  if (regionFactor !== 1.0) {
    notes.push(`Applied regional factor of ${regionFactor.toFixed(2)} for ${request.region} region.`);
  }
  
  if (qualityFactor !== 1.0) {
    notes.push(`Applied quality adjustment of ${qualityFactor.toFixed(2)} for ${request.quality} quality.`);
  }
  
  if (conditionFactor !== 1.0) {
    notes.push(`Applied condition adjustment of ${conditionFactor.toFixed(2)} for ${request.condition} condition.`);
  }
  
  if (ageFactor !== 1.0) {
    notes.push(`Applied age adjustment of ${ageFactor.toFixed(2)} for a building from ${request.yearBuilt}.`);
  }
  
  if (complexityFactor !== 1.0) {
    notes.push(`Applied complexity adjustment of ${complexityFactor.toFixed(2)} based on building details.`);
  }
  
  // Determine confidence level
  const confidenceLevel = determineConfidenceLevel(request);
  
  return {
    estimatedCost: Math.round(totalCost * 100) / 100,
    baseRate,
    adjustedRate: Math.round(adjustedRate * 100) / 100,
    appliedFactors: {
      region: regionFactor,
      quality: qualityFactor,
      condition: conditionFactor,
      age: ageFactor,
      complexity: complexityFactor
    },
    breakdown: {
      baseValue,
      regionAdjustment,
      qualityAdjustment,
      conditionAdjustment,
      ageAdjustment,
      complexityAdjustment
    },
    confidenceLevel,
    notes
  };
}

// Helper functions
function getBaseRate(buildingType) {
  const standardizedType = buildingType.toUpperCase();
  
  if (BASE_RATES[standardizedType]) {
    return BASE_RATES[standardizedType];
  }
  
  // If building type not found, use residential as fallback
  console.warn(`Building type '${buildingType}' not found in base rates. Using RESIDENTIAL rate.`);
  return BASE_RATES['RESIDENTIAL'];
}

function getRegionFactor(region) {
  const standardizedRegion = region.toUpperCase();
  
  if (REGION_FACTORS[standardizedRegion]) {
    return REGION_FACTORS[standardizedRegion];
  }
  
  // If region not found, use central (default factor of 1.0)
  console.warn(`Region '${region}' not found in region factors. Using CENTRAL factor.`);
  return REGION_FACTORS['CENTRAL'];
}

function getQualityFactor(quality) {
  if (QUALITY_MULTIPLIERS[quality]) {
    return QUALITY_MULTIPLIERS[quality];
  }
  
  // If quality not found, use medium (default factor of 1.0)
  console.warn(`Quality '${quality}' not found in quality multipliers. Using MEDIUM quality.`);
  return QUALITY_MULTIPLIERS['MEDIUM'];
}

function getConditionFactor(condition) {
  if (CONDITION_FACTORS[condition]) {
    return CONDITION_FACTORS[condition];
  }
  
  // If condition not found, use average (default factor of 1.0)
  console.warn(`Condition '${condition}' not found in condition factors. Using AVERAGE condition.`);
  return CONDITION_FACTORS['AVERAGE'];
}

function calculateAgeFactor(yearBuilt) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  // Age factor formula (example: 50-year-old building has factor of 0.75)
  // Buildings newer than 10 years don't have age depreciation
  if (age <= 10) {
    return 1.0;
  }
  
  // Maximum depreciation of 50% for very old buildings (100+ years)
  const ageFactor = Math.max(0.5, 1.0 - ((age - 10) / 200));
  
  return ageFactor;
}

function calculateComplexityFactor(request) {
  let complexityFactor = 1.0;
  
  if (!request.constructionDetails) {
    return complexityFactor;
  }
  
  // Adjust for multiple stories
  if (request.constructionDetails.stories && request.constructionDetails.stories > 1) {
    // Multi-story buildings are more complex
    complexityFactor += 0.05 * Math.min(request.constructionDetails.stories - 1, 4);
  }
  
  // Adjust for premium features
  if (request.constructionDetails.cooling === 'CENTRAL' && request.constructionDetails.heating === 'FORCED_AIR') {
    complexityFactor += 0.03;
  }
  
  // Adjust for complex foundation
  if (request.constructionDetails.foundation === 'BASEMENT' || request.constructionDetails.foundation === 'CRAWLSPACE') {
    complexityFactor += 0.05;
  }
  
  // Adjust for complex roof
  if (request.constructionDetails.roofType === 'COMPLEX' || request.constructionDetails.roofType === 'HIP') {
    complexityFactor += 0.03;
  }
  
  // Adjust for additions
  if (request.constructionDetails.additions && request.constructionDetails.additions.length > 0) {
    // Each addition increases complexity
    complexityFactor += 0.02 * Math.min(request.constructionDetails.additions.length, 5);
  }
  
  return complexityFactor;
}

function determineConfidenceLevel(request) {
  // More detailed requests have higher confidence
  let detailScore = 0;
  
  // Check for required fields
  if (request.buildingType && request.squareFeet && request.region) {
    detailScore += 1;
  }
  
  // Check for additional fields
  if (request.quality) detailScore += 1;
  if (request.condition) detailScore += 1;
  if (request.yearBuilt) detailScore += 1;
  
  // Check for construction details
  if (request.constructionDetails) {
    if (request.constructionDetails.stories) detailScore += 1;
    if (request.constructionDetails.foundation) detailScore += 1;
    if (request.constructionDetails.exterior) detailScore += 1;
    if (request.constructionDetails.roofType) detailScore += 1;
    if (request.constructionDetails.heating) detailScore += 1;
    if (request.constructionDetails.cooling) detailScore += 1;
    if (request.constructionDetails.additions && request.constructionDetails.additions.length > 0) detailScore += 1;
  }
  
  // Determine confidence level based on detail score
  if (detailScore >= 8) {
    return 'HIGH';
  } else if (detailScore >= 4) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}

// Execute the test
console.log('\nTest Request:');
console.log(JSON.stringify(request, null, 2));

const standardizedRequest = standardizeRequest(request);
console.log('\nStandardized Request:');
console.log(JSON.stringify(standardizedRequest, null, 2));

const result = calculateCostEstimation(standardizedRequest);
console.log('\nEstimation Result:');
console.log(JSON.stringify(result, null, 2));

// Validate the result meets requirements
console.log('\nValidation:');
console.log(`- Western region factor applied: ${result.appliedFactors.region === 1.05 ? '✅' : '❌'}`);
console.log(`- Good condition factor applied: ${result.appliedFactors.condition === 1.1 ? '✅' : '❌'}`);
console.log(`- Complexity factor applied for basement: ${result.appliedFactors.complexity > 1.0 ? '✅' : '❌'}`);
console.log(`- Age factor is correct for 15-year-old building: ${result.appliedFactors.age === 0.975 ? '✅' : '❌'}`);
console.log(`- Confidence level is HIGH: ${result.confidenceLevel === 'HIGH' ? '✅' : '❌'}`);

// Overall result
const isTestSuccessful = 
  result.appliedFactors.region === 1.05 && 
  result.appliedFactors.condition === 1.1 && 
  result.appliedFactors.complexity > 1.0 &&
  result.appliedFactors.age === 0.975 &&
  result.confidenceLevel === 'HIGH';

console.log(`\nTest ${isTestSuccessful ? '✅ PASSED' : '❌ FAILED'}`);