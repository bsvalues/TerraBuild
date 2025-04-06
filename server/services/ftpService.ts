import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { minimatch } from 'minimatch';
import { FTPConnection } from '@shared/schema';

/**
 * Helper function to properly match a filename against a glob pattern
 * @param filename Filename or path to match
 * @param pattern Glob pattern to match against
 * @returns Boolean indicating if the file matches the pattern
 */
function matchGlobPattern(filename: string, pattern: string): boolean {
  try {
    // Log the matching attempt for debugging
    console.log(`Attempting to match '${filename}' with pattern '${pattern}'`);
    
    // Simplest case: direct match
    if (minimatch(filename, pattern)) {
      console.log(`Direct match: ${filename} matches ${pattern}`);
      return true;
    }
    
    // Try basename matching
    const basename = path.basename(filename);
    if (minimatch(basename, pattern)) {
      console.log(`Basename match: ${basename} matches ${pattern}`);
      return true;
    }
    
    // Try with different path separators
    const normalizedFilename = filename.replace(/\\/g, '/');
    if (minimatch(normalizedFilename, pattern)) {
      console.log(`Normalized path match: ${normalizedFilename} matches ${pattern}`);
      return true;
    }
    
    // For extremely simple patterns like "*.csv", match against basename
    if (pattern.startsWith('*') && basename.endsWith(pattern.substring(1))) {
      console.log(`Simple suffix match: ${basename} ends with ${pattern.substring(1)}`);
      return true;
    }
    
    // For simple prefix patterns like "properties_*", match with startsWith
    if (pattern.endsWith('*') && basename.startsWith(pattern.substring(0, pattern.length - 1))) {
      console.log(`Simple prefix match: ${basename} starts with ${pattern.substring(0, pattern.length - 1)}`);
      return true;
    }
    
    // Special case for direct string match with * on patterns like "properties_*"
    if (pattern.endsWith('*')) {
      const prefix = pattern.substring(0, pattern.length - 1);
      if (basename.startsWith(prefix)) {
        console.log(`Manual prefix match: ${basename} starts with ${prefix}`);
        return true;
      }
    }
    
    // Try with explicit minimatch options
    if (minimatch(filename, pattern, { matchBase: true })) {
      console.log(`MatchBase match: ${filename} matches ${pattern} with matchBase option`);
      return true;
    }
    
    // Handle escaped special characters in filenames
    const escapedPattern = pattern.replace(/([.+^${}()|[\]\\])/g, '\\$1')
                              .replace(/\*/g, '.*');
    if (new RegExp(`^${escapedPattern}$`).test(basename)) {
      console.log(`RegExp match: ${basename} matches regex ${escapedPattern}`);
      return true;
    }
    
    console.log(`No match found for ${filename} with pattern ${pattern}`);
    return false;
  } catch (error) {
    console.error(`Error matching glob pattern: ${error}`);
    return false;
  }
}

interface FTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure?: boolean;
  passiveMode?: boolean;
}

interface FTPFile {
  name: string;
  type: string;
  size: number;
  modifiedDate: string;
  permissions: string;
}

export interface FileFilterOptions {
  includePatterns?: string[];   // Glob patterns to include (e.g., "*.txt", "data/*.csv")
  excludePatterns?: string[];   // Glob patterns to exclude
  minSize?: number;             // Minimum file size in bytes
  maxSize?: number;             // Maximum file size in bytes
  newerThan?: Date;             // Only files modified after this date
  olderThan?: Date;             // Only files modified before this date
}

// Interface for filter statistics
export interface FilterStats {
  totalUnfiltered: number;      // Total number of files before filtering
  totalFiltered: number;        // Total number of files after filtering
  filteringApplied: boolean;    // Whether any filtering was applied
}

interface FTPDirectoryListing {
  path: string;
  files: FTPFile[];
  parentPath?: string;
}

export interface FTPResponse {
  success: boolean;
  message: string;
  files?: FTPFile[];
  filterOptions?: FileFilterOptions;
  stats?: FilterStats;
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
   * Set passive mode for the FTP connection
   * Note: basic-ftp library handles passive mode internally, 
   * but we provide this method for consistency with the FTPClient interface
   * 
   * @param passive Whether to enable passive mode (true) or not (false)
   * @returns Promise resolving when passive mode is set
   */
  async setPassive(passive: boolean = true): Promise<void> {
    try {
      // The basic-ftp library doesn't expose a direct way to set passive mode,
      // but it defaults to passive mode and handles it automatically when transferring files.
      // In an actual FTP implementation, this would send a PASV or PORT command.
      
      // Log the intended mode change (actual mode is controlled by the underlying library)
      console.log(`${passive ? 'Using' : 'Not using'} passive mode for transfers`);
    } catch (error) {
      console.error(`Error setting passive mode: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  
  /**
   * Check if a file matches the given filter options
   * @param file File to check
   * @param options Filter options
   * @param basePath Base path for relative path matching
   * @returns True if file matches all criteria, false otherwise
   */
  private matchesFilter(file: FTPFile, options: FileFilterOptions = {}, basePath: string = ''): boolean {
    const {
      includePatterns = [],
      excludePatterns = [],
      minSize,
      maxSize,
      newerThan,
      olderThan
    } = options;

    const fullPath = basePath ? `${basePath}/${file.name}` : file.name;
    
    // Log filtering attempt for debugging
    console.log(`Filtering file: ${fullPath}, type: ${file.type}`);
    if (includePatterns.length > 0) {
      console.log(`Include patterns: ${includePatterns.join(', ')}`);
    }
    if (excludePatterns.length > 0) {
      console.log(`Exclude patterns: ${excludePatterns.join(', ')}`);
    }
    
    // Skip directories if filtering by size or patterns (unless explicitly included)
    if (file.type === 'directory') {
      // For directories, only check include/exclude patterns if specified
      if (includePatterns.length > 0) {
        const included = includePatterns.some(pattern => {
          try {
            // Extra debugging for pattern matching
            console.log(`Testing directory '${file.name}' against pattern '${pattern}'`);
            
            // Always include directory if it's part of a path pattern (like "dir/subdir/*.txt")
            if (pattern.includes('/')) {
              console.log(`Directory ${fullPath} included due to path pattern ${pattern}`);
              return true;
            }
            
            // Try direct basename matching
            const basename = path.basename(file.name);
            let match = minimatch(basename, pattern);
            
            if (match) {
              console.log(`Direct basename match for directory: ${basename} matches ${pattern}`);
              return true;
            }
            
            // Try with matchBase
            match = minimatch(file.name, pattern, { matchBase: true });
            if (match) {
              console.log(`MatchBase match for directory: ${file.name} matches ${pattern}`);
              return true;
            }
            
            // For simple prefix patterns
            if (pattern.endsWith('*')) {
              const prefix = pattern.substring(0, pattern.length - 1);
              if (basename.startsWith(prefix)) {
                console.log(`Simple prefix match for directory: ${basename} starts with ${prefix}`);
                return true;
              }
            }
            
            // For simple suffix patterns
            if (pattern.startsWith('*')) {
              const suffix = pattern.substring(1);
              if (basename.endsWith(suffix)) {
                console.log(`Simple suffix match for directory: ${basename} ends with ${suffix}`);
                return true;
              }
            }
            
            console.log(`Directory ${fullPath} not matching include pattern ${pattern}`);
            return false;
          } catch (error) {
            console.error(`Invalid include pattern for directory: ${pattern}`, error);
            return false;
          }
        });
        
        if (!included) {
          console.log(`Directory ${fullPath} excluded: didn't match any include patterns`);
          return false;
        }
      }
      
      if (excludePatterns.length > 0) {
        const excluded = excludePatterns.some(pattern => {
          try {
            // Extra debugging for pattern matching
            console.log(`Testing directory '${file.name}' for exclude pattern '${pattern}'`);
            
            // Try direct basename matching
            const basename = path.basename(file.name);
            let match = minimatch(basename, pattern);
            
            if (match) {
              console.log(`Direct basename match for directory exclusion: ${basename} matches ${pattern}`);
              return true;
            }
            
            // Try with matchBase
            match = minimatch(file.name, pattern, { matchBase: true });
            if (match) {
              console.log(`MatchBase match for directory exclusion: ${file.name} matches ${pattern}`);
              return true;
            }
            
            // For simple prefix patterns
            if (pattern.endsWith('*')) {
              const prefix = pattern.substring(0, pattern.length - 1);
              if (basename.startsWith(prefix)) {
                console.log(`Simple prefix match for directory exclusion: ${basename} starts with ${prefix}`);
                return true;
              }
            }
            
            // For simple suffix patterns
            if (pattern.startsWith('*')) {
              const suffix = pattern.substring(1);
              if (basename.endsWith(suffix)) {
                console.log(`Simple suffix match for directory exclusion: ${basename} ends with ${suffix}`);
                return true;
              }
            }
            
            console.log(`Directory ${fullPath} not matching exclude pattern ${pattern}`);
            return false;
          } catch (error) {
            console.error(`Invalid exclude pattern for directory: ${pattern}`, error);
            return false;
          }
        });
        
        if (excluded) {
          console.log(`Directory ${fullPath} excluded: matched exclude pattern`);
          return false;
        }
      }
      
      // Size and date filters don't apply to directories
      console.log(`Directory ${fullPath} included in results`);
      return true;
    }

    // Check file against include patterns (if any)
    if (includePatterns.length > 0) {
      console.log(`DEBUG Include patterns (${includePatterns.length}): ` + JSON.stringify(includePatterns));
      
      // Test if the file matches at least one include pattern
      const included = includePatterns.some(pattern => {
        try {
          // Get the basename for pattern matching
          const basename = path.basename(file.name);
          
          console.log(`DEBUG INCLUDE CHECK: File='${basename}', Pattern='${pattern}', PatternType=${typeof pattern}`);
          
          if (!pattern) {
            console.log(`DEBUG: Skipping empty pattern`);
            return false;
          }
          
          // EXTREME DEBUG - direct string comparison first
          if (basename === pattern) {
            console.log(`EXACT MATCH: '${basename}' is identical to pattern '${pattern}'`);
            return true;
          }
          
          // Special case for CSV pattern - the most common case
          if (pattern === '*.csv') {
            const hasCsvExtension = basename.toLowerCase().endsWith('.csv');
            console.log(`DEBUG *.csv check: ${basename} ends with .csv? ${hasCsvExtension}`);
            if (hasCsvExtension) {
              console.log(`CSV EXTENSION MATCH: ${basename} is a CSV file`);
              return true;
            }
          }
        
          // Special case for property files
          if (pattern === 'properties_*') {
            const isPropertyFile = basename.toLowerCase().startsWith('properties_');
            console.log(`DEBUG properties_* check: ${basename} starts with properties_? ${isPropertyFile}`);
            if (isPropertyFile) {
              console.log(`PROPERTIES FILE MATCH: ${basename} is a properties file`);
              return true;
            }
          }
          
          // Check extension match - case insensitive
          if (pattern.startsWith('*.')) {
            const extension = pattern.substring(1); // e.g., ".csv" from "*.csv"
            const hasExtension = basename.toLowerCase().endsWith(extension.toLowerCase());
            console.log(`DEBUG extension check: ${basename} ends with ${extension}? ${hasExtension}`);
            
            if (hasExtension) {
              console.log(`EXTENSION MATCH: ${basename} ends with ${extension}`);
              return true;
            }
          }
          
          // Check prefix match - case insensitive
          if (pattern.endsWith('*') && pattern.length > 1) {
            const prefix = pattern.substring(0, pattern.length - 1); // e.g., "properties_" from "properties_*"
            const hasPrefix = basename.toLowerCase().startsWith(prefix.toLowerCase());
            console.log(`DEBUG prefix check: ${basename} starts with ${prefix}? ${hasPrefix}`);
            
            if (hasPrefix) {
              console.log(`PREFIX MATCH: ${basename} starts with ${prefix}`);
              return true;
            }
          }
          
          // Very basic * wildcard test
          if (pattern.includes('*')) {
            // Convert glob pattern to regex pattern
            const regexPattern = pattern
              .replace(/\./g, '\\.') // escape dots
              .replace(/\*/g, '.*'); // convert * to .*
            
            const regex = new RegExp(`^${regexPattern}$`, 'i');
            const regexMatch = regex.test(basename);
            console.log(`DEBUG regex check: ${basename} matches ${regex}? ${regexMatch}`);
            
            if (regexMatch) {
              console.log(`REGEX MATCH: ${basename} matches regex ${regex}`);
              return true;
            }
          }
          
          // Last resort - use minimatch
          console.log(`DEBUG minimatch check: ${basename} against ${pattern}`);
          const minimatchResult = minimatch(basename, pattern);
          console.log(`DEBUG minimatch result: ${minimatchResult}`);
          
          if (minimatchResult) {
            console.log(`MINIMATCH success: ${basename} matches ${pattern}`);
            return true;
          }
          
          console.log(`DEBUG: No pattern match methods worked for ${basename} with pattern ${pattern}`);
          return false;
        } catch (error) {
          console.error(`Error in pattern matching: ${error}`);
          return false;
        }
      });
      
      console.log(`DEBUG RESULT: File ${fullPath} matching include pattern ${includePatterns}: ${included}`);
      
      if (!included) {
        console.log(`File ${fullPath} excluded: didn't match any include patterns`);
        return false;
      }
    }
    
    // Check file against exclude patterns (if any)
    if (excludePatterns.length > 0) {
      const excluded = excludePatterns.some(pattern => {
        try {
          // Get the basename for pattern matching
          const basename = path.basename(file.name);
          
          console.log(`Checking if '${basename}' should be excluded with pattern '${pattern}'`);
          
          // Special case for CSV pattern - the most common case
          if (pattern === '*.csv') {
            const hasCsvExtension = basename.toLowerCase().endsWith('.csv');
            if (hasCsvExtension) {
              console.log(`CSV EXTENSION EXCLUDE MATCH: ${basename} is a CSV file to exclude`);
              return true;
            }
          }
        
          // Special case for property files
          if (pattern === 'properties_*') {
            const isPropertyFile = basename.toLowerCase().startsWith('properties_');
            if (isPropertyFile) {
              console.log(`PROPERTIES FILE EXCLUDE MATCH: ${basename} is a properties file to exclude`);
              return true;
            }
          }
          
          // Very direct filename endsWith check for extension patterns
          if (pattern.startsWith('*.')) {
            const extension = pattern.substring(1); // e.g., ".csv" from "*.csv"
            if (basename.toLowerCase().endsWith(extension.toLowerCase())) {
              console.log(`EXTENSION DIRECT EXCLUDE MATCH: ${basename} ends with ${extension}`);
              return true;
            }
          }
          
          // Direct startsWith check for prefix patterns 
          if (pattern.endsWith('*')) {
            const prefix = pattern.substring(0, pattern.length - 1); // e.g., "properties_" from "properties_*"
            if (basename.toLowerCase().startsWith(prefix.toLowerCase())) {
              console.log(`PREFIX DIRECT EXCLUDE MATCH: ${basename} starts with ${prefix}`);
              return true;
            }
          }
          
          // Last resort - use minimatch
          console.log(`Trying minimatch as last resort for exclude: ${basename} against ${pattern}`);
          if (minimatch(basename, pattern)) {
            console.log(`MINIMATCH exclude success: ${basename} matches ${pattern}`);
            return true;
          }
          
          console.log(`No exclude pattern match methods worked for ${basename} with pattern ${pattern}`);
          return false;
        } catch (error) {
          console.error(`Error in exclude pattern matching: ${error}`);
          return false;
        }
      });
      
      if (excluded) {
        console.log(`File ${fullPath} excluded: matched exclude pattern`);
        return false;
      }
    }
    
    // Check file size
    if (minSize !== undefined && file.size < minSize) {
      console.log(`File ${fullPath} excluded: size ${file.size} < ${minSize}`);
      return false;
    }
    if (maxSize !== undefined && file.size > maxSize) {
      console.log(`File ${fullPath} excluded: size ${file.size} > ${maxSize}`);
      return false;
    }
    
    // Check file modified date
    const modifiedDate = new Date(file.modifiedDate);
    if (newerThan && modifiedDate < newerThan) {
      console.log(`File ${fullPath} excluded: date ${modifiedDate.toISOString()} older than ${newerThan.toISOString()}`);
      return false;
    }
    if (olderThan && modifiedDate > olderThan) {
      console.log(`File ${fullPath} excluded: date ${modifiedDate.toISOString()} newer than ${olderThan.toISOString()}`);
      return false;
    }
    
    // If we made it here, the file matches all criteria
    console.log(`File ${fullPath} included in results`);
    return true;
  }

  /**
   * List files in a directory on the FTP server
   * @param remotePath Path to list
   * @param options Optional filter options
   * @returns Promise resolving to array of file objects
   */
  async list(remotePath: string, options?: FileFilterOptions): Promise<FTPFile[]> {
    try {
      // Log the filter options for debugging
      if (options) {
        console.log(`Listing files with filter options:`, JSON.stringify(options, null, 2));
      }
      
      const result = await this.client.list(remotePath);
      console.log(`Got ${result.length} items from FTP server at ${remotePath}`);
      
      // Convert to our FTPFile format
      const files = result.map(item => ({
        name: item.name,
        type: item.type === ftp.FileType.Directory ? 'directory' : 'file',
        size: item.size,
        modifiedDate: item.modifiedAt?.toISOString() || new Date().toISOString(),
        permissions: this.formatPermissions(item.permissions)
      }));
      
      // Apply filters if options provided
      if (options && Object.keys(options).length > 0) {
        console.log(`Applying filters to ${files.length} files`);
        const filteredFiles = files.filter(file => this.matchesFilter(file, options, remotePath));
        console.log(`Filter result: ${filteredFiles.length} files matched the criteria`);
        return filteredFiles;
      }
      
      return files;
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
 * @param filterOptions Optional filter options
 * @returns Promise that resolves with list results
 */
export async function listFiles(remotePath: string, filterOptions?: FileFilterOptions): Promise<FTPResponse> {
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
    
    // First get unfiltered count for comparison
    const allFiles = await client.list(remotePath);
    const totalCount = allFiles.length;
    
    // Then get filtered files
    const files = filterOptions && Object.keys(filterOptions).length > 0 
      ? await client.list(remotePath, filterOptions)
      : allFiles;
    
    await client.close();
    
    // Build detailed filter description
    let filterDesc = '';
    if (filterOptions) {
      const filterParts = [];
      if (filterOptions.includePatterns?.length) filterParts.push('includePatterns');
      if (filterOptions.excludePatterns?.length) filterParts.push('excludePatterns');
      if (filterOptions.minSize !== undefined) filterParts.push('minSize');
      if (filterOptions.maxSize !== undefined) filterParts.push('maxSize');
      if (filterOptions.newerThan !== undefined) filterParts.push('newerThan');
      if (filterOptions.olderThan !== undefined) filterParts.push('olderThan');
      
      if (filterParts.length > 0) {
        filterDesc = ` (filtered with ${filterParts.join(', ')})`;
      }
    }
    
    return {
      success: true,
      message: `Listed ${files.length} files in directory ${remotePath}${filterDesc}`,
      files,
      filterOptions: filterOptions && Object.keys(filterOptions).length > 0 ? filterOptions : undefined,
      stats: {
        totalUnfiltered: totalCount,
        totalFiltered: files.length,
        filteringApplied: filterOptions && Object.keys(filterOptions).length > 0 ? true : false
      }
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
 * Download a file from the FTP server
 * 
 * @param remotePath Path to file on FTP server
 * @param localPath Path to save locally
 * @returns Promise that resolves with download results
 */
export async function downloadFile(remotePath: string, localPath: string): Promise<FTPResponse> {
  const { config, isValid, error } = getFTPConfig();
  
  if (!isValid) {
    return {
      success: false,
      message: error || 'Invalid FTP configuration'
    };
  }
  
  const client = new FTPClient();
  let downloadError: any = null;
  
  try {
    console.log(`Attempting to download ${remotePath} to ${localPath}`);
    await client.connect(config);
    
    // Check if file exists before attempting download
    try {
      // List parent directory and check if file exists
      const pathParts = remotePath.split('/');
      const filename = pathParts.pop() || '';
      const parentDir = pathParts.join('/') || '/';
      
      console.log(`Checking if file ${filename} exists in ${parentDir}`);
      const files = await client.list(parentDir);
      const fileExists = files.some(file => file.name === filename);
      
      if (!fileExists) {
        throw new Error(`File ${filename} does not exist in ${parentDir}`);
      }
      
      console.log(`File ${filename} found, proceeding with download`);
    } catch (listError: any) {
      console.error(`Error checking file existence: ${listError.message}`);
      // Continue with download attempt anyway
    }
    
    // Attempt the download
    await client.download(remotePath, localPath);
    await client.close();
    
    return {
      success: true,
      message: `Successfully downloaded ${remotePath} to ${localPath}`
    };
  } catch (error: any) {
    downloadError = error;
    console.error(`Download error: ${error.message}`, error);
    
    // Try to close the client connection even after error
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error closing FTP client after download error:', closeError);
    }
    
    // Format a more user-friendly error message
    let errorMessage = error.message || String(error);
    
    // Handle specific FTP error codes
    if (errorMessage.includes('550')) {
      if (errorMessage.includes('not supported')) {
        errorMessage = `The FTP server does not support downloading '${remotePath}'. The file may not exist or server configuration prevents downloads.`;
      } else if (errorMessage.includes('No such file')) {
        errorMessage = `File '${remotePath}' was not found on the FTP server.`;
      } else {
        errorMessage = `Unable to download '${remotePath}'. Error 550: ${errorMessage}`;
      }
    }
    
    return {
      success: false,
      message: `Failed to download file: ${errorMessage}`
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