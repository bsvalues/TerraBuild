/**
 * Data Quality API Routes
 * 
 * This module provides REST API endpoints for data quality operations.
 */

import express from 'express';
import { storage } from '../storage';
import { dataQualityFramework, RuleType } from '../data-quality';

const router = express.Router();

/**
 * Get agent statuses
 * GET /api/data-quality/agents
 */
router.get('/agents', async (req, res) => {
  try {
    const statuses = await storage.getAgentStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching agent statuses:', error);
    res.status(500).json({ error: 'Failed to fetch agent statuses' });
  }
});

/**
 * Get agent status
 * GET /api/data-quality/agents/:agentId
 */
router.get('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const status = await storage.getAgentStatus(agentId);
    
    if (!status) {
      return res.status(404).json({ error: 'Agent status not found' });
    }
    
    res.json(status);
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({ error: 'Failed to fetch agent status' });
  }
});

/**
 * Update agent status
 * POST /api/data-quality/agents/:agentId
 */
router.post('/agents/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { status, metadata, errorMessage } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const result = await storage.updateAgentStatus(agentId, status, metadata, errorMessage);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to update agent status' });
    }
    
    // Track activity
    await storage.createActivity({
      type: 'agent_status_update',
      agentId,
      status,
      metadata
    });
    
    res.json({ success: true, agentId, status });
  } catch (error) {
    console.error('Error updating agent status:', error);
    res.status(500).json({ error: 'Failed to update agent status' });
  }
});

/**
 * Validate data against quality rules
 * POST /api/data-quality/validate
 */
router.post('/validate', async (req, res) => {
  try {
    const { data, type, context } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    if (!type || !Object.values(RuleType).includes(type)) {
      return res.status(400).json({ 
        error: 'Valid type is required',
        validTypes: Object.values(RuleType)
      });
    }
    
    const result = dataQualityFramework.validate(data, type, context);
    
    // Track validation activity if provided context has tracking enabled
    if (context?.trackActivity !== false) {
      await storage.createActivity({
        type: 'data_validation',
        dataType: type,
        valid: result.valid,
        issueCount: result.issues.length,
        context
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error validating data:', error);
    res.status(500).json({ error: 'Failed to validate data' });
  }
});

/**
 * Validate batch data against quality rules
 * POST /api/data-quality/validate-batch
 */
router.post('/validate-batch', async (req, res) => {
  try {
    const { records, type, context } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    if (!type || !Object.values(RuleType).includes(type)) {
      return res.status(400).json({ 
        error: 'Valid type is required',
        validTypes: Object.values(RuleType)
      });
    }
    
    const batchReport = dataQualityFramework.validateBatch(type, records, context);
    
    // Track batch validation activity
    await storage.createActivity({
      type: 'batch_validation',
      dataType: type,
      recordCount: records.length,
      passRate: batchReport.summary.passRate,
      context
    });
    
    res.json(batchReport);
  } catch (error) {
    console.error('Error validating batch data:', error);
    res.status(500).json({ error: 'Failed to validate batch data' });
  }
});

/**
 * Generate statistical profile for data
 * POST /api/data-quality/profile
 */
router.post('/profile', async (req, res) => {
  try {
    const { records, type } = req.body;
    
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Records array is required' });
    }
    
    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }
    
    const profile = dataQualityFramework.generateStatisticalProfile(type, records);
    
    res.json(profile);
  } catch (error) {
    console.error('Error generating statistical profile:', error);
    res.status(500).json({ error: 'Failed to generate statistical profile' });
  }
});

export default router;