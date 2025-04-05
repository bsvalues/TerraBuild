import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

interface FTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
}

interface FTPFile {
  name: string;
  type: string;
  size: number;
  modifiedDate: string;
  permissions: string;
}

interface FTPResponse {
  success: boolean;
  message: string;
  files?: FTPFile[];
}

/**
 * FTP Client service for connecting to and interacting with FTP servers.
 * Provides methods for listing directories, uploading, downloading, and deleting files.
 */
export class FTPClient {
  private client: ftp.Client;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // milliseconds
  
  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = process.env.NODE_ENV === 'development';
  }
  
  /**
   * Connect to an FTP server
   * @param config FTP connection configuration
   * @returns Promise resolving when connected
   */
  async connect(config: FTPConfig): Promise<void> {
    try {
      await this.client.access({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        secure: config.secure || false,
        secureOptions: {
          rejectUnauthorized: false // Accept self-signed certificates
        }
      });
      
      console.log(`Connected to FTP server ${config.host}:${config.port}`);
    } catch (error) {
      console.error(`FTP connection error: ${error}`);
      throw error;
    }
  }
  
  /**
   * Close the FTP connection
   */
  async close(): Promise<void> {
    this.client.close();
    console.log('FTP connection closed');
  }
  
  /**
   * List files in a directory on the FTP server
   * @param remotePath Path to list
   * @returns Promise resolving to array of file objects
   */
  async list(remotePath: string): Promise<FTPFile[]> {
    try {
      const result = await this.client.list(remotePath);
      
      return result.map(item => ({
        name: item.name,
        type: item.type === ftp.FileType.Directory ? 'directory' : 'file',
        size: item.size,
        modifiedDate: item.modifiedAt?.toISOString() || new Date().toISOString(),
        permissions: this.formatPermissions(item.permissions)
      }));
    } catch (error) {
      console.error(`Error listing directory ${remotePath}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Upload a file to the FTP server
   * @param localPath Path to local file
   * @param remotePath Path on FTP server
   * @returns Promise resolving when upload is complete
   */
  async upload(localPath: string, remotePath: string): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        await this.client.uploadFrom(localPath, remotePath);
        console.log(`Uploaded ${localPath} to ${remotePath}`);
        return;
      } catch (error) {
        attempts++;
        console.error(`Upload attempt ${attempts} failed: ${error}`);
        
        if (attempts >= this.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }
  
  /**
   * Download a file from the FTP server
   * @param remotePath Path on FTP server
   * @param localPath Path to save locally
   * @returns Promise resolving when download is complete
   */
  async download(remotePath: string, localPath: string): Promise<void> {
    let attempts = 0;
    
    // Ensure the directory exists
    const directory = path.dirname(localPath);
    await fsPromises.mkdir(directory, { recursive: true });
    
    while (attempts < this.maxRetries) {
      try {
        await this.client.downloadTo(localPath, remotePath);
        console.log(`Downloaded ${remotePath} to ${localPath}`);
        return;
      } catch (error) {
        attempts++;
        console.error(`Download attempt ${attempts} failed: ${error}`);
        
        if (attempts >= this.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }
  
  /**
   * Delete a file on the FTP server
   * @param remotePath Path to file on FTP server
   * @returns Promise resolving when deletion is complete
   */
  async delete(remotePath: string): Promise<void> {
    try {
      await this.client.remove(remotePath);
      console.log(`Deleted ${remotePath}`);
    } catch (error) {
      console.error(`Error deleting ${remotePath}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Create a directory on the FTP server
   * @param remotePath Path to create
   * @returns Promise resolving when directory is created
   */
  async createDirectory(remotePath: string): Promise<void> {
    try {
      await this.client.ensureDir(remotePath);
      console.log(`Created directory ${remotePath}`);
    } catch (error) {
      console.error(`Error creating directory ${remotePath}: ${error}`);
      throw error;
    }
  }
  
  /**
   * Format permissions from numeric to string format (e.g., -rw-r--r--)
   * @param permissions Permissions value
   * @returns Formatted permissions string
   */
  private formatPermissions(permissions?: any): string {
    if (!permissions) return '---------';
    
    // If permissions is already a string, return it
    if (typeof permissions === 'string') return permissions;
    
    try {
      // Simple conversion for numeric permissions
      const perms = [];
      const modeOctal = typeof permissions === 'number' ? permissions.toString(8).slice(-3) : '644';
      
      // Owner
      perms.push((parseInt(modeOctal[0], 10) & 4) ? 'r' : '-');
      perms.push((parseInt(modeOctal[0], 10) & 2) ? 'w' : '-');
      perms.push((parseInt(modeOctal[0], 10) & 1) ? 'x' : '-');
      
      // Group
      perms.push((parseInt(modeOctal[1], 10) & 4) ? 'r' : '-');
      perms.push((parseInt(modeOctal[1], 10) & 2) ? 'w' : '-');
      perms.push((parseInt(modeOctal[1], 10) & 1) ? 'x' : '-');
      
      // Others
      perms.push((parseInt(modeOctal[2], 10) & 4) ? 'r' : '-');
      perms.push((parseInt(modeOctal[2], 10) & 2) ? 'w' : '-');
      perms.push((parseInt(modeOctal[2], 10) & 1) ? 'x' : '-');
      
      return perms.join('');
    } catch (error) {
      console.error('Error formatting permissions:', error);
      return '---------';
    }
  }
}

export default FTPClient;

/**
 * Export FTPClient as FTPService for backwards compatibility
 */
export const FTPService = FTPClient;

// Utility function to get FTP connection parameters from environment variables
function getFTPConfig(): { config: FTPConfig; isValid: boolean; error?: string } {
  const host = process.env.FTP_HOST;
  const port = process.env.FTP_PORT ? parseInt(process.env.FTP_PORT, 10) : 21;
  const user = process.env.FTP_USERNAME;
  const password = process.env.FTP_PASSWORD;
  
  if (!host || !user || !password) {
    return {
      config: { host: '', port: 21, user: '', password: '' },
      isValid: false,
      error: 'Missing FTP credentials in environment variables'
    };
  }
  
  return {
    config: { host, port, user, password, secure: false },
    isValid: true
  };
}

/**
 * Test connection to the FTP server
 * 
 * @returns Promise that resolves with test results
 */
export async function testConnection(): Promise<FTPResponse> {
  const { config, isValid, error } = getFTPConfig();
  
  if (!isValid) {
    return {
      success: false,
      message: error || 'Invalid FTP configuration'
    };
  }
  
  const client = new FTPClient();
  
  try {
    await client.connect(config);
    await client.close();
    
    return {
      success: true,
      message: `Successfully connected to FTP server at ${config.host}:${config.port}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to connect to FTP server: ${error.message || error}`
    };
  }
}

/**
 * List files on the FTP server
 * 
 * @param remotePath Path to list
 * @returns Promise that resolves with list results
 */
export async function listFiles(remotePath: string): Promise<FTPResponse> {
  const { config, isValid, error } = getFTPConfig();
  
  if (!isValid) {
    return {
      success: false,
      message: error || 'Invalid FTP configuration'
    };
  }
  
  const client = new FTPClient();
  
  try {
    await client.connect(config);
    const files = await client.list(remotePath);
    await client.close();
    
    return {
      success: true,
      message: `Successfully listed ${files.length} files in ${remotePath}`,
      files
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to list files: ${error.message || error}`
    };
  }
}

/**
 * Upload a file to the FTP server
 * 
 * @param localPath Path to local file
 * @param remotePath Path on FTP server
 * @returns Promise that resolves with upload results
 */
export async function uploadFile(localPath: string, remotePath: string): Promise<FTPResponse> {
  const { config, isValid, error } = getFTPConfig();
  
  if (!isValid) {
    return {
      success: false,
      message: error || 'Invalid FTP configuration'
    };
  }
  
  const client = new FTPClient();
  
  try {
    await client.connect(config);
    await client.upload(localPath, remotePath);
    await client.close();
    
    return {
      success: true,
      message: `Successfully uploaded ${localPath} to ${remotePath}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to upload file: ${error.message || error}`
    };
  }
}

/**
 * Delete a file on the FTP server
 * 
 * @param remotePath Path to file on FTP server
 * @returns Promise that resolves with deletion results
 */
export async function removeFile(remotePath: string): Promise<FTPResponse> {
  const { config, isValid, error } = getFTPConfig();
  
  if (!isValid) {
    return {
      success: false,
      message: error || 'Invalid FTP configuration'
    };
  }
  
  const client = new FTPClient();
  
  try {
    await client.connect(config);
    await client.delete(remotePath);
    await client.close();
    
    return {
      success: true,
      message: `Successfully deleted ${remotePath}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to delete file: ${error.message || error}`
    };
  }
}

/**
 * Create a directory on the FTP server
 * 
 * @param remotePath Path to create
 * @returns Promise that resolves with creation results
 */
export async function createDirectory(remotePath: string): Promise<FTPResponse> {
  const { config, isValid, error } = getFTPConfig();
  
  if (!isValid) {
    return {
      success: false,
      message: error || 'Invalid FTP configuration'
    };
  }
  
  const client = new FTPClient();
  
  try {
    await client.connect(config);
    await client.createDirectory(remotePath);
    await client.close();
    
    return {
      success: true,
      message: `Successfully created directory ${remotePath}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to create directory: ${error.message || error}`
    };
  }
}