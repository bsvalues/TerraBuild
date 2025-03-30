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
  insertBuildingCostMaterialSchema
} from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication and authorization
  setupAuth(app);
  
  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
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
        
        res.json(materialsBreakdown);
      } catch (error: any) {
        res.status(404).json({ message: error.message || "Error calculating materials breakdown" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
