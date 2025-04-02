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
  insertFileUploadSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { validateExcelFile, validateBatchExcelFiles } from "./validators/excelValidator";
import { processBatchImport } from "./import/batchImporter";
import { initializeMCP } from "./mcp";
import { setupMCPRoutes } from "./mcp/routes";
import aiRoutes from "./routes/aiRoutes";
import { registerBenchmarkingRoutes } from "./routes/benchmarkingRoutes";
import advancedAnalyticsRouter from "./routes/advancedAnalyticsRoutes";
import advancedPredictionRoutes from "./routes/advancedPredictionRoutes";
import multer from "multer";
import path from "path";
import fs from "fs";

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
  app.post("/api/costs/calculate-materials", async (req: Request, res: Response) => {
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
        if (req.isAuthenticated() && req.user?.id) {
          const userId = req.user.id;
          await storage.createCalculationHistory({
            userId,
            name: `${buildingType} Building in ${region}`,
            region,
            buildingType,
            squareFootage: Number(squareFootage),
            costPerSqft: materialsBreakdown.costPerSqft.toString(),
            totalCost: materialsBreakdown.totalCost.toString(),

            baseCost: materialsBreakdown.baseCost.toString(),
            regionFactor: materialsBreakdown.regionFactor.toString(),
            complexityFactor: materialsBreakdown.complexityFactor.toString(),
            materialsBreakdown: materialsBreakdown
          });
        }
        
        res.json(materialsBreakdown);
      } catch (error: any) {
        res.status(404).json({ message: error.message || "Error calculating materials breakdown" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing request" });
    }
  });
  
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
    dest: 'uploads/',
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB file size limit
    },
    fileFilter: (req, file, cb) => {
      // Accept only Excel files
      if (
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ) {
        cb(null, true);
      } else {
        cb(null, false);
        cb(new Error('Only Excel files are allowed'));
      }
    }
  });
  
  // Validate Excel file
  app.post("/api/matrix/validate", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const filePath = req.file.path;
      
      // Validate Excel file
      const validationResult = await validateExcelFile(filePath, {
        strictMode: req.body.strictMode === 'true',
        checkDataTypes: true
      });
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      
      // Return validation result
      res.json(validationResult);
    } catch (error: any) {
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
      
      const filePaths = files.map(file => file.path);
      
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
  app.get("/api/cost-matrix/:id", async (req: Request, res: Response) => {
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
        action: `Imported ${result.imported} cost matrix entries`,
        icon: "ri-database-2-line",
        iconColor: "success"
      });
      
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error importing cost matrix data" });
    }
  });
  
  // Update cost matrix entry
  app.patch("/api/cost-matrix/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.delete("/api/cost-matrix/:id", requireAuth, async (req: Request, res: Response) => {
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
  app.post("/api/file-uploads/upload", requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      // File is available at req.file
      const fileId = Date.now(); // Generate a unique ID for the file
      
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
        uploadedBy: req.user!.id,
        status: 'uploaded'
      });
      
      await storage.createActivity({
        action: `Uploaded file: ${req.file.originalname}`,
        icon: "ri-file-upload-line",
        iconColor: "primary"
      });
      
      res.status(201).json({ 
        fileId: fileUpload.id,
        fileName: fileUpload.fileName,
        message: "File uploaded successfully" 
      });
    } catch (error) {
      res.status(500).json({ message: "Error uploading file" });
    }
  });
  
  // Get all file uploads
  app.get("/api/file-uploads", requireAuth, async (req: Request, res: Response) => {
    try {
      let fileUploads;
      
      // If admin, get all files. Otherwise, only user's own files
      if (req.user?.role === "admin") {
        fileUploads = await storage.getAllFileUploads();
      } else {
        fileUploads = await storage.getUserFileUploads(req.user!.id);
      }
      
      res.json(fileUploads);
    } catch (error) {
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
  app.post("/api/cost-matrix/import-excel/:fileId", requireAuth, async (req: Request, res: Response) => {
    try {
      // Only allow admin users to import data
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const fileId = parseInt(req.params.fileId);
      const userId = req.user!.id;
      
      const fileUpload = await storage.getFileUpload(fileId);
      if (!fileUpload) {
        return res.status(404).json({ message: "File upload not found" });
      }
      
      // Verify file type
      if (!fileUpload.fileType.includes('spreadsheet') && !fileUpload.fileType.includes('excel')) {
        return res.status(400).json({ message: "Invalid file type. Excel file required." });
      }
      
      const result = await storage.importCostMatrixFromExcel(fileId, userId);
      
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Error importing cost matrix from Excel" });
    }
  });

  // Calculate building cost
  app.post("/api/building-cost/calculate", requireAuth, async (req: Request, res: Response) => {
    try {
      // Validate input data
      const { 
        region, 
        buildingType, 
        squareFootage, 
        complexityFactor, 
        conditionFactor, 
        yearBuilt,
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
      
      // Import the calculationEngine 
      const { calculateBuildingCost, calculateMaterialCosts } = require('./calculationEngine');
      
      // Calculate building cost
      const calculationResult = await calculateBuildingCost({
        region,
        buildingType,
        squareFootage: Number(squareFootage),
        complexityFactor: Number(complexityFactor),
        conditionFactor: Number(conditionFactor),
        yearBuilt: Number(yearBuilt),
        condition,
        stories: stories ? Number(stories) : undefined,
        qualityGrade,
        occupancyType
      });
      
      if (calculationResult.error) {
        return res.status(400).json({ message: calculationResult.error });
      }
      
      // Calculate material costs
      const materialCosts = calculateMaterialCosts(calculationResult.baseCost, buildingType);
      
      // Add material costs to the result
      calculationResult.materialCosts = materialCosts;
      
      // Add calculation to history if user is logged in
      if (req.user) {
        await storage.createCalculationHistory({
          userId: req.user.id,
          region,
          buildingType,
          squareFootage: Number(squareFootage),
          baseCost: calculationResult.baseCost.toString(),
          totalCost: calculationResult.totalCost.toString(),
          complexityFactor: complexityFactor.toString(),
          conditionFactor: conditionFactor.toString(),
          yearBuilt: Number(yearBuilt),
          depreciationAmount: calculationResult.depreciationAmount?.toString(),
          costPerSqft: calculationResult.costPerSqft?.toString(),
          regionFactor: calculationResult.regionFactor?.toString()
        });
      }
      
      res.status(200).json(calculationResult);
    } catch (error: any) {
      console.error("Building cost calculation error:", error);
      res.status(500).json({ 
        message: error.message || "Error calculating building cost" 
      });
    }
  });
  
  // Save calculation to history
  app.post("/api/calculation-history", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const userId = req.user.id;
      
      const calculation = {
        ...req.body,
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

  // Initialize and set up MCP framework
  try {
    console.log('Initializing Model Content Protocol (MCP) framework...');
    initializeMCP();
    setupMCPRoutes(app);
    
    // Setup AI routes
    app.use('/api/ai', aiRoutes);
    
    // Setup Advanced Prediction routes
    app.use('/api/ai', advancedPredictionRoutes);
    
    // Setup Benchmarking routes
    registerBenchmarkingRoutes(app);
    
    // Register advanced analytics routes
    app.use('/api/benchmarking', advancedAnalyticsRouter);
    
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

  const httpServer = createServer(app);
  return httpServer;
}
