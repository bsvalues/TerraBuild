import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApiEndpointSchema, insertActivitySchema } from "@shared/schema";
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

  const httpServer = createServer(app);
  return httpServer;
}
