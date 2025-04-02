/**
 * Report Controller
 * 
 * This controller handles report generation and exporting functionality
 * including JSON, CSV, and PDF report formats.
 * 
 * It provides comprehensive cost data in various export formats to meet
 * different user needs - from data processing to printable reports.
 */

import { Request, Response } from 'express';
import { storage } from '../storage';

/**
 * Generate and export a report for a specific calculation
 * 
 * @param req - Express request object containing route parameters and query parameters:
 *   - id: The ID of the calculation to analyze
 *   - format: The export format (json, csv, pdf)
 * @param res - Express response object
 * @returns Report data in the requested format
 */
export async function exportReport(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing calculation ID' });
    }
    
    // Parse ID to ensure it's a valid number
    const calcId = parseInt(id);
    if (isNaN(calcId)) {
      return res.status(400).json({ error: 'Invalid calculation ID format' });
    }
    
    // Get the calculation from storage
    const calc = await storage.getBuildingCost(calcId);
    
    if (!calc) {
      return res.status(404).json({ error: 'Calculation not found' });
    }
    
    // Ensure totalCost is a valid number
    const totalCost = parseFloat(calc.totalCost);
    if (isNaN(totalCost)) {
      return res.status(500).json({ error: 'Invalid total cost value in calculation' });
    }
    
    // Use an enhanced breakdown based on building type and complexity
    // This would normally come from a more sophisticated calculation engine
    let materialsPct = 0.65; // Default 65% materials
    let laborPct = 0.25;     // Default 25% labor
    let permitsPct = 0.05;   // Default 5% permits
    let otherPct = 0.05;     // Default 5% other costs
    
    // Adjust percentages based on building type
    if (calc.buildingType === 'commercial') {
      materialsPct = 0.60;
      laborPct = 0.25;
      permitsPct = 0.08;
      otherPct = 0.07;
    } else if (calc.buildingType === 'industrial') {
      materialsPct = 0.70;
      laborPct = 0.20;
      permitsPct = 0.05;
      otherPct = 0.05;
    }
    
    // Further adjust based on complexity factor
    if (calc.complexityFactor === 'complex') {
      // Complex buildings have higher labor costs
      materialsPct -= 0.05;
      laborPct += 0.05;
    } else if (calc.complexityFactor === 'simple') {
      // Simple buildings have lower labor costs
      materialsPct += 0.05;
      laborPct -= 0.05;
    }
    
    // Calculate the actual cost values
    const materials = Math.round(totalCost * materialsPct * 100) / 100;
    const labor = Math.round(totalCost * laborPct * 100) / 100;
    const permits = Math.round(totalCost * permitsPct * 100) / 100;
    const other = Math.round(totalCost * otherPct * 100) / 100;

    // Generate cost breakdown with percentage values
    const costBreakdown = {
      materials,
      labor,
      permits,
      other,
      percentages: {
        materials: Math.round(materialsPct * 100),
        labor: Math.round(laborPct * 100),
        permits: Math.round(permitsPct * 100),
        other: Math.round(otherPct * 100)
      }
    };
    
    // Get or calculate other metrics
    const costPerSqFt = parseFloat(calc.costPerSqft);
    
    // Include regional metrics for comparison
    // In a real implementation, we would fetch this from the database
    const regionalAverage = await getRegionalAverage(calc.region, calc.buildingType);
    const statewideAverage = await getStatewideAverage(calc.buildingType);
    
    // Generate comprehensive report data
    const reportData = {
      calculation: {
        id: calc.id,
        name: calc.name || `Calculation #${calc.id}`,
        buildingType: calc.buildingType,
        squareFootage: calc.squareFootage,
        region: calc.region,
        complexityFactor: calc.complexityFactor,
        conditionFactor: calc.conditionFactor || 'average',
        totalCost,
        costPerSqFt,
        createdAt: calc.createdAt
      },
      costBreakdown,
      comparisons: {
        regionalAverage,
        statewideAverage,
        percentDiffFromRegional: regionalAverage ? 
          Math.round((totalCost - regionalAverage) / regionalAverage * 100) : null,
        percentDiffFromStatewide: statewideAverage ?
          Math.round((totalCost - statewideAverage) / statewideAverage * 100) : null
      },
      generatedAt: new Date().toISOString()
    };
    
    // Export based on requested format
    if (format === 'json') {
      return res.status(200).json(reportData);
    } else if (format === 'csv') {
      // Generate CSV format
      const csv = generateCSVReport(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${calc.id}.csv"`);
      return res.status(200).send(csv);
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
        message: 'Supported formats are: json, csv, pdf'
      });
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'Error generating report' });
  }
}

/**
 * Get regional average cost for a similar building
 * @param region The region to analyze
 * @param buildingType The building type
 * @returns The average cost for the region, or null if no data is available
 */
async function getRegionalAverage(region: string, buildingType: string): Promise<number | null> {
  try {
    // In a real implementation, we would query the database for this data
    // For now, we'll return mock averages based on region and building type
    const allMatrix = await storage.getAllCostMatrix();
    
    const matchingEntries = allMatrix.filter((item: any) => {
      return item.region === region && 
             item.buildingType === buildingType &&
             item.isActive === true;
    });
    
    if (matchingEntries.length === 0) {
      return null;
    }
    
    // Calculate the average base cost (normally we would use actual building cost records)
    const totalBaseCost = matchingEntries.reduce((sum: number, entry: any) => {
      return sum + parseFloat(entry.baseCost);
    }, 0);
    
    return Math.round((totalBaseCost / matchingEntries.length) * 100) / 100;
  } catch (error) {
    console.error('Error getting regional average:', error);
    return null;
  }
}

/**
 * Get statewide average cost for a similar building
 * @param buildingType The building type
 * @returns The average cost statewide, or null if no data is available
 */
async function getStatewideAverage(buildingType: string): Promise<number | null> {
  try {
    // In a real implementation, we would query the database for this data
    // For now, we'll calculate an average from all regions for the same building type
    const allMatrix = await storage.getAllCostMatrix();
    
    const matchingEntries = allMatrix.filter((item: any) => {
      return item.buildingType === buildingType && item.isActive === true;
    });
    
    if (matchingEntries.length === 0) {
      return null;
    }
    
    // Calculate the average base cost
    const totalBaseCost = matchingEntries.reduce((sum: number, entry: any) => {
      return sum + parseFloat(entry.baseCost);
    }, 0);
    
    return Math.round((totalBaseCost / matchingEntries.length) * 100) / 100;
  } catch (error) {
    console.error('Error getting statewide average:', error);
    return null;
  }
}

/**
 * Generate a CSV report from the report data
 * @param reportData The report data object
 * @returns CSV string
 */
function generateCSVReport(reportData: any): string {
  const { calculation, costBreakdown, comparisons } = reportData;
  
  // Format dates
  const createdAt = new Date(calculation.createdAt).toLocaleDateString();
  const generatedAt = new Date(reportData.generatedAt).toLocaleDateString();
  
  // Build the CSV content
  let csv = 'Building Cost Report\n';
  csv += `Generated on,${generatedAt}\n\n`;
  
  // Basic calculation information
  csv += 'CALCULATION DETAILS\n';
  csv += `Report ID,${calculation.id}\n`;
  csv += `Name,${calculation.name}\n`;
  csv += `Created,${createdAt}\n`;
  csv += `Building Type,${calculation.buildingType}\n`;
  csv += `Square Footage,${calculation.squareFootage}\n`;
  csv += `Region,${calculation.region}\n`;
  csv += `Complexity Factor,${calculation.complexityFactor}\n`;
  csv += `Condition Factor,${calculation.conditionFactor}\n\n`;
  
  // Cost information
  csv += 'COST DETAILS\n';
  csv += `Total Cost,$${calculation.totalCost.toLocaleString()}\n`;
  csv += `Cost Per Square Foot,$${calculation.costPerSqFt.toLocaleString()}\n\n`;
  
  // Cost breakdown
  csv += 'COST BREAKDOWN\n';
  csv += 'Category,Amount,Percentage\n';
  csv += `Materials,$${costBreakdown.materials.toLocaleString()},${costBreakdown.percentages.materials}%\n`;
  csv += `Labor,$${costBreakdown.labor.toLocaleString()},${costBreakdown.percentages.labor}%\n`;
  csv += `Permits,$${costBreakdown.permits.toLocaleString()},${costBreakdown.percentages.permits}%\n`;
  csv += `Other,$${costBreakdown.other.toLocaleString()},${costBreakdown.percentages.other}%\n\n`;
  
  // Cost comparisons
  csv += 'COST COMPARISONS\n';
  if (comparisons.regionalAverage) {
    csv += `Regional Average,$${comparisons.regionalAverage.toLocaleString()},${comparisons.percentDiffFromRegional > 0 ? '+' : ''}${comparisons.percentDiffFromRegional}%\n`;
  } else {
    csv += 'Regional Average,Not available,\n';
  }
  
  if (comparisons.statewideAverage) {
    csv += `Statewide Average,$${comparisons.statewideAverage.toLocaleString()},${comparisons.percentDiffFromStatewide > 0 ? '+' : ''}${comparisons.percentDiffFromStatewide}%\n`;
  } else {
    csv += 'Statewide Average,Not available,\n';
  }
  
  return csv;
}