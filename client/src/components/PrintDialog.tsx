import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Printer } from 'lucide-react';
import { CostCalculation } from '@/utils/excelGenerator';
import { printElement } from '@/utils/printHelper';

interface PrintDialogProps {
  calculation: CostCalculation;
  trigger?: React.ReactNode;
}

const PrintDialog = ({ calculation, trigger }: PrintDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeDate, setIncludeDate] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [includeMaterials, setIncludeMaterials] = useState(true);
  const [reportTitle, setReportTitle] = useState('Benton County Building Cost Report');
  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printContentRef.current) {
      printElement(printContentRef.current, reportTitle);
      setIsOpen(false);
    }
  };

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
    if (region.includes('_')) {
      return region.toLowerCase().split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 bg-white"
            >
              <Printer className="h-4 w-4" />
              <span>Print Calculation</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#243E4D] flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Print Building Cost Report
            </DialogTitle>
            <DialogDescription>
              Customize print options before printing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reportTitle" className="text-right">
                Report Title
              </Label>
              <Input
                id="reportTitle"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
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
                    id="includeLogo" 
                    checked={includeLogo} 
                    onCheckedChange={(checked) => setIncludeLogo(!!checked)} 
                  />
                  <Label htmlFor="includeLogo" className="text-sm">Include county logo</Label>
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
                    id="includeFooter" 
                    checked={includeFooter} 
                    onCheckedChange={(checked) => setIncludeFooter(!!checked)} 
                  />
                  <Label htmlFor="includeFooter" className="text-sm">Include footer information</Label>
                </div>
              </div>
            </div>
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
              onClick={handlePrint}
              className="bg-[#243E4D] hover:bg-[#243E4D]/90"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hidden print content */}
      <div ref={printContentRef} className="hidden">
        <div className="print-container">
          {includeLogo && (
            <div className="header">
              <div className="logo">
                <h1>{reportTitle}</h1>
              </div>
              {includeDate && (
                <div className="date">
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="summary-box">
            <h2>Building Information</h2>
            <table>
              <tbody>
                <tr>
                  <td><strong>Building Type:</strong></td>
                  <td>{getBuildingTypeLabel(calculation.buildingType)}</td>
                  <td><strong>Square Footage:</strong></td>
                  <td>{calculation.squareFootage.toLocaleString()} sq ft</td>
                </tr>
                <tr>
                  <td><strong>Quality Level:</strong></td>
                  <td>{getQualityLabel(calculation.quality)}</td>
                  <td><strong>Region:</strong></td>
                  <td>{getRegionLabel(calculation.region)}</td>
                </tr>
                <tr>
                  <td><strong>Building Age:</strong></td>
                  <td>{calculation.buildingAge} years</td>
                  <td><strong>Age Depreciation:</strong></td>
                  <td>{calculation.ageDepreciation}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="factors">
            <h2>Cost Factors</h2>
            <table>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Value</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Complexity Factor</td>
                  <td>{calculation.complexityFactor.toFixed(2)}</td>
                  <td>
                    {calculation.complexityFactor > 1 
                      ? `+${((calculation.complexityFactor - 1) * 100).toFixed(0)}%` 
                      : calculation.complexityFactor < 1 
                        ? `-${((1 - calculation.complexityFactor) * 100).toFixed(0)}%`
                        : 'Neutral'}
                  </td>
                </tr>
                <tr>
                  <td>Condition Factor</td>
                  <td>{calculation.conditionFactor.toFixed(2)}</td>
                  <td>
                    {calculation.conditionFactor > 1 
                      ? `+${((calculation.conditionFactor - 1) * 100).toFixed(0)}%` 
                      : calculation.conditionFactor < 1 
                        ? `-${((1 - calculation.conditionFactor) * 100).toFixed(0)}%`
                        : 'Neutral'}
                  </td>
                </tr>
                <tr>
                  <td>Regional Multiplier</td>
                  <td>{calculation.regionalMultiplier.toFixed(2)}</td>
                  <td>
                    {calculation.regionalMultiplier > 1 
                      ? `+${((calculation.regionalMultiplier - 1) * 100).toFixed(0)}%` 
                      : calculation.regionalMultiplier < 1 
                        ? `-${((1 - calculation.regionalMultiplier) * 100).toFixed(0)}%`
                        : 'Neutral'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="cost-summary">
            <h2>Cost Summary</h2>
            <table>
              <tbody>
                <tr>
                  <td><strong>Base Cost:</strong></td>
                  <td>${calculation.baseCost.toLocaleString()}</td>
                </tr>
                <tr>
                  <td><strong>Total Building Cost:</strong></td>
                  <td>${calculation.totalCost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {includeMaterials && calculation.materialCosts.length > 0 && (
            <div className="materials">
              <h2>Materials</h2>
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
                  {calculation.materialCosts.map((material, index) => (
                    <tr key={index}>
                      <td>{material.description || 'Unnamed Material'}</td>
                      <td>{material.quantity}</td>
                      <td>${material.unitCost.toLocaleString()}</td>
                      <td>${material.totalCost.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}><strong>Total Materials Cost:</strong></td>
                    <td>
                      <strong>
                        ${calculation.materialCosts.reduce((sum, mat) => sum + mat.totalCost, 0).toLocaleString()}
                      </strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          
          {includeFooter && (
            <div className="footer">
              <p>Benton County Building Department • (555) 123-4567 • building@bentoncounty.gov</p>
              <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PrintDialog;