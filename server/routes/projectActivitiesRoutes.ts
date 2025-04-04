import express from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { insertProjectActivitySchema } from '@shared/schema';

/**
 * Register project activities routes
 */
export function registerProjectActivitiesRoutes(app: express.Express, storage: IStorage) {
  // Middleware to add logging functionality
  app.use((req: any, res, next) => {
    req.logProjectActivity = async (
      projectId: number, 
      userId: number, 
      activityType: string, 
      activityData: any
    ) => {
      try {
        await storage.createProjectActivity({
          projectId,
          userId,
          activityType,
          activityData
        });
      } catch (error) {
        console.error('Failed to log project activity:', error);
      }
    };
    next();
  });

  // Get all activities for a project
  app.get('/api/projects/:projectId/activities', async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }
      
      const activities = await storage.getProjectActivitiesWithUserInfo(projectId);
      res.json(activities);
    } catch (error) {
      console.error('Error getting project activities:', error);
      res.status(500).json({ error: 'Failed to retrieve project activities' });
    }
  });

  // Get a specific activity
  app.get('/api/projects/activities/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid activity ID' });
      }
      
      const activity = await storage.getProjectActivity(id);
      
      if (!activity) {
        return res.status(404).json({ error: 'Activity not found' });
      }
      
      res.json(activity);
    } catch (error) {
      console.error('Error getting project activity:', error);
      res.status(500).json({ error: 'Failed to retrieve project activity' });
    }
  });

  // Create a new activity
  app.post('/api/projects/:projectId/activities', async (req: any, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      
      if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
      }
      
      // Validate the request body
      const validationSchema = insertProjectActivitySchema.extend({
        projectId: z.number(),
        userId: z.number(),
        activityType: z.string(),
        activityData: z.any().optional().nullable()
      });
      
      const activityData = validationSchema.parse({
        ...req.body,
        projectId
      });
      
      const activity = await storage.createProjectActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      console.error('Error creating project activity:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: 'Failed to create project activity' });
    }
  });
}