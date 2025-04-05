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
    await client.access({
      host: FTP_HOST,
      user: FTP_USERNAME,
      password: FTP_PASSWORD,
      port: FTP_PORT,
      secure: false // Set to true if using FTPS
    });
    
    console.log(`Connected to FTP server: ${FTP_HOST}`);
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
): Promise<void> {
  const client = await createFtpClient();
  
  try {
    if (createDirectory) {
      // Extract the directory path from the remote file path
      const remoteDir = path.dirname(remoteFilePath);
      
      // Try to create directory (or nested directories)
      try {
        await client.ensureDir(remoteDir);
      } catch (dirErr: any) {
        console.warn(`Could not create directory ${remoteDir}:`, dirErr.message || 'Unknown error');
        // Continue anyway, the upload might still work if the directory exists
      }
    }
    
    // Upload the file
    await client.uploadFrom(localFilePath, remoteFilePath);
    console.log(`Successfully uploaded ${localFilePath} to FTP server at ${remoteFilePath}`);
    
  } catch (err: any) {
    console.error('FTP upload error:', err);
    throw new Error(`Failed to upload file to FTP server: ${err.message || 'Unknown error'}`);
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
): Promise<void> {
  // Create a temporary file
  const tempDir = './uploads/temp';
  const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${path.basename(remoteFilePath)}`);
  
  // Ensure the temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  try {
    // Write content to temporary file
    fs.writeFileSync(tempFilePath, content);
    
    // Upload the temporary file
    await uploadFile(tempFilePath, remoteFilePath, createDirectory);
  } finally {
    // Always clean up the temporary file
    if (fs.existsSync(tempFilePath)) {
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
export async function listFiles(remotePath: string = '/'): Promise<FileInfo[]> {
  const client = await createFtpClient();
  
  try {
    const files = await client.list(remotePath);
    return files;
  } catch (err: any) {
    console.error('FTP list error:', err);
    throw new Error(`Failed to list files on FTP server: ${err.message || 'Unknown error'}`);
  } finally {
    client.close();
  }
}

/**
 * Test the FTP connection
 * 
 * @returns Promise that resolves with connection status
 */
export async function testConnection(): Promise<{ success: boolean, message: string }> {
  try {
    const client = await createFtpClient();
    client.close();
    return { success: true, message: `Successfully connected to FTP server at ${FTP_HOST}` };
  } catch (err: any) {
    return { success: false, message: `Failed to connect to FTP server: ${err.message || 'Unknown error'}` };
  }
}