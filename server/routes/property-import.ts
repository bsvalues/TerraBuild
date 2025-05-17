/**
 * Property Import API Routes
 * 
 * This module provides REST API endpoints for property data import operations.
 */

import express from 'express';
import multer from 'multer';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { dataQualityFramework, RuleType } from '../data-quality';

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

const router = express.Router();

/**
 * Upload and process property data CSV
 * POST /api/import/properties
 */
router.post('/properties', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const results = await processPropertyCsv(filePath);
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error importing properties:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to import properties',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload and process improvements data CSV
 * POST /api/import/improvements
 */
router.post('/improvements', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const results = await processImprovementsCsv(filePath);
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error importing improvements:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to import improvements',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Upload and process cost matrix data CSV
 * POST /api/import/cost-matrices
 */
router.post('/cost-matrices', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = req.file.path;
    const results = await processCostMatrixCsv(filePath);
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error importing cost matrices:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to import cost matrices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get import job status
 * GET /api/import/status/:jobId
 */
router.get('/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = await storage.getImportJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Import job not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching import job status:', error);
    res.status(500).json({ error: 'Failed to fetch import job status' });
  }
});

/**
 * Process a property CSV file
 */
async function processPropertyCsv(filePath: string) {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    const errors: any[] = [];
    
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (record) => {
        records.push(record);
      })
      .on('error', (error) => {
        reject(error);
      })
      .on('end', async () => {
        try {
          // Validate records using data quality framework
          const validationResults = dataQualityFramework.validateBatch(
            RuleType.PROPERTY, 
            records
          );
          
          // Track the import job
          const jobId = Date.now().toString();
          await storage.createImportJob({
            jobId,
            type: 'property',
            totalCount: records.length,
            validCount: validationResults.summary.passCount,
            invalidCount: validationResults.summary.failCount,
            status: 'processing',
            metadata: {
              validationSummary: validationResults.summary
            }
          });
          
          // Filter out invalid records
          const validRecords = records.filter((_, index) => 
            validationResults.results[index].valid
          );
          
          // Start processing valid records asynchronously
          processValidPropertyRecords(jobId, validRecords);
          
          resolve({
            jobId,
            totalCount: records.length,
            validCount: validRecords.length,
            invalidCount: records.length - validRecords.length,
            validationSummary: validationResults.summary
          });
        } catch (error) {
          reject(error);
        }
      });
  });
}

/**
 * Process valid property records asynchronously
 */
async function processValidPropertyRecords(jobId: string, records: any[]) {
  try {
    let processedCount = 0;
    
    // Update job status to processing
    await storage.updateImportJobStatus(jobId, 'processing', {
      processedCount,
      totalCount: records.length
    });
    
    // Process records in smaller batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Process each record in batch
      for (const record of batch) {
        try {
          // Normalize the property data
          const property = normalizePropertyRecord(record);
          
          // Insert or update the property in database
          await storage.createOrUpdateProperty(property);
          
          processedCount++;
        } catch (error) {
          console.error('Error processing property record:', error);
          // Log the error but continue processing
        }
      }
      
      // Update job status periodically
      await storage.updateImportJobStatus(jobId, 'processing', {
        processedCount,
        totalCount: records.length,
        percentage: Math.round((processedCount / records.length) * 100)
      });
    }
    
    // Update job status to completed
    await storage.updateImportJobStatus(jobId, 'completed', {
      processedCount,
      totalCount: records.length,
      completedAt: new Date()
    });
    
    // Create activity entry for completed import
    await storage.createActivity({
      type: 'property_import',
      status: 'completed',
      totalCount: records.length,
      processedCount
    });
    
  } catch (error) {
    console.error('Error processing property records:', error);
    
    // Update job status to failed
    await storage.updateImportJobStatus(jobId, 'failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      failedAt: new Date()
    });
    
    // Create activity entry for failed import
    await storage.createActivity({
      type: 'property_import',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Process an improvements CSV file
 */
async function processImprovementsCsv(filePath: string) {
  // Similar implementation to processPropertyCsv
  return {
    jobId: Date.now().toString(),
    totalCount: 0,
    validCount: 0,
    invalidCount: 0
  };
}

/**
 * Process a cost matrix CSV file
 */
async function processCostMatrixCsv(filePath: string) {
  // Similar implementation to processPropertyCsv
  return {
    jobId: Date.now().toString(),
    totalCount: 0,
    validCount: 0,
    invalidCount: 0
  };
}

/**
 * Normalize a property record from CSV
 */
function normalizePropertyRecord(record: any) {
  return {
    geo_id: record.geo_id || record.GEOID || record.parcel_id || `prop-${Date.now()}`,
    parcel_id: record.parcel_id || record.PARCELID || record.PARCEL_ID || record.geo_id,
    address: record.address || record.ADDRESS || record.site_address || record.SITE_ADDRESS || '',
    city: record.city || record.CITY || '',
    state: record.state || record.STATE || 'WA',
    zip: record.zip || record.ZIP || record.zip_code || record.ZIPCODE || '',
    county: record.county || record.COUNTY || 'Benton',
    latitude: parseFloat(record.latitude || record.LATITUDE || 0),
    longitude: parseFloat(record.longitude || record.LONGITUDE || 0),
    property_type: record.property_type || record.PROPERTY_TYPE || '',
    land_area: parseFloat(record.land_area || record.LAND_AREA || 0),
    land_value: parseInt(record.land_value || record.LAND_VALUE || 0, 10),
    total_value: parseInt(record.total_value || record.TOTAL_VALUE || 0, 10),
    year_built: parseInt(record.year_built || record.YEAR_BUILT || 0, 10),
    bedrooms: parseInt(record.bedrooms || record.BEDROOMS || 0, 10),
    bathrooms: parseFloat(record.bathrooms || record.BATHROOMS || 0)
  };
}

export default router;