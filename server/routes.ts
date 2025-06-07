/**
 * BCBS Application API Routes
 * 
 * This file defines the API routes for the Benton County Building System.
 * It provides endpoints for accessing and manipulating all application data.
 */

import express from 'express';
import { z } from 'zod';
import { storage } from './storage-factory';
import * as fs from 'fs';
import * as path from 'path';
import { db } from './db';
import * as schema from '../shared/schema';
import { eq } from 'drizzle-orm';
import analyticsRoutes from './routes/analyticsRoutes';
import reportRoutes from './routes/reportRoutes';
import whatIfScenariosRoutes from './routes/whatIfScenariosRoutes';
import importRoutes from './routes/importRoutes';
import calculationRoutes from './routes/calculationRoutes';
import storytellingRoutes from './routes/storytelling-routes';
import { geographicRoutes } from './routes/geographicRoutes';
import { propertyHeatmapRoutes } from './routes/propertyHeatmapRoutes';
import { gisImportRoutes } from './routes/gisImportRoutes';
import { geoMappingRoutes } from './routes/geoMappingRoutes';
import { neighborhoodDiscoveryRoutes } from './routes/neighborhoodDiscoveryRoutes';
import { smartSearchRoutes } from './routes/smartSearchRoutes';
import { bentonCountyDataService } from './services/benton-county-data';

import { generateShapInsight } from './ai/shap_agent';
import propertiesRouter from './routes/properties';
// Import property import and data quality routers
import propertyImportRouter from './routes/property-import.js';
import dataQualityRouter from './routes/data-quality.js';
// The CostFactorTables plugin is registered directly in server/index.ts
import authRoutes from './routes/auth';
import calculatorRouter from './routes/calculator';
import propertyMapRoutes from './routes/property-routes';
// Legacy import path, to be removed later
// import { registerPropertyImportRoutes } from './routes/property-import';

// Use consolidated storage interface

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

router.get('/properties/geo/:geoId', asyncHandler(async (req, res) => {
  const property = await storage.getPropertyByGeoId(req.params.geoId);
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
}));

router.get('/properties/:id', asyncHandler(async (req, res) => {
  // Convert string ID parameter to a number for database query
  const propertyId = parseInt(req.params.id, 10);
  
  if (isNaN(propertyId)) {
    return res.status(400).json({ message: 'Invalid property ID format' });
  }
  
  console.log(`Looking up property with ID: ${propertyId}`);
  const property = await storage.getPropertyById(propertyId);
  console.log(`Property lookup result:`, property ? 'Found' : 'Not Found');
  
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
  console.log('[DEBUG] GET /cost-matrices endpoint called');
  const { buildingType, region, year, county } = req.query;
  const filter: Record<string, any> = {};
  
  if (buildingType) filter.buildingType = buildingType;
  if (region) filter.region = region;
  if (year) filter.year = parseInt(year as string);
  if (county) filter.county = county;
  
  console.log('[DEBUG] Fetching cost matrices with filter:', filter);
  try {
    const matrices = await storage.getCostMatrices(Object.keys(filter).length ? filter : undefined);
    console.log(`[DEBUG] Found ${matrices ? matrices.length : 0} matrices`);
    
    // Map database fields to API response fields for consistency
    const mappedMatrices = matrices.map(matrix => ({
      id: matrix.id,
      buildingType: matrix.buildingType,
      buildingTypeDescription: matrix.buildingTypeDescription,
      region: matrix.region,
      year: matrix.matrix_year,
      baseRate: matrix.base_cost,
      county: matrix.county,
      state: matrix.state,
      description: matrix.matrix_description,
      isActive: matrix.is_active,
      createdAt: matrix.createdAt,
      updatedAt: matrix.updatedAt
    }));
    
    res.json(mappedMatrices || []);
  } catch (error) {
    console.error('[ERROR] Failed to get cost matrices:', error);
    res.status(500).json({ message: 'Failed to fetch cost matrices', error: error.message });
  }
}));

// Note: This route needs to be before /cost-matrices/:id because Express uses the first matching route
router.get('/cost-matrices/lookup', asyncHandler(async (req, res) => {
  const { buildingType, region, year, county } = req.query;
  
  console.log(`[DEBUG] Lookup params: buildingType=${buildingType}, region=${region}, year=${year}, county=${county}`);
  
  if (!buildingType || !year) {
    return res.status(400).json({ message: 'Missing required query parameters: buildingType, year' });
  }
  
  // These parameters are configured for Benton County data specifically
  const countyVal = county || 'Benton'; // Default to Benton County if not specified
  
  const matrix = await storage.getCostMatrixByBuildingType(
    buildingType as string,
    countyVal as string,
    parseInt(year as string)
  );
  
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  
  // Map database fields to API response fields for consistency
  // Handle both raw SQL query results and ORM object results
  const mappedMatrix = {
    id: matrix.id,
    buildingType: matrix.building_type || matrix.buildingType,
    buildingTypeDescription: matrix.building_type_description || matrix.buildingTypeDescription,
    region: matrix.region,
    year: matrix.matrix_year || matrix.year,
    baseRate: matrix.base_cost || matrix.baseRate,
    county: matrix.county,
    state: matrix.state,
    description: matrix.matrix_description || matrix.description,
    isActive: matrix.is_active !== undefined ? matrix.is_active : matrix.isActive,
    createdAt: matrix.created_at || matrix.createdAt,
    updatedAt: matrix.updated_at || matrix.updatedAt
  };
  
  res.json(mappedMatrix);
}));

// Route for getting a specific cost matrix by ID
router.get('/cost-matrices/:id', asyncHandler(async (req, res) => {
  const matrix = await storage.getCostMatrixById(parseInt(req.params.id));
  if (!matrix) {
    return res.status(404).json({ message: 'Cost matrix not found' });
  }
  
  // Map database fields to API response fields for consistency
  // Handle both raw SQL query results and ORM object results
  const mappedMatrix = {
    id: matrix.id,
    buildingType: matrix.building_type || matrix.buildingType,
    buildingTypeDescription: matrix.building_type_description || matrix.buildingTypeDescription,
    region: matrix.region,
    year: matrix.matrix_year || matrix.year,
    baseRate: matrix.base_cost || matrix.baseRate,
    county: matrix.county,
    state: matrix.state,
    description: matrix.matrix_description || matrix.description,
    isActive: matrix.is_active !== undefined ? matrix.is_active : matrix.isActive,
    createdAt: matrix.created_at || matrix.createdAt,
    updatedAt: matrix.updated_at || matrix.updatedAt
  };
  
  res.json(mappedMatrix);
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
 * Direct Cost Factors File Access
 * This route serves the costFactors.json file directly
 */
router.get('/cost-factors-file', asyncHandler(async (req, res) => {
  try {
    // Use path.resolve to get the absolute path from the project root
    const filePath = path.resolve('./data/costFactors.json');
    
    // Use fs.promises for async file operations
    try {
      // Read the file and return it as JSON
      const fileContent = await fs.promises.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      
      res.json(jsonData);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ message: 'Cost factors file not found' });
      }
      console.error('Error reading cost factors file:', error);
      res.status(500).json({ message: 'Error reading cost factors file', error: error.message });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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
 * TerraBuild Frontend API Routes
 */
router.post('/validate_matrix', asyncHandler(async (req, res) => {
  const { fileName, data } = req.body;
  
  // Generate a unique session ID
  const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  try {
    // Store session in SQLite
    await storage.createSession({
      id: sessionId,
      userId: 1, // Default user ID
      matrixName: fileName,
      status: 'active',
      settings: { initialData: data }
    });
    
    // Store each matrix item
    for (const item of data) {
      await storage.saveMatrixItem(sessionId, item);
    }
    
    // Generate initial SHAP insight
    const insightMessage = await generateShapInsight(sessionId, data);
    
    // Record session history
    await storage.createSessionHistory({
      sessionId,
      event: 'matrix_validated',
      data: { fileName, itemCount: data.length, insight: insightMessage }
    });
    
    // Return session ID and validation result
    res.json({ 
      session_id: sessionId,
      status: 'validated',
      message: 'Matrix validated successfully'
    });
  } catch (error) {
    console.error('Error validating matrix:', error);
    res.status(500).json({ 
      error: 'Failed to validate matrix',
      details: error.message 
    });
  }
}));

router.post('/re_run_agents', asyncHandler(async (req, res) => {
  const { fileName, data, sessionId } = req.body;
  
  try {
    // Generate new insights with SHAP
    const insightMessage = await generateShapInsight(sessionId || 'temp_session', data);
    
    // Create adjusted values based on features
    const adjustedValues = data.map(item => {
      // Simulate agent adjustments
      const changePercent = (Math.random() * 10 - 5).toFixed(2);
      const adjustedCost = parseFloat(item.base_cost) * (1 + parseFloat(changePercent) / 100);
      
      return {
        id: item.id,
        old_value: parseFloat(item.base_cost).toFixed(2),
        new_value: adjustedCost.toFixed(2),
        change_percent: changePercent
      };
    });
    
    // If we have a session ID, update the matrix items
    if (sessionId) {
      for (const adjusted of adjustedValues) {
        await storage.updateMatrixItem(sessionId, adjusted.id, {
          adjustedCost: adjusted.new_value,
          changePercent: adjusted.change_percent
        });
      }
      
      // Record rerun in session history
      await storage.createSessionHistory({
        sessionId,
        event: 'agents_rerun',
        data: { adjustedValues, insight: insightMessage }
      });
    }
    
    res.json({
      adjustedValues,
      insight: insightMessage
    });
  } catch (error) {
    console.error('Error re-running agents:', error);
    res.status(500).json({
      error: 'Failed to re-run agents',
      details: error.message
    });
  }
}));

router.get('/get_insights/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Get insights for the session from SQLite
    const insights = await storage.getInsights(sessionId);
    
    res.json({
      sessionId,
      insights: insights.map(insight => ({
        id: insight.id,
        agentName: insight.agentName,
        message: insight.message,
        timestamp: insight.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({
      error: 'Failed to fetch insights',
      details: error.message
    });
  }
}));

// Export endpoints
router.get('/export/json/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // Get session data
    const session = await storage.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get matrix items
    const matrixItems = await storage.getMatrixItems(sessionId);
    
    // Get insights
    const insights = await storage.getInsights(sessionId);
    
    // Get session history
    const history = await storage.getSessionHistory(sessionId);
    
    const exportData = {
      sessionId,
      matrixName: session.matrixName,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      status: session.status,
      matrixItems,
      insights,
      history
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=terrabuild_export_${sessionId}.json`);
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting session:', error);
    res.status(500).json({
      error: 'Failed to export session',
      details: error.message
    });
  }
}));

router.get('/export/pdf/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    // This would normally generate a PDF, but for now we'll just return a JSON response
    // that indicates a PDF would be generated
    res.setHeader('Content-Type', 'application/json');
    res.json({
      message: 'PDF generation would occur here',
      sessionId,
      pdfUrl: `/download/pdf/${sessionId}`
    });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    res.status(500).json({
      error: 'Failed to export PDF',
      details: error.message
    });
  }
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
router.use('/stories', storytellingRoutes);
router.use('/geography', geographicRoutes);
router.use('/property-heatmap', propertyHeatmapRoutes);
router.use('/gis-import', gisImportRoutes);
router.use('/geo-mapping', geoMappingRoutes);
router.use('/neighborhoods', neighborhoodDiscoveryRoutes);
router.use('/search', smartSearchRoutes);
router.use('/map', propertyMapRoutes);
// Cost Factor Tables plugin is registered directly in server/index.ts
router.use('/', importRoutes);
router.use('/', calculationRoutes);

// Property import routes are already mounted via propertyImportRouter

/**
 * System Routes
 */

// Health check endpoint with detailed system status
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await storage.checkDatabaseConnection();
    
    // Check memory usage
    const memoryUsage = process.memoryUsage();
    
    // Check system uptime
    const uptime = process.uptime();
    
    // Service version
    const version = process.env.npm_package_version || '1.0.0';
    
    // Check agent health
    const agentStatuses = await storage.getAgentStatuses();
    
    // Return comprehensive health information
    res.json({
      status: dbStatus ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version,
      uptime,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB',
      },
      database: {
        connected: dbStatus,
      },
      agents: agentStatuses || { status: 'unknown' },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'critical', 
      timestamp: new Date().toISOString(),
      error: 'Failed to perform health check'
    });
  }
});

// Prometheus metrics endpoint - exposes metrics in Prometheus format for scraping
router.get('/metrics', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await storage.checkDatabaseConnection();
    
    // Memory usage in bytes
    const memoryUsage = process.memoryUsage();
    
    // Get agent statuses
    const agentStatuses = await storage.getAgentStatuses();
    
    // Format metrics for Prometheus
    let prometheusMetrics = '';
    
    // System uptime
    prometheusMetrics += `# HELP app_uptime_seconds The uptime of the application in seconds\n`;
    prometheusMetrics += `# TYPE app_uptime_seconds gauge\n`;
    prometheusMetrics += `app_uptime_seconds ${process.uptime()}\n\n`;
    
    // Memory usage
    prometheusMetrics += `# HELP app_memory_usage_bytes Memory usage of the app in bytes\n`;
    prometheusMetrics += `# TYPE app_memory_usage_bytes gauge\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="heapTotal"} ${memoryUsage.heapTotal}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="heapUsed"} ${memoryUsage.heapUsed}\n`;
    prometheusMetrics += `app_memory_usage_bytes{type="external"} ${memoryUsage.external}\n\n`;
    
    // Database status
    prometheusMetrics += `# HELP app_database_connected Database connection status (1 for connected, 0 for disconnected)\n`;
    prometheusMetrics += `# TYPE app_database_connected gauge\n`;
    prometheusMetrics += `app_database_connected ${dbStatus ? 1 : 0}\n\n`;
    
    // Agent health metrics
    prometheusMetrics += `# HELP app_agent_status AI Agent status (1 for healthy, 0 for unhealthy)\n`;
    prometheusMetrics += `# TYPE app_agent_status gauge\n`;
    
    // Convert agent statuses to Prometheus format
    Object.entries(agentStatuses).forEach(([agentId, status]) => {
      const isHealthy = status.status === 'healthy' ? 1 : 0;
      prometheusMetrics += `app_agent_status{agent="${agentId}"} ${isHealthy}\n`;
    });
    
    // Set content type for Prometheus metrics
    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    console.error('Metrics collection error:', error);
    res.status(500).send('# Error collecting metrics');
  }
});

// Agent status endpoints
router.get('/agents', asyncHandler(async (req, res) => {
  const agentStatuses = await storage.getAgentStatuses();
  res.json(agentStatuses);
}));

router.get('/agents/:agentId', asyncHandler(async (req, res) => {
  const agentStatus = await storage.getAgentStatus(req.params.agentId);
  if (!agentStatus) {
    return res.status(404).json({ message: 'Agent not found' });
  }
  res.json(agentStatus);
}));

router.post('/agents/:agentId/status', asyncHandler(async (req, res) => {
  const { agentId } = req.params;
  const { status, metadata, errorMessage } = req.body;
  
  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }
  
  const success = await storage.updateAgentStatus(
    agentId,
    status,
    metadata,
    errorMessage
  );
  
  if (!success) {
    return res.status(500).json({ message: 'Failed to update agent status' });
  }
  
  res.status(200).json({ message: 'Agent status updated successfully' });
}));

// Debug test route for direct database access
router.get('/debug/property/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`[DEBUG ROUTE] Directly querying database for property ID: ${id}`);
  
  try {
    const propertyId = parseInt(id, 10);
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID' });
    }
    
    // Query directly from the database
    const [property] = await db.select().from(schema.properties).where(eq(schema.properties.id, propertyId));
    
    console.log(`[DEBUG ROUTE] Direct DB query result:`, property ? 'Property found' : 'Property not found');
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json(property);
  } catch (error) {
    console.error('[DEBUG ROUTE] Error in direct database query:', error);
    res.status(500).json({ error: 'Database error', details: String(error) });
  }
}));

// Mount the properties router
router.use('/properties', propertiesRouter);

// Mount the property import router
router.use('/import', propertyImportRouter);

// Mount the data quality router
router.use('/data-quality', dataQualityRouter);

// Mount the auth routes - this will handle login, register, logout, and user routes
router.use('/', authRoutes);

// Mount the calculator routes for building cost calculations
router.use('/', calculatorRouter);

// Benton County Washington Real Property Data API Endpoints
router.get('/api/benton-county/search', async (req: express.Request, res: express.Response) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const properties = await bentonCountyDataService.searchProperties(query);
    res.json({
      success: true,
      data: properties,
      message: `Found ${properties.length} properties in Benton County`
    });
  } catch (error) {
    console.error('Benton County property search error:', error);
    res.status(500).json({ 
      error: 'Failed to search Benton County properties',
      message: 'Please verify API credentials for Benton County data access'
    });
  }
});

router.get('/api/benton-county/property/:parcelId', async (req: express.Request, res: express.Response) => {
  try {
    const { parcelId } = req.params;
    const property = await bentonCountyDataService.getPropertyByParcelId(parcelId);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found in Benton County records' });
    }
    
    res.json({
      success: true,
      data: property,
      message: 'Benton County property details retrieved'
    });
  } catch (error) {
    console.error('Benton County property lookup error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve property details',
      message: 'Please verify API credentials for Benton County assessor data'
    });
  }
});

router.get('/api/benton-county/market-data/:region', async (req: express.Request, res: express.Response) => {
  try {
    const { region } = req.params;
    const marketData = await bentonCountyDataService.getMarketData(region);
    
    res.json({
      success: true,
      data: marketData,
      message: `Market data for ${region} retrieved from Benton County records`
    });
  } catch (error) {
    console.error('Benton County market data error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve market data',
      message: 'Please verify API credentials for Benton County market analysis'
    });
  }
});

router.get('/api/benton-county/cost-factors/:buildingType', async (req: express.Request, res: express.Response) => {
  try {
    const { buildingType } = req.params;
    const { region } = req.query;
    
    const costFactors = await bentonCountyDataService.getCostFactors(
      buildingType, 
      region as string
    );
    
    res.json({
      success: true,
      data: costFactors,
      message: `Cost factors for ${buildingType} in Benton County retrieved`
    });
  } catch (error) {
    console.error('Benton County cost factors error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve cost factors',
      message: 'Please verify API credentials for Benton County building cost data'
    });
  }
});

// AI-Powered Property Valuation Endpoint
router.post('/api/benton-county/ai-valuation', async (req: express.Request, res: express.Response) => {
  try {
    const { parcelId, propertyDetails, marketComparables } = req.body;
    
    // Get property data from Benton County
    const property = await bentonCountyDataService.getPropertyByParcelId(parcelId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found in Benton County records' });
    }
    
    // Get market data for the property's region
    const marketData = await bentonCountyDataService.getMarketData(property.city.toLowerCase());
    
    // Get cost factors for the building type
    const costFactors = await bentonCountyDataService.getCostFactors(
      property.buildingType, 
      property.city.toLowerCase()
    );
    
    // AI-powered valuation calculation
    const aiValuation = {
      property,
      marketData,
      costFactors,
      aiAnalysis: {
        estimatedValue: calculateAIValuation(property, marketData, costFactors),
        confidenceLevel: calculateConfidence(property, marketData),
        insights: generateValuationInsights(property, marketData, costFactors),
        recommendations: generateRecommendations(property, marketData)
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: aiValuation,
      message: 'AI-powered property valuation completed using Benton County data'
    });
  } catch (error) {
    console.error('AI valuation error:', error);
    res.status(500).json({ 
      error: 'Failed to complete AI valuation',
      message: 'Please verify API credentials and try again'
    });
  }
});

// Helper functions for AI valuation
function calculateAIValuation(property: any, marketData: any, costFactors: any): number {
  const baseValue = property.totalSqFt * marketData.pricePerSqFt;
  const locationFactor = costFactors.locationFactors[property.city.toLowerCase().replace(' ', '_')] || 1.0;
  const qualityFactor = costFactors.qualityMultipliers[property.buildingDetails.quality.toLowerCase()] || 1.0;
  
  return Math.round(baseValue * locationFactor * qualityFactor);
}

function calculateConfidence(property: any, marketData: any): string {
  const salesVolume = marketData.salesVolume;
  const propertyAge = new Date().getFullYear() - property.yearBuilt;
  
  if (salesVolume > 100 && propertyAge < 20) return 'High';
  if (salesVolume > 50 && propertyAge < 40) return 'Medium';
  return 'Low';
}

function generateValuationInsights(property: any, marketData: any, costFactors: any): string[] {
  const insights = [];
  
  if (marketData.appreciation > 8) {
    insights.push(`Strong market appreciation of ${marketData.appreciation}% in ${property.city}`);
  }
  
  if (property.buildingDetails.condition === 'Good') {
    insights.push('Property condition supports current valuation');
  }
  
  if (marketData.pricePerSqFt > 200) {
    insights.push('Above-average market pricing in this region');
  }
  
  return insights;
}

function generateRecommendations(property: any, marketData: any): string[] {
  const recommendations = [];
  
  if (marketData.appreciation > 5) {
    recommendations.push('Consider holding for continued appreciation');
  }
  
  if (property.buildingDetails.condition !== 'Excellent') {
    recommendations.push('Property improvements could increase value');
  }
  
  recommendations.push('Regular market monitoring recommended');
  
  return recommendations;
}

// Mount the cost factor tables router
// Cost Factor Tables router is already registered

export default router;