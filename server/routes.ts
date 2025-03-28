import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertApiEndpointSchema, 
  insertActivitySchema,
  insertBuildingCostSchema,
  insertCostFactorSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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
    const autologinSetting = await storage.getSetting("DEV_AUTOLOGIN");
    const tokenSetting = await storage.getSetting("DEV_AUTH_TOKEN");
    
    res.json({
      enabled: autologinSetting?.value === "true",
      token: tokenSetting?.value || null,
    });
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
        const costPerSqft = buildingCost.costPerSqft;
        const squareFootage = buildingCost.squareFootage;
        buildingCost.totalCost = parseFloat((costPerSqft * squareFootage).toFixed(2));
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
      const complexityFactorValue = costFactor.complexityFactor;
      const complexityMultiplierValue = parseFloat(complexityMultiplier.toString());
      const calculatedComplexityFactor = complexityFactorValue * complexityMultiplierValue;
      
      const squareFootageValue = parseFloat(squareFootage.toString());
      const costPerSqft = parseFloat((baseCost * regionFactor * calculatedComplexityFactor).toFixed(2));
      const totalCost = parseFloat((costPerSqft * squareFootageValue).toFixed(2));
      
      res.json({
        region,
        buildingType,
        squareFootage: parseFloat(squareFootage.toString()),
        baseCost,
        regionFactor,
        complexityFactor,
        costPerSqft,
        totalCost
      });
    } catch (error) {
      res.status(500).json({ message: "Error calculating building cost" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
