/**
 * Cost Factor Tables Router
 * 
 * This router handles API routes for the cost factor tables plugin.
 */

import express from 'express';
import * as controller from './controller';

const router = express.Router();

/**
 * @route GET /api/cost-factors
 * @description Get cost factors based on source
 * @param {string} source - Optional cost factor source (marshallSwift, rsmeans)
 * @param {string} propertyType - Optional property type code
 * @param {string} region - Optional region code
 */
router.get('/api/cost-factors', controller.getCostFactors);

/**
 * @route GET /api/cost-factors/source
 * @description Get current cost factor source
 */
router.get('/api/cost-factors/source', controller.getCurrentSource);

/**
 * @route GET /api/cost-factors/sources
 * @description Get available cost factor sources
 */
router.get('/api/cost-factors/sources', controller.getAvailableCostSources);

/**
 * @route PUT /api/cost-factors/source
 * @description Update current cost factor source
 * @param {string} source - New cost factor source (marshallSwift, rsmeans)
 */
router.put('/api/cost-factors/source', controller.updateCostSource);

export default router;