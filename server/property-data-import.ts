import { Readable } from 'stream';
import { parse } from 'csv-parse';
import type { IStorage } from './storage';
import { 
  InsertProperty,
  InsertImprovement,
  InsertImprovementDetail,
  InsertImprovementItem,
  InsertLandDetail
} from '@shared/property-schema';

interface ImportOptions {
  propertiesFile?: string | Buffer;
  improvementsFile: string | Buffer;
  improvementDetailsFile: string | Buffer;
  improvementItemsFile: string | Buffer;
  landDetailsFile: string | Buffer;
  batchSize?: number;
  userId: number;
}

interface ImportResults {
  properties: { processed: number, success: number, errors: any[] };
  improvements: { processed: number, success: number, errors: any[] };
  improvementDetails: { processed: number, success: number, errors: any[] };
  improvementItems: { processed: number, success: number, errors: any[] };
  landDetails: { processed: number, success: number, errors: any[] };
}

/**
 * Import property data from CSV files or buffers
 * This function supports both file paths and in-memory buffers
 */
export async function importPropertyData(storage: IStorage, options: ImportOptions): Promise<ImportResults> {
  console.log(`Starting property data import process...`);
  
  // Create activity for import start
  await storage.createActivity({
    action: "Property data import started",
    icon: "ri-file-transfer-line",
    iconColor: "primary",
    details: [{ userId: options.userId }]
  });
  
  const batchSize = options.batchSize || 100;
  
  const results: ImportResults = {
    properties: { processed: 0, success: 0, errors: [] },
    improvements: { processed: 0, success: 0, errors: [] },
    improvementDetails: { processed: 0, success: 0, errors: [] },
    improvementItems: { processed: 0, success: 0, errors: [] },
    landDetails: { processed: 0, success: 0, errors: [] }
  };
  
  try {
    // Import properties first as other tables depend on them
    console.log("Importing properties...");
    await importProperties(options.propertiesFile, batchSize, storage, results);
    
    // Import improvements 
    console.log("Importing improvements...");
    await importImprovements(options.improvementsFile, batchSize, storage, results);
    
    // Import improvement details
    console.log("Importing improvement details...");
    await importImprovementDetails(options.improvementDetailsFile, batchSize, storage, results);
    
    // Import improvement items
    console.log("Importing improvement items...");
    await importImprovementItems(options.improvementItemsFile, batchSize, storage, results);
    
    // Import land details
    console.log("Importing land details...");
    await importLandDetails(options.landDetailsFile, batchSize, storage, results);
    
    console.log("Property data import completed successfully");
    await storage.createActivity({
      action: "Property data import completed successfully",
      icon: "ri-check-line",
      iconColor: "success",
      details: [{ userId: options.userId }]
    });
    
  } catch (error) {
    console.error("Error during property data import:", error);
    try {
      console.error(error);
      await storage.createActivity({
        action: "Property data import failed",
        icon: "ri-error-warning-line",
        iconColor: "danger",
        details: [{ userId: options.userId }]
      });
    } catch (error) {
      console.error("Failed to log error activity:", error);
    }
  }
  
  return results;
}

/**
 * Import properties from CSV file or buffer
 */
async function importProperties(
  filePathOrBuffer: string | Buffer | undefined,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  // If no file is provided, resolve immediately (properties are optional)
  if (!filePathOrBuffer) {
    console.log("No properties file provided, skipping properties import");
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const properties: InsertProperty[] = [];
    let batch: InsertProperty[] = [];
    
    // Create a parser based on file path or buffer
    let parser;
    if (typeof filePathOrBuffer === 'string') {
      parser = require('fs').createReadStream(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    } else {
      // Use buffer directly
      parser = Readable.from(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    }
    
    parser.on('data', async (record) => {
      try {
        results.properties.processed++;
        
        // Convert CSV record to property data model
        const property: InsertProperty = {
          propId: parseInt(record.PROP_ID || '0'),
          block: record.BLOCK || null,
          tractOrLot: record.TRACT_OR_LOT || null,
          legalDesc: record.LEGAL_DESC || null,
          legalDesc2: record.LEGAL_DESC_2 || null,
          townshipSection: record.TOWNSHIP_SECTION || null,
          townshipCode: record.TOWNSHIP_CODE || null,
          rangeCode: record.RANGE_CODE || null,
          townshipQSection: record.TOWNSHIP_Q_SECTION || null,
          cycle: record.CYCLE || null,
          propertyUseCd: record.PROPERTY_USE_CD || null,
          propertyUseDesc: record.PROPERTY_USE_DESC || null,
          market: record.MARKET ? record.MARKET.toString() : null,
          landHstdVal: record.LAND_HSTD_VAL ? record.LAND_HSTD_VAL.toString() : null,
          landNonHstdVal: record.LAND_NON_HSTD_VAL ? record.LAND_NON_HSTD_VAL.toString() : null,
          imprvHstdVal: record.IMPRV_HSTD_VAL ? record.IMPRV_HSTD_VAL.toString() : null,
          imprvNonHstdVal: record.IMPRV_NON_HSTD_VAL ? record.IMPRV_NON_HSTD_VAL.toString() : null,
          hoodCd: record.HOOD_CD || null,
          absSubdvCd: record.ABS_SUBDV_CD || null,
          appraisedVal: record.APPRAISED_VAL ? record.APPRAISED_VAL.toString() : null,
          assessedVal: record.ASSESSED_VAL ? record.ASSESSED_VAL.toString() : null,
          legalAcreage: record.LEGAL_ACREAGE ? record.LEGAL_ACREAGE.toString() : null,
          propTypeCd: record.PROP_TYPE_CD || null,
          imagePath: record.IMAGE_PATH || null,
          geoId: record.GEO_ID || null,
          isActive: record.IS_ACTIVE === 'true' || record.IS_ACTIVE === '1' ? true : false,
          tca: record.TCA || null
        };
        
        batch.push(property);
        
        // Process in batches for efficiency
        if (batch.length >= batchSize) {
          parser.pause();
          await processBatch('properties', batch, storage, results);
          batch = [];
          parser.resume();
        }
        
      } catch (error) {
        results.properties.errors.push({
          record,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    parser.on('end', async () => {
      try {
        // Process any remaining records
        if (batch.length > 0) {
          await processBatch('properties', batch, storage, results);
        }
        console.log(`Properties import completed: ${results.properties.success} of ${results.properties.processed} records imported successfully`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Import improvements from CSV file or buffer
 */
async function importImprovements(
  filePathOrBuffer: string | Buffer,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const improvements: InsertImprovement[] = [];
    let batch: InsertImprovement[] = [];
    
    // Create a parser based on file path or buffer
    let parser;
    if (typeof filePathOrBuffer === 'string') {
      parser = require('fs').createReadStream(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    } else {
      // Use buffer directly
      parser = Readable.from(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    }
    
    parser.on('data', async (record) => {
      try {
        results.improvements.processed++;
        
        // Convert CSV record to improvement data model
        const improvement: InsertImprovement = {
          imprvId: parseInt(record.IMPRV_ID || '0'),
          propId: parseInt(record.PROP_ID || '0'),
          imprvDesc: record.IMPRV_DESC || null,
          imprvVal: record.IMPRV_VAL ? record.IMPRV_VAL.toString() : null,
          livingArea: record.LIVING_AREA ? record.LIVING_AREA.toString() : null,
          primaryUseCd: record.PRIMARY_USE_CD || null,
          stories: record.STORIES ? record.STORIES.toString() : null,
          actualYearBuilt: record.ACTUAL_YEAR_BUILT ? parseInt(record.ACTUAL_YEAR_BUILT) : null,
          totalArea: record.TOTAL_AREA ? record.TOTAL_AREA.toString() : null
        };
        
        batch.push(improvement);
        
        // Process in batches for efficiency
        if (batch.length >= batchSize) {
          parser.pause();
          await processBatch('improvements', batch, storage, results);
          batch = [];
          parser.resume();
        }
        
      } catch (error) {
        results.improvements.errors.push({
          record,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    parser.on('end', async () => {
      try {
        // Process any remaining records
        if (batch.length > 0) {
          await processBatch('improvements', batch, storage, results);
        }
        console.log(`Improvements import completed: ${results.improvements.success} of ${results.improvements.processed} records imported successfully`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Import improvement details from CSV file or buffer
 */
async function importImprovementDetails(
  filePathOrBuffer: string | Buffer,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const details: InsertImprovementDetail[] = [];
    let batch: InsertImprovementDetail[] = [];
    
    // Create a parser based on file path or buffer
    let parser;
    if (typeof filePathOrBuffer === 'string') {
      parser = require('fs').createReadStream(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    } else {
      // Use buffer directly
      parser = Readable.from(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    }
    
    parser.on('data', async (record) => {
      try {
        results.improvementDetails.processed++;
        
        // Convert CSV record to improvement detail data model
        const detail: InsertImprovementDetail = {
          propId: parseInt(record.PROP_ID || '0'),
          imprvId: parseInt(record.IMPRV_ID || '0'),
          livingArea: record.LIVING_AREA ? record.LIVING_AREA.toString() : null,
          belowGradeLivingArea: record.BELOW_GRADE_LIVING_AREA ? record.BELOW_GRADE_LIVING_AREA.toString() : null,
          conditionCd: record.CONDITION_CD || null,
          imprvDetSubClassCd: record.IMPRV_DET_SUB_CLASS_CD || null,
          yrBuilt: record.YR_BUILT ? parseInt(record.YR_BUILT) : null,
          actualAge: record.ACTUAL_AGE ? parseInt(record.ACTUAL_AGE) : null,
          numStories: record.NUM_STORIES ? record.NUM_STORIES.toString() : null,
          imprvDetTypeCd: record.IMPRV_DET_TYPE_CD || null,
          imprvDetDesc: record.IMPRV_DET_DESC || null,
          imprvDetArea: record.IMPRV_DET_AREA ? record.IMPRV_DET_AREA.toString() : null,
          imprvDetClassCd: record.IMPRV_DET_CLASS_CD || null
        };
        
        batch.push(detail);
        
        // Process in batches for efficiency
        if (batch.length >= batchSize) {
          parser.pause();
          await processBatch('improvementDetails', batch, storage, results);
          batch = [];
          parser.resume();
        }
        
      } catch (error) {
        results.improvementDetails.errors.push({
          record,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    parser.on('end', async () => {
      try {
        // Process any remaining records
        if (batch.length > 0) {
          await processBatch('improvementDetails', batch, storage, results);
        }
        console.log(`Improvement details import completed: ${results.improvementDetails.success} of ${results.improvementDetails.processed} records imported successfully`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Import improvement items from CSV file or buffer
 */
async function importImprovementItems(
  filePathOrBuffer: string | Buffer,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const items: InsertImprovementItem[] = [];
    let batch: InsertImprovementItem[] = [];
    
    // Create a parser based on file path or buffer
    let parser;
    if (typeof filePathOrBuffer === 'string') {
      parser = require('fs').createReadStream(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    } else {
      // Use buffer directly
      parser = Readable.from(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    }
    
    parser.on('data', async (record) => {
      try {
        results.improvementItems.processed++;
        
        // Convert CSV record to improvement item data model
        const item: InsertImprovementItem = {
          propId: parseInt(record.PROP_ID || '0'),
          imprvId: parseInt(record.IMPRV_ID || '0'),
          bedrooms: record.BEDROOMS ? record.BEDROOMS.toString() : null,
          baths: record.BATHS ? record.BATHS.toString() : null,
          halfBath: record.HALFBATH ? record.HALFBATH.toString() : null,
          foundation: record.FOUNDATION || null,
          extwallDesc: record.EXTWALL_DESC || null,
          roofcoverDesc: record.ROOFCOVER_DESC || null,
          hvacDesc: record.HVAC_DESC || null,
          fireplaces: record.FIREPLACES ? record.FIREPLACES.toString() : null,
          sprinkler: record.SPRINKLER === 'true' || record.SPRINKLER === '1',
          framingClass: record.FRAMING_CLASS || null,
          comHvac: record.COM_HVAC || null
        };
        
        batch.push(item);
        
        // Process in batches for efficiency
        if (batch.length >= batchSize) {
          parser.pause();
          await processBatch('improvementItems', batch, storage, results);
          batch = [];
          parser.resume();
        }
        
      } catch (error) {
        results.improvementItems.errors.push({
          record,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    parser.on('end', async () => {
      try {
        // Process any remaining records
        if (batch.length > 0) {
          await processBatch('improvementItems', batch, storage, results);
        }
        console.log(`Improvement items import completed: ${results.improvementItems.success} of ${results.improvementItems.processed} records imported successfully`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Import land details from CSV file or buffer
 */
async function importLandDetails(
  filePathOrBuffer: string | Buffer,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const details: InsertLandDetail[] = [];
    let batch: InsertLandDetail[] = [];
    
    // Create a parser based on file path or buffer
    let parser;
    if (typeof filePathOrBuffer === 'string') {
      parser = require('fs').createReadStream(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    } else {
      // Use buffer directly
      parser = Readable.from(filePathOrBuffer)
        .pipe(parse({
          columns: true,
          skip_empty_lines: true,
          trim: true
        }));
    }
    
    parser.on('data', async (record) => {
      try {
        results.landDetails.processed++;
        
        // Convert CSV record to land detail data model
        const detail: InsertLandDetail = {
          propId: parseInt(record.PROP_ID || '0'),
          sizeAcres: record.SIZE_ACRES ? record.SIZE_ACRES.toString() : null,
          sizeSquareFeet: record.SIZE_SQUARE_FEET ? record.SIZE_SQUARE_FEET.toString() : null,
          landTypeCd: record.LAND_TYPE_CD || null,
          landSoilCode: record.LAND_SOIL_CODE || null,
          agUseCd: record.AG_USE_CD || null,
          primaryUseCd: record.PRIMARY_USE_CD || null
        };
        
        batch.push(detail);
        
        // Process in batches for efficiency
        if (batch.length >= batchSize) {
          parser.pause();
          await processBatch('landDetails', batch, storage, results);
          batch = [];
          parser.resume();
        }
        
      } catch (error) {
        results.landDetails.errors.push({
          record,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    parser.on('end', async () => {
      try {
        // Process any remaining records
        if (batch.length > 0) {
          await processBatch('landDetails', batch, storage, results);
        }
        console.log(`Land details import completed: ${results.landDetails.success} of ${results.landDetails.processed} records imported successfully`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
    
    parser.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Process a batch of records
 */
async function processBatch(
  type: keyof ImportResults,
  batch: any[],
  storage: IStorage,
  results: ImportResults
): Promise<void> {
  try {
    let response;
    
    switch (type) {
      case 'properties':
        response = await storage.bulkInsertProperties(batch);
        break;
      case 'improvements':
        response = await storage.bulkInsertImprovements(batch);
        break;
      case 'improvementDetails':
        response = await storage.bulkInsertImprovementDetails(batch);
        break;
      case 'improvementItems':
        response = await storage.bulkInsertImprovementItems(batch);
        break;
      case 'landDetails':
        response = await storage.bulkInsertLandDetails(batch);
        break;
    }
    
    results[type].success += response?.count || 0;
    
  } catch (err) {
    console.error(`Error processing batch of ${type}:`, err);
    for (const item of batch) {
      results[type].errors.push({
        record: item,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }
}