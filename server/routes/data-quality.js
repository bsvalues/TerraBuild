/**
 * Data Quality Routes
 * 
 * Routes for data quality validation and reporting.
 */

import express from 'express';
import { dataQualityFramework, RuleType } from '../data-quality';
import { storage } from '../storage';

const router = express.Router();

/**
 * @route POST /api/data-quality/validate/property
 * @desc Validate property data against rules
 * @access Private
 */
router.post('/validate/property', async (req, res) => {
  try {
    const { data, batchId } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        message: 'Invalid data format. Expected array of property records.'
      });
    }
    
    const context = {
      userId: req.user?.id || req.body.userId || 1,
      batchId: batchId || `validation_${Date.now()}`
    };
    
    const validationReport = dataQualityFramework.validateBatch(
      RuleType.PROPERTY,
      data,
      context
    );
    
    // Store validation report for future reference
    if (storage.createValidationReport) {
      await storage.createValidationReport({
        batchId: context.batchId,
        entityType: RuleType.PROPERTY,
        userId: context.userId,
        report: validationReport,
        recordCount: data.length,
        passRate: validationReport.summary.passRate,
        issueCount: validationReport.issues.length
      });
    }
    
    return res.json(validationReport);
  } catch (error) {
    console.error('Error validating property data:', error);
    return res.status(500).json({
      message: 'Error validating property data',
      error: error.message
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
    const { data, batchId } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        message: 'Invalid data format. Expected array of cost matrix records.'
      });
    }
    
    const context = {
      userId: req.user?.id || req.body.userId || 1,
      batchId: batchId || `validation_${Date.now()}`
    };
    
    const validationReport = dataQualityFramework.validateBatch(
      RuleType.COST_MATRIX,
      data,
      context
    );
    
    // Store validation report for future reference
    if (storage.createValidationReport) {
      await storage.createValidationReport({
        batchId: context.batchId,
        entityType: RuleType.COST_MATRIX,
        userId: context.userId,
        report: validationReport,
        recordCount: data.length,
        passRate: validationReport.summary.passRate,
        issueCount: validationReport.issues.length
      });
    }
    
    return res.json(validationReport);
  } catch (error) {
    console.error('Error validating cost matrix data:', error);
    return res.status(500).json({
      message: 'Error validating cost matrix data',
      error: error.message
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
    if (!storage.getValidationReports) {
      return res.status(501).json({
        message: 'Validation report storage not implemented'
      });
    }
    
    const reports = await storage.getValidationReports();
    return res.json(reports);
  } catch (error) {
    console.error('Error fetching validation reports:', error);
    return res.status(500).json({
      message: 'Error fetching validation reports',
      error: error.message
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
    const { batchId } = req.params;
    
    if (!storage.getValidationReportById) {
      return res.status(501).json({
        message: 'Validation report storage not implemented'
      });
    }
    
    const report = await storage.getValidationReportById(batchId);
    
    if (!report) {
      return res.status(404).json({
        message: 'Validation report not found'
      });
    }
    
    return res.json(report);
  } catch (error) {
    console.error('Error fetching validation report:', error);
    return res.status(500).json({
      message: 'Error fetching validation report',
      error: error.message
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
    const { data, type } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        message: 'Invalid data format. Expected array of records.'
      });
    }
    
    const profile = dataQualityFramework.generateStatisticalProfile(
      type || 'property',
      data
    );
    
    return res.json(profile);
  } catch (error) {
    console.error('Error generating data profile:', error);
    return res.status(500).json({
      message: 'Error generating data profile',
      error: error.message
    });
  }
});

export default router;