import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCostMatrix } from "@/hooks/use-cost-matrix";
import { toast } from "@/hooks/use-toast";
import { REGIONS, BUILDING_TYPES } from "@/data/constants";

export function CostMatrixManager() {
  const { 
    getAll, 
    getByRegion, 
    getByBuildingType, 
    importFromJson 
  } = useCostMatrix();

  const [filterRegion, setFilterRegion] = useState("");
  const [filterBuildingType, setFilterBuildingType] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  let costMatrixQuery;
  
  if (filterRegion && filterBuildingType) {
    costMatrixQuery = getByRegion(filterRegion);
  } else if (filterRegion) {
    costMatrixQuery = getByRegion(filterRegion);
  } else if (filterBuildingType) {
    costMatrixQuery = getByBuildingType(filterBuildingType);
  } else {
    costMatrixQuery = getAll;
  }

  const { data: costMatrixEntries, isLoading, isError } = costMatrixQuery;

  const handleImport = async () => {
    try {
      const data = JSON.parse(jsonInput);
      await importFromJson.mutateAsync(data);
      setImportDialogOpen(false);
      setJsonInput("");
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Please provide valid JSON data",
        variant: "destructive",
      });
    }
  };

  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setJsonInput(content);
      } catch (error) {
        toast({
          title: "Error reading file",
          description: "Failed to read the selected file",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Cost Matrix Manager</CardTitle>
          <CardDescription>
            Manage cost matrix entries for different building types and regions
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            Import Matrix
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Region:</span>
            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Regions</SelectItem>
                {REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Building Type:</span>
            <Select value={filterBuildingType} onValueChange={setFilterBuildingType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Building Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Building Types</SelectItem>
                {BUILDING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <p>Loading cost matrix entries...</p>
          </div>
        ) : isError ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-destructive">Error loading cost matrix data</p>
          </div>
        ) : costMatrixEntries && costMatrixEntries.length > 0 ? (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Building Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Base Cost</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Complexity</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Condition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costMatrixEntries.map((entry: any) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.region}</TableCell>
                    <TableCell>{entry.buildingType}</TableCell>
                    <TableCell>{entry.buildingTypeDescription}</TableCell>
                    <TableCell>${parseFloat(entry.baseCost as any).toFixed(2)}</TableCell>
                    <TableCell>{entry.matrixYear}</TableCell>
                    <TableCell>{parseFloat(entry.complexityFactorBase as any).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(entry.qualityFactorBase as any).toFixed(2)}</TableCell>
                    <TableCell>{parseFloat(entry.conditionFactorBase as any).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center">
            <p className="mb-4 text-muted-foreground">No cost matrix entries found</p>
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              Import Matrix Data
            </Button>
          </div>
        )}

        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Import Cost Matrix</DialogTitle>
              <DialogDescription>
                Paste JSON data or upload a JSON file containing cost matrix entries
              </DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="json-file" className="text-sm font-medium">
                  Upload JSON File
                </label>
                <Input
                  id="json-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportFromFile}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="json-input" className="text-sm font-medium">
                  Or paste JSON data
                </label>
                <textarea
                  id="json-input"
                  className="min-h-[200px] p-2 border rounded"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder='[{"region": "Central Benton", "buildingType": "A1", ...}]'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!jsonInput || importFromJson.isPending}
              >
                {importFromJson.isPending ? "Importing..." : "Import"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}