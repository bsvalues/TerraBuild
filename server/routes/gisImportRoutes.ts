/**
 * GIS Import API Routes
 * 
 * This module provides API endpoints for importing and managing
 * geographic data from Benton County's GIS repository.
 */

import express from 'express';
import { gisImportService } from '../services/gisImportService';
import { z } from 'zod';

const router = express.Router();

// Schema for import options
const gisImportOptionsSchema = z.object({
  clearExisting: z.boolean().optional(),
  repoOwner: z.string().optional(),
  repoName: z.string().optional(),
  branch: z.string().optional()
});

// Schema for local file import
const localFileImportSchema = z.object({
  filePath: z.string(),
  clearExisting: z.boolean().optional()
});

/**
 * Import GIS data from GitHub
 * POST /api/gis-import/github
 */
router.post('/github', async (req, res) => {
  try {
    // Validate request body
    const parseResult = gisImportOptionsSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: parseResult.error.format()
      });
    }
    
    // Run the import
    const result = await gisImportService.importFromGitHub(parseResult.data);
    
    res.json(result);
  } catch (error) {
    console.error('Error in GIS import from GitHub:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Import GIS data from a local file
 * POST /api/gis-import/local
 */
router.post('/local', async (req, res) => {
  try {
    // Validate request body
    const parseResult = localFileImportSchema.safeParse(req.body);
    
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: parseResult.error.format()
      });
    }
    
    // Run the import
    const result = await gisImportService.importFromLocalFile(
      parseResult.data.filePath,
      { clearExisting: parseResult.data.clearExisting }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error in GIS import from local file:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get import status from cache
 * GET /api/gis-import/status
 */
router.get('/status', (req, res) => {
  // This would check cache for the most recent import result
  // For now, return a simple status
  res.json({
    lastImport: null,
    message: 'No import data available in cache'
  });
});

export const gisImportRoutes = router;