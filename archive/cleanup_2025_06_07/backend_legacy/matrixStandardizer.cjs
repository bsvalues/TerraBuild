/**
 * Matrix Data Standardizer
 * 
 * This module provides functions to standardize, normalize, and clean
 * cost matrix data from Excel imports.
 */

/**
 * Building type mapping for standardization
 */
const BUILDING_TYPE_MAPPING = {
  'res': 'RESIDENTIAL',
  'residential': 'RESIDENTIAL',
  'comm': 'COMMERCIAL',
  'commercial': 'COMMERCIAL',
  'ind': 'INDUSTRIAL',
  'industrial': 'INDUSTRIAL',
  'apt': 'APARTMENT',
  'apartment': 'APARTMENT',
  'off': 'OFFICE',
  'office': 'OFFICE',
  'ret': 'RETAIL',
  'retail': 'RETAIL',
  'war': 'WAREHOUSE',
  'warehouse': 'WAREHOUSE',
  'man': 'MANUFACTURING',
  'manufacturing': 'MANUFACTURING',
  'hos': 'HOSPITAL',
  'hospital': 'HOSPITAL',
  'edu': 'EDUCATION',
  'education': 'EDUCATION',
  'school': 'EDUCATION',
  'gov': 'GOVERNMENT',
  'government': 'GOVERNMENT',
};

/**
 * Region mapping for standardization
 */
const REGION_MAPPING = {
  'north richland': 'RICHLAND',
  'south richland': 'RICHLAND',
  'richland': 'RICHLAND',
  'north kennewick': 'KENNEWICK',
  'south kennewick': 'KENNEWICK',
  'kennewick': 'KENNEWICK',
  'pasco': 'PASCO',
  'west pasco': 'PASCO',
  'east pasco': 'PASCO',
  'west benton': 'WEST_BENTON',
  'east benton': 'EAST_BENTON',
  'benton city': 'BENTON_CITY',
  'prosser': 'PROSSER',
  'finley': 'FINLEY',
  'west richland': 'WEST_RICHLAND',
};

/**
 * Standardize cost matrix data
 * @param {Array<Object>} data - Raw matrix data
 * @param {Object} options - Standardization options
 * @returns {Array<Object>} Standardized data
 */
function standardizeMatrixData(data, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  return data.map(item => {
    const standardizedItem = { ...item };
    
    // Standardize currency values
    if (item.cell_value !== undefined) {
      standardizedItem.cell_value = standardizeCurrencyValue(item.cell_value);
    }
    
    // Standardize building types
    if (item.building_type !== undefined) {
      standardizedItem.building_type = standardizeBuildingType(item.building_type);
    }
    
    // Extract and standardize region from description
    if (item.description !== undefined && !item.region) {
      standardizedItem.region = extractRegionFromDescription(item.description);
    } else if (item.region) {
      standardizedItem.region = standardizeRegion(item.region);
    }
    
    // Detect outliers if enabled
    if (options.detectOutliers && 
        typeof standardizedItem.cell_value === 'number' && 
        !isNaN(standardizedItem.cell_value)) {
      
      const outlierInfo = detectOutlier(standardizedItem.cell_value, data);
      
      if (outlierInfo.isOutlier) {
        standardizedItem.isOutlier = true;
        standardizedItem.originalValue = standardizedItem.cell_value;
        standardizedItem.suggestedValue = outlierInfo.suggestedValue;
        
        // Replace with suggested value if auto-correct is enabled
        if (options.autoCorrectOutliers) {
          standardizedItem.cell_value = outlierInfo.suggestedValue;
        }
      }
    }
    
    return standardizedItem;
  });
}

/**
 * Standardize currency value
 * @param {any} value - Raw value
 * @returns {number} Standardized number
 */
function standardizeCurrencyValue(value) {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value !== 'string') {
    return NaN;
  }
  
  // Remove currency symbols and whitespace
  let cleanValue = value.replace(/[$£€¥]/g, '').trim();
  
  // Different approach for handling comma/period separators
  // First case: commas as thousand separators (e.g. 1,234.56)
  if (cleanValue.indexOf('.') > -1) {
    // Remove thousand separators
    cleanValue = cleanValue.replace(/,/g, '');
  } 
  // Second case: periods as thousand separators and comma as decimal (e.g. 1.234,56)
  else if (cleanValue.indexOf(',') > -1) {
    // Replace decimal comma with period
    cleanValue = cleanValue.replace(/(\d+),(\d+)/, '$1.$2');
    // Remove thousand separators if any
    cleanValue = cleanValue.replace(/\./g, '');
  }
  
  // Remove percentage signs
  cleanValue = cleanValue.replace(/%$/, '');
  
  return parseFloat(cleanValue);
}

/**
 * Standardize building type
 * @param {string} buildingType - Raw building type
 * @returns {string} Standardized building type
 */
function standardizeBuildingType(buildingType) {
  if (typeof buildingType !== 'string') {
    return 'UNKNOWN';
  }
  
  const normalized = buildingType.toLowerCase().trim();
  
  return BUILDING_TYPE_MAPPING[normalized] || buildingType.toUpperCase();
}

/**
 * Standardize region
 * @param {string} region - Raw region
 * @returns {string} Standardized region
 */
function standardizeRegion(region) {
  if (typeof region !== 'string') {
    return 'UNKNOWN';
  }
  
  const normalized = region.toLowerCase().trim();
  
  return REGION_MAPPING[normalized] || region.toUpperCase();
}

/**
 * Extract region from description
 * @param {string} description - Matrix description
 * @returns {string|null} Extracted region or null
 */
function extractRegionFromDescription(description) {
  if (typeof description !== 'string') {
    return null;
  }
  
  const normalized = description.toLowerCase();
  
  for (const [key, value] of Object.entries(REGION_MAPPING)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  return null;
}

/**
 * Detect outliers using statistical methods
 * @param {number} value - Value to check
 * @param {Array<Object>} data - All data points
 * @returns {Object} Outlier information
 */
function detectOutlier(value, data) {
  const numericValues = data
    .map(item => typeof item.cell_value === 'number' ? item.cell_value : null)
    .filter(val => val !== null && !isNaN(val));
  
  if (numericValues.length < 4) {
    return { isOutlier: false };
  }
  
  // Calculate median and MAD (Median Absolute Deviation)
  const median = calculateMedian(numericValues);
  const deviations = numericValues.map(v => Math.abs(v - median));
  const mad = calculateMedian(deviations);
  
  // Modified Z-score
  const modifiedZScore = 0.6745 * Math.abs(value - median) / mad;
  
  const isOutlier = modifiedZScore > 3.5;
  
  return {
    isOutlier,
    modifiedZScore,
    median,
    mad,
    suggestedValue: isOutlier ? median : value
  };
}

/**
 * Calculate median of an array of numbers
 * @param {Array<number>} values - Array of numbers
 * @returns {number} Median value
 */
function calculateMedian(values) {
  if (!Array.isArray(values) || values.length === 0) {
    return NaN;
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  } else {
    return sorted[middle];
  }
}

module.exports = {
  standardizeMatrixData,
  standardizeCurrencyValue,
  standardizeBuildingType,
  standardizeRegion,
  extractRegionFromDescription,
  detectOutlier
};