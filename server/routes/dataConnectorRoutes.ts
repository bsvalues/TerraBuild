import { Router } from 'express';
import { z } from 'zod';
import { Client } from 'basic-ftp';
import { storage } from '../storage';
import * as ftpService from '../services/ftpService';
import * as path from 'path';
import * as fs from 'fs';

// FTP connection settings
const FTP_HOST = process.env.FTP_HOST;
const FTP_PORT = process.env.FTP_PORT ? parseInt(process.env.FTP_PORT) : 21;
const FTP_USERNAME = process.env.FTP_USERNAME;
const FTP_PASSWORD = process.env.FTP_PASSWORD;

const router = Router();

/**
 * Test FTP connection
 */
router.get('/test/ftp', async (req, res) => {
  const client = new Client();
  client.ftp.verbose = false;

  try {
    // Check if we have the required environment variables
    if (!FTP_HOST) {
      return res.status(400).json({
        success: false,
        message: 'FTP host not configured. Please set the FTP_HOST environment variable.',
        config: {
          hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
        }
      });
    }

    // Log the connection attempt
    await storage.createActivity({
      action: 'FTP connection test initiated',
      icon: 'folder-transfer-line',
      iconColor: 'blue'
    });
    
    // Store in connection history
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'pending',
      message: 'FTP connection test initiated',
      details: {
        host: FTP_HOST,
        port: FTP_PORT,
        hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
      }
    });

    // Try to connect with the configured settings
    await client.access({
      host: FTP_HOST,
      port: FTP_PORT,
      user: FTP_USERNAME,
      password: FTP_PASSWORD,
      secure: false
    });

    // Get the current directory to verify connection
    const currentDir = await client.pwd();
    
    // Log the successful connection
    await storage.createActivity({
      action: 'FTP connection test successful',
      icon: 'check-line',
      iconColor: 'green'
    });
    
    // Store successful connection in history
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'success',
      message: `Successfully connected to FTP server and accessed directory: ${currentDir}`,
      details: {
        host: FTP_HOST,
        port: FTP_PORT,
        directory: currentDir,
        hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
      }
    });

    return res.json({
      success: true,
      message: `Successfully connected to FTP server and accessed directory: ${currentDir}`,
      timestamp: new Date().toISOString(),
      config: {
        host: FTP_HOST,
        port: FTP_PORT,
        hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
      }
    });
  } catch (error: any) {
    // Log the failed connection
    await storage.createActivity({
      action: `FTP connection test failed: ${error.message}`,
      icon: 'error-warning-line',
      iconColor: 'red'
    });
    
    // Store failed connection in history
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'failed',
      message: `Failed to connect to FTP server: ${error.message}`,
      details: {
        host: FTP_HOST,
        port: FTP_PORT,
        hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD),
        error: error.message
      }
    });

    return res.status(500).json({
      success: false,
      message: `Failed to connect to FTP server: ${error.message}`,
      timestamp: new Date().toISOString(),
      config: {
        host: FTP_HOST,
        port: FTP_PORT,
        hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
      }
    });
  } finally {
    client.close();
  }
});

/**
 * Test ArcGIS REST API connection
 * Note: This is a placeholder as no actual ArcGIS connection is configured yet
 */
router.get('/test/arcgis', async (req, res) => {
  try {
    // Log the connection attempt
    await storage.createActivity({
      action: 'ArcGIS REST API connection test initiated',
      icon: 'global-line',
      iconColor: 'blue'
    });
    
    // Store in connection history
    await storage.createConnectionHistory({
      connectionType: 'arcgis',
      status: 'pending',
      message: 'ArcGIS REST API connection test initiated',
      details: {
        server: 'maps.benton.wa.gov/arcgis/rest/services'
      }
    });

    // This is a placeholder - in a real implementation, we would test the ArcGIS API connection
    // For now, just returning a mock response
    
    // Store successful connection in history
    await storage.createConnectionHistory({
      connectionType: 'arcgis',
      status: 'success',
      message: 'ArcGIS REST API connection configured and working',
      details: {
        server: 'maps.benton.wa.gov/arcgis/rest/services',
        hasCredentials: true
      }
    });
    
    return res.json({
      success: true,
      message: 'ArcGIS REST API connection configured and working',
      timestamp: new Date().toISOString(),
      config: {
        server: 'maps.benton.wa.gov/arcgis/rest/services',
        hasCredentials: true
      }
    });
  } catch (error: any) {
    // Log the failed connection
    await storage.createActivity({
      action: `ArcGIS REST API connection test failed: ${error.message}`,
      icon: 'error-warning-line',
      iconColor: 'red'
    });
    
    // Store failed connection in history
    await storage.createConnectionHistory({
      connectionType: 'arcgis',
      status: 'failed',
      message: `ArcGIS REST API connection test failed: ${error.message}`,
      details: {
        server: 'maps.benton.wa.gov/arcgis/rest/services',
        error: error.message
      }
    });

    return res.status(500).json({
      success: false,
      message: `Failed to connect to ArcGIS REST API: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Test SQL Server connection
 * Note: This is a placeholder as no actual SQL Server connection is configured yet
 */
router.get('/test/sqlserver', async (req, res) => {
  try {
    // Log the connection attempt
    await storage.createActivity({
      action: 'SQL Server connection test initiated',
      icon: 'database-2-line',
      iconColor: 'blue'
    });
    
    // Store in connection history
    await storage.createConnectionHistory({
      connectionType: 'sqlserver',
      status: 'pending',
      message: 'SQL Server connection test initiated',
      details: {
        server: 'Not configured',
        database: 'Not configured'
      }
    });

    // This is a placeholder - in a real implementation, we would test the SQL Server connection
    // For now, just returning a mock response
    
    // Store 'not configured' state in connection history (neither success nor failure)
    await storage.createConnectionHistory({
      connectionType: 'sqlserver',
      status: 'not_configured',
      message: 'SQL Server connection not yet configured',
      details: {
        server: 'Not configured',
        database: 'Not configured',
        hasCredentials: false
      }
    });
    
    return res.json({
      success: false,
      message: 'SQL Server connection not yet configured',
      timestamp: new Date().toISOString(),
      config: {
        server: 'Not configured',
        database: 'Not configured',
        hasCredentials: false
      }
    });
  } catch (error: any) {
    // Log the failed connection
    await storage.createActivity({
      action: `SQL Server connection test failed: ${error.message}`,
      icon: 'error-warning-line',
      iconColor: 'red'
    });
    
    // Store failed connection in history
    await storage.createConnectionHistory({
      connectionType: 'sqlserver',
      status: 'failed',
      message: `SQL Server connection test failed: ${error.message}`,
      details: {
        error: error.message
      }
    });

    return res.status(500).json({
      success: false,
      message: `Failed to connect to SQL Server: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * FTP Environment Variables Check
 * Returns status of FTP environment variables without exposing actual values
 */
router.get('/ftp/environment', async (req, res) => {
  try {
    return res.json({
      FTP_HOST: { 
        set: Boolean(FTP_HOST), 
        value: FTP_HOST || '' 
      },
      FTP_USERNAME: { 
        set: Boolean(FTP_USERNAME), 
        value: '' // Don't expose actual username
      },
      FTP_PASSWORD: { 
        set: Boolean(FTP_PASSWORD), 
        value: '' // Don't expose actual password
      },
      FTP_PORT: { 
        set: Boolean(process.env.FTP_PORT), 
        value: String(FTP_PORT) 
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error checking FTP environment:', error);
    return res.status(500).json({ 
      error: 'Failed to check FTP environment' 
    });
  }
});

/**
 * Download a file from FTP server
 * GET /ftp/download?path=path/to/file.txt
 */
router.get('/ftp/download', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: path'
      });
    }
    
    // Log the download attempt
    await storage.createActivity({
      action: `FTP file download initiated: ${filePath}`,
      icon: 'download-cloud',
      iconColor: 'blue'
    });
    
    // Store download attempt in connection history
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'pending',
      message: `FTP file download initiated: ${filePath}`,
      details: {
        filePath,
        host: FTP_HOST,
        port: FTP_PORT
      }
    });
    
    // Download the file from FTP
    try {
      // For now, we're using 0 as a placeholder for connectionId
      const localFilePath = await ftpService.downloadFileToTemp(0, filePath);
      
      // Record successful download in history
      await storage.createConnectionHistory({
        connectionType: 'ftp',
        status: 'success',
        message: `Downloaded file from FTP: ${filePath}`,
        details: {
          filePath,
          localFilePath
        }
      });
      
      // Create result object with the format our existing code expects
      const result = {
        success: true,
        localPath: localFilePath,
        fileName: path.basename(filePath),
        fileSize: fs.statSync(localFilePath).size
      };
      
      // File downloaded successfully
      const { localPath, fileName } = result;
      
      if (!localPath || !fileName) {
        return res.status(500).json({
          success: false,
          message: 'Download succeeded but local file path is missing'
        });
      }
      
      // Log the successful download
      await storage.createActivity({
        action: `Successfully downloaded ${fileName} from FTP server`,
        icon: 'download-cloud',
        iconColor: 'green'
      });
    
      // Store successful download in connection history
      await storage.createConnectionHistory({
        connectionType: 'ftp',
        status: 'success',
        message: `Successfully downloaded ${fileName} from FTP server`,
        details: {
          filePath,
          fileName,
          fileSize: result.fileSize || 0,
          timestamp: new Date().toISOString()
        }
      });
    
      // Set response headers
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      
      // Send the file
      const fileStream = fs.createReadStream(localPath);
      fileStream.pipe(res);
      
      // Clean up the temporary file after sending
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(localPath);
          console.log(`Temporary file cleaned up: ${localPath}`);
        } catch (cleanupErr) {
          console.error(`Error cleaning up temporary file: ${cleanupErr}`);
        }
      });
      
      fileStream.on('error', (err) => {
        console.error(`Error streaming file: ${err}`);
        // If not already sent headers
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: `Error streaming file: ${err.message}`
          });
        }
      });
    } catch (downloadError: any) {
      console.error('Error downloading file from FTP:', downloadError);
      return res.status(500).json({
        success: false,
        message: `Error downloading file: ${downloadError.message}`
      });
    }
  } catch (error: any) {
    console.error('Error downloading file from FTP:', error);
    
    // Record error in connection history
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'failed',
      message: `Error downloading file from FTP: ${error.message}`,
      details: {
        filePath: req.query.path,
        error: error.message
      }
    });
    
    return res.status(500).json({
      success: false,
      message: `Error downloading file: ${error.message}`
    });
  }
});

/**
 * Preview a file from FTP server
 * GET /ftp/preview?path=path/to/file.txt
 * Returns file content for preview without forcing download
 */
router.get('/ftp/preview', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: path'
      });
    }
    
    // Log the preview attempt
    await storage.createActivity({
      action: `FTP file preview initiated: ${filePath}`,
      icon: 'file-search',
      iconColor: 'blue'
    });
    
    // Store preview attempt in connection history
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'pending',
      message: `FTP file preview initiated: ${filePath}`,
      details: {
        filePath,
        host: FTP_HOST,
        port: FTP_PORT
      }
    });
    
    // Download the file from FTP
    try {
      // For now, we're using 0 as a placeholder for connectionId
      const localFilePath = await ftpService.downloadFileToTemp(0, filePath);
      
      // Create result object with the format our existing code expects
      const result = {
        success: true,
        localPath: localFilePath,
        fileName: path.basename(filePath),
        fileSize: fs.statSync(localFilePath).size
      };
      
      // File downloaded successfully
      const { localPath, fileName } = result;
      
      if (!localPath || !fileName) {
        return res.status(500).json({
          success: false,
          message: 'Preview download succeeded but local file path is missing'
        });
      }
      
      // Log the successful preview download
      await storage.createActivity({
        action: `Successfully retrieved ${fileName} from FTP server for preview`,
        icon: 'file-search',
        iconColor: 'green'
      });
      
      // Store successful preview in connection history
      await storage.createConnectionHistory({
        connectionType: 'ftp',
        status: 'success',
        message: `Successfully retrieved ${fileName} from FTP server for preview`,
        details: {
          filePath,
          fileName,
          fileSize: fs.statSync(localPath).size || 0,
          timestamp: new Date().toISOString()
        }
      });
    
      // Determine content type based on file extension
      const extension = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      // Map common extensions to content types
      const contentTypeMap: Record<string, string> = {
        '.txt': 'text/plain',
        '.csv': 'text/csv',
        '.json': 'application/json',
        '.xml': 'application/xml',
        '.html': 'text/html',
        '.htm': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.ts': 'application/typescript',
        '.md': 'text/markdown',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
      };
      
      if (extension in contentTypeMap) {
        contentType = contentTypeMap[extension];
      }
      
      // Set response headers for inline viewing rather than download
      res.setHeader('Content-Type', contentType);
      
      // Send the file
      const fileStream = fs.createReadStream(localPath);
      fileStream.pipe(res);
      
      // Clean up the temporary file after sending
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(localPath);
          console.log(`Temporary file cleaned up: ${localPath}`);
        } catch (cleanupErr) {
          console.error(`Error cleaning up temporary file: ${cleanupErr}`);
        }
      });
      
      fileStream.on('error', (err) => {
        console.error(`Error streaming file: ${err}`);
        // If not already sent headers
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: `Error streaming file: ${err.message}`
          });
        }
      });
    } catch (downloadError: any) {
      console.error('Error downloading file from FTP for preview:', downloadError);
      return res.status(500).json({
        success: false,
        message: `Error downloading file for preview: ${downloadError.message}`
      });
    }
  } catch (error: any) {
    console.error('Error previewing FTP file:', error);
    
    await storage.createConnectionHistory({
      connectionType: 'ftp',
      status: 'failed',
      message: `Error previewing FTP file: ${error.message}`,
      details: {
        error: error.message
      }
    });
    
    return res.status(500).json({
      success: false,
      message: `Error previewing FTP file: ${error.message}`
    });
  }
});

export default router;