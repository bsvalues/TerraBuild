/**
 * Import Excel data to database
 * This module handles calling the Python parser and importing the data into the database
 */

import { spawn } from 'child_process';
import path from 'path';
import { promises as fs, existsSync, readFileSync, readdirSync } from 'fs';

/**
 * Process an Excel file using the Python parser and return structured data
 * @param {string} filePath - Path to the Excel file
 * @returns {Promise<object>} - Parsed data from the Excel file
 */
async function parseExcelFile(filePath) {
  return new Promise((resolve, reject) => {
    // Create temporary output file
    const tmpOutputFile = path.join(
      path.dirname(filePath),
      `tmp_parsed_${Date.now()}.json`
    );
    
    // Spawn python process to parse the Excel file
    const pythonProcess = spawn('python', [
      'enhanced_excel_parser.py',
      filePath,
      '--output',
      tmpOutputFile
    ]);
    
    let errorOutput = '';
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Python parser error: ${data}`);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        // If python process failed, reject with error
        reject(new Error(`Python parser failed with code ${code}: ${errorOutput}`));
        return;
      }
      
      try {
        // Read the parsed data from the temporary file
        const parsedData = JSON.parse(readFileSync(tmpOutputFile, 'utf8'));
        
        // Delete temporary file
        fs.unlink(tmpOutputFile)
          .catch(err => console.warn(`Warning: Could not delete temporary file ${tmpOutputFile}`, err));
        
        resolve(parsedData);
      } catch (error) {
        reject(new Error(`Failed to read parsed data: ${error.message}`));
      }
    });
  });
}

/**
 * Import cost matrix data from an Excel file into the database
 * @param {object} storage - Storage interface for database operations
 * @param {number} fileId - ID of the uploaded file
 * @param {number} userId - ID of the user who initiated the import
 * @returns {Promise<object>} - Import results
 */
async function importCostMatrixFromExcel(storage, fileId, userId) {
  // Get file information
  const fileUpload = await storage.getFileUpload(fileId);
  if (!fileUpload) {
    throw new Error('File not found');
  }
  
  try {
    // Update file status to "processing"
    await storage.updateFileUploadStatus(fileId, 'processing', 0, null);
    
    // File path is relative to the root directory
    const filePath = path.join(process.cwd(), 'uploads', path.basename(fileUpload.fileName));
    
    // If file doesn't exist at expected path, check for just the filename
    let actualFilePath = filePath;
    if (!existsSync(actualFilePath)) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      const files = readdirSync(uploadDir);
      
      // Find a file with a name or ID that matches
      const matchingFile = files.find(file => {
        return file.includes(fileUpload.id.toString()) || 
               file.includes(path.basename(fileUpload.fileName, path.extname(fileUpload.fileName)));
      });
      
      if (matchingFile) {
        actualFilePath = path.join(uploadDir, matchingFile);
      } else {
        throw new Error(`File not found in uploads directory: ${fileUpload.fileName}`);
      }
    }
    
    // Parse the Excel file
    const parsedData = await parseExcelFile(actualFilePath);
    
    // Log activity
    await storage.createActivity({
      action: `Parsed Excel file: ${fileUpload.fileName}`,
      icon: "ri-file-excel-line",
      iconColor: "success",
      userId: userId
    });
    
    // Update status to indicate validation
    await storage.updateFileUploadStatus(
      fileId, 
      'validating', 
      parsedData.data.length, 
      parsedData.data.length
    );
    
    // Get validation errors if any
    const validationErrors = parsedData.metadata.validationErrors || [];
    
    // If there are validation errors, update status and return
    if (validationErrors.length > 0) {
      await storage.updateFileUploadStatus(
        fileId, 
        'error', 
        parsedData.data.length, 
        parsedData.data.length, 
        validationErrors
      );
      
      return {
        success: false,
        imported: 0,
        updated: 0,
        errors: validationErrors
      };
    }
    
    // Import data to database
    const result = await storage.importCostMatrixFromJson(parsedData.data);
    
    // Update file status
    const status = result.errors.length > 0 ? 'completed_with_errors' : 'completed';
    await storage.updateFileUploadStatus(
      fileId, 
      status, 
      result.imported, 
      parsedData.data.length, 
      result.errors
    );
    
    // Log activity
    await storage.createActivity({
      action: `Imported ${result.imported} cost matrix entries from ${fileUpload.fileName}`,
      icon: "ri-database-2-line",
      iconColor: "success",
      userId: userId
    });
    
    return {
      success: true,
      imported: result.imported,
      updated: result.updated || 0,
      errors: result.errors
    };
  } catch (error) {
    // Update file status to "error"
    await storage.updateFileUploadStatus(
      fileId, 
      'error', 
      0, 
      null, 
      [{ message: error.message }]
    );
    
    // Log activity
    await storage.createActivity({
      action: `Error importing cost matrix from ${fileUpload.fileName}: ${error.message}`,
      icon: "ri-error-warning-line",
      iconColor: "error",
      userId: userId
    });
    
    throw error;
  }
}

export {
  parseExcelFile,
  importCostMatrixFromExcel
};