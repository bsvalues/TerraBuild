import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector } from 'recharts';
import { AlertCircle, Info, Building, Home, Trash2, DollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Form schema for calculator
const calculatorSchema = z.object({
  squareFootage: z.coerce.number().min(1, "Square footage must be greater than 0"),
  buildingType: z.string().min(1, "Building type is required"),
  quality: z.string().min(1, "Quality level is required"),
  complexityFactor: z.coerce.number().min(0.5).max(2.0).default(1.0),
  conditionFactor: z.coerce.number().min(0.5).max(1.5).default(1.0),
  region: z.string().min(1, "Region is required"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

type Material = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

interface CostBreakdown {
  category: string;
  cost: number;
}

interface TimelineData {
  month: string;
  cost: number;
  projectedCost: number;
}

const BCBSCostCalculator = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [regionalMultiplier, setRegionalMultiplier] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const [hoveredCostItem, setHoveredCostItem] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);

  // Default form values
  const defaultValues: Partial<CalculatorFormValues> = {
    squareFootage: 1000,
    buildingType: "RESIDENTIAL",
    quality: "STANDARD",
    complexityFactor: 1.0,
    conditionFactor: 1.0,
    region: "MIDWEST",
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
  ];

  const qualityLevels = [
    { value: "STANDARD", label: "Standard" },
    { value: "PREMIUM", label: "Premium" },
    { value: "LUXURY", label: "Luxury" },
  ];

  const regions = [
    { value: "NORTHEAST", label: "Northeast" },
    { value: "MIDWEST", label: "Midwest" },
    { value: "SOUTH", label: "South" },
    { value: "WEST", label: "West" },
    { value: "RICHLAND", label: "Richland" },
    { value: "KENNEWICK", label: "Kennewick" },
    { value: "PASCO", label: "Pasco" },
    { value: "WEST_RICHLAND", label: "West Richland" },
    { value: "BENTON_CITY", label: "Benton City" },
    { value: "PROSSER", label: "Prosser" },
  ];

  // Get regional multiplier based on region
  const getRegionalMultiplier = (region: string): number => {
    const multipliers: Record<string, number> = {
      'RICHLAND': 1.05,
      'KENNEWICK': 1.02,
      'PASCO': 1.0,
      'WEST_RICHLAND': 1.07,
      'BENTON_CITY': 0.95,
      'PROSSER': 0.93,
      'NORTHEAST': 1.15,
      'MIDWEST': 1.0,
      'SOUTH': 0.92,
      'WEST': 1.25
    };
    
    return multipliers[region] || 1.0;
  };

  // Base cost per square foot lookup
  const getBaseCostPerSqFt = (buildingType: string, quality: string): number => {
    const baseCosts: Record<string, Record<string, number>> = {
      'RESIDENTIAL': { 'STANDARD': 125, 'PREMIUM': 175, 'LUXURY': 250 },
      'COMMERCIAL': { 'STANDARD': 150, 'PREMIUM': 200, 'LUXURY': 300 },
      'INDUSTRIAL': { 'STANDARD': 100, 'PREMIUM': 150, 'LUXURY': 225 }
    };
    
    return baseCosts[buildingType]?.[quality] || 150;
  };

  // Calculate total cost based on form values and materials
  const calculateTotalCost = (data: CalculatorFormValues, materials: Material[]): number => {
    const baseCostPerSqFt = getBaseCostPerSqFt(data.buildingType, data.quality);
    const baseCost = data.squareFootage * baseCostPerSqFt;
    
    const multiplier = getRegionalMultiplier(data.region);
    setRegionalMultiplier(multiplier);
    
    // Apply factors
    let adjustedCost = baseCost;
    adjustedCost *= data.complexityFactor;
    adjustedCost *= data.conditionFactor;
    adjustedCost *= multiplier;
    
    // Calculate material costs
    const materialCost = materials.reduce((total, material) => {
      return total + (material.quantity * material.unitPrice);
    }, 0);
    
    // Generate cost breakdown
    const breakdown: CostBreakdown[] = [
      { category: 'Base Cost', cost: baseCost },
      { category: 'Complexity Adjustment', cost: baseCost * (data.complexityFactor - 1) },
      { category: 'Condition Adjustment', cost: baseCost * data.complexityFactor * (data.conditionFactor - 1) },
      { category: 'Regional Adjustment', cost: adjustedCost - (baseCost * data.complexityFactor * data.conditionFactor) },
      { category: 'Materials', cost: materialCost }
    ];
    
    setCostBreakdown(breakdown);
    
    return adjustedCost + materialCost;
  };

  // Add a new material to the list
  const addMaterial = () => {
    const newMaterial: Material = {
      id: `material-${Date.now()}`,
      name: '',
      quantity: 0,
      unitPrice: 0
    };
    
    setMaterials([...materials, newMaterial]);
  };

  // Update a material in the list
  const updateMaterial = (id: string, field: keyof Material, value: string | number) => {
    const updatedMaterials = materials.map(material => {
      if (material.id === id) {
        return { ...material, [field]: value };
      }
      return material;
    });
    
    setMaterials(updatedMaterials);
  };

  // Remove a material from the list
  const removeMaterial = (id: string) => {
    const updatedMaterials = materials.filter(material => material.id !== id);
    setMaterials(updatedMaterials);
  };

  // Generate timeline projection data
  const generateTimelineData = (totalCost: number): TimelineData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const baseCostPerMonth = totalCost / 12;
    
    // Create a realistic cost curve with variations
    return months.map((month, index) => {
      // Create a realistic project spending curve
      // Projects typically start slow, ramp up in the middle, and taper off
      let monthlyFactor = 0;
      
      if (index < 3) {
        // Initial phase (first quarter) - slower start
        monthlyFactor = 0.5 + (index * 0.2);
      } else if (index < 9) {
        // Middle phase (months 4-9) - peak construction period
        monthlyFactor = 1.2 - (Math.abs(index - 6) * 0.05);
      } else {
        // Final phase (last quarter) - finishing work
        monthlyFactor = 0.8 - ((index - 9) * 0.15);
      }
      
      // Add some randomness for realism
      const variability = 0.15; // 15% max variance
      const randomFactor = 1 + ((Math.random() * variability * 2) - variability);
      
      // Calculate the cost for this month
      const cost = baseCostPerMonth * monthlyFactor * randomFactor;
      
      // Calculate the projected cost (ideal curve without randomness)
      const projectedCost = baseCostPerMonth * monthlyFactor;
      
      return {
        month,
        cost: Math.round(cost),
        projectedCost: Math.round(projectedCost)
      };
    });
  };

  // Submit form handler
  const onSubmit = (data: CalculatorFormValues) => {
    const cost = calculateTotalCost(data, materials);
    setTotalCost(cost);
    
    // Generate timeline data when form is submitted
    const timeline = generateTimelineData(cost);
    setTimelineData(timeline);
  };

  // Update cost when form values or materials change
  useEffect(() => {
    if (form.formState.isValid) {
      const data = form.getValues();
      const cost = calculateTotalCost(data, materials);
      setTotalCost(cost);
      
      // Generate timeline data when cost changes
      if (cost > 0) {
        const timeline = generateTimelineData(cost);
        setTimelineData(timeline);
      }
    }
  }, [form.formState.isValid, materials]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full shadow-md border-[#29B7D3]/20">
        <CardHeader className="bg-gradient-to-r from-[#e6eef2] to-[#e8f8fb]">
          <div className="flex items-center">
            <DollarSign className="text-[#243E4D] mr-2 h-6 w-6" />
            <CardTitle className="text-2xl text-[#243E4D]">Building Cost Calculator</CardTitle>
          </div>
          <CardDescription className="text-[#243E4D]/70">
            Calculate accurate building costs based on project specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calculator" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-[#e6eef2]">
              <TabsTrigger 
                value="calculator" 
                className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white"
              >
                Calculator
              </TabsTrigger>
              <TabsTrigger 
                value="materials" 
                className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white"
              >
                Materials
              </TabsTrigger>
              <TabsTrigger 
                value="results" 
                className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white"
              >
                Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator">
              <div className="bg-[#e6eef2] p-4 rounded-lg mb-6 flex items-center text-sm">
                <AlertCircle className="text-[#243E4D] mr-2 h-4 w-4" />
                <p className="text-[#243E4D]">Enter your building specifications to get an accurate cost estimate. All fields are required for calculation.</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 border rounded-lg shadow-sm">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Home className="h-4 w-4 mr-2 text-[#243E4D]" />
                        Building Specifications
                      </h3>
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="squareFootage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Square Footage</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} className="border-gray-200" />
                              </FormControl>
                              <FormDescription>
                                Enter the total square footage of the building
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
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
                                  <SelectTrigger className="border-gray-200">
                                    <SelectValue placeholder="Select building type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {buildingTypes.map((type) => (
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
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 border rounded-lg shadow-sm">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Building className="h-4 w-4 mr-2 text-[#3CAB36]" />
                        Quality & Location
                      </h3>
                      <div className="space-y-4">
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
                                  <SelectTrigger className="border-gray-200">
                                    <SelectValue placeholder="Select quality level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {qualityLevels.map((quality) => (
                                    <SelectItem key={quality.value} value={quality.value}>
                                      {quality.label}
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
                                  <SelectTrigger className="border-gray-200">
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {regions.map((region) => (
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
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 border rounded-lg shadow-sm">
                    <h3 className="text-md font-medium mb-3 flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-[#29B7D3]" />
                      Adjustment Factors
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="complexityFactor"
                        render={({ field }) => (
                          <FormItem className="bg-[#e6eef2] p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <FormLabel>Complexity Factor</FormLabel>
                              <Badge variant="outline" className="bg-white text-[#243E4D] border-[#29B7D3]/30">{field.value}</Badge>
                            </div>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                min={0.5}
                                max={2.0}
                                step={0.05}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="mt-2"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Simple: 0.5</span>
                              <span>Standard: 1.0</span>
                              <span>Complex: 2.0</span>
                            </div>
                            <FormDescription className="mt-2">
                              Adjust for building complexity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="conditionFactor"
                        render={({ field }) => (
                          <FormItem className="bg-[#e8f8fb] p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <FormLabel>Condition Factor</FormLabel>
                              <Badge variant="outline" className="bg-white text-[#243E4D] border-[#29B7D3]/30">{field.value}</Badge>
                            </div>
                            <FormControl>
                              <Slider
                                defaultValue={[field.value]}
                                min={0.5}
                                max={1.5}
                                step={0.05}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="mt-2"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Poor: 0.5</span>
                              <span>Average: 1.0</span>
                              <span>Excellent: 1.5</span>
                            </div>
                            <FormDescription className="mt-2">
                              Adjust for building condition
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setActiveTab("materials")}
                      className="flex items-center gap-2"
                    >
                      <span>Next: Add Materials</span>
                      <span>→</span>
                    </Button>
                    
                    <Button 
                      type="submit"
                      className="gap-2 bg-[#3CAB36] hover:bg-[#3CAB36]/90 text-white"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Calculate Cost</span>
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="materials">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <DollarSign className="mr-2 h-5 w-5 text-[#3CAB36]" />
                    <h3 className="text-lg font-medium">Building Materials</h3>
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={addMaterial} size="sm" className="flex items-center gap-1 bg-[#29B7D3] hover:bg-[#29B7D3]/90 text-white">
                          <span>Add Material</span>
                          <span className="ml-1">+</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add materials to include in cost calculation</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>
                
                <div className="bg-[#e8f8fb] p-4 rounded-lg mb-4 flex items-center text-sm">
                  <Info className="text-[#29B7D3] mr-2 h-4 w-4" />
                  <p className="text-[#243E4D]">Adding specific materials will provide a more accurate cost estimate. All materials will be included in the final calculation.</p>
                </div>
                
                {materials.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-100">
                        <TableRow>
                          <TableHead>Material Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price ($)</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.map((material) => (
                          <TableRow key={material.id}>
                            <TableCell>
                              <Input
                                type="text"
                                value={material.name}
                                onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                                placeholder="Enter material name"
                                className="border-gray-200"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={material.quantity}
                                onChange={(e) => updateMaterial(material.id, 'quantity', Number(e.target.value))}
                                placeholder="Quantity"
                                className="border-gray-200"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={material.unitPrice}
                                onChange={(e) => updateMaterial(material.id, 'unitPrice', Number(e.target.value))}
                                placeholder="Unit price"
                                className="border-gray-200"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              ${(material.quantity * material.unitPrice).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeMaterial(material.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remove</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 border rounded-md bg-[#e6eef2]">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Building className="h-10 w-10 text-[#243E4D]" />
                      <p className="text-[#243E4D]">No materials added yet.</p>
                      <Button onClick={addMaterial} variant="outline" size="sm" className="mt-2 border-[#29B7D3]/30 hover:bg-[#e8f8fb] hover:text-[#29B7D3]">
                        Add Your First Material
                      </Button>
                    </div>
                  </div>
                )}
                
                {materials.length > 0 && (
                  <div className="bg-[#e6eef2] p-3 rounded-md flex justify-between items-center mt-4">
                    <span className="font-medium text-[#243E4D]">Total Materials Cost:</span>
                    <span className="font-bold text-[#243E4D]">
                      ${materials.reduce((total, material) => total + (material.quantity * material.unitPrice), 0).toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("calculator")}
                    className="flex items-center gap-2"
                  >
                    <span>←</span>
                    <span>Back to Calculator</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => {
                      form.handleSubmit(onSubmit)();
                      setActiveTab("results");
                    }}
                    className="flex items-center gap-2 bg-[#3CAB36] hover:bg-[#3CAB36]/90 text-white"
                  >
                    <span>View Results</span>
                    <span>→</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#e6eef2] to-[#e8f8fb] p-6 rounded-lg border border-[#29B7D3]/20">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="text-[#243E4D] mr-2 h-6 w-6" />
                    <h3 className="text-2xl font-bold text-center text-[#243E4D]">
                      Total Estimated Cost
                    </h3>
                  </div>
                  <p className="text-5xl font-bold text-center text-[#243E4D] mb-2">
                    ${totalCost.toLocaleString()}
                  </p>
                  <p className="text-center text-sm text-[#243E4D]/70">
                    Based on {form.getValues().squareFootage.toLocaleString()} sq ft {regions.find(r => r.value === form.getValues().region)?.label} {form.getValues().buildingType.toLowerCase()} building
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BarChart3 className="text-[#243E4D] mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium text-[#243E4D]">Cost Breakdown</h4>
                    </div>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-100">
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Percentage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {costBreakdown.map((item) => (
                            <TableRow key={item.category}>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>${item.cost.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {((item.cost / totalCost) * 100).toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <PieChartIcon className="text-[#243E4D] mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium text-[#243E4D]">Cost Distribution</h4>
                    </div>
                    <div className="h-80 border rounded-md p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={80}
                            innerRadius={30}
                            fill="#8884d8"
                            dataKey="cost"
                            nameKey="category"
                            label={({ category, percent }) => `${(percent * 100).toFixed(0)}%`}
                            paddingAngle={5}
                            animationBegin={0}
                            animationDuration={1500}
                            animationEasing="ease-out"
                            isAnimationActive={true}
                            activeIndex={hoveredCostItem ? 
                              costBreakdown.findIndex(item => item.category === hoveredCostItem) >= 0 ?
                              [costBreakdown.findIndex(item => item.category === hoveredCostItem)] : [0] : 
                              [0]}
                            activeShape={(props: any) => {
                              const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
                              const RADIAN = Math.PI / 180;
                              const sin = Math.sin(-RADIAN * midAngle);
                              const cos = Math.cos(-RADIAN * midAngle);
                              const mx = cx + (outerRadius + 30) * cos;
                              const my = cy + (outerRadius + 30) * sin;
                              const ex = mx + (cos >= 0 ? 1 : -1) * 22;
                              const ey = my;
                              const textAnchor = cos >= 0 ? 'start' : 'end';
                              
                              return (
                                <g>
                                  <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-lg font-semibold">
                                    {payload.category}
                                  </text>
                                  <Sector
                                    cx={cx}
                                    cy={cy}
                                    innerRadius={innerRadius}
                                    outerRadius={outerRadius + 10}
                                    startAngle={startAngle}
                                    endAngle={endAngle}
                                    fill={fill}
                                    opacity={0.8}
                                  />
                                </g>
                              );
                            }}
                            onMouseEnter={(data, index) => {
                              if (data && data.category) {
                                setHoveredCostItem(data.category);
                              }
                            }}
                            onMouseLeave={() => {
                              setHoveredCostItem(null);
                            }}
                          >
                            {costBreakdown.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index % 3 === 0 ? '#243E4D' : (index % 3 === 1 ? '#3CAB36' : '#29B7D3')} 
                                className="transition-all duration-300"
                                style={{
                                  opacity: hoveredCostItem === entry.category ? 1 : (hoveredCostItem ? 0.5 : 1),
                                  filter: hoveredCostItem === entry.category ? 'brightness(1.1) drop-shadow(0px 0px 5px rgba(0,0,0,0.2))' : 'none',
                                  transform: hoveredCostItem === entry.category ? 'scale(1.05)' : 'scale(1)'
                                }}
                                cursor="pointer"
                                strokeWidth={hoveredCostItem === entry.category ? 3 : 2}
                                stroke={hoveredCostItem === entry.category ? "#000" : "#fff"}
                                onMouseEnter={() => setHoveredCostItem(entry.category)}
                                onMouseLeave={() => setHoveredCostItem(null)}
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              padding: '10px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                              border: '1px solid #ddd'
                            }}
                            animationDuration={300}
                            animationEasing="ease-out"
                          />
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            iconType="circle"
                            iconSize={10}
                            onClick={(data) => {
                              console.log('Legend clicked:', data);
                            }}
                            wrapperStyle={{
                              paddingTop: '20px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center">
                    <BarChart3 className="text-[#243E4D] mr-2 h-5 w-5" />
                    <h4 className="text-lg font-medium text-[#243E4D]">Cost Comparison</h4>
                  </div>
                  <div className="h-80 border rounded-md p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={costBreakdown}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip 
                          cursor={{ stroke: '#ddd', strokeWidth: 2, fillOpacity: 0.3 }}
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid #ddd',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            padding: '10px'
                          }}
                          formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']} 
                          animationDuration={300}
                          animationEasing="ease-out"
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '10px' }}
                          onClick={(data) => console.log('Legend clicked:', data)}
                        />
                        <Bar 
                          dataKey="cost" 
                          fill="hsl(220, 70%, 50%)"
                          animationDuration={1500}
                          animationEasing="ease-in-out"
                          activeBar={{ stroke: '#000', strokeWidth: 2 }}
                        >
                          {costBreakdown.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={index % 3 === 0 ? '#243E4D' : (index % 3 === 1 ? '#3CAB36' : '#29B7D3')}
                              className="transition-opacity duration-300"
                              style={{
                                opacity: hoveredCostItem === entry.category ? 1 : (hoveredCostItem ? 0.4 : 1),
                                filter: hoveredCostItem === entry.category ? 'brightness(1.2) drop-shadow(0px 0px 4px rgba(0,0,0,0.2))' : 'none'
                              }}
                              cursor="pointer"
                              onMouseEnter={() => setHoveredCostItem(entry.category)}
                              onMouseLeave={() => setHoveredCostItem(null)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="mt-6 space-y-6">
                  <div className="bg-white p-6 border rounded-lg shadow-sm">
                    <div className="flex items-center mb-4">
                      <DollarSign className="text-[#243E4D] mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium text-[#243E4D]">Interactive Cost Breakdown</h4>
                    </div>
                    
                    <div className="flex flex-col space-y-4">
                      {costBreakdown.map((item, index) => {
                        const percentage = (item.cost / totalCost * 100).toFixed(1);
                        const width = `${Math.max(5, parseFloat(percentage))}%`;
                        const barColors = ['#243E4D', '#3CAB36', '#29B7D3'];
                        const barColor = barColors[index % 3];
                        const bgColor = index % 3 === 0 ? '#e6eef2' : (index % 3 === 1 ? '#e8f7e8' : '#e8f8fb');
                        
                        return (
                          <div key={item.category} className="group relative">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: barColor }}></div>
                                <span className="font-medium text-sm">{item.category}</span>
                              </div>
                              <span className="text-sm font-semibold">${item.cost.toLocaleString()}</span>
                            </div>
                            
                            <div 
                              className="w-full h-10 bg-gray-100 rounded-md overflow-hidden flex items-center"
                              onMouseEnter={() => {
                                setHoveredCostItem(item.category);
                              }}
                              onMouseLeave={() => {
                                setHoveredCostItem(null);
                              }}
                            >
                              <div 
                                className="h-full transition-all duration-1000 ease-in-out flex items-center pl-2 text-white text-xs font-bold origin-left" 
                                style={{ 
                                  width: width, 
                                  backgroundColor: barColor,
                                  boxShadow: hoveredCostItem === item.category ? 
                                    '0 6px 12px rgba(0,0,0,0.2)' : 
                                    '0 4px 6px rgba(0,0,0,0.1)',
                                  transform: hoveredCostItem === item.category ? 
                                    'scaleY(1.1)' : 
                                    'scaleY(1)',
                                  zIndex: hoveredCostItem === item.category ? 10 : 1
                                }}
                              >
                                {percentage}%
                              </div>
                              <div 
                                className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-100 bg-opacity-10 transition-opacity duration-300 pointer-events-none"
                                style={{ backgroundColor: bgColor }}
                              ></div>
                            </div>
                            
                            <div 
                              className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-20"
                              style={{
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                borderBottom: `2px solid ${barColor}`,
                                transform: `translate(-50%, ${hoveredCostItem === item.category ? '-2px' : '0px'})`,
                                opacity: hoveredCostItem === item.category ? 1 : 0
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-bold mb-1">{item.category}</span>
                                <div className="flex justify-between gap-3">
                                  <span>${item.cost.toLocaleString()}</span>
                                  <span className="opacity-80">({percentage}%)</span>
                                </div>
                              </div>
                              <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-t-black border-l-transparent border-r-transparent"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {timelineData.length > 0 && (
                  <div className="mt-8 bg-white p-6 border rounded-lg shadow-sm">
                    <div className="flex items-center mb-4">
                      <BarChart3 className="text-[#243E4D] mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium text-[#243E4D]">Cost Timeline Projection</h4>
                    </div>
                    
                    <div className="bg-[#e8f8fb] p-4 rounded-lg mb-4 flex items-center text-sm">
                      <Info className="text-[#29B7D3] mr-2 h-4 w-4" />
                      <p className="text-[#243E4D]">This chart shows how costs might be distributed over a 12-month project timeline. The teal line shows projected costs, while the green bars show actual costs with typical project variations.</p>
                    </div>
                    
                    <div className="w-full h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={timelineData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#ccc' }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                            tick={{ fill: '#666' }}
                            tickLine={{ stroke: '#ccc' }}
                          />
                          <Tooltip 
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                            labelFormatter={(label) => `Month: ${label}`}
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              border: '1px solid #e0e0e0',
                              padding: '12px'
                            }}
                          />
                          <Legend verticalAlign="top" height={40} />
                          <Bar 
                            dataKey="cost" 
                            name="Monthly Cost" 
                            fill="#3CAB36" 
                            radius={[4, 4, 0, 0]}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                          <Line
                            type="monotone"
                            dataKey="projectedCost"
                            name="Projected Cost"
                            stroke="#29B7D3"
                            strokeWidth={3}
                            dot={{ r: 4, fill: "#29B7D3", strokeWidth: 2, stroke: "#fff" }}
                            activeDot={{ r: 6, fill: "#29B7D3", stroke: "#fff", strokeWidth: 2 }}
                            animationDuration={2000}
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("materials")}
                    className="flex items-center gap-2"
                  >
                    <span>←</span>
                    <span>Back to Materials</span>
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={() => form.reset(defaultValues)}
                    className="flex items-center gap-2"
                  >
                    <span>Start New Calculation</span>
                    <span>↺</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4 bg-[#e6eef2]/40">
          <div>
            <p className="text-sm text-[#243E4D]/80">Regional Multiplier: <span className="font-medium">{regionalMultiplier.toFixed(2)}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#243E4D]">Total Estimated Cost: <span className="font-bold">${totalCost.toLocaleString()}</span></p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BCBSCostCalculator;