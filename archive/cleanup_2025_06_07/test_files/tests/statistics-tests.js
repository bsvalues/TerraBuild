/**
 * Statistical Analysis Tests
 * 
 * This test suite verifies the functionality of statistical analysis tools
 * including outlier detection, correlation analysis, and data quality checks.
 */

const { expect } = require('chai');
const { 
  detectOutliers, 
  calculateCorrelation, 
  validateDataCompleteness,
  calculateConfidenceInterval
} = require('../client/src/lib/statistics-utils');

describe('Outlier Detection', () => {
  it('should identify statistical outliers using z-score method', () => {
    // Sample cost data with outliers
    const costData = [150, 155, 148, 152, 149, 250, 153, 147];
    
    const result = detectOutliers(costData);
    
    expect(result).to.be.an('object');
    expect(result.outliers).to.be.an('array').with.lengthOf(1);
    expect(result.outliers[0]).to.equal(250);
    expect(result.zScores).to.be.an('array').with.lengthOf(costData.length);
    expect(result.threshold).to.be.greaterThan(0);
  });

  it('should handle datasets with no outliers', () => {
    const costData = [150, 155, 148, 152, 149, 153, 147];
    
    const result = detectOutliers(costData);
    
    expect(result.outliers).to.be.an('array').that.is.empty;
  });

  it('should handle empty datasets gracefully', () => {
    const result = detectOutliers([]);
    
    expect(result).to.be.an('object');
    expect(result.outliers).to.be.an('array').that.is.empty;
    expect(result.error).to.equal('Insufficient data');
  });
});

describe('Correlation Analysis', () => {
  it('should calculate Pearson correlation coefficient correctly', () => {
    // Sample data for size and cost
    const sizes = [1500, 2000, 2500, 3000, 3500];
    const costs = [150000, 200000, 250000, 290000, 340000];
    
    const correlation = calculateCorrelation(sizes, costs);
    
    expect(correlation).to.be.a('number');
    expect(correlation).to.be.greaterThan(0.9); // Strong positive correlation
    expect(correlation).to.be.lessThan(1.01);  // Cannot exceed 1.0
  });

  it('should handle perfect negative correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3, 2, 1];
    
    const correlation = calculateCorrelation(x, y);
    
    expect(correlation).to.be.closeTo(-1, 0.0001);
  });

  it('should handle no correlation', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 2, 7, 1, 9];
    
    const correlation = calculateCorrelation(x, y);
    
    expect(correlation).to.be.closeTo(0, 0.3); // Approximately zero
  });

  it('should handle mismatched array lengths', () => {
    const x = [1, 2, 3, 4, 5];
    const y = [5, 4, 3];
    
    expect(() => calculateCorrelation(x, y)).to.throw('Arrays must have the same length');
  });
});

describe('Data Quality Checks', () => {
  it('should validate data completeness correctly', () => {
    const completeData = [
      { id: 1, region: 'Benton', cost: 150, year: 2023 },
      { id: 2, region: 'King', cost: 200, year: 2023 }
    ];
    
    const result = validateDataCompleteness(completeData, ['region', 'cost', 'year']);
    
    expect(result.isComplete).to.be.true;
    expect(result.completenessScore).to.equal(1.0);
    expect(result.missingFields).to.be.an('array').that.is.empty;
  });

  it('should identify missing fields', () => {
    const incompleteData = [
      { id: 1, region: 'Benton', cost: 150, year: 2023 },
      { id: 2, region: 'King', cost: null, year: 2023 },
      { id: 3, region: 'Spokane', year: 2023 }
    ];
    
    const result = validateDataCompleteness(incompleteData, ['region', 'cost', 'year']);
    
    expect(result.isComplete).to.be.false;
    expect(result.completenessScore).to.be.lessThan(1.0);
    expect(result.missingFields).to.be.an('array').with.lengthOf(2);
    expect(result.missingFields[0]).to.deep.include({ id: 2, field: 'cost' });
    expect(result.missingFields[1]).to.deep.include({ id: 3, field: 'cost' });
  });
});

describe('Confidence Interval Calculation', () => {
  it('should calculate 95% confidence interval correctly', () => {
    const data = [150, 155, 148, 152, 149, 153, 147, 151, 154, 150];
    
    const result = calculateConfidenceInterval(data, 0.95);
    
    expect(result).to.be.an('object');
    expect(result.mean).to.be.closeTo(150.9, 0.1);
    expect(result.lowerBound).to.be.lessThan(result.mean);
    expect(result.upperBound).to.be.greaterThan(result.mean);
    expect(result.confidenceLevel).to.equal(0.95);
  });

  it('should handle small sample sizes appropriately', () => {
    const data = [150, 155, 148];
    
    const result = calculateConfidenceInterval(data, 0.95);
    
    // Wide confidence interval for small samples
    expect(result.upperBound - result.lowerBound).to.be.greaterThan(10);
  });
});