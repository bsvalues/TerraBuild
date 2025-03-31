import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface MaterialBreakdown {
  totalCost: number;
  materials: Array<{
    materialName: string;
    percentage: number;
    totalCost: number;
  }>;
}

export interface PdfExportOptions {
  title?: string;
  filename: string;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * Applies temporary styles to elements before PDF generation
 */
export function preparePdfElement(element: HTMLElement): () => void {
  // Store original styles
  const originalStyles = new Map<HTMLElement, string>();
  
  // Apply print styles to make charts visible in PDF
  const allElements = element.querySelectorAll('*');
  
  // Save original display property
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      originalStyles.set(htmlEl, htmlEl.style.display);
      // Force all elements to be visible
      htmlEl.style.display = 'block';
    }
  });

  // Return cleanup function
  return () => {
    // Restore original styles
    originalStyles.forEach((value, el) => {
      el.style.display = value;
    });
  };
}

/**
 * Exports an HTML element to PDF
 */
export async function exportToPdf(
  element: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  const { title, filename, pageSize = 'a4', orientation = 'portrait' } = options;
  
  // Create a new PDF document
  const doc = new jsPDF(orientation, 'mm', pageSize);
  
  // Capture the element as a canvas
  const canvas = await html2canvas(element, {
    scale: 2, // Higher resolution
    useCORS: true,
    logging: false,
  });
  
  // Calculate dimensions to fit the page
  const imgWidth = doc.internal.pageSize.getWidth() - 20; // Margin
  const pageHeight = doc.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  // Handle multi-page documents
  let heightLeft = imgHeight;
  let position = 10; // Initial position
  
  // Convert canvas to image data
  const imgData = canvas.toDataURL('image/png');
  
  // Add title if provided
  if (title) {
    doc.setFontSize(14);
    doc.text(title, 10, position);
    position += 10;
  }
  
  // Add first page of content
  doc.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= (pageHeight - position);
  
  // Add additional pages if content overflows
  while (heightLeft > 0) {
    position = 10; // Reset for new page
    doc.addPage();
    doc.addImage(imgData, 'PNG', 10, position - imgHeight + heightLeft, imgWidth, imgHeight);
    heightLeft -= (pageHeight - position);
  }
  
  // Save the document
  doc.save(`${filename}`);
}

/**
 * Exports calculation data to a PDF file
 * @param materials The materials breakdown data
 * @param filename The name of the file to save
 */
export function exportCalculationToPdf(
  materialsBreakdown: any, 
  filename: string = 'building-cost-calculation'
): void {
  // Create a new PDF document
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  
  // Add title
  doc.setFontSize(20);
  doc.text('Building Cost Calculation Report', margin, 20);
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 30);
  
  // Add divider line
  doc.setLineWidth(0.5);
  doc.line(margin, 35, pageWidth - margin, 35);
  
  // Add materials breakdown title
  doc.setFontSize(16);
  doc.text('Materials Cost Breakdown', margin, 45);
  
  // Set up table headers
  let y = 55;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Material', margin, y);
  doc.text('Percentage', margin + 80, y);
  doc.text('Cost', margin + 130, y);
  
  // Add divider
  y += 5;
  doc.line(margin, y, pageWidth - margin, y);
  
  // Reset font
  doc.setFont('helvetica', 'normal');
  
  // Add table data
  y += 10;
  
  if (materialsBreakdown && materialsBreakdown.materials) {
    materialsBreakdown.materials.forEach((material: any) => {
      doc.text(material.materialName, margin, y);
      doc.text(`${material.percentage}%`, margin + 80, y);
      doc.text(`$${material.totalCost.toLocaleString()}`, margin + 130, y);
      y += 10;
      
      // Add a new page if we're close to the bottom
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  }
  
  // Add divider
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Add total
  doc.setFont('helvetica', 'bold');
  doc.text('Total Cost:', margin, y);
  doc.text(`$${materialsBreakdown.totalCost.toLocaleString()}`, margin + 130, y);
  
  // Add footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Building Cost Building System (BCBS)', pageWidth / 2, footerY, { align: 'center' });
  
  // Save the PDF
  doc.save(`${filename}.pdf`);
}