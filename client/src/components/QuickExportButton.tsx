import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FilePlus2, Printer, FileSpreadsheet, FileText, ShieldAlert, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SimpleDataAnonymizer } from '@/components/DataAnonymizer';
import { anonymizeCalculationData } from '@/utils/anonymizeData';

interface QuickExportButtonProps {
  /** Content element selector to be exported (defaults to main content area) */
  contentSelector?: string;
  /** Filename used when exporting (without extension) */
  filename?: string;
  /** Data to be exported as CSV/Excel (if not provided, will try to extract from HTML tables) */
  data?: Array<Record<string, any>>;
  /** Show visual feedback animation when exporting */
  showExportAnimation?: boolean;
  /** Customized button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Additional class names */
  className?: string;
  /** Building cost calculation data for export */
  calculation?: {
    buildingType: string;
    squareFootage: number;
    quality?: string;
    buildingAge?: number;
    region: string;
    complexityFactor: number;
    conditionFactor: number;
    baseCost: number;
    regionalMultiplier: number;
    ageDepreciation: number;
    totalCost: number;
    materialCosts: Array<{
      category: string;
      description: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
    }>;
  };
}

/**
 * QuickExportButton provides a dropdown with options to export content as PDF, Excel/CSV, or Print
 */
export default function QuickExportButton({
  contentSelector = '.dashboard-content',
  filename = 'benton-county-export',
  data,
  showExportAnimation = true,
  variant = 'outline',
  className = '',
  calculation,
}: QuickExportButtonProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<string | null>(null);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [anonymizedData, setAnonymizedData] = useState<any>(null);
  const [anonymizedCalculation, setAnonymizedCalculation] = useState<any>(null);

  // Helper to show a visual animation during export
  const animateExport = (format: string, callback: () => Promise<void>) => {
    if (!showExportAnimation) {
      callback();
      return;
    }

    setIsExporting(true);
    setExportFormat(format);

    // Wait briefly to show the animation
    setTimeout(async () => {
      try {
        await callback();
        toast({
          title: "Export Successful",
          description: `Your content has been exported as ${format}`,
          variant: "default",
        });
      } catch (error) {
        console.error('Export failed:', error);
        toast({
          title: "Export Failed",
          description: "There was a problem exporting your content",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
        setExportFormat(null);
      }
    }, 300);
  };

  // Export to PDF
  const exportToPDF = async () => {
    animateExport('PDF', async () => {
      const element = document.querySelector(contentSelector) as HTMLElement;
      if (!element) {
        throw new Error(`Element "${contentSelector}" not found`);
      }

      // Save original styles for recovery
      const originalPosition = element.style.position;
      const originalZIndex = element.style.zIndex;
      const originalBackground = element.style.background;
      
      // Temporarily modify styles for better capture
      element.style.position = 'relative';
      element.style.zIndex = '9999';
      element.style.background = 'white';

      try {
        // Create a new PDF
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        
        // Standard A4 dimensions
        const pdfWidth = pdf.internal.pageSize.width;  // 210mm
        const pdfHeight = pdf.internal.pageSize.height; // 297mm
        const margin = 10; // margin in mm
        
        // Add Benton County branding header
        pdf.setFillColor(36, 62, 77); // #243E4D
        pdf.rect(0, 0, pdfWidth, 20, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('Benton County Building Cost System', margin, 14);
        
        // Set y position after header
        let yPosition = 30;
        
        // If we have calculation data, add a nice summary
        const currentCalculation = isAnonymized && anonymizedCalculation ? anonymizedCalculation : calculation;
        if (currentCalculation) {
          // Building Information Section
          pdf.setTextColor(36, 62, 77);
          pdf.setFontSize(14);
          pdf.text(`Building Cost Calculation Summary${isAnonymized ? ' (Anonymized)' : ''}`, margin, yPosition);
          yPosition += 8;
          
          pdf.setFontSize(12);
          pdf.text('Building Information', margin, yPosition);
          yPosition += 6;
          
          // Create table with building info
          const buildingInfoData = [
            ['Building Type:', currentCalculation.buildingType],
            ['Region:', currentCalculation.region],
            ['Square Footage:', currentCalculation.squareFootage.toLocaleString() + ' sq.ft.'],
            ['Complexity Factor:', currentCalculation.complexityFactor.toFixed(2)],
            ['Condition Factor:', currentCalculation.conditionFactor.toFixed(2)]
          ];
          
          // Set table formatting
          pdf.setFontSize(10);
          pdf.setTextColor(0, 0, 0);
          
          // Draw the table
          buildingInfoData.forEach((row, index) => {
            const isEvenRow = index % 2 === 0;
            if (isEvenRow) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(margin, yPosition - 4, pdfWidth - (margin * 2), 6, 'F');
            }
            
            pdf.setFont('helvetica', 'bold');
            pdf.text(row[0], margin + 2, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(row[1], margin + 50, yPosition);
            yPosition += 6;
          });
          
          yPosition += 8;
          
          // Cost Components Section
          pdf.setFontSize(12);
          pdf.setTextColor(36, 62, 77);
          pdf.text('Cost Components', margin, yPosition);
          yPosition += 6;
          
          // Create table with cost components
          const costComponentsData = [
            ['Base Cost:', formatCurrency(currentCalculation.baseCost)],
            ['Regional Multiplier:', `x${currentCalculation.regionalMultiplier.toFixed(2)}`],
            ['Age Depreciation:', formatPercentage(currentCalculation.ageDepreciation)]
          ];
          
          // Draw the cost components table
          costComponentsData.forEach((row, index) => {
            const isEvenRow = index % 2 === 0;
            if (isEvenRow) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(margin, yPosition - 4, pdfWidth - (margin * 2), 6, 'F');
            }
            
            pdf.setFont('helvetica', 'bold');
            pdf.text(row[0], margin + 2, yPosition);
            pdf.setFont('helvetica', 'normal');
            pdf.text(row[1], margin + 50, yPosition);
            yPosition += 6;
          });
          
          // Add Total Cost with highlight
          pdf.setFillColor(230, 240, 245);
          pdf.rect(margin, yPosition - 4, pdfWidth - (margin * 2), 6, 'F');
          pdf.setFont('helvetica', 'bold');
          pdf.text('TOTAL COST:', margin + 2, yPosition);
          pdf.setTextColor(36, 62, 77);
          pdf.text(formatCurrency(currentCalculation.totalCost), margin + 50, yPosition);
          yPosition += 10;
          
          // Add material costs if any
          if (currentCalculation.materialCosts && currentCalculation.materialCosts.length > 0) {
            pdf.setTextColor(36, 62, 77);
            pdf.text('Material Costs', margin, yPosition);
            yPosition += 6;
            
            // Table headers
            pdf.setFillColor(36, 62, 77);
            pdf.rect(margin, yPosition - 4, pdfWidth - (margin * 2), 6, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Description', margin + 2, yPosition);
            pdf.text('Quantity', margin + 70, yPosition);
            pdf.text('Unit Cost', margin + 95, yPosition);
            pdf.text('Total Cost', margin + 130, yPosition);
            yPosition += 6;
            
            // Table rows
            pdf.setTextColor(0, 0, 0);
            currentCalculation.materialCosts.forEach((material, index) => {
              const isEvenRow = index % 2 === 0;
              if (isEvenRow) {
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margin, yPosition - 4, pdfWidth - (margin * 2), 6, 'F');
              }
              
              pdf.setFont('helvetica', 'normal');
              pdf.text(material.description, margin + 2, yPosition);
              pdf.text(material.quantity.toString(), margin + 70, yPosition);
              pdf.text(formatCurrency(material.unitCost), margin + 95, yPosition);
              pdf.text(formatCurrency(material.totalCost), margin + 130, yPosition);
              yPosition += 6;
            });
            
            yPosition += 8;
          }
          
          // Add separator line
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, yPosition - 4, pdfWidth - margin, yPosition - 4);
          yPosition += 8;
        }
        
        // Capture the element content
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        // Restore original styles
        element.style.position = originalPosition;
        element.style.zIndex = originalZIndex;
        element.style.background = originalBackground;
        
        // Add content image with remaining space
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Check if we need a new page for the image
        const remainingSpace = pdfHeight - yPosition - margin;
        if (imgHeight > remainingSpace) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        
        // Add generated timestamp to footer
        const timestamp = new Date().toLocaleString();
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(8);
        pdf.text(`Generated: ${timestamp}`, margin, pdfHeight - 5);
        pdf.text(`© Benton County, Washington`, pdfWidth - 60, pdfHeight - 5);
        
        // Save the PDF
        pdf.save(`${filename}.pdf`);
      } catch (error) {
        // Ensure we restore styles even if there's an error
        element.style.position = originalPosition;
        element.style.zIndex = originalZIndex;
        element.style.background = originalBackground;
        throw error;
      }
    });
  };

  // Export to Excel/CSV
  const exportToExcel = () => {
    animateExport('Excel', async () => {
      // If data is provided directly, use it (check for anonymized version)
      let exportData = isAnonymized && anonymizedData ? anonymizedData : data;
      
      // If calculation data is provided, format it for Excel
      const currentCalculation = isAnonymized && anonymizedCalculation ? anonymizedCalculation : calculation;
      if (!exportData && currentCalculation) {
        // First add the summary data
        const summaryData = [
          { 
            Category: 'Building Information',
            Description: 'Building Type', 
            Value: currentCalculation.buildingType 
          },
          { 
            Category: 'Building Information',
            Description: 'Region', 
            Value: currentCalculation.region 
          },
          { 
            Category: 'Building Information',
            Description: 'Square Footage', 
            Value: currentCalculation.squareFootage 
          },
          { 
            Category: 'Building Information',
            Description: 'Complexity Factor', 
            Value: currentCalculation.complexityFactor 
          },
          { 
            Category: 'Building Information',
            Description: 'Condition Factor', 
            Value: currentCalculation.conditionFactor 
          },
          { 
            Category: 'Cost Components',
            Description: 'Base Cost', 
            Value: formatCurrency(currentCalculation.baseCost) 
          },
          { 
            Category: 'Cost Components',
            Description: 'Regional Multiplier', 
            Value: currentCalculation.regionalMultiplier 
          },
          { 
            Category: 'Cost Components',
            Description: 'Age Depreciation', 
            Value: formatPercentage(currentCalculation.ageDepreciation) 
          },
          { 
            Category: 'Cost Result',
            Description: 'Total Cost', 
            Value: formatCurrency(currentCalculation.totalCost) 
          }
        ];
        
        // Then add any material costs
        const materialData = currentCalculation.materialCosts.map(mat => ({
          Category: mat.category,
          Description: mat.description,
          Quantity: mat.quantity,
          'Unit Cost': formatCurrency(mat.unitCost),
          'Total Cost': formatCurrency(mat.totalCost)
        }));
        
        // Combine all data
        exportData = [...summaryData, ...materialData];
      }
      
      // If still no data, try to extract from HTML tables
      if (!exportData) {
        const tables = document.querySelectorAll(`${contentSelector} table`);
        if (tables.length === 0) {
          throw new Error('No tables found to export');
        }
        
        // Extract data from the first table
        const table = tables[0];
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim() || '');
        
        exportData = Array.from(table.querySelectorAll('tbody tr')).map(row => {
          const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          return headers.reduce((obj, header, index) => {
            obj[header] = cells[index] || '';
            return obj;
          }, {} as Record<string, string>);
        });
      }
      
      if (!exportData || exportData.length === 0) {
        throw new Error('No data available to export');
      }
      
      // Create a new workbook and add the data
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Add some styling and column widths
      const colWidths = Object.keys(exportData[0]).map(key => ({ wch: Math.max(key.length, 10) }));
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Benton County Data');
      
      // Generate the Excel file as a blob
      const excelBlob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBlob], { type: 'application/octet-stream' });
      
      // Save the file
      saveAs(blob, `${filename}.xlsx`);
    });
  };
  
  // Helper function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Helper function to format percentage
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
  
  // Handle data anonymization
  const handleAnonymize = (anonymizedResult: any) => {
    if (anonymizedResult) {
      setIsAnonymized(true);
      
      // If we have calculation data, store the anonymized version
      if (calculation && !Array.isArray(anonymizedResult)) {
        setAnonymizedCalculation(anonymizedResult);
      }
      
      // If we have regular data, store the anonymized version
      if (data) {
        setAnonymizedData(anonymizedResult);
      }
      
      toast({
        title: "Data Anonymized",
        description: "Your data has been anonymized and is ready for export",
        variant: "default",
      });
    }
  };

  // Print content
  const printContent = () => {
    animateExport('Print', async () => {
      const element = document.querySelector(contentSelector) as HTMLElement;
      if (!element) {
        throw new Error(`Element "${contentSelector}" not found`);
      }

      // Create a clone of the element to print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Could not open print window. Please check if popup blocking is enabled.');
      }
      
      // Generate enhanced calculation table if calculation data is available
      let calculationHtml = '';
      const currentCalculation = isAnonymized && anonymizedCalculation ? anonymizedCalculation : calculation;
      if (currentCalculation) {
        calculationHtml = `
          <div class="calculation-summary">
            <h3 style="color: #243E4D; margin-top: 20px;">Building Cost Calculation Summary</h3>
            <table>
              <thead>
                <tr>
                  <th colspan="2">Building Information</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Building Type</strong></td>
                  <td>${currentCalculation.buildingType}</td>
                </tr>
                <tr>
                  <td><strong>Region</strong></td>
                  <td>${currentCalculation.region}</td>
                </tr>
                <tr>
                  <td><strong>Square Footage</strong></td>
                  <td>${currentCalculation.squareFootage.toLocaleString()} sq.ft.</td>
                </tr>
                <tr>
                  <td><strong>Complexity Factor</strong></td>
                  <td>${currentCalculation.complexityFactor.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Condition Factor</strong></td>
                  <td>${currentCalculation.conditionFactor.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            
            <h3 style="color: #243E4D; margin-top: 20px;">Cost Components</h3>
            <table>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Base Cost</strong></td>
                  <td>${formatCurrency(currentCalculation.baseCost)}</td>
                </tr>
                <tr>
                  <td><strong>Regional Multiplier</strong></td>
                  <td>x${currentCalculation.regionalMultiplier.toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Age Depreciation</strong></td>
                  <td>${formatPercentage(currentCalculation.ageDepreciation)}</td>
                </tr>
                <tr style="font-weight: bold; background-color: #f8f9fa;">
                  <td><strong>TOTAL COST</strong></td>
                  <td>${formatCurrency(currentCalculation.totalCost)}</td>
                </tr>
              </tbody>
            </table>
            
            ${currentCalculation.materialCosts && currentCalculation.materialCosts.length > 0 ? `
              <h3 style="color: #243E4D; margin-top: 20px;">Material Costs</h3>
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  ${currentCalculation.materialCosts.map(mat => `
                    <tr>
                      <td>${mat.description}</td>
                      <td>${mat.quantity}</td>
                      <td>${formatCurrency(mat.unitCost)}</td>
                      <td>${formatCurrency(mat.totalCost)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : ''}
          </div>
        `;
      }

      // Write the HTML content to the new window
      printWindow.document.write(`
        <html>
          <head>
            <title>Benton County Building Cost System - Print</title>
            <style>
              body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
              }
              .print-header {
                background: #243E4D;
                color: white;
                padding: 10px 20px;
                margin-bottom: 20px;
                border-radius: 4px 4px 0 0;
              }
              .print-logo {
                display: flex;
                align-items: center;
                gap: 10px;
              }
              .print-logo .logo-text {
                font-size: 18px;
                font-weight: bold;
              }
              .print-content {
                padding: 0 20px;
              }
              .print-footer {
                margin-top: 30px;
                border-top: 1px solid #eee;
                padding-top: 10px;
                font-size: 12px;
                color: #666;
                padding: 10px 20px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              h3 {
                margin-top: 30px;
                margin-bottom: 10px;
                color: #243E4D;
              }
              .calculation-summary {
                background-color: #f9f9f9;
                padding: 20px;
                border-radius: 5px;
                margin-bottom: 30px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              @media print {
                .print-header { 
                  -webkit-print-color-adjust: exact; 
                  print-color-adjust: exact; 
                }
                body {
                  padding: 0;
                }
                .calculation-summary {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
                table {
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-header">
              <div class="print-logo">
                <span class="logo-text">Benton County Building Cost System</span>
              </div>
            </div>
            
            <div class="print-content">
              ${calculationHtml}
              ${element.innerHTML}
            </div>
            
            <div class="print-footer">
              <p>Generated: ${new Date().toLocaleString()}</p>
              <p>© Benton County, Washington</p>
            </div>
          </body>
        </html>
      `);

      // Wait for content to load then print
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // We don't close the window to give the user the option to cancel printing
      };
    });
  };

  return (
    <div 
      className={`relative ${className}`}
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px' 
      }}
    >
      {/* Export animation overlay */}
      {isExporting && (
        <div 
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 rounded-md"
          style={{
            transform: 'translateZ(10px)',
            boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="flex flex-col items-center">
            <div className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin mb-2"></div>
            <span className="text-sm font-medium text-primary">Exporting to {exportFormat}...</span>
          </div>
        </div>
      )}

      {/* Export dropdown button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size="sm" 
            className="relative overflow-hidden"
            style={{ 
              transformStyle: 'preserve-3d',
              transform: 'translateZ(2px)',
              boxShadow: '0 4px 12px -4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <FilePlus2 className="h-4 w-4 mr-1" />
            <span>Export</span>
            <span className="absolute inset-0 bg-gradient-to-r from-[#243E4D]/0 via-[#243E4D]/10 to-[#243E4D]/0 opacity-0 group-hover:opacity-100 duration-700 transform -translate-x-full animate-shimmer"></span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1">
          <DropdownMenuItem 
            onClick={exportToPDF}
            className="flex items-center cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span>Export as PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={exportToExcel}
            className="flex items-center cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            <span>Export as Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={printContent}
            className="flex items-center cursor-pointer"
          >
            <Printer className="h-4 w-4 mr-2" />
            <span>Print</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-1.5">
            <div className="text-xs font-medium text-muted-foreground mb-1 pl-1">Privacy Options</div>
            {isAnonymized ? (
              <div className="flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-md">
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                <span className="flex-1">Data anonymized</span>
              </div>
            ) : (
              <SimpleDataAnonymizer
                data={calculation || data}
                dataType={calculation ? 'calculation' : 'building'}
                onAnonymize={handleAnonymize}
                isAnonymized={isAnonymized}
              />
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}