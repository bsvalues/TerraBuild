import express from 'express';
import { storage } from '../storage';
import { FTPClient } from '../services/ftpService';
import * as z from 'zod';
import { FTPConnection, InsertFTPConnection, insertFTPConnectionSchema } from '@shared/schema';
import { zodToJsonSchema } from 'zod-to-json-schema';

const router = express.Router();

// Validation schema for FTP connection test
const testFTPConnectionSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().int().min(1).max(65535).default(21),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  secure: z.boolean().default(false),
  passiveMode: z.boolean().default(true),
  path: z.string().optional().default("/")
});

/**
 * @route GET /api/ftp-connections
 * @desc Get all FTP connections
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const connections = await storage.getAllFTPConnections();
    
    // Mask sensitive information
    const sanitizedConnections = connections.map(conn => ({
      ...conn,
      password: '********'
    }));
    
    res.json(sanitizedConnections);
  } catch (error) {
    console.error('Error fetching FTP connections:', error);
    res.status(500).json({ message: 'Failed to fetch FTP connections', error: error.message });
  }
});

/**
 * @route GET /api/ftp-connections/default
 * @desc Get default FTP connection
 * @access Private
 */
router.get('/default', async (req, res) => {
  try {
    const connection = await storage.getDefaultFTPConnection();
    
    if (!connection) {
      return res.status(404).json({ message: 'No default FTP connection found' });
    }
    
    // Mask sensitive information
    const sanitizedConnection = {
      ...connection,
      password: '********'
    };
    
    res.json(sanitizedConnection);
  } catch (error) {
    console.error('Error fetching default FTP connection:', error);
    res.status(500).json({ message: 'Failed to fetch default FTP connection', error: error.message });
  }
});

/**
 * @route GET /api/ftp-connections/user/:userId
 * @desc Get FTP connections by user ID
 * @access Private
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const connections = await storage.getFTPConnectionsByUser(userId);
    
    // Mask sensitive information
    const sanitizedConnections = connections.map(conn => ({
      ...conn,
      password: '********'
    }));
    
    res.json(sanitizedConnections);
  } catch (error) {
    console.error('Error fetching user FTP connections:', error);
    res.status(500).json({ message: 'Failed to fetch user FTP connections', error: error.message });
  }
});

/**
 * @route GET /api/ftp-connections/:id
 * @desc Get FTP connection by ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }
    
    const connection = await storage.getFTPConnection(id);
    
    if (!connection) {
      return res.status(404).json({ message: 'FTP connection not found' });
    }
    
    // Mask sensitive information
    const sanitizedConnection = {
      ...connection,
      password: '********'
    };
    
    res.json(sanitizedConnection);
  } catch (error) {
    console.error('Error fetching FTP connection:', error);
    res.status(500).json({ message: 'Failed to fetch FTP connection', error: error.message });
  }
});

/**
 * @route POST /api/ftp-connections
 * @desc Create a new FTP connection
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validationResult = insertFTPConnectionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid FTP connection data', 
        errors: validationResult.error.errors 
      });
    }
    
    // Set default values
    const connectionData: InsertFTPConnection = {
      ...validationResult.data,
      isDefault: req.body.isDefault || false
    };
    
    // Create the FTP connection
    const connection = await storage.createFTPConnection(connectionData);
    
    // Mask sensitive information in response
    const sanitizedConnection = {
      ...connection,
      password: '********'
    };
    
    res.status(201).json(sanitizedConnection);
  } catch (error) {
    console.error('Error creating FTP connection:', error);
    res.status(500).json({ message: 'Failed to create FTP connection', error: error.message });
  }
});

/**
 * @route PUT /api/ftp-connections/:id
 * @desc Update an FTP connection
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }
    
    // Validate that connection exists
    const existingConnection = await storage.getFTPConnection(id);
    
    if (!existingConnection) {
      return res.status(404).json({ message: 'FTP connection not found' });
    }
    
    // Update the connection
    const connection = await storage.updateFTPConnection(id, req.body);
    
    // Mask sensitive information in response
    const sanitizedConnection = {
      ...connection,
      password: '********'
    };
    
    res.json(sanitizedConnection);
  } catch (error) {
    console.error('Error updating FTP connection:', error);
    res.status(500).json({ message: 'Failed to update FTP connection', error: error.message });
  }
});

/**
 * @route DELETE /api/ftp-connections/:id
 * @desc Delete an FTP connection
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid connection ID. The ID must be a valid number.' 
      });
    }
    
    // Validate that connection exists
    const existingConnection = await storage.getFTPConnection(id);
    
    if (!existingConnection) {
      return res.status(404).json({ 
        success: false, 
        message: `FTP connection with ID ${id} not found` 
      });
    }
    
    try {
      // Delete the connection - this may throw errors if the connection is in use
      await storage.deleteFTPConnection(id);
      
      // If successful, return a success response
      return res.status(200).json({
        success: true,
        message: `FTP connection '${existingConnection.name}' successfully deleted`
      });
    } catch (deleteError) {
      // Handle specific error cases
      const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
      
      if (errorMessage.includes('has associated sync schedules')) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete this connection because it has associated sync schedules. Please delete all schedules using this connection first.',
          detail: errorMessage
        });
      } else {
        throw deleteError; // Re-throw for general error handling
      }
    }
  } catch (error) {
    console.error('Error deleting FTP connection:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete FTP connection', 
      detail: errorMessage 
    });
  }
});

/**
 * @route PUT /api/ftp-connections/:id/set-default
 * @desc Set an FTP connection as the default
 * @access Private
 */
router.put('/:id/set-default', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }
    
    // Validate that connection exists
    const existingConnection = await storage.getFTPConnection(id);
    
    if (!existingConnection) {
      return res.status(404).json({ message: 'FTP connection not found' });
    }
    
    // Set as default
    const connection = await storage.setDefaultFTPConnection(id);
    
    // Mask sensitive information in response
    const sanitizedConnection = {
      ...connection,
      password: '********'
    };
    
    res.json(sanitizedConnection);
  } catch (error) {
    console.error('Error setting default FTP connection:', error);
    res.status(500).json({ message: 'Failed to set default FTP connection', error: error.message });
  }
});

/**
 * @route POST /api/ftp-connections/test
 * @desc Test an FTP connection without saving it
 * @access Private
 */
router.post('/test', async (req, res) => {
  const ftpClient = new FTPClient();
  let connected = false;
  
  try {
    // Validate request body
    const validationResult = testFTPConnectionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid FTP connection data', 
        errors: validationResult.error.errors 
      });
    }
    
    const { host, port, username, password, secure, passiveMode, path } = validationResult.data;
    
    // Test the connection
    await ftpClient.connect({
      host,
      port,
      user: username,
      password,
      secure
    });
    
    connected = true;
    
    if (passiveMode) {
      await ftpClient.setPassive();
    }
    
    // Try to list directory to confirm access
    const files = await ftpClient.list(path || '/');
    
    // Log the successful connection
    await storage.createConnectionHistory({
      message: 'FTP connection test successful',
      status: 'success',
      connectionType: 'ftp',
      details: {
        host,
        port,
        username,
        secure,
        passiveMode,
        path,
        fileCount: files.length
      },
      userId: req.body.userId || 1 // Use authenticated user ID
    });
    
    res.json({
      success: true,
      message: 'Connection successful',
      files: files.slice(0, 10), // Return first 10 files as a sample
      totalFiles: files.length
    });
  } catch (error) {
    console.error('FTP test connection error:', error);
    
    // Log the failed connection
    await storage.createConnectionHistory({
      message: 'FTP connection test failed',
      status: 'error',
      connectionType: 'ftp',
      details: {
        host: req.body.host,
        port: req.body.port,
        username: req.body.username,
        secure: req.body.secure,
        passiveMode: req.body.passiveMode,
        path: req.body.path,
        error: error.message
      },
      userId: req.body.userId || 1 // Use authenticated user ID
    });
    
    res.status(400).json({
      success: false,
      message: 'Connection failed',
      error: error.message
    });
  } finally {
    if (connected) {
      await ftpClient.close();
    }
  }
});

/**
 * @route POST /api/ftp-connections/:id/test
 * @desc Test a saved FTP connection
 * @access Private
 */
router.post('/:id/test', async (req, res) => {
  const ftpClient = new FTPClient();
  let connected = false;
  
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid connection ID' });
    }
    
    // Get the connection from storage
    const connection = await storage.getFTPConnection(id);
    
    if (!connection) {
      return res.status(404).json({ message: 'FTP connection not found' });
    }
    
    // Test the connection
    await ftpClient.connect({
      host: connection.host,
      port: connection.port,
      user: connection.username,
      password: connection.password,
      secure: connection.secure
    });
    
    connected = true;
    
    if (connection.passiveMode) {
      await ftpClient.setPassive();
    }
    
    // Try to list directory to confirm access
    const path = req.body.path || connection.defaultPath || '/';
    const files = await ftpClient.list(path);
    
    // Update the connection status
    await storage.updateFTPConnectionStatus(id, 'active', new Date());
    
    // Log the successful connection
    await storage.createConnectionHistory({
      message: 'FTP connection test successful',
      status: 'success',
      connectionType: 'ftp',
      details: {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        path,
        fileCount: files.length
      },
      userId: req.body.userId || connection.createdBy
    });
    
    res.json({
      success: true,
      message: 'Connection successful',
      files: files.slice(0, 10), // Return first 10 files as a sample
      totalFiles: files.length
    });
  } catch (error) {
    console.error('FTP test connection error:', error);
    
    // Get the connection from storage
    const id = parseInt(req.params.id);
    const connection = await storage.getFTPConnection(id);
    
    if (connection) {
      // Update the connection status
      await storage.updateFTPConnectionStatus(id, 'error');
      
      // Log the failed connection
      await storage.createConnectionHistory({
        message: 'FTP connection test failed',
        status: 'error',
        connectionType: 'ftp',
        details: {
          id: connection.id,
          name: connection.name,
          host: connection.host,
          port: connection.port,
          path: req.body.path || connection.defaultPath || '/',
          error: error.message
        },
        userId: req.body.userId || connection.createdBy
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Connection failed',
      error: error.message
    });
  } finally {
    if (connected) {
      await ftpClient.close();
    }
  }
});

export default router;