/**
 * Excel Export Generator for Building Cost Calculator
 * 
 * This utility provides functions to generate Excel spreadsheets
 * for building cost calculations.
 */

/**
 * Interface for building cost data
 */
export interface CostCalculation {
  buildingType: string;
  squareFootage: number;
  quality: string;
  buildingAge: number;
  region: string;
  complexityFactor: number;
  conditionFactor: number;
  baseCost: number;
  regionalMultiplier: number;
  ageDepreciation: number;
  totalCost: number;
  materialCosts: {
    category: string;
    description: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }[];
}

/**
 * Options for Excel generation
 */
export interface ExcelOptions {
  includeHeader?: boolean;
  includeCompanyInfo?: boolean;
  includeMaterials?: boolean;
  companyName?: string;
  companyContact?: string;
  includeBreakdown?: boolean;
  notes?: string;
}

/**
 * Generate CSV data for building cost calculation
 */
export function generateCostCSV(calculation: CostCalculation, options: ExcelOptions = {}): string {
  const mergedOptions = {
    includeHeader: true,
    includeCompanyInfo: true,
    includeMaterials: true,
    companyName: 'Benton County Building Department',
    companyContact: 'building@bentoncounty.gov • (555) 123-4567',
    includeBreakdown: true,
    notes: '',
    ...options
  };

  let csvRows: string[] = [];

  // Add company info if requested
  if (mergedOptions.includeHeader) {
    csvRows.push('Benton County Building Cost Report');
    csvRows.push(`Generated on ${new Date().toLocaleDateString()}`);
    csvRows.push('');
  }

  if (mergedOptions.includeCompanyInfo) {
    csvRows.push(`${mergedOptions.companyName}`);
    csvRows.push(`${mergedOptions.companyContact}`);
    csvRows.push('');
  }

  // Add building information
  csvRows.push('Building Information');
  csvRows.push(`Building Type,${calculation.buildingType}`);
  csvRows.push(`Square Footage,${calculation.squareFootage}`);
  csvRows.push(`Quality Level,${calculation.quality}`);
  csvRows.push(`Region,${calculation.region}`);
  csvRows.push(`Building Age,${calculation.buildingAge} years`);
  csvRows.push('');

  // Add cost factors
  csvRows.push('Cost Factors');
  csvRows.push(`Complexity Factor,${calculation.complexityFactor.toFixed(2)}`);
  csvRows.push(`Condition Factor,${calculation.conditionFactor.toFixed(2)}`);
  csvRows.push(`Regional Multiplier,${calculation.regionalMultiplier.toFixed(2)}`);
  csvRows.push(`Age Depreciation,${calculation.ageDepreciation}%`);
  csvRows.push('');

  // Add cost summary
  csvRows.push('Cost Summary');
  csvRows.push(`Base Cost,$${calculation.baseCost.toLocaleString()}`);
  csvRows.push(`Total Cost,$${calculation.totalCost.toLocaleString()}`);
  csvRows.push('');

  // Add materials if requested
  if (mergedOptions.includeMaterials && calculation.materialCosts.length > 0) {
    csvRows.push('Materials');
    csvRows.push('Description,Quantity,Unit Cost,Total Cost');
    
    calculation.materialCosts.forEach(material => {
      csvRows.push(`${material.description},${material.quantity},${material.unitCost.toLocaleString()},${material.totalCost.toLocaleString()}`);
    });
    
    csvRows.push('');
  }

  // Add notes if provided
  if (mergedOptions.notes) {
    csvRows.push('Notes');
    csvRows.push(mergedOptions.notes);
  }

  return csvRows.join('\\n');
}

/**
 * Download CSV data as a file
 */
export function downloadCSV(csvData: string, fileName: string = 'building-cost-report.csv'): void {
  // Create a CSV Blob
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  
  // Append the link, trigger click, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate and download Excel (CSV) report
 */
export function exportCostToExcel(calculation: CostCalculation, fileName: string = 'building-cost-report.csv', options: ExcelOptions = {}): void {
  const csvData = generateCostCSV(calculation, options);
  downloadCSV(csvData, fileName);
}