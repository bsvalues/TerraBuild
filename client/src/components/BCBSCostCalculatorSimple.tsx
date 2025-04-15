import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, DollarSign, Building, Home } from 'lucide-react';

// Form schema for calculator
const calculatorSchema = z.object({
  squareFootage: z.coerce.number()
    .min(1, "Square footage must be greater than 0")
    .optional()
    .default(1000),
  buildingType: z.string().min(1, "Building type is required"),
  quality: z.string().min(1, "Quality level is required"),
  region: z.string().min(1, "Region is required"),
  buildingAge: z.coerce.number().min(0, "Building age cannot be negative").default(0),
    
  // Arkansas-specific fields for non-building property assessment
  // Vehicle fields
  vehicleValue: z.coerce.number().min(0, "Vehicle value cannot be negative").optional().default(0),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number().min(1900, "Vehicle year must be after 1900").optional(),
    
  // Boat fields
  boatValue: z.coerce.number().min(0, "Boat value cannot be negative").optional().default(0),
  boatLength: z.coerce.number().min(0, "Boat length cannot be negative").optional(),
  boatType: z.string().optional(),
    
  // Business personal property fields
  businessPropertyValue: z.coerce.number().min(0, "Business property value cannot be negative").optional().default(0),
  businessPropertyType: z.string().optional(),
  businessPropertyCategory: z.string().optional(),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

const BCBSCostCalculatorSimple = () => {
  // Default form values
  const defaultValues: Partial<CalculatorFormValues> = {
    squareFootage: 1000,
    buildingType: "RESIDENTIAL",
    quality: "STANDARD",
    region: "RICHLAND", // Default to Richland, Benton County
    buildingAge: 0,
  };

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues,
  });
  
  // Watch buildingType to conditionally show fields
  const watchBuildingType = form.watch("buildingType");

  // Building types and quality levels for Benton County and Arkansas assessment
  const buildingTypes = [
    { value: "RESIDENTIAL", label: "Residential" },
    { value: "COMMERCIAL", label: "Commercial" },
    { value: "INDUSTRIAL", label: "Industrial" },
    { value: "AGRICULTURAL", label: "Agricultural" },
    { value: "VEHICLE", label: "Vehicle" },
    { value: "BOAT", label: "Boat/Marine" },
    { value: "BUSINESS_PROPERTY", label: "Business Personal Property" },
  ];

  const qualityLevels = [
    { value: "STANDARD", label: "Standard" },
    { value: "PREMIUM", label: "Premium" },
    { value: "LUXURY", label: "Luxury" },
    { value: "ECONOMY", label: "Economy" },
    { value: "CUSTOM", label: "Custom" },
  ];

  // Benton County and Arkansas specific regions
  const regions = [
    // Benton County, Washington regions
    { value: "RICHLAND", label: "Richland" },
    { value: "KENNEWICK", label: "Kennewick" },
    { value: "PASCO", label: "Pasco" },
    { value: "WEST_RICHLAND", label: "West Richland" },
    { value: "BENTON_CITY", label: "Benton City" },
    { value: "PROSSER", label: "Prosser" },
    { value: "OTHER_BENTON", label: "Other Benton County" },
    // Arkansas regions
    { value: "LITTLE_ROCK", label: "Little Rock, AR" },
    { value: "FAYETTEVILLE", label: "Fayetteville, AR" },
    { value: "JONESBORO", label: "Jonesboro, AR" },
    { value: "OTHER_ARKANSAS", label: "Other Arkansas" },
  ];

  // Submit form handler - just log values
  const onSubmit = (data: CalculatorFormValues) => {
    console.log("Form submitted with values:", data);
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Building Cost Calculator</CardTitle>
          <CardDescription>
            Calculate accurate building costs based on project specifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-4 rounded-lg mb-6 flex items-center text-sm">
            <AlertCircle className="mr-2 h-4 w-4" />
            <p>Enter building specifications to get an accurate cost estimate.</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-white p-4 border rounded-lg shadow-sm">
                <h3 className="text-md font-medium mb-3 flex items-center">
                  <Home className="h-4 w-4 mr-2" />
                  Building Specifications
                </h3>
                <div className="space-y-4">
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
                            {buildingTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the type of building or property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Show square footage for building types only */}
                  {(watchBuildingType === 'RESIDENTIAL' || 
                    watchBuildingType === 'COMMERCIAL' || 
                    watchBuildingType === 'INDUSTRIAL' || 
                    watchBuildingType === 'AGRICULTURAL') && (
                    <FormField
                      control={form.control}
                      name="squareFootage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Square Footage</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the total square footage of the building
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {/* Show vehicle fields */}
                  {watchBuildingType === 'VEHICLE' && (
                    <>
                      <FormField
                        control={form.control}
                        name="vehicleValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vehicle Value ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the current market value of the vehicle
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="vehicleMake"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Make</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* Show boat fields */}
                  {watchBuildingType === 'BOAT' && (
                    <>
                      <FormField
                        control={form.control}
                        name="boatValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Boat Value ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the current market value of the boat
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="boatLength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Length (ft)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* Show business property fields */}
                  {watchBuildingType === 'BUSINESS_PROPERTY' && (
                    <>
                      <FormField
                        control={form.control}
                        name="businessPropertyValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Value ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the current market value of the business property
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button type="submit" className="gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Calculate Cost</span>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BCBSCostCalculatorSimple;