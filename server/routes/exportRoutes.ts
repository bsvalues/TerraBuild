/**
 * Export and FTP API Routes for Benton County Building Cost System
 * 
 * These routes handle exporting data to CSV and uploading to FTP servers.
 */

import { Router, Request, Response } from 'express';
import { testConnection, listFiles } from '../services/ftpService';
import { 
  exportBuildingCostsToFTP,
  exportProjectProgressToFTP 
} from '../services/exportService';
import { storage } from '../storage';

const router = Router();

/**
 * Test the FTP connection
 * GET /api/export/test-connection
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await testConnection();
    res.json(result);
  } catch (error: any) {
    console.error('Error testing FTP connection:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error testing FTP connection: ${error.message || 'Unknown error'}` 
    });
  }
});

/**
 * List files on the FTP server
 * GET /api/export/list-files?path=/optional/path
 */
router.get('/list-files', async (req: Request, res: Response) => {
  try {
    const remotePath = req.query.path as string || '/';
    const files = await listFiles(remotePath);
    res.json({ 
      success: true, 
      path: remotePath,
      files: files 
    });
  } catch (error: any) {
    console.error('Error listing FTP files:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error listing FTP files: ${error.message || 'Unknown error'}` 
    });
  }
});

/**
 * Export cost matrix data to FTP
 * POST /api/export/cost-matrix
 * 
 * Request body:
 * {
 *   year: number,    // Optional - defaults to current year
 *   region: string   // Optional - filter by region
 * }
 */
router.post('/cost-matrix', async (req: Request, res: Response) => {
  try {
    const { year = new Date().getFullYear(), region } = req.body;
    
    // Get cost matrix entries
    let costMatrixEntries: any[] = [];
    if (region) {
      const regionEntries = await storage.getCostMatrixByRegion(region);
      costMatrixEntries = Array.isArray(regionEntries) ? regionEntries : [regionEntries].filter(entry => entry);
    } else {
      costMatrixEntries = await storage.getAllCostMatrix();
    }
    
    if (!costMatrixEntries || costMatrixEntries.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No cost matrix data found to export' 
      });
    }
    
    // Export to FTP
    await exportBuildingCostsToFTP(costMatrixEntries, year, region);
    
    // Record the export activity
    const activityDescription = region 
      ? `Exported ${costMatrixEntries.length} ${region} region building costs to FTP`
      : `Exported ${costMatrixEntries.length} building costs to FTP`;
      
    await storage.createActivity({
      action: activityDescription,
      icon: 'upload',
      iconColor: 'blue'
    });
    
    res.json({ 
      success: true, 
      message: `Successfully exported ${costMatrixEntries.length} building costs to FTP`,
      count: costMatrixEntries.length
    });
  } catch (error: any) {
    console.error('Error exporting cost matrix to FTP:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error exporting cost matrix to FTP: ${error.message || 'Unknown error'}` 
    });
  }
});

/**
 * Export project progress report to FTP
 * POST /api/export/project-progress/:id
 */
router.post('/project-progress/:id', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    
    // Verify project exists
    const project = await storage.getSharedProject(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: `Project with ID ${projectId} not found` 
      });
    }
    
    // Get project members
    const members = await storage.getProjectMembers(projectId);
    
    // Get project activities
    const activities = await storage.getProjectActivities(projectId);
    
    // Fetch project items (milestones and tasks)
    const items = await storage.getProjectItems(projectId);
    
    // Group items by type
    const milestones = items.filter(item => item.itemType === 'milestone');
    const tasks = items.filter(item => item.itemType === 'task');
    
    // Calculate overall progress
    let totalProgress = 0;
    let itemCount = 0;
    
    // Process milestones to include their tasks
    const processedMilestones = milestones.map(milestone => {
      // Get the real milestone data based on itemId
      const milestoneData = { 
        id: milestone.itemId,
        progress: 0,
        title: `Milestone ${milestone.itemId}`, // Fallback title
        description: '',
        parentItemId: null
      };
      
      const milestoneTasks = tasks.filter(task => {
        // Since parentItemId doesn't exist in our schema, we're assuming a connection
        // based on a convention (e.g., task items with a relation to milestones)
        return task.itemId && milestone.itemId; // Replace with actual relation logic
      });
      
      // Calculate milestone progress based on tasks
      let milestoneProgress = 0;
      if (milestoneTasks.length > 0) {
        // We're assuming tasks have a progress value in the extended data
        // This would typically be fetched from an associated task table
        milestoneProgress = 50; // Placeholder progress value for demo
      } else {
        milestoneProgress = 25; // Placeholder progress value for demo
      }
      
      totalProgress += milestoneProgress;
      itemCount++;
      
      return {
        ...milestone,
        tasks: milestoneTasks.map(task => ({
          ...task,
          progress: 50, // Add progress property with placeholder value
          parentItemId: milestone.itemId // Add parentItemId relation
        })),
        progress: milestoneProgress
      };
    });
    
    // Final project progress
    const projectProgress = itemCount > 0 ? totalProgress / itemCount : 0;
    
    // Prepare report data
    const reportData = {
      project: {
        ...project,
        progress: projectProgress
      },
      milestones: processedMilestones,
      members,
      activities: activities.slice(0, 50), // Limit to most recent 50 activities
      exportDate: new Date().toISOString(),
      exportedBy: req.body.userId || 'system'
    };
    
    // Export to FTP
    await exportProjectProgressToFTP(projectId, project.name, reportData);
    
    // Record the export activity
    await storage.createActivity({
      action: `Exported progress report for project "${project.name}" to FTP`,
      icon: 'file-text',
      iconColor: 'green'
    });
    
    res.json({
      success: true,
      message: `Successfully exported progress report for project "${project.name}" to FTP`,
      projectName: project.name
    });
  } catch (error: any) {
    console.error('Error exporting project progress to FTP:', error);
    res.status(500).json({ 
      success: false, 
      message: `Error exporting project progress to FTP: ${error.message || 'Unknown error'}` 
    });
  }
});

export default router;