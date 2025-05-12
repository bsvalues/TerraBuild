/**
 * Cost Factor Tables Plugin Router
 * 
 * This file defines the routes for the Cost Factor Tables plugin
 */

import express from 'express';
import * as controller from './controller';

export const router = express.Router();

// Get all cost factors with optional filtering
router.get('/cost-factors', controller.getCostFactors);

// Get available cost factor sources
router.get('/cost-factors/sources', controller.getCostFactorSources);

// Get the current cost factor source
router.get('/cost-factors/source', controller.getCurrentSource);

// Set the current cost factor source
router.post('/cost-factors/source', controller.setCurrentSource);

// Get cost factors for a specific type
router.get('/cost-factors/:factorType', controller.getCostFactorsByType);

// Get a specific cost factor by source, type and code
router.get('/cost-factors/:source/:factorType/:code', controller.getCostFactorValue);