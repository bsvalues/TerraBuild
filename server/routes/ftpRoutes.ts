import { Router, Request, Response } from 'express';
import multer from 'multer';
import FTPClient, { FileFilterOptions } from '../services/ftpService';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

// Helper function for safe activity details formatting
// The details field in activities table is defined as an array type [any, ...any[]]
// This helper ensures we're passing a proper format for the details field
const formatActivityDetails = (details: any): [any, ...any[]] => {
  if (typeof details === 'string') {
    // Handle string details by making it a single-element array with a message object
    return [{ message: details }];
  } else if (details && typeof details === 'object') {
    // Convert object to array format
    return [details];
  }
  return [{ data: String(details) }];
};

const router = Router();

// Default connection ID for the system
const DEFAULT_FTP_CONNECTION_ID = 1;

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Helper to validate FTP credentials from environment
const validateFTPCredentials = () => {
  const host = process.env.FTP_HOST;
  const port = process.env.FTP_PORT ? parseInt(process.env.FTP_PORT, 10) : 21;
  const username = process.env.FTP_USERNAME;
  const password = process.env.FTP_PASSWORD;

  if (!host || !username || !password) {
    return {
      valid: false,
      message: 'FTP credentials not configured. Please set FTP_HOST, FTP_USERNAME, and FTP_PASSWORD environment variables.',
      credentials: null
    };
  }

  return {
    valid: true,
    message: 'FTP credentials available',
    credentials: { host, port, username, password }
  };
};

// FTP connection status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const validation = validateFTPCredentials();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { host, port, username, password } = validation.credentials!;
    const client = new FTPClient();
    
    // Try to connect to test credentials
    await client.connect({
      host,
      port,
      user: username,
      password,
      secure: false
    });
    
    // Log the activity
    await storage.createActivity({
      action: 'FTP Connection Status Checked',
      icon: 'check-circle',
      iconColor: 'green',
      details: formatActivityDetails({ host, port, status: 'success' })
    });
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to FTP server',
    });
  } catch (error: any) {
    console.error('FTP Status Error:', error);
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP Connection Status Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ error: error.message })
    });
    
    return res.status(500).json({
      success: false,
      message: `Failed to connect to FTP server: ${error.message}`
    });
  }
});

// List FTP directory contents
router.get('/list', async (req: Request, res: Response) => {
  try {
    const validation = validateFTPCredentials();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { host, port, username, password } = validation.credentials!;
    const remotePath = (req.query.path as string) || '/';
    
    // Parse filter options from query parameters
    const filterOptions: FileFilterOptions = {};
    
    // Handle include patterns
    if (req.query.include) {
      const includeValue = req.query.include;
      console.log(`Raw include value type: ${typeof includeValue}, value: ${JSON.stringify(includeValue)}`);
      
      filterOptions.includePatterns = Array.isArray(includeValue) 
        ? (includeValue as string[]) 
        : [includeValue as string];
      
      console.log(`FTP route include patterns: ${JSON.stringify(filterOptions.includePatterns)}`);
      
      // Test some simple cases directly in the route handler
      if (filterOptions.includePatterns.includes("*.csv")) {
        console.log("DEBUG: Include pattern contains *.csv - this should match CSV files");
      }
    }
    
    // Handle exclude patterns
    if (req.query.exclude) {
      filterOptions.excludePatterns = Array.isArray(req.query.exclude) 
        ? (req.query.exclude as string[]) 
        : [(req.query.exclude as string)];
      console.log(`FTP route exclude patterns: ${JSON.stringify(filterOptions.excludePatterns)}`);
    }
    
    // Handle size filters
    if (req.query.minSize) {
      filterOptions.minSize = parseInt(req.query.minSize as string, 10);
    }
    
    if (req.query.maxSize) {
      filterOptions.maxSize = parseInt(req.query.maxSize as string, 10);
    }
    
    // Handle date filters
    if (req.query.newerThan) {
      filterOptions.newerThan = new Date(req.query.newerThan as string);
    }
    
    if (req.query.olderThan) {
      filterOptions.olderThan = new Date(req.query.olderThan as string);
    }
    
    // Use the enhanced ftpService.listFiles function instead of direct client
    const response = await import('../services/ftpService').then(module => {
      return module.listFiles(remotePath, 
        Object.keys(filterOptions).length > 0 ? filterOptions : undefined
      );
    });
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // Log the activity with enhanced information
    await storage.createActivity({
      action: 'FTP Directory Listed',
      icon: 'folder-open',
      iconColor: 'blue',
      details: formatActivityDetails({ 
        path: remotePath, 
        fileCount: response.files?.length || 0,
        filtered: response.stats?.filteringApplied || false,
        filterOptions: response.filterOptions,
        stats: response.stats
      })
    });
    
    // Return the enhanced response directly
    return res.status(200).json({
      success: true,
      message: response.message,
      files: response.files,
      filterOptions: response.filterOptions,
      stats: response.stats
    });
  } catch (error: any) {
    console.error('FTP List Error:', error);
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP Directory List Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ 
        path: req.query.path, 
        error: error.message,
        filterAttempt: req.query.include || req.query.exclude || req.query.minSize || req.query.maxSize || req.query.newerThan || req.query.olderThan
      })
    });
    
    return res.status(500).json({
      success: false,
      message: `Failed to list FTP directory: ${error.message}`
    });
  }
});

// Upload file to FTP server
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const validation = validateFTPCredentials();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided for upload'
      });
    }

    const remotePath = req.body.path || '/';
    const uploadedFile = req.file;
    const fullRemotePath = `${remotePath}${remotePath.endsWith('/') ? '' : '/'}${uploadedFile.originalname}`;
    
    // Use the enhanced ftpService.uploadFile function
    const response = await import('../services/ftpService').then(module => {
      return module.uploadFile(uploadedFile.path, fullRemotePath);
    });
    
    // Clean up temporary file regardless of success or failure
    try {
      await fsPromises.unlink(uploadedFile.path);
    } catch (unlinkError) {
      console.error('Failed to delete temporary file:', unlinkError);
    }
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // Log the activity
    await storage.createActivity({
      action: 'File Uploaded to FTP',
      icon: 'upload',
      iconColor: 'green',
      details: formatActivityDetails({ 
        path: remotePath, 
        filename: uploadedFile.originalname,
        size: uploadedFile.size
      })
    });
    
    return res.status(200).json({
      success: true,
      message: response.message || `Successfully uploaded ${uploadedFile.originalname} to ${remotePath}`,
      file: {
        name: uploadedFile.originalname,
        size: uploadedFile.size,
        path: remotePath
      }
    });
  } catch (error: any) {
    console.error('FTP Upload Error:', error);
    
    // Clean up temporary file if it exists and hasn't been deleted yet
    if (req.file) {
      try {
        await fsPromises.access(req.file.path);
        await fsPromises.unlink(req.file.path);
      } catch {
        // File doesn't exist or can't be accessed, already deleted
      }
    }
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP File Upload Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ 
        path: req.body.path, 
        filename: req.file?.originalname,
        error: error.message
      })
    });
    
    return res.status(500).json({
      success: false,
      message: `Failed to upload file: ${error.message}`
    });
  }
});

// Download file from FTP server
router.get('/download', async (req: Request, res: Response) => {
  // Track created temporary files for cleanup
  let tempFilePath: string | null = null;
  
  try {
    const validation = validateFTPCredentials();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const remotePath = req.query.remotePath as string;
    const localPathParam = req.query.localPath as string;
    
    if (!remotePath) {
      return res.status(400).json({
        success: false,
        message: 'Remote path is required'
      });
    }

    // Extract filename from the remote path
    const pathParts = remotePath.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        message: 'Invalid remote path - no filename detected'
      });
    }

    // Create temporary directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(tempDir)) {
      await fsPromises.mkdir(tempDir, { recursive: true });
    }
    
    // Use provided local path or create a temporary one
    const localFilePath = localPathParam || path.join(tempDir, filename);
    tempFilePath = localFilePath;
    
    // Ensure the directory for the local file exists
    const localDir = path.dirname(localFilePath);
    if (!fs.existsSync(localDir)) {
      await fsPromises.mkdir(localDir, { recursive: true });
    }
    
    // Use dynamic import to get the ftpService module
    const ftpService = await import('../services/ftpService');
    
    // Download the file
    const response = await ftpService.downloadFile(remotePath, localFilePath);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // Log the activity
    await storage.createActivity({
      action: 'File Downloaded from FTP',
      icon: 'download',
      iconColor: 'blue',
      details: formatActivityDetails({ 
        remotePath, 
        localPath: localFilePath,
        filename
      })
    });
    
    // Set content disposition header for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(localFilePath);
    fileStream.pipe(res);
    
    // Clean up the temporary file after it's been sent
    fileStream.on('end', async () => {
      // Only clean up if it's a temporary file (not user-provided local path)
      if (tempFilePath && !localPathParam) {
        try {
          await fsPromises.unlink(tempFilePath);
          tempFilePath = null;
        } catch (error) {
          console.error('Failed to delete temporary file:', error);
        }
      }
    });
    
    // Handle unexpected disconnection
    req.on('close', async () => {
      // Only clean up if it's a temporary file (not user-provided local path)
      if (tempFilePath && !localPathParam) {
        try {
          await fsPromises.unlink(tempFilePath);
          tempFilePath = null;
        } catch (error) {
          console.error('Failed to delete temporary file after connection close:', error);
        }
      }
    });
    
  } catch (error: any) {
    console.error('FTP Download Error:', error);
    
    // Clean up any temporary file if it exists (only if not user-provided)
    if (tempFilePath && !(req.query.localPath as string)) {
      try {
        await fsPromises.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error('Failed to delete temporary file after error:', unlinkError);
      }
    }
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP File Download Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ 
        remotePath: req.query.remotePath, 
        localPath: req.query.localPath,
        error: error.message
      })
    });
    
    return res.status(500).json({
      success: false,
      message: `Failed to download file: ${error.message}`
    });
  }
});

// Delete file on FTP server
router.post('/delete', async (req: Request, res: Response) => {
  try {
    const validation = validateFTPCredentials();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { path: remotePath, filename } = req.body;
    
    if (!remotePath || !filename) {
      return res.status(400).json({
        success: false,
        message: 'Path and filename are required'
      });
    }

    // Construct full remote path
    const fullRemotePath = `${remotePath}${remotePath.endsWith('/') ? '' : '/'}${filename}`;
    
    // Use dynamic import to get the ftpService module
    const ftpService = await import('../services/ftpService');
    
    // Use the ftpService.removeFile function
    const response = await ftpService.removeFile(fullRemotePath);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // Log the activity
    await storage.createActivity({
      action: 'File Deleted from FTP',
      icon: 'trash',
      iconColor: 'red',
      details: formatActivityDetails({ path: remotePath, filename })
    });
    
    return res.status(200).json({
      success: true,
      message: response.message || `Successfully deleted ${filename} from ${remotePath}`
    });
  } catch (error: any) {
    console.error('FTP Delete Error:', error);
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP File Delete Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ 
        path: req.body.path, 
        filename: req.body.filename,
        error: error.message
      })
    });
    
    return res.status(500).json({
      success: false,
      message: `Failed to delete file: ${error.message}`
    });
  }
});

// FTP connection details endpoint (for frontend)
router.get('/details', async (req: Request, res: Response) => {
  try {
    const validation = validateFTPCredentials();
    
    // Return basic connection info with the default connection ID
    return res.status(200).json({
      id: DEFAULT_FTP_CONNECTION_ID,
      isConfigured: validation.valid,
      host: validation.valid ? validation.credentials!.host : null,
      port: validation.valid ? validation.credentials!.port : null,
      username: validation.valid ? '********' : null,
    });
  } catch (error: any) {
    console.error('FTP Details Error:', error);
    
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve FTP details: ${error.message}`
    });
  }
});

// FTP environment information endpoint
router.get('/environment', async (req: Request, res: Response) => {
  try {
    const timestamp = new Date().toISOString();
    
    // Check environment variables and return their status (set or not)
    // but never return the actual values for security reasons
    return res.status(200).json({
      FTP_HOST: { 
        set: !!process.env.FTP_HOST, 
        value: process.env.FTP_HOST ? process.env.FTP_HOST : ''
      },
      FTP_USERNAME: { 
        set: !!process.env.FTP_USERNAME, 
        value: ''  // Never return the actual username
      },
      FTP_PASSWORD: { 
        set: !!process.env.FTP_PASSWORD, 
        value: ''  // Never return the actual password
      },
      FTP_PORT: { 
        set: !!process.env.FTP_PORT, 
        value: process.env.FTP_PORT || '21'
      },
      timestamp
    });
  } catch (error: any) {
    console.error('FTP Environment Error:', error);
    
    return res.status(500).json({
      success: false,
      message: `Failed to retrieve FTP environment info: ${error.message}`
    });
  }
});

// FTP connection test endpoint
router.get('/test', async (req: Request, res: Response) => {
  try {
    const validation = validateFTPCredentials();
    const timestamp = new Date().toISOString();
    
    if (!validation.valid) {
      return res.status(200).json({
        success: false,
        message: 'FTP connection not configured',
        details: validation.message,
        timestamp
      });
    }

    // Use dynamic import to get the ftpService module
    const ftpService = await import('../services/ftpService');
    
    // Use the ftpService.testConnection function
    const response = await ftpService.testConnection();
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // Log the activity
    await storage.createActivity({
      action: 'FTP Connection Test Successful',
      icon: 'check-circle',
      iconColor: 'green',
      details: formatActivityDetails({ message: response.message })
    });
    
    return res.status(200).json({
      success: true,
      message: 'FTP connection successful',
      details: response.message,
      timestamp
    });
  } catch (error: any) {
    console.error('FTP Test Error:', error);
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP Connection Test Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ error: error.message })
    });
    
    return res.status(200).json({
      success: false,
      message: 'FTP connection failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;