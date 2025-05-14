/**
 * Data Quality Agent Implementation
 * 
 * This agent is responsible for validating and analyzing data quality
 * for property data in the TerraBuild system, with special focus on
 * region-based cost data validation.
 */

import { logger } from '../../utils/logger';

// Benton County region type definitions 
type RegionType = 'city' | 'tca' | 'hood_code' | 'township_range';

// Region validation rules
const regionValidationRules = {
  city: {
    pattern: /^[A-Za-z\s]+$/,
    minLength: 3,
    maxLength: 50,
    validValues: ['Richland', 'Kennewick', 'Pasco', 'West Richland', 'Benton City', 'Prosser']
  },
  tca: {
    pattern: /^\d{4}[A-Z]?$/,
    minLength: 4,
    maxLength: 5
  },
  hood_code: {
    pattern: /^\d{5}\s\d{3}$/,
    minLength: 9,
    maxLength: 9
  },
  township_range: {
    pattern: /^\d{1,2}[NS]-\d{1,2}[EW]$/,
    minLength: 5,
    maxLength: 7
  }
};

export const dataQualityAgent = {
  id: 'data-quality-agent',
  name: 'Data Quality Agent',
  
  /**
   * Validates region data for correctness
   * @param region The region data to validate
   * @param regionType The type of region
   * @returns Validation result
   */
  validateRegion(region: string, regionType: RegionType) {
    if (!region) {
      return {
        valid: false,
        message: 'Region value is empty'
      };
    }
    
    const rules = regionValidationRules[regionType];
    
    // Check length
    if (region.length < rules.minLength || region.length > rules.maxLength) {
      return {
        valid: false,
        message: `Region length should be between ${rules.minLength} and ${rules.maxLength} characters`
      };
    }
    
    // Check pattern
    if (!rules.pattern.test(region)) {
      return {
        valid: false,
        message: `Region format is invalid for ${regionType}`
      };
    }
    
    // For cities, check against valid values
    if (regionType === 'city' && rules.validValues && !rules.validValues.includes(region)) {
      return {
        valid: false,
        message: `"${region}" is not a recognized city in Benton County`
      };
    }
    
    return {
      valid: true,
      message: 'Region validated successfully'
    };
  },
  
  /**
   * Validates cost matrix data with region-specific validation
   * @param costData The cost data to validate
   * @returns Validation results
   */
  validateCostMatrix(costData: any) {
    const results = {
      valid: true,
      issues: [] as any[],
      regionIssues: [] as any[],
      message: 'Cost matrix validated successfully'
    };
    
    if (!costData) {
      results.valid = false;
      results.message = 'No cost data provided';
      return results;
    }
    
    // Validate cost matrix structure
    if (!costData.matrices || !Array.isArray(costData.matrices)) {
      results.valid = false;
      results.issues.push({
        severity: 'error',
        field: 'matrices',
        message: 'Cost matrices must be an array'
      });
    } else {
      // Validate each matrix
      costData.matrices.forEach((matrix, index) => {
        // Check required fields
        if (!matrix.id) {
          results.valid = false;
          results.issues.push({
            severity: 'error',
            field: `matrices[${index}].id`,
            message: 'Matrix ID is required'
          });
        }
        
        if (!matrix.region_type) {
          results.valid = false;
          results.issues.push({
            severity: 'error',
            field: `matrices[${index}].region_type`,
            message: 'Region type is required'
          });
        } else if (!['city', 'tca', 'hood_code', 'township_range'].includes(matrix.region_type)) {
          results.valid = false;
          results.issues.push({
            severity: 'error',
            field: `matrices[${index}].region_type`,
            message: `Invalid region type: ${matrix.region_type}`
          });
        }
        
        // Validate region value
        if (matrix.region_value) {
          try {
            const regionValidation = this.validateRegion(
              matrix.region_value, 
              matrix.region_type as RegionType
            );
            
            if (!regionValidation.valid) {
              results.valid = false;
              results.regionIssues.push({
                severity: 'error',
                field: `matrices[${index}].region_value`,
                value: matrix.region_value,
                region_type: matrix.region_type,
                message: regionValidation.message
              });
            }
          } catch (error) {
            logger.error('Error validating region:', error);
            results.valid = false;
            results.regionIssues.push({
              severity: 'error',
              field: `matrices[${index}].region_value`,
              value: matrix.region_value,
              message: 'Error validating region'
            });
          }
        } else {
          results.valid = false;
          results.regionIssues.push({
            severity: 'error',
            field: `matrices[${index}].region_value`,
            message: 'Region value is required'
          });
        }
        
        // Validate cost data
        if (!matrix.costs || !Array.isArray(matrix.costs)) {
          results.valid = false;
          results.issues.push({
            severity: 'error',
            field: `matrices[${index}].costs`,
            message: 'Costs must be an array'
          });
        } else if (matrix.costs.length === 0) {
          results.valid = false;
          results.issues.push({
            severity: 'warning',
            field: `matrices[${index}].costs`,
            message: 'Cost array is empty'
          });
        }
      });
    }
    
    if (!results.valid) {
      results.message = 'Cost matrix validation failed';
    }
    
    return results;
  },
  
  /**
   * Analyze quality of region-specific cost data
   * @param costData The cost data to analyze
   * @returns Quality analysis results
   */
  analyzeCostDataQuality(costData: any) {
    const results = {
      quality_score: 0,
      metrics: {
        completeness: 0,
        consistency: 0,
        accuracy: 0
      },
      region_coverage: {
        cities: 0,
        tcas: 0,
        hood_codes: 0,
        township_ranges: 0
      },
      recommendations: [] as string[]
    };
    
    if (!costData || !costData.matrices || !Array.isArray(costData.matrices)) {
      results.recommendations.push('No valid cost data provided for analysis');
      return results;
    }
    
    // Count matrices by region type
    const regionCounts = {
      city: 0,
      tca: 0,
      hood_code: 0,
      township_range: 0
    };
    
    // Track data completeness
    let totalMatrices = costData.matrices.length;
    let matricesWithCosts = 0;
    let totalCostItems = 0;
    let totalValidRegions = 0;
    
    // Analyze each matrix
    costData.matrices.forEach(matrix => {
      // Count by region type
      if (matrix.region_type && regionCounts[matrix.region_type as RegionType] !== undefined) {
        regionCounts[matrix.region_type as RegionType]++;
      }
      
      // Check if it has costs
      if (matrix.costs && Array.isArray(matrix.costs) && matrix.costs.length > 0) {
        matricesWithCosts++;
        totalCostItems += matrix.costs.length;
      }
      
      // Validate region
      if (matrix.region_type && matrix.region_value) {
        try {
          const regionValidation = this.validateRegion(
            matrix.region_value, 
            matrix.region_type as RegionType
          );
          
          if (regionValidation.valid) {
            totalValidRegions++;
          }
        } catch (error) {
          // Skip validation errors
        }
      }
    });
    
    // Calculate metrics
    results.metrics.completeness = totalMatrices > 0 
      ? (matricesWithCosts / totalMatrices) * 100 
      : 0;
      
    results.metrics.consistency = totalMatrices > 0 
      ? (totalValidRegions / totalMatrices) * 100 
      : 0;
      
    // Accuracy is a placeholder - would need more sophisticated analysis
    results.metrics.accuracy = 90;
    
    // Calculate region coverage percentages
    const expectedCityCoverage = regionValidationRules.city.validValues?.length || 6;
    results.region_coverage.cities = expectedCityCoverage > 0 
      ? Math.min(100, (regionCounts.city / expectedCityCoverage) * 100) 
      : 0;
      
    // Simplified coverage for other region types (would need real data about expected counts)
    results.region_coverage.tcas = regionCounts.tca > 0 ? Math.min(100, regionCounts.tca * 5) : 0;
    results.region_coverage.hood_codes = regionCounts.hood_code > 0 ? Math.min(100, regionCounts.hood_code * 2) : 0;
    results.region_coverage.township_ranges = regionCounts.township_range > 0 ? Math.min(100, regionCounts.township_range * 10) : 0;
    
    // Overall quality score (weighted average)
    results.quality_score = (
      results.metrics.completeness * 0.4 + 
      results.metrics.consistency * 0.3 + 
      results.metrics.accuracy * 0.3
    );
    
    // Generate recommendations
    if (results.metrics.completeness < 90) {
      results.recommendations.push('Improve cost data completeness by adding costs to all matrices');
    }
    
    if (results.metrics.consistency < 90) {
      results.recommendations.push('Improve region data consistency by ensuring all region values follow the correct format');
    }
    
    if (results.region_coverage.cities < 70) {
      results.recommendations.push('Increase coverage of city regions to ensure complete geographic coverage');
    }
    
    if (results.region_coverage.tcas < 50) {
      results.recommendations.push('Add more Tax Code Area (TCA) matrices for better regional granularity');
    }
    
    if (results.region_coverage.hood_codes < 50) {
      results.recommendations.push('Expand Hood Code coverage to improve neighborhood-level assessments');
    }
    
    if (results.region_coverage.township_ranges < 40) {
      results.recommendations.push('Add more Township/Range matrices to ensure rural coverage');
    }
    
    return results;
  },
  
  /**
   * Detect anomalies in cost data across regions
   * @param costData The cost data to analyze
   * @returns Detected anomalies
   */
  detectCostAnomalies(costData: any) {
    const results = {
      anomalies: [] as any[],
      summary: {
        total_anomalies: 0,
        critical_anomalies: 0
      }
    };
    
    if (!costData || !costData.matrices || !Array.isArray(costData.matrices)) {
      return results;
    }
    
    // Extract all costs for statistical analysis
    const allCosts: number[] = [];
    const costsByRegionType: Record<string, number[]> = {
      city: [],
      tca: [],
      hood_code: [],
      township_range: []
    };
    
    // Collect costs by region type
    costData.matrices.forEach(matrix => {
      if (matrix.costs && Array.isArray(matrix.costs)) {
        matrix.costs.forEach(cost => {
          const value = parseFloat(cost.value);
          if (!isNaN(value)) {
            allCosts.push(value);
            
            // Add to region-specific array if valid region type
            if (matrix.region_type && costsByRegionType[matrix.region_type]) {
              costsByRegionType[matrix.region_type].push(value);
            }
          }
        });
      }
    });
    
    // Calculate statistics for anomaly detection
    if (allCosts.length > 0) {
      const mean = allCosts.reduce((sum, val) => sum + val, 0) / allCosts.length;
      
      // Calculate standard deviation
      const variance = allCosts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allCosts.length;
      const stdDev = Math.sqrt(variance);
      
      // Threshold for anomaly (3 standard deviations)
      const lowerThreshold = mean - (3 * stdDev);
      const upperThreshold = mean + (3 * stdDev);
      
      // Check each cost item for anomalies
      costData.matrices.forEach(matrix => {
        if (matrix.costs && Array.isArray(matrix.costs)) {
          matrix.costs.forEach(cost => {
            const value = parseFloat(cost.value);
            if (!isNaN(value)) {
              // Check if value is an anomaly
              if (value < lowerThreshold || value > upperThreshold) {
                const regionTypeMean = costsByRegionType[matrix.region_type]?.length 
                  ? costsByRegionType[matrix.region_type].reduce((sum, val) => sum + val, 0) / costsByRegionType[matrix.region_type].length 
                  : mean;
                
                // Calculate how many standard deviations from the mean
                const deviations = Math.abs(value - mean) / stdDev;
                const severity = deviations > 5 ? 'critical' : deviations > 4 ? 'high' : 'medium';
                
                results.anomalies.push({
                  matrix_id: matrix.id,
                  region_type: matrix.region_type,
                  region_value: matrix.region_value,
                  cost_id: cost.id,
                  value: value,
                  expected_range: {
                    lower: lowerThreshold,
                    upper: upperThreshold
                  },
                  region_average: regionTypeMean,
                  deviation_factor: deviations.toFixed(2),
                  severity: severity
                });
                
                if (severity === 'critical') {
                  results.summary.critical_anomalies++;
                }
              }
            }
          });
        }
      });
    }
    
    results.summary.total_anomalies = results.anomalies.length;
    
    return results;
  }
};