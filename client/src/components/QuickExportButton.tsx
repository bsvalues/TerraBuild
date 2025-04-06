import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  TooltipProvider, 
  Tooltip, 
  TooltipTrigger, 
  TooltipContent 
} from "@/components/ui/tooltip";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, FileType, FileSpreadsheet, Printer, Share2 } from 'lucide-react';
import { generateCostReport } from '@/utils/pdfGenerator';
import { exportCostToExcel } from '@/utils/excelGenerator';
import { CostCalculation } from '@/utils/excelGenerator';

interface QuickExportButtonProps {
  calculation: CostCalculation;
  className?: string;
}

const QuickExportButton = ({ calculation, className = "" }: QuickExportButtonProps) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportComplete, setExportComplete] = useState(false);

  // Format building type for display
  const getBuildingTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'RESIDENTIAL': 'Residential',
      'COMMERCIAL': 'Commercial',
      'INDUSTRIAL': 'Industrial'
    };
    return typeMap[type] || type;
  };

  // Format quality level for display
  const getQualityLabel = (quality: string): string => {
    const qualityMap: Record<string, string> = {
      'STANDARD': 'Standard',
      'PREMIUM': 'Premium',
      'LUXURY': 'Luxury'
    };
    return qualityMap[quality] || quality;
  };

  // Get formatted region display
  const getRegionLabel = (region: string): string => {
    // Convert snake case to readable format
    if (region.includes('_')) {
      return region.toLowerCase().split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
  };

  // Handle one-click PDF export
  const handleQuickPdfExport = async () => {
    try {
      setIsExporting('pdf');
      
      // Format the calculation data for PDF
      const formattedCalculation = {
        ...calculation,
        buildingType: getBuildingTypeLabel(calculation.buildingType),
        quality: getQualityLabel(calculation.quality),
        region: getRegionLabel(calculation.region)
      };
      
      // Generate the PDF with default options
      const pdfBlob = await generateCostReport(formattedCalculation, {
        title: 'Benton County Building Cost Report',
        showLogo: true,
        includeDate: true,
        includeMaterials: true,
        contactInfo: 'Benton County Building Department • (555) 123-4567',
        includeNotes: false
      });
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `building-cost-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success indicator
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('An error occurred while exporting the PDF. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  // Handle one-click Excel export
  const handleQuickExcelExport = () => {
    try {
      setIsExporting('excel');
      
      // Format the calculation data for Excel
      const formattedCalculation = {
        ...calculation,
        buildingType: getBuildingTypeLabel(calculation.buildingType),
        quality: getQualityLabel(calculation.quality),
        region: getRegionLabel(calculation.region)
      };
      
      // Export to Excel with default options
      exportCostToExcel(formattedCalculation, 
        `building-cost-report-${new Date().toISOString().slice(0, 10)}.csv`, {
        includeHeader: true,
        includeCompanyInfo: true,
        includeMaterials: true,
        companyName: 'Benton County Building Department',
        companyContact: 'building@bentoncounty.gov • (555) 123-4567',
        includeBreakdown: true
      });
      
      // Show success indicator
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('An error occurred while exporting to Excel. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  // Print the report
  const handlePrint = () => {
    try {
      setIsExporting('print');
      
      // Create a hidden print container
      const printContainer = document.createElement('div');
      printContainer.style.display = 'none';
      document.body.appendChild(printContainer);
      
      // Generate the content for printing
      printContainer.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #243E4D; text-align: center;">Benton County Building Cost Report</h1>
          <div style="border-bottom: 2px solid #29B7D3; margin-bottom: 20px;"></div>
          
          <h2>Building Information</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Building Type:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${getBuildingTypeLabel(calculation.buildingType)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Square Footage:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${calculation.squareFootage.toLocaleString()} sq ft</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Quality Level:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${getQualityLabel(calculation.quality)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Building Age:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${calculation.buildingAge} ${calculation.buildingAge === 1 ? 'year' : 'years'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Region:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${getRegionLabel(calculation.region)}</td>
            </tr>
          </table>
          
          <h2>Cost Calculation</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Base Cost:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${calculation.baseCost.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Complexity Factor:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">×${calculation.complexityFactor.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Condition Factor:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">×${calculation.conditionFactor.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Regional Multiplier:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">×${calculation.regionalMultiplier.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Age Depreciation:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">−${calculation.ageDepreciation}%</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 3px double #243E4D;"><strong>TOTAL ESTIMATED COST:</strong></td>
              <td style="padding: 8px; border-bottom: 3px double #243E4D; text-align: right; font-weight: bold; font-size: 1.2em;">$${calculation.totalCost.toLocaleString()}</td>
            </tr>
          </table>
          
          ${calculation.materialCosts && calculation.materialCosts.length > 0 ? `
            <h2>Materials Breakdown</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr style="background-color: #f9f9f9;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Category</th>
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Description</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Quantity</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Unit Cost</th>
                <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
              ${calculation.materialCosts.map(material => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${material.category}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee;">${material.description}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${material.quantity}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${material.unitCost.toFixed(2)}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${material.totalCost.toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
          ` : ''}
          
          <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; font-size: 0.8em; text-align: center; color: #666;">
            <p>Benton County Building Department • (555) 123-4567 • building@bentoncounty.gov</p>
            <p>Report generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
      `;
      
      // Print the contents
      const printFrame = window.open('', 'printFrame') as Window;
      if (printFrame && printFrame.document) {
        printFrame.document.body.innerHTML = printContainer.innerHTML;
        printFrame.focus();
        printFrame.print();
      }
      
      // Clean up
      document.body.removeChild(printContainer);
      
      // Show success indicator
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (error) {
      console.error('Error printing report:', error);
      alert('An error occurred while printing the report. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="lg" 
            className={`text-white bg-[#243E4D] hover:bg-[#243E4D]/90 transition-all duration-200 relative overflow-hidden group ${className} ${exportComplete ? 'animate-pulse' : ''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#29B7D3]/0 via-[#29B7D3]/30 to-[#29B7D3]/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out"></div>
            <Download className="h-5 w-5 mr-2" />
            <span>Export Report</span>
            {isExporting && (
              <span className="absolute inset-0 flex items-center justify-center bg-[#243E4D]/90">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleQuickPdfExport}>
            <FileType className="mr-2 h-4 w-4 text-red-600" />
            <span>Export as PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handleQuickExcelExport}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            <span>Export as Excel/CSV</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer flex items-center" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4 text-blue-600" />
            <span>Print Report</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {exportComplete && (
        <Badge 
          className="absolute -top-2 -right-2 bg-green-500 animate-bounce"
          variant="default"
        >
          <span className="text-xs">✓</span>
        </Badge>
      )}
    </div>
  );
};

export default QuickExportButton;