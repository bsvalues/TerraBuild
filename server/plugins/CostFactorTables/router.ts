/**
 * Cost Factor Tables Plugin Router
 * 
 * This file defines the routes for the Cost Factor Tables plugin API
 */

import express from 'express';
import * as controller from './controller';

export const router = express.Router();

// Add middleware for logging requests
router.use((req, res, next) => {
  console.log(`CostFactorTables API: ${req.method} ${req.path}`);
  next();
});

// Get all cost factors
router.get('/factors', controller.getCostFactors);

// Get cost factors of a specific type
router.get('/factors/:factorType', controller.getCostFactorsByType);

// Get available cost factor sources
router.get('/sources', controller.getCostFactorSources);

// Get current cost factor source
router.get('/source', controller.getCurrentSource);

// Set current cost factor source
router.post('/source', controller.setCurrentSource);

// Get a specific cost factor value
router.get('/value/:factorType/:code', controller.getCostFactorValue);