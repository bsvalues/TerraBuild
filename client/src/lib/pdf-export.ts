/**
 * PDF Export Utilities
 * 
 * This module provides functions for exporting cost predictions and other data
 * as PDF files that can be downloaded or shared.
 */
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CostPredictionResponse } from '@/hooks/use-mcp';

// Add null checking for parameters that might be undefined
function ensureString(value: string | undefined | null): string {
  return value !== undefined && value !== null ? value.toString() : '';
}

// Logo and branding
const COMPANY_NAME = "Benton County Building Cost System";
const REPORT_TITLE = "Building Cost Prediction Report";

/**
 * Generate a PDF from a cost prediction result
 * 
 * @param prediction The cost prediction data
 * @param buildingDetails Additional building details
 * @returns Promise resolving to the PDF document
 */
export async function generateCostPredictionPdf(
  prediction: CostPredictionResponse, 
  buildingDetails: {
    buildingType: string;
    squareFootage: number;
    region: string;
    yearBuilt?: number;
    condition?: string;
    complexity?: number;
  }
): Promise<jsPDF> {
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set up document properties
  doc.setProperties({
    title: `${REPORT_TITLE} - ${new Date().toLocaleDateString()}`,
    subject: 'Building Cost Prediction',
    author: COMPANY_NAME,
    keywords: 'building cost, prediction, estimate',
    creator: COMPANY_NAME
  });
  
  // Add header
  addHeader(doc);
  
  // Add report date
  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Report Generated: ${currentDate}`, 20, 35);
  
  // Add building details section
  addBuildingDetailsSection(doc, buildingDetails, 45);
  
  // Add cost prediction results section
  addCostPredictionSection(doc, prediction, 100);
  
  // Add confidence and data quality section
  if (prediction.confidenceScore !== undefined || prediction.dataQualityScore !== undefined) {
    addQualitySection(doc, prediction, 160);
  }
  
  // Add footer
  addFooter(doc);
  
  return doc;
}

/**
 * Export a cost prediction as a PDF
 * 
 * @param prediction The cost prediction data
 * @param buildingDetails Additional building details
 * @param filename Optional filename (defaults to 'cost-prediction-report.pdf')
 */
export async function exportCostPredictionAsPdf(
  prediction: CostPredictionResponse, 
  buildingDetails: {
    buildingType: string;
    squareFootage: number;
    region: string;
    yearBuilt?: number;
    condition?: string;
    complexity?: number;
  },
  filename = 'cost-prediction-report.pdf'
): Promise<void> {
  try {
    const doc = await generateCostPredictionPdf(prediction, buildingDetails);
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Generate a PDF from an HTML element
 * 
 * @param element The HTML element to convert to PDF
 * @param options Options for PDF generation
 * @returns Promise resolving to the PDF document
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  options: {
    title?: string;
    filename?: string;
    addHeader?: boolean;
    addFooter?: boolean;
  } = {}
): Promise<jsPDF> {
  // Default options
  const opts = {
    title: REPORT_TITLE,
    addHeader: true,
    addFooter: true,
    ...options
  };
  
  // Create canvas from the element
  const canvas = await html2canvas(element, {
    scale: 2, // Higher scale for better quality
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });
  
  // Calculate dimensions to fit the page
  const imgData = canvas.toDataURL('image/png');
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const marginX = 10; // X margin in mm
  const contentWidth = pageWidth - (marginX * 2);
  
  // Calculate image dimensions to maintain aspect ratio
  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Create a new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Set document properties
  doc.setProperties({
    title: `${opts.title} - ${new Date().toLocaleDateString()}`,
    subject: 'Building Cost Prediction',
    author: COMPANY_NAME,
    keywords: 'building cost, prediction, estimate',
    creator: COMPANY_NAME
  });
  
  // Add header if requested
  if (opts.addHeader) {
    addHeader(doc);
    doc.addImage(imgData, 'PNG', marginX, 40, imgWidth, imgHeight);
  } else {
    doc.addImage(imgData, 'PNG', marginX, marginX, imgWidth, imgHeight);
  }
  
  // Add footer if requested
  if (opts.addFooter) {
    addFooter(doc);
  }
  
  return doc;
}

/**
 * Export an HTML element as a PDF
 * 
 * @param element The HTML element to export
 * @param options Options for PDF generation
 * @returns Promise resolving when the PDF is saved
 */
export async function exportElementAsPdf(
  element: HTMLElement,
  options: {
    title?: string;
    filename?: string;
    addHeader?: boolean;
    addFooter?: boolean;
  } = {}
): Promise<void> {
  try {
    const doc = await generatePdfFromElement(element, options);
    doc.save(options.filename || 'export.pdf');
  } catch (error) {
    console.error('Error exporting element as PDF:', error);
    throw error;
  }
}

// Helper functions for PDF generation

/**
 * Add a header to the PDF document
 */
function addHeader(doc: jsPDF): void {
  // Add company name
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(ensureString(COMPANY_NAME), 20, 20);
  
  // Add report title
  doc.setFontSize(16);
  doc.setTextColor(70, 70, 70);
  doc.text(ensureString(REPORT_TITLE), 20, 30);
  
  // Add a horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);
}

/**
 * Add a footer to the PDF document
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const footerText = `${ensureString(COMPANY_NAME)} • Generated ${new Date().toLocaleDateString()}`;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(ensureString(footerText), 20, 287);
    doc.text(`Page ${i} of ${pageCount}`, 180, 287, { align: 'right' });
  }
}

/**
 * Add building details section to the PDF
 */
function addBuildingDetailsSection(
  doc: jsPDF, 
  details: {
    buildingType: string;
    squareFootage: number;
    region: string;
    yearBuilt?: number;
    condition?: string;
    complexity?: number;
  },
  yPosition: number
): void {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Building Details', 20, yPosition);
  
  // Section content
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const entries = [
    ['Building Type', formatBuildingType(details.buildingType)],
    ['Square Footage', `${details.squareFootage.toLocaleString()} sq ft`],
    ['Region', formatRegion(details.region)],
  ];
  
  if (details.yearBuilt) {
    entries.push(['Year Built', details.yearBuilt.toString()]);
  }
  
  if (details.condition) {
    entries.push(['Condition', formatCondition(details.condition)]);
  }
  
  if (details.complexity) {
    entries.push(['Complexity Factor', details.complexity.toString()]);
  }
  
  // Draw a light box around the details
  const boxMargin = 5;
  const lineHeight = 7;
  const boxHeight = entries.length * lineHeight + (boxMargin * 2);
  
  doc.setFillColor(248, 250, 252); // Light gray background
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPosition + 5, 170, boxHeight, 3, 3, 'FD');
  
  // Add the entries
  let entryY = yPosition + boxMargin + 10;
  entries.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(ensureString(label) + ':', 25, entryY);
    doc.setFont(undefined, 'normal');
    doc.text(ensureString(value), 70, entryY);
    entryY += lineHeight;
  });
}

/**
 * Add cost prediction section to the PDF
 */
function addCostPredictionSection(
  doc: jsPDF, 
  prediction: CostPredictionResponse,
  yPosition: number
): void {
  // Section title
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Cost Prediction Results', 20, yPosition);
  
  // Draw a highlighted box for the total cost
  doc.setFillColor(235, 245, 255); // Light blue background
  doc.setDrawColor(200, 220, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPosition + 5, 170, 20, 3, 3, 'FD');
  
  // Add total cost
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.setFont(undefined, 'bold');
  doc.text('Total Estimated Cost:', 25, yPosition + 15);
  
  // Format the total cost with currency
  const formattedCost = `$${prediction.totalCost.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 90, 180); // Blue text for emphasis
  doc.text(formattedCost, 170, yPosition + 15, { align: 'right' });
  
  // Add cost breakdown
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const entries = [
    ['Cost Per Square Foot', `$${prediction.costPerSquareFoot.toFixed(2)}`],
  ];
  
  if (prediction.baseCost !== undefined) {
    entries.push(['Base Cost', `$${prediction.baseCost.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`]);
  }
  
  if (prediction.regionFactor !== undefined) {
    entries.push(['Region Factor', typeof prediction.regionFactor === 'number' 
      ? prediction.regionFactor.toFixed(2) 
      : ensureString(prediction.regionFactor)
    ]);
  }
  
  if (prediction.complexityFactor !== undefined) {
    entries.push(['Complexity Factor', typeof prediction.complexityFactor === 'number' 
      ? prediction.complexityFactor.toFixed(2) 
      : ensureString(prediction.complexityFactor)
    ]);
  }
  
  // Draw a light box around the details
  const boxMargin = 5;
  const lineHeight = 7;
  const boxHeight = entries.length * lineHeight + (boxMargin * 2);
  
  doc.setFillColor(250, 250, 250); // Very light gray background
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(20, yPosition + 30, 170, boxHeight, 3, 3, 'FD');
  
  // Add the entries
  let entryY = yPosition + boxMargin + 35;
  entries.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(ensureString(label) + ':', 25, entryY);
    doc.setFont(undefined, 'normal');
    doc.text(ensureString(value), 120, entryY);
    entryY += lineHeight;
  });
  
  // Add explanation if available
  if (prediction.explanation) {
    const yStart = yPosition + 30 + boxHeight + 10;
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.setFont(undefined, 'bold');
    doc.text('Analysis:', 20, yStart);
    doc.setFont(undefined, 'normal');
    
    // Wrap the explanation text to fit the page
    const textLines = doc.splitTextToSize(ensureString(prediction.explanation), 160);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(textLines, 20, yStart + 7);
  }
}

/**
 * Add quality metrics section to the PDF
 */
function addQualitySection(
  doc: jsPDF, 
  prediction: CostPredictionResponse,
  yPosition: number
): void {
  // Section title
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Prediction Quality Metrics', 20, yPosition);
  
  // Add confidence score
  if (prediction.confidenceScore !== undefined) {
    const confidencePercentage = Math.round(prediction.confidenceScore * 100);
    let confidenceColor = [150, 150, 150]; // Default gray
    
    if (confidencePercentage >= 80) {
      confidenceColor = [39, 174, 96]; // Green
    } else if (confidencePercentage >= 60) {
      confidenceColor = [241, 196, 15]; // Yellow/Amber
    } else {
      confidenceColor = [231, 76, 60]; // Red
    }
    
    // Confidence score with color-based gauge
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Confidence Score:', 25, yPosition + 10);
    
    // Draw confidence gauge background
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(100, yPosition + 6, 60, 6, 2, 2, 'FD');
    
    // Draw confidence gauge fill
    doc.setFillColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    doc.setDrawColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    const fillWidth = Math.min(60 * (prediction.confidenceScore), 60);
    doc.roundedRect(100, yPosition + 6, fillWidth, 6, 2, 2, 'FD');
    
    // Add percentage text
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`${confidencePercentage}%`, 170, yPosition + 10, { align: 'right' });
  }
  
  // Add data quality score if available
  if (prediction.dataQualityScore !== undefined) {
    const qualityPercentage = Math.round(prediction.dataQualityScore * 100);
    let qualityColor = [150, 150, 150]; // Default gray
    
    if (qualityPercentage >= 80) {
      qualityColor = [39, 174, 96]; // Green
    } else if (qualityPercentage >= 60) {
      qualityColor = [241, 196, 15]; // Yellow/Amber
    } else {
      qualityColor = [231, 76, 60]; // Red
    }
    
    // Data quality score with color-based gauge
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text('Data Quality Score:', 25, yPosition + 20);
    
    // Draw data quality gauge background
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(100, yPosition + 16, 60, 6, 2, 2, 'FD');
    
    // Draw data quality gauge fill
    doc.setFillColor(qualityColor[0], qualityColor[1], qualityColor[2]);
    doc.setDrawColor(qualityColor[0], qualityColor[1], qualityColor[2]);
    const fillWidth = Math.min(60 * (prediction.dataQualityScore), 60);
    doc.roundedRect(100, yPosition + 16, fillWidth, 6, 2, 2, 'FD');
    
    // Add percentage text
    doc.setFont(undefined, 'normal');
    doc.setTextColor(40, 40, 40);
    doc.text(`${qualityPercentage}%`, 170, yPosition + 20, { align: 'right' });
  }
  
  // Add anomalies if available
  if (prediction.anomalies && prediction.anomalies.length > 0) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(180, 120, 0); // Amber/Orange color for warnings
    doc.text('Data Quality Warnings:', 25, yPosition + 35);
    
    // List anomalies as bullet points
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    prediction.anomalies.forEach((anomaly, index) => {
      const bulletY = yPosition + 40 + (index * 5);
      doc.text('•', 30, bulletY);
      
      // Wrap the anomaly text to fit
      const textLines = doc.splitTextToSize(ensureString(anomaly), 140);
      doc.text(textLines, 35, bulletY);
    });
  }
}

// Helper functions for formatting

/**
 * Format building type for display
 */
function formatBuildingType(type: string | undefined): string {
  return ensureString(type).charAt(0).toUpperCase() + ensureString(type).slice(1);
}

/**
 * Format region for display
 */
function formatRegion(region: string | undefined): string {
  return ensureString(region).charAt(0).toUpperCase() + ensureString(region).slice(1) + ' Region';
}

/**
 * Format condition for display
 */
function formatCondition(condition: string | undefined): string {
  return ensureString(condition).charAt(0).toUpperCase() + ensureString(condition).slice(1);
}