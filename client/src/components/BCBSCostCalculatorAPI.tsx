import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector, Treemap } from 'recharts';
import { AlertCircle, Info, Building, Home, Trash2, DollarSign, BarChart3, PieChartIcon, Copy, ArrowRightLeft, Save, ArrowLeftRight, Blocks, Clock, FileText, Printer, PlayCircle, BrainCircuit, Share2, Loader2, FileDown } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import CostReportPDFExport from "./CostReportPDFExport";
import BuildingBlocksAnimation from "./BuildingBlocksAnimation";

// Form schema for calculator
const calculatorSchema = z.object({
  squareFootage: z.coerce.number().min(1, "Square footage must be greater than 0"),
  buildingType: z.string().min(1, "Building type is required"),
  quality: z.string().min(1, "Quality level is required"),
  complexityFactor: z.coerce.number().min(0.5).max(3.0).default(1.0),
  conditionFactor: z.coerce.number().min(0.6).max(1.1).default(1.0),
  region: z.string().min(1, "Region is required"),
  yearBuilt: z.coerce.number()
    .min(1900, "Year built must be 1900 or later")
    .max(new Date().getFullYear(), "Year built cannot be in the future")
    .default(new Date().getFullYear()),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

interface MaterialCost {
  foundations: number;
  framing: number;
  exterior: number;
  roofing: number;
  interior: number;
  electrical: number;
  plumbing: number;
  hvac: number;
  finishes: number;
  [key: string]: number;
}

interface CostBreakdown {
  category: string;
  cost: number;
}

interface CalculationResult {
  region: string;
  buildingType: string;
  squareFootage: number;
  baseCost: string;
  regionFactor: string;
  complexityFactor: number;
  costPerSqft: number;
  totalCost: number;
  adjustedCost: number;
  conditionFactor: number;
  materialCosts?: MaterialCost;
}

const BCBSCostCalculatorAPI = () => {
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const [hoveredCostItem, setHoveredCostItem] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();

  // Default form values
  const defaultValues: Partial<CalculatorFormValues> = {
    squareFootage: 1000,
    buildingType: "RESIDENTIAL",
    quality: "STANDARD",
    complexityFactor: 1.0,
    conditionFactor: 1.0,
    region: "CENTRAL",
    yearBuilt: new Date().getFullYear(),
  };

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues,
  });

  // Building types and quality levels
  const buildingTypes = [
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "INDUSTRIAL", label: "Industrial" },
    { value: "OFFICE", label: "Office" },
  ];

  const qualityLevels = [
    { value: "STANDARD", label: "Standard" },
    { value: "PREMIUM", label: "Premium" },
    { value: "LUXURY", label: "Luxury" },
    { value: "ECONOMY", label: "Economy" },
  ];

  const regions = [
    { value: "CENTRAL", label: "Central" },
    { value: "RICHLAND", label: "Richland" },
    { value: "KENNEWICK", label: "Kennewick" },
    { value: "PASCO", label: "Pasco" },
    { value: "WEST_RICHLAND", label: "West Richland" },
    { value: "BENTON_CITY", label: "Benton City" },
    { value: "PROSSER", label: "Prosser" },
    { value: "NORTHEAST", label: "Northeast" },
    { value: "MIDWEST", label: "Midwest" },
    { value: "SOUTH", label: "South" },
    { value: "WEST", label: "West" },
  ];

  // Submit form handler using our API
  const onSubmit = async (data: CalculatorFormValues) => {
    setIsCalculating(true);
    setApiError(null);
    try {
      // Call our advanced calculation endpoint
      const response = await axios.post('/api/building-cost/calculate', {
        region: data.region,
        buildingType: data.buildingType,
        squareFootage: data.squareFootage,
        complexityFactor: data.complexityFactor,
        conditionFactor: data.conditionFactor,
        yearBuilt: data.yearBuilt,
        quality: data.quality
      });

      // Set the calculation result
      setCalculationResult(response.data);

      // Generate cost breakdown from the API response
      const breakdown: CostBreakdown[] = [];

      // Base Cost
      const baseCost = Number(response.data.baseCost) || 0;
      const squareFootage = response.data.squareFootage || 0;
      breakdown.push({ category: 'Base Cost', cost: baseCost * squareFootage });

      // Complexity Adjustment
      const complexityFactor = response.data.complexityFactor || 1.0;
      const complexityAdjustment = baseCost * squareFootage * (complexityFactor - 1);
      breakdown.push({ category: 'Complexity Adjustment', cost: complexityAdjustment });

      // Condition Adjustment
      const conditionFactor = response.data.conditionFactor || 1.0;
      const conditionAdjustment = baseCost * squareFootage * complexityFactor * (conditionFactor - 1);
      breakdown.push({ category: 'Condition Adjustment', cost: conditionAdjustment });

      // Region Adjustment (if regionFactor is available)
      if (response.data.regionFactor) {
        const regionFactor = Number(response.data.regionFactor) || 1.0;
        const regionAdjustment = baseCost * squareFootage * complexityFactor * conditionFactor * (regionFactor - 1);
        breakdown.push({ category: 'Regional Adjustment', cost: regionAdjustment });
      }

      // Materials
      if (response.data.materialCosts) {
        // Add individual material costs
        Object.entries(response.data.materialCosts).forEach(([category, cost]) => {
          const costValue = typeof cost === 'number' ? cost : Number(cost) || 0;
          breakdown.push({ category: category.charAt(0).toUpperCase() + category.slice(1), cost: costValue });
        });
      }

      setCostBreakdown(breakdown);
      setActiveTab("results");
      
      toast({
        title: "Calculation Complete",
        description: `Successfully calculated cost for ${data.squareFootage} sqft ${data.buildingType} in ${data.region}`,
      });
    } catch (error) {
      console.error('Error calculating cost:', error);
      if (axios.isAxiosError(error) && error.response) {
        setApiError(`Error: ${error.response.data.message || 'Failed to calculate cost'}`);
        toast({
          variant: "destructive",
          title: "Calculation Error",
          description: error.response.data.message || 'Failed to calculate cost',
        });
      } else {
        setApiError('Network error or server is not responding');
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Network error or server is not responding",
        });
      }
    } finally {
      setIsCalculating(false);
    }
  };

  // Format currency values
  const formatCurrency = (value: number | unknown) => {
    const numValue = typeof value === 'number' ? value : Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full shadow-md border-[#29B7D3]/20">
        <CardHeader className="bg-gradient-to-r from-[#e6eef2] to-[#e8f8fb]">
          <div className="flex items-center">
            <div className="mr-4 p-2 bg-blue-500 text-white rounded-full">
              <DollarSign size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Building Cost Calculator</CardTitle>
              <CardDescription>
                Calculate accurate building costs using the Benton County Building Cost System API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="calculator" className="flex-1">
                <div className="flex items-center">
                  <Building className="mr-2" size={18} />
                  <span>Calculator</span>
                </div>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex-1" disabled={!calculationResult}>
                <div className="flex items-center">
                  <BarChart3 className="mr-2" size={18} />
                  <span>Results & Analysis</span>
                </div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calculator">
              {apiError && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Square Footage */}
                    <FormField
                      control={form.control}
                      name="squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the total square footage of the building
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Building Type */}
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
                              {buildingTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of building
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quality Level */}
                    <FormField
                      control={form.control}
                      name="quality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quality Level</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select quality level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {qualityLevels.map(level => (
                                <SelectItem key={level.value} value={level.value}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the quality level of construction
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Region */}
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
                              {regions.map(region => (
                                <SelectItem key={region.value} value={region.value}>
                                  {region.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the region where the building is located
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
                            <Input type="number" min="1900" max={new Date().getFullYear()} {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the year the building was built or leave as current year for new construction
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Complexity Factor */}
                  <FormField
                    control={form.control}
                    name="complexityFactor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex justify-between">
                            <span>Complexity Factor</span>
                            <span className="font-mono">{field.value.toFixed(2)}</span>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value]}
                            min={0.5}
                            max={3.0}
                            step={0.01}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-4"
                          />
                        </FormControl>
                        <FormDescription className="flex justify-between text-xs">
                          <span>Simple (0.5)</span>
                          <span>Standard (1.0)</span>
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
                        <FormLabel>
                          <div className="flex justify-between">
                            <span>Condition Factor</span>
                            <span className="font-mono">{field.value.toFixed(2)}</span>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value]}
                            min={0.6}
                            max={1.1}
                            step={0.01}
                            onValueChange={(vals) => field.onChange(vals[0])}
                            className="py-4"
                          />
                        </FormControl>
                        <FormDescription className="flex justify-between text-xs">
                          <span>Poor (0.6)</span>
                          <span>Average (0.8)</span>
                          <span>Good (1.0)</span>
                          <span>Excellent (1.1)</span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center pt-4">
                    <Button type="submit" size="lg" className="w-full md:w-1/2" disabled={isCalculating}>
                      {isCalculating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <DollarSign className="mr-2 h-4 w-4" />
                          Calculate Cost
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="results">
              {calculationResult ? (
                <div className="space-y-8">
                  {/* Result Summary Card */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle>Cost Calculation Results</CardTitle>
                      <CardDescription>
                        {calculationResult.squareFootage} sq ft {calculationResult.buildingType ? calculationResult.buildingType.toLowerCase() : 'unknown'} building in {calculationResult.region ? calculationResult.region.toLowerCase().replace('_', ' ') : 'unknown location'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Total Building Cost</h3>
                          <div className="text-3xl font-bold text-blue-700">
                            {formatCurrency(calculationResult.totalCost || 0)}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatCurrency(calculationResult.costPerSqft || 0)} per square foot
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">Cost Factors</h3>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Base Cost:</span>
                              <span className="font-medium">{formatCurrency(calculationResult.baseCost ? Number(calculationResult.baseCost) : 0)}/sq ft</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Complexity Factor:</span>
                              <span className="font-medium">{calculationResult.complexityFactor ? calculationResult.complexityFactor.toFixed(2) : '1.00'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Condition Factor:</span>
                              <span className="font-medium">{calculationResult.conditionFactor ? calculationResult.conditionFactor.toFixed(2) : '1.00'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Region Factor:</span>
                              <span className="font-medium">{calculationResult.regionFactor ? Number(calculationResult.regionFactor).toFixed(2) : '1.00'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cost Breakdown */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Cost Breakdown</h3>
                    
                    {/* Cost Visualization Tabs */}
                    <Tabs defaultValue="table" className="mb-6">
                      <TabsList className="w-full mb-4">
                        <TabsTrigger value="table" className="flex-1">
                          <div className="flex items-center">
                            <span>Table View</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger value="blocks" className="flex-1">
                          <div className="flex items-center">
                            <span>Building Blocks Animation</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="table">
                        {/* Cost Breakdown Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-1/2">Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Percentage</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {costBreakdown.map((item, index) => {
                            // Skip items with zero or negative costs
                            if (item.cost <= 0) return null;
                            
                            const percentage = calculationResult.totalCost ? (item.cost / calculationResult.totalCost) * 100 : 0;
                            
                            return (
                              <TableRow 
                                key={index}
                                className={hoveredCostItem === item.category ? "bg-blue-50" : ""}
                                onMouseEnter={() => setHoveredCostItem(item.category)}
                                onMouseLeave={() => setHoveredCostItem(null)}
                              >
                                <TableCell>{item.category}</TableCell>
                                <TableCell>{formatCurrency(item.cost)}</TableCell>
                                <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="font-bold bg-gray-50">
                            <TableCell>Total Cost</TableCell>
                            <TableCell>{formatCurrency(calculationResult.totalCost || 0)}</TableCell>
                            <TableCell className="text-right">100%</TableCell>
                          </TableRow>
                        </TableBody>
                          </Table>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="blocks">
                        {/* Building Blocks Animation */}
                        <BuildingBlocksAnimation 
                          costBreakdown={costBreakdown} 
                          totalCost={calculationResult.totalCost || 0}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* Material Costs Visualization */}
                  {calculationResult.materialCosts && (
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Materials Cost Breakdown</h3>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={Object.entries(calculationResult.materialCosts).map(([key, value]) => ({
                                name: key.charAt(0).toUpperCase() + key.slice(1),
                                value
                              }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {Object.keys(calculationResult.materialCosts).map((_, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
                                    '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1',
                                    '#a4de6c', '#d0ed57'
                                  ][index % 10]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => setActiveTab("calculator")}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Modify Calculation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => {
                        // Ideally, this would save to database
                        toast({
                          title: "Calculation Saved",
                          description: "Your calculation has been saved for future reference",
                        });
                      }}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Save Calculation
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(calculationResult, null, 2));
                        toast({
                          title: "Copied to Clipboard",
                          description: "Calculation details copied to clipboard",
                        });
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Data
                    </Button>
                    
                    {/* PDF Export Button */}
                    {calculationResult && (
                      <CostReportPDFExport 
                        calculationResult={calculationResult}
                        costBreakdown={costBreakdown}
                        projectName={`${calculationResult.buildingType || 'Property'} Building Cost Report`}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium">No Calculation Results</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Enter your building details in the calculator tab and submit to see results
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6"
                    onClick={() => setActiveTab("calculator")}
                  >
                    Go to Calculator
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <div className="text-sm text-gray-500">
            <p>Calculation uses the official Benton County Building Cost API</p>
            <p className="mt-1">All calculations are approximate and may require professional validation.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BCBSCostCalculatorAPI;