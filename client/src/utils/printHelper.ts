/**
 * Print Helper Utility for Building Cost Calculator
 * 
 * This utility provides functions to handle printing of building cost calculations.
 */

/**
 * Apply print-specific styles to the document
 */
export function applyPrintStyles(): void {
  // Create a style element if it doesn't exist
  let style = document.getElementById('print-styles');
  
  if (!style) {
    style = document.createElement('style');
    style.id = 'print-styles';
    document.head.appendChild(style);
  }
  
  // Define print-specific styles
  style.innerHTML = `
    @media print {
      body * {
        visibility: hidden;
      }
      
      .print-section,
      .print-section * {
        visibility: visible;
      }
      
      .print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        padding: 20px;
      }
      
      .print-section h1 {
        font-size: 18pt;
        color: #243E4D;
        margin-bottom: 15px;
      }
      
      .print-section h2 {
        font-size: 16pt;
        color: #243E4D;
        margin-top: 20px;
        margin-bottom: 10px;
      }
      
      .print-section h3 {
        font-size: 14pt;
        color: #243E4D;
        margin-top: 15px;
        margin-bottom: 8px;
      }
      
      .print-section table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
      }
      
      .print-section th {
        background-color: #e6eef2;
        border: 1px solid #ccc;
        padding: 8px;
        text-align: left;
      }
      
      .print-section td {
        border: 1px solid #ccc;
        padding: 8px;
      }
      
      .print-section .summary-box {
        border: 1px solid #243E4D;
        padding: 10px;
        margin: 15px 0;
        background-color: #f9f9f9;
      }
      
      .print-section .header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        border-bottom: 2px solid #243E4D;
        padding-bottom: 10px;
      }
      
      .print-section .footer {
        margin-top: 30px;
        padding-top: 10px;
        border-top: 1px solid #ccc;
        font-size: 9pt;
        color: #666;
        text-align: center;
      }
      
      .print-hide {
        display: none !important;
      }
      
      .page-break {
        page-break-before: always;
      }
    }
  `;
}

/**
 * Remove print-specific styles
 */
export function removePrintStyles(): void {
  const style = document.getElementById('print-styles');
  if (style) {
    document.head.removeChild(style);
  }
}

/**
 * Print a specific HTML element
 */
export function printElement(element: HTMLElement, title: string = 'Building Cost Report'): void {
  // Apply print styles
  applyPrintStyles();
  
  // Set original page title
  const originalTitle = document.title;
  document.title = title;
  
  // Add print class to element
  element.classList.add('print-section');
  
  // Print the document
  window.print();
  
  // Clean up
  element.classList.remove('print-section');
  document.title = originalTitle;
  
  // Remove print styles after a delay to ensure they're applied during printing
  setTimeout(() => {
    removePrintStyles();
  }, 1000);
}