import { useState } from 'react';
import { useCalculationHistory } from '@/hooks/use-calculation-history';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Eye, Trash2, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { exportCalculationToPdf } from '@/lib/pdf-export';
import type { CalculationHistory } from '@shared/schema';

// Type for materials breakdown
interface MaterialBreakdownItem {
  materialName: string;
  percentage: number;
  totalCost: number;
}

interface MaterialsBreakdown {
  totalCost: number;
  materials: MaterialBreakdownItem[];
}

export function CalculationHistoryTable() {
  const { calculationHistory, isLoadingCalculationHistory, errorCalculationHistory, deleteCalculationHistory } = useCalculationHistory();
  const { toast } = useToast();
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationHistory | null>(null);

  const handleDelete = async (id: number) => {
    try {
      await deleteCalculationHistory.mutateAsync(id);
      toast({
        title: 'Calculation deleted',
        description: 'The calculation history entry was successfully deleted.',
      });
    } catch (error) {
      toast({
        title: 'Error deleting calculation',
        description: 'There was an error deleting the calculation history entry.',
        variant: 'destructive',
      });
    }
  };

  const handleExportPdf = (calculation: CalculationHistory) => {
    try {
      if (calculation.materialsBreakdown) {
        // Convert the unknown materialsBreakdown to the expected format
        const breakdownData = calculation.materialsBreakdown as MaterialsBreakdown;
        exportCalculationToPdf(breakdownData, `Calculation_${calculation.id}`);
        toast({
          title: 'Export successful',
          description: 'The calculation has been exported to PDF.',
        });
      } else {
        toast({
          title: 'Export failed',
          description: 'No materials breakdown data available for export.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the calculation to PDF.',
        variant: 'destructive',
      });
    }
  };

  if (isLoadingCalculationHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calculation History</CardTitle>
          <CardDescription>Loading your calculation history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (errorCalculationHistory) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Error Loading Calculation History
          </CardTitle>
          <CardDescription>There was an error loading your calculation history.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!calculationHistory || calculationHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calculation History</CardTitle>
          <CardDescription>You haven't made any calculations yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the Building Cost Calculator to create cost estimates and they will be saved here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calculation History</CardTitle>
        <CardDescription>View and manage your previous building cost calculations.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Building Type</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculationHistory.map((calc) => (
                <TableRow key={calc.id}>
                  <TableCell className="font-medium">{calc.name}</TableCell>
                  <TableCell>{calc.region}</TableCell>
                  <TableCell>{calc.buildingType}</TableCell>
                  <TableCell>${parseFloat(calc.totalCost).toLocaleString()}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(calc.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedCalculation(calc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleExportPdf(calc)}
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(calc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Calculation Details Dialog */}
        <Dialog open={!!selectedCalculation} onOpenChange={(open) => !open && setSelectedCalculation(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Calculation Details</DialogTitle>
              <DialogDescription>
                {selectedCalculation?.name} created {selectedCalculation && formatDistanceToNow(new Date(selectedCalculation.createdAt), { addSuffix: true })}
              </DialogDescription>
            </DialogHeader>
            
            {selectedCalculation && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Region</h4>
                    <p>{selectedCalculation.region}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Building Type</h4>
                    <p>{selectedCalculation.buildingType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Square Footage</h4>
                    <p>{selectedCalculation.squareFootage.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Cost Per Sq Ft</h4>
                    <p>${parseFloat(selectedCalculation.costPerSqft).toLocaleString()}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Total Cost</h4>
                    <p className="font-bold">${parseFloat(selectedCalculation.totalCost).toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Cost Factors</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-md border p-3">
                      <h5 className="text-xs text-muted-foreground">Base Cost</h5>
                      <p className="font-medium">${selectedCalculation.baseCost}</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <h5 className="text-xs text-muted-foreground">Region Factor</h5>
                      <p className="font-medium">{selectedCalculation.regionFactor}x</p>
                    </div>
                    <div className="rounded-md border p-3">
                      <h5 className="text-xs text-muted-foreground">Complexity Factor</h5>
                      <p className="font-medium">{selectedCalculation.complexityFactor}x</p>
                    </div>
                  </div>
                </div>

                {selectedCalculation.materialsBreakdown && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium mb-2">Materials Breakdown</h4>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Material</TableHead>
                              <TableHead>Percentage</TableHead>
                              <TableHead>Cost</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(selectedCalculation.materialsBreakdown as any)?.materials && 
                             (selectedCalculation.materialsBreakdown as any).materials.map((material: MaterialBreakdownItem, i: number) => (
                              <TableRow key={i}>
                                <TableCell>{material.materialName}</TableCell>
                                <TableCell>{material.percentage}%</TableCell>
                                <TableCell>${material.totalCost.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <DialogFooter className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => selectedCalculation && handleExportPdf(selectedCalculation)}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <DialogClose asChild>
                <Button variant="secondary">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}