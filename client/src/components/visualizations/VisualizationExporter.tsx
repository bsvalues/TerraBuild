import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { exportChartToPDF } from '@/lib/visualization-utils';
import { 
  Download, 
  FileImage, 
  File, 
  Share, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface VisualizationExporterProps {
  chartRef: React.RefObject<HTMLDivElement>;
  title?: string;
  onExportComplete?: (type: string, success: boolean) => void;
}

/**
 * Visualization Exporter Component
 * Provides functionality to export charts as image or PDF
 */
const VisualizationExporter: React.FC<VisualizationExporterProps> = ({
  chartRef,
  title = 'Chart Export',
  onExportComplete
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportResult, setExportResult] = useState<{ success: boolean; type: string; message: string } | null>(null);
  
  // Export as PNG image
  const exportAsImage = async () => {
    if (!chartRef.current) {
      handleExportComplete('image', false, 'Chart reference is missing');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: '#ffffff',
        logging: false
      });
      
      // Create and download image
      const imageUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      link.href = imageUrl;
      link.click();
      
      handleExportComplete('image', true, 'Image exported successfully');
    } catch (error) {
      console.error('Failed to export chart as image', error);
      handleExportComplete('image', false, 'Failed to export image');
    }
  };
  
  // Export as PDF document
  const exportAsPDF = async () => {
    if (!chartRef.current) {
      handleExportComplete('pdf', false, 'Chart reference is missing');
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Capture chart as canvas
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
      });
      
      // Calculate dimensions
      const imgWidth = 277; // A4 landscape width in mm - margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add header
      pdf.setFontSize(16);
      pdf.text(title, 15, 15);
      
      // Add timestamp
      pdf.setFontSize(10);
      pdf.text(`Generated on ${new Date().toLocaleString()}`, 15, 22);
      
      // Add image
      pdf.addImage(imgData, 'PNG', 15, 30, imgWidth, imgHeight);
      
      // Download PDF
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '-')}.pdf`);
      
      handleExportComplete('pdf', true, 'PDF exported successfully');
    } catch (error) {
      console.error('Failed to export chart as PDF', error);
      handleExportComplete('pdf', false, 'Failed to export PDF');
    }
  };
  
  // Handle export completion
  const handleExportComplete = (type: string, success: boolean, message: string) => {
    setIsExporting(false);
    setExportResult({ type, success, message });
    
    if (onExportComplete) {
      onExportComplete(type, success);
    }
    
    // Clear result message after 3 seconds
    setTimeout(() => {
      setExportResult(null);
    }, 3000);
  };
  
  return (
    <div className="flex items-center space-x-2">
      {exportResult && (
        <div className={`flex items-center text-sm ${exportResult.success ? 'text-green-600' : 'text-red-600'}`}>
          {exportResult.success ? (
            <CheckCircle className="mr-1 h-4 w-4" />
          ) : (
            <XCircle className="mr-1 h-4 w-4" />
          )}
          {exportResult.message}
        </div>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0">
          <div className="p-2">
            <div className="text-sm font-medium px-2 py-1">Export Options</div>
            <button
              className="w-full flex items-center px-2 py-1.5 hover:bg-gray-100 rounded-sm text-sm"
              onClick={exportAsImage}
              disabled={isExporting}
            >
              <FileImage className="mr-2 h-4 w-4" />
              <span>Export as Image</span>
            </button>
            <button
              className="w-full flex items-center px-2 py-1.5 hover:bg-gray-100 rounded-sm text-sm"
              onClick={exportAsPDF}
              disabled={isExporting}
            >
              <File className="mr-2 h-4 w-4" />
              <span>Export as PDF</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VisualizationExporter;