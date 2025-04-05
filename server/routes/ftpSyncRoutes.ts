import express from 'express';
import { z } from 'zod';
import { IStorage } from '../storage';
import { FTPService } from '../services/ftpService';
import { FTPSyncService } from '../services/ftpSyncService';
import { requireAuth } from '../auth';
// In case auth.ts doesn't export requireAuth directly, we'll define it here
const requireFtpAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Create a mock admin user for all requests (similar to server/routes.ts implementation)
  if (!req.user) {
    req.user = {
      id: 1,
      username: "admin",
      password: "disabled",
      role: "admin",
      name: "Admin User",
      isActive: true
    };
  }
  next();
};

const router = express.Router();
let ftpSyncService: FTPSyncService;

// Initialize the FTP Sync Service
export function initFTPSyncRoutes(storage: IStorage) {
  ftpSyncService = new FTPSyncService(storage);
  return router;
}

// Middleware to ensure FTP Sync Service is initialized
const ensureFTPSyncService = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!ftpSyncService) {
    return res.status(500).json({ error: 'FTP Sync Service not initialized' });
  }
  next();
};

// Apply middleware to all routes
router.use(requireFtpAuth);
router.use(ensureFTPSyncService);

// Validate sync schedule
const syncScheduleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  connectionId: z.number(),
  source: z.object({
    type: z.enum(["ftp", "local"]),
    path: z.string().min(1, "Source path is required"),
  }),
  destination: z.object({
    type: z.enum(["ftp", "local"]),
    path: z.string().min(1, "Destination path is required"),
  }),
  frequency: z.enum(["manual", "hourly", "daily", "weekly", "monthly"]),
  time: z.string().optional(),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  options: z.object({
    deleteAfterSync: z.boolean().default(false),
    overwriteExisting: z.boolean().default(true),
    includeSubfolders: z.boolean().default(true),
    filePatterns: z.array(z.string()).default([]),
  }),
  enabled: z.boolean().default(true),
  lastRun: z.date().optional(),
  nextRun: z.date().optional(),
  status: z.enum(["success", "failed", "running", "idle"]).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Get all sync schedules for a connection
router.get('/schedules/:connectionId?', async (req, res) => {
  try {
    const connectionId = req.params.connectionId ? parseInt(req.params.connectionId, 10) : undefined;
    const schedules = await ftpSyncService.getSchedules(connectionId);
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get a specific sync schedule by name
router.get('/schedules/:connectionId/:name', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId, 10);
    const name = req.params.name;
    
    const schedule = await ftpSyncService.getScheduleByName(connectionId, name);
    
    if (!schedule) {
      return res.status(404).json({ error: `Schedule '${name}' not found` });
    }
    
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create a new sync schedule
router.post('/schedules', async (req, res) => {
  try {
    const validationResult = syncScheduleSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    const schedule = validationResult.data;
    const newSchedule = await ftpSyncService.createSchedule(schedule);
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a sync schedule
router.put('/schedules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const validationResult = syncScheduleSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    const schedule = validationResult.data;
    
    // Ensure the ID in the path matches the ID in the body (if provided)
    if (schedule.id && schedule.id !== id) {
      return res.status(400).json({ error: 'ID in path does not match ID in body' });
    }
    
    const updatedSchedule = await ftpSyncService.updateSchedule(schedule.connectionId, schedule.name, schedule);
    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Patch a sync schedule (partial update)
router.patch('/schedules/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    
    // Get the existing schedule from the storage
    const existingSchedule = await ftpSyncService.getSchedules(undefined);
    const schedule = existingSchedule.find(s => s.id === id);
    
    if (!schedule) {
      return res.status(404).json({ error: `Schedule with ID ${id} not found` });
    }
    
    // Create a partial validation schema based on the fields provided
    const partialSchema = z.object({
      enabled: z.boolean().optional(),
      status: z.enum(["success", "failed", "running", "idle"]).optional(),
      options: z.object({
        deleteAfterSync: z.boolean().optional(),
        overwriteExisting: z.boolean().optional(),
        includeSubfolders: z.boolean().optional(),
        filePatterns: z.array(z.string()).optional(),
      }).optional(),
      time: z.string().optional(),
      dayOfWeek: z.number().min(0).max(6).optional(),
      dayOfMonth: z.number().min(1).max(31).optional(),
      frequency: z.enum(["manual", "hourly", "daily", "weekly", "monthly"]).optional(),
    });
    
    const validationResult = partialSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.message });
    }
    
    const updates = validationResult.data;
    const updatedSchedule = await ftpSyncService.updateSchedule(schedule.connectionId, schedule.name, updates);
    res.json(updatedSchedule);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a sync schedule
router.delete('/schedules/:connectionId/:name', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId, 10);
    const name = req.params.name;
    
    await ftpSyncService.deleteSchedule(connectionId, name);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Run a sync job manually
router.post('/run/:connectionId/:name', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId, 10);
    const name = req.params.name;
    
    // Start the sync job asynchronously (don't wait for it to complete)
    ftpSyncService.runSyncJob(connectionId, name)
      .then((result) => {
        console.log(`Sync job '${name}' completed with result: ${result}`);
      })
      .catch((error) => {
        console.error(`Sync job '${name}' failed: ${error.message}`);
      });
    
    // Return success immediately
    res.status(202).json({ message: `Sync job '${name}' started` });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get sync history for a connection or schedule
router.get('/history/:connectionId/:scheduleName?', async (req, res) => {
  try {
    const connectionId = parseInt(req.params.connectionId, 10);
    const scheduleName = req.params.scheduleName;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
    
    const history = await ftpSyncService.getSyncHistory(connectionId, scheduleName, limit, offset);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;