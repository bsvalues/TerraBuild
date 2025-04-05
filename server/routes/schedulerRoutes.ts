import express, { Request, Response, NextFunction } from 'express';
import { IStorage } from '../storage';
import { SchedulerService } from '../services/schedulerService';

// Create a requireAuth middleware for the scheduler routes
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

const router = express.Router();
let schedulerService: SchedulerService;

// Initialize the Scheduler Service with storage
export function initSchedulerRoutes(storage: IStorage) {
  schedulerService = new SchedulerService(storage);
  
  // Start the scheduler automatically when the server starts
  // Using a 1-minute check interval
  schedulerService.start(60000);
  
  // Add storage to each request
  router.use((req: Request, res: Response, next: NextFunction) => {
    req.storage = storage;
    next();
  });
  
  return router;
}

// Helper formatter for activity details
const formatActivityDetails = (details: any): Array<{key: string, value: any}> => {
  if (typeof details === 'string') {
    return [{ key: 'message', value: details }];
  } else if (details && typeof details === 'object') {
    // Convert object to array of key-value pairs
    return Object.entries(details).map(([key, value]) => ({ key, value }));
  }
  return [{ key: 'data', value: String(details) }];
};

// Middleware to ensure Scheduler Service is initialized
const ensureSchedulerService = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!schedulerService) {
    return res.status(500).json({ error: 'Scheduler Service not initialized' });
  }
  next();
};

// Apply middleware to all routes
router.use(ensureSchedulerService);

// Get scheduler status
router.get('/status', async (req, res) => {
  try {
    const status = schedulerService.getStatus();
    
    // Log the activity
    await req.storage.createActivity({
      action: 'Scheduler Status Checked',
      icon: 'info',
      iconColor: 'blue',
      details: formatActivityDetails({ status: status.running ? 'running' : 'stopped' })
    });
    
    res.json({
      status: 'success',
      data: status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    
    // Log the failed activity
    await req.storage.createActivity({
      action: 'Scheduler Status Check Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ error: (error as Error).message })
    });
    
    res.status(500).json({
      status: 'error',
      message: (error as Error).message
    });
  }
});

// Start the scheduler
router.post('/start', requireAuth, async (req, res) => {
  try {
    // Only admins can start/stop the scheduler
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can manage the scheduler'
      });
    }
    
    const checkInterval = req.body.checkInterval || 60000; // Default to 1 minute
    schedulerService.start(checkInterval);
    
    // Log the activity
    await req.storage.createActivity({
      action: 'Scheduler Started',
      icon: 'play',
      iconColor: 'green',
      details: formatActivityDetails({ 
        checkInterval,
        startedBy: req.user.username
      })
    });
    
    res.json({
      status: 'success',
      message: 'Scheduler started successfully',
      data: schedulerService.getStatus()
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    
    // Log the failed activity
    await req.storage.createActivity({
      action: 'Scheduler Start Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({
        error: (error as Error).message,
        startedBy: req.user?.username
      })
    });
    
    res.status(500).json({
      status: 'error',
      message: (error as Error).message
    });
  }
});

// Stop the scheduler
router.post('/stop', requireAuth, async (req, res) => {
  try {
    // Only admins can start/stop the scheduler
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only administrators can manage the scheduler'
      });
    }
    
    schedulerService.stop();
    
    // Log the activity
    await req.storage.createActivity({
      action: 'Scheduler Stopped',
      icon: 'square',
      iconColor: 'amber',
      details: formatActivityDetails({
        stoppedBy: req.user.username,
        reason: req.body.reason || 'Manual stop'
      })
    });
    
    res.json({
      status: 'success',
      message: 'Scheduler stopped successfully',
      data: schedulerService.getStatus()
    });
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    
    // Log the failed activity
    await req.storage.createActivity({
      action: 'Scheduler Stop Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({
        error: (error as Error).message,
        stoppedBy: req.user?.username
      })
    });
    
    res.status(500).json({
      status: 'error',
      message: (error as Error).message
    });
  }
});

// Check schedules immediately (manual run)
router.post('/check-now', requireAuth, async (req, res) => {
  try {
    // Log the activity
    await req.storage.createActivity({
      action: 'Manual Schedule Check Requested',
      icon: 'refresh-cw',
      iconColor: 'blue',
      details: formatActivityDetails({
        requestedBy: req.user?.username
      })
    });
    
    // Return response immediately, actual check will happen in background
    res.json({
      status: 'success',
      message: 'Manual schedule check initiated'
    });
    
    // Perform schedule check in the background
    setTimeout(async () => {
      try {
        // Access private method for immediate check
        await (schedulerService as any).checkSchedules();
      } catch (error) {
        console.error('Error in manual schedule check:', error);
        await req.storage.createActivity({
          action: 'Manual Schedule Check Failed',
          icon: 'x-circle',
          iconColor: 'red',
          details: formatActivityDetails({
            error: (error as Error).message
          })
        });
      }
    }, 0);
    
  } catch (error) {
    console.error('Error initiating manual schedule check:', error);
    
    // Log the failed activity
    await req.storage.createActivity({
      action: 'Manual Schedule Check Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({
        error: (error as Error).message,
        requestedBy: req.user?.username
      })
    });
    
    res.status(500).json({
      status: 'error',
      message: (error as Error).message
    });
  }
});

export default router;