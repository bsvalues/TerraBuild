import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { exportCostToExcel, CostCalculation, ExcelOptions } from '@/utils/excelGenerator';

interface ExportExcelDialogProps {
  calculation: CostCalculation;
  trigger?: React.ReactNode;
}

const ExportExcelDialog = ({ calculation, trigger }: ExportExcelDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [fileName, setFileName] = useState('building-cost-report.csv');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeCompanyInfo, setIncludeCompanyInfo] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [companyName, setCompanyName] = useState('Benton County Building Department');
  const [companyContact, setCompanyContact] = useState('building@bentoncounty.gov • (555) 123-4567');
  const [includeBreakdown, setIncludeBreakdown] = useState(true);
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

  const handleExport = () => {
    try {
      setIsExporting(true);
      
      // Format the calculation data
      const formattedCalculation = {
        ...calculation,
        buildingType: getBuildingTypeLabel(calculation.buildingType),
        quality: getQualityLabel(calculation.quality),
        region: getRegionLabel(calculation.region)
      };
      
      // Generate excel options
      const excelOptions: ExcelOptions = {
        includeHeader,
        includeCompanyInfo,
        includeMaterials,
        companyName,
        companyContact,
        includeBreakdown,
        notes: includeNotes ? notes : undefined
      };
      
      // Export to Excel
      exportCostToExcel(formattedCalculation, fileName, excelOptions);
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('An error occurred while exporting to Excel. Please try again.');
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
            className="flex items-center gap-2 bg-white border-[#3CAB36]/30 hover:bg-[#edf7ed] hover:text-[#3CAB36]"
          >
            <FileText className="h-4 w-4" />
            <span>Export to Excel</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#243E4D] flex items-center">
            <FileText className="h-5 w-5 mr-2 text-[#3CAB36]" />
            Export to Excel/CSV
          </DialogTitle>
          <DialogDescription>
            Customize your Excel report with the options below.
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
            <Label htmlFor="companyName" className="text-right">
              Company Name
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="companyContact" className="text-right">
              Contact Info
            </Label>
            <Input
              id="companyContact"
              value={companyContact}
              onChange={(e) => setCompanyContact(e.target.value)}
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
                  id="includeHeader" 
                  checked={includeHeader} 
                  onCheckedChange={(checked) => setIncludeHeader(!!checked)} 
                />
                <Label htmlFor="includeHeader" className="text-sm">Include report header</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeCompanyInfo" 
                  checked={includeCompanyInfo} 
                  onCheckedChange={(checked) => setIncludeCompanyInfo(!!checked)} 
                />
                <Label htmlFor="includeCompanyInfo" className="text-sm">Include company information</Label>
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
                  id="includeBreakdown" 
                  checked={includeBreakdown} 
                  onCheckedChange={(checked) => setIncludeBreakdown(!!checked)} 
                />
                <Label htmlFor="includeBreakdown" className="text-sm">Include cost breakdown</Label>
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
            className="bg-[#3CAB36] hover:bg-[#3CAB36]/90"
          >
            {isExporting ? (
              <>Generating Excel...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportExcelDialog;