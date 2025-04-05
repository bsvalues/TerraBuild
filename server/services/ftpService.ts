import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Test connection to the FTP server using environment variables
 * 
 * @returns Promise with test results
 */
export async function testConnection(): Promise<{success: boolean; message: string}> {
  // Get FTP credentials from environment variables
  const config = {
    host: process.env.FTP_HOST || '',
    port: parseInt(process.env.FTP_PORT || '21'),
    user: process.env.FTP_USERNAME || '',
    password: process.env.FTP_PASSWORD || '',
    secure: false
  };
  
  // Validate config
  if (!config.host) {
    return {
      success: false,
      message: 'FTP host not configured. Please set the FTP_HOST environment variable.'
    };
  }
  
  if (!config.user) {
    return {
      success: false,
      message: 'FTP username not configured. Please set the FTP_USERNAME environment variable.'
    };
  }
  
  if (!config.password) {
    return {
      success: false,
      message: 'FTP password not configured. Please set the FTP_PASSWORD environment variable.'
    };
  }
  
  // Try to connect
  try {
    const result = await FTPService.testConnection(config);
    
    if (result) {
      return {
        success: true,
        message: 'Successfully connected to FTP server'
      };
    } else {
      return {
        success: false,
        message: 'Failed to connect to FTP server'
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `FTP connection error: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * List files in a directory on the FTP server
 * 
 * @param remotePath Path on the FTP server to list
 * @returns Promise with list results
 */
export async function listFiles(remotePath: string = '/'): Promise<{
  success: boolean;
  message: string;
  files?: Array<{
    name: string;
    type: string;
    size: number;
    modifiedDate: string;
    permissions: string;
  }>;
}> {
  const ftpService = new FTPService();
  
  try {
    // Get FTP credentials from environment variables
    const config = {
      host: process.env.FTP_HOST || '',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    };
    
    // Validate config
    if (!config.host || !config.user || !config.password) {
      return {
        success: false,
        message: 'FTP configuration is incomplete. Please check environment variables.'
      };
    }
    
    // Connect to FTP server
    await ftpService.connect(config);
    
    try {
      // List files
      const fileInfoList = await ftpService.listFiles(remotePath);
      
      // Map to a simplified format
      const files = fileInfoList.map(file => ({
        name: file.name,
        type: file.type === 2 ? 'directory' : 'file',
        size: file.size,
        modifiedDate: file.modifiedAt ? file.modifiedAt.toISOString() : '',
        permissions: file.permissions || ''
      }));
      
      return {
        success: true,
        message: `Successfully listed ${files.length} files in ${remotePath}`,
        files
      };
    } finally {
      // Always disconnect
      await ftpService.disconnect();
    }
  } catch (error: any) {
    // Ensure disconnect
    try {
      await ftpService.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return {
      success: false,
      message: `Error listing files: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Create a directory on the FTP server
 * 
 * @param remotePath Path on the FTP server for the new directory
 * @returns Promise with creation results
 */
export async function createDirectory(remotePath: string): Promise<{success: boolean; message: string}> {
  const ftpService = new FTPService();
  
  try {
    // Get FTP credentials from environment variables
    const config = {
      host: process.env.FTP_HOST || '',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    };
    
    // Validate config
    if (!config.host || !config.user || !config.password) {
      return {
        success: false,
        message: 'FTP configuration is incomplete. Please check environment variables.'
      };
    }
    
    // Connect to FTP server
    await ftpService.connect(config);
    
    try {
      // Create directory
      await ftpService.createDirectory(remotePath);
      
      return {
        success: true,
        message: `Successfully created directory: ${remotePath}`
      };
    } finally {
      // Always disconnect
      await ftpService.disconnect();
    }
  } catch (error: any) {
    // Ensure disconnect
    try {
      await ftpService.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return {
      success: false,
      message: `Error creating directory: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Remove a file from the FTP server
 * 
 * @param remotePath Path to the file to remove
 * @returns Promise with removal results
 */
export async function removeFile(remotePath: string): Promise<{success: boolean; message: string}> {
  const ftpService = new FTPService();
  
  try {
    // Get FTP credentials from environment variables
    const config = {
      host: process.env.FTP_HOST || '',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    };
    
    // Validate config
    if (!config.host || !config.user || !config.password) {
      return {
        success: false,
        message: 'FTP configuration is incomplete. Please check environment variables.'
      };
    }
    
    // Connect to FTP server
    await ftpService.connect(config);
    
    try {
      // Delete file
      await ftpService.deleteFile(remotePath);
      
      return {
        success: true,
        message: `Successfully deleted file: ${remotePath}`
      };
    } finally {
      // Always disconnect
      await ftpService.disconnect();
    }
  } catch (error: any) {
    // Ensure disconnect
    try {
      await ftpService.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return {
      success: false,
      message: `Error deleting file: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Upload a file to the FTP server
 * 
 * @param localPath Path to the local file to upload
 * @param remotePath Destination path on the FTP server
 * @returns Promise with upload results
 */
export async function uploadFile(localPath: string, remotePath: string): Promise<{success: boolean; message: string}> {
  const ftpService = new FTPService();
  
  try {
    // Get FTP credentials from environment variables
    const config = {
      host: process.env.FTP_HOST || '',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    };
    
    // Validate config
    if (!config.host || !config.user || !config.password) {
      return {
        success: false,
        message: 'FTP configuration is incomplete. Please check environment variables.'
      };
    }
    
    // Check if local file exists
    if (!fs.existsSync(localPath)) {
      return {
        success: false,
        message: `Local file not found: ${localPath}`
      };
    }
    
    // Connect to FTP server
    await ftpService.connect(config);
    
    try {
      // Upload file
      await ftpService.uploadFile(localPath, remotePath);
      
      return {
        success: true,
        message: `Successfully uploaded file to ${remotePath}`
      };
    } finally {
      // Always disconnect
      await ftpService.disconnect();
    }
  } catch (error: any) {
    // Ensure disconnect
    try {
      await ftpService.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return {
      success: false,
      message: `Error uploading file: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Download file to a temporary location
 * Used by external modules to download a file and get its path
 * 
 * @param connectionId ID of the FTP connection
 * @param remotePath Remote path on FTP server
 * @returns Promise with the local file path
 */
export async function downloadFileToTemp(
  connectionId: number,
  remotePath: string
): Promise<string> {
  const ftpService = new FTPService();
  
  try {
    // Get FTP credentials from storage
    // For now, use environment variables
    const config = {
      host: process.env.FTP_HOST || '',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    };
    
    // Validate config
    if (!config.host || !config.user || !config.password) {
      throw new Error('FTP configuration is incomplete. Please check environment variables.');
    }
    
    // Connect to FTP server
    await ftpService.connect(config);
    
    // Download file to temp location
    const tempFilePath = await ftpService.downloadToTemp(remotePath);
    
    return tempFilePath;
  } finally {
    // Always disconnect
    try {
      await ftpService.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  }
}

/**
 * Upload content directly to FTP server without storing on disk first.
 * Used for exporting data directly from memory to the FTP server.
 * 
 * @param content Content to upload (string or buffer)
 * @param remotePath Remote path on FTP server
 * @returns Promise that resolves with upload results
 */
export async function uploadContent(
  content: string | Buffer,
  remotePath: string
): Promise<{success: boolean; message: string}> {
  const ftpService = new FTPService();
  
  try {
    // Get FTP credentials from environment variables
    const config = {
      host: process.env.FTP_HOST || '',
      port: parseInt(process.env.FTP_PORT || '21'),
      user: process.env.FTP_USERNAME || '',
      password: process.env.FTP_PASSWORD || '',
      secure: false
    };
    
    // Validate config
    if (!config.host || !config.user || !config.password) {
      return {
        success: false,
        message: 'FTP configuration is incomplete. Please check environment variables.'
      };
    }
    
    // Connect to FTP server
    await ftpService.connect(config);
    
    // Create a temporary file
    const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.tmp`);
    
    try {
      // Write content to temp file
      if (typeof content === 'string') {
        fs.writeFileSync(tempFilePath, content, 'utf8');
      } else {
        fs.writeFileSync(tempFilePath, content);
      }
      
      // Upload the temp file
      await ftpService.uploadFile(tempFilePath, remotePath);
      
      return {
        success: true,
        message: `Successfully uploaded content to ${remotePath}`
      };
    } finally {
      // Clean up temp file
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      // Disconnect from FTP
      await ftpService.disconnect();
    }
  } catch (error: any) {
    // Ensure disconnect
    try {
      await ftpService.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    
    return {
      success: false,
      message: `Error uploading content: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * FTP Service for managing FTP connections and file operations
 */
export class FTPService {
  private client: ftp.Client;
  private config: {
    host: string;
    port: number;
    user: string;
    password: string;
    secure: boolean;
  };
  private connected: boolean = false;
  private tempDir: string;

  /**
   * Create a new FTP Service instance
   */
  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = process.env.NODE_ENV === 'development';
    this.tempDir = path.join(os.tmpdir(), 'bcbs-ftp-temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Default config - will be overridden in connect()
    this.config = {
      host: '',
      port: 21,
      user: '',
      password: '',
      secure: false
    };
  }

  /**
   * Connect to FTP server with the provided config
   */
  async connect(config: {
    host: string;
    port?: number;
    user: string;
    password: string;
    secure?: boolean;
  }): Promise<boolean> {
    // If we're already connected, first disconnect
    if (this.connected) {
      await this.disconnect();
    }

    try {
      this.config = {
        host: config.host,
        port: config.port || 21,
        user: config.user,
        password: config.password,
        secure: config.secure || false
      };

      // Set client options
      // Timeout will be handled during operations

      // Connect with retry mechanism
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          await this.client.access({
            host: this.config.host,
            port: this.config.port,
            user: this.config.user,
            password: this.config.password,
            secure: this.config.secure
          });
          
          this.connected = true;
          return true;
        } catch (err) {
          attempts++;
          
          // If we've exhausted all attempts, throw the error
          if (attempts >= maxAttempts) {
            throw err;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }
      
      return false;
    } catch (error) {
      console.error('FTP connection error:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Disconnect from the FTP server
   */
  async disconnect(): Promise<void> {
    this.client.close();
    this.connected = false;
  }

  /**
   * Get a list of files in the specified directory
   */
  async listFiles(remotePath: string = '/'): Promise<ftp.FileInfo[]> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      return await this.client.list(remotePath);
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Download a file from the FTP server
   */
  async downloadFile(remotePath: string, localPath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.downloadTo(localPath, remotePath);
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Upload a file to the FTP server
   */
  async uploadFile(localPath: string, remotePath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.uploadFrom(localPath, remotePath);
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Delete a file on the FTP server
   */
  async deleteFile(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.remove(remotePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Create a directory on the FTP server
   */
  async createDirectory(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.ensureDir(remotePath);
      return true;
    } catch (error) {
      console.error('Error creating directory:', error);
      throw error;
    }
  }

  /**
   * Delete a directory on the FTP server
   */
  async deleteDirectory(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.removeDir(remotePath);
      return true;
    } catch (error) {
      console.error('Error deleting directory:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists on the FTP server
   */
  async fileExists(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const dirPath = path.dirname(remotePath);
      const fileName = path.basename(remotePath);
      
      const files = await this.client.list(dirPath);
      return files.some(file => file.name === fileName);
    } catch (error) {
      console.error('Error checking if file exists:', error);
      return false;
    }
  }

  /**
   * Get size of a file on the FTP server
   */
  async getFileSize(remotePath: string): Promise<number> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const dirPath = path.dirname(remotePath);
      const fileName = path.basename(remotePath);
      
      const files = await this.client.list(dirPath);
      const file = files.find(file => file.name === fileName);
      
      if (!file) {
        throw new Error(`File not found: ${remotePath}`);
      }
      
      return file.size;
    } catch (error) {
      console.error('Error getting file size:', error);
      throw error;
    }
  }

  /**
   * Download a file to a temporary location and return the local path
   */
  async downloadToTemp(remotePath: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const tempFilePath = path.join(this.tempDir, path.basename(remotePath));
      await this.client.downloadTo(tempFilePath, remotePath);
      return tempFilePath;
    } catch (error) {
      console.error('Error downloading to temp:', error);
      throw error;
    }
  }

  /**
   * Read a file from the FTP server and return its contents
   */
  async readFile(remotePath: string): Promise<Buffer> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const tempFilePath = await this.downloadToTemp(remotePath);
      const content = fs.readFileSync(tempFilePath);
      fs.unlinkSync(tempFilePath); // Clean up temp file
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  /**
   * Read a text file from the FTP server and return its contents as a string
   */
  async readTextFile(remotePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    const buffer = await this.readFile(remotePath);
    return buffer.toString(encoding);
  }

  /**
   * Write content to a file on the FTP server
   */
  async writeFile(remotePath: string, content: Buffer | string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      const tempFilePath = path.join(this.tempDir, path.basename(remotePath));
      
      if (typeof content === 'string') {
        fs.writeFileSync(tempFilePath, content);
      } else {
        fs.writeFileSync(tempFilePath, content);
      }
      
      await this.client.uploadFrom(tempFilePath, remotePath);
      fs.unlinkSync(tempFilePath); // Clean up temp file
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  /**
   * Rename a file or directory on the FTP server
   */
  async rename(oldPath: string, newPath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.rename(oldPath, newPath);
      return true;
    } catch (error) {
      console.error('Error renaming file:', error);
      throw error;
    }
  }

  /**
   * Get current working directory on the FTP server
   */
  async getCurrentDirectory(): Promise<string> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      return await this.client.pwd();
    } catch (error) {
      console.error('Error getting current directory:', error);
      throw error;
    }
  }

  /**
   * Change working directory on the FTP server
   */
  async changeDirectory(remotePath: string): Promise<boolean> {
    if (!this.connected) {
      throw new Error('Not connected to FTP server');
    }

    try {
      await this.client.cd(remotePath);
      return true;
    } catch (error) {
      console.error('Error changing directory:', error);
      throw error;
    }
  }

  /**
   * Test connection to FTP server with the provided config
   */
  static async testConnection(config: {
    host: string;
    port?: number;
    user: string;
    password: string;
    secure?: boolean;
  }): Promise<boolean> {
    const service = new FTPService();
    
    try {
      await service.connect(config);
      await service.disconnect();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}