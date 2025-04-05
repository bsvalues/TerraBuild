/**
 * Export Service for the Benton County Building Cost System
 * 
 * This service handles exporting data to CSV and uploading to the FTP server.
 */

import * as fs from 'fs';
import * as path from 'path';
import { promises as fsPromises } from 'fs';
import FTPClient from './ftpService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload content to FTP server
 * 
 * @param content Content to upload
 * @param remotePath Remote path on FTP server
 * @returns Promise that resolves with upload results
 */
async function uploadContent(
  content: string,
  remotePath: string
): Promise<{success: boolean; message: string}> {
  // Create a temporary file
  const tempDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(tempDir)) {
    await fsPromises.mkdir(tempDir, { recursive: true });
  }
  
  const tempFilePath = path.join(tempDir, `temp_${uuidv4()}.csv`);
  
  try {
    // Write content to temporary file
    await fsPromises.writeFile(tempFilePath, content, 'utf8');
    
    // Upload to FTP server
    const client = new FTPClient();
    
    // Get FTP credentials from environment
    const host = process.env.FTP_HOST;
    const port = process.env.FTP_PORT ? parseInt(process.env.FTP_PORT, 10) : 21;
    const username = process.env.FTP_USERNAME;
    const password = process.env.FTP_PASSWORD;
    
    if (!host || !username || !password) {
      return {
        success: false,
        message: 'FTP credentials not configured properly'
      };
    }
    
    // Connect to FTP server
    await client.connect({
      host,
      port,
      user: username,
      password,
      secure: false
    });
    
    // Upload the file
    await client.upload(tempFilePath, remotePath);
    
    // Close the connection
    await client.close();
    
    return {
      success: true,
      message: 'Content uploaded successfully'
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to upload content: ${error.message}`
    };
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(tempFilePath)) {
        await fsPromises.unlink(tempFilePath);
      }
    } catch (error) {
      console.error('Failed to delete temporary file:', error);
    }
  }
}

/**
 * Convert an array of objects to CSV format
 * 
 * @param data Array of objects to convert to CSV
 * @param options Options for CSV conversion
 * @returns CSV string
 */
export function convertToCSV(
  data: Record<string, any>[],
  options: {
    headers?: string[];
    includeHeaders?: boolean;
    delimiter?: string;
  } = {}
): string {
  const { 
    headers = Object.keys(data[0] || {}), 
    includeHeaders = true,
    delimiter = ',' 
  } = options;
  
  let csv = '';
  
  // Add headers if requested
  if (includeHeaders) {
    csv += headers.join(delimiter) + '\n';
  }
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if the value contains delimiter, quotes, or newlines
        if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      } else if (value instanceof Date) {
        return value.toISOString();
      } else if (typeof value === 'object') {
        // Stringify objects but handle circular references
        try {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } catch (error) {
          return `"[Complex Object]"`;
        }
      }
      
      return String(value);
    });
    
    csv += row.join(delimiter) + '\n';
  });
  
  return csv;
}

/**
 * Export data to CSV and save to local file
 * 
 * @param data Data to export
 * @param filePath Path where the CSV file should be saved
 * @param options CSV conversion options
 * @returns Path to the saved file
 */
export function exportToLocalCSV(
  data: Record<string, any>[],
  filePath: string,
  options?: Parameters<typeof convertToCSV>[1]
): string {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Convert data to CSV
  const csv = convertToCSV(data, options);
  
  // Write to file
  fs.writeFileSync(filePath, csv, 'utf8');
  
  return filePath;
}

/**
 * Export data to CSV and upload to FTP server
 * 
 * @param data Data to export
 * @param remotePath Remote path on FTP server (including filename)
 * @param options CSV conversion options
 * @returns Promise that resolves with upload results
 */
export async function exportToFTP(
  data: Record<string, any>[],
  remotePath: string,
  options?: Parameters<typeof convertToCSV>[1]
): Promise<{success: boolean; message: string}> {
  if (!data || data.length === 0) {
    return {
      success: false,
      message: 'No data to export'
    };
  }
  
  try {
    console.log(`Preparing to export ${data.length} records to ${remotePath}`);
    
    // Convert data to CSV
    const csv = convertToCSV(data, options);
    console.log(`Data converted to CSV format (${csv.length} bytes)`);
    
    // Upload content to FTP
    const result = await uploadContent(csv, remotePath);
    
    if (result.success) {
      console.log(`Successfully exported data to FTP: ${remotePath}`);
    } else {
      console.error(`Failed to export data to FTP: ${result.message}`);
    }
    
    return result;
  } catch (error: any) {
    const errorMessage = `Error exporting data to FTP: ${error.message || 'Unknown error'}`;
    console.error(errorMessage);
    return {
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Export building cost data to FTP
 * 
 * @param buildingCosts Array of building cost data objects
 * @param year Year of the export (used in filename)
 * @param region Optional region filter
 * @returns Promise that resolves with export results
 */
export async function exportBuildingCostsToFTP(
  buildingCosts: Record<string, any>[],
  year: number,
  region?: string
): Promise<{success: boolean; message: string; remotePath?: string}> {
  if (!buildingCosts || buildingCosts.length === 0) {
    return {
      success: false,
      message: 'No building cost data to export'
    };
  }
  
  try {
    // Format the date portion of the filename
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    
    // Create filename: BentonCounty_BuildingCosts_YYYY_YYYYMMDD.csv
    // If region is specified, include it in the filename
    const regionPart = region ? `_${region}` : '';
    const remoteFilename = `BentonCounty_BuildingCosts_${year}${regionPart}_${dateStr}.csv`;
    
    // Remote path is the root directory plus filename
    const remotePath = `/${remoteFilename}`;
    
    console.log(`Preparing to export ${buildingCosts.length} building costs to FTP at ${remotePath}`);
    
    // Export to FTP
    const result = await exportToFTP(buildingCosts, remotePath, {
      headers: [
        'id', 'region', 'buildingType', 'buildingTypeDescription', 
        'baseCost', 'matrixYear', 'sourceMatrixId', 'matrixDescription',
        'dataPoints', 'county', 'state', 'complexityFactorBase',
        'qualityFactorBase', 'conditionFactorBase'
      ]
    });
    
    if (result.success) {
      console.log(`✓ Successfully exported ${buildingCosts.length} building costs to FTP: ${remotePath}`);
      return {
        success: true,
        message: `Successfully exported ${buildingCosts.length} building costs to FTP`,
        remotePath
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  } catch (error: any) {
    const errorMessage = `Error exporting building costs to FTP: ${error.message || 'Unknown error'}`;
    console.error(errorMessage);
    return {
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Export project progress report to FTP
 * 
 * @param projectId Project ID
 * @param projectName Project name
 * @param reportData Report data
 * @returns Promise that resolves with export results
 */
export async function exportProjectProgressToFTP(
  projectId: number,
  projectName: string,
  reportData: Record<string, any>
): Promise<{success: boolean; message: string; remotePath?: string}> {
  if (!reportData) {
    return {
      success: false,
      message: 'No project progress data to export'
    };
  }
  
  try {
    // Format the date portion of the filename
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
    
    // Sanitize project name for use in filename (remove special chars)
    const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
    
    // Create filename: BentonCounty_Project_ID_Name_YYYYMMDD_HHMM.csv
    const remoteFilename = `BentonCounty_Project_${projectId}_${safeProjectName}_${dateStr}_${timeStr}.csv`;
    
    // Use projects subfolder
    const remotePath = `/projects/${remoteFilename}`;
    
    // Flatten the report data for CSV export
    const flattenedData = flattenReportData(reportData);
    
    if (!flattenedData || flattenedData.length === 0) {
      return {
        success: false,
        message: 'No data available in project progress report'
      };
    }
    
    console.log(`Preparing to export ${flattenedData.length} project progress records to FTP at ${remotePath}`);
    
    // Export to FTP
    const result = await exportToFTP(flattenedData, remotePath);
    
    if (result.success) {
      console.log(`✓ Successfully exported project progress report to FTP: ${remotePath}`);
      return {
        success: true,
        message: `Successfully exported project progress report for "${projectName}" to FTP`,
        remotePath
      };
    } else {
      return {
        success: false,
        message: result.message
      };
    }
  } catch (error: any) {
    const errorMessage = `Error exporting project progress report to FTP: ${error.message || 'Unknown error'}`;
    console.error(errorMessage);
    return {
      success: false,
      message: errorMessage
    };
  }
}

/**
 * Helper function to flatten nested report data for CSV export
 * 
 * @param reportData Nested report data
 * @returns Flattened array suitable for CSV export
 */
function flattenReportData(reportData: Record<string, any>): Record<string, any>[] {
  // If the report data is already an array of simple objects, return it
  if (Array.isArray(reportData)) {
    return reportData;
  }
  
  // Extract project metadata
  const { project, milestones, activities, ...metadata } = reportData;
  
  // Create rows for each milestone
  const rows: Record<string, any>[] = [];
  
  if (Array.isArray(milestones)) {
    milestones.forEach(milestone => {
      const { tasks, ...milestoneData } = milestone;
      
      // Add a row for the milestone itself
      rows.push({
        ...metadata,
        itemType: 'milestone',
        name: milestoneData.name,
        description: milestoneData.description || '',
        progress: milestoneData.progress || 0,
        status: milestoneData.status || 'pending',
        dueDate: milestoneData.dueDate || ''
      });
      
      // Add rows for each task
      if (Array.isArray(tasks)) {
        tasks.forEach(task => {
          rows.push({
            ...metadata,
            itemType: 'task',
            milestoneId: milestoneData.id,
            milestoneName: milestoneData.name,
            name: task.name,
            description: task.description || '',
            progress: task.progress || 0,
            status: task.status || 'pending',
            dueDate: task.dueDate || '',
            assignedTo: task.assignedTo || ''
          });
        });
      }
    });
  }
  
  // If there are no milestones, create at least one row with project metadata
  if (rows.length === 0) {
    rows.push({
      ...metadata,
      itemType: 'project',
      name: project?.name || 'Unknown Project',
      description: project?.description || '',
      progress: project?.progress || 0,
      status: project?.status || 'pending'
    });
  }
  
  return rows;
}