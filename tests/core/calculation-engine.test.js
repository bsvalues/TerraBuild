/**
 * Calculation Engine Tests
 * 
 * Tests the core calculation functionality for the BCBS application
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

// Import the calculation functions
// Note: In a real test, we would import the actual functions from the backend
// This is a placeholder structure for the test file
const calculationEngine = {
  getBaseCostPerSqFt: (buildingType, quality) => {
    const baseCosts = {
      'RESIDENTIAL': { 'STANDARD': 125, 'PREMIUM': 175, 'LUXURY': 250 },
      'COMMERCIAL': { 'STANDARD': 150, 'PREMIUM': 200, 'LUXURY': 300 },
      'INDUSTRIAL': { 'STANDARD': 100, 'PREMIUM': 150, 'LUXURY': 225 }
    };
    
    return baseCosts[buildingType]?.[quality] || 150;
  },
  
  getRegionalMultiplier: (region) => {
    const multipliers = {
      'RICHLAND': 1.05,
      'KENNEWICK': 1.02,
      'PASCO': 1.0,
      'WEST_RICHLAND': 1.07,
      'BENTON_CITY': 0.95,
      'PROSSER': 0.93,
      'NORTHEAST': 1.15,
      'MIDWEST': 1.0,
      'SOUTH': 0.92,
      'WEST': 1.25
    };
    
    return multipliers[region] || 1.0;
  },
  
  calculateCost: (params) => {
    const { 
      squareFootage, 
      buildingType, 
      quality, 
      complexityFactor, 
      conditionFactor, 
      region,
      materials = []
    } = params;
    
    const baseCostPerSqFt = calculationEngine.getBaseCostPerSqFt(buildingType, quality);
    const baseCost = squareFootage * baseCostPerSqFt;
    
    const multiplier = calculationEngine.getRegionalMultiplier(region);
    
    // Apply factors
    let adjustedCost = baseCost;
    adjustedCost *= complexityFactor;
    adjustedCost *= conditionFactor;
    adjustedCost *= multiplier;
    
    // Calculate material costs
    const materialCost = materials.reduce((total, material) => {
      return total + (material.quantity * material.unitPrice);
    }, 0);
    
    // Generate cost breakdown
    const costBreakdown = [
      { category: 'Base Cost', cost: baseCost },
      { category: 'Complexity Adjustment', cost: baseCost * (complexityFactor - 1) },
      { category: 'Condition Adjustment', cost: baseCost * complexityFactor * (conditionFactor - 1) },
      { category: 'Regional Adjustment', cost: adjustedCost - (baseCost * complexityFactor * conditionFactor) },
      { category: 'Materials', cost: materialCost }
    ];
    
    return {
      totalCost: adjustedCost + materialCost,
      costBreakdown,
      details: {
        baseCost,
        adjustments: {
          complexity: baseCost * (complexityFactor - 1),
          condition: baseCost * complexityFactor * (conditionFactor - 1),
          regional: adjustedCost - (baseCost * complexityFactor * conditionFactor)
        }
      }
    };
  }
};

// Test suite
describe('Calculation Engine', () => {
  
  describe('Base Cost Per Square Foot', () => {
    it('returns the correct base cost for residential standard quality', () => {
      const result = calculationEngine.getBaseCostPerSqFt('RESIDENTIAL', 'STANDARD');
      assert.strictEqual(result, 125);
    });
    
    it('returns the correct base cost for commercial premium quality', () => {
      const result = calculationEngine.getBaseCostPerSqFt('COMMERCIAL', 'PREMIUM');
      assert.strictEqual(result, 200);
    });
    
    it('returns the correct base cost for industrial luxury quality', () => {
      const result = calculationEngine.getBaseCostPerSqFt('INDUSTRIAL', 'LUXURY');
      assert.strictEqual(result, 225);
    });
    
    it('returns a default value for unknown building type or quality', () => {
      const result = calculationEngine.getBaseCostPerSqFt('UNKNOWN', 'UNKNOWN');
      assert.strictEqual(result, 150);
    });
  });
  
  describe('Regional Multiplier', () => {
    it('returns the correct multiplier for Richland', () => {
      const result = calculationEngine.getRegionalMultiplier('RICHLAND');
      assert.strictEqual(result, 1.05);
    });
    
    it('returns the correct multiplier for the West region', () => {
      const result = calculationEngine.getRegionalMultiplier('WEST');
      assert.strictEqual(result, 1.25);
    });
    
    it('returns a default value for unknown region', () => {
      const result = calculationEngine.getRegionalMultiplier('UNKNOWN');
      assert.strictEqual(result, 1.0);
    });
  });
  
  describe('Cost Calculation', () => {
    it('calculates the correct total cost for a simple case', () => {
      const params = {
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        complexityFactor: 1.0,
        conditionFactor: 1.0,
        region: 'MIDWEST',
        materials: []
      };
      
      const result = calculationEngine.calculateCost(params);
      
      // Base calculation: 2000 * 125 * 1.0 * 1.0 * 1.0 = 250,000
      assert.strictEqual(result.totalCost, 250000);
    });
    
    it('applies complexity factor correctly', () => {
      const params = {
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        complexityFactor: 1.5,
        conditionFactor: 1.0,
        region: 'MIDWEST',
        materials: []
      };
      
      const result = calculationEngine.calculateCost(params);
      
      // Base calculation: 2000 * 125 = 250,000
      // With complexity: 250,000 * 1.5 = 375,000
      assert.strictEqual(result.totalCost, 375000);
    });
    
    it('applies condition factor correctly', () => {
      const params = {
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        complexityFactor: 1.0,
        conditionFactor: 0.8,
        region: 'MIDWEST',
        materials: []
      };
      
      const result = calculationEngine.calculateCost(params);
      
      // Base calculation: 2000 * 125 = 250,000
      // With condition: 250,000 * 0.8 = 200,000
      assert.strictEqual(result.totalCost, 200000);
    });
    
    it('applies regional multiplier correctly', () => {
      const params = {
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        complexityFactor: 1.0,
        conditionFactor: 1.0,
        region: 'WEST',
        materials: []
      };
      
      const result = calculationEngine.calculateCost(params);
      
      // Base calculation: 2000 * 125 = 250,000
      // With regional multiplier: 250,000 * 1.25 = 312,500
      assert.strictEqual(result.totalCost, 312500);
    });
    
    it('includes material costs correctly', () => {
      const params = {
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        complexityFactor: 1.0,
        conditionFactor: 1.0,
        region: 'MIDWEST',
        materials: [
          { quantity: 100, unitPrice: 50 },
          { quantity: 200, unitPrice: 25 }
        ]
      };
      
      const result = calculationEngine.calculateCost(params);
      
      // Base calculation: 2000 * 125 = 250,000
      // Materials: (100 * 50) + (200 * 25) = 5,000 + 5,000 = 10,000
      // Total: 250,000 + 10,000 = 260,000
      assert.strictEqual(result.totalCost, 260000);
    });
    
    it('generates correct cost breakdown', () => {
      const params = {
        squareFootage: 2000,
        buildingType: 'RESIDENTIAL',
        quality: 'STANDARD',
        complexityFactor: 1.2,
        conditionFactor: 0.9,
        region: 'RICHLAND',
        materials: [
          { quantity: 100, unitPrice: 50 }
        ]
      };
      
      const result = calculationEngine.calculateCost(params);
      
      // Check each breakdown component
      const baseCost = 2000 * 125; // 250,000
      assert.strictEqual(result.costBreakdown[0].cost, baseCost);
      
      const complexityAdjustment = baseCost * (1.2 - 1); // 250,000 * 0.2 = 50,000
      assert.strictEqual(result.costBreakdown[1].cost, complexityAdjustment);
      
      const materialsCost = 100 * 50; // 5,000
      assert.strictEqual(result.costBreakdown[4].cost, materialsCost);
    });
  });
});

// Run the tests
console.log('Running calculation engine tests...');

// Use a simple test runner
let passedTests = 0;
let failedTests = 0;

// Execute all test cases in the describe blocks
for (const suite of Object.values(describe.suites)) {
  console.log(`\n${suite.name}`);
  
  for (const test of suite.tests) {
    try {
      test.fn();
      console.log(`✓ ${test.name}`);
      passedTests++;
    } catch (error) {
      console.error(`✗ ${test.name}`);
      console.error(`  ${error.message}`);
      failedTests++;
    }
  }
}

console.log(`\nTest Results: ${passedTests} passed, ${failedTests} failed`);

if (passedTests > 0 && failedTests === 0) {
  console.log('\n✅ All tests passed!');
} else {
  console.error('\n❌ Some tests failed!');
}

// Test implementation is at the top of the file