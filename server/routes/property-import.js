/**
 * Property Import Routes
 * 
 * Routes for importing and managing property data.
 */

import express from 'express';
import { storage } from '../storage';
import { importPropertyData } from '../property-data-import-enhanced';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * @route POST /api/property-import/upload
 * @desc Upload and import property data files
 * @access Private
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { originalname, path } = req.file;
    const fileType = req.body.fileType || 'property'; 
    const options = {
      filePath: path,
      fileName: originalname,
      fileType,
      userId: req.body.userId || req.user?.id || 1,
      batchId: req.body.batchId || `batch_${Date.now()}`,
      validateData: req.body.validateData === 'true'
    };

    const result = await importPropertyData(options);
    
    return res.status(200).json({
      message: 'File imported successfully',
      ...result
    });
  } catch (error) {
    console.error('Property import error:', error);
    return res.status(500).json({
      message: 'Error importing property data',
      error: error.message
    });
  }
});

/**
 * @route GET /api/property-import/batches
 * @desc Get list of import batches
 * @access Private
 */
router.get('/batches', async (req, res) => {
  try {
    const batches = await storage.getImportBatches();
    return res.json(batches);
  } catch (error) {
    console.error('Error fetching import batches:', error);
    return res.status(500).json({
      message: 'Error fetching import batches',
      error: error.message
    });
  }
});

/**
 * @route GET /api/property-import/batches/:batchId
 * @desc Get details of a specific import batch
 * @access Private
 */
router.get('/batches/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const batch = await storage.getImportBatchById(batchId);
    
    if (!batch) {
      return res.status(404).json({ message: 'Import batch not found' });
    }
    
    return res.json(batch);
  } catch (error) {
    console.error('Error fetching import batch:', error);
    return res.status(500).json({
      message: 'Error fetching import batch',
      error: error.message
    });
  }
});

export default router;