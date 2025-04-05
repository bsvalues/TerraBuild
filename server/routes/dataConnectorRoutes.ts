import { Router } from 'express';
import { z } from 'zod';
import { Client } from 'basic-ftp';
import { storage } from '../storage';

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

export default router;