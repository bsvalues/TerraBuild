import express from 'express';
import { CostFactorController } from './controller';

const router = express.Router();
const controller = new CostFactorController();

// Get all cost factors
router.get('/', controller.getAllFactors);

// Get cost factor sources
router.get('/sources', controller.getSources);

// Get current source
router.get('/source', controller.getCurrentSource);

// Set current source
router.post('/source', controller.setCurrentSource);

// Get cost factors by type
router.get('/type/:factorType', controller.getFactorsByType);

// Get specific factor value
router.get('/value/:factorType/:code', controller.getFactorValue);

export const costFactorRouter = router;