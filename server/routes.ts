import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertApiEndpointSchema, 
  insertActivitySchema,
  insertBuildingCostSchema,
  insertCostFactorSchema,
  insertUserSchema,
  insertMaterialTypeSchema,
  insertMaterialCostSchema,
  insertBuildingCostMaterialSchema,
  insertCalculationHistorySchema,
  insertCostFactorPresetSchema,
  insertFileUploadSchema,
  insertWhatIfScenarioSchema,
  insertScenarioVariationSchema,
  insertSharedProjectSchema,
  insertProjectMemberSchema,
  insertProjectItemSchema,
  insertProjectInvitationSchema,
  insertCommentSchema,
  insertSharedLinkSchema,
  insertProjectActivitySchema,
  insertConnectionHistorySchema,
  insertFTPConnectionSchema
} from "@shared/schema";
import { importPropertyData } from "./property-data-import";
import { importPropertyDataEnhanced } from "./property-data-import-enhanced";
import { calculateBuildingCost, calculateMaterialCosts } from "./calculationEngine";
import { z } from "zod";
import { setupAuth } from "./auth";
import { validateExcelFile, validateBatchExcelFiles } from "./validators/excelValidator";
import { processBatchImport } from "./import/batchImporter";
import { initMCP } from "./mcp";
import aiRoutes from "./routes/aiRoutes";
import { registerBenchmarkingRoutes } from "./routes/benchmarkingRoutes";
import advancedAnalyticsRouter from "./routes/advancedAnalyticsRoutes";
import advancedPredictionRoutes from "./routes/advancedPredictionRoutes";
import { registerPropertyImportRoutes } from "./routes/property-import";
import dataConnectorRoutes from "./routes/dataConnectorRoutes";
import connectionHistoryRoutes from "./routes/connectionHistoryRoutes";
import { registerCollaborationRoutes } from "./routes/collaborationRoutes";
import { registerCommentRoutes } from "./routes/commentRoutes";
import { registerSharedLinksRoutes } from "./routes/sharedLinksRoutes";
import { registerProjectActivitiesRoutes } from "./routes/projectActivitiesRoutes";
import exportRoutes from "./routes/exportRoutes";
import { initFTPSyncRoutes } from "./routes/ftpSyncRoutes";
import ftpRoutes from "./routes/ftpRoutes";
import ftpConnectionRoutes from "./routes/ftpConnectionRoutes";
import { initSchedulerRoutes } from "./routes/schedulerRoutes";
import costCalculationRoutes from "./routes/costCalculationRoutes";
import { createCostMatrixImportRouter } from "./routes/cost-matrix-import";
import supabaseRoutes from "./routes/supabaseRoutes";
import supabaseTestRouter from "./routes/supabase-test";
import supabaseProxyRouter from "./routes/supabaseProxy";
import multer from "multer";
import path from "path";
import fs from "fs";

// Import analytics and report controllers
import {
  getTimeSeriesData,
  getRegionalComparison,
  getBuildingTypeComparison,
  getCostBreakdown,
  getBenchmarkData
} from "./controllers/analyticsController";
import { exportReport } from "./controllers/reportController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and authorization
  setupAuth(app);
  
  // TEMPORARY: Authentication disabled for development
  // This middleware bypasses authentication checks entirely
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // Create a mock admin user for all requests
    if (!req.user) {
      // Using User type from schema for type safety
      req.user = {
        id: 1,
        username: "admin",
        password: "disabled", // Using a placeholder value
        role: "admin",
        name: "Admin User",
        isActive: true
      };
    }
    next();
  };
  
  // Add requireAuth middleware to routes that should be protected
  // Keeping it commented out for now as we're implementing autologin
  // const protectedRoute = requireAuth;
  // API endpoints for the Mission Control Panel
  
  // Get all environments
  app.get("/api/environments", async (req: Request, res: Response) => {
    const environments = await storage.getAllEnvironments();
    res.json(environments);
  });
  
  // Get all API endpoints
  app.get("/api/endpoints", async (req: Request, res: Response) => {
    const endpoints = await storage.getAllApiEndpoints();
    res.json(endpoints);
  });
  
  // Create API endpoint
  app.post("/api/endpoints", async (req: Request, res: Response) => {
    try {
      const endpoint = insertApiEndpointSchema.parse(req.body);
      const createdEndpoint = await storage.createApiEndpoint(endpoint);
      
      // Log activity
      await storage.createActivity({
        action: `Added new API endpoint: ${endpoint.method} ${endpoint.path}`,
        icon: "ri-api-line",
        iconColor: "primary"
      });
      
      res.status(201).json(createdEndpoint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "An error occurred creating the endpoint" });
      }
    }
  });
  
  // Update API endpoint status
  app.patch("/api/endpoints/:id/status", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const updatedEndpoint = await storage.updateApiEndpointStatus(id, status);
      if (!updatedEndpoint) {
        return res.status(404).json({ message: "Endpoint not found" });
      }
      
      res.json(updatedEndpoint);
    } catch (error) {
      res.status(500).json({ message: "An error occurred updating the endpoint status" });
    }
  });
  
  // Delete API endpoint
  app.delete("/api/endpoints/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteApiEndpoint(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "An error occurred deleting the endpoint" });
    }
  });
  
  // Get all settings
  app.get("/api/settings", async (req: Request, res: Response) => {
    const settings = await storage.getAllSettings();
    res.json(settings);
  });
  
  // Get all available regions
  app.get("/api/regions", async (req: Request, res: Response) => {
    try {
      // Get unique regions from cost factors
      const costFactors = await storage.getAllCostFactors();
      // Convert Set to Array explicitly to avoid TypeScript errors
      const uniqueRegions = new Set<string>();
      costFactors.forEach(factor => uniqueRegions.add(factor.region));
      const regions = Array.from(uniqueRegions);
      res.json(regions);
    } catch (error) {
      console.error("Error fetching regions:", error);
      res.status(500).json({ message: "Error fetching regions" });
    }
  });
  
  // Update a setting
  app.patch("/api/settings/:key", async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ message: "Value is required" });
      }
      
      const updatedSetting = await storage.updateSetting(key, value.toString());
      if (!updatedSetting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      // Log activity
      await storage.createActivity({
        action: `Updated setting: ${key}`,
        icon: "ri-settings-3-line",
        iconColor: "primary"
      });
      
      res.json(updatedSetting);
    } catch (error) {
      res.status(500).json({ message: "An error occurred updating the setting" });
    }
  });
  
  // Get all activities
  app.get("/api/activities", async (req: Request, res: Response) => {
    const activities = await storage.getAllActivities();
    res.json(activities);
  });
  
  // Create activity
  app.post("/api/activities", async (req: Request, res: Response) => {
    try {
      const activity = insertActivitySchema.parse(req.body);
      const createdActivity = await storage.createActivity(activity);
      res.status(201).json(createdActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "An error occurred creating the activity" });
      }
    }
  });
  
  // Get repository status
  app.get("/api/repository", async (req: Request, res: Response) => {
    const repoStatus = await storage.getRepositoryStatus();
    res.json(repoStatus || { status: "not_started" });
  });
  
  // Check autologin status
  app.get("/api/auth/autologin", async (req: Request, res: Response) => {
    const autologinSetting = await storage.getSetting("DEV_AUTO_LOGIN_ENABLED");
    const tokenSetting = await storage.getSetting("DEV_AUTH_TOKEN");
    
    res.json({
      enabled: autologinSetting?.value === "true",
      token: tokenSetting?.value || null,
    });
  });
  
  // Handle automatic login
  app.post("/api/auth/autologin", async (req: Request, res: Response) => {
    try {
      // Check if the feature is enabled
      const autologinSetting = await storage.getSetting("DEV_AUTO_LOGIN_ENABLED");
      if (autologinSetting?.value !== "true") {
        return res.status(403).json({ message: "Auto-login is disabled" });
      }
      
      // Verify token
      const validToken = await storage.getSetting("DEV_AUTH_TOKEN");
      const providedToken = req.body.token;
      
      if (!validToken?.value || validToken.value !== providedToken) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      // Find an admin user to login with
      const adminUser = await storage.getUserByUsername("admin");
      
      if (!adminUser) {
        return res.status(404).json({ message: "Admin user not found" });
      }
      
      // Login the user
      req.login(adminUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        
        // Log the activity
        storage.createActivity({
          action: "Auto-login as admin user",
          icon: "ri-shield-keyhole-line",
          iconColor: "warning"
        });
        
        return res.status(200).json(adminUser);
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing auto-login" });
    }
  });

  // Building Cost Calculator API
  
  // Get cost factors
  app.get("/api/cost-factors", async (req: Request, res: Response) => {
    try {
      const costFactors = await storage.getAllCostFactors();
      res.json(costFactors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost factors" });
    }
  });
  
  // Get cost factor by region and building type
  app.get("/api/cost-factors/:region/:buildingType", async (req: Request, res: Response) => {
    try {
      const { region, buildingType } = req.params;
      const costFactor = await storage.getCostFactorsByRegionAndType(region, buildingType);
      
      if (!costFactor) {
        return res.status(404).json({ message: "Cost factor not found" });
      }
      
      res.json(costFactor);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost factor" });
    }
  });
  
  // Create cost factor
  app.post("/api/cost-factors", async (req: Request, res: Response) => {
    try {
      const costFactor = insertCostFactorSchema.parse(req.body);
      const createdCostFactor = await storage.createCostFactor(costFactor);
      
      await storage.createActivity({
        action: `Added new cost factor for ${costFactor.region} / ${costFactor.buildingType}`,
        icon: "ri-database-2-line",
        iconColor: "primary"
      });
      
      res.status(201).json(createdCostFactor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating cost factor" });
      }
    }
  });
  
  // Update cost factor
  app.patch("/api/cost-factors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const factor = req.body;
      
      const updatedFactor = await storage.updateCostFactor(id, factor);
      if (!updatedFactor) {
        return res.status(404).json({ message: "Cost factor not found" });
      }
      
      res.json(updatedFactor);
    } catch (error) {
      res.status(500).json({ message: "Error updating cost factor" });
    }
  });
  
  // Delete cost factor
  app.delete("/api/cost-factors/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCostFactor(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting cost factor" });
    }
  });
  
  // Get all building costs
  app.get("/api/costs", async (req: Request, res: Response) => {
    try {
      const costs = await storage.getAllBuildingCosts();
      res.json(costs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching building costs" });
    }
  });
  
  // Get building cost by ID
  app.get("/api/costs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cost = await storage.getBuildingCost(id);
      
      if (!cost) {
        return res.status(404).json({ message: "Building cost not found" });
      }
      
      res.json(cost);
    } catch (error) {
      res.status(500).json({ message: "Error fetching building cost" });
    }
  });
  
  // Create building cost
  app.post("/api/costs", async (req: Request, res: Response) => {
    try {
      const buildingCost = insertBuildingCostSchema.parse(req.body);
      
      // Calculate the total cost if not provided
      if (!buildingCost.totalCost) {
        const costPerSqft = Number(buildingCost.costPerSqft);
        const squareFootage = Number(buildingCost.squareFootage);
        // Convert to string to match expected decimal type
        buildingCost.totalCost = (costPerSqft * squareFootage).toFixed(2) as any;
      }
      
      const createdCost = await storage.createBuildingCost(buildingCost);
      
      await storage.createActivity({
        action: `Added new building cost estimate: ${buildingCost.name}`,
        icon: "ri-building-line",
        iconColor: "success"
      });
      
      res.status(201).json(createdCost);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating building cost" });
      }
    }
  });
  
  // Update building cost
  app.patch("/api/costs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const cost = req.body;
      
      const updatedCost = await storage.updateBuildingCost(id, cost);
      if (!updatedCost) {
        return res.status(404).json({ message: "Building cost not found" });
      }
      
      res.json(updatedCost);
    } catch (error) {
      res.status(500).json({ message: "Error updating building cost" });
    }
  });
  
  // Delete building cost
  app.delete("/api/costs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBuildingCost(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting building cost" });
    }
  });
  
  // Calculate building cost estimator
  // Commented out as this has been moved to costCalculationRoutes.ts
  /*
  app.post("/api/costs/calculate", async (req: Request, res: Response) => {
    try {
      const { region, buildingType, squareFootage, complexityMultiplier = 1 } = req.body;
      
      if (!region || !buildingType || !squareFootage) {
        return res.status(400).json({ message: "Missing required parameters: region, buildingType, squareFootage" });
      }
      
      // Get the cost factor for the region and building type
      const costFactor = await storage.getCostFactorsByRegionAndType(region, buildingType);
      
      if (!costFactor) {
        return res.status(404).json({ message: "No cost factors found for the specified region and building type" });
      }
      
      // Calculate the cost
      const baseCost = costFactor.baseCost;
      const regionFactor = costFactor.regionFactor;
      const complexityFactorValue = Number(costFactor.complexityFactor);
      const complexityMultiplierValue = Number(complexityMultiplier);
      const calculatedComplexityFactor = complexityFactorValue * complexityMultiplierValue;
      
      const squareFootageValue = Number(squareFootage);
      const costPerSqft = parseFloat((Number(baseCost) * Number(regionFactor) * calculatedComplexityFactor).toFixed(2));
      const totalCost = parseFloat((costPerSqft * squareFootageValue).toFixed(2));
      
      res.json({
        region,
        buildingType,
        squareFootage: parseFloat(squareFootage.toString()),
        baseCost,
        regionFactor,
        complexityFactor: calculatedComplexityFactor,
        costPerSqft,
        totalCost
      });
    } catch (error) {
      res.status(500).json({ message: "Error calculating building cost" });
    }
  });
  */

  // User Management API

  // Get all users
  app.get("/api/users", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to access this endpoint
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Find a user by email
  app.get("/api/users/by-email", requireAuth, async (req: Request, res: Response) => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email parameter is required" });
      }
      
      const user = await storage.getUserByUsername(email); // Using username as email for simplicity
      
      if (!user) {
        return res.status(404).json({ message: "User not found with that email" });
      }
      
      res.json({ id: user.id, username: user.username, name: user.name });
    } catch (error) {
      console.error("Error finding user by email:", error);
      res.status(500).json({ message: "Error finding user by email" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admins or the user themselves to access this endpoint
      const id = parseInt(req.params.id);
      if (req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  // Create new user
  app.post("/api/users", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to create users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userData = insertUserSchema.parse(req.body);
      
      // Check if the username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password if not already hashed
      if (!userData.password.includes('.')) {
        const { hashPassword } = await import('./auth');
        userData.password = await hashPassword(userData.password);
      }
      
      const createdUser = await storage.createUser(userData);
      
      // Log activity
      await storage.createActivity({
        action: `Created new user: ${userData.username}`,
        icon: "ri-user-add-line",
        iconColor: "success"
      });
      
      res.status(201).json(createdUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating user" });
      }
    }
  });

  // Update user
  app.patch("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow admins or the user themselves to update their profile
      if (req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Regular users can only update their own name and password
      if (req.user?.role !== "admin" && req.user?.id === id) {
        const { role, isActive, ...allowedUpdates } = req.body;
        
        if (role || isActive !== undefined) {
          return res.status(403).json({ message: "You can only update your name and password" });
        }
        
        // If password is being updated, hash it
        if (allowedUpdates.password && !allowedUpdates.password.includes('.')) {
          const { hashPassword } = await import('./auth');
          allowedUpdates.password = await hashPassword(allowedUpdates.password);
        }
        
        const updatedUser = await storage.updateUser(id, allowedUpdates);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        res.json(updatedUser);
      } else {
        // Admins can update any field
        const updates = req.body;
        
        // If password is being updated, hash it
        if (updates.password && !updates.password.includes('.')) {
          const { hashPassword } = await import('./auth');
          updates.password = await hashPassword(updates.password);
        }
        
        const updatedUser = await storage.updateUser(id, updates);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Log activity for role or status changes
        if (updates.role || updates.isActive !== undefined) {
          await storage.createActivity({
            action: `Updated user ${updatedUser.username}: ${
              updates.role ? `role to ${updates.role}` : ''
            } ${
              updates.isActive !== undefined ? `status to ${updates.isActive ? 'active' : 'inactive'}` : ''
            }`,
            icon: "ri-user-settings-line",
            iconColor: "warning"
          });
        }
        
        res.json(updatedUser);
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to delete users
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      
      // Prevent deleting the only admin user
      if (id === 1) {
        return res.status(403).json({ message: "Cannot delete the primary admin user" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteUser(id);
      
      // Log activity
      await storage.createActivity({
        action: `Deleted user: ${user.username}`,
        icon: "ri-user-unfollow-line",
        iconColor: "danger"
      });
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Material Types API
  app.get("/api/materials/types", async (req: Request, res: Response) => {
    try {
      const materialTypes = await storage.getAllMaterialTypes();
      res.json(materialTypes);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material types" });
    }
  });

  app.get("/api/materials/types/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const materialType = await storage.getMaterialType(id);
      
      if (!materialType) {
        return res.status(404).json({ message: "Material type not found" });
      }
      
      res.json(materialType);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material type" });
    }
  });

  app.get("/api/materials/types/code/:code", async (req: Request, res: Response) => {
    try {
      const { code } = req.params;
      const materialType = await storage.getMaterialTypeByCode(code);
      
      if (!materialType) {
        return res.status(404).json({ message: "Material type not found" });
      }
      
      res.json(materialType);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material type by code" });
    }
  });

  // Material Costs API
  app.get("/api/materials/costs", async (req: Request, res: Response) => {
    try {
      const { buildingType, region } = req.query;
      let materialCosts;
      
      if (buildingType && region) {
        materialCosts = await storage.getMaterialCostsByBuildingTypeAndRegion(
          buildingType as string, 
          region as string
        );
      } else if (buildingType) {
        materialCosts = await storage.getMaterialCostsByBuildingType(buildingType as string);
      } else if (region) {
        materialCosts = await storage.getMaterialCostsByRegion(region as string);
      } else {
        materialCosts = await storage.getAllMaterialCosts();
      }
      
      res.json(materialCosts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material costs" });
    }
  });

  app.get("/api/materials/costs/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const materialCost = await storage.getMaterialCost(id);
      
      if (!materialCost) {
        return res.status(404).json({ message: "Material cost not found" });
      }
      
      res.json(materialCost);
    } catch (error) {
      res.status(500).json({ message: "Error fetching material cost" });
    }
  });

  // Building Cost Materials Breakdown API
  app.get("/api/costs/:id/materials", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const materials = await storage.getBuildingCostMaterials(id);
      
      if (!materials || materials.length === 0) {
        return res.status(404).json({ message: "No materials found for this building cost" });
      }
      
      // Enhance the materials with type information
      const enhancedMaterials = await Promise.all(materials.map(async (material) => {
        const materialType = await storage.getMaterialType(material.materialTypeId);
        return {
          ...material,
          materialName: materialType?.name,
          materialCode: materialType?.code,
          materialUnit: materialType?.unit
        };
      }));
      
      res.json(enhancedMaterials);
    } catch (error) {
      res.status(500).json({ message: "Error fetching building cost materials" });
    }
  });

  // Calculate Materials Breakdown
  // Commented out as this has been moved to costCalculationRoutes.ts
  /*
  app.post("/api/costs/calculate-materials", requireAuth, async (req: Request, res: Response) => {
    try {
      const { region, buildingType, squareFootage, complexityMultiplier = 1 } = req.body;
      
      if (!region || !buildingType || !squareFootage) {
        return res.status(400).json({ 
          message: "Missing required parameters: region, buildingType, squareFootage" 
        });
      }
      
      try {
        const materialsBreakdown = await storage.calculateMaterialsBreakdown(
          region, 
          buildingType, 
          Number(squareFootage), 
          Number(complexityMultiplier)
        );
        
        // Log activity
        await storage.createActivity({
          action: `Calculated materials breakdown for ${buildingType} in ${region}`,
          icon: "ri-stack-line",
          iconColor: "primary"
        });
        
        // If user is authenticated, save to calculation history
        if (req.user?.id) {
          const userId = req.user.id;
          // Create calculation history with fields matching the database schema
          const calculationData = {
            userId,
            name: `${buildingType} Building in ${region}`,
            region,
            buildingType,
            squareFootage: Number(squareFootage),
            baseCost: materialsBreakdown.baseCost.toString(),
            regionFactor: materialsBreakdown.regionFactor.toString(),
            complexity: "Standard", // Required field in the DB
            complexityFactor: materialsBreakdown.complexityFactor.toString(),
            quality: "Average",
            qualityFactor: "1.0",
            condition: "Good",
            conditionFactor: "1.0",
            costPerSqft: materialsBreakdown.costPerSqft.toString(),
            totalCost: materialsBreakdown.totalCost.toString(),
            adjustedCost: materialsBreakdown.totalCost.toString()
          };
          await storage.createCalculationHistory(calculationData);
        }
        
        res.json(materialsBreakdown);
      } catch (error: any) {
        res.status(404).json({ message: error.message || "Error calculating materials breakdown" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing request" });
    }
  });
  */
  
  // Calculation History API
  
  // Get all calculation history entries
  app.get("/api/calculation-history", requireAuth, async (req: Request, res: Response) => {
    try {
      // If user is admin, return all entries, otherwise filter by user id
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";
      
      let history;
      if (isAdmin) {
        history = await storage.getAllCalculationHistory();
      } else if (userId) {
        history = await storage.getCalculationHistoryByUserId(userId);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calculation history" });
    }
  });
  
  // Get calculation history by ID
  app.get("/api/calculation-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const calculation = await storage.getCalculationHistory(id);
      
      if (!calculation) {
        return res.status(404).json({ message: "Calculation history not found" });
      }
      
      // Check if user has access to this calculation
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";
      
      if (!isAdmin && calculation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(calculation);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calculation history" });
    }
  });
  
  // Delete calculation history
  app.delete("/api/calculation-history/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const calculation = await storage.getCalculationHistory(id);
      
      if (!calculation) {
        return res.status(404).json({ message: "Calculation history not found" });
      }
      
      // Check if user has access to delete this calculation
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";
      
      if (!isAdmin && calculation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCalculationHistory(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting calculation history" });
    }
  });

  // Cost Matrix Import API
  
  // Set up multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(), // Store files in memory as buffer
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB file size limit
    },
    fileFilter: (req, file, cb) => {
      // Accept Excel and CSV files
      if (
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'text/csv' ||
        file.mimetype === 'application/csv' ||
        file.originalname.toLowerCase().endsWith('.csv') ||
        file.originalname.toLowerCase().endsWith('.xlsx') ||
        file.originalname.toLowerCase().endsWith('.xls')
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        return cb(new Error('Only Excel and CSV files are allowed'));
      }
    }
  });
  
  // Validate Excel file
  app.post("/api/matrix/validate", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // Validate Excel file using buffer
      const validationResult = await validateExcelFile(req.file.buffer, {
        strictMode: req.body.strictMode === 'true',
        checkDataTypes: true
      });
      
      // Return validation result
      res.json(validationResult);
    } catch (error: any) {
      console.error("Excel validation error:", error);
      res.status(500).json({ message: `Error validating Excel file: ${error.message}` });
    }
  });
  
  // Process batch import of Excel files
  app.post("/api/matrix/batch-import", upload.array('files', 10), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      // Create temporary files from buffers
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const filePaths = [];
      for (const file of files) {
        const tempFilePath = path.join(tempDir, `temp-${Date.now()}-${file.originalname}`);
        fs.writeFileSync(tempFilePath, file.buffer);
        filePaths.push(tempFilePath);
      }
      
      const options = {
        detectDuplicates: req.body.detectDuplicates === 'true',
        standardizeData: req.body.standardizeData === 'true',
        useTransaction: req.body.useTransaction === 'true'
      };
      
      // Process batch import
      const importResult = await processBatchImport(filePaths, options);
      
      // Clean up uploaded files
      filePaths.forEach(filePath => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error(`Error deleting file ${filePath}:`, e);
        }
      });
      
      // Log activity
      await storage.createActivity({
        action: `Batch imported ${importResult.processed} cost matrices`,
        icon: "ri-file-excel-line",
        iconColor: "success"
      });
      
      // Return import result
      res.json(importResult);
    } catch (error: any) {
      console.error("Batch import error:", error);
      res.status(500).json({ message: `Error processing batch import: ${error.message}` });
    }
  });
  
  // Get cost matrix by region and building type
  app.get("/api/matrix/:region/:buildingType", async (req: Request, res: Response) => {
    try {
      const { region, buildingType } = req.params;
      const matrix = await storage.getCostMatrixByRegionAndBuildingType(region, buildingType);
      
      if (!matrix) {
        return res.status(404).json({ message: "Cost matrix not found" });
      }
      
      res.json(matrix);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching cost matrix: ${error.message}` });
    }
  });
  
  // Get all cost matrices
  app.get("/api/matrix", async (req: Request, res: Response) => {
    try {
      const matrices = await storage.getAllCostMatrix();
      res.json(matrices);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching cost matrices: ${error.message}` });
    }
  });
  
  // Cost Factor Presets API
  
  // Get all cost factor presets
  app.get("/api/cost-factor-presets", async (req: Request, res: Response) => {
    try {
      const presets = await storage.getAllCostFactorPresets();
      res.json(presets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost factor presets" });
    }
  });
  
  // Get default cost factor presets
  app.get("/api/cost-factor-presets/defaults", async (req: Request, res: Response) => {
    try {
      const presets = await storage.getDefaultCostFactorPresets();
      res.json(presets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching default cost factor presets" });
    }
  });
  
  // Get cost factor presets by user ID
  app.get("/api/cost-factor-presets/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Only allow admins or the user themselves to access this endpoint
      if (req.user?.role !== "admin" && req.user?.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const presets = await storage.getCostFactorPresetsByUserId(userId);
      res.json(presets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user's cost factor presets" });
    }
  });
  
  // Get cost factor preset by ID
  app.get("/api/cost-factor-presets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const preset = await storage.getCostFactorPreset(id);
      
      if (!preset) {
        return res.status(404).json({ message: "Cost factor preset not found" });
      }
      
      res.json(preset);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost factor preset" });
    }
  });
  
  // Create cost factor preset
  app.post("/api/cost-factor-presets", requireAuth, async (req: Request, res: Response) => {
    try {
      const presetData = insertCostFactorPresetSchema.parse(req.body);
      
      // Only allow creating presets for themselves unless admin
      if (req.user?.role !== "admin" && req.user?.id !== presetData.userId) {
        return res.status(403).json({ message: "You can only create presets for yourself" });
      }
      
      const createdPreset = await storage.createCostFactorPreset(presetData);
      
      await storage.createActivity({
        action: `Created cost factor preset: ${presetData.name}`,
        icon: "ri-settings-3-line",
        iconColor: "primary"
      });
      
      res.status(201).json(createdPreset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating cost factor preset" });
      }
    }
  });
  
  // Update cost factor preset
  app.patch("/api/cost-factor-presets/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const preset = await storage.getCostFactorPreset(id);
      
      if (!preset) {
        return res.status(404).json({ message: "Cost factor preset not found" });
      }
      
      // Only allow updating own presets unless admin
      if (req.user?.role !== "admin" && req.user?.id !== preset.userId) {
        return res.status(403).json({ message: "You can only update your own presets" });
      }
      
      // Don't allow regular users to update default presets
      if (preset.isDefault && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Default presets can only be updated by administrators" });
      }
      
      const updatedPreset = await storage.updateCostFactorPreset(id, req.body);
      res.json(updatedPreset);
    } catch (error) {
      res.status(500).json({ message: "Error updating cost factor preset" });
    }
  });
  
  // Delete cost factor preset
  app.delete("/api/cost-factor-presets/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const preset = await storage.getCostFactorPreset(id);
      
      if (!preset) {
        return res.status(404).json({ message: "Cost factor preset not found" });
      }
      
      // Only allow deleting own presets unless admin
      if (req.user?.role !== "admin" && req.user?.id !== preset.userId) {
        return res.status(403).json({ message: "You can only delete your own presets" });
      }
      
      // Don't allow regular users to delete default presets
      if (preset.isDefault && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Default presets can only be deleted by administrators" });
      }
      
      await storage.deleteCostFactorPreset(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting cost factor preset" });
    }
  });

  // Cost Matrix API
  
  // Get all cost matrix entries
  app.get("/api/cost-matrix", async (req: Request, res: Response) => {
    try {
      const costMatrix = await storage.getAllCostMatrix();
      res.json(costMatrix);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost matrix entries" });
    }
  });
  
  // Get cost matrix by ID
  // Note: We're checking if the ID is numeric to avoid conflicts with other /api/cost-matrix/* routes
  app.get("/api/cost-matrix/:id([0-9]+)", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const matrix = await storage.getCostMatrix(id);
      
      if (!matrix) {
        return res.status(404).json({ message: "Cost matrix entry not found" });
      }
      
      res.json(matrix);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost matrix entry" });
    }
  });
  
  // Compare cost matrices
  app.get("/api/cost-matrix/compare", async (req: Request, res: Response) => {
    try {
      const { matrix1Id, matrix2Id } = req.query;
      
      if (!matrix1Id || !matrix2Id) {
        return res.status(400).json({ message: "Both matrix1Id and matrix2Id are required" });
      }
      
      // Get the matrices to compare
      const matrix1 = await storage.getCostMatrix(Number(matrix1Id));
      const matrix2 = await storage.getCostMatrix(Number(matrix2Id));
      
      if (!matrix1 || !matrix2) {
        return res.status(404).json({ 
          message: !matrix1 ? "First matrix not found" : "Second matrix not found" 
        });
      }
      
      // Get all building types and regions to compare across
      const allMatrices = await storage.getAllCostMatrix();
      const buildingTypesSet = new Set(allMatrices.map(m => m.buildingType));
      const regionsSet = new Set(allMatrices.map(m => m.region));
      const buildingTypes = Array.from(buildingTypesSet);
      const regions = Array.from(regionsSet);
      
      // Generate comparison data
      const results = [];
      let totalChange = 0;
      let increases = 0;
      let decreases = 0;
      let noChange = 0;
      let maxIncrease = { value: 0, type: '', region: '' };
      let maxDecrease = { value: 0, type: '', region: '' };
      
      // Compare for the same region and building type
      if (matrix1.region === matrix2.region && matrix1.buildingType === matrix2.buildingType) {
        const baseCost1 = Number(matrix1.baseCost);
        const baseCost2 = Number(matrix2.baseCost);
        const difference = baseCost2 - baseCost1;
        const percentageChange = (difference / baseCost1) * 100;
        
        // Update stats
        if (percentageChange > 0) {
          increases++;
          maxIncrease = { 
            value: percentageChange,
            type: matrix1.buildingType,
            region: matrix1.region
          };
        } else if (percentageChange < 0) {
          decreases++;
          maxDecrease = { 
            value: percentageChange,
            type: matrix1.buildingType,
            region: matrix1.region
          };
        } else {
          noChange++;
        }
        
        totalChange += percentageChange;
        
        results.push({
          buildingType: matrix1.buildingType,
          region: matrix1.region,
          year1: matrix1.matrixYear,
          year2: matrix2.matrixYear,
          baseCost1,
          baseCost2,
          difference,
          percentageChange
        });
      } 
      // For different regions or building types, compare each combination
      else {
        for (const type of buildingTypes) {
          for (const region of regions) {
            // Look for matrices with matching building type and region
            const typeRegionMatrix1 = allMatrices.find(m => 
              m.matrixYear === matrix1.matrixYear && 
              m.buildingType === type && 
              m.region === region
            );
            
            const typeRegionMatrix2 = allMatrices.find(m => 
              m.matrixYear === matrix2.matrixYear && 
              m.buildingType === type && 
              m.region === region
            );
            
            // Skip if there's no matching matrix entry
            if (!typeRegionMatrix1 || !typeRegionMatrix2) continue;
            
            const baseCost1 = Number(typeRegionMatrix1.baseCost);
            const baseCost2 = Number(typeRegionMatrix2.baseCost);
            const difference = baseCost2 - baseCost1;
            const percentageChange = (difference / baseCost1) * 100;
            
            // Update stats
            if (percentageChange > 0) {
              increases++;
              if (percentageChange > maxIncrease.value) {
                maxIncrease = { value: percentageChange, type, region };
              }
            } else if (percentageChange < 0) {
              decreases++;
              if (percentageChange < maxDecrease.value) {
                maxDecrease = { value: percentageChange, type, region };
              }
            } else {
              noChange++;
            }
            
            totalChange += percentageChange;
            
            results.push({
              buildingType: type,
              region,
              year1: matrix1.matrixYear,
              year2: matrix2.matrixYear,
              baseCost1,
              baseCost2,
              difference,
              percentageChange
            });
          }
        }
      }
      
      // Calculate average change
      const averageChange = results.length > 0 ? totalChange / results.length : 0;
      
      // Return comparison data
      res.json({
        results,
        summary: {
          increases,
          decreases,
          noChange,
          averageChange,
          maxIncrease,
          maxDecrease,
          matrix1Year: matrix1.matrixYear,
          matrix2Year: matrix2.matrixYear
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: `Error comparing matrices: ${error.message}` });
    }
  });
  
  // Get cost matrix entries by region
  app.get("/api/cost-matrix/region/:region", async (req: Request, res: Response) => {
    try {
      const { region } = req.params;
      const costMatrix = await storage.getCostMatrixByRegion(region);
      res.json(costMatrix);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost matrix entries by region" });
    }
  });
  
  // Get cost matrix entries by building type
  app.get("/api/cost-matrix/building-type/:buildingType", async (req: Request, res: Response) => {
    try {
      const { buildingType } = req.params;
      const costMatrix = await storage.getCostMatrixByBuildingType(buildingType);
      res.json(costMatrix);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost matrix entries by building type" });
    }
  });
  
  // Get cost matrix entry by region and building type
  app.get("/api/cost-matrix/region/:region/building-type/:buildingType", async (req: Request, res: Response) => {
    try {
      const { region, buildingType } = req.params;
      const costMatrix = await storage.getCostMatrixByRegionAndBuildingType(region, buildingType);
      
      if (!costMatrix) {
        return res.status(404).json({ message: "Cost matrix entry not found" });
      }
      
      res.json(costMatrix);
    } catch (error) {
      res.status(500).json({ message: "Error fetching cost matrix entry" });
    }
  });
  
  // Import cost matrix entries from JSON file
  app.post("/api/cost-matrix/import", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to import data
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { data } = req.body;
      
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ message: "Invalid data format. Expected array of cost matrix entries." });
      }
      
      const result = await storage.importCostMatrixFromJson(data);
      
      await storage.createActivity({
        action: `Imported ${result.imported} and updated ${result.updated} cost matrix entries`,
        icon: "ri-database-2-line",
        iconColor: "success"
      });
      
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error importing cost matrix data" });
    }
  });
  
  // Batch import cost matrix entries
  app.post("/api/cost-matrix/batch", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to import data
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { entries, userId } = req.body;
      
      if (!entries || !Array.isArray(entries)) {
        return res.status(400).json({ message: "Invalid data format. Expected array of cost matrix entries." });
      }
      
      let imported = 0;
      const errors: Array<{entry: string, error: string}> = [];
      
      for (const entry of entries) {
        try {
          // Transform the entry to match the schema if needed
          const matrixEntry = {
            region: entry.region || 'Unknown',
            buildingType: entry.buildingType || 'Unknown',
            buildingTypeDescription: entry.buildingTypeDescription || '',
            baseCost: String(parseFloat(entry.baseCost) || 0),
            matrixYear: parseInt(entry.matrixYear) || new Date().getFullYear(),
            sourceMatrixId: parseInt(entry.sourceMatrixId) || 0,
            matrixDescription: entry.matrixDescription || '',
            dataPoints: parseInt(entry.dataPoints) || 0,
            minCost: String(parseFloat(entry.minCost) || 0),
            maxCost: String(parseFloat(entry.maxCost) || 0),
            complexityFactorBase: String(parseFloat(entry.adjustmentFactors?.complexity) || 1.0),
            qualityFactorBase: String(parseFloat(entry.adjustmentFactors?.quality) || 1.0),
            conditionFactorBase: String(parseFloat(entry.adjustmentFactors?.condition) || 1.0),
            county: entry.county || 'Benton',
            state: entry.state || 'WA',
            isActive: true
          };
          
          await storage.createCostMatrixEntry(matrixEntry);
          imported++;
        } catch (error: any) {
          errors.push({
            entry: JSON.stringify(entry).substring(0, 100),
            error: error.message
          });
        }
      }
      
      // Log the activity
      if (imported > 0) {
        await storage.createActivity({
          action: `Batch imported ${imported} cost matrix entries`,
          icon: "ri-database-2-line",
          iconColor: "success",
          details: { userId: userId || req.user?.id }
        });
      }
      
      res.status(200).json({
        success: true,
        imported,
        errors,
        total: entries.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error importing cost matrix data" });
    }
  });
  
  // Update cost matrix entry
  app.patch("/api/cost-matrix/:id([0-9]+)", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to update entries
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedEntry = await storage.updateCostMatrix(id, updateData);
      
      if (!updatedEntry) {
        return res.status(404).json({ message: "Cost matrix entry not found" });
      }
      
      res.json(updatedEntry);
    } catch (error) {
      res.status(500).json({ message: "Error updating cost matrix entry" });
    }
  });
  
  // Delete cost matrix entry
  app.delete("/api/cost-matrix/:id([0-9]+)", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to delete entries
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const id = parseInt(req.params.id);
      await storage.deleteCostMatrix(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting cost matrix entry" });
    }
  });
  
  // File Upload API
  
  // Upload a file
  app.post("/api/file-uploads/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      console.log(`Processing file upload: ${req.file.originalname}, size: ${req.file.size}, type: ${req.file.mimetype}`);
      
      // Create directories if they don't exist
      const fs = require('fs');
      const path = require('path');
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Create file upload record
      const fileUpload = await storage.createFileUpload({
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user?.id || 1, // Use admin user (ID 1) if no user is logged in
        status: 'uploaded'
      });
      
      // Save file to disk (using the buffer directly since we're using memory storage)
      const filePath = path.join(uploadsDir, `${fileUpload.id}-${req.file.originalname}`);
      fs.writeFileSync(filePath, req.file.buffer);
      
      console.log(`File saved to: ${filePath}`);
      
      await storage.createActivity({
        action: `Uploaded file: ${req.file.originalname}`,
        icon: "ri-file-upload-line",
        iconColor: "primary",
        details: null
      });
      
      res.status(201).json({ 
        fileId: fileUpload.id,
        fileName: fileUpload.fileName,
        message: "File uploaded successfully" 
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Error uploading file", error: error.toString() });
    }
  });
  
  // Get all file uploads
  app.get("/api/file-uploads", async (req: Request, res: Response) => {
    try {
      let fileUploads;
      
      console.log("Fetching file uploads for user:", req.user?.id);
      
      // For development, get all files
      fileUploads = await storage.getAllFileUploads();
      console.log("Fetching all file uploads");
      
      console.log("File uploads retrieved successfully:", fileUploads?.length || 0);
      res.json(fileUploads || []);
    } catch (error) {
      console.error("Error fetching file uploads:", error);
      res.status(500).json({ message: "Error fetching file uploads" });
    }
  });
  
  // Get file upload by ID
  app.get("/api/file-uploads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const fileUpload = await storage.getFileUpload(id);
      
      if (!fileUpload) {
        return res.status(404).json({ message: "File upload not found" });
      }
      
      // Allow access only to admin or the user who uploaded
      if (req.user?.role !== "admin" && fileUpload.uploadedBy !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(fileUpload);
    } catch (error) {
      res.status(500).json({ message: "Error fetching file upload" });
    }
  });
  
  // Create file upload record
  app.post("/api/file-uploads", requireAuth, async (req: Request, res: Response) => {
    try {
      const fileUploadData = insertFileUploadSchema.parse({
        ...req.body,
        uploadedBy: req.user!.id
      });
      
      const fileUpload = await storage.createFileUpload(fileUploadData);
      
      await storage.createActivity({
        action: `Uploaded file: ${fileUpload.fileName}`,
        icon: "ri-file-upload-line",
        iconColor: "primary"
      });
      
      res.status(201).json(fileUpload);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Error creating file upload record" });
      }
    }
  });
  
  // Update file upload status
  app.patch("/api/file-uploads/:id/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status, processedItems, totalItems, errors } = req.body;
      
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const fileUpload = await storage.getFileUpload(id);
      if (!fileUpload) {
        return res.status(404).json({ message: "File upload not found" });
      }
      
      // Only allow the uploader or admin to update status
      if (req.user?.role !== "admin" && fileUpload.uploadedBy !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedFileUpload = await storage.updateFileUploadStatus(
        id, 
        status, 
        processedItems, 
        totalItems, 
        errors
      );
      
      res.json(updatedFileUpload);
    } catch (error) {
      res.status(500).json({ message: "Error updating file upload status" });
    }
  });
  
  // Delete file upload
  app.delete("/api/file-uploads/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const fileUpload = await storage.getFileUpload(id);
      if (!fileUpload) {
        return res.status(404).json({ message: "File upload not found" });
      }
      
      // Only allow the uploader or admin to delete
      if (req.user?.role !== "admin" && fileUpload.uploadedBy !== req.user?.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteFileUpload(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting file upload" });
    }
  });
  
  // Import cost matrix from Excel file
  app.post("/api/cost-matrix/import-excel/:fileId", async (req: Request, res: Response) => {
    try {
      const fileId = parseInt(req.params.fileId);
      // For development, we use admin user (ID 1)
      const userId = 1; 
      
      console.log(`Importing cost matrix from Excel file ID: ${fileId}`);
      
      const fileUpload = await storage.getFileUpload(fileId);
      if (!fileUpload) {
        return res.status(404).json({ message: "File upload not found" });
      }
      
      console.log(`Found file upload: ${fileUpload.fileName}, type: ${fileUpload.fileType}`);
      
      // Check if file exists on disk
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'uploads', `${fileUpload.id}-${fileUpload.fileName}`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }
      
      console.log(`File exists at: ${filePath}`);
      
      // Accept both Excel and CSV files
      if (!fileUpload.fileType.includes('spreadsheet') && 
          !fileUpload.fileType.includes('excel') && 
          !fileUpload.fileType.includes('csv') &&
          !fileUpload.fileName.endsWith('.csv')) {
        return res.status(400).json({ 
          message: "Invalid file type. Excel or CSV file required.",
          fileType: fileUpload.fileType
        });
      }
      
      const result = await storage.importCostMatrixFromExcel(fileId, userId);
      
      console.log(`Import completed: ${JSON.stringify(result)}`);
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error(`Import error: ${error.message}`, error);
      res.status(500).json({ message: error?.message || "Error importing cost matrix from Excel" });
    }
  });

  // Calculate building cost
  // Calculate building cost - Commented out as this has been moved to costCalculationRoutes.ts
  /*
  app.post("/api/building-cost/calculate", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate input data
      const { 
        region, 
        buildingType, 
        squareFootage, 
        complexityFactor = 1.0, 
        conditionFactor = 1.0, 
        yearBuilt = new Date().getFullYear(),
        quality = "STANDARD",
        condition,
        stories,
        qualityGrade,
        occupancyType
      } = req.body;
      
      if (!region || !buildingType || !squareFootage || squareFootage <= 0) {
        return res.status(400).json({ 
          message: "Invalid input. Region, building type, and square footage are required." 
        });
      }
      
      if (complexityFactor < 0.5 || complexityFactor > 3.0) {
        return res.status(400).json({ 
          message: "Complexity factor must be between 0.5 and 3.0" 
        });
      }
      
      if (conditionFactor < 0.6 || conditionFactor > 1.1) {
        return res.status(400).json({ 
          message: "Condition factor must be between 0.6 and 1.1" 
        });
      }
      
      // Calculate building cost (using the properties that match the BuildingCostOptions interface)
      const calculationResult = await calculateBuildingCost({
        region,
        buildingType,
        squareFootage: Number(squareFootage),
        complexityFactor: Number(complexityFactor),
        conditionFactor: Number(conditionFactor),
        yearBuilt: Number(yearBuilt),
        quality
      });
      
      // Calculate material costs
      const materialCosts = calculateMaterialCosts(calculationResult.totalCost, buildingType);
      
      // Create response object with all needed fields
      const response = {
        region,
        buildingType,
        squareFootage: Number(squareFootage),
        baseCost: calculationResult.baseCost,
        adjustedCost: calculationResult.adjustedCost,
        totalCost: calculationResult.totalCost,
        depreciationAdjustment: calculationResult.depreciationAdjustment,
        complexityFactor: Number(complexityFactor),
        conditionFactor: Number(conditionFactor),
        materialCosts
      };
      
      // Add calculation to history if user is logged in
      if (req.user) {
        // Calculate cost per square foot (total cost / square footage)
        const costPerSqft = calculationResult.totalCost / Number(squareFootage);
        
        await storage.createCalculationHistory({
          userId: req.user.id,
          region,
          buildingType,
          squareFootage: Number(squareFootage),
          baseCost: calculationResult.baseCost.toString(),
          totalCost: calculationResult.totalCost.toString(),
          complexityFactor: complexityFactor.toString(),
          conditionFactor: conditionFactor.toString(),
          complexity: quality || "STANDARD", // Ensure the required field is present
          adjustedCost: calculationResult.adjustedCost.toString(),
          costPerSqft: costPerSqft.toString(), // Add the required field
          regionFactor: "1.0" // Add default value for the required field
        });
      }
      
      res.status(200).json(response);
    } catch (error: any) {
      console.error("Building cost calculation error:", error);
      res.status(500).json({ 
        message: error.message || "Error calculating building cost" 
      });
    }
  });
  */
  
  // Save calculation to history
  app.post("/api/calculation-history", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      
      // Make a copy of the request body but ensure we don't include propertyClass
      const { propertyClass, ...calculationData } = req.body;
      
      const calculation = {
        ...calculationData,
        userId,
        calculatedAt: new Date()
      };
      
      const result = await storage.createCalculationHistory(calculation);
      res.status(201).json(result);
    } catch (error: any) {
      console.error("Error saving calculation history:", error);
      res.status(500).json({ 
        message: error.message || "Error saving calculation to history" 
      });
    }
  });
  
  // Get calculation history for user
  app.get("/api/calculation-history", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      const history = await storage.getCalculationHistoryByUserId(userId);
      res.status(200).json(history);
    } catch (error: any) {
      console.error("Error fetching calculation history:", error);
      res.status(500).json({ 
        message: error.message || "Error fetching calculation history" 
      });
    }
  });
  
  // Get calculation history by building type
  app.get("/api/calculation-history/building-type/:buildingType", requireAuth, async (req: Request, res: Response) => {
    try {
      const { buildingType } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      const history = await storage.getCalculationHistoryByUserId(userId);
      const filteredHistory = history.filter(calc => calc.buildingType === buildingType);
      
      res.status(200).json(filteredHistory);
    } catch (error: any) {
      console.error("Error fetching calculation history by building type:", error);
      res.status(500).json({ 
        message: error.message || "Error fetching calculation history" 
      });
    }
  });
  
  // Get calculation history by region
  app.get("/api/calculation-history/region/:region", requireAuth, async (req: Request, res: Response) => {
    try {
      const { region } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      const history = await storage.getCalculationHistoryByUserId(userId);
      const filteredHistory = history.filter(calc => calc.region === region);
      
      res.status(200).json(filteredHistory);
    } catch (error: any) {
      console.error("Error fetching calculation history by region:", error);
      res.status(500).json({ 
        message: error.message || "Error fetching calculation history" 
      });
    }
  });

  // Setup AI routes
  try {
    app.use('/api/ai', aiRoutes);
    
    // Setup Advanced Prediction routes
    app.use('/api/ai', advancedPredictionRoutes);
    
    // Setup Benchmarking routes
    registerBenchmarkingRoutes(app);
    
    // Register advanced analytics routes
    app.use('/api/benchmarking', advancedAnalyticsRouter);
    
    // Register collaboration routes
    registerCollaborationRoutes(app);
    registerCommentRoutes(app);
    registerSharedLinksRoutes(app, storage);
    registerProjectActivitiesRoutes(app, storage);
    
    // IMPORTANT: Register the cost matrix import router BEFORE the other routes
    // to ensure specific routes are handled correctly
    app.use('/', createCostMatrixImportRouter(storage));
    
    // Register export and data connector routes
    app.use('/api/export', exportRoutes);
    app.use('/api/data-connections', dataConnectorRoutes);
    app.use('/api/data-connections', connectionHistoryRoutes);
    app.use('/api/data-connectors/ftp-sync', initFTPSyncRoutes(storage));
    app.use('/api/ftp', ftpRoutes);
    app.use('/api/ftp-connections', ftpConnectionRoutes);
    app.use('/api/scheduler', initSchedulerRoutes(storage));
    app.use('/api', costCalculationRoutes);
    
    // Log the new data connector APIs
    await storage.createActivity({
      action: "Enhanced data connector APIs added (FTP, ArcGIS, SQL Server, FTP Sync)",
      icon: "plug",
      iconColor: "success"
    });
    
    // Log the cost matrix import API
    await storage.createActivity({
      action: "Cost Matrix Import API with data quality validation added",
      icon: "ri-database-2-line",
      iconColor: "primary"
    });
    
    console.log('MCP framework initialized successfully');
    
    // Log activity
    await storage.createActivity({
      action: `Initialized Model Content Protocol (MCP) framework`,
      icon: "ri-ai-generate",
      iconColor: "secondary"
    });
  } catch (error: any) {
    console.error('Failed to initialize MCP framework:', error);
    // Log error but don't block server startup
    await storage.createActivity({
      action: `Error initializing MCP framework: ${error.message || 'Unknown error'}`,
      icon: "ri-error-warning-line",
      iconColor: "error"
    });
  }

  // What-If Scenarios API
  
  // Get all what-if scenarios
  app.get("/api/what-if-scenarios", requireAuth, async (req: Request, res: Response) => {
    try {
      const scenarios = await storage.getAllWhatIfScenarios();
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching what-if scenarios:", error);
      res.status(500).json({ message: "Error fetching what-if scenarios" });
    }
  });
  
  // Get what-if scenarios by user ID
  app.get("/api/what-if-scenarios/user/:userId", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Users can only access their own scenarios unless they're admins
      if (req.user?.id !== userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const scenarios = await storage.getWhatIfScenariosByUserId(userId);
      res.json(scenarios);
    } catch (error) {
      console.error("Error fetching user's what-if scenarios:", error);
      res.status(500).json({ message: "Error fetching user's what-if scenarios" });
    }
  });
  
  // Get a specific what-if scenario
  app.get("/api/what-if-scenarios/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getWhatIfScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only access their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching what-if scenario:", error);
      res.status(500).json({ message: "Error fetching what-if scenario" });
    }
  });
  
  // Create a new what-if scenario
  app.post("/api/what-if-scenarios", requireAuth, async (req: Request, res: Response) => {
    try {
      // Ensure the user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const scenarioData = insertWhatIfScenarioSchema.parse(req.body);
      
      // Set the user ID from the authenticated user
      scenarioData.userId = req.user.id;
      
      const scenario = await storage.createWhatIfScenario(scenarioData);
      
      // Log the activity
      await storage.createActivity({
        action: `Created new What-If scenario: ${scenario.name}`,
        icon: "ri-line-chart-line",
        iconColor: "primary"
      });
      
      res.status(201).json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating what-if scenario:", error);
      res.status(500).json({ message: "Error creating what-if scenario" });
    }
  });
  
  // Update a what-if scenario
  app.patch("/api/what-if-scenarios/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getWhatIfScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only modify their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedScenario = await storage.updateWhatIfScenario(id, req.body);
      res.json(updatedScenario);
    } catch (error) {
      console.error("Error updating what-if scenario:", error);
      res.status(500).json({ message: "Error updating what-if scenario" });
    }
  });
  
  // Save a what-if scenario (mark as saved)
  app.post("/api/what-if-scenarios/:id/save", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getWhatIfScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only modify their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const savedScenario = await storage.saveWhatIfScenario(id);
      
      // Log the activity
      await storage.createActivity({
        action: `Saved What-If scenario: ${savedScenario?.name}`,
        icon: "ri-save-line",
        iconColor: "success"
      });
      
      res.json(savedScenario);
    } catch (error) {
      console.error("Error saving what-if scenario:", error);
      res.status(500).json({ message: "Error saving what-if scenario" });
    }
  });
  
  // Delete a what-if scenario
  app.delete("/api/what-if-scenarios/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const scenario = await storage.getWhatIfScenario(id);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only delete their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteWhatIfScenario(id);
      
      // Log the activity
      await storage.createActivity({
        action: `Deleted What-If scenario: ${scenario.name}`,
        icon: "ri-delete-bin-line",
        iconColor: "danger"
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting what-if scenario:", error);
      res.status(500).json({ message: "Error deleting what-if scenario" });
    }
  });
  
  // Scenario Variations API
  
  // Get variations for a scenario
  app.get("/api/what-if-scenarios/:scenarioId/variations", requireAuth, async (req: Request, res: Response) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const scenario = await storage.getWhatIfScenario(scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only access their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const variations = await storage.getScenarioVariations(scenarioId);
      res.json(variations);
    } catch (error) {
      console.error("Error fetching scenario variations:", error);
      res.status(500).json({ message: "Error fetching scenario variations" });
    }
  });
  
  // Add a variation to a scenario
  app.post("/api/what-if-scenarios/:scenarioId/variations", requireAuth, async (req: Request, res: Response) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const scenario = await storage.getWhatIfScenario(scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only modify their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const variationData = insertScenarioVariationSchema.parse(req.body);
      
      // Override the scenarioId from the URL parameter
      variationData.scenarioId = scenarioId;
      
      const variation = await storage.createScenarioVariation(variationData);
      
      // Update the scenario to mark it as updated
      await storage.updateWhatIfScenario(scenarioId, { updatedAt: new Date() });
      
      res.status(201).json(variation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      console.error("Error creating scenario variation:", error);
      res.status(500).json({ message: "Error creating scenario variation" });
    }
  });
  
  // Delete a variation
  app.delete("/api/what-if-scenarios/variations/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the variation to check ownership
      const variations = Array.from((await storage.getAllWhatIfScenarios()).flatMap(scenario => 
        storage.getScenarioVariations(scenario.id)
      ));
      
      const variation = variations.find(v => v.id === id);
      
      if (!variation) {
        return res.status(404).json({ message: "Variation not found" });
      }
      
      // Check if the user owns the scenario
      const scenario = await storage.getWhatIfScenario(variation.scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ message: "Associated scenario not found" });
      }
      
      // Users can only modify their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteScenarioVariation(id);
      
      // Update the scenario to mark it as updated
      await storage.updateWhatIfScenario(scenario.id, { updatedAt: new Date() });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting scenario variation:", error);
      res.status(500).json({ message: "Error deleting scenario variation" });
    }
  });
  
  // Calculate scenario impact
  app.get("/api/what-if-scenarios/:scenarioId/impact", requireAuth, async (req: Request, res: Response) => {
    try {
      const scenarioId = parseInt(req.params.scenarioId);
      const scenario = await storage.getWhatIfScenario(scenarioId);
      
      if (!scenario) {
        return res.status(404).json({ message: "What-if scenario not found" });
      }
      
      // Users can only access their own scenarios unless they're admins
      if (req.user?.id !== scenario.userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const impact = await storage.calculateScenarioImpact(scenarioId);
      res.json(impact);
    } catch (error) {
      console.error("Error calculating scenario impact:", error);
      res.status(500).json({ message: "Error calculating scenario impact" });
    }
  });

  // Analytics & Reporting API Routes
  
  // Time series analysis for cost trends
  app.get("/api/analytics/time-series", requireAuth, async (req: Request, res: Response) => {
    try {
      await getTimeSeriesData(req, res);
    } catch (error) {
      console.error("Error processing time series data:", error);
      res.status(500).json({ error: "Error processing time series data" });
    }
  });
  
  // Regional cost comparison
  app.get("/api/analytics/regional-comparison", requireAuth, async (req: Request, res: Response) => {
    try {
      await getRegionalComparison(req, res);
    } catch (error) {
      console.error("Error processing regional comparison:", error);
      res.status(500).json({ error: "Error processing regional comparison" });
    }
  });
  
  // Building type comparison
  app.get("/api/analytics/building-type-comparison", requireAuth, async (req: Request, res: Response) => {
    try {
      await getBuildingTypeComparison(req, res);
    } catch (error) {
      console.error("Error processing building type comparison:", error);
      res.status(500).json({ error: "Error processing building type comparison" });
    }
  });
  
  // Cost breakdown analysis
  app.get("/api/analytics/cost-breakdown/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await getCostBreakdown(req, res);
    } catch (error) {
      console.error("Error processing cost breakdown:", error);
      res.status(500).json({ error: "Error processing cost breakdown" });
    }
  });
  
  // Benchmarking endpoints
  app.get("/api/analytics/benchmark", requireAuth, async (req: Request, res: Response) => {
    try {
      await getBenchmarkData(req, res);
    } catch (error) {
      console.error("Error processing benchmarking data:", error);
      res.status(500).json({ error: "Error processing benchmarking data" });
    }
  });
  
  app.get("/api/analytics/benchmark/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await getBenchmarkData(req, res);
    } catch (error) {
      console.error("Error processing benchmarking data:", error);
      res.status(500).json({ error: "Error processing benchmarking data" });
    }
  });
  
  // Report export
  app.get("/api/reports/export/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      await exportReport(req, res);
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ error: "Error exporting report" });
    }
  });

  // Property Data Import API
  
  // Import property data
  app.post("/api/properties/import", upload.fields([
    { name: 'propertiesFile', maxCount: 1 },
    { name: 'improvementsFile', maxCount: 1 },
    { name: 'improvementDetailsFile', maxCount: 1 },
    { name: 'improvementItemsFile', maxCount: 1 },
    { name: 'landDetailsFile', maxCount: 1 }
  ]), async (req: Request, res: Response) => {
    try {
      if (!req.files) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      console.log("Property data import started with files:", 
        Object.keys(req.files).map(key => `${key}: ${(req.files as any)[key]?.length || 0} files`).join(", "));
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Create uploads for each file
      const fileUploads: {[key: string]: number} = {};
      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (fileArray.length > 0) {
          const file = fileArray[0];
          
          // Create file upload record
          const fileUpload = await storage.createFileUpload({
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedBy: req.user?.id || 1, // Use admin user (ID 1) if no user is logged in
            status: 'uploaded'
          });
          
          fileUploads[fieldName] = fileUpload.id;
          console.log(`Created file upload record for ${fieldName}: ID ${fileUpload.id}`);
        }
      }
      
      // Get file buffers directly from the uploaded files
      const options: {
        propertiesFile?: Buffer;
        improvementsFile: Buffer;
        improvementDetailsFile: Buffer;
        improvementItemsFile: Buffer;
        landDetailsFile: Buffer;
        userId: number;
        batchSize?: number;
      } = {
        userId: req.user?.id || 1, // Default to admin user if authentication is disabled
        batchSize: req.body.batchSize ? parseInt(req.body.batchSize) : 100
      };
      
      // Assign buffers from uploaded files
      if (files['propertiesFile']?.[0]) {
        options.propertiesFile = files['propertiesFile'][0].buffer;
      }
      
      if (files['improvementsFile']?.[0]) {
        options.improvementsFile = files['improvementsFile'][0].buffer;
      }
      
      if (files['improvementDetailsFile']?.[0]) {
        options.improvementDetailsFile = files['improvementDetailsFile'][0].buffer;
      }
      
      if (files['improvementItemsFile']?.[0]) {
        options.improvementItemsFile = files['improvementItemsFile'][0].buffer;
      }
      
      if (files['landDetailsFile']?.[0]) {
        options.landDetailsFile = files['landDetailsFile'][0].buffer;
      }
      
      // Validate required files
      if (!options.improvementsFile || !options.improvementDetailsFile || 
          !options.improvementItemsFile || !options.landDetailsFile) {
        return res.status(400).json({ 
          message: "Missing required files. Please upload all required property data files." 
        });
      }
      
      console.log("Processing property data import with file buffers");
      
      // Process import with buffers directly (no temporary files)
      const importResult = await importPropertyData(storage, options);
      
      console.log("Import result:", importResult);
      
      // Update file upload records with processed status
      for (const [fieldName, fileId] of Object.entries(fileUploads)) {
        await storage.updateFileUploadStatus(
          fileId, 
          'processed', 
          1, // Processed items 
          1, // Total items
          [] // No errors
        );
      }
      
      // Log activity
      await storage.createActivity({
        action: `Imported property data: ${importResult.properties?.success || 0} properties, ${importResult.improvements?.success || 0} improvements`,
        icon: "ri-file-list-line",
        iconColor: "success"
      });
      
      // Return import result with file upload IDs
      res.json({
        ...importResult,
        fileUploads
      });
    } catch (error: any) {
      console.error("Property data import error:", error);
      res.status(500).json({ message: `Error importing property data: ${error.message}` });
    }
  });
  
  // Get all properties
  app.get("/api/properties", async (req: Request, res: Response) => {
    try {
      const properties = await storage.getAllProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ message: "Error fetching properties" });
    }
  });
  
  // Get property by ID
  app.get("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Error fetching property" });
    }
  });
  
  // Get property with related data
  app.get("/api/properties/:id/details", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const property = await storage.getProperty(id);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      // Get related improvements
      const improvements = await storage.getImprovementsByPropertyId(id);
      
      // Get improvement details and items for each improvement
      const improvementDetails = [];
      for (const improvement of improvements) {
        const details = await storage.getImprovementDetailsByImprovementId(improvement.id);
        const items = await storage.getImprovementItemsByImprovementId(improvement.id);
        improvementDetails.push({
          ...improvement,
          details,
          items
        });
      }
      
      // Get land details for property
      const landDetails = await storage.getLandDetailsByPropertyId(id);
      
      // Combine and return all data
      res.json({
        property,
        improvements: improvementDetails,
        landDetails
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching property details" });
    }
  });
  
  // Get property by propId
  app.get("/api/properties/by-prop-id/:propId", async (req: Request, res: Response) => {
    try {
      const propId = parseInt(req.params.propId);
      const property = await storage.getPropertyByPropId(propId);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error) {
      res.status(500).json({ message: "Error fetching property by propId" });
    }
  });
  
  // Create property
  app.post("/api/properties", async (req: Request, res: Response) => {
    try {
      const propertyData = req.body;
      const property = await storage.createProperty(propertyData);
      res.status(201).json(property);
    } catch (error: any) {
      res.status(400).json({ message: `Error creating property: ${error.message}` });
    }
  });
  
  // Update property
  app.put("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const propertyData = req.body;
      const property = await storage.updateProperty(id, propertyData);
      
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ message: `Error updating property: ${error.message}` });
    }
  });
  
  // Delete property
  app.delete("/api/properties/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProperty(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: `Error deleting property: ${error.message}` });
    }
  });
  
  // Get improvements by property ID
  app.get("/api/properties/:id/improvements", async (req: Request, res: Response) => {
    try {
      const propId = parseInt(req.params.id);
      const improvements = await storage.getImprovementsByPropertyId(propId);
      res.json(improvements);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching improvements: ${error.message}` });
    }
  });
  
  // IMPROVEMENT ENDPOINTS
  
  // Get improvement by ID
  app.get("/api/improvements/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const improvement = await storage.getImprovement(id);
      
      if (!improvement) {
        return res.status(404).json({ message: "Improvement not found" });
      }
      
      res.json(improvement);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching improvement: ${error.message}` });
    }
  });
  
  // Create improvement
  app.post("/api/improvements", async (req: Request, res: Response) => {
    try {
      const improvementData = req.body;
      const improvement = await storage.createImprovement(improvementData);
      res.status(201).json(improvement);
    } catch (error: any) {
      res.status(400).json({ message: `Error creating improvement: ${error.message}` });
    }
  });
  
  // Update improvement
  app.put("/api/improvements/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const improvementData = req.body;
      const improvement = await storage.updateImprovement(id, improvementData);
      
      if (!improvement) {
        return res.status(404).json({ message: "Improvement not found" });
      }
      
      res.json(improvement);
    } catch (error: any) {
      res.status(400).json({ message: `Error updating improvement: ${error.message}` });
    }
  });
  
  // Delete improvement
  app.delete("/api/improvements/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteImprovement(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: `Error deleting improvement: ${error.message}` });
    }
  });
  
  // IMPROVEMENT DETAIL ENDPOINTS
  
  // Get improvement detail by ID
  app.get("/api/improvement-details/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detail = await storage.getImprovementDetail(id);
      
      if (!detail) {
        return res.status(404).json({ message: "Improvement detail not found" });
      }
      
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching improvement detail: ${error.message}` });
    }
  });
  
  // Get improvement details by improvement ID
  app.get("/api/improvements/:id/details", async (req: Request, res: Response) => {
    try {
      const imprvId = parseInt(req.params.id);
      const details = await storage.getImprovementDetailsByImprovementId(imprvId);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching improvement details: ${error.message}` });
    }
  });
  
  // Create improvement detail
  app.post("/api/improvement-details", async (req: Request, res: Response) => {
    try {
      const detailData = req.body;
      const detail = await storage.createImprovementDetail(detailData);
      res.status(201).json(detail);
    } catch (error: any) {
      res.status(400).json({ message: `Error creating improvement detail: ${error.message}` });
    }
  });
  
  // Update improvement detail
  app.put("/api/improvement-details/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detailData = req.body;
      const detail = await storage.updateImprovementDetail(id, detailData);
      
      if (!detail) {
        return res.status(404).json({ message: "Improvement detail not found" });
      }
      
      res.json(detail);
    } catch (error: any) {
      res.status(400).json({ message: `Error updating improvement detail: ${error.message}` });
    }
  });
  
  // Delete improvement detail
  app.delete("/api/improvement-details/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteImprovementDetail(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: `Error deleting improvement detail: ${error.message}` });
    }
  });
  
  // IMPROVEMENT ITEM ENDPOINTS
  
  // Get improvement item by ID
  app.get("/api/improvement-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getImprovementItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Improvement item not found" });
      }
      
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching improvement item: ${error.message}` });
    }
  });
  
  // Get improvement items by improvement ID
  app.get("/api/improvements/:id/items", async (req: Request, res: Response) => {
    try {
      const imprvId = parseInt(req.params.id);
      const items = await storage.getImprovementItemsByImprovementId(imprvId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching improvement items: ${error.message}` });
    }
  });
  
  // Create improvement item
  app.post("/api/improvement-items", async (req: Request, res: Response) => {
    try {
      const itemData = req.body;
      const item = await storage.createImprovementItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: `Error creating improvement item: ${error.message}` });
    }
  });
  
  // Update improvement item
  app.put("/api/improvement-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const itemData = req.body;
      const item = await storage.updateImprovementItem(id, itemData);
      
      if (!item) {
        return res.status(404).json({ message: "Improvement item not found" });
      }
      
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: `Error updating improvement item: ${error.message}` });
    }
  });
  
  // Delete improvement item
  app.delete("/api/improvement-items/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteImprovementItem(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: `Error deleting improvement item: ${error.message}` });
    }
  });
  
  // LAND DETAIL ENDPOINTS
  
  // Get land detail by ID
  app.get("/api/land-details/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detail = await storage.getLandDetail(id);
      
      if (!detail) {
        return res.status(404).json({ message: "Land detail not found" });
      }
      
      res.json(detail);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching land detail: ${error.message}` });
    }
  });
  
  // Get land details by property ID
  app.get("/api/properties/:id/land-details", async (req: Request, res: Response) => {
    try {
      const propId = parseInt(req.params.id);
      const details = await storage.getLandDetailsByPropertyId(propId);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: `Error fetching land details: ${error.message}` });
    }
  });
  
  // Create land detail
  app.post("/api/land-details", async (req: Request, res: Response) => {
    try {
      const detailData = req.body;
      const detail = await storage.createLandDetail(detailData);
      res.status(201).json(detail);
    } catch (error: any) {
      res.status(400).json({ message: `Error creating land detail: ${error.message}` });
    }
  });
  
  // Update land detail
  app.put("/api/land-details/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detailData = req.body;
      const detail = await storage.updateLandDetail(id, detailData);
      
      if (!detail) {
        return res.status(404).json({ message: "Land detail not found" });
      }
      
      res.json(detail);
    } catch (error: any) {
      res.status(400).json({ message: `Error updating land detail: ${error.message}` });
    }
  });
  
  // Delete land detail
  app.delete("/api/land-details/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteLandDetail(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: `Error deleting land detail: ${error.message}` });
    }
  });

  // Log the new endpoints
  await storage.createActivity({
    action: "Enhanced analytics and reporting APIs added",
    icon: "ri-bar-chart-2-line",
    iconColor: "success"
  });

  // Register Supabase integration routes
  app.use('/api/supabase', supabaseRoutes);
  
  // Register Supabase test routes for development and debugging
  app.use('/api/supabase-test', supabaseTestRouter);
  
  // Register Supabase proxy routes to bypass CORS issues
  app.use('/api/supabase-proxy', supabaseProxyRouter);
  
  // Log Supabase integration
  await storage.createActivity({
    action: "Supabase integration added",
    icon: "ri-database-2-line",
    iconColor: "primary"
  });

  const httpServer = createServer(app);
  return httpServer;
}
