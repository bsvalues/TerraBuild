import express from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /api/reports
 * 
 * Get all reports
 */
router.get('/', async (req, res) => {
  try {
    // Get all reports ordered by creation date
    const result = await sql`
      SELECT id, title, description, report_type, created_at, is_public
      FROM reports
      ORDER BY created_at DESC
    `.execute(db);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message
    });
  }
});

/**
 * GET /api/reports/:id
 * 
 * Get a specific report by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    
    // Validate report ID
    if (isNaN(reportId)) {
      return res.status(400).json({
        error: 'Invalid report ID'
      });
    }
    
    // Get report by ID
    const result = await sql`
      SELECT *
      FROM reports
      WHERE id = ${reportId}
    `.execute(db);
    
    // Check if report exists
    if (result.length === 0) {
      return res.status(404).json({
        error: 'Report not found'
      });
    }
    
    res.json(result[0]);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      error: 'Failed to fetch report',
      message: error.message
    });
  }
});

export default router;