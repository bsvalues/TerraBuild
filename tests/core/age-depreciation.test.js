/**
 * Building Age Depreciation Tests
 * 
 * Tests the age-based depreciation functionality of the calculation engine
 */

import assert from 'assert';

// Simple test framework implementation
const describe = function(name, fn) {
  describe.currentSuite = { name, tests: [] };
  describe.suites[name] = describe.currentSuite;
  fn();
};

describe.suites = {};

const it = function(name, fn) {
  describe.currentSuite.tests.push({ name, fn });
};

// Mock calculation engine with age depreciation
const calculationEngine = {
  calculateAgeDepreciation: (buildingAge, buildingType = 'RESIDENTIAL') => {
    // Age depreciation curve - to be implemented in the actual calculation engine
    // This is just the test implementation
    if (buildingAge < 0) {
      throw new Error('Building age cannot be negative');
    }
    
    let depreciationFactor;
    
    // Different building types have different depreciation curves
    if (buildingType === 'RESIDENTIAL') {
      // Residential buildings depreciate faster in earlier years, then stabilize
      if (buildingAge <= 5) {
        depreciationFactor = 1.0 - (buildingAge * 0.01); // 1% per year for first 5 years
      } else if (buildingAge <= 15) {
        depreciationFactor = 0.95 - ((buildingAge - 5) * 0.015); // 1.5% per year for next 10 years
      } else if (buildingAge <= 30) {
        depreciationFactor = 0.80 - ((buildingAge - 15) * 0.01); // 1% per year for next 15 years
      } else if (buildingAge <= 50) {
        depreciationFactor = 0.65 - ((buildingAge - 30) * 0.005); // 0.5% per year for next 20 years
      } else {
        depreciationFactor = 0.55; // Minimum 55% of original value
      }
    } else if (buildingType === 'COMMERCIAL') {
      // Commercial buildings depreciate more slowly
      if (buildingAge <= 10) {
        depreciationFactor = 1.0 - (buildingAge * 0.008); // 0.8% per year for first 10 years
      } else if (buildingAge <= 25) {
        depreciationFactor = 0.92 - ((buildingAge - 10) * 0.01); // 1% per year for next 15 years
      } else if (buildingAge <= 40) {
        depreciationFactor = 0.77 - ((buildingAge - 25) * 0.006); // 0.6% per year for next 15 years
      } else if (buildingAge <= 60) {
        depreciationFactor = 0.68 - ((buildingAge - 40) * 0.004); // 0.4% per year for next 20 years
      } else {
        depreciationFactor = 0.60; // Minimum 60% of original value
      }
    } else if (buildingType === 'INDUSTRIAL') {
      // Industrial buildings depreciate more slowly than residential but faster than commercial
      if (buildingAge <= 8) {
        depreciationFactor = 1.0 - (buildingAge * 0.01); // 1% per year for first 8 years
      } else if (buildingAge <= 20) {
        depreciationFactor = 0.92 - ((buildingAge - 8) * 0.008); // 0.8% per year for next 12 years
      } else if (buildingAge <= 35) {
        depreciationFactor = 0.824 - ((buildingAge - 20) * 0.006); // 0.6% per year for next 15 years
      } else if (buildingAge <= 55) {
        depreciationFactor = 0.734 - ((buildingAge - 35) * 0.004); // 0.4% per year for next 20 years
      } else {
        depreciationFactor = 0.65; // Minimum 65% of original value
      }
    } else {
      // Default curve for other building types
      depreciationFactor = Math.max(0.60, 1.0 - (buildingAge * 0.008)); // 0.8% per year, minimum 60%
    }
    
    return Math.round(depreciationFactor * 1000) / 1000; // Round to 3 decimal places
  },
  
  applyAgeDepreciationToCost: (cost, buildingAge, buildingType = 'RESIDENTIAL') => {
    const depreciationFactor = calculationEngine.calculateAgeDepreciation(buildingAge, buildingType);
    return cost * depreciationFactor;
  },
  
  calculateCostWithAgeDepreciation: (params) => {
    const { 
      squareFootage, 
      buildingType = 'RESIDENTIAL', 
      quality = 'STANDARD', 
      complexityFactor = 1.0, 
      conditionFactor = 1.0, 
      buildingAge = 0
    } = params;
    
    // Base cost calculation (simplified for test)
    const baseCostPerSqFt = {
      'RESIDENTIAL': { 'STANDARD': 125, 'PREMIUM': 175, 'LUXURY': 250 },
      'COMMERCIAL': { 'STANDARD': 150, 'PREMIUM': 200, 'LUXURY': 300 },
      'INDUSTRIAL': { 'STANDARD': 100, 'PREMIUM': 150, 'LUXURY': 225 }
    }[buildingType]?.[quality] || 150;
    
    let baseCost = squareFootage * baseCostPerSqFt;
    
    // Apply standard factors
    let adjustedCost = baseCost;
    adjustedCost *= complexityFactor;
    adjustedCost *= conditionFactor;
    
    // Apply age depreciation
    const depreciationFactor = calculationEngine.calculateAgeDepreciation(buildingAge, buildingType);
    adjustedCost *= depreciationFactor;
    
    // Round to nearest dollar
    adjustedCost = Math.round(adjustedCost);
    
    return {
      totalCost: adjustedCost,
      depreciationFactor,
      depreciationAmount: baseCost * complexityFactor * conditionFactor * (1 - depreciationFactor)
    };
  }
};

// Test suite
describe('Building Age Depreciation', () => {
  
  describe('Depreciation Factor Calculation', () => {
    it('returns 1.0 for new buildings (0 years old)', () => {
      const result = calculationEngine.calculateAgeDepreciation(0);
      assert.strictEqual(result, 1.0);
    });
    
    it('calculates correct depreciation for 5-year-old residential building', () => {
      const result = calculationEngine.calculateAgeDepreciation(5, 'RESIDENTIAL');
      assert.strictEqual(result, 0.95); // 5 years * 1% = 5% depreciation
    });
    
    it('calculates correct depreciation for 20-year-old residential building', () => {
      const result = calculationEngine.calculateAgeDepreciation(20, 'RESIDENTIAL');
      assert.strictEqual(result, 0.75); // 5% + 15% + 5% = 25% depreciation
    });
    
    it('calculates correct depreciation for 40-year-old residential building', () => {
      const result = calculationEngine.calculateAgeDepreciation(40, 'RESIDENTIAL');
      assert.strictEqual(result, 0.6); // 5% + 15% + 15% + 5% = 40% depreciation
    });
    
    it('applies minimum depreciation value for very old residential buildings', () => {
      const result = calculationEngine.calculateAgeDepreciation(80, 'RESIDENTIAL');
      assert.strictEqual(result, 0.55); // Minimum depreciation factor
    });
    
    it('calculates correct depreciation for 20-year-old commercial building', () => {
      const result = calculationEngine.calculateAgeDepreciation(20, 'COMMERCIAL');
      assert.strictEqual(result, 0.82); // 8% + 10% = 18% depreciation
    });
    
    it('calculates correct depreciation for 50-year-old industrial building', () => {
      const result = calculationEngine.calculateAgeDepreciation(50, 'INDUSTRIAL');
      assert.strictEqual(result, 0.674); // 8% + 9.6% + 9% + 6% = 32.6% depreciation
    });
    
    it('throws an error for negative building age', () => {
      assert.throws(() => {
        calculationEngine.calculateAgeDepreciation(-5);
      }, /Building age cannot be negative/);
    });
  });
  
  describe('Applying Depreciation to Cost', () => {
    it('does not change cost for new buildings', () => {
      const result = calculationEngine.applyAgeDepreciationToCost(100000, 0);
      assert.strictEqual(result, 100000);
    });
    
    it('correctly applies depreciation to base cost for older buildings', () => {
      const result = calculationEngine.applyAgeDepreciationToCost(100000, 20, 'RESIDENTIAL');
      assert.strictEqual(result, 75000); // 25% depreciation = 75000
    });
  });
  
  describe('Full Cost Calculation with Age Depreciation', () => {
    it('calculates correct total cost for new residential building', () => {
      const result = calculationEngine.calculateCostWithAgeDepreciation({
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        buildingAge: 0
      });
      
      assert.strictEqual(result.totalCost, 250000); // No depreciation
      assert.strictEqual(result.depreciationFactor, 1.0);
      assert.strictEqual(result.depreciationAmount, 0);
    });
    
    it('calculates correct total cost for 15-year-old residential building', () => {
      const result = calculationEngine.calculateCostWithAgeDepreciation({
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        buildingAge: 15
      });
      
      assert.strictEqual(result.depreciationFactor, 0.8);
      assert.strictEqual(result.totalCost, 200000); // 20% depreciation applied
      assert.strictEqual(Math.round(result.depreciationAmount), 50000);
    });
    
    it('calculates correct total cost with all factors combined', () => {
      const result = calculationEngine.calculateCostWithAgeDepreciation({
        squareFootage: 2000,
        buildingType: 'COMMERCIAL',
        quality: 'PREMIUM',
        complexityFactor: 1.2,
        conditionFactor: 0.9,
        buildingAge: 20
      });
      
      // Base: 2000 * 200 = 400,000
      // With complexity: 400,000 * 1.2 = 480,000
      // With condition: 480,000 * 0.9 = 432,000
      // With 18% age depreciation: 432,000 * 0.82 = 354,240
      
      const expectedCost = Math.round(2000 * 200 * 1.2 * 0.9 * calculationEngine.calculateAgeDepreciation(20, 'COMMERCIAL'));
      assert.strictEqual(result.totalCost, expectedCost);
    });
  });
});

// Run the tests
console.log('Running Building Age Depreciation tests...');

// Use a simple test runner
let passedTests = 0;
let failedTests = 0;

// Execute all test cases in the describe blocks
for (const suite of Object.values(describe.suites)) {
  console.log(`\n${suite.name}`);
  
  for (const subSuite of suite.tests) {
    if (typeof subSuite.fn === 'function') {
      try {
        subSuite.fn();
        console.log(`✓ ${subSuite.name}`);
        passedTests++;
      } catch (error) {
        console.error(`✗ ${subSuite.name}`);
        console.error(`  ${error.message}`);
        failedTests++;
      }
    } else {
      console.log(`\n  ${subSuite.name}`);
      
      for (const test of subSuite.tests || []) {
        try {
          test.fn();
          console.log(`  ✓ ${test.name}`);
          passedTests++;
        } catch (error) {
          console.error(`  ✗ ${test.name}`);
          console.error(`    ${error.message}`);
          failedTests++;
        }
      }
    }
  }
}

console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed`);

if (passedTests > 0 && failedTests === 0) {
  console.log('\n✅ All age depreciation tests passed!');
} else {
  console.error('\n❌ Some age depreciation tests failed!');
}