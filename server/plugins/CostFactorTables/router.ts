import express from 'express';
import { getCostFactorSources, 
         getCostFactorsBySource, 
         getCostFactorsByType, 
         getCostFactorValue, 
         getRatingTable } from './controller';

/**
 * Router for CostFactorTables plugin endpoints
 */
export const costFactorRouter = express.Router();

// Get all cost factor sources (e.g., "Benton County 2025")
costFactorRouter.get('/sources', getCostFactorSources);

// Get all cost factors for a specific source
costFactorRouter.get('/source/:sourceId', getCostFactorsBySource);

// Get all cost factors for a specific building type
costFactorRouter.get('/type/:buildingType', getCostFactorsByType);

// Get a specific cost factor value
costFactorRouter.get('/value/:category/:name/:qualityGrade', getCostFactorValue);

// Get rating table (quality, condition, etc)
costFactorRouter.get('/rating-table/:tableType', getRatingTable);