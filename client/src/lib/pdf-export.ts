import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type PdfExportOptions = {
  title?: string;
  filename?: string;
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
};

const defaultOptions: PdfExportOptions = {
  title: 'Building Cost Breakdown',
  filename: 'building-cost-breakdown.pdf',
  pageSize: 'a4',
  orientation: 'portrait',
  margins: {
    top: 15,
    right: 15,
    bottom: 15,
    left: 15
  }
};

/**
 * Exports an HTML element to PDF
 * @param element The HTML element to export
 * @param options Export options
 */
export async function exportToPdf(
  element: HTMLElement,
  customOptions: Partial<PdfExportOptions> = {}
): Promise<void> {
  try {
    const options = { ...defaultOptions, ...customOptions };
    
    // Create a canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Better quality
      useCORS: true, // Allow loading cross-origin images
      logging: false,
      backgroundColor: 'white'
    });
    
    // Create PDF of the right size
    const pdf = new jsPDF({
      orientation: options.orientation,
      unit: 'mm',
      format: options.pageSize
    });
    
    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate margins
    const margins = options.margins!;
    const contentWidth = pdfWidth - margins.left - margins.right;
    const contentHeight = pdfHeight - margins.top - margins.bottom;
    
    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate scaling to fit content in PDF
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate scaling ratios
    const widthRatio = contentWidth / imgWidth;
    const heightRatio = contentHeight / imgHeight;
    
    // Use the smaller ratio to ensure both width and height fit
    const ratio = Math.min(widthRatio, heightRatio);
    
    // Calculate scaled dimensions
    const scaledWidth = imgWidth * ratio;
    const scaledHeight = imgHeight * ratio;
    
    // Center content horizontally
    const xOffset = margins.left + (contentWidth - scaledWidth) / 2;
    
    // Add title if provided
    if (options.title) {
      pdf.setFontSize(16);
      pdf.text(options.title, pdfWidth / 2, margins.top - 5, { align: 'center' });
    }
    
    // Add image to PDF
    pdf.addImage(
      imgData,
      'PNG',
      xOffset,
      margins.top,
      scaledWidth,
      scaledHeight
    );
    
    // Add timestamp and page number at the bottom
    const timestamp = new Date().toLocaleString();
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated: ${timestamp}`, margins.left, pdfHeight - 5);
    pdf.text('Page 1 of 1', pdfWidth - margins.right, pdfHeight - 5, { align: 'right' });
    
    // Save the PDF
    pdf.save(options.filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Prepares an element for PDF export by making temporary style adjustments
 * @param element The element to prepare
 * @returns A cleanup function to restore original styles
 */
export function preparePdfElement(element: HTMLElement): () => void {
  // Save original styles
  const originalStyles = {
    width: element.style.width,
    height: element.style.height,
    overflow: element.style.overflow,
    background: element.style.background
  };
  
  // Apply temporary styles for better PDF output
  element.style.width = '800px';
  element.style.height = 'auto';
  element.style.overflow = 'visible';
  element.style.background = 'white';
  
  // Return function to restore original styles
  return () => {
    element.style.width = originalStyles.width;
    element.style.height = originalStyles.height;
    element.style.overflow = originalStyles.overflow;
    element.style.background = originalStyles.background;
  };
}