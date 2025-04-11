import fs from 'fs';
import path from 'path';
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
  propertiesFile: string;
  improvementsFile: string;
  improvementDetailsFile: string;
  improvementItemsFile: string;
  landDetailsFile: string;
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
 * Import property data from CSV files
 */
export async function importPropertyData(storage: IStorage, options: ImportOptions): Promise<ImportResults> {
  console.log(`Starting property data import process...`);
  
  // Create activity for import start
  await storage.createActivity({
    action: "Property data import started",
    icon: "ri-file-transfer-line",
    iconColor: "primary",
    userId: options.userId
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
      userId: options.userId
    });
    
  } catch (error) {
    console.error("Error during property data import:", error);
    try {
      console.error(error);
      await storage.createActivity({
        action: "Property data import failed",
        icon: "ri-error-warning-line",
        iconColor: "danger",
        userId: options.userId
      });
    } catch (error) {
      console.error("Failed to log error activity:", error);
    }
  }
  
  return results;
}

/**
 * Import properties from CSV file
 */
async function importProperties(
  filePath: string,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const properties: InsertProperty[] = [];
    let batch: InsertProperty[] = [];
    
    // Create a readable stream for the CSV file
    const parser = fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    parser.on('data', async (record) => {
      try {
        results.properties.processed++;
        
        // Convert CSV record to property data model
        const property: InsertProperty = {
          propId: parseInt(record.PROP_ID || '0'),
          accountId: record.ACCOUNT_ID || null,
          ownerId: parseInt(record.OWNER_ID || '0'),
          parcelId: record.PARCEL_ID || null,
          taxYear: parseInt(record.TAX_YEAR || '0'),
          taxCode: record.TAX_CODE || null,
          propClass: record.PROP_CLASS || null,
          propStatus: record.PROP_STATUS || null,
          propType: record.PROP_TYPE || null,
          siteAddress: record.SITE_ADDRESS || null,
          siteCity: record.SITE_CITY || null,
          siteState: record.SITE_STATE || null,
          siteZip: record.SITE_ZIP || null,
          legalDesc: record.LEGAL_DESC || null,
          acreage: parseFloat(record.ACREAGE || '0'),
          marketValue: parseInt(record.MARKET_VALUE || '0'),
          assessedValue: parseInt(record.ASSESSED_VALUE || '0'),
          taxableValue: parseInt(record.TAXABLE_VALUE || '0'),
          landValue: parseInt(record.LAND_VALUE || '0'),
          improvementValue: parseInt(record.IMPROVEMENT_VALUE || '0')
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
 * Import improvements from CSV file
 */
async function importImprovements(
  filePath: string,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const improvements: InsertImprovement[] = [];
    let batch: InsertImprovement[] = [];
    
    // Create a readable stream for the CSV file
    const parser = fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    parser.on('data', async (record) => {
      try {
        results.improvements.processed++;
        
        // Convert CSV record to improvement data model
        const improvement: InsertImprovement = {
          imprvId: parseInt(record.IMPRV_ID || '0'),
          propId: parseInt(record.PROP_ID || '0'),
          buildingNumber: parseInt(record.BUILDING_NUMBER || '0'),
          buildingType: record.BUILDING_TYPE || null,
          yearBuilt: parseInt(record.YEAR_BUILT || '0'),
          squareFeet: parseInt(record.SQUARE_FEET || '0'),
          stories: parseFloat(record.STORIES || '0'),
          quality: record.QUALITY || null,
          condition: record.CONDITION || null,
          grade: record.GRADE || null,
          depreciation: parseFloat(record.DEPRECIATION || '0'),
          constructionType: record.CONSTRUCTION_TYPE || null,
          foundationType: record.FOUNDATION_TYPE || null,
          roofType: record.ROOF_TYPE || null,
          heatingCooling: record.HEATING_COOLING || null,
          improvementClass: record.IMPROVEMENT_CLASS || null,
          improvementType: record.IMPROVEMENT_TYPE || null,
          bedrooms: parseInt(record.BEDROOMS || '0'),
          bathrooms: parseFloat(record.BATHROOMS || '0'),
          marketValue: parseInt(record.MARKET_VALUE || '0'),
          replacementCost: parseInt(record.REPLACEMENT_COST || '0'),
          scheduleNumber: record.SCHEDULE_NUMBER || null
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
 * Import improvement details from CSV file
 */
async function importImprovementDetails(
  filePath: string,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const details: InsertImprovementDetail[] = [];
    let batch: InsertImprovementDetail[] = [];
    
    // Create a readable stream for the CSV file
    const parser = fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    parser.on('data', async (record) => {
      try {
        results.improvementDetails.processed++;
        
        // Convert CSV record to improvement detail data model
        const detail: InsertImprovementDetail = {
          detailId: parseInt(record.DETAIL_ID || '0'),
          propId: parseInt(record.PROP_ID || '0'),
          imprvId: parseInt(record.IMPRV_ID || '0'),
          detailType: record.DETAIL_TYPE || null,
          detailDescription: record.DETAIL_DESCRIPTION || null,
          area: parseFloat(record.AREA || '0'),
          width: parseFloat(record.WIDTH || '0'),
          depth: parseFloat(record.DEPTH || '0'),
          height: parseFloat(record.HEIGHT || '0'),
          units: parseInt(record.UNITS || '0'),
          unitOfMeasure: record.UNIT_OF_MEASURE || null,
          location: record.LOCATION || null,
          quality: record.QUALITY || null,
          condition: record.CONDITION || null,
          yearBuilt: parseInt(record.YEAR_BUILT || '0'),
          valueContribution: parseInt(record.VALUE_CONTRIBUTION || '0')
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
 * Import improvement items from CSV file
 */
async function importImprovementItems(
  filePath: string,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const items: InsertImprovementItem[] = [];
    let batch: InsertImprovementItem[] = [];
    
    // Create a readable stream for the CSV file
    const parser = fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    parser.on('data', async (record) => {
      try {
        results.improvementItems.processed++;
        
        // Convert CSV record to improvement item data model
        const item: InsertImprovementItem = {
          itemId: parseInt(record.ITEM_ID || '0'),
          propId: parseInt(record.PROP_ID || '0'),
          imprvId: parseInt(record.IMPRV_ID || '0'),
          itemType: record.ITEM_TYPE || null,
          itemDescription: record.ITEM_DESCRIPTION || null,
          quantity: parseInt(record.QUANTITY || '0'),
          unitOfMeasure: record.UNIT_OF_MEASURE || null,
          unitCost: parseFloat(record.UNIT_COST || '0'),
          totalCost: parseFloat(record.TOTAL_COST || '0'),
          yearInstalled: parseInt(record.YEAR_INSTALLED || '0'),
          effectiveAge: parseInt(record.EFFECTIVE_AGE || '0'),
          condition: record.CONDITION || null,
          quality: record.QUALITY || null,
          location: record.LOCATION || null,
          notes: record.NOTES || null
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
 * Import land details from CSV file
 */
async function importLandDetails(
  filePath: string,
  batchSize: number,
  storage: IStorage, 
  results: ImportResults
): Promise<void> {
  return new Promise((resolve, reject) => {
    const details: InsertLandDetail[] = [];
    let batch: InsertLandDetail[] = [];
    
    // Create a readable stream for the CSV file
    const parser = fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    parser.on('data', async (record) => {
      try {
        results.landDetails.processed++;
        
        // Convert CSV record to land detail data model
        const detail: InsertLandDetail = {
          landId: parseInt(record.LAND_ID || '0'),
          propId: parseInt(record.PROP_ID || '0'),
          landType: record.LAND_TYPE || null,
          landUse: record.LAND_USE || null,
          landClass: record.LAND_CLASS || null,
          soilType: record.SOIL_TYPE || null,
          acreage: parseFloat(record.ACREAGE || '0'),
          squareFeet: parseInt(record.SQUARE_FEET || '0'),
          frontage: parseFloat(record.FRONTAGE || '0'),
          depth: parseFloat(record.DEPTH || '0'),
          valuePerUnit: parseFloat(record.VALUE_PER_UNIT || '0'),
          unitOfMeasure: record.UNIT_OF_MEASURE || null,
          marketAdjustment: parseFloat(record.MARKET_ADJUSTMENT || '0'),
          landValue: parseInt(record.LAND_VALUE || '0'),
          zoning: record.ZONING || null,
          topography: record.TOPOGRAPHY || null,
          utilities: record.UTILITIES || null,
          accessType: record.ACCESS_TYPE || null,
          locationInfluence: record.LOCATION_INFLUENCE || null,
          notes: record.NOTES || null
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