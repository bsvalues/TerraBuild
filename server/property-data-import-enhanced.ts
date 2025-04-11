/**
 * Enhanced Property Data Import Module with Data Quality Validation
 * 
 * This module enhances the property data import process with data quality validation
 * and provides improved error handling and logging.
 */

import fs from 'fs';
import * as csvParse from 'csv-parse';
import { IStorage } from './storage';
import { parse } from 'csv-parse/sync';
import { 
  DataQualityValidator, 
  RuleType, 
  ValidationContext,
  createBatchQualityReport
} from './data-quality/framework';
import { allPropertyRules } from './data-quality/property-rules';

// Create a validator with all property rules
const propertyValidator = new DataQualityValidator(allPropertyRules);

interface ImportOptions {
  propertiesFile?: Buffer;
  improvementsFile: Buffer;
  improvementDetailsFile: Buffer;
  improvementItemsFile: Buffer;
  landDetailsFile: Buffer;
  userId: number;
  batchSize?: number;
}

interface ImportResults {
  properties?: {
    processed: number;
    success: number;
    errors: number;
    quality: any;
  };
  improvements?: {
    processed: number;
    success: number;
    errors: number;
    quality: any;
  };
  improvementDetails?: {
    processed: number;
    success: number;
    errors: number;
    quality: any;
  };
  improvementItems?: {
    processed: number;
    success: number;
    errors: number;
    quality: any;
  };
  landDetails?: {
    processed: number;
    success: number;
    errors: number;
    quality: any;
  };
  duration: number;
  errors?: string[];
}

/**
 * Import property data with enhanced data quality validation
 * 
 * @param storage Storage interface
 * @param options Import options including file buffers
 * @returns Import results with data quality reports
 */
export async function importPropertyDataEnhanced(
  storage: IStorage,
  options: ImportOptions
): Promise<ImportResults> {
  const startTime = Date.now();
  const batchSize = options.batchSize || 100;
  const results: ImportResults = {
    duration: 0,
    errors: []
  };
  
  console.log(`Starting enhanced property data import process...`);
  
  try {
    // Process properties file if provided
    if (options.propertiesFile) {
      results.properties = await processPropertiesFile(
        storage,
        options.propertiesFile,
        batchSize
      );
    }
    
    // Process improvements file
    results.improvements = await processImprovementsFile(
      storage, 
      options.improvementsFile,
      batchSize
    );
    
    // Process improvement details file
    results.improvementDetails = await processImprovementDetailsFile(
      storage,
      options.improvementDetailsFile,
      batchSize
    );
    
    // Process improvement items file
    results.improvementItems = await processImprovementItemsFile(
      storage,
      options.improvementItemsFile,
      batchSize
    );
    
    // Process land details file
    results.landDetails = await processLandDetailsFile(
      storage,
      options.landDetailsFile,
      batchSize
    );
    
    // Calculate total duration
    results.duration = Date.now() - startTime;
    
    console.log(`Property data import completed successfully in ${results.duration}ms`);
    return results;
    
  } catch (error) {
    console.error("Error during enhanced property data import:", error);
    results.errors = results.errors || [];
    results.errors.push((error as Error).message);
    results.duration = Date.now() - startTime;
    return results;
  }
}

/**
 * Process properties file with data quality validation
 * 
 * @param storage Storage interface
 * @param fileBuffer File buffer containing CSV data
 * @param batchSize Number of records to process in one batch
 * @returns Import results
 */
async function processPropertiesFile(
  storage: IStorage,
  fileBuffer: Buffer,
  batchSize: number
): Promise<{
  processed: number;
  success: number;
  errors: number;
  quality: any;
}> {
  console.log(`Processing properties file...`);
  
  // Parse CSV file
  const records = parse(fileBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  // Validate data quality
  const qualityReport = createBatchQualityReport(
    records,
    propertyValidator,
    RuleType.PROPERTY
  );
  
  console.log(`Data quality validation complete: ${qualityReport.summary.passedRecords} of ${qualityReport.summary.totalRecords} records passed`);
  
  // Initialize counters
  let processed = 0;
  let success = 0;
  let errors = 0;
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      // Transform records
      const propertyBatch = batch.map((record: any) => {
        processed++;
        
        // Transform the record data
        return {
          propId: record.propId || record.property_id || record.id,
          block: record.block || null,
          tractOr: record.tractOr || record.tract || null,
          lot: record.lot || null,
          address: record.address || record.street_address || null,
          city: record.city || null,
          state: record.state || null,
          zip: record.zip || record.zipcode || record.zip_code || null,
          acres: parseFloat(record.acres || 0) || null,
          landValue: parseFloat(record.landValue || record.land_value || 0) || null,
          improvementValue: parseFloat(record.improvementValue || record.improvement_value || 0) || null,
          totalValue: parseFloat(record.totalValue || record.total_value || 0) || null
        };
      });
      
      // Insert into database using individual create method for each property
      for (const property of propertyBatch) {
        try {
          await storage.createProperty(property);
          success++;
        } catch (error) {
          console.error(`Error creating property:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing property batch ${i}-${i + batch.length}:`, error);
      errors += batch.length;
    }
  }
  
  console.log(`Processed ${processed} properties: ${success} successful, ${errors} failed`);
  
  return {
    processed,
    success,
    errors,
    quality: qualityReport
  };
}

/**
 * Process improvements file with data quality validation
 * 
 * @param storage Storage interface
 * @param fileBuffer File buffer containing CSV data
 * @param batchSize Number of records to process in one batch
 * @returns Import results
 */
async function processImprovementsFile(
  storage: IStorage,
  fileBuffer: Buffer,
  batchSize: number
): Promise<{
  processed: number;
  success: number;
  errors: number;
  quality: any;
}> {
  console.log(`Processing improvements file...`);
  
  // Parse CSV file
  const records = parse(fileBuffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  // Validate data quality
  const qualityReport = createBatchQualityReport(
    records,
    propertyValidator,
    RuleType.IMPROVEMENT
  );
  
  console.log(`Data quality validation complete: ${qualityReport.summary.passedRecords} of ${qualityReport.summary.totalRecords} records passed`);
  
  // Initialize counters
  let processed = 0;
  let success = 0;
  let errors = 0;
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      // Transform records
      const improvementBatch = batch.map((record: any) => {
        processed++;
        
        // Transform the record data
        return {
          propId: record.propId || record.property_id,
          improvementId: record.improvementId || record.improvement_id || record.id,
          buildingType: record.buildingType || record.building_type || null,
          yearBuilt: parseInt(record.yearBuilt || record.year_built || 0) || null,
          quality: record.quality || null,
          condition: record.condition || null,
          squareFeet: parseFloat(record.squareFeet || record.square_feet || record.area || 0) || null,
          value: parseFloat(record.value || record.total_value || 0) || null
        };
      });
      
      // Insert into database using individual create method for each improvement
      for (const improvement of improvementBatch) {
        try {
          await storage.createImprovement(improvement);
          success++;
        } catch (error) {
          console.error(`Error creating improvement:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing improvement batch ${i}-${i + batch.length}:`, error);
      errors += batch.length;
    }
  }
  
  console.log(`Processed ${processed} improvements: ${success} successful, ${errors} failed`);
  
  return {
    processed,
    success,
    errors,
    quality: qualityReport
  };
}

/**
 * Process improvement details file
 * 
 * @param storage Storage interface
 * @param fileBuffer File buffer containing CSV data
 * @param batchSize Number of records to process in one batch
 * @returns Import results
 */
async function processImprovementDetailsFile(
  storage: IStorage,
  fileBuffer: Buffer,
  batchSize: number
): Promise<{
  processed: number;
  success: number;
  errors: number;
  quality: any;
}> {
  console.log(`Processing improvement details file...`);
  
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
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      // Transform records for the database schema
      const detailsBatch = batch.map((record: Record<string, any>) => {
        processed++;
        
        return {
          improvementId: record.improvementId || record.improvement_id,
          detailType: record.detailType || record.detail_type || record.type,
          description: record.description || null,
          value: parseFloat(record.value || 0) || null
        };
      });
      
      // Insert into database using individual create method for each detail
      for (const detail of detailsBatch) {
        try {
          await storage.createImprovementDetail(detail);
          success++;
        } catch (error) {
          console.error(`Error creating improvement detail:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing improvement details batch ${i}-${i + batch.length}:`, error);
      errors += batch.length;
    }
  }
  
  console.log(`Processed ${processed} improvement details: ${success} successful, ${errors} failed`);
  
  // No specific validation rules for improvement details yet
  return {
    processed,
    success,
    errors,
    quality: {
      timestamp: new Date(),
      entityType: RuleType.IMPROVEMENT_DETAIL,
      summary: {
        totalRecords: processed,
        passedRecords: success,
        failedRecords: errors,
        passRate: processed > 0 ? (success / processed) * 100 : 0
      }
    }
  };
}

/**
 * Process improvement items file
 * 
 * @param storage Storage interface
 * @param fileBuffer File buffer containing CSV data
 * @param batchSize Number of records to process in one batch
 * @returns Import results
 */
async function processImprovementItemsFile(
  storage: IStorage,
  fileBuffer: Buffer,
  batchSize: number
): Promise<{
  processed: number;
  success: number;
  errors: number;
  quality: any;
}> {
  console.log(`Processing improvement items file...`);
  
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
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      // Transform records for the database schema
      const itemsBatch = batch.map((record: Record<string, any>) => {
        processed++;
        
        return {
          improvementId: record.improvementId || record.improvement_id,
          itemType: record.itemType || record.item_type || record.type,
          description: record.description || null,
          quantity: parseFloat(record.quantity || 1) || 1,
          unitCost: parseFloat(record.unitCost || record.unit_cost || 0) || null,
          totalCost: parseFloat(record.totalCost || record.total_cost || 0) || null
        };
      });
      
      // Insert into database using individual create method for each item
      for (const item of itemsBatch) {
        try {
          await storage.createImprovementItem(item);
          success++;
        } catch (error) {
          console.error(`Error creating improvement item:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing improvement items batch ${i}-${i + batch.length}:`, error);
      errors += batch.length;
    }
  }
  
  console.log(`Processed ${processed} improvement items: ${success} successful, ${errors} failed`);
  
  // No specific validation rules for improvement items yet
  return {
    processed,
    success,
    errors,
    quality: {
      timestamp: new Date(),
      entityType: RuleType.IMPROVEMENT_ITEM,
      summary: {
        totalRecords: processed,
        passedRecords: success,
        failedRecords: errors,
        passRate: processed > 0 ? (success / processed) * 100 : 0
      }
    }
  };
}

/**
 * Process land details file
 * 
 * @param storage Storage interface
 * @param fileBuffer File buffer containing CSV data
 * @param batchSize Number of records to process in one batch
 * @returns Import results
 */
async function processLandDetailsFile(
  storage: IStorage,
  fileBuffer: Buffer,
  batchSize: number
): Promise<{
  processed: number;
  success: number;
  errors: number;
  quality: any;
}> {
  console.log(`Processing land details file...`);
  
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
  
  // Process records in batches
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    try {
      // Transform records for the database schema
      const landDetailsBatch = batch.map((record: Record<string, any>) => {
        processed++;
        
        return {
          propId: record.propId || record.property_id,
          landType: record.landType || record.land_type || record.type,
          acres: parseFloat(record.acres || 0) || null,
          squareFeet: parseFloat(record.squareFeet || record.square_feet || 0) || null,
          value: parseFloat(record.value || 0) || null,
          description: record.description || null
        };
      });
      
      // Insert into database using individual create method for each land detail
      for (const landDetail of landDetailsBatch) {
        try {
          await storage.createLandDetail(landDetail);
          success++;
        } catch (error) {
          console.error(`Error creating land detail:`, error);
          errors++;
        }
      }
    } catch (error) {
      console.error(`Error processing land details batch ${i}-${i + batch.length}:`, error);
      errors += batch.length;
    }
  }
  
  console.log(`Processed ${processed} land details: ${success} successful, ${errors} failed`);
  
  // No specific validation rules for land details yet
  return {
    processed,
    success,
    errors,
    quality: {
      timestamp: new Date(),
      entityType: RuleType.LAND_DETAIL,
      summary: {
        totalRecords: processed,
        passedRecords: success,
        failedRecords: errors,
        passRate: processed > 0 ? (success / processed) * 100 : 0
      }
    }
  };
}

/**
 * Summarize data quality issues
 * 
 * @param qualityReports Quality reports from import process
 * @returns Summarized quality issues
 */
export function summarizeDataQualityIssues(qualityReports: Record<string, any>): any {
  const summary = {
    timestamp: new Date(),
    totalIssues: 0,
    criticalIssues: 0,
    errorIssues: 0,
    warningIssues: 0,
    infoIssues: 0,
    records: {
      total: 0,
      withIssues: 0,
      clean: 0
    },
    byEntityType: {} as Record<string, any>,
    topIssues: [] as any[]
  };
  
  // Process each report
  Object.entries(qualityReports).forEach(([entityType, report]) => {
    const { summary: reportSummary } = report;
    
    // Add to the total counts
    summary.records.total += reportSummary.totalRecords;
    summary.records.withIssues += reportSummary.failedRecords;
    summary.records.clean += reportSummary.passedRecords;
    
    summary.criticalIssues += reportSummary.criticalErrors || 0;
    summary.errorIssues += reportSummary.errors || 0;
    summary.warningIssues += reportSummary.warnings || 0;
    summary.infoIssues += reportSummary.infoMessages || 0;
    
    // Total issues
    const entityIssues = (reportSummary.criticalErrors || 0) +
                        (reportSummary.errors || 0) +
                        (reportSummary.warnings || 0) +
                        (reportSummary.infoMessages || 0);
    
    summary.totalIssues += entityIssues;
    
    // Add entity-specific summary
    summary.byEntityType[entityType] = {
      totalRecords: reportSummary.totalRecords,
      passedRecords: reportSummary.passedRecords,
      failedRecords: reportSummary.failedRecords,
      passRate: reportSummary.passRate,
      issues: entityIssues
    };
    
    // Collect top issues if available
    if (report.ruleStats) {
      report.ruleStats
        .sort((a: any, b: any) => b.failed - a.failed)
        .slice(0, 5)
        .forEach((rule: any) => {
          if (rule.failed > 0) {
            summary.topIssues.push({
              ruleId: rule.ruleId,
              entityType,
              failed: rule.failed,
              total: rule.total,
              failRate: (rule.failed / rule.total) * 100
            });
          }
        });
    }
  });
  
  // Sort top issues by failure count
  summary.topIssues.sort((a, b) => b.failed - a.failed);
  
  // Get only the top 10 issues overall
  summary.topIssues = summary.topIssues.slice(0, 10);
  
  return summary;
}