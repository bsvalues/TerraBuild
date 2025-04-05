/**
 * Enhanced FTP Service for the Benton County Building Cost System
 * 
 * This service handles connections to the FTP server and file operations
 * with improved resilience, retries, and error handling.
 */

import { Client, FileInfo } from 'basic-ftp';
import * as fs from 'fs';
import * as path from 'path';
import { storage } from '../storage';

// FTP Configuration from environment variables
const FTP_HOST = process.env.FTP_HOST || '';
const FTP_USERNAME = process.env.FTP_USERNAME || '';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '';
const FTP_PORT = parseInt(process.env.FTP_PORT || '21', 10);

// Retry Configuration
const CONNECTION_RETRY_ATTEMPTS = parseInt(process.env.FTP_RETRY_ATTEMPTS || '3', 10);
const CONNECTION_RETRY_DELAY = parseInt(process.env.FTP_RETRY_DELAY || '2000', 10); // 2 seconds
const OPERATION_TIMEOUT = parseInt(process.env.FTP_OPERATION_TIMEOUT || '30000', 10); // 30 seconds

/**
 * Sleep utility function for retry delay
 * @param ms Milliseconds to sleep
 * @returns Promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates an FTP client and establishes connection with retry logic
 * @param retryAttempts Number of retry attempts if connection fails (default: 3)
 * @param retryDelay Delay between retries in milliseconds (default: 2000)
 * @returns Connected FTP client
 */
export async function createFtpClient(
  retryAttempts: number = CONNECTION_RETRY_ATTEMPTS,
  retryDelay: number = CONNECTION_RETRY_DELAY
): Promise<Client> {
  const client = new Client(OPERATION_TIMEOUT);
  client.ftp.verbose = process.env.NODE_ENV !== 'production'; // Enable debug in non-production
  
  // Attempt connection with retries
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      if (!FTP_HOST || !FTP_USERNAME || !FTP_PASSWORD) {
        throw new Error('Missing FTP credentials. Please check environment variables.');
      }
      
      console.log(`Attempting to connect to FTP server: ${FTP_HOST}:${FTP_PORT} (Attempt ${attempt}/${retryAttempts})`);
      
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
      
      // Record successful connection in activity log if this wasn't the first attempt
      if (attempt > 1) {
        await storage.createActivity({
          action: `FTP connection succeeded on attempt ${attempt}/${retryAttempts}`,
          icon: 'check-circle',
          iconColor: 'green'
        });
      }
      
      return client;
    } catch (err: any) {
      lastError = err;
      console.error(`FTP connection error (Attempt ${attempt}/${retryAttempts}):`, err);
      
      // Record retry attempt in activity log
      if (attempt < retryAttempts) {
        console.log(`Retrying FTP connection in ${retryDelay/1000} seconds...`);
        
        await storage.createActivity({
          action: `FTP connection failed, retrying (Attempt ${attempt}/${retryAttempts})`,
          icon: 'refresh-cw',
          iconColor: 'amber'
        });
        
        // Close client before retry
        client.close();
        
        // Wait before retrying
        await sleep(retryDelay);
      }
    }
  }
  
  // If we got here, all attempts failed
  client.close();
  
  const errorMessage = `Failed to connect to FTP server after ${retryAttempts} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(errorMessage);
  
  // Record final failure in activity log
  await storage.createActivity({
    action: errorMessage,
    icon: 'x-circle',
    iconColor: 'red'
  });
  
  throw new Error(errorMessage);
}

/**
 * Upload a file to the FTP server with retry logic
 * 
 * @param localFilePath Path to the local file
 * @param remoteFilePath Path on the FTP server where the file should be uploaded
 * @param createDirectory Whether to create the remote directory if it doesn't exist
 * @param retryAttempts Number of retry attempts (default: 3)
 * @param retryDelay Delay between retries in milliseconds (default: 2000)
 * @returns Promise that resolves when the upload is complete
 */
export async function uploadFile(
  localFilePath: string, 
  remoteFilePath: string,
  createDirectory: boolean = true,
  retryAttempts: number = CONNECTION_RETRY_ATTEMPTS,
  retryDelay: number = CONNECTION_RETRY_DELAY
): Promise<{success: boolean; message: string; remotePath?: string}> {
  // Verify local file exists
  if (!fs.existsSync(localFilePath)) {
    const errorMsg = `Local file '${localFilePath}' does not exist`;
    console.error(errorMsg);
    
    await storage.createActivity({
      action: errorMsg,
      icon: 'file-missing',
      iconColor: 'red'
    });
    
    return {
      success: false,
      message: errorMsg
    };
  }
  
  const fileSize = fs.statSync(localFilePath).size;
  const fileName = path.basename(localFilePath);
  
  console.log(`Preparing to upload file '${localFilePath}' (${fileSize} bytes) to '${remoteFilePath}'`);
  
  // Record the upload attempt in activity log
  await storage.createActivity({
    action: `Preparing to upload ${fileName} to FTP server`,
    icon: 'upload',
    iconColor: 'blue'
  });
  
  // Attempt upload with retries
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    const client = await createFtpClient();
    
    try {
      // Record retry attempt if not the first try
      if (attempt > 1) {
        console.log(`Retrying upload (Attempt ${attempt}/${retryAttempts})`);
        
        await storage.createActivity({
          action: `Retrying upload of ${fileName} (Attempt ${attempt}/${retryAttempts})`,
          icon: 'refresh-cw',
          iconColor: 'amber'
        });
      }
      
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
      console.log(`Starting upload of ${fileName} to FTP server (Attempt ${attempt}/${retryAttempts})...`);
      await client.uploadFrom(localFilePath, remoteFilePath);
      
      // If we got here, upload was successful
      console.log(`✓ Successfully uploaded ${fileName} to FTP server at ${remoteFilePath}`);
      
      // Record the successful upload in activity log
      await storage.createActivity({
        action: `Successfully uploaded ${fileName} to FTP server${attempt > 1 ? ` on attempt ${attempt}` : ''}`,
        icon: 'upload-cloud',
        iconColor: 'green'
      });
      
      // Close the client connection
      client.close();
      
      return {
        success: true,
        message: `Successfully uploaded ${fileName} to FTP server${attempt > 1 ? ` on attempt ${attempt}` : ''}`,
        remotePath: remoteFilePath
      };
    } catch (err: any) {
      lastError = err;
      console.error(`Upload error (Attempt ${attempt}/${retryAttempts}):`, err.message);
      
      // Close client before possibly retrying
      client.close();
      
      // If more attempts are available, wait and retry
      if (attempt < retryAttempts) {
        console.log(`Will retry upload in ${retryDelay/1000} seconds...`);
        await sleep(retryDelay);
      }
    }
  }
  
  // If we got here, all attempts failed
  const errorMsg = `Failed to upload ${fileName} to FTP server after ${retryAttempts} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(errorMsg);
  
  // Record the failed upload in activity log
  await storage.createActivity({
    action: errorMsg,
    icon: 'x-circle',
    iconColor: 'red'
  });
  
  return {
    success: false,
    message: errorMsg
  };
}

/**
 * Upload file content from a string/buffer to the FTP server with enhanced error handling
 * 
 * @param content File content as a string or buffer
 * @param remoteFilePath Path on the FTP server where the file should be uploaded
 * @param createDirectory Whether to create the remote directory if it doesn't exist
 * @param retryAttempts Number of retry attempts for the FTP upload (default: 3)
 * @param retryDelay Delay between retries in milliseconds (default: 2000)
 * @returns Promise that resolves when the upload is complete
 */
export async function uploadContent(
  content: string | Buffer,
  remoteFilePath: string,
  createDirectory: boolean = true,
  retryAttempts: number = CONNECTION_RETRY_ATTEMPTS,
  retryDelay: number = CONNECTION_RETRY_DELAY
): Promise<{success: boolean; message: string; remotePath?: string}> {
  // Create a temporary file with a safe filename
  const tempDir = './uploads/temp';
  // Create a safe filename by sanitizing the remote path
  const safeBasename = path.basename(remoteFilePath).replace(/[^a-zA-Z0-9_.-]/g, '_');
  const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${safeBasename}`);
  
  console.log(`Creating temporary file for content upload: ${tempFilePath}`);
  
  // Record the content preparation in activity log
  await storage.createActivity({
    action: `Preparing content for FTP upload to ${remoteFilePath}`,
    icon: 'file-text',
    iconColor: 'blue'
  });
  
  // Ensure the temp directory exists
  try {
    if (!fs.existsSync(tempDir)) {
      console.log(`Creating temporary directory: ${tempDir}`);
      fs.mkdirSync(tempDir, { recursive: true });
    }
  } catch (dirErr: any) {
    const errorMsg = `Failed to create temporary directory: ${dirErr.message || 'Unknown error'}`;
    console.error(errorMsg);
    
    await storage.createActivity({
      action: errorMsg,
      icon: 'folder-x',
      iconColor: 'red'
    });
    
    return {
      success: false,
      message: errorMsg
    };
  }
  
  try {
    // Write content to temporary file
    const contentLength = typeof content === 'string' ? content.length : content.length;
    console.log(`Writing ${contentLength} bytes to temporary file`);
    
    try {
      fs.writeFileSync(tempFilePath, content);
    } catch (writeErr: any) {
      const errorMsg = `Failed to write content to temporary file: ${writeErr.message || 'Unknown error'}`;
      console.error(errorMsg);
      
      await storage.createActivity({
        action: errorMsg,
        icon: 'file-x',
        iconColor: 'red'
      });
      
      return {
        success: false,
        message: errorMsg
      };
    }
    
    // Upload the temporary file
    console.log(`Uploading content to FTP server at ${remoteFilePath}`);
    
    // Record the upload start in activity log
    await storage.createActivity({
      action: `Starting upload to FTP at ${remoteFilePath}`,
      icon: 'upload',
      iconColor: 'blue'
    });
    
    // Use the enhanced uploadFile function with retry logic
    const result = await uploadFile(
      tempFilePath,
      remoteFilePath,
      createDirectory,
      retryAttempts,
      retryDelay
    );
    
    return result;
  } catch (err: any) {
    const errorMsg = `Failed to upload content to FTP server: ${err.message || 'Unknown error'}`;
    console.error('Content upload error:', err);
    
    await storage.createActivity({
      action: errorMsg,
      icon: 'alert-triangle',
      iconColor: 'red'
    });
    
    return {
      success: false,
      message: errorMsg
    };
  } finally {
    // Always clean up the temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        console.log(`Cleaning up temporary file: ${tempFilePath}`);
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupErr: any) {
      console.warn(`Warning: Failed to clean up temporary file: ${cleanupErr.message}`);
    }
  }
}

/**
 * List files in a remote directory with improved error handling and retries
 * 
 * @param remotePath Path on the FTP server to list files from
 * @param retryAttempts Number of retry attempts (default: 3)
 * @param retryDelay Delay between retries in milliseconds (default: 2000)
 * @returns Array of file information objects
 */
export async function listFiles(
  remotePath: string = '/',
  retryAttempts: number = CONNECTION_RETRY_ATTEMPTS,
  retryDelay: number = CONNECTION_RETRY_DELAY
): Promise<{
  success: boolean;
  files?: FileInfo[];
  message: string;
  path?: string;
}> {
  console.log(`Listing files in FTP directory: ${remotePath}`);
  
  // Record the listing attempt in activity log
  await storage.createActivity({
    action: `Listing files in FTP directory: ${remotePath}`,
    icon: 'folder-open',
    iconColor: 'blue'
  });
  
  // Attempt listing with retries
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    let client: Client | null = null;
    
    try {
      // Record retry attempt if not the first try
      if (attempt > 1) {
        console.log(`Retrying directory listing (Attempt ${attempt}/${retryAttempts})`);
        
        await storage.createActivity({
          action: `Retrying FTP directory listing: ${remotePath} (Attempt ${attempt}/${retryAttempts})`,
          icon: 'refresh-cw',
          iconColor: 'amber'
        });
      }
      
      // Create client and establish connection
      client = await createFtpClient();
      
      // Verify the path exists
      try {
        await client.cd(remotePath);
        // If cd succeeds, go back to where we were before
        await client.cd('..');
      } catch (pathErr: any) {
        console.warn(`Directory ${remotePath} doesn't exist or is not accessible:`, pathErr.message);
        
        await storage.createActivity({
          action: `FTP directory not accessible: ${remotePath}`,
          icon: 'folder-x',
          iconColor: 'amber'
        });
        
        // Close the client
        client.close();
        
        return {
          success: false,
          message: `Directory ${remotePath} doesn't exist or is not accessible`,
          path: remotePath
        };
      }
      
      // Fetch the file list
      console.log(`Fetching file list from: ${remotePath}`);
      const files = await client.list(remotePath);
      
      // If we got here, the listing was successful
      console.log(`Successfully listed ${files.length} files/directories in ${remotePath}`);
      
      // Record successful listing in activity log
      await storage.createActivity({
        action: `Listed ${files.length} files in FTP directory: ${remotePath}${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`,
        icon: 'list',
        iconColor: 'green'
      });
      
      // Close the client
      client.close();
      
      return {
        success: true,
        files,
        message: `Successfully listed ${files.length} files/directories`,
        path: remotePath
      };
    } catch (err: any) {
      lastError = err;
      console.error(`FTP list error (Attempt ${attempt}/${retryAttempts}):`, err.message);
      
      // Close client if it was created
      if (client) {
        client.close();
      }
      
      // If more attempts are available, wait and retry
      if (attempt < retryAttempts) {
        console.log(`Will retry listing in ${retryDelay/1000} seconds...`);
        await sleep(retryDelay);
      }
    }
  }
  
  // If we got here, all attempts failed
  const errorMsg = `Failed to list files on FTP server after ${retryAttempts} attempts: ${lastError?.message || 'Unknown error'}`;
  console.error(errorMsg);
  
  // Record the failed listing in activity log
  await storage.createActivity({
    action: errorMsg,
    icon: 'x-circle',
    iconColor: 'red'
  });
  
  return {
    success: false,
    message: errorMsg,
    path: remotePath
  };
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