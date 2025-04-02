/**
 * Report Controller
 * 
 * This controller handles report generation and exporting functionality
 * including JSON and PDF report formats.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Generate and export a report for a specific calculation
 */
export async function exportReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing calculation ID' });
    }
    
    // Get the calculation from storage
    const calc = await storage.getBuildingCost(parseInt(id));
    
    if (!calc) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    const totalCost = parseFloat(calc.totalCost);
    
    // Generate cost breakdown (simplified version)
    const costBreakdown = {
      materials: Math.round(totalCost * 0.65 * 100) / 100, // 65% materials
      labor: Math.round(totalCost * 0.25 * 100) / 100,     // 25% labor
      permits: Math.round(totalCost * 0.05 * 100) / 100,   // 5% permits
      other: Math.round(totalCost * 0.05 * 100) / 100      // 5% other costs
    };
    
    // Generate report data
    const reportData = {
      calculation: calc,
      costBreakdown,
      generatedAt: new Date().toISOString()
    };
    
    // Export based on requested format
    if (format === 'json') {
      return res.status(200).json(reportData);
    } else if (format === 'pdf') {
      // For now, we'll just return a message that PDF generation is not yet implemented
      // In a real application, we would use a library like PDFKit to generate the PDF
      return res.status(501).json({
        error: 'PDF export not yet implemented',
        message: 'PDF export will be available in a future update'
      });
    } else {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Supported formats are: json, pdf'
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'Error generating report' });
  }
}