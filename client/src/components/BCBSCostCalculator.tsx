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
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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

const BCBSCostCalculator = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [regionalMultiplier, setRegionalMultiplier] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<string>("calculator");

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

  // Submit form handler
  const onSubmit = (data: CalculatorFormValues) => {
    const cost = calculateTotalCost(data, materials);
    setTotalCost(cost);
  };

  // Update cost when form values or materials change
  useEffect(() => {
    if (form.formState.isValid) {
      const data = form.getValues();
      const cost = calculateTotalCost(data, materials);
      setTotalCost(cost);
    }
  }, [form.formState.isValid, materials]);

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Building Cost Calculator</CardTitle>
          <CardDescription>
            Calculate accurate building costs based on project specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calculator" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="calculator">
              <div className="bg-gray-50 p-4 rounded-lg mb-6 flex items-center text-sm">
                <AlertCircle className="text-blue-500 mr-2 h-4 w-4" />
                <p>Enter your building specifications to get an accurate cost estimate. All fields are required for calculation.</p>
              </div>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 border rounded-lg shadow-sm">
                      <h3 className="text-md font-medium mb-3 flex items-center">
                        <Home className="h-4 w-4 mr-2 text-primary" />
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
                        <Building className="h-4 w-4 mr-2 text-primary" />
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
                      <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                      Adjustment Factors
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="complexityFactor"
                        render={({ field }) => (
                          <FormItem className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <FormLabel>Complexity Factor</FormLabel>
                              <Badge variant="outline">{field.value}</Badge>
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
                          <FormItem className="bg-gray-50 p-3 rounded-md">
                            <div className="flex justify-between items-center">
                              <FormLabel>Condition Factor</FormLabel>
                              <Badge variant="outline">{field.value}</Badge>
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
                      className="gap-2"
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
                    <DollarSign className="mr-2 h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium">Building Materials</h3>
                  </div>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button onClick={addMaterial} size="sm" className="flex items-center gap-1">
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
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4 flex items-center text-sm">
                  <Info className="text-blue-500 mr-2 h-4 w-4" />
                  <p>Adding specific materials will provide a more accurate cost estimate. All materials will be included in the final calculation.</p>
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
                  <div className="text-center py-10 border rounded-md bg-gray-50">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Building className="h-10 w-10 text-gray-400" />
                      <p className="text-gray-500">No materials added yet.</p>
                      <Button onClick={addMaterial} variant="outline" size="sm" className="mt-2">
                        Add Your First Material
                      </Button>
                    </div>
                  </div>
                )}
                
                {materials.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center mt-4">
                    <span className="font-medium">Total Materials Cost:</span>
                    <span className="font-bold text-primary">
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
                    className="flex items-center gap-2"
                  >
                    <span>View Results</span>
                    <span>→</span>
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="text-primary mr-2 h-6 w-6" />
                    <h3 className="text-2xl font-bold text-center">
                      Total Estimated Cost
                    </h3>
                  </div>
                  <p className="text-5xl font-bold text-center text-primary mb-2">
                    ${totalCost.toLocaleString()}
                  </p>
                  <p className="text-center text-sm text-gray-500">
                    Based on {form.getValues().squareFootage.toLocaleString()} sq ft {regions.find(r => r.value === form.getValues().region)?.label} {form.getValues().buildingType.toLowerCase()} building
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BarChart3 className="text-primary mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium">Cost Breakdown</h4>
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
                      <PieChartIcon className="text-primary mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium">Cost Distribution</h4>
                    </div>
                    <div className="h-80 border rounded-md p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="cost"
                            nameKey="category"
                            label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {costBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 200}, 70%, 50%)`} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex items-center">
                    <BarChart3 className="text-primary mr-2 h-5 w-5" />
                    <h4 className="text-lg font-medium">Cost Comparison</h4>
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
                        <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Cost']} />
                        <Legend />
                        <Bar dataKey="cost" fill="hsl(220, 70%, 50%)">
                          {costBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(${index * 45 + 200}, 70%, 50%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
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
        <CardFooter className="flex justify-between border-t pt-4">
          <div>
            <p className="text-sm text-gray-500">Regional Multiplier: {regionalMultiplier.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Total Estimated Cost: ${totalCost.toLocaleString()}</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BCBSCostCalculator;