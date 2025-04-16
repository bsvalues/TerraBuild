/**
 * BCBS Application API Routes
 * 
 * This file defines the API routes for the Benton County Building System.
 * It provides endpoints for accessing and manipulating all application data.
 */

import express from 'express';
import { z } from 'zod';
import storage from './storage';
import analyticsRoutes from './routes/analyticsRoutes';
import reportRoutes from './routes/reportRoutes';
import whatIfScenariosRoutes from './routes/whatIfScenariosRoutes';

import {
  insertUserSchema,
  insertPropertySchema,
  insertImprovementSchema,
  insertCostMatrixSchema,
  insertCalculationSchema,
  insertProjectSchema,
} from '../shared/schema';

const router = express.Router();

// Error handling middleware
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation middleware
const validate = (schema: z.ZodType<any, any>) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({ message: 'Validation error', errors: error.errors });
  }
};

/**
 * User Routes
 */
router.get('/users', asyncHandler(async (req, res) => {
  const users = await storage.getUsers();
  res.json(users);
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await storage.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
}));

router.post('/users', validate(insertUserSchema), asyncHandler(async (req, res) => {
  const user = await storage.createUser(req.body);
  res.status(201).json(user);
}));

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const user = await storage.updateUser(req.params.id, req.body);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user);
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteUser(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.status(204).end();
}));

/**
 * Property Routes
 */
router.get('/properties', asyncHandler(async (req, res) => {
  // Extract filter parameters if any
  const { county, city, state, propertyType } = req.query;
  const filter: Record<string, any> = {};
  
  if (county) filter.county = county;
  if (city) filter.city = city;
  if (state) filter.state = state;
  if (propertyType) filter.propertyType = propertyType;
  
  const properties = await storage.getProperties(Object.keys(filter).length ? filter : undefined);
  res.json(properties);
}));

router.get('/properties/:id', asyncHandler(async (req, res) => {
  const property = await storage.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.get('/properties/parcel/:parcelId', asyncHandler(async (req, res) => {
  const property = await storage.getPropertyByParcelId(req.params.parcelId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.post('/properties', validate(insertPropertySchema), asyncHandler(async (req, res) => {
  const property = await storage.createProperty(req.body);
  res.status(201).json(property);
}));

router.patch('/properties/:id', asyncHandler(async (req, res) => {
  const property = await storage.updateProperty(req.params.id, req.body);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.delete('/properties/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteProperty(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.status(204).end();
}));

/**
 * Improvement Routes
 */
router.get('/improvements', asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const improvements = await storage.getImprovements(propertyId as string);
  res.json(improvements);
}));

router.get('/improvements/:id', asyncHandler(async (req, res) => {
  const improvement = await storage.getImprovementById(req.params.id);
  if (!improvement) {
    return res.status(404).json({ message: 'Improvement not found' });
  }
  res.json(improvement);
}));

router.post('/improvements', validate(insertImprovementSchema), asyncHandler(async (req, res) => {
  const improvement = await storage.createImprovement(req.body);
  res.status(201).json(improvement);
}));

router.patch('/improvements/:id', asyncHandler(async (req, res) => {
  const improvement = await storage.updateImprovement(req.params.id, req.body);
  if (!improvement) {
    return res.status(404).json({ message: 'Improvement not found' });
  }
  res.json(improvement);
}));

router.delete('/improvements/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteImprovement(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Improvement not found' });
  }
  res.status(204).end();
}));

/**
 * Cost Matrix Routes
 */
router.get('/cost-matrices', asyncHandler(async (req, res) => {
  const { buildingType, region, year } = req.query;
  const filter: Record<string, any> = {};
  
  if (buildingType) filter.buildingType = buildingType;
  if (region) filter.region = region;
  if (year) filter.year = parseInt(year as string);
  
  const matrices = await storage.getCostMatrices(Object.keys(filter).length ? filter : undefined);
  res.json(matrices);
}));

router.get('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const matrix = await storage.getCostMatrixById(req.params.id);
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  res.json(matrix);
}));

router.get('/cost-matrices/lookup', asyncHandler(async (req, res) => {
  const { buildingType, region, year } = req.query;
  
  if (!buildingType || !region || !year) {
    return res.status(400).json({ message: 'Missing required query parameters: buildingType, region, year' });
  }
  
  const matrix = await storage.getCostMatrixByBuildingType(
    buildingType as string,
    region as string,
    parseInt(year as string)
  );
  
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  
  res.json(matrix);
}));

router.post('/cost-matrices', validate(insertCostMatrixSchema), asyncHandler(async (req, res) => {
  const matrix = await storage.createCostMatrix(req.body);
  res.status(201).json(matrix);
}));

router.patch('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const matrix = await storage.updateCostMatrix(req.params.id, req.body);
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  res.json(matrix);
}));

router.delete('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteCostMatrix(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  res.status(204).end();
}));

/**
 * Building Type Routes
 */
router.get('/building-types', asyncHandler(async (req, res) => {
  const buildingTypes = await storage.getBuildingTypes();
  res.json(buildingTypes);
}));

router.get('/building-types/:code', asyncHandler(async (req, res) => {
  const buildingType = await storage.getBuildingTypeByCode(req.params.code);
  if (!buildingType) {
    return res.status(404).json({ message: 'Building type not found' });
  }
  res.json(buildingType);
}));

router.post('/building-types', asyncHandler(async (req, res) => {
  const buildingType = await storage.createBuildingType(req.body);
  res.status(201).json(buildingType);
}));

router.patch('/building-types/:code', asyncHandler(async (req, res) => {
  const buildingType = await storage.updateBuildingType(req.params.code, req.body);
  if (!buildingType) {
    return res.status(404).json({ message: 'Building type not found' });
  }
  res.json(buildingType);
}));

router.delete('/building-types/:code', asyncHandler(async (req, res) => {
  const success = await storage.deleteBuildingType(req.params.code);
  if (!success) {
    return res.status(404).json({ message: 'Building type not found' });
  }
  res.status(204).end();
}));

/**
 * Region Routes
 */
router.get('/regions', asyncHandler(async (req, res) => {
  const regions = await storage.getRegions();
  res.json(regions);
}));

router.get('/regions/:code', asyncHandler(async (req, res) => {
  const region = await storage.getRegionByCode(req.params.code);
  if (!region) {
    return res.status(404).json({ message: 'Region not found' });
  }
  res.json(region);
}));

router.post('/regions', asyncHandler(async (req, res) => {
  const region = await storage.createRegion(req.body);
  res.status(201).json(region);
}));

router.patch('/regions/:code', asyncHandler(async (req, res) => {
  const region = await storage.updateRegion(req.params.code, req.body);
  if (!region) {
    return res.status(404).json({ message: 'Region not found' });
  }
  res.json(region);
}));

router.delete('/regions/:code', asyncHandler(async (req, res) => {
  const success = await storage.deleteRegion(req.params.code);
  if (!success) {
    return res.status(404).json({ message: 'Region not found' });
  }
  res.status(204).end();
}));

/**
 * Cost Factor Routes
 */
router.get('/quality-factors', asyncHandler(async (req, res) => {
  const factors = await storage.getQualityFactors();
  res.json(factors);
}));

router.get('/condition-factors', asyncHandler(async (req, res) => {
  const factors = await storage.getConditionFactors();
  res.json(factors);
}));

router.get('/age-factors', asyncHandler(async (req, res) => {
  const factors = await storage.getAgeFactors();
  res.json(factors);
}));

/**
 * Calculation Routes
 */
router.get('/calculations', asyncHandler(async (req, res) => {
  const { propertyId, improvementId } = req.query;
  const calculations = await storage.getCalculations(
    propertyId as string,
    improvementId as string
  );
  res.json(calculations);
}));

router.get('/calculations/:id', asyncHandler(async (req, res) => {
  const calculation = await storage.getCalculationById(req.params.id);
  if (!calculation) {
    return res.status(404).json({ message: 'Calculation not found' });
  }
  res.json(calculation);
}));

router.post('/calculations', validate(insertCalculationSchema), asyncHandler(async (req, res) => {
  const calculation = await storage.createCalculation(req.body);
  res.status(201).json(calculation);
}));

router.delete('/calculations/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteCalculation(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Calculation not found' });
  }
  res.status(204).end();
}));

/**
 * Project Routes
 */
router.get('/projects', asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const projects = await storage.getProjects(userId as string);
  res.json(projects);
}));

router.get('/projects/:id', asyncHandler(async (req, res) => {
  const project = await storage.getProjectById(req.params.id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(project);
}));

router.post('/projects', validate(insertProjectSchema), asyncHandler(async (req, res) => {
  const project = await storage.createProject(req.body);
  res.status(201).json(project);
}));

router.patch('/projects/:id', asyncHandler(async (req, res) => {
  const project = await storage.updateProject(req.params.id, req.body);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.json(project);
}));

router.delete('/projects/:id', asyncHandler(async (req, res) => {
  const success = await storage.deleteProject(req.params.id);
  if (!success) {
    return res.status(404).json({ message: 'Project not found' });
  }
  res.status(204).end();
}));

/**
 * Project Members Routes
 */
router.get('/projects/:projectId/members', asyncHandler(async (req, res) => {
  const members = await storage.getProjectMembers(req.params.projectId);
  res.json(members);
}));

router.post('/projects/:projectId/members/:userId', asyncHandler(async (req, res) => {
  const { role } = req.body;
  const success = await storage.addProjectMember(
    req.params.projectId,
    req.params.userId,
    role
  );
  
  if (!success) {
    return res.status(400).json({ message: 'Failed to add member to project' });
  }
  
  res.status(201).json({ message: 'Member added to project' });
}));

router.delete('/projects/:projectId/members/:userId', asyncHandler(async (req, res) => {
  const success = await storage.removeProjectMember(
    req.params.projectId,
    req.params.userId
  );
  
  if (!success) {
    return res.status(404).json({ message: 'Member not found in project' });
  }
  
  res.status(204).end();
}));

/**
 * Project Properties Routes
 */
router.get('/projects/:projectId/properties', asyncHandler(async (req, res) => {
  const properties = await storage.getProjectProperties(req.params.projectId);
  res.json(properties);
}));

router.post('/projects/:projectId/properties/:propertyId', asyncHandler(async (req, res) => {
  const success = await storage.addPropertyToProject(
    req.params.projectId,
    req.params.propertyId
  );
  
  if (!success) {
    return res.status(400).json({ message: 'Failed to add property to project' });
  }
  
  res.status(201).json({ message: 'Property added to project' });
}));

router.delete('/projects/:projectId/properties/:propertyId', asyncHandler(async (req, res) => {
  const success = await storage.removePropertyFromProject(
    req.params.projectId,
    req.params.propertyId
  );
  
  if (!success) {
    return res.status(404).json({ message: 'Property not found in project' });
  }
  
  res.status(204).end();
}));

/**
 * Settings Routes
 */
// Get all settings
router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await storage.getSettings();
  res.json(settings);
}));

// Get a specific setting
router.get('/settings/:key', asyncHandler(async (req, res) => {
  const setting = await storage.getSetting(req.params.key);
  
  // Default values for known settings
  const defaultValues: Record<string, string> = {
    'SAAS_MODE': 'true',
    'DEV_AUTOLOGIN': 'true',
    'DEBUG_MODE': 'false',
    'API_RATE_LIMITING': 'true',
    'OPENAI_API_KEY_STATUS': 'missing',
    'DEV_AUTO_LOGIN_ENABLED': 'true'
  };
  
  // If setting doesn't exist but we have a default, return that
  if (!setting) {
    if (defaultValues[req.params.key]) {
      // Store the default value for future use
      await storage.setSetting(req.params.key, defaultValues[req.params.key]);
      return res.json({ key: req.params.key, value: defaultValues[req.params.key] });
    }
    
    return res.status(404).json({ message: 'Setting not found' });
  }
  
  // Return the key and value
  res.json({ key: req.params.key, value: setting.value });
}));

// Create or update a setting
router.put('/settings/:key', asyncHandler(async (req, res) => {
  const { value } = req.body;
  
  if (!value) {
    return res.status(400).json({ message: 'Value is required' });
  }
  
  // Ignore description parameter as it doesn't exist in the database
  const success = await storage.setSetting(req.params.key, value);
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to set setting' });
  }
  
  res.json({ key: req.params.key, value });
}));

// Update a setting (PATCH variation for form compatibility)
router.patch('/settings/:key', asyncHandler(async (req, res) => {
  const { value } = req.body;
  
  if (!value) {
    return res.status(400).json({ message: 'Value is required' });
  }
  
  const success = await storage.setSetting(req.params.key, value);
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to set setting' });
  }
  
  res.json({ key: req.params.key, value });
}));

/**
 * Analytics Routes
 */
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/what-if-scenarios', whatIfScenariosRoutes);

/**
 * System Routes
 */

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Current authenticated user
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json(req.user);
});

export default router;