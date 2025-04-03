import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CostCalculation {
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

export interface PDFOptions {
  title?: string;
  showLogo?: boolean;
  includeDate?: boolean;
  includeMaterials?: boolean;
  contactInfo?: string;
  includeNotes?: boolean;
  notes?: string;
}

const defaultOptions: PDFOptions = {
  title: 'Benton County Building Cost Report',
  showLogo: true,
  includeDate: true,
  includeMaterials: true,
  includeNotes: false,
  notes: '',
};

/**
 * Generate a PDF report of the building cost calculation
 */
export async function generateCostReport(
  calculation: CostCalculation,
  options: PDFOptions = {}
): Promise<Blob> {
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Set up document properties
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Add document title
  pdf.setFontSize(20);
  pdf.setTextColor(36, 62, 77); // #243E4D - Benton County dark teal
  pdf.text(mergedOptions.title || 'Building Cost Report', pageWidth / 2, margin, { align: 'center' });
  
  // Add date if requested
  if (mergedOptions.includeDate) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`Report Date: ${currentDate}`, pageWidth - margin, margin, { align: 'right' });
  }
  
  // Add logo if requested
  if (mergedOptions.showLogo) {
    // In a real implementation, we would add the logo here
    // This would typically involve loading an image and adding it to the PDF
    // For now, we'll just add a placeholder
    pdf.setFontSize(12);
    pdf.setTextColor(60, 171, 54); // #3CAB36 - Benton County green
    pdf.text('BENTON COUNTY', margin, margin + 5);
    pdf.setFontSize(8);
    pdf.text('WASHINGTON', margin, margin + 10);
  }
  
  // Add a separator line
  pdf.setDrawColor(41, 183, 211); // #29B7D3 - Benton County light blue
  pdf.setLineWidth(0.5);
  pdf.line(margin, margin + 15, pageWidth - margin, margin + 15);
  
  // Building information section
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Building Information', margin, margin + 25);
  
  // Create a building info table
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  
  const buildingTypeMap = {
    'RESIDENTIAL': 'Residential',
    'COMMERCIAL': 'Commercial',
    'INDUSTRIAL': 'Industrial'
  };
  
  const regionMap = {
    'NORTHWEST': 'Northwest',
    'NORTHEAST': 'Northeast',
    'MIDWEST': 'Midwest',
    'SOUTHWEST': 'Southwest',
    'SOUTHEAST': 'Southeast',
    'WEST': 'West',
    'EAST': 'East',
    'CENTRAL': 'Central'
  };
  
  const qualityMap = {
    'ECONOMY': 'Economy',
    'STANDARD': 'Standard',
    'CUSTOM': 'Custom',
    'LUXURY': 'Luxury',
    'PREMIUM': 'Premium'
  };
  
  const infoLines = [
    `Building Type: ${buildingTypeMap[calculation.buildingType as keyof typeof buildingTypeMap] || calculation.buildingType}`,
    `Square Footage: ${calculation.squareFootage.toLocaleString()} sq ft`,
    `Quality Level: ${qualityMap[calculation.quality as keyof typeof qualityMap] || calculation.quality}`,
    `Building Age: ${calculation.buildingAge} ${calculation.buildingAge === 1 ? 'year' : 'years'}`,
    `Region: ${regionMap[calculation.region as keyof typeof regionMap] || calculation.region}`,
  ];
  
  let yPos = margin + 30;
  infoLines.forEach(line => {
    pdf.text(line, margin, yPos);
    yPos += 7;
  });
  
  // Cost Calculation section
  yPos += 5;
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Cost Calculation', margin, yPos);
  yPos += 10;
  
  // Create a cost calculation table
  pdf.setFontSize(10);
  pdf.setTextColor(50, 50, 50);
  
  // Define factors with colors
  const factors = [
    { label: 'Base Cost', value: `$${calculation.baseCost.toLocaleString()}`, color: [36, 62, 77] },
    { label: 'Complexity Factor', value: `×${calculation.complexityFactor.toFixed(2)}`, color: [63, 81, 181] },
    { label: 'Condition Factor', value: `×${calculation.conditionFactor.toFixed(2)}`, color: [60, 171, 54] },
    { label: 'Regional Multiplier', value: `×${calculation.regionalMultiplier.toFixed(2)}`, color: [41, 183, 211] },
    { label: 'Age Depreciation', value: `−${calculation.ageDepreciation}%`, color: [245, 166, 35] },
  ];
  
  // Calculate column widths for the 2-column table
  const col1Width = contentWidth * 0.6;
  const col2Width = contentWidth * 0.4;
  
  // Draw the factors
  factors.forEach(factor => {
    pdf.setTextColor(factor.color[0], factor.color[1], factor.color[2]);
    pdf.text(factor.label, margin, yPos);
    pdf.text(factor.value, margin + col1Width, yPos, { align: 'right' });
    yPos += 7;
  });
  
  // Add a separator line
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 7;
  
  // Draw the total cost
  pdf.setFontSize(12);
  pdf.setTextColor(36, 62, 77); // Benton County dark teal
  pdf.text('TOTAL ESTIMATED COST', margin, yPos);
  pdf.text(`$${calculation.totalCost.toLocaleString()}`, margin + col1Width, yPos, { align: 'right' });
  yPos += 10;
  
  // Add materials breakdown if requested
  if (mergedOptions.includeMaterials && calculation.materialCosts && calculation.materialCosts.length > 0) {
    yPos += 5;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Materials Breakdown', margin, yPos);
    yPos += 10;
    
    // Table headers
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Category', margin, yPos);
    pdf.text('Description', margin + contentWidth * 0.25, yPos);
    pdf.text('Quantity', margin + contentWidth * 0.6, yPos);
    pdf.text('Unit Cost', margin + contentWidth * 0.75, yPos);
    pdf.text('Total', margin + contentWidth, yPos, { align: 'right' });
    yPos += 5;
    
    // Separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
    
    // Check if we need to create a new page for materials
    if (yPos + (calculation.materialCosts.length * 7) > pageHeight - margin) {
      pdf.addPage();
      yPos = margin + 10;
      
      // Repeat the headers on the new page
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Materials Breakdown (continued)', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Category', margin, yPos);
      pdf.text('Description', margin + contentWidth * 0.25, yPos);
      pdf.text('Quantity', margin + contentWidth * 0.6, yPos);
      pdf.text('Unit Cost', margin + contentWidth * 0.75, yPos);
      pdf.text('Total', margin + contentWidth, yPos, { align: 'right' });
      yPos += 5;
      
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
    }
    
    // Material rows
    pdf.setFontSize(8);
    pdf.setTextColor(50, 50, 50);
    
    let materialSubtotal = 0;
    calculation.materialCosts.forEach(material => {
      // Truncate long texts
      const category = material.category.length > 15 ? material.category.substring(0, 12) + '...' : material.category;
      const description = material.description.length > 20 ? material.description.substring(0, 17) + '...' : material.description;
      
      pdf.text(category, margin, yPos);
      pdf.text(description, margin + contentWidth * 0.25, yPos);
      pdf.text(material.quantity.toString(), margin + contentWidth * 0.6, yPos);
      pdf.text(`$${material.unitCost.toFixed(2)}`, margin + contentWidth * 0.75, yPos);
      pdf.text(`$${material.totalCost.toLocaleString()}`, margin + contentWidth, yPos, { align: 'right' });
      
      materialSubtotal += material.totalCost;
      yPos += 7;
      
      // Check if we need to create a new page
      if (yPos > pageHeight - margin) {
        pdf.addPage();
        yPos = margin + 10;
        
        // Repeat the headers on the new page
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Category', margin, yPos);
        pdf.text('Description', margin + contentWidth * 0.25, yPos);
        pdf.text('Quantity', margin + contentWidth * 0.6, yPos);
        pdf.text('Unit Cost', margin + contentWidth * 0.75, yPos);
        pdf.text('Total', margin + contentWidth, yPos, { align: 'right' });
        yPos += 5;
        
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        pdf.setFontSize(8);
        pdf.setTextColor(50, 50, 50);
      }
    });
    
    // Material subtotal
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 7;
    
    pdf.setFontSize(10);
    pdf.setTextColor(36, 62, 77);
    pdf.text('Materials Subtotal', margin, yPos);
    pdf.text(`$${materialSubtotal.toLocaleString()}`, margin + contentWidth, yPos, { align: 'right' });
    yPos += 10;
  }
  
  // Add notes if requested
  if (mergedOptions.includeNotes && mergedOptions.notes) {
    // Check if we need to create a new page for notes
    if (yPos + 20 > pageHeight - margin) {
      pdf.addPage();
      yPos = margin + 10;
    }
    
    yPos += 5;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Notes', margin, yPos);
    yPos += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(50, 50, 50);
    
    // Split notes into lines that fit the content width
    const noteLines = pdf.splitTextToSize(mergedOptions.notes, contentWidth);
    
    // Check if notes will fit on current page, otherwise add a new page
    if (yPos + (noteLines.length * 5) > pageHeight - margin) {
      pdf.addPage();
      yPos = margin + 10;
      
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Notes (continued)', margin, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(50, 50, 50);
    }
    
    pdf.text(noteLines, margin, yPos);
    yPos += noteLines.length * 5 + 10;
  }
  
  // Add footer with contact info if provided
  if (mergedOptions.contactInfo) {
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(mergedOptions.contactInfo, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // Add page numbers
  const totalPages = Object.keys(pdf.internal.pages).length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }
  
  // Return the PDF as a blob
  return pdf.output('blob');
}

/**
 * Export a DOM element to PDF
 */
export async function exportElementToPDF(
  element: HTMLElement,
  fileName: string = 'download.pdf',
  options: PDFOptions = {}
): Promise<void> {
  try {
    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
    });
    
    // Create PDF at the proper dimensions
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions to maintain aspect ratio
    const imgWidth = 210; // A4 width in mm (portrait)
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Create PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Add title if specified
    if (options.title) {
      pdf.setFontSize(16);
      pdf.setTextColor(36, 62, 77); // Benton County dark teal
      pdf.text(options.title, pdf.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    }
    
    // Calculate starting Y position based on whether a title was added
    const yPos = options.title ? 25 : 10;
    
    // Add the image
    pdf.addImage(imgData, 'PNG', 10, yPos, imgWidth - 20, imgHeight - 20);
    
    // Save the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}