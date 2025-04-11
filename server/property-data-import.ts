import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { IStorage } from './storage';
import { log } from './vite';

// CSV parsing options
const csvParseOptions = {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  cast: true
};

/**
 * Import property data from CSV files
 */
export async function importPropertyData(storage: IStorage, options: {
  propertiesFile: string;
  improvementsFile: string;
  improvementDetailsFile: string;
  improvementItemsFile: string;
  landDetailsFile: string;
  batchSize?: number;
  userId: number;
}) {
  const batchSize = options.batchSize || 100;
  const results = {
    properties: { processed: 0, success: 0, errors: [] },
    improvements: { processed: 0, success: 0, errors: [] },
    improvementDetails: { processed: 0, success: 0, errors: [] },
    improvementItems: { processed: 0, success: 0, errors: [] },
    landDetails: { processed: 0, success: 0, errors: [] }
  };

  // Create activity log entry
  await storage.createActivity({
    action: `Started importing Benton County property data`,
    icon: "ri-database-2-line",
    iconColor: "info",
    userId: options.userId
  });

  try {
    // 1. Import Properties
    log("Importing properties...");
    await importProperties(
      options.propertiesFile, 
      storage, 
      batchSize, 
      results.properties
    );

    // 2. Import Improvements
    log("Importing improvements...");
    await importImprovements(
      options.improvementsFile, 
      storage, 
      batchSize, 
      results.improvements
    );

    // 3. Import Improvement Details
    log("Importing improvement details...");
    await importImprovementDetails(
      options.improvementDetailsFile, 
      storage, 
      batchSize, 
      results.improvementDetails
    );

    // 4. Import Improvement Items
    log("Importing improvement items...");
    await importImprovementItems(
      options.improvementItemsFile, 
      storage, 
      batchSize, 
      results.improvementItems
    );

    // 5. Import Land Details
    log("Importing land details...");
    await importLandDetails(
      options.landDetailsFile, 
      storage, 
      batchSize, 
      results.landDetails
    );

    // Create activity log for completion
    await storage.createActivity({
      action: `Completed importing Benton County property data: 
        ${results.properties.success} properties, 
        ${results.improvements.success} improvements, 
        ${results.improvementDetails.success} improvement details, 
        ${results.improvementItems.success} improvement items, 
        ${results.landDetails.success} land details`,
      icon: "ri-database-2-line",
      iconColor: "success",
      userId: options.userId
    });

    return results;
  } catch (error) {
    log(`Error importing property data: ${error.message}`);
    
    // Log error
    await storage.createActivity({
      action: `Error importing Benton County property data: ${error.message}`,
      icon: "ri-error-warning-line",
      iconColor: "error",
      userId: options.userId
    });
    
    throw error;
  }
}

/**
 * Import properties from CSV file
 */
async function importProperties(
  filePath: string, 
  storage: IStorage, 
  batchSize: number,
  results: { processed: number, success: number, errors: any[] }
) {
  return new Promise<void>((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(parse(csvParseOptions));
    const batch: any[] = [];

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read())) {
        try {
          // Convert fields as needed
          const property = {
            propId: parseInt(record.prop_id),
            block: record.block || null,
            tractOrLot: record.tract_or_lot || null,
            legalDesc: record.legal_desc || null,
            legalDesc2: record.legal_desc_2 || null,
            townshipSection: record.township_section || null,
            townshipCode: record.township_code || null,
            rangeCode: record.range_code || null,
            townshipQSection: record.township_q_section || null,
            cycle: record.cycle || null,
            propertyUseCd: record.property_use_cd || null,
            propertyUseDesc: record.property_use_desc || null,
            market: record.market ? parseFloat(record.market) : null,
            landHstdVal: record.land_hstd_val ? parseFloat(record.land_hstd_val) : null,
            landNonHstdVal: record.land_non_hstd_val ? parseFloat(record.land_non_hstd_val) : null,
            imprvHstdVal: record.imprv_hstd_val ? parseFloat(record.imprv_hstd_val) : null,
            imprvNonHstdVal: record.imprv_non_hstd_val ? parseFloat(record.imprv_non_hstd_val) : null,
            hoodCd: record.hood_cd || null,
            absSubdvCd: record.abs_subdv_cd || null,
            appraisedVal: record.appraised_val ? parseFloat(record.appraised_val) : null,
            assessedVal: record.assessed_val ? parseFloat(record.assessed_val) : null,
            legalAcreage: record.legal_acreage ? parseFloat(record.legal_acreage) : null,
            propTypeCd: record.prop_type_cd || null,
            imagePath: record.image_path || null,
            geoId: record.geo_id || null,
            isActive: record.isactive === '1',
            tca: record.TCA || null
          };

          batch.push(property);
          results.processed++;

          // Process batch when it reaches batchSize
          if (batch.length >= batchSize) {
            await processBatch('properties', batch, storage, results);
            batch.length = 0; // Clear batch
          }
        } catch (error) {
          results.errors.push({ 
            record: record.prop_id, 
            error: error.message 
          });
        }
      }
    });

    parser.on('end', async function() {
      try {
        // Process any remaining records in the batch
        if (batch.length > 0) {
          await processBatch('properties', batch, storage, results);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    parser.on('error', function(error) {
      reject(error);
    });
  });
}

/**
 * Import improvements from CSV file
 */
async function importImprovements(
  filePath: string, 
  storage: IStorage, 
  batchSize: number,
  results: { processed: number, success: number, errors: any[] }
) {
  return new Promise<void>((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(parse(csvParseOptions));
    const batch: any[] = [];

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read())) {
        try {
          const improvement = {
            propId: parseInt(record.prop_id),
            imprvId: parseInt(record.imprv_id),
            imprvDesc: record.imprv_desc || null,
            imprvVal: record.imprv_val ? parseFloat(record.imprv_val) : null,
            livingArea: record.living_area ? parseFloat(record.living_area) : null,
            primaryUseCd: record.primary_use_cd || null,
            stories: record.stories ? parseFloat(record.stories) : null,
            actualYearBuilt: record.actual_year_built ? parseInt(record.actual_year_built) : null,
            totalArea: record.total_area ? parseFloat(record.total_area) : null
          };

          batch.push(improvement);
          results.processed++;

          // Process batch when it reaches batchSize
          if (batch.length >= batchSize) {
            await processBatch('improvements', batch, storage, results);
            batch.length = 0; // Clear batch
          }
        } catch (error) {
          results.errors.push({ 
            record: `${record.prop_id}-${record.imprv_id}`, 
            error: error.message 
          });
        }
      }
    });

    parser.on('end', async function() {
      try {
        // Process any remaining records in the batch
        if (batch.length > 0) {
          await processBatch('improvements', batch, storage, results);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    parser.on('error', function(error) {
      reject(error);
    });
  });
}

/**
 * Import improvement details from CSV file
 */
async function importImprovementDetails(
  filePath: string, 
  storage: IStorage, 
  batchSize: number,
  results: { processed: number, success: number, errors: any[] }
) {
  return new Promise<void>((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(parse(csvParseOptions));
    const batch: any[] = [];

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read())) {
        try {
          const detail = {
            propId: parseInt(record.prop_id),
            imprvId: parseInt(record.imprv_id),
            livingArea: record.living_area ? parseFloat(record.living_area) : null,
            belowGradeLivingArea: record.below_grade_living_area ? parseFloat(record.below_grade_living_area) : null,
            conditionCd: record.condition_cd || null,
            imprvDetSubClassCd: record.imprv_det_sub_class_cd || null,
            yrBuilt: record.yr_built ? parseInt(record.yr_built) : null,
            actualAge: record.actual_age ? parseInt(record.actual_age) : null,
            numStories: record.num_stories ? parseFloat(record.num_stories) : null,
            imprvDetTypeCd: record.imprv_det_type_cd || null,
            imprvDetDesc: record.imprv_det_desc || null,
            imprvDetArea: record.imprv_det_area ? parseFloat(record.imprv_det_area) : null,
            imprvDetClassCd: record.imprv_det_class_cd || null
          };

          batch.push(detail);
          results.processed++;

          // Process batch when it reaches batchSize
          if (batch.length >= batchSize) {
            await processBatch('improvementDetails', batch, storage, results);
            batch.length = 0; // Clear batch
          }
        } catch (error) {
          results.errors.push({ 
            record: `${record.prop_id}-${record.imprv_id}`, 
            error: error.message 
          });
        }
      }
    });

    parser.on('end', async function() {
      try {
        // Process any remaining records in the batch
        if (batch.length > 0) {
          await processBatch('improvementDetails', batch, storage, results);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    parser.on('error', function(error) {
      reject(error);
    });
  });
}

/**
 * Import improvement items from CSV file
 */
async function importImprovementItems(
  filePath: string, 
  storage: IStorage, 
  batchSize: number,
  results: { processed: number, success: number, errors: any[] }
) {
  return new Promise<void>((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(parse(csvParseOptions));
    const batch: any[] = [];

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read())) {
        try {
          const item = {
            imprvId: parseInt(record.imprv_id),
            propId: parseInt(record.prop_id),
            bedrooms: record.bedrooms ? parseFloat(record.bedrooms) : null,
            baths: record.baths ? parseFloat(record.baths) : null,
            halfBath: record.halfbath ? parseFloat(record.halfbath) : null,
            foundation: record.foundation || null,
            extwallDesc: record.extwall_desc || null,
            roofcoverDesc: record.roofcover_desc || null,
            hvacDesc: record.hvac_desc || null,
            fireplaces: record.fireplaces ? parseFloat(record.fireplaces) : null,
            sprinkler: record.sprinkler === 'Y',
            framingClass: record.framing_class || null,
            comHvac: record.com_hvac || null
          };

          batch.push(item);
          results.processed++;

          // Process batch when it reaches batchSize
          if (batch.length >= batchSize) {
            await processBatch('improvementItems', batch, storage, results);
            batch.length = 0; // Clear batch
          }
        } catch (error) {
          results.errors.push({ 
            record: `${record.prop_id}-${record.imprv_id}`, 
            error: error.message 
          });
        }
      }
    });

    parser.on('end', async function() {
      try {
        // Process any remaining records in the batch
        if (batch.length > 0) {
          await processBatch('improvementItems', batch, storage, results);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    parser.on('error', function(error) {
      reject(error);
    });
  });
}

/**
 * Import land details from CSV file
 */
async function importLandDetails(
  filePath: string, 
  storage: IStorage, 
  batchSize: number,
  results: { processed: number, success: number, errors: any[] }
) {
  return new Promise<void>((resolve, reject) => {
    const parser = fs.createReadStream(filePath).pipe(parse(csvParseOptions));
    const batch: any[] = [];

    parser.on('readable', async function() {
      let record;
      while ((record = parser.read())) {
        try {
          const landDetail = {
            propId: parseInt(record.prop_id),
            sizeAcres: record.size_acres ? parseFloat(record.size_acres) : null,
            sizeSquareFeet: record.size_square_feet ? parseFloat(record.size_square_feet) : null,
            landTypeCd: record.land_type_cd || null,
            landSoilCode: record.land_soil_code || null,
            agUseCd: record.ag_use_cd || null,
            primaryUseCd: record.primary_use_cd || null
          };

          batch.push(landDetail);
          results.processed++;

          // Process batch when it reaches batchSize
          if (batch.length >= batchSize) {
            await processBatch('landDetails', batch, storage, results);
            batch.length = 0; // Clear batch
          }
        } catch (error) {
          results.errors.push({ 
            record: record.prop_id, 
            error: error.message 
          });
        }
      }
    });

    parser.on('end', async function() {
      try {
        // Process any remaining records in the batch
        if (batch.length > 0) {
          await processBatch('landDetails', batch, storage, results);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });

    parser.on('error', function(error) {
      reject(error);
    });
  });
}

/**
 * Process a batch of records
 */
async function processBatch(
  entityType: 'properties' | 'improvements' | 'improvementDetails' | 'improvementItems' | 'landDetails',
  batch: any[],
  storage: IStorage,
  results: { processed: number, success: number, errors: any[] }
) {
  try {
    switch(entityType) {
      case 'properties':
        await storage.bulkInsertProperties(batch);
        break;
      case 'improvements':
        await storage.bulkInsertImprovements(batch);
        break;
      case 'improvementDetails':
        await storage.bulkInsertImprovementDetails(batch);
        break;
      case 'improvementItems':
        await storage.bulkInsertImprovementItems(batch);
        break;
      case 'landDetails':
        await storage.bulkInsertLandDetails(batch);
        break;
    }
    results.success += batch.length;
  } catch (error) {
    // Try inserting one by one to identify problematic records
    for (const record of batch) {
      try {
        switch(entityType) {
          case 'properties':
            await storage.createProperty(record);
            break;
          case 'improvements':
            await storage.createImprovement(record);
            break;
          case 'improvementDetails':
            await storage.createImprovementDetail(record);
            break;
          case 'improvementItems':
            await storage.createImprovementItem(record);
            break;
          case 'landDetails':
            await storage.createLandDetail(record);
            break;
        }
        results.success++;
      } catch (err) {
        results.errors.push({
          record: entityType === 'properties' ? record.propId : 
                 (entityType === 'landDetails' ? record.propId : 
                 `${record.propId}-${record.imprvId}`),
          error: err.message
        });
      }
    }
  }
}