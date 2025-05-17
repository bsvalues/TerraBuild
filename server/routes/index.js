/**
 * BCBS Application API Routes
 * 
 * This file defines the main API routes for the Benton County Building System.
 */

import express from 'express';
import propertiesRouter from './properties';
import propertyImportRouter from './property-import.js';
import dataQualityRouter from './data-quality.js';
import authRoutes from './auth';
import calculatorRouter from './calculator';
import propertyMapRoutes from './property-routes';

const router = express.Router();

// Mount sub-routers
router.use('/properties', propertiesRouter);
router.use('/import', propertyImportRouter);
router.use('/data-quality', dataQualityRouter);
router.use('/auth', authRoutes);
router.use('/calculator', calculatorRouter);
router.use('/property-map', propertyMapRoutes);

export default router;