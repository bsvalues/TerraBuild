/**
 * Export and FTP API Routes for Benton County Building Cost System
 * 
 * These routes handle exporting data to CSV and uploading to FTP servers.
 */

import { Router, Request, Response } from 'express';
import { 
  testConnection, 
  listFiles, 
  removeFile, 
  createDirectory,
  uploadFile
} from '../services/ftpService';
import { 
  exportBuildingCostsToFTP,
  exportProjectProgressToFTP 
} from '../services/exportService';
import { storage } from '../storage';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// FTP environment variables (for diagnostic purposes)
const FTP_HOST = process.env.FTP_HOST || '';
const FTP_USERNAME = process.env.FTP_USERNAME || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD ? '*****' : ''; // Hide actual password
const FTP_PORT = process.env.FTP_PORT || '21';

/**
 * Check FTP environment variables
 * GET /api/export/env-test
 * 
 * This endpoint checks if the FTP environment variables are properly set.
 * It's used for troubleshooting FTP connection issues.
 * Note: The password value is masked for security.
 */
router.get('/env-test', async (req: Request, res: Response) => {
  try {
    // Check if environment variables are set
    const envStatus = {
      FTP_HOST: {
        set: Boolean(FTP_HOST),
        value: FTP_HOST
      },
      FTP_USERNAME: {
        set: Boolean(FTP_USERNAME),
        value: FTP_USERNAME
      },
      FTP_PASSWORD: {
        set: Boolean(process.env.FTP_PASSWORD),
        value: FTP_PASSWORD // Already masked
      },
      FTP_PORT: {
        set: Boolean(FTP_PORT),
        value: FTP_PORT
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('FTP environment check requested');
    
    // Record the check in activity log
    await storage.createActivity({
      action: 'FTP environment configuration check',
      icon: 'settings',
      iconColor: 'blue'
    });
    
    res.json(envStatus);
  } catch (error: any) {
    console.error('Error checking FTP environment:', error);
    
    res.status(500).json({
      success: false,
      message: `Error checking FTP environment: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test the FTP connection
 * GET /api/export/test-connection
 * 
 * This endpoint tests the connection to the configured FTP server
 * and returns detailed information about the connection status.
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    console.log('Received request to test FTP connection');
    
    // Record the attempt in activity log
    await storage.createActivity({
      action: 'Testing FTP server connection',
      icon: 'server',
      iconColor: 'blue'
    });
    
    // Test the connection
    const result = await testConnection();
    
    // Log the result
    if (result.success) {
      console.log(`FTP connection test succeeded: ${result.message}`);
      
      // Record successful connection in activity log
      await storage.createActivity({
        action: 'FTP server connection successful',
        icon: 'check-circle',
        iconColor: 'green'
      });
    } else {
      console.warn(`FTP connection test failed: ${result.message}`);
      
      // Record failed connection in activity log
      await storage.createActivity({
        action: 'FTP server connection failed',
        icon: 'alert-circle',
        iconColor: 'red'
      });
    }
    
    // Return the result to the client
    res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error testing FTP connection:', error);
    
    // Record error in activity log
    await storage.createActivity({
      action: `FTP server connection error: ${error.message || 'Unknown error'}`,
      icon: 'x-circle',
      iconColor: 'red'
    });
    
    res.status(500).json({ 
      success: false, 
      message: `Error testing FTP connection: ${error.message || 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * List files on the FTP server
 * GET /api/export/list-files?path=/optional/path
 * 
 * This endpoint lists files and directories at the specified path on the FTP server.
 * It's used for browsing the FTP server's content before performing export operations.
 */
router.get('/list-files', async (req: Request, res: Response) => {
  try {
    const remotePath = req.query.path as string || '/';
    console.log(`Received request to list files in FTP directory: ${remotePath}`);
    
    // Record the attempt in activity log
    await storage.createActivity({
      action: `Browsing FTP directory: ${remotePath}`,
      icon: 'folder',
      iconColor: 'blue'
    });
    
    // List files from the FTP server
    const result = await listFiles(remotePath);
    
    if (!result.success) {
      console.warn(`Failed to list files in directory ${remotePath}: ${result.message}`);
      
      // Record failed listing in activity log
      await storage.createActivity({
        action: `Failed to list FTP directory: ${remotePath}`,
        icon: 'alert-circle',
        iconColor: 'amber'
      });
      
      return res.status(400).json({
        success: false,
        message: result.message,
        path: remotePath,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Successfully listed ${result.files?.length || 0} files in ${remotePath}`);
    
    // Record successful listing in activity log
    await storage.createActivity({
      action: `Listed ${result.files?.length || 0} files in FTP directory: ${remotePath}`,
      icon: 'list',
      iconColor: 'green'
    });
    
    // Return the result to the client
    res.json({ 
      success: true, 
      message: result.message,
      path: remotePath,
      files: result.files,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error listing FTP files:', error);
    
    // Record error in activity log
    await storage.createActivity({
      action: `Error listing FTP directory: ${error.message || 'Unknown error'}`,
      icon: 'x-circle',
      iconColor: 'red'
    });
    
    res.status(500).json({ 
      success: false, 
      message: `Error listing FTP files: ${error.message || 'Unknown error'}`,
      path: req.query.path as string || '/',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Export cost matrix data to FTP
 * POST /api/export/cost-matrix
 * 
 * This endpoint exports cost matrix data to the FTP server.
 * It can export all data or filter by region, and includes the year in the filename.
 * 
 * Request body:
 * {
 *   year: number,    // Optional - defaults to current year
 *   region: string,  // Optional - filter by region
 *   userId: number   // Optional - user ID of the person initiating the export
 * }
 */
router.post('/cost-matrix', async (req: Request, res: Response) => {
  try {
    const { year = new Date().getFullYear(), region, userId } = req.body;
    
    // Validate inputs
    if (year && (isNaN(year) || year < 2000 || year > 2100)) {
      console.warn(`Invalid year provided: ${year}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid year provided. Year must be between 2000 and 2100.',
        timestamp: new Date().toISOString()
      });
    }
    
    if (region && typeof region !== 'string') {
      console.warn(`Invalid region provided: ${region}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid region format provided.',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Processing export request for cost matrix data: year=${year}, region=${region || 'all'}`);
    
    // Record the export attempt in activity log
    await storage.createActivity({
      action: `Initiating building cost export to FTP${region ? ` for region ${region}` : ''}`,
      icon: 'upload',
      iconColor: 'blue'
    });
    
    // Get cost matrix entries with appropriate filtering
    let costMatrixEntries: any[] = [];
    let errorMessage = '';
    
    try {
      if (region) {
        console.log(`Fetching cost matrix entries for region: ${region}`);
        const regionEntries = await storage.getCostMatrixByRegion(region);
        costMatrixEntries = Array.isArray(regionEntries) ? regionEntries : [regionEntries].filter(entry => entry);
      } else {
        console.log('Fetching all cost matrix entries');
        costMatrixEntries = await storage.getAllCostMatrix();
      }
    } catch (fetchError: any) {
      errorMessage = `Failed to fetch cost matrix data: ${fetchError.message}`;
      console.error(errorMessage);
      
      // Record the fetch error in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'database',
        iconColor: 'red'
      });
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Check if we have data to export
    if (!costMatrixEntries || costMatrixEntries.length === 0) {
      errorMessage = `No cost matrix data found to export${region ? ` for region ${region}` : ''}`;
      console.warn(errorMessage);
      
      // Record the empty result in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'alert-circle',
        iconColor: 'amber'
      });
      
      return res.status(404).json({ 
        success: false, 
        message: errorMessage,
        timestamp: new Date().toISOString() 
      });
    }
    
    console.log(`Found ${costMatrixEntries.length} cost matrix entries to export`);
    
    // Test FTP connection before attempting export
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      errorMessage = `FTP connection test failed: ${connectionTest.message}`;
      console.error(errorMessage);
      
      // Record the FTP connection failure in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'server-off',
        iconColor: 'red'
      });
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Export to FTP
    console.log(`Exporting ${costMatrixEntries.length} cost matrix entries to FTP`);
    const exportResult = await exportBuildingCostsToFTP(costMatrixEntries, year, region);
    
    if (!exportResult.success) {
      errorMessage = `FTP export failed: ${exportResult.message}`;
      console.error(errorMessage);
      
      // Record the export failure in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'x-circle',
        iconColor: 'red'
      });
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Record the successful export activity
    const activityDescription = region 
      ? `Exported ${costMatrixEntries.length} ${region} region building costs to FTP`
      : `Exported ${costMatrixEntries.length} building costs to FTP`;
      
    await storage.createActivity({
      action: activityDescription,
      icon: 'upload-cloud',
      iconColor: 'green'
    });
    
    console.log(`Successfully exported cost matrix data: ${activityDescription}`);
    
    // If a user ID was provided, record a user-specific activity
    if (userId) {
      const userDescription = `User ID ${userId} exported building costs to FTP`;
      await storage.createActivity({
        action: userDescription,
        icon: 'user',
        iconColor: 'blue'
      });
    }
    
    res.json({ 
      success: true, 
      message: exportResult.message || `Successfully exported ${costMatrixEntries.length} building costs to FTP`,
      count: costMatrixEntries.length,
      remotePath: exportResult.remotePath,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const errorMessage = `Error exporting cost matrix to FTP: ${error.message || 'Unknown error'}`;
    console.error('Export error:', error);
    
    // Record the error in activity log
    await storage.createActivity({
      action: errorMessage,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Export project progress report to FTP
 * POST /api/export/project-progress/:id
 * 
 * This endpoint exports a project progress report to the FTP server.
 * It includes project details, milestones, tasks, members, and recent activities.
 * 
 * Request parameters:
 * - id: Project ID (in URL)
 * 
 * Request body:
 * {
 *   userId: number,  // Optional - user ID of the person initiating the export
 *   format: string   // Optional - output format, defaults to 'csv'
 * }
 */
router.post('/project-progress/:id', async (req: Request, res: Response) => {
  try {
    // Parse and validate the project ID
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId) || projectId <= 0) {
      const errorMessage = `Invalid project ID: ${req.params.id}`;
      console.warn(errorMessage);
      
      await storage.createActivity({
        action: errorMessage,
        icon: 'alert-circle',
        iconColor: 'red'
      });
      
      return res.status(400).json({ 
        success: false, 
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Processing export request for project progress: projectId=${projectId}`);
    
    // Record the attempt in activity log
    await storage.createActivity({
      action: `Initiating project progress export for project ID ${projectId}`,
      icon: 'file-text',
      iconColor: 'blue'
    });
    
    // Verify project exists
    const project = await storage.getSharedProject(projectId);
    if (!project) {
      const errorMessage = `Project with ID ${projectId} not found`;
      console.warn(errorMessage);
      
      await storage.createActivity({
        action: errorMessage,
        icon: 'file-missing',
        iconColor: 'amber'
      });
      
      return res.status(404).json({ 
        success: false, 
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Found project: "${project.name}" (ID: ${projectId})`);
    
    // Test FTP connection before collecting project data
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      const errorMessage = `FTP connection test failed: ${connectionTest.message}`;
      console.error(errorMessage);
      
      // Record the FTP connection failure in activity log
      await storage.createActivity({
        action: errorMessage,
        icon: 'server-off',
        iconColor: 'red'
      });
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Get project members
    let members = [];
    try {
      members = await storage.getProjectMembers(projectId);
      console.log(`Found ${members.length} project members`);
    } catch (error: any) {
      console.warn(`Error fetching project members: ${error.message}`);
      // Continue with empty members list
    }
    
    // Get project activities
    let activities = [];
    try {
      activities = await storage.getProjectActivities(projectId);
      console.log(`Found ${activities.length} project activities`);
    } catch (error: any) {
      console.warn(`Error fetching project activities: ${error.message}`);
      // Continue with empty activities list
    }
    
    // Fetch project items (milestones and tasks)
    let items = [];
    try {
      items = await storage.getProjectItems(projectId);
      console.log(`Found ${items.length} project items`);
    } catch (error: any) {
      console.warn(`Error fetching project items: ${error.message}`);
      // Continue with empty items list
    }
    
    // Group items by type
    const milestones = items.filter(item => item.itemType === 'milestone');
    const tasks = items.filter(item => item.itemType === 'task');
    
    console.log(`Project has ${milestones.length} milestones and ${tasks.length} tasks`);
    
    // Calculate overall progress
    let totalProgress = 0;
    let itemCount = 0;
    
    // Process milestones to include their tasks and calculate progress
    const processedMilestones = milestones.map(milestone => {
      // Get the real milestone data based on itemId
      const milestoneData = { 
        id: milestone.itemId,
        progress: 0,
        title: milestone.itemName || `Milestone ${milestone.itemId}`,
        description: milestone.description || '',
        parentItemId: null
      };
      
      // Find tasks associated with this milestone
      const milestoneTasks = tasks.filter(task => {
        // Since parentItemId doesn't exist in our schema, we're using a convention
        // based on milestoneId property in the extended data, if available
        const taskData = task.data ? JSON.parse(task.data as string) : {};
        return taskData.milestoneId === milestone.itemId;
      });
      
      // Calculate milestone progress based on tasks
      let milestoneProgress = 0;
      if (milestoneTasks.length > 0) {
        // Calculate average progress of tasks, with fallbacks
        let taskProgressSum = 0;
        milestoneTasks.forEach(task => {
          const taskData = task.data ? JSON.parse(task.data as string) : {};
          taskProgressSum += taskData.progress || 50; // Default to 50% if not specified
        });
        milestoneProgress = taskProgressSum / milestoneTasks.length;
      } else {
        // Use milestone data directly if available, otherwise default to 25%
        const milestoneExtData = milestone.data ? JSON.parse(milestone.data as string) : {};
        milestoneProgress = milestoneExtData.progress || 25;
      }
      
      totalProgress += milestoneProgress;
      itemCount++;
      
      return {
        ...milestone,
        title: milestoneData.title,
        description: milestoneData.description,
        tasks: milestoneTasks.map(task => {
          const taskData = task.data ? JSON.parse(task.data as string) : {};
          return {
            ...task,
            title: task.itemName || `Task ${task.itemId}`,
            description: taskData.description || '',
            progress: taskData.progress || 50,
            parentItemId: milestone.itemId
          };
        }),
        progress: milestoneProgress
      };
    });
    
    // Final project progress
    const projectProgress = itemCount > 0 ? Math.min(100, Math.max(0, totalProgress / itemCount)) : 0;
    
    // Prepare report data
    const reportData = {
      project: {
        ...project,
        progress: Math.round(projectProgress),
        progressStr: `${Math.round(projectProgress)}%`
      },
      milestones: processedMilestones,
      members,
      activities: activities.slice(0, 50), // Limit to most recent 50 activities
      exportDate: new Date().toISOString(),
      exportedBy: req.body.userId || 'system',
      format: req.body.format || 'csv'
    };
    
    console.log(`Prepared project progress report with ${processedMilestones.length} milestones`);
    
    // Export to FTP
    const exportResult = await exportProjectProgressToFTP(projectId, project.name, reportData);
    
    if (!exportResult.success) {
      const errorMessage = `FTP export failed: ${exportResult.message}`;
      console.error(errorMessage);
      
      await storage.createActivity({
        action: errorMessage,
        icon: 'file-x',
        iconColor: 'red'
      });
      
      return res.status(500).json({
        success: false,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
    
    // Record the export activity
    const activityDescription = `Exported progress report for project "${project.name}" to FTP`;
    await storage.createActivity({
      action: activityDescription,
      icon: 'file-check',
      iconColor: 'green'
    });
    
    console.log(`Successfully exported project progress report: ${activityDescription}`);
    
    // If a user ID was provided, record a user-specific activity
    if (req.body.userId) {
      const userDescription = `User ID ${req.body.userId} exported progress report`;
      await storage.createActivity({
        action: userDescription,
        icon: 'user',
        iconColor: 'blue'
      });
    }
    
    res.json({
      success: true,
      message: exportResult.message || `Successfully exported progress report for project "${project.name}" to FTP`,
      projectName: project.name,
      remotePath: exportResult.remotePath,
      progressPercent: Math.round(projectProgress),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const errorMessage = `Error exporting project progress to FTP: ${error.message || 'Unknown error'}`;
    console.error('Error exporting project progress to FTP:', error);
    
    // Record the error in activity log
    await storage.createActivity({
      action: errorMessage,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    res.status(500).json({ 
      success: false, 
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Create a directory on the FTP server
 * POST /api/export/create-directory
 * 
 * This endpoint creates a directory on the FTP server.
 * It supports creating parent directories if needed.
 * 
 * Request body:
 * {
 *   path: string,       // Required - remote path to create
 *   createParents: boolean // Optional - whether to create parent directories (default: true)
 * }
 */
router.post('/create-directory', async (req: Request, res: Response) => {
  try {
    const { path: remotePath, createParents = true } = req.body;
    
    if (!remotePath) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }
    
    // Log the directory creation request
    console.log(`Received request to create directory: ${remotePath}`);
    await storage.createActivity({
      action: `Requested directory creation on FTP server: ${remotePath}`,
      icon: 'folder-plus',
      iconColor: 'blue'
    });
    
    // Create the directory
    const result = await createDirectory(
      remotePath,
      createParents,
      3, // retryAttempts
      2000 // retryDelay
    );
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (err: any) {
    console.error('Error creating directory on FTP server:', err);
    res.status(500).json({ success: false, message: `Directory creation failed: ${err.message}` });
  }
});

/**
 * Delete a file from the FTP server
 * DELETE /api/export/file
 * 
 * This endpoint deletes a file from the FTP server.
 * 
 * Request body:
 * {
 *   path: string  // Required - remote path to the file to delete
 * }
 */
router.delete('/file', async (req: Request, res: Response) => {
  try {
    const { path: remotePath } = req.body;
    
    if (!remotePath) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }
    
    // Log the file deletion request
    console.log(`Received request to delete file: ${remotePath}`);
    await storage.createActivity({
      action: `Requested file deletion on FTP server: ${remotePath}`,
      icon: 'trash-2',
      iconColor: 'red'
    });
    
    // Delete the file
    const result = await removeFile(
      remotePath,
      3, // retryAttempts
      2000 // retryDelay
    );
    
    res.status(result.success ? 200 : 500).json(result);
  } catch (err: any) {
    console.error('Error deleting file from FTP server:', err);
    res.status(500).json({ success: false, message: `File deletion failed: ${err.message}` });
  }
});

/**
 * Upload a file to the FTP server
 * POST /api/export/file
 * 
 * This endpoint uploads a file to the FTP server.
 * It uses 'multer' to handle the file upload.
 * 
 * Form data:
 * - file: The file to upload
 * - remotePath: The remote path on the FTP server where the file should be stored
 * - createDir: (Optional) Whether to create parent directories if they don't exist (default: true)
 */


// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/temp';
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/file', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { remotePath } = req.body;
    const createDir = req.body.createDir !== 'false'; // Default to true
    
    if (!file) {
      return res.status(400).json({ success: false, message: 'No file was uploaded' });
    }
    
    if (!remotePath) {
      // Remove the uploaded file to clean up
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(400).json({ success: false, message: 'Remote path is required' });
    }
    
    // Construct the full remote path, including the filename
    let fullRemotePath = remotePath;
    if (!remotePath.endsWith('/') && !path.basename(remotePath).includes('.')) {
      // If remotePath doesn't end with a slash and doesn't have a file extension,
      // assume it's a directory and append the original filename
      fullRemotePath = path.posix.join(remotePath, file.originalname);
    }
    
    // Log the upload request
    console.log(`Received request to upload file ${file.originalname} to ${fullRemotePath}`);
    await storage.createActivity({
      action: `Requested file upload to FTP server: ${fullRemotePath}`,
      icon: 'upload-cloud',
      iconColor: 'blue'
    });
    
    // Upload the file to the FTP server
    const result = await uploadFile(
      file.path,
      fullRemotePath,
      createDir,
      3, // retryAttempts
      2000 // retryDelay
    );
    
    // Remove the temporary file after upload
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    
    res.status(result.success ? 200 : 500).json({ 
      ...result,
      originalName: file.originalname,
      size: file.size
    });
  } catch (err: any) {
    console.error('Error uploading file to FTP server:', err);
    
    // Clean up any temporary file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, message: `File upload failed: ${err.message}` });
  }
});

export default router;