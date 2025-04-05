import express, { Request, Response } from 'express';
import { storage } from '../storage';

const router = express.Router();

/**
 * Get connection history
 * Optional query params:
 * - connectionType: Filter by connection type (ftp, arcgis, sqlserver)
 * - limit: Limit number of results
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const connectionType = req.query.connectionType as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    
    const options: {
      connectionType?: string;
      limit?: number;
    } = {};
    
    if (connectionType) {
      options.connectionType = connectionType;
    }
    
    if (limit && !isNaN(limit)) {
      options.limit = limit;
    }
    
    const history = await storage.getConnectionHistory(options);
    res.json(history);
  } catch (error) {
    console.error('Error retrieving connection history:', error);
    res.status(500).json({ message: 'Failed to retrieve connection history' });
  }
});

/**
 * Get a specific connection history entry by ID
 */
router.get('/history/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }
    
    const historyEntry = await storage.getConnectionHistoryById(id);
    
    if (!historyEntry) {
      return res.status(404).json({ message: 'Connection history entry not found' });
    }
    
    res.json(historyEntry);
  } catch (error) {
    console.error('Error retrieving connection history entry:', error);
    res.status(500).json({ message: 'Failed to retrieve connection history entry' });
  }
});

export default router;