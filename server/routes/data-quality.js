/**
 * Data Quality Routes
 * 
 * Routes for data quality validation and reporting.
 */

import express from 'express';
import { 
  dataQualityFramework, 
  ValidationContext, 
  RuleType, 
  Severity 
} from '../data-quality/index.js';
import { storage } from '../storage';

const router = express.Router();

/**
 * @route POST /api/data-quality/validate/property
 * @desc Validate property data against rules
 * @access Private
 */
router.post('/validate/property', async (req, res) => {
  try {
    const { records, batchId = `batch_${Date.now()}`, userId = 1 } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    const context = new ValidationContext(userId, batchId, 0, null);
    const validation = dataQualityFramework.validateBatch(RuleType.PROPERTY, records, context);
    
    // Store validation report
    await storage.saveValidationReport(batchId, validation);
    
    res.json(validation);
  } catch (error) {
    console.error('Error validating property data:', error);
    res.status(500).json({ 
      error: 'Failed to validate property data',
      details: error.message 
    });
  }
});

/**
 * @route POST /api/data-quality/validate/cost-matrix
 * @desc Validate cost matrix data against rules
 * @access Private
 */
router.post('/validate/cost-matrix', async (req, res) => {
  try {
    const { records, batchId = `batch_${Date.now()}`, userId = 1 } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    const context = new ValidationContext(userId, batchId, 0, null);
    const validation = dataQualityFramework.validateBatch(RuleType.COST_MATRIX, records, context);
    
    // Store validation report
    await storage.saveValidationReport(batchId, validation);
    
    res.json(validation);
  } catch (error) {
    console.error('Error validating cost matrix data:', error);
    res.status(500).json({ 
      error: 'Failed to validate cost matrix data',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/data-quality/reports
 * @desc Get list of validation reports
 * @access Private
 */
router.get('/reports', async (req, res) => {
  try {
    const { limit = 20, offset = 0, userId } = req.query;
    
    const reports = await storage.getValidationReports({
      limit: parseInt(limit),
      offset: parseInt(offset),
      userId: userId ? parseInt(userId) : undefined
    });
    
    res.json(reports);
  } catch (error) {
    console.error('Error fetching validation reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch validation reports',
      details: error.message 
    });
  }
});

/**
 * @route GET /api/data-quality/reports/:batchId
 * @desc Get a specific validation report
 * @access Private
 */
router.get('/reports/:batchId', async (req, res) => {
  try {
    const batchId = req.params.batchId;
    const report = await storage.getValidationReport(batchId);
    
    if (!report) {
      return res.status(404).json({ error: 'Validation report not found' });
    }
    
    res.json(report);
  } catch (error) {
    console.error('Error fetching validation report:', error);
    res.status(500).json({ 
      error: 'Failed to fetch validation report',
      details: error.message 
    });
  }
});

/**
 * @route POST /api/data-quality/profile
 * @desc Generate statistical profile of data
 * @access Private
 */
router.post('/profile', async (req, res) => {
  try {
    const { records, type = 'property' } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    const profile = dataQualityFramework.generateStatisticalProfile(type, records);
    res.json(profile);
  } catch (error) {
    console.error('Error generating data profile:', error);
    res.status(500).json({ 
      error: 'Failed to generate data profile',
      details: error.message 
    });
  }
});

export default router;