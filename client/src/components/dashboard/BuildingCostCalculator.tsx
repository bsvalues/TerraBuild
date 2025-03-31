import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useCostMatrix } from "@/hooks/use-cost-matrix";
import {
  CalculatorIcon,
  BarChart2,
  CheckCircle2,
  Building2,
  Map,
  Ruler,
  Settings,
  FileText,
  DollarSign,
  FileDown,
  ArrowRight,
  RotateCw
} from "lucide-react";

// Define schema for building cost calculation form
const calculationSchema = z.object({
  region: z.string(),
  buildingType: z.string(),
  squareFootage: z.coerce.number().positive("Square footage must be greater than 0"),
  complexityFactor: z.coerce.number().min(0.5).max(3.0),
  conditionFactor: z.coerce.number().min(0.6).max(1.1),
  yearBuilt: z.coerce.number().min(1900).max(new Date().getFullYear()),
  condition: z.string().optional(),
  stories: z.coerce.number().min(1).optional(),
  qualityGrade: z.string().optional(),
  occupancyType: z.string().optional()
});

type CalculationFormValues = z.infer<typeof calculationSchema>;

export default function BuildingCostCalculator() {
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("input");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const { getAll: getAllMatrices } = useCostMatrix();
  const matrices = getAllMatrices.data || [];
  
  // Get unique regions from matrices
  const regions = [...new Set(matrices.map(matrix => matrix.region))];
  
  // Get unique building types from matrices
  const buildingTypes = [...new Set(matrices.map(matrix => matrix.buildingType))];

  // Define calculation mutation
  const calculateCost = useMutation({
    mutationFn: async (data: CalculationFormValues) => {
      const response = await apiRequest("POST", "/api/building-cost/calculate", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCalculationResult(data);
      setActiveTab("result");
      toast({
        title: "Calculation complete",
        description: "Building cost has been calculated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Calculation failed",
        description: error.message || "Failed to calculate building cost.",
        variant: "destructive",
      });
    }
  });
  
  // Initialize form with default values
  const form = useForm<CalculationFormValues>({
    resolver: zodResolver(calculationSchema),
    defaultValues: {
      region: "select-region",
      buildingType: "select-building-type",
      squareFootage: 2000,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      yearBuilt: new Date().getFullYear() - 5,
      stories: 1,
      qualityGrade: "Standard",
      occupancyType: "Single Family"
    }
  });
  
  // Handle form submission
  function onSubmit(data: CalculationFormValues) {
    // Check if placeholder values are selected
    if (data.region === "select-region" || data.buildingType === "select-building-type") {
      toast({
        title: "Missing required fields",
        description: "Please select both a region and building type before calculating.",
        variant: "destructive",
      });
      return;
    }
    calculateCost.mutate(data);
  }
  
  // Save calculation to history
  const saveCalculation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/calculation-history", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Calculation saved",
        description: "Building cost calculation has been saved to history.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save calculation to history.",
        variant: "destructive",
      });
    }
  });
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };
  
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="input" disabled={calculateCost.isPending}>
            <CalculatorIcon className="h-4 w-4 mr-2" />
            Input
          </TabsTrigger>
          <TabsTrigger value="result" disabled={!calculationResult || calculateCost.isPending}>
            <BarChart2 className="h-4 w-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="export" disabled={!calculationResult || calculateCost.isPending}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Building Cost Calculator</CardTitle>
              <CardDescription>
                Calculate building costs based on region, building type, and other factors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <Building2 className="h-5 w-5 mr-2 text-muted-foreground" />
                        <h3 className="text-lg font-medium">Basic Information</h3>
                      </div>
                      
                      {/* Region Selection */}
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select region" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="select-region">Select region</SelectItem>
                                {regions.map((region) => (
                                  <SelectItem key={region} value={region}>
                                    {region}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the region for this building
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Building Type Selection */}
                      <FormField
                        control={form.control}
                        name="buildingType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select building type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="select-building-type">Select building type</SelectItem>
                                {buildingTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the building type for calculation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Square Footage */}
                      <FormField
                        control={form.control}
                        name="squareFootage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Square Footage</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1" 
                                placeholder="Enter square footage" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Total square footage of the building
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Year Built */}
                      <FormField
                        control={form.control}
                        name="yearBuilt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year Built</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1900" 
                                max={new Date().getFullYear()} 
                                placeholder="Enter year built" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Year the building was constructed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Adjustment Factors Section */}
                    <div className="space-y-4">
                      <div className="flex items-center mb-2">
                        <Settings className="h-5 w-5 mr-2 text-muted-foreground" />
                        <h3 className="text-lg font-medium">Adjustment Factors</h3>
                      </div>
                      
                      {/* Complexity Factor */}
                      <FormField
                        control={form.control}
                        name="complexityFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Complexity Factor: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0.5}
                                max={3.0}
                                step={0.1}
                                defaultValue={[field.value]}
                                onValueChange={(values) => {
                                  field.onChange(values[0]);
                                }}
                              />
                            </FormControl>
                            <FormDescription className="flex justify-between">
                              <span>Simple (0.5)</span>
                              <span>Complex (3.0)</span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Condition Factor */}
                      <FormField
                        control={form.control}
                        name="conditionFactor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Condition Factor: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={0.6}
                                max={1.1}
                                step={0.1}
                                defaultValue={[field.value]}
                                onValueChange={(values) => {
                                  field.onChange(values[0]);
                                }}
                              />
                            </FormControl>
                            <FormDescription className="flex justify-between">
                              <span>Poor (0.6)</span>
                              <span>Excellent (1.1)</span>
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Condition Selection */}
                      <FormField
                        control={form.control}
                        name="condition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Building Condition</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select condition" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Excellent">Excellent</SelectItem>
                                <SelectItem value="Good">Good</SelectItem>
                                <SelectItem value="Average">Average</SelectItem>
                                <SelectItem value="Fair">Fair</SelectItem>
                                <SelectItem value="Poor">Poor</SelectItem>
                                <SelectItem value="Very Poor">Very Poor</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Current condition of the building
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Toggle Advanced Options */}
                      <div className="pt-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        >
                          {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
                        </Button>
                      </div>
                      
                      {/* Advanced Options */}
                      {showAdvancedOptions && (
                        <div className="space-y-4 pt-2">
                          <Separator className="my-4" />
                          
                          {/* Number of Stories */}
                          <FormField
                            control={form.control}
                            name="stories"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Number of Stories</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1" 
                                    placeholder="Enter number of stories" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Quality Grade */}
                          <FormField
                            control={form.control}
                            name="qualityGrade"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quality Grade</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select quality grade" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Luxury">Luxury</SelectItem>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                    <SelectItem value="Standard">Standard</SelectItem>
                                    <SelectItem value="Economy">Economy</SelectItem>
                                    <SelectItem value="Low Cost">Low Cost</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Occupancy Type */}
                          <FormField
                            control={form.control}
                            name="occupancyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Occupancy Type</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select occupancy type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Single Family">Single Family</SelectItem>
                                    <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                                    <SelectItem value="Commercial">Commercial</SelectItem>
                                    <SelectItem value="Industrial">Industrial</SelectItem>
                                    <SelectItem value="Agricultural">Agricultural</SelectItem>
                                    <SelectItem value="Mixed Use">Mixed Use</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit" 
                      disabled={calculateCost.isPending}
                      className="w-full md:w-auto"
                    >
                      {calculateCost.isPending ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          Calculate Cost
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="result" className="mt-4">
          {calculationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Building Cost Results</CardTitle>
                <CardDescription>
                  Calculated cost breakdown for your building
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Summary Section */}
                  <div className="bg-primary/10 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">Cost Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-background p-4 rounded-md shadow-sm">
                        <p className="text-sm text-muted-foreground">Base Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(calculationResult.baseCost)}</p>
                      </div>
                      <div className="bg-background p-4 rounded-md shadow-sm">
                        <p className="text-sm text-muted-foreground">Adjusted Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(calculationResult.adjustedCost)}</p>
                      </div>
                      <div className="bg-primary/20 p-4 rounded-md shadow-sm">
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                        <p className="text-2xl font-bold">{formatCurrency(calculationResult.totalCost)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Input Details */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">Input Details</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Region</p>
                        <p className="font-medium">{form.getValues().region}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Building Type</p>
                        <p className="font-medium">{form.getValues().buildingType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Square Footage</p>
                        <p className="font-medium">{form.getValues().squareFootage.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Year Built</p>
                        <p className="font-medium">{form.getValues().yearBuilt}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Adjustment Factors */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Adjustment Factors</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Regional Factor</p>
                          <p className="font-medium">{calculationResult.regionalFactor.toFixed(2)}</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Building Type Factor</p>
                          <p className="font-medium">{calculationResult.buildingTypeFactor.toFixed(2)}</p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Complexity Factor</p>
                          <p className="font-medium">{form.getValues().complexityFactor.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Condition Factor</p>
                          <p className="font-medium">{form.getValues().conditionFactor.toFixed(1)}</p>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Complexity Adjustment</p>
                          <p className={`font-medium ${calculationResult.complexityAdjustment > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {formatCurrency(calculationResult.complexityAdjustment)}
                          </p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Condition Adjustment</p>
                          <p className={`font-medium ${calculationResult.conditionAdjustment > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(calculationResult.conditionAdjustment)}
                          </p>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Depreciation Rate</p>
                          <p className="font-medium">{formatPercentage(calculationResult.depreciationRate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Depreciation Adjustment</p>
                          <p className="font-medium text-red-500">
                            {formatCurrency(calculationResult.depreciationAdjustment)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Material Cost Breakdown */}
                  {calculationResult.materialCosts && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Material Cost Breakdown</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(calculationResult.materialCosts).map(([category, cost]) => (
                          <div key={category} className="border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground">{category}</p>
                            <p className="font-medium">{formatCurrency(cost as number)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("input")}
                >
                  Back to Calculator
                </Button>
                <Button
                  onClick={() => {
                    // Save calculation to history
                    saveCalculation.mutate({
                      ...form.getValues(),
                      baseCost: calculationResult.baseCost,
                      adjustedCost: calculationResult.adjustedCost,
                      totalCost: calculationResult.totalCost,
                      calculatedAt: new Date()
                    });
                  }}
                  disabled={saveCalculation.isPending}
                >
                  {saveCalculation.isPending ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Calculation
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="export" className="mt-4">
          {calculationResult && (
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Export your calculation results in different formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full sm:w-auto flex items-center justify-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                  
                  <Button variant="outline" className="w-full sm:w-auto flex items-center justify-center ml-0 sm:ml-4">
                    <FileText className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}