import { Express, Request, Response } from "express";
import { z } from "zod";
import { IStorage } from "../storage";
import { insertProjectActivitySchema } from "@shared/schema";

/**
 * Register project activities routes
 * @param app Express app instance
 * @param storage Storage implementation
 */
export function registerProjectActivitiesRoutes(app: Express, storage: IStorage) {
  // Get project activities
  app.get(
    "/api/projects/:id/activities",
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        const projectId = parseInt(req.params.id, 10);
        
        // Get project activities with user info
        const activities = await storage.getProjectActivitiesWithUserInfo(projectId);
        
        res.json(activities);
      } catch (error: any) {
        console.error("Error fetching project activities:", error);
        res.status(500).json({ error: "Failed to fetch project activities" });
      }
    }
  );

  // Get single project activity
  app.get(
    "/api/projects/:projectId/activities/:activityId",
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        const projectId = parseInt(req.params.projectId, 10);
        const activityId = parseInt(req.params.activityId, 10);
        
        const activity = await storage.getProjectActivity(activityId);
        
        if (!activity || activity.projectId !== projectId) {
          return res.status(404).json({ error: "Activity not found" });
        }
        
        res.json(activity);
      } catch (error: any) {
        console.error("Error fetching project activity:", error);
        res.status(500).json({ error: "Failed to fetch project activity" });
      }
    }
  );

  // Create project activity
  app.post(
    "/api/projects/:id/activities",
    async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        const projectId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        
        const activityData = insertProjectActivitySchema.parse({
          ...req.body,
          projectId,
          userId
        });
        
        const createdActivity = await storage.createProjectActivity(activityData);
        
        res.status(201).json(createdActivity);
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid activity data", details: error.format() });
        }
        
        console.error("Error creating project activity:", error);
        res.status(500).json({ error: "Failed to create project activity" });
      }
    }
  );
}