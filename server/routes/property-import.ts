/**
 * Property Data Import Routes
 * 
 * This module handles the enhanced property data import routes with
 * data quality validation to ensure compliance with Washington State
 * assessment requirements and Benton County standards.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { importPropertyDataEnhanced } from '../property-data-import-enhanced';
import { dataQualityFramework } from '../data-quality';
import type { IStorage } from '../storage';

// Create router
const router = Router();

// Setup multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory as buffer
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel and CSV files
    if (
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/csv' ||
      file.originalname.toLowerCase().endsWith('.csv') ||
      file.originalname.toLowerCase().endsWith('.xlsx') ||
      file.originalname.toLowerCase().endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only Excel and CSV files are allowed'));
    }
  }
});

// Define file fields for property data import
const propertyUploadFields = [
  { name: 'propertiesFile', maxCount: 1 },
  { name: 'improvementsFile', maxCount: 1 },
  { name: 'improvementDetailsFile', maxCount: 1 },
  { name: 'improvementItemsFile', maxCount: 1 },
  { name: 'landDetailsFile', maxCount: 1 }
];

export function registerPropertyImportRoutes(app: Router, storage: IStorage) {
  /**
   * Import property data with enhanced validation
   * POST /api/properties/import
   */
  app.post("/api/properties/import-enhanced", 
    upload.fields(propertyUploadFields),
    async (req: Request, res: Response) => {
      try {
        // Get files from request
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        
        if (!files || (!files['improvementsFile'] && !files['propertiesFile'])) {
          return res.status(400).json({ 
            message: "At least one property or improvement file is required" 
          });
        }
        
        // Record file uploads
        const fileUploads: Record<string, number> = {};
        for (const [fieldName, fileArray] of Object.entries(files)) {
          const file = fileArray[0];
          const fileId = await storage.createFileUpload({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            status: 'pending'
          });
          
          fileUploads[fieldName] = fileId;
        }
        
        // Create options for import
        const options = {
          userId: req.body.userId || 1, // Use authenticated user ID if available
          batchSize: parseInt(req.body.batchSize) || 100,
          validateOnly: req.body.validateOnly === 'true',
          qualityThreshold: parseFloat(req.body.qualityThreshold) || 0.7
        } as any;
        
        // Add file buffers to options
        if (files['propertiesFile']?.[0]) {
          options.propertiesFile = files['propertiesFile'][0].buffer;
        }
        
        if (files['improvementsFile']?.[0]) {
          options.improvementsFile = files['improvementsFile'][0].buffer;
        }
        
        if (files['improvementDetailsFile']?.[0]) {
          options.improvementDetailsFile = files['improvementDetailsFile'][0].buffer;
        }
        
        if (files['improvementItemsFile']?.[0]) {
          options.improvementItemsFile = files['improvementItemsFile'][0].buffer;
        }
        
        if (files['landDetailsFile']?.[0]) {
          options.landDetailsFile = files['landDetailsFile'][0].buffer;
        }
        
        console.log("Processing enhanced property data import with validation");
        
        // Process import with buffers directly (no temporary files)
        const importResult = await importPropertyDataEnhanced(storage, options);
        
        console.log("Enhanced import result:", importResult);
        
        // Update file upload records with processed status
        for (const [fieldName, fileId] of Object.entries(fileUploads)) {
          await storage.updateFileUploadStatus(
            fileId, 
            options.validateOnly ? 'validated' : 'processed',
            {
              processed: importResult[fieldName.replace('File', '')]?.processed || 0,
              success: importResult[fieldName.replace('File', '')]?.success || 0,
              errors: importResult[fieldName.replace('File', '')]?.errors?.length || 0,
              quality: importResult[fieldName.replace('File', '')]?.quality || null
            }
          );
        }
        
        // Create activity for import completion
        await storage.createActivity({
          action: options.validateOnly 
            ? `Validated property data: ${importResult.properties?.processed || 0} properties processed, ${importResult.properties?.invalid || 0} invalid`
            : `Imported property data: ${importResult.properties?.success || 0} properties, ${importResult.improvements?.success || 0} improvements`,
          icon: "ri-file-list-line",
          iconColor: "success",
          details: [{ 
            userId: options.userId,
            fileUploads,
            validateOnly: options.validateOnly
          }]
        });
        
        // Return import result with file upload IDs and quality reports
        res.json({
          ...importResult,
          fileUploads
        });
      } catch (error: any) {
        console.error("Enhanced property import error:", error);
        res.status(500).json({ 
          message: `Error during property data import: ${error.message}`,
          error: error.stack
        });
      }
    }
  );

  /**
   * Validate property data without importing
   * POST /api/properties/validate
   */
  app.post("/api/properties/validate", 
    upload.fields(propertyUploadFields),
    async (req: Request, res: Response) => {
      try {
        req.body.validateOnly = 'true';
        
        // Forward to import route with validate flag
        const importRoute = app._router.stack
          .find((layer: any) => 
            layer.route && layer.route.path === '/api/properties/import-enhanced')
          ?.handle;
          
        if (importRoute) {
          importRoute(req, res);
        } else {
          throw new Error('Import route not found');
        }
      } catch (error: any) {
        console.error("Property validation error:", error);
        res.status(500).json({ 
          message: `Error validating property data: ${error.message}`,
          error: error.stack
        });
      }
    }
  );
  
  /**
   * Generate data quality report for imported properties
   * GET /api/properties/quality-report
   */
  app.get("/api/properties/quality-report", async (req: Request, res: Response) => {
    try {
      // Get properties from storage
      const properties = await storage.getAllProperties();
      
      if (!properties || properties.length === 0) {
        return res.status(404).json({ message: "No properties found for quality report" });
      }
      
      // Generate validation report
      const validationResult = await dataQualityFramework.validateBatch('property', properties);
      
      // Generate statistical profile
      const statisticalProfile = await dataQualityFramework.generateStatisticalProfile('property', properties);
      
      // Return combined report
      res.json({
        timestamp: new Date().toISOString(),
        totalProperties: properties.length,
        validationSummary: {
          valid: validationResult.valid,
          invalid: validationResult.invalid,
          qualityScore: validationResult.qualityScore,
          issueCount: validationResult.issues.length
        },
        topIssues: validationResult.issues
          .slice(0, 10)
          .map(issue => ({
            code: issue.code,
            message: issue.message,
            severity: issue.severity,
            count: validationResult.issues.filter(i => i.code === issue.code).length
          }))
          .filter((issue, index, self) => 
            index === self.findIndex(i => i.code === issue.code)
          ),
        statisticalInsights: {
          numericFields: Object.keys(statisticalProfile.numericProfiles).map(field => ({
            field,
            min: statisticalProfile.numericProfiles[field].min,
            max: statisticalProfile.numericProfiles[field].max,
            mean: statisticalProfile.numericProfiles[field].mean,
            median: statisticalProfile.numericProfiles[field].median,
            nullCount: statisticalProfile.numericProfiles[field].nullCount,
            stdDev: statisticalProfile.numericProfiles[field].stdDev
          })),
          categoricalFields: Object.keys(statisticalProfile.categoricalProfiles)
            .slice(0, 5) // Limit to avoid large response
            .map(field => ({
              field,
              uniqueValues: statisticalProfile.categoricalProfiles[field].uniqueCount,
              nullCount: statisticalProfile.categoricalProfiles[field].nullCount,
              topValues: statisticalProfile.categoricalProfiles[field].topValues.slice(0, 5)
            })),
          outliers: statisticalProfile.outliers.slice(0, 20) // Limit outliers for response size
        }
      });
    } catch (error: any) {
      console.error("Error generating quality report:", error);
      res.status(500).json({ 
        message: `Error generating quality report: ${error.message}`,
        error: error.stack
      });
    }
  });
  
  return router;
}