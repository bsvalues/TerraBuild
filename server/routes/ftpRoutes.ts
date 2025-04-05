import { Router, Request, Response } from 'express';
import multer from 'multer';
import FTPClient from '../services/ftpService';
import { storage } from '../storage';
import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';

// Helper function for safe activity details formatting
// The details field in activities table is defined as a json type
// This helper ensures we're passing a proper JSON object, not a string
const formatActivityDetails = (details: any): Record<string, any> => {
  if (typeof details === 'string') {
    // Handle string details by making it a message object
    return { message: details };
  } else if (details && typeof details === 'object') {
    // Return object for storage
    return details;
  }
  return { data: String(details) };
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
    const client = new FTPClient();
    const remotePath = (req.query.path as string) || '/';
    
    await client.connect({
      host,
      port,
      user: username,
      password,
      secure: false
    });
    
    const files = await client.list(remotePath);
    
    // Log the activity
    await storage.createActivity({
      action: 'FTP Directory Listed',
      icon: 'folder-open',
      iconColor: 'blue',
      details: formatActivityDetails({ path: remotePath, fileCount: files.length })
    });
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      message: `Listed ${files.length} files in directory ${remotePath}`,
      files
    });
  } catch (error: any) {
    console.error('FTP List Error:', error);
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP Directory List Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ path: req.query.path, error: error.message })
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

    const { host, port, username, password } = validation.credentials!;
    const client = new FTPClient();
    const remotePath = req.body.path || '/';
    const uploadedFile = req.file;
    
    await client.connect({
      host,
      port,
      user: username,
      password,
      secure: false
    });
    
    // Upload the file
    await client.upload(
      uploadedFile.path,
      `${remotePath}${remotePath.endsWith('/') ? '' : '/'}${uploadedFile.originalname}`
    );
    
    // Clean up temporary file
    await fsPromises.unlink(uploadedFile.path);
    
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
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${uploadedFile.originalname} to ${remotePath}`,
      file: {
        name: uploadedFile.originalname,
        size: uploadedFile.size,
        path: remotePath
      }
    });
  } catch (error: any) {
    console.error('FTP Upload Error:', error);
    
    // Clean up temporary file if it exists
    if (req.file) {
      try {
        await fsPromises.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Failed to delete temporary file:', unlinkError);
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
  try {
    const validation = validateFTPCredentials();
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const remotePath = req.query.path as string;
    const filename = req.query.filename as string;
    
    if (!remotePath || !filename) {
      return res.status(400).json({
        success: false,
        message: 'Path and filename are required'
      });
    }

    const { host, port, username, password } = validation.credentials!;
    const client = new FTPClient();
    
    await client.connect({
      host,
      port,
      user: username,
      password,
      secure: false
    });
    
    // Create temporary directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(tempDir)) {
      await fsPromises.mkdir(tempDir, { recursive: true });
    }
    
    // Temporary local file path
    const localFilePath = path.join(tempDir, filename);
    
    // Download the file
    await client.download(
      `${remotePath}${remotePath.endsWith('/') ? '' : '/'}${filename}`,
      localFilePath
    );
    
    // Log the activity
    await storage.createActivity({
      action: 'File Downloaded from FTP',
      icon: 'download',
      iconColor: 'blue',
      details: formatActivityDetails({ path: remotePath, filename })
    });
    
    await client.close();
    
    // Set content disposition header for download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(localFilePath);
    fileStream.pipe(res);
    
    // Clean up the temporary file after it's been sent
    fileStream.on('end', async () => {
      try {
        await fsPromises.unlink(localFilePath);
      } catch (error) {
        console.error('Failed to delete temporary file:', error);
      }
    });
    
  } catch (error: any) {
    console.error('FTP Download Error:', error);
    
    // Log the failed activity
    await storage.createActivity({
      action: 'FTP File Download Failed',
      icon: 'x-circle',
      iconColor: 'red',
      details: formatActivityDetails({ 
        path: req.query.path, 
        filename: req.query.filename,
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

    const { host, port, username, password } = validation.credentials!;
    const client = new FTPClient();
    
    await client.connect({
      host,
      port,
      user: username,
      password,
      secure: false
    });
    
    // Delete the file
    await client.delete(`${remotePath}${remotePath.endsWith('/') ? '' : '/'}${filename}`);
    
    // Log the activity
    await storage.createActivity({
      action: 'File Deleted from FTP',
      icon: 'trash',
      iconColor: 'red',
      details: formatActivityDetails({ path: remotePath, filename })
    });
    
    await client.close();
    
    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${filename} from ${remotePath}`
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
      action: 'FTP Connection Test Successful',
      icon: 'check-circle',
      iconColor: 'green',
      details: formatActivityDetails({ message: `Connected to ${host}:${port}` })
    });
    
    // Close the connection
    await client.close();
    
    return res.status(200).json({
      success: true,
      message: 'FTP connection successful',
      details: `Successfully connected to ${host}:${port}`,
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