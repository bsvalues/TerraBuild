import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import ARViewer from '@/components/ar/ARViewer';
import { useToast } from '@/hooks/use-toast';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import { Glasses } from 'lucide-react';

// Define the form schema for building data
const buildingSchema = z.object({
  region: z.string().min(1, 'Region is required'),
  buildingType: z.string().min(1, 'Building type is required'),
  squareFootage: z.coerce.number().min(1, 'Square footage must be at least 1'),
  yearBuilt: z.coerce.number().min(1800, 'Year built must be at least 1800').max(new Date().getFullYear(), `Year built cannot be later than ${new Date().getFullYear()}`),
  condition: z.string().min(1, 'Condition is required'),
  conditionFactor: z.coerce.number().min(0, 'Condition factor must be at least 0').max(1, 'Condition factor must be at most 1'),
  complexityFactor: z.coerce.number().min(0, 'Complexity factor must be at least 0').max(1, 'Complexity factor must be at most 1')
});

type BuildingFormValues = z.infer<typeof buildingSchema>;

interface BuildingCostCalculationResult {
  baseCost: number;
  adjustedCost?: number;
  totalCost: number;
  regionalFactor?: number;
  buildingTypeFactor?: number;
  complexityAdjustment?: number;
  conditionAdjustment?: number;
  depreciationAdjustment?: number;
  depreciationRate?: number;
  materialCosts?: { [key: string]: number };
  breakdown?: { [key: string]: number };
  error?: string;
}

const ARVisualizationPage = () => {
  const [calculationResult, setCalculationResult] = useState<BuildingCostCalculationResult | undefined>(undefined);
  const { toast } = useToast();
  
  // Initialize the form with default values
  const form = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingSchema),
    defaultValues: {
      region: 'Benton',
      buildingType: 'Residential',
      squareFootage: 2000,
      yearBuilt: 2000,
      condition: 'Good',
      conditionFactor: 0.8,
      complexityFactor: 0.6
    }
  });
  
  // Mock calculation function - in a real app, this would call your API
  const calculateCost = async (data: BuildingFormValues) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate a mock cost based on the input data
    const baseCost = data.squareFootage * 150; // $150 per sq ft baseline
    const age = new Date().getFullYear() - data.yearBuilt;
    const depreciationRate = Math.min(age * 0.01, 0.7); // 1% per year up to 70%
    const depreciationAdjustment = baseCost * depreciationRate * -1;
    const regionalFactor = data.region === 'Benton' ? 1.0 : (data.region === 'Rural' ? 0.8 : 1.2);
    const buildingTypeFactor = 
      data.buildingType === 'Residential' ? 1.0 : 
      data.buildingType === 'Commercial' ? 1.3 : 
      data.buildingType === 'Industrial' ? 1.5 : 0.9; // 0.9 for Agricultural
    const complexityAdjustment = baseCost * (data.complexityFactor - 0.5) * 0.2;
    const conditionAdjustment = baseCost * (data.conditionFactor - 0.5) * 0.3;
    
    // Calculate total cost with all adjustments
    const totalCost = Math.max(
      baseCost + 
      (baseCost * (regionalFactor - 1)) + 
      (baseCost * (buildingTypeFactor - 1)) + 
      complexityAdjustment + 
      conditionAdjustment + 
      depreciationAdjustment,
      0 // Ensure cost doesn't go below zero
    );
    
    // Create a breakdown of costs by material category
    const materialCosts = {
      'Foundation': totalCost * 0.15,
      'Framing': totalCost * 0.20,
      'Roofing': totalCost * 0.10,
      'Electrical': totalCost * 0.15,
      'Plumbing': totalCost * 0.12,
      'HVAC': totalCost * 0.08,
      'Finishes': totalCost * 0.20
    };
    
    // Set the calculation result
    setCalculationResult({
      baseCost,
      totalCost,
      regionalFactor,
      buildingTypeFactor,
      complexityAdjustment,
      conditionAdjustment,
      depreciationAdjustment,
      depreciationRate,
      materialCosts
    });
    
    toast({
      title: "Calculation Complete",
      description: "Building cost has been calculated. You can now view it in AR.",
    });
  };
  
  const onSubmit = async (data: BuildingFormValues) => {
    try {
      await calculateCost(data);
    } catch (error) {
      console.error('Error calculating building cost:', error);
      toast({
        title: "Calculation Failed",
        description: "There was an error calculating the building cost.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="w-full">
      {/* Main content without redundant heading */}
      
      <Tabs defaultValue="input" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="input">Building Data Input</TabsTrigger>
          <TabsTrigger value="visualization" disabled={!calculationResult}>AR Visualization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Building Information</CardTitle>
              <CardDescription>
                Enter the building details to calculate cost and visualize in AR
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              <SelectItem value="Benton">Benton County</SelectItem>
                              <SelectItem value="Urban">Urban Area</SelectItem>
                              <SelectItem value="Rural">Rural Area</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The region where the building is located
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
                              <SelectTrigger>
                                <SelectValue placeholder="Select building type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Residential">Residential</SelectItem>
                              <SelectItem value="Commercial">Commercial</SelectItem>
                              <SelectItem value="Industrial">Industrial</SelectItem>
                              <SelectItem value="Agricultural">Agricultural</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The type of building to visualize
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                    
                    <FormField
                      control={form.control}
                      name="yearBuilt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year Built</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1800" 
                              max={new Date().getFullYear()} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            The year the building was constructed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Building Condition</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Update condition factor based on condition
                              const conditionValues = {
                                'Excellent': 1.0,
                                'Good': 0.8,
                                'Fair': 0.6,
                                'Poor': 0.4,
                                'Very Poor': 0.2
                              };
                              form.setValue('conditionFactor', conditionValues[value as keyof typeof conditionValues]);
                            }} 
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
                              <SelectItem value="Fair">Fair</SelectItem>
                              <SelectItem value="Poor">Poor</SelectItem>
                              <SelectItem value="Very Poor">Very Poor</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            The overall condition of the building
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="conditionFactor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition Factor: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.1}
                              defaultValue={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            How the condition affects the cost (0 = very poor, 1 = excellent)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="complexityFactor"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel>Complexity Factor: {field.value}</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={1}
                              step={0.1}
                              defaultValue={[field.value]}
                              onValueChange={(values) => field.onChange(values[0])}
                            />
                          </FormControl>
                          <FormDescription>
                            Building complexity (0 = simple, 1 = complex)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Calculate Cost and Prepare AR
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visualization" className="mt-6">
          {calculationResult ? (
            <ARViewer 
              buildingData={form.getValues()} 
              calculationResult={calculationResult} 
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">
                  Please calculate building cost first to enable AR visualization
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {calculationResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Building Cost Calculation Results</CardTitle>
            <CardDescription>
              Detailed breakdown of the estimated building costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Summary</h3>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Base Cost:</span>
                    <span className="font-medium">${calculationResult.baseCost.toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Regional Adjustment:</span>
                    <span className="font-medium">${((calculationResult.baseCost * (calculationResult.regionalFactor! - 1))).toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Building Type Adjustment:</span>
                    <span className="font-medium">${((calculationResult.baseCost * (calculationResult.buildingTypeFactor! - 1))).toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Complexity Adjustment:</span>
                    <span className="font-medium">${calculationResult.complexityAdjustment!.toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Condition Adjustment:</span>
                    <span className="font-medium">${calculationResult.conditionAdjustment!.toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Depreciation Adjustment:</span>
                    <span className="font-medium">${calculationResult.depreciationAdjustment!.toLocaleString()}</span>
                  </li>
                  <li className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-bold">Total Cost:</span>
                    <span className="font-bold text-lg">${calculationResult.totalCost.toLocaleString()}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Material Cost Breakdown</h3>
                <ul className="space-y-2">
                  {calculationResult.materialCosts && Object.entries(calculationResult.materialCosts).map(([material, cost]) => (
                    <li key={material} className="flex justify-between">
                      <span>{material}:</span>
                      <span className="font-medium">${cost.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-500">
              Note: This is a simplified cost estimation. Actual building costs may vary based on additional factors not included in this calculation.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

// Define it as a function that returns a JSX.Element to match the type expected by the router
function ARVisualizationPageWrapper(): JSX.Element {
  return (
    <LayoutWrapper>
      <MainContent title="AR Visualization">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold flex items-center">
            <Glasses className="mr-2 h-6 w-6 text-primary" />
            AR Building Visualization
          </h1>
          <p className="text-muted-foreground">
            Visualize buildings in augmented reality based on cost calculations
          </p>
        </div>
        <ARVisualizationPage />
      </MainContent>
    </LayoutWrapper>
  );
}

export default ARVisualizationPageWrapper;