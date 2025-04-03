import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { generateCostReport } from '@/utils/pdfGenerator';

interface ExportPdfDialogProps {
  calculation: {
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
  };
  trigger?: React.ReactNode;
}

const ExportPdfDialog = ({ calculation, trigger }: ExportPdfDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fileName, setFileName] = useState('building-cost-report.pdf');
  const [showLogo, setShowLogo] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [title, setTitle] = useState('Benton County Building Cost Report');
  const [contactInfo, setContactInfo] = useState('Benton County Building Department • (555) 123-4567 • building@bentoncounty.gov');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [notes, setNotes] = useState('');

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

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Format the calculation data
      const formattedCalculation = {
        ...calculation,
        buildingType: getBuildingTypeLabel(calculation.buildingType),
        quality: getQualityLabel(calculation.quality),
        region: getRegionLabel(calculation.region)
      };
      
      // Generate the PDF
      const pdfBlob = await generateCostReport(formattedCalculation, {
        title,
        showLogo,
        includeDate,
        includeMaterials,
        contactInfo,
        includeNotes,
        notes
      });
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('An error occurred while exporting the PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 bg-white border-[#29B7D3]/30 hover:bg-[#e8f8fb] hover:text-[#29B7D3]"
          >
            <FileText className="h-4 w-4" />
            <span>Export PDF Report</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#243E4D] flex items-center">
            <FileText className="h-5 w-5 mr-2 text-[#29B7D3]" />
            Export Building Cost Report
          </DialogTitle>
          <DialogDescription>
            Customize your PDF report with the options below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filename" className="text-right">
              Filename
            </Label>
            <Input
              id="filename"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Report Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactInfo" className="text-right">
              Contact Info
            </Label>
            <Input
              id="contactInfo"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-right text-sm font-medium col-span-1">
              Options
            </div>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showLogo" 
                  checked={showLogo} 
                  onCheckedChange={(checked) => setShowLogo(!!checked)} 
                />
                <Label htmlFor="showLogo" className="text-sm">Include county logo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeDate" 
                  checked={includeDate} 
                  onCheckedChange={(checked) => setIncludeDate(!!checked)} 
                />
                <Label htmlFor="includeDate" className="text-sm">Include current date</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeMaterials" 
                  checked={includeMaterials} 
                  onCheckedChange={(checked) => setIncludeMaterials(!!checked)} 
                />
                <Label htmlFor="includeMaterials" className="text-sm">Include materials breakdown</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeNotes" 
                  checked={includeNotes} 
                  onCheckedChange={(checked) => setIncludeNotes(!!checked)} 
                />
                <Label htmlFor="includeNotes" className="text-sm">Include notes</Label>
              </div>
            </div>
          </div>
          
          {includeNotes && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right pt-2">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this building cost calculation..."
                className="col-span-3 h-24"
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-[#29B7D3] hover:bg-[#29B7D3]/90"
          >
            {isExporting ? (
              <>Generating PDF...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportPdfDialog;