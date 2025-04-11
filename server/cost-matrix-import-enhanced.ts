/**
 * Enhanced Cost Matrix Import Module
 * 
 * This module provides enhanced import functionality for cost matrices with
 * data quality validation and detailed error reporting.
 */

import { parse } from 'csv-parse/sync';
import { IStorage } from './storage';
import { RuleType, validateCostMatrix, ValidationReport } from './data-quality';

/**
 * Process cost matrix CSV file
 * 
 * @param storage Storage interface
 * @param fileBuffer File buffer containing CSV data
 * @param batchSize Number of records to process in one batch
 * @param options Additional processing options
 * @returns Import results
 */
export async function processCostMatrixFile(
  storage: IStorage,
  fileBuffer: Buffer,
  batchSize: number = 100,
  options: {
    year?: number;
    region?: string;
    validateOnly?: boolean;
    validBuildingTypes?: string[];
  } = {}
): Promise<{
  processed: number;
  success: number;
  errors: number;
  quality: any;
}> {
  console.log(`Processing cost matrix file with options:`, options);
  
  // Default year to current year if not provided
  const year = options.year || new Date().getFullYear();
  
  // Parse CSV file
  const records = parse(fileBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  // Initialize counters
  let processed = 0;
  let success = 0;
  let errors = 0;
  
  // Quality tracking
  const qualityReports: ValidationReport[] = [];
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      // Transform and validate each matrix entry
      for (const record of batch) {
        processed++;
        
        // Format region properly
        let region = record.region || options.region || 'UNKNOWN';
        region = region.toUpperCase().trim();
        
        // Format building type properly
        let buildingType = record.buildingType || record.building_type || record.type || 'UNKNOWN';
        buildingType = buildingType.toUpperCase().trim();
        
        // Extract quality if available
        const quality = record.quality || null;
        
        // Parse numeric values
        const baseRate = parseFloat(record.baseRate || record.base_rate || 0);
        const adjustmentFactor = record.adjustmentFactor || record.adjustment_factor
          ? parseFloat(record.adjustmentFactor || record.adjustment_factor)
          : 1.0;
        
        // Create material costs object if available
        const materialCosts = {};
        for (const [key, value] of Object.entries(record)) {
          if (key.startsWith('material_') || key.startsWith('cost_')) {
            const materialKey = key.replace(/^(material_|cost_)/, '');
            materialCosts[materialKey] = parseFloat(value) || 0;
          }
        }
        
        // Prepare complete cost matrix entry
        const matrixEntry = {
          region,
          buildingType,
          quality,
          baseRate: isNaN(baseRate) ? 0 : baseRate,
          adjustmentFactor: isNaN(adjustmentFactor) ? 1.0 : adjustmentFactor,
          materialCosts: Object.keys(materialCosts).length > 0 ? materialCosts : null,
          applicableYear: year,
          notes: record.notes || record.description || null
        };
        
        // Validate the matrix entry against rules
        const validationResult = validateCostMatrix(matrixEntry, {
          ruleSets: [RuleType.COST_MATRIX],
          relatedData: {
            validBuildingTypes: options.validBuildingTypes
          }
        });
        
        // Track validation results
        qualityReports.push(validationResult.report);
        
        // Skip insert if validate-only mode is enabled
        if (options.validateOnly) {
          if (validationResult.passed) {
            success++;
          } else {
            errors++;
            console.log(`Validation failed for matrix [${region}][${buildingType}]:`, 
              validationResult.report.issues.map(i => i.message).join(', '));
          }
          continue;
        }
        
        // Only insert if validation passed
        if (validationResult.passed) {
          try {
            // Call the storage method to create/update the cost matrix entry
            await storage.createCostMatrix(matrixEntry);
            success++;
          } catch (error) {
            console.error(`Error creating cost matrix entry:`, error);
            errors++;
          }
        } else {
          errors++;
          console.log(`Validation failed for matrix [${region}][${buildingType}]:`, 
            validationResult.report.issues.map(i => i.message).join(', '));
        }
      }
    } catch (error) {
      console.error(`Error processing cost matrix batch ${i}-${i + batch.length}:`, error);
      errors += batch.length;
    }
  }
  
  console.log(`Processed ${processed} cost matrix entries: ${success} successful, ${errors} failed`);
  
  // Generate quality report
  const qualitySummary = aggregateQualityReports(qualityReports);
  
  return {
    processed,
    success,
    errors,
    quality: qualitySummary
  };
}

/**
 * Aggregate validation reports into a summary report
 * 
 * @param reports Individual validation reports
 * @returns Aggregated quality summary
 */
function aggregateQualityReports(reports: ValidationReport[]): any {
  // Initialize summary counters
  const summary = {
    timestamp: new Date(),
    entityType: RuleType.COST_MATRIX,
    totalRecords: reports.length,
    passedRecords: reports.filter(r => r.passed).length,
    failedRecords: reports.filter(r => !r.passed).length,
    criticalErrors: 0,
    errors: 0,
    warnings: 0,
    infoMessages: 0,
    ruleStats: [] as any[]
  };
  
  // Create a map for rule statistics
  const ruleStatsMap = new Map();
  
  // Process each report
  for (const report of reports) {
    // Count issues by severity
    for (const issue of report.issues) {
      switch (issue.severity) {
        case 'CRITICAL':
          summary.criticalErrors++;
          break;
        case 'ERROR':
          summary.errors++;
          break;
        case 'WARNING':
          summary.warnings++;
          break;
        case 'INFO':
          summary.infoMessages++;
          break;
      }
      
      // Track rule statistics
      if (!ruleStatsMap.has(issue.ruleId)) {
        ruleStatsMap.set(issue.ruleId, {
          ruleId: issue.ruleId,
          failed: 0,
          total: reports.length
        });
      }
      
      const ruleStat = ruleStatsMap.get(issue.ruleId);
      ruleStat.failed++;
    }
  }
  
  // Convert rule stats map to array
  summary.ruleStats = Array.from(ruleStatsMap.values());
  
  // Calculate pass rate
  summary.passRate = summary.totalRecords > 0
    ? (summary.passedRecords / summary.totalRecords) * 100
    : 0;
    
  return summary;
}