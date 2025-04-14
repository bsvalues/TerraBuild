/**
 * Cost Matrix Import Routes
 * 
 * This module provides API routes for importing cost matrix data,
 * including validation and data quality checking.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { IStorage } from '../storage';
import { Severity, RuleType, initializeDataQualityFramework } from '../data-quality';
import { processCostMatrixFile } from '../cost-matrix-import-enhanced';
import fs from 'fs';
import { json } from 'drizzle-orm/pg-core';

// Initialize the data quality framework
const validator = initializeDataQualityFramework();

// Configure multer for file uploads
const multerStorage = multer.memoryStorage();
const upload = multer({ 
  storage: multerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Schema for import metadata
const importMetadataSchema = z.object({
  filename: z.string(),
  fileType: z.string(),
  fileSize: z.number(),
  uploadedBy: z.number(),
  status: z.string().optional(),
  errors: z.any().optional(),
  processedItems: z.number().optional(),
  totalItems: z.number().optional(),
  errorCount: z.number().optional()
});

// Schema for validation options
const validationOptionsSchema = z.object({
  year: z.number().optional(),
  region: z.string().optional(),
  validateOnly: z.boolean().optional(),
  validBuildingTypes: z.array(z.string()).optional()
});

export function createCostMatrixImportRouter(storageImpl: IStorage): Router {
  const router = Router();
  
  /**
   * Upload a cost matrix file for validation and import
   */
  router.post('/api/cost-matrix/import', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      // Extract validation options from the request
      const options = validationOptionsSchema.parse({
        year: req.body.year ? parseInt(req.body.year) : undefined,
        region: req.body.region,
        validateOnly: req.body.validateOnly === 'true',
        validBuildingTypes: req.body.validBuildingTypes ? 
          JSON.parse(req.body.validBuildingTypes) : undefined
      });
      
      // Create an import record
      const importRecord = await storageImpl.createImportRecord({
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.body.userId ? parseInt(req.body.userId) : 1,
        status: 'PROCESSING'
      });
      
      console.log(`Processing cost matrix import from file: ${req.file.originalname}`);
      
      // Process the cost matrix file
      const results = await processCostMatrixFile(
        storageImpl,
        req.file.buffer,
        100, // batch size
        options
      );
      
      // Update the import record with results
      await storageImpl.updateImportRecord(importRecord.id, {
        status: results.errors > 0 ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED',
        processedItems: results.processed,
        errorCount: results.errors,
        errors: results.quality as unknown
      });
      
      return res.status(200).json({
        success: true,
        message: `Processed ${results.processed} matrix entries with ${results.errors} errors`,
        importId: importRecord.id,
        results: {
          processed: results.processed,
          success: results.success,
          errors: results.errors,
          quality: results.quality
        }
      });
    } catch (error) {
      console.error('Error in cost matrix import:', error);
      return res.status(500).json({
        success: false,
        message: `Error processing import: ${(error as Error).message}`,
        error: error
      });
    }
  });
  
  /**
   * Get import records for cost matrices
   */
  router.get('/api/cost-matrix/imports', async (req: Request, res: Response) => {
    try {
      const imports = await storageImpl.getImportRecords();
      return res.status(200).json(imports);
    } catch (error) {
      console.error('Error getting import records:', error);
      return res.status(500).json({
        success: false,
        message: `Error getting import records: ${(error as Error).message}`
      });
    }
  });
  
  /**
   * Get a specific import record
   */
  router.get('/api/cost-matrix/imports/:id', async (req: Request, res: Response) => {
    try {
      const importId = parseInt(req.params.id);
      const importRecord = await storageImpl.getImportRecord(importId);
      
      if (!importRecord) {
        return res.status(404).json({
          success: false,
          message: `Import record not found: ${importId}`
        });
      }
      
      return res.status(200).json(importRecord);
    } catch (error) {
      console.error(`Error getting import record:`, error);
      return res.status(500).json({
        success: false,
        message: `Error getting import record: ${(error as Error).message}`
      });
    }
  });
  
  /**
   * Validate a cost matrix file without importing
   */
  router.post('/api/cost-matrix/validate', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }
      
      // Extract validation options from the request
      const options = validationOptionsSchema.parse({
        year: req.body.year ? parseInt(req.body.year) : undefined,
        region: req.body.region,
        validateOnly: true, // Always validate only for this endpoint
        validBuildingTypes: req.body.validBuildingTypes ? 
          JSON.parse(req.body.validBuildingTypes) : undefined
      });
      
      console.log(`Validating cost matrix file: ${req.file.originalname}`);
      
      // Process the cost matrix file in validate-only mode
      const results = await processCostMatrixFile(
        storageImpl,
        req.file.buffer,
        100, // batch size
        options
      );
      
      return res.status(200).json({
        success: true,
        message: `Validated ${results.processed} matrix entries with ${results.errors} errors`,
        results: {
          processed: results.processed,
          success: results.success,
          errors: results.errors,
          quality: results.quality
        }
      });
    } catch (error) {
      console.error('Error in cost matrix validation:', error);
      return res.status(500).json({
        success: false,
        message: `Error validating file: ${(error as Error).message}`,
        error: error
      });
    }
  });
  
  /**
   * Get data quality issues for a specific import
   */
  router.get('/api/cost-matrix/imports/:id/issues', async (req: Request, res: Response) => {
    try {
      const importId = parseInt(req.params.id);
      const importRecord = await storageImpl.getImportRecord(importId);
      
      if (!importRecord) {
        return res.status(404).json({
          success: false,
          message: `Import record not found: ${importId}`
        });
      }
      
      // Return the data quality issues from the import record
      const issues = importRecord.errors as Record<string, any>;
      
      return res.status(200).json({
        success: true,
        importId: importId,
        issues: issues
      });
    } catch (error) {
      console.error(`Error getting import issues:`, error);
      return res.status(500).json({
        success: false,
        message: `Error getting import issues: ${(error as Error).message}`
      });
    }
  });
  
  /**
   * Test endpoint for creating an import record
   */
  router.post('/api/cost-matrix/test-import-record', async (req: Request, res: Response) => {
    try {
      const { fileName, fileType, fileSize, uploadedBy, status } = req.body;
      
      // Create an import record
      const importRecord = await storageImpl.createImportRecord({
        filename: fileName || 'test.xlsx',
        fileType: fileType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: fileSize || 1000,
        uploadedBy: uploadedBy || 1,
        status: status || 'TESTING',
        errors: {},
        processedItems: 0,
        errorCount: 0
      });
      
      return res.status(200).json({
        success: true,
        message: `Created test import record`,
        importRecord
      });
    } catch (error) {
      console.error('Error creating test import record:', error);
      return res.status(500).json({
        success: false,
        message: `Error creating test import record: ${(error as Error).message}`
      });
    }
  });
  
  return router;
}