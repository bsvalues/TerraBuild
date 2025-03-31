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
const REPORT_TITLE = "Building Cost Report";

// Blue theme colors for PDF
const BLUE_PRIMARY = [59, 130, 246]; // #3B82F6
const BLUE_DARK = [30, 64, 175]; // #1E40AF
const BLUE_LIGHT = [219, 234, 254]; // #DBEAFE
const BLUE_LIGHTER = [239, 246, 255]; // #EFF6FF

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
    
    // Add modern blue gradient header
    addModernHeader(doc);
    
    // Add report date
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Generated: ${currentDate}`, 20, 35);
    
    // Add building details section with modern styling
    addBuildingDetailsSection(doc, buildingDetails, 45);
    
    // Add cost prediction results section with card styling
    addCostPredictionSection(doc, prediction, 100);
    
    // Add confidence and data quality section
    if (prediction.confidenceScore !== undefined || prediction.dataQualityScore !== undefined) {
      addQualitySection(doc, prediction, 160);
    }
    
    // Add footer
    addModernFooter(doc);
    
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
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
      subject: 'Building Cost Report',
      author: COMPANY_NAME,
      keywords: 'building cost, estimate',
      creator: COMPANY_NAME
    });
    
    // Add header if requested
    if (opts.addHeader) {
      addModernHeader(doc);
      doc.addImage(imgData, 'PNG', marginX, 40, imgWidth, imgHeight);
    } else {
      doc.addImage(imgData, 'PNG', marginX, marginX, imgWidth, imgHeight);
    }
    
    // Add footer if requested
    if (opts.addFooter) {
      addModernFooter(doc);
    }
    
    doc.save(options.filename || 'export.pdf');
  } catch (error) {
    console.error('Error exporting element as PDF:', error);
    throw error;
  }
}

// Helper functions for PDF generation with modern styling

/**
 * Add a modern header with blue gradient to the PDF document
 */
function addModernHeader(doc: jsPDF): void {
  // Create blue gradient header bar
  doc.saveGraphicsState();
  
  // Draw gradient rectangle
  doc.setFillColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
  doc.rect(0, 0, 210, 25, 'F');
  
  // Add company name in white
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(ensureString(COMPANY_NAME), 20, 15);
  
  // Add report title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);
  doc.text(ensureString(REPORT_TITLE), 20, 22);
  
  doc.restoreGraphicsState();
}

/**
 * Add a modern footer to the PDF document
 */
function addModernFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add blue line
    doc.setDrawColor(BLUE_PRIMARY[0], BLUE_PRIMARY[1], BLUE_PRIMARY[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 282, 190, 282);
    
    // Add footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const footerText = `${ensureString(COMPANY_NAME)} • Generated ${new Date().toLocaleDateString()}`;
    doc.text(ensureString(footerText), 20, 287);
    
    // Add page numbers
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BLUE_PRIMARY[0], BLUE_PRIMARY[1], BLUE_PRIMARY[2]);
    doc.text(`Page ${i} of ${pageCount}`, 180, 287, { align: 'right' });
  }
}

/**
 * Add building details section to the PDF with card styling
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
  // Section title with blue styling
  doc.setFontSize(14);
  doc.setTextColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Building Details', 20, yPosition);
  
  // Draw a card with light blue gradient for the details
  const boxMargin = 5;
  const lineHeight = 7;
  
  // Prepare data entries
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
  
  const boxHeight = entries.length * lineHeight + (boxMargin * 4);
  
  // Draw card with rounded corners and blue border
  doc.setFillColor(BLUE_LIGHTER[0], BLUE_LIGHTER[1], BLUE_LIGHTER[2]); 
  doc.setDrawColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPosition + 5, 170, boxHeight, 3, 3, 'FD');
  
  // Add the entries with improved styling
  let entryY = yPosition + boxMargin * 2 + 7;
  entries.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text(ensureString(label) + ':', 25, entryY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BLUE_PRIMARY[0], BLUE_PRIMARY[1], BLUE_PRIMARY[2]);
    doc.text(ensureString(value), 70, entryY);
    
    entryY += lineHeight;
  });
}

/**
 * Add cost prediction section to the PDF with modern card styling
 */
function addCostPredictionSection(
  doc: jsPDF, 
  prediction: CostPredictionResponse,
  yPosition: number
): void {
  // Section title with blue styling
  doc.setFontSize(14);
  doc.setTextColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Analysis Results', 20, yPosition);
  
  // Create a highlighted card for the total cost with modern gradient style
  doc.setFillColor(BLUE_LIGHT[0], BLUE_LIGHT[1], BLUE_LIGHT[2]); 
  doc.setDrawColor(BLUE_PRIMARY[0], BLUE_PRIMARY[1], BLUE_PRIMARY[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, yPosition + 5, 170, 20, 3, 3, 'FD');
  
  // Add total cost with improved styling
  doc.setFontSize(12);
  doc.setTextColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Estimated Cost:', 25, yPosition + 17);
  
  // Format the total cost with currency
  const formattedCost = `$${prediction.totalCost.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
  
  doc.setFontSize(14);
  doc.setTextColor(BLUE_PRIMARY[0], BLUE_PRIMARY[1], BLUE_PRIMARY[2]);
  doc.text(formattedCost, 170, yPosition + 17, { align: 'right' });
  
  // Add cost breakdown in modern card style
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
      ? prediction.regionFactor.toFixed(2) + 'x' 
      : ensureString(prediction.regionFactor)
    ]);
  }
  
  if (prediction.complexityFactor !== undefined) {
    entries.push(['Complexity Factor', typeof prediction.complexityFactor === 'number' 
      ? prediction.complexityFactor.toFixed(2) + 'x'
      : ensureString(prediction.complexityFactor)
    ]);
  }
  
  // Draw a light box around the details with modern style
  const boxMargin = 5;
  const lineHeight = 8;
  const boxHeight = entries.length * lineHeight + (boxMargin * 4);
  
  doc.setFillColor(250, 250, 250); 
  doc.setDrawColor(230, 230, 230);
  doc.roundedRect(20, yPosition + 30, 170, boxHeight, 3, 3, 'FD');
  
  // Add the entries with improved styling
  let entryY = yPosition + boxMargin * 2 + 33;
  entries.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(ensureString(label) + ':', 25, entryY);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(ensureString(value), 120, entryY);
    
    entryY += lineHeight;
  });
  
  // Add explanation if available
  if (prediction.explanation) {
    const yStart = yPosition + 30 + boxHeight + 10;
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 225, 230);
    
    // First measure the text to determine box height
    const textLines = doc.splitTextToSize(ensureString(prediction.explanation), 160);
    const textHeight = textLines.length * 5 + 14; // Estimated text height plus padding
    
    // Draw explanation box
    doc.roundedRect(20, yStart, 170, textHeight, 3, 3, 'FD');
    
    // Add title and text
    doc.setFontSize(11);
    doc.setTextColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis:', 25, yStart + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(textLines, 25, yStart + 14);
  }
}

/**
 * Add quality metrics section to the PDF with modern styling
 */
function addQualitySection(
  doc: jsPDF, 
  prediction: CostPredictionResponse,
  yPosition: number
): void {
  // Section title
  doc.setFontSize(12);
  doc.setTextColor(BLUE_DARK[0], BLUE_DARK[1], BLUE_DARK[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Prediction Quality Metrics', 20, yPosition);
  
  // Add confidence score with modern gauge
  if (prediction.confidenceScore !== undefined) {
    const confidencePercentage = Math.round(prediction.confidenceScore * 100);
    let confidenceColor = [150, 150, 150]; // Default gray
    
    if (confidencePercentage >= 80) {
      confidenceColor = [34, 197, 94]; // Green
    } else if (confidencePercentage >= 60) {
      confidenceColor = [234, 179, 8]; // Yellow/Amber
    } else {
      confidenceColor = [239, 68, 68]; // Red
    }
    
    // Add label for confidence score
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Confidence Score:', 25, yPosition + 10);
    
    // Draw modern rounded gauge background
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(100, yPosition + 6, 60, 6, 3, 3, 'FD');
    
    // Draw confidence gauge fill with rounded corners
    doc.setFillColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    doc.setDrawColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    const fillWidth = Math.min(60 * (prediction.confidenceScore), 60);
    doc.roundedRect(100, yPosition + 6, fillWidth, 6, 3, 3, 'FD');
    
    // Add percentage text
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`${confidencePercentage}%`, 170, yPosition + 10, { align: 'right' });
  }
  
  // Add data quality score with modern styling
  if (prediction.dataQualityScore !== undefined) {
    const qualityPercentage = Math.round(prediction.dataQualityScore * 100);
    let qualityColor = [150, 150, 150]; // Default gray
    
    if (qualityPercentage >= 80) {
      qualityColor = [34, 197, 94]; // Green
    } else if (qualityPercentage >= 60) {
      qualityColor = [234, 179, 8]; // Yellow/Amber
    } else {
      qualityColor = [239, 68, 68]; // Red
    }
    
    // Add label for data quality
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('Data Quality Score:', 25, yPosition + 22);
    
    // Draw modern rounded gauge background
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(100, yPosition + 18, 60, 6, 3, 3, 'FD');
    
    // Draw data quality gauge fill with rounded corners
    doc.setFillColor(qualityColor[0], qualityColor[1], qualityColor[2]);
    doc.setDrawColor(qualityColor[0], qualityColor[1], qualityColor[2]);
    const fillWidth = Math.min(60 * (prediction.dataQualityScore), 60);
    doc.roundedRect(100, yPosition + 18, fillWidth, 6, 3, 3, 'FD');
    
    // Add percentage text
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`${qualityPercentage}%`, 170, yPosition + 22, { align: 'right' });
  }
  
  // Add anomalies with modern warning card if available
  if (prediction.anomalies && prediction.anomalies.length > 0) {
    const yStart = yPosition + 35;
    
    // Draw warning card
    doc.setFillColor(255, 247, 237); // Light orange/amber background
    doc.setDrawColor(251, 191, 36); // Amber border
    
    // First measure the text to determine box height
    const textHeight = (prediction.anomalies.length * 6) + 15; // Estimated text height plus padding
    doc.roundedRect(20, yStart, 170, textHeight, 3, 3, 'FD');
    
    // Add warning title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9); // Dark amber/orange for title
    doc.text('Data Quality Warnings:', 25, yStart + 7);
    
    // List anomalies as bullet points with improved styling
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 53, 15); // Darker text for better readability
    
    prediction.anomalies.forEach((anomaly, index) => {
      const bulletY = yStart + 15 + (index * 6);
      doc.text('•', 30, bulletY);
      
      // Wrap the anomaly text to fit
      const textLines = doc.splitTextToSize(ensureString(anomaly), 135);
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