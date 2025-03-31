import React, { useState } from "react";
import { Plus, X, Save, Calculator, ArrowRight, Copy } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useBuildingCosts } from "@/hooks/use-building-costs";
import { useCostFactors } from "@/hooks/use-cost-factors";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { regions, buildingTypes, complexityLevels } from "@/data/constants";
import { Separator } from "@/components/ui/separator";

type CostScenario = {
  id: string;
  name: string;
  region: string;
  buildingType: string;
  squareFootage: number;
  complexityLevel: string;
  year: number;
  results?: {
    baseCost: string;
    costPerSqft: string;
    totalCost: string;
    regionFactor: string;
    complexityFactor: string;
    assessedValue: string;
  };
};

export function CostComparisonWizard() {
  const [scenarios, setScenarios] = useState<CostScenario[]>([
    {
      id: "scenario-1",
      name: "Scenario 1",
      region: "Central Benton",
      buildingType: "R1",
      squareFootage: 2000,
      complexityLevel: "Medium",
      year: 2025
    }
  ]);
  const [activeTab, setActiveTab] = useState<string>("edit");
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  
  const { calculateBuildingCost } = useBuildingCosts();
  const { toast } = useToast();
  
  const addScenario = () => {
    const newId = `scenario-${scenarios.length + 1}`;
    setScenarios([
      ...scenarios,
      {
        id: newId,
        name: `Scenario ${scenarios.length + 1}`,
        region: "Central Benton",
        buildingType: "R1",
        squareFootage: 2000,
        complexityLevel: "Medium",
        year: 2025
      }
    ]);
  };
  
  const removeScenario = (id: string) => {
    if (scenarios.length === 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one scenario is required",
        variant: "destructive"
      });
      return;
    }
    
    setScenarios(scenarios.filter(scenario => scenario.id !== id));
  };
  
  const updateScenario = (id: string, field: keyof CostScenario, value: any) => {
    setScenarios(
      scenarios.map(scenario => 
        scenario.id === id 
          ? { ...scenario, [field]: value } 
          : scenario
      )
    );
  };
  
  const duplicateScenario = (id: string) => {
    const scenarioToDuplicate = scenarios.find(s => s.id === id);
    if (!scenarioToDuplicate) return;
    
    const newScenario = {
      ...scenarioToDuplicate,
      id: `scenario-${scenarios.length + 1}`,
      name: `${scenarioToDuplicate.name} (Copy)`
    };
    
    setScenarios([...scenarios, newScenario]);
  };
  
  const calculateAll = async () => {
    setIsCalculating(true);
    setProgress(0);
    
    const calculatedScenarios = [...scenarios];
    
    for (let i = 0; i < scenarios.length; i++) {
      try {
        const scenario = scenarios[i];
        const complexityValue = 
          scenario.complexityLevel === "Low" ? 0.9 :
          scenario.complexityLevel === "Medium" ? 1.0 :
          scenario.complexityLevel === "High" ? 1.1 : 1.0;
          
        const calculationResult = await calculateBuildingCost({
          region: scenario.region,
          buildingType: scenario.buildingType,
          squareFootage: scenario.squareFootage,
          complexityFactor: complexityValue.toString(),
          assessmentYear: scenario.year
        });
        
        calculatedScenarios[i] = {
          ...scenario,
          results: {
            baseCost: calculationResult.baseCost,
            costPerSqft: calculationResult.costPerSqft,
            totalCost: calculationResult.totalCost,
            regionFactor: calculationResult.regionFactor,
            complexityFactor: calculationResult.complexityFactor,
            assessedValue: calculationResult.assessedValue || "0.00"
          }
        };
        
        // Update progress
        setProgress(((i + 1) / scenarios.length) * 100);
      } catch (error) {
        toast({
          title: `Error calculating scenario ${i + 1}`,
          description: "An error occurred during calculation",
          variant: "destructive"
        });
      }
    }
    
    setScenarios(calculatedScenarios);
    setIsCalculating(false);
    setActiveTab("results");
    
    toast({
      title: "Calculations Complete",
      description: `Successfully calculated ${scenarios.length} scenarios`,
    });
  };
  
  const clearResults = () => {
    const clearedScenarios = scenarios.map(scenario => ({
      ...scenario,
      results: undefined
    }));
    setScenarios(clearedScenarios);
    setActiveTab("edit");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cost Scenario Comparison Wizard</h3>
          <p className="text-sm text-muted-foreground">
            Compare building cost scenarios for different regions, types, and specifications
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">Edit Scenarios</TabsTrigger>
              <TabsTrigger value="results" disabled={!scenarios.some(s => s.results)}>
                View Results
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <TabsContent value="edit" className="mt-0">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={addScenario} variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add Scenario
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => removeScenario(scenario.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
                
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Input
                        className="font-medium text-base"
                        value={scenario.name}
                        onChange={(e) => updateScenario(scenario.id, "name", e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="grid gap-2">
                    <Label htmlFor={`region-${scenario.id}`}>Region</Label>
                    <Select
                      value={scenario.region}
                      onValueChange={(value) => updateScenario(scenario.id, "region", value)}
                    >
                      <SelectTrigger id={`region-${scenario.id}`}>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`building-type-${scenario.id}`}>Building Type</Label>
                    <Select
                      value={scenario.buildingType}
                      onValueChange={(value) => updateScenario(scenario.id, "buildingType", value)}
                    >
                      <SelectTrigger id={`building-type-${scenario.id}`}>
                        <SelectValue placeholder="Select building type" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`square-footage-${scenario.id}`}>Square Footage</Label>
                    <Input
                      id={`square-footage-${scenario.id}`}
                      type="number"
                      value={scenario.squareFootage}
                      onChange={(e) => updateScenario(scenario.id, "squareFootage", Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`complexity-${scenario.id}`}>Complexity Level</Label>
                    <Select
                      value={scenario.complexityLevel}
                      onValueChange={(value) => updateScenario(scenario.id, "complexityLevel", value)}
                    >
                      <SelectTrigger id={`complexity-${scenario.id}`}>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        {complexityLevels.map((level: { value: string; label: string }) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor={`year-${scenario.id}`}>Assessment Year</Label>
                    <Input
                      id={`year-${scenario.id}`}
                      type="number"
                      value={scenario.year}
                      onChange={(e) => updateScenario(scenario.id, "year", Number(e.target.value))}
                    />
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => duplicateScenario(scenario.id)}
                  >
                    <Copy className="mr-1 h-4 w-4" /> Duplicate
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              disabled={isCalculating} 
              onClick={calculateAll}
              className="gap-1"
            >
              <Calculator className="h-4 w-4" />
              Compare Scenarios
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          
          {isCalculating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                Calculating scenarios... {Math.round(progress)}%
              </p>
            </div>
          )}
        </div>
      </TabsContent>
      
      <TabsContent value="results" className="mt-0">
        {scenarios.some(s => s.results) ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              <h3 className="text-lg font-medium">Comparison Results</h3>
              <Button variant="outline" size="sm" onClick={clearResults}>
                Reset Calculations
              </Button>
            </div>
            
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Property</TableHead>
                    {scenarios.map((scenario) => (
                      <TableHead key={scenario.id}>
                        {scenario.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Region</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>{scenario.region}</TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Building Type</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.buildingType}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Square Footage</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.squareFootage.toLocaleString()}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Complexity Level</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.complexityLevel}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Assessment Year</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>{scenario.year}</TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={scenarios.length + 1} className="py-2">
                      <div className="text-sm font-semibold">Calculation Results</div>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Base Cost</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.results ? `$${parseFloat(scenario.results.baseCost).toFixed(2)}` : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Cost per Sq.Ft.</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.results ? `$${parseFloat(scenario.results.costPerSqft).toFixed(2)}` : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Region Factor</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.results ? parseFloat(scenario.results.regionFactor).toFixed(2) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Complexity Factor</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.results ? parseFloat(scenario.results.complexityFactor).toFixed(2) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow className="font-semibold">
                    <TableCell className="font-medium">Total Cost</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.results ? (
                          <span className="text-primary font-bold">
                            ${parseFloat(scenario.results.totalCost).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        ) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">Assessed Value</TableCell>
                    {scenarios.map((scenario) => (
                      <TableCell key={scenario.id}>
                        {scenario.results && scenario.results.assessedValue ? (
                          <span>
                            ${parseFloat(scenario.results.assessedValue).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        ) : '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </ScrollArea>
            
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => window.print()}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  Export Results
                </Button>
              </div>
              
              <Button onClick={() => setActiveTab("edit")} variant="outline">
                Edit Scenarios
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground">
              No calculation results available. Please calculate scenarios first.
            </p>
            <Button 
              onClick={() => setActiveTab("edit")} 
              variant="outline" 
              className="mt-4"
            >
              Go to Edit Scenarios
            </Button>
          </div>
        )}
      </TabsContent>
    </div>
  );
}