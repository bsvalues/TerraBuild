/**
 * Test for Benton County Conversion Agent
 * 
 * This script tests the functionality of the Benton County Conversion Agent
 * to ensure it correctly translates terminology and formats data.
 */

import { bentonCountyConversionAgent } from './server/mcp/agents/conversionAgent.js';

console.log('Testing Benton County Conversion Agent functionality...\n');

// Test 1: Building type conversion
console.log('== Testing Building Type Conversion ==');
const buildingTypes = ['R1', 'R2', 'C1', 'C4', 'I1', 'A1', 'S1'];
buildingTypes.forEach(type => {
  const description = bentonCountyConversionAgent.convertBuildingType(type);
  console.log(`${type} → ${description}`);
});
console.log();

// Test 2: Region conversion
console.log('== Testing Region Conversion ==');
const regions = ['East Benton', 'Central Benton', 'West Benton'];
regions.forEach(region => {
  const fullName = bentonCountyConversionAgent.convertRegion(region);
  console.log(`${region} → ${fullName}`);
});
console.log();

// Test 3: Quality conversion
console.log('== Testing Quality Level Conversion ==');
const qualities = ['LOW', 'MEDIUM_LOW', 'MEDIUM', 'MEDIUM_HIGH', 'HIGH', 'PREMIUM'];
qualities.forEach(quality => {
  const description = bentonCountyConversionAgent.convertQuality(quality);
  console.log(`${quality} → ${description}`);
});
console.log();

// Test 4: Terminology conversion
console.log('== Testing Terminology Conversion ==');
const terms = ['residential', 'commercial', 'industrial', 'lot', 'valuation', 'tax'];
terms.forEach(term => {
  const countyTerm = bentonCountyConversionAgent.convertTerminology({
    term,
    direction: 'toCounty'
  });
  console.log(`${term} → ${countyTerm}`);
});
console.log();

// Test 5: Building cost data conversion
console.log('== Testing Building Cost Data Conversion ==');
const buildingCostData = {
  buildingType: 'R1',
  region: 'East Benton',
  quality: 'MEDIUM_HIGH',
  condition: 'GOOD',
  squareFootage: 2500,
  baseCost: 396550,
  costPerSqft: 158.62,
  totalCost: 420000,
};

const convertedBuildingCost = bentonCountyConversionAgent.convertData({
  data: buildingCostData,
  dataType: 'buildingCost',
  direction: 'toCounty',
  options: {
    includeMetadata: true
  }
});

console.log('Original data:');
console.log(JSON.stringify(buildingCostData, null, 2));
console.log('\nConverted to Benton County format:');
console.log(JSON.stringify(convertedBuildingCost, null, 2));
console.log();

// Test 6: Scenario data conversion
console.log('== Testing Scenario Data Conversion ==');
const scenarioData = {
  id: 1,
  name: 'Residential Cost Analysis',
  description: 'Analysis of residential property costs',
  parameters: {
    buildingType: 'R1',
    region: 'Central Benton',
    quality: 'HIGH',
    condition: 'EXCELLENT',
    squareFootage: 3200,
    baseCost: 184.74,
    complexityFactor: 1.15
  },
  results: {
    baseCost: 590368,
    adjustedCost: 678923,
    costPerSqft: 212.16
  }
};

const convertedScenario = bentonCountyConversionAgent.convertData({
  data: scenarioData,
  dataType: 'scenario',
  direction: 'toCounty',
  options: {
    includeMetadata: true
  }
});

console.log('Original data:');
console.log(JSON.stringify(scenarioData, null, 2));
console.log('\nConverted to Benton County format:');
console.log(JSON.stringify(convertedScenario, null, 2));
console.log();

// Test 7: Report formatting
console.log('== Testing Report Formatting ==');
const reportData = {
  id: 1,
  title: 'Building Cost Analysis',
  content: {
    buildingType: 'C4',
    region: 'West Benton',
    costSummary: {
      totalCost: 2345000,
      costPerSqft: 156.33
    }
  }
};

const formattedReport = bentonCountyConversionAgent.formatReport({
  reportData,
  reportType: 'costAnalysis',
  includeHeaderFooter: true,
  includeSignatureBlock: true,
  includeCountyBranding: true
});

console.log('Original report:');
console.log(JSON.stringify(reportData, null, 2));
console.log('\nFormatted with Benton County branding:');
console.log(JSON.stringify(formattedReport, null, 2));
console.log();

console.log('✅ All Benton County Conversion Agent tests completed');