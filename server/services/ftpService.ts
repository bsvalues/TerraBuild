/**
 * FTP Service for the Benton County Building Cost System
 * 
 * This service handles connections to the FTP server and file operations
 * for exporting data to ftp.spatialest.com
 */

import { Client, FileInfo } from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';

// FTP Configuration from environment variables
const FTP_HOST = process.env.FTP_HOST || '';
const FTP_USERNAME = process.env.FTP_USERNAME || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '';
const FTP_PORT = parseInt(process.env.FTP_PORT || '21', 10);

/**
 * Creates an FTP client and establishes connection
 * @returns Connected FTP client
 */
export async function createFtpClient(): Promise<Client> {
  const client = new Client();
  client.ftp.verbose = process.env.NODE_ENV !== 'production'; // Enable debug in non-production
  
  try {
    if (!FTP_HOST || !FTP_USERNAME || !FTP_PASSWORD) {
      throw new Error('Missing FTP credentials. Please check environment variables.');
    }
    
    console.log(`Attempting to connect to FTP server: ${FTP_HOST}:${FTP_PORT}`);
    
    await client.access({
      host: FTP_HOST,
      user: FTP_USERNAME,
      password: FTP_PASSWORD,
      port: FTP_PORT,
      secure: false, // Set to true if using FTPS
      secureOptions: {
        rejectUnauthorized: false // Allow self-signed certificates in dev
      }
    });
    
    console.log(`Connected successfully to FTP server: ${FTP_HOST}`);
    return client;
  } catch (err: any) {
    console.error('FTP connection error:', err);
    client.close();
    throw new Error(`Failed to connect to FTP server: ${err.message || 'Unknown error'}`);
  }
}

/**
 * Upload a file to the FTP server
 * 
 * @param localFilePath Path to the local file
 * @param remoteFilePath Path on the FTP server where the file should be uploaded
 * @param createDirectory Whether to create the remote directory if it doesn't exist
 * @returns Promise that resolves when the upload is complete
 */
export async function uploadFile(
  localFilePath: string, 
  remoteFilePath: string,
  createDirectory: boolean = true
): Promise<{success: boolean; message: string}> {
  const client = await createFtpClient();
  
  try {
    // Verify local file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Local file '${localFilePath}' does not exist`);
    }
    
    const fileSize = fs.statSync(localFilePath).size;
    console.log(`Preparing to upload file '${localFilePath}' (${fileSize} bytes) to '${remoteFilePath}'`);
    
    if (createDirectory) {
      // Extract the directory path from the remote file path
      const remoteDir = path.dirname(remoteFilePath);
      
      // Try to create directory (or nested directories)
      try {
        console.log(`Ensuring directory exists on FTP server: ${remoteDir}`);
        await client.ensureDir(remoteDir);
        console.log(`Directory confirmed: ${remoteDir}`);
      } catch (dirErr: any) {
        console.warn(`Could not create directory ${remoteDir}:`, dirErr.message || 'Unknown error');
        // Continue anyway, the upload might still work if the directory exists
      }
    }
    
    // Set up progress tracking
    let lastProgress = 0;
    client.trackProgress(info => {
      const currentProgress = Math.round((info.bytes / fileSize) * 100);
      if (currentProgress > lastProgress + 10) { // Log every 10% progress
        console.log(`Upload progress: ${currentProgress}% (${info.bytes}/${fileSize} bytes)`);
        lastProgress = currentProgress;
      }
    });
    
    // Upload the file
    console.log(`Starting upload of ${path.basename(localFilePath)} to FTP server...`);
    await client.uploadFrom(localFilePath, remoteFilePath);
    
    console.log(`✓ Successfully uploaded ${localFilePath} to FTP server at ${remoteFilePath}`);
    return {
      success: true,
      message: `Successfully uploaded ${path.basename(localFilePath)} to FTP server`
    };
  } catch (err: any) {
    const errorMsg = `Failed to upload file to FTP server: ${err.message || 'Unknown error'}`;
    console.error('FTP upload error:', err);
    return {
      success: false,
      message: errorMsg
    };
  } finally {
    client.close();
  }
}

/**
 * Upload file content from a string/buffer to the FTP server
 * 
 * @param content File content as a string or buffer
 * @param remoteFilePath Path on the FTP server where the file should be uploaded
 * @param createDirectory Whether to create the remote directory if it doesn't exist
 * @returns Promise that resolves when the upload is complete
 */
export async function uploadContent(
  content: string | Buffer,
  remoteFilePath: string,
  createDirectory: boolean = true
): Promise<{success: boolean; message: string}> {
  // Create a temporary file with a safe filename
  const tempDir = './uploads/temp';
  // Create a safe filename by sanitizing the remote path
  const safeBasename = path.basename(remoteFilePath).replace(/[^a-zA-Z0-9_.-]/g, '_');
  const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${safeBasename}`);
  
  console.log(`Creating temporary file for content upload: ${tempFilePath}`);
  
  // Ensure the temp directory exists
  if (!fs.existsSync(tempDir)) {
    console.log(`Creating temporary directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  try {
    // Write content to temporary file
    const contentLength = typeof content === 'string' ? content.length : content.length;
    console.log(`Writing ${contentLength} bytes to temporary file`);
    fs.writeFileSync(tempFilePath, content);
    
    // Upload the temporary file
    console.log(`Uploading content to FTP server at ${remoteFilePath}`);
    const result = await uploadFile(tempFilePath, remoteFilePath, createDirectory);
    return result;
  } catch (err: any) {
    console.error('Content upload error:', err);
    return {
      success: false,
      message: `Failed to upload content to FTP server: ${err.message || 'Unknown error'}`
    };
  } finally {
    // Always clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
      console.log(`Cleaning up temporary file: ${tempFilePath}`);
      fs.unlinkSync(tempFilePath);
    }
  }
}

/**
 * List files in a remote directory
 * 
 * @param remotePath Path on the FTP server to list files from
 * @returns Array of file information objects
 */
export async function listFiles(remotePath: string = '/'): Promise<{
  success: boolean;
  files?: FileInfo[];
  message: string;
}> {
  console.log(`Listing files in FTP directory: ${remotePath}`);
  const client = await createFtpClient();
  
  try {
    // Verify the path exists
    try {
      await client.cd(remotePath);
      // If cd succeeds, go back to where we were before
      await client.cd('..');
    } catch (err) {
      console.warn(`Directory ${remotePath} doesn't exist or is not accessible`);
      return {
        success: false,
        message: `Directory ${remotePath} doesn't exist or is not accessible`
      };
    }
    
    console.log(`Fetching file list from: ${remotePath}`);
    const files = await client.list(remotePath);
    
    console.log(`Successfully listed ${files.length} files/directories in ${remotePath}`);
    return {
      success: true,
      files,
      message: `Successfully listed ${files.length} files/directories`
    };
  } catch (err: any) {
    const errorMsg = `Failed to list files on FTP server: ${err.message || 'Unknown error'}`;
    console.error('FTP list error:', err);
    return {
      success: false,
      message: errorMsg
    };
  } finally {
    client.close();
  }
}

/**
 * Test the FTP connection
 * 
 * @returns Promise that resolves with connection status and configuration details
 */
export async function testConnection(): Promise<{ 
  success: boolean; 
  message: string;
  config?: {
    host: string;
    port: number;
    hasCredentials: boolean;
  }
}> {
  try {
    console.log('Testing FTP connection...');
    
    // Check for required environment variables before attempting connection
    if (!FTP_HOST) {
      return { 
        success: false, 
        message: 'FTP_HOST environment variable is not set',
        config: {
          host: '',
          port: FTP_PORT,
          hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
        }
      };
    }
    
    if (!FTP_USERNAME || !FTP_PASSWORD) {
      return { 
        success: false, 
        message: 'FTP credentials are missing. Please check FTP_USERNAME and FTP_PASSWORD environment variables',
        config: {
          host: FTP_HOST,
          port: FTP_PORT,
          hasCredentials: false
        }
      };
    }
    
    // Attempt to connect
    const client = await createFtpClient();
    
    // Get current directory to verify we can perform operations
    const currentDir = await client.pwd();
    
    // Close the connection
    client.close();
    
    console.log(`Successfully connected to FTP server at ${FTP_HOST}:${FTP_PORT} (current directory: ${currentDir})`);
    
    return { 
      success: true, 
      message: `Successfully connected to FTP server at ${FTP_HOST}:${FTP_PORT}`,
      config: {
        host: FTP_HOST,
        port: FTP_PORT,
        hasCredentials: true
      }
    };
  } catch (err: any) {
    console.error('FTP connection test failed:', err);
    return { 
      success: false, 
      message: `Failed to connect to FTP server: ${err.message || 'Unknown error'}`,
      config: {
        host: FTP_HOST,
        port: FTP_PORT,
        hasCredentials: Boolean(FTP_USERNAME && FTP_PASSWORD)
      }
    };
  }
}