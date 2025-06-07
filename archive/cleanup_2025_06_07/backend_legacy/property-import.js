/**
 * Property Import Routes
 * 
 * Routes for handling property data imports and validation.
 */

import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { ValidationContext, RuleType } from '../data-quality/index.js';
import { storage } from '../storage';

const router = express.Router();

// Configure file upload with multer
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    // Accept only CSV files
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Get import job status
router.get('/status/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const status = await storage.getImportJobStatus(jobId);
    
    if (!status) {
      return res.status(404).json({ error: 'Import job not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching import job status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch import job status',
      details: error.message 
    });
  }
});

// Upload and validate property data
router.post('/properties', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const userId = req.body.userId || 1; // Default to admin user if not specified
    
    // Generate a batch ID for this import
    const batchId = `import_${Date.now()}`;
    const validationContext = new ValidationContext(userId, batchId, 0, null);
    
    // Start processing the CSV file
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      }));
    
    const records = [];
    let recordCount = 0;
    
    // Read records from CSV
    for await (const record of parser) {
      records.push(record);
      recordCount++;
      
      // Process in chunks of 1000 records to avoid memory issues
      if (records.length >= 1000) {
        await processRecordBatch(records, batchId, userId, recordCount - records.length);
        records.length = 0; // Clear the array
      }
    }
    
    // Process any remaining records
    if (records.length > 0) {
      await processRecordBatch(records, batchId, userId, recordCount - records.length);
    }
    
    // Create import job record
    const job = await storage.createImportJob({
      id: batchId,
      userId,
      fileName: req.file.originalname,
      status: 'validating',
      totalCount: recordCount,
      passCount: 0,
      failCount: 0,
      startedAt: new Date()
    });
    
    res.json({
      jobId: batchId,
      status: 'validating',
      fileName: req.file.originalname,
      recordCount
    });
    
    // Start validation process in the background
    validateImportedData(batchId, userId)
      .catch(err => console.error('Error validating import data:', err));
    
  } catch (error) {
    console.error('Error processing import:', error);
    res.status(500).json({ 
      error: 'Failed to process import',
      details: error.message 
    });
  }
});

// Process a batch of records
async function processRecordBatch(records, batchId, userId, startIndex) {
  try {
    // Store raw records for validation
    await storage.storeRawImportRecords(batchId, records, startIndex);
  } catch (error) {
    console.error('Error storing raw import records:', error);
    throw error;
  }
}

// Validate imported data
async function validateImportedData(batchId, userId) {
  try {
    // Update job status
    await storage.updateImportJobStatus(batchId, 'validating');
    
    // Get raw records for validation
    const rawRecords = await storage.getRawImportRecords(batchId);
    
    // Create validation context
    const validationContext = new ValidationContext(userId, batchId, 0, null);
    
    // Validate property records
    const validation = await storage.validatePropertyRecords(
      rawRecords, 
      RuleType.PROPERTY,
      validationContext
    );
    
    // Update job with validation results
    const passCount = validation.summary.passedRecords;
    const failCount = validation.summary.failedRecords;
    
    await storage.updateImportJobStatus(batchId, 'validated', {
      passCount,
      failCount,
      validationComplete: true,
      validationResults: validation
    });
    
    // If there are no validation errors, start importing
    if (failCount === 0) {
      await importValidatedData(batchId, rawRecords, userId);
    }
    
  } catch (error) {
    console.error('Error validating import data:', error);
    await storage.updateImportJobStatus(batchId, 'error', {
      error: error.message
    });
  }
}

// Import validated data
async function importValidatedData(batchId, records, userId) {
  try {
    // Update job status
    await storage.updateImportJobStatus(batchId, 'importing');
    
    let importedCount = 0;
    const totalCount = records.length;
    
    // Import records in chunks
    for (let i = 0; i < records.length; i += 100) {
      const chunk = records.slice(i, i + 100);
      
      for (const record of chunk) {
        await storage.createOrUpdateProperty(record);
        importedCount++;
      }
      
      // Update progress periodically
      if (i % 500 === 0 || i + 100 >= records.length) {
        await storage.updateImportJobStatus(batchId, 'importing', {
          importProgress: Math.round((importedCount / totalCount) * 100)
        });
      }
    }
    
    // Mark import as complete
    await storage.updateImportJobStatus(batchId, 'completed', {
      importedCount,
      completedAt: new Date()
    });
    
  } catch (error) {
    console.error('Error importing validated data:', error);
    await storage.updateImportJobStatus(batchId, 'error', {
      error: error.message
    });
  }
}

export default router;