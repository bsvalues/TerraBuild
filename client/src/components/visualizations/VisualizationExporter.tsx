import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, Image, FileText, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Visualization Exporter Component
 * 
 * Provides controls for exporting visualizations as images or PDFs
 */
export function VisualizationExporter() {
  const { toast } = useToast();
  
  const captureElement = async (selector: string): Promise<HTMLCanvasElement | null> => {
    const element = document.querySelector(selector);
    if (!element) {
      toast({
        title: 'Export Failed',
        description: 'Could not find the visualization to export.',
        variant: 'destructive'
      });
      return null;
    }
    
    try {
      return await html2canvas(element as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
    } catch (error) {
      console.error('Error capturing element:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred while generating the image.',
        variant: 'destructive'
      });
      return null;
    }
  };
  
  const exportAsImage = async () => {
    const canvas = await captureElement('.w-full.h-80');
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `visualization-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    toast({
      title: 'Export Successful',
      description: 'Visualization has been downloaded as an image.',
    });
  };
  
  const exportAsPDF = async () => {
    const canvas = await captureElement('.w-full.h-80');
    if (!canvas) return;
    
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm'
    });
    
    // Calculate aspect ratio to maintain proportions
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title
    pdf.setFontSize(18);
    pdf.text('Building Cost Analysis', 10, 10);
    
    // Add date
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 20);
    
    // Add image
    pdf.addImage(imgData, 'JPEG', 10, 30, imgWidth, imgHeight);
    
    pdf.save(`visualization-report-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: 'Export Successful',
      description: 'Visualization has been downloaded as a PDF.',
    });
  };
  
  const handleShare = async () => {
    const url = window.location.href;
    
    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Building Cost Visualization',
          text: 'Check out this building cost analysis data.',
          url
        });
        
        toast({
          title: 'Shared Successfully',
          description: 'Visualization has been shared.',
        });
      } catch (error) {
        console.error('Error sharing:', error);
        fallbackShare(url);
      }
    } else {
      fallbackShare(url);
    }
  };
  
  const fallbackShare = (url: string) => {
    // Fallback to copying to clipboard
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: 'Link Copied',
        description: 'Link to this visualization has been copied to clipboard.',
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: 'Share Failed',
        description: 'Could not copy the link to clipboard.',
        variant: 'destructive'
      });
    });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportAsImage}>
          <Image className="h-4 w-4 mr-2" />
          Save as Image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Save as PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share Visualization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}