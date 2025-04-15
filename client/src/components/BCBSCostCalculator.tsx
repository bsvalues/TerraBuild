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
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector, Treemap } from 'recharts';
import { AlertCircle, Info, Building, Home, Trash2, DollarSign, BarChart3, PieChart as PieChartIcon, Copy, ArrowRightLeft, Save, ArrowLeftRight, Blocks, Clock, FileText, Printer, PlayCircle, BrainCircuit, Share2 } from 'lucide-react';
import CostImpactAnimation from './CostImpactAnimation';
import ExportPdfDialog from './ExportPdfDialog';
import ExportExcelDialog from './ExportExcelDialog';
import PrintDialog from './PrintDialog';
import QuickExportButton from './QuickExportButton';
import { PredictiveCostAnalysis } from './PredictiveCostAnalysis';
import { MaterialSubstitutionEngine } from './MaterialSubstitutionEngine';
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Form schema for calculator
const calculatorSchema = z.object({
  squareFootage: z.coerce.number()
    .min(1, "Square footage must be greater than 0")
    .optional()
    .default(1000),
  buildingType: z.string().min(1, "Building type is required"),
  quality: z.string().min(1, "Quality level is required"),
  complexityFactor: z.coerce.number().min(0.5).max(2.0).default(1.0),
  conditionFactor: z.coerce.number().min(0.5).max(1.5).default(1.0),
  region: z.string().min(1, "Region is required"),
  buildingAge: z.coerce.number()
    .min(0, "Building age cannot be negative")
    .refine(
      (age) => {
        // Zero age (new building) is always valid
        return age >= 0;
      },
      {
        message: "Building age cannot be negative"
      }
    )
    .default(0),
    
  // Arkansas-specific fields for non-building property assessment
  // Vehicle fields
  vehicleValue: z.coerce.number()
    .min(0, "Vehicle value cannot be negative")
    .optional()
    .default(0),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleYear: z.coerce.number()
    .min(1900, "Vehicle year must be after 1900")
    .max(new Date().getFullYear() + 1, "Vehicle year cannot be in the future")
    .optional(),
    
  // Boat fields
  boatValue: z.coerce.number()
    .min(0, "Boat value cannot be negative")
    .optional()
    .default(0),
  boatLength: z.coerce.number()
    .min(0, "Boat length cannot be negative")
    .optional(),
  boatType: z.string().optional(),
    
  // Business personal property fields
  businessPropertyValue: z.coerce.number()
    .min(0, "Business property value cannot be negative")
    .optional()
    .default(0),
  businessPropertyType: z.string().optional(),
  businessPropertyCategory: z.string().optional(),
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

interface Scenario {
  id: string;
  name: string;
  description?: string;
  formValues: CalculatorFormValues;
  materials: Material[];
  totalCost: number;
  costBreakdown: CostBreakdown[];
}

const BCBSCostCalculator = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([]);
  const [regionalMultiplier, setRegionalMultiplier] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<string>("calculator");
  const [hoveredCostItem, setHoveredCostItem] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [treemapData, setTreemapData] = useState<any[]>([]);
  
  // What-If Scenario States
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [scenarioComparison, setScenarioComparison] = useState<{
    baseline: Scenario | null;
    comparison: Scenario | null;
  }>({ baseline: null, comparison: null });

  // Default form values for Benton County assessment
  const defaultValues: Partial<CalculatorFormValues> = {
    squareFootage: 1000,
    buildingType: "RESIDENTIAL",
    quality: "STANDARD",
    complexityFactor: 1.0,
    conditionFactor: 1.0,
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
    // General regions (for comparison)
    { value: "NORTHEAST", label: "Northeast US" },
    { value: "MIDWEST", label: "Midwest US" },
    { value: "SOUTH", label: "South US" },
    { value: "WEST", label: "West US" },
    // Arkansas regions
    { value: "LITTLE_ROCK", label: "Little Rock, AR" },
    { value: "FAYETTEVILLE", label: "Fayetteville, AR" },
    { value: "JONESBORO", label: "Jonesboro, AR" },
    { value: "OTHER_ARKANSAS", label: "Other Arkansas" },
  ];

  // Get regional multiplier based on region
  const getRegionalMultiplier = (region: string): number => {
    // Multipliers based on Benton County and Arkansas assessment data
    const multipliers: Record<string, number> = {
      // Washington - Benton County regions
      'RICHLAND': 1.05,
      'KENNEWICK': 1.02,
      'PASCO': 1.0,
      'WEST_RICHLAND': 1.07,
      'BENTON_CITY': 0.95,
      'PROSSER': 0.93,
      'OTHER_BENTON': 0.98,
      
      // General US regions (for comparison purposes)
      'NORTHEAST': 1.15,
      'MIDWEST': 1.0,
      'SOUTH': 0.92,
      'WEST': 1.25,
      
      // Arkansas regions
      'LITTLE_ROCK': 0.97,
      'FAYETTEVILLE': 1.03,
      'JONESBORO': 0.91,
      'OTHER_ARKANSAS': 0.89
    };
    
    return multipliers[region] || 1.0;
  };

  // Base cost per square foot lookup with Arkansas and Benton County values
  const getBaseCostPerSqFt = (buildingType: string, quality: string): number => {
    const baseCosts: Record<string, Record<string, number>> = {
      'RESIDENTIAL': { 
        'ECONOMY': 95, 
        'STANDARD': 125, 
        'PREMIUM': 175, 
        'LUXURY': 250, 
        'CUSTOM': 300 
      },
      'COMMERCIAL': { 
        'ECONOMY': 110, 
        'STANDARD': 150, 
        'PREMIUM': 200, 
        'LUXURY': 300,
        'CUSTOM': 350 
      },
      'INDUSTRIAL': { 
        'ECONOMY': 80, 
        'STANDARD': 100, 
        'PREMIUM': 150, 
        'LUXURY': 225,
        'CUSTOM': 275 
      },
      'AGRICULTURAL': { 
        'ECONOMY': 60, 
        'STANDARD': 85, 
        'PREMIUM': 120, 
        'LUXURY': 180,
        'CUSTOM': 220 
      },
      // For non-building property types, we use a different approach:
      // These are priced per unit value, not per square foot
      'VEHICLE': { 
        'ECONOMY': 25,  // Value per $1000 of assessed value
        'STANDARD': 35, 
        'PREMIUM': 45, 
        'LUXURY': 60,
        'CUSTOM': 75 
      },
      'BOAT': { 
        'ECONOMY': 30,  // Value per $1000 of assessed value
        'STANDARD': 40, 
        'PREMIUM': 55, 
        'LUXURY': 70,
        'CUSTOM': 85 
      },
      'BUSINESS_PROPERTY': { 
        'ECONOMY': 20,  // Value per $1000 of assessed value
        'STANDARD': 30, 
        'PREMIUM': 40, 
        'LUXURY': 50,
        'CUSTOM': 60 
      }
    };
    
    // Return the base cost or a reasonable default if not found
    return baseCosts[buildingType]?.[quality] || 150;
  };
  
  // Calculate depreciation factor based on building age and type
  const calculateAgeDepreciation = (buildingAge: number, buildingType: string): number => {
    // No depreciation for new buildings
    if (buildingAge === 0) {
      return 1.0;
    }
    
    // Configure depreciation rates by building type based on Arkansas/Benton County standards
    // Arkansas uses different depreciation schedules for different property types
    const annualDepreciationRates: Record<string, number> = {
      'RESIDENTIAL': 0.01333, // 1.333% per year (80% over 15 years)
      'COMMERCIAL': 0.01,     // 1% per year (80% over 20 years)
      'INDUSTRIAL': 0.00889,  // 0.889% per year (80% over 25 years)
      'AGRICULTURAL': 0.0125, // 1.25% per year
      'VEHICLE': 0.15,        // 15% per year for vehicles
      'BOAT': 0.10,           // 10% per year for boats
      'BUSINESS_PROPERTY': 0.10 // 10% per year for business personal property
    };
    
    // Configure minimum depreciation values (maximum age effect)
    // These ensure properties retain a minimum value even at maximum age
    const minimumDepreciationValues: Record<string, number> = {
      'RESIDENTIAL': 0.3,   // Residential buildings retain at least 30% of value
      'COMMERCIAL': 0.25,   // Commercial buildings retain at least 25% of value
      'INDUSTRIAL': 0.2,    // Industrial buildings retain at least 20% of value
      'AGRICULTURAL': 0.15, // Agricultural buildings retain at least 15% of value
      'VEHICLE': 0.1,       // Vehicles retain at least 10% of value
      'BOAT': 0.15,         // Boats retain at least 15% of value
      'BUSINESS_PROPERTY': 0.1 // Business property retains at least 10% of value
    };
    
    // Maximum age considerations (Arkansas considers properties fully depreciated after these ages)
    const maximumAgeYears: Record<string, number> = {
      'RESIDENTIAL': 60,
      'COMMERCIAL': 75,
      'INDUSTRIAL': 90,
      'AGRICULTURAL': 68,
      'VEHICLE': 15,
      'BOAT': 20,
      'BUSINESS_PROPERTY': 10
    };
    
    // Cap the building age at the maximum for this property type
    const maxAge = maximumAgeYears[buildingType] || maximumAgeYears['RESIDENTIAL'];
    const cappedAge = Math.min(buildingAge, maxAge);
    
    // Get depreciation rate for building type (default to residential if not found)
    const annualRate = annualDepreciationRates[buildingType] || annualDepreciationRates['RESIDENTIAL'];
    
    // Calculate depreciation factor
    const calculatedDepreciation = 1.0 - (cappedAge * annualRate);
    
    // Apply minimum value
    const minimumValue = minimumDepreciationValues[buildingType] || minimumDepreciationValues['RESIDENTIAL'];
    
    // Return the larger of the calculated value or the minimum value
    return Math.max(calculatedDepreciation, minimumValue);
  };
  
  // Get the current depreciation percentage for display
  const getDepreciationPercentage = (buildingAge: number, buildingType: string): number => {
    if (buildingAge === 0) return 0;
    
    const depreciationFactor = calculateAgeDepreciation(buildingAge, buildingType);
    return Math.round((1 - depreciationFactor) * 100);
  };
  
  // Get a color representation of the depreciation severity
  const getDepreciationColor = (percentage: number): string => {
    if (percentage < 15) return "#3CAB36"; // Low depreciation (green)
    if (percentage < 40) return "#F5A623"; // Medium depreciation (amber)
    return "#E53935";                      // High depreciation (red)
  };

  // Calculate total cost based on form values and materials
  const calculateTotalCost = (data: CalculatorFormValues, materials: Material[]): {
    totalCost: number;
    breakdown: CostBreakdown[];
    regionalMultiplier: number;
  } => {
    const multiplier = getRegionalMultiplier(data.region);
    let baseCost = 0;
    let adjustedCost = 0;
    let depreciatedCost = 0;
    const breakdown: CostBreakdown[] = [];
    
    // Handle different calculation methods based on property type
    if (data.buildingType === 'VEHICLE') {
      // For vehicles, we calculate based on value, not square footage
      const vehicleValue = data.vehicleValue || 0;
      
      // Get base rate per $1000 of value based on quality
      const baseRatePerThousand = getBaseCostPerSqFt(data.buildingType, data.quality);
      
      // Calculate base assessment cost
      baseCost = (vehicleValue / 1000) * baseRatePerThousand;
      
      // Apply regional and condition factors
      adjustedCost = baseCost * multiplier * data.conditionFactor;
      
      // Apply age depreciation
      const ageDepreciationFactor = calculateAgeDepreciation(data.buildingAge, data.buildingType);
      depreciatedCost = adjustedCost * ageDepreciationFactor;
      
      // Generate cost breakdown specific to vehicles
      breakdown.push({ category: 'Base Assessment', cost: baseCost });
      breakdown.push({ category: 'Condition Adjustment', cost: baseCost * (data.conditionFactor - 1) });
      breakdown.push({ category: 'Regional Adjustment', cost: (baseCost * data.conditionFactor * multiplier) - (baseCost * data.conditionFactor) });
      breakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
    } 
    else if (data.buildingType === 'BOAT') {
      // For boats, we calculate based on value, not square footage
      const boatValue = data.boatValue || 0;
      
      // Get base rate per $1000 of value based on quality
      const baseRatePerThousand = getBaseCostPerSqFt(data.buildingType, data.quality);
      
      // Calculate base assessment cost
      baseCost = (boatValue / 1000) * baseRatePerThousand;
      
      // Apply regional and condition factors
      adjustedCost = baseCost * multiplier * data.conditionFactor;
      
      // Apply age depreciation
      const ageDepreciationFactor = calculateAgeDepreciation(data.buildingAge, data.buildingType);
      depreciatedCost = adjustedCost * ageDepreciationFactor;
      
      // Generate cost breakdown specific to boats
      breakdown.push({ category: 'Base Assessment', cost: baseCost });
      breakdown.push({ category: 'Condition Adjustment', cost: baseCost * (data.conditionFactor - 1) });
      breakdown.push({ category: 'Regional Adjustment', cost: (baseCost * data.conditionFactor * multiplier) - (baseCost * data.conditionFactor) });
      breakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
    }
    else if (data.buildingType === 'BUSINESS_PROPERTY') {
      // For business property, we calculate based on value, not square footage
      const businessPropertyValue = data.businessPropertyValue || 0;
      
      // Get base rate per $1000 of value based on quality
      const baseRatePerThousand = getBaseCostPerSqFt(data.buildingType, data.quality);
      
      // Calculate base assessment cost
      baseCost = (businessPropertyValue / 1000) * baseRatePerThousand;
      
      // Apply regional and condition factors
      adjustedCost = baseCost * multiplier * data.conditionFactor;
      
      // Apply age depreciation
      const ageDepreciationFactor = calculateAgeDepreciation(data.buildingAge, data.buildingType);
      depreciatedCost = adjustedCost * ageDepreciationFactor;
      
      // Generate cost breakdown specific to business property
      breakdown.push({ category: 'Base Assessment', cost: baseCost });
      breakdown.push({ category: 'Condition Adjustment', cost: baseCost * (data.conditionFactor - 1) });
      breakdown.push({ category: 'Regional Adjustment', cost: (baseCost * data.conditionFactor * multiplier) - (baseCost * data.conditionFactor) });
      breakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
    }
    else {
      // Standard building calculation based on square footage
      const baseCostPerSqFt = getBaseCostPerSqFt(data.buildingType, data.quality);
      baseCost = (data.squareFootage || 0) * baseCostPerSqFt;
      
      // Apply factors
      adjustedCost = baseCost;
      adjustedCost *= data.complexityFactor;
      adjustedCost *= data.conditionFactor;
      adjustedCost *= multiplier;
      
      // Calculate age depreciation
      const ageDepreciationFactor = calculateAgeDepreciation(data.buildingAge, data.buildingType);
      
      // Apply age depreciation to adjusted cost
      depreciatedCost = adjustedCost * ageDepreciationFactor;
      
      // Generate cost breakdown for buildings
      breakdown.push({ category: 'Base Cost', cost: baseCost });
      breakdown.push({ category: 'Complexity Adjustment', cost: baseCost * (data.complexityFactor - 1) });
      breakdown.push({ category: 'Condition Adjustment', cost: baseCost * data.complexityFactor * (data.conditionFactor - 1) });
      breakdown.push({ category: 'Regional Adjustment', cost: adjustedCost - (baseCost * data.complexityFactor * data.conditionFactor) });
      breakdown.push({ category: 'Age Depreciation', cost: adjustedCost - depreciatedCost });
    }
    
    // Calculate material costs (common to all property types)
    const materialCost = materials.reduce((total, material) => {
      return total + (material.quantity * material.unitPrice);
    }, 0);
    
    // Add materials to cost breakdown
    breakdown.push({ category: 'Materials', cost: materialCost });
    
    return {
      totalCost: depreciatedCost + materialCost,
      breakdown,
      regionalMultiplier: multiplier
    };
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
  
  // Prepare data for the interactive cost breakdown treemap visualization
  const prepareTreemapData = () => {
    // Skip if no cost breakdown data is available
    if (!costBreakdown || costBreakdown.length === 0) return [];
    
    const buildingType = form.getValues().buildingType;
    const buildingAge = form.getValues().buildingAge;
    const deprecationPercentage = getDepreciationPercentage(buildingAge, buildingType);
    const depreciationColor = getDepreciationColor(deprecationPercentage);
    
    // Create enhanced label for Age Depreciation with visual indicators
    const ageDepreciationName = buildingAge > 0 
      ? `Age Depreciation (${deprecationPercentage}% Loss)` 
      : 'Age Depreciation';
    
    // Create the materials sub-items if any are available
    const materialsCost = costBreakdown.find(c => c.category === 'Materials')?.cost || 0;
    const materialsChildren = materials.length > 0 
      ? materials.map(m => ({
          name: m.name || 'Unnamed Material',
          size: m.quantity * m.unitPrice,
          color: '#3CAB36'
        }))
      : [{ name: 'Materials Total', size: materialsCost, color: '#3CAB36' }];
    
    // Different visualization structure based on property type
    if (buildingType === 'VEHICLE' || buildingType === 'BOAT' || buildingType === 'BUSINESS_PROPERTY') {
      // For non-building property types
      const baseAssessment = costBreakdown.find(c => c.category === 'Base Assessment')?.cost || 0;
      const conditionAdjustment = costBreakdown.find(c => c.category === 'Condition Adjustment')?.cost || 0;
      const regionalAdjustment = costBreakdown.find(c => c.category === 'Regional Adjustment')?.cost || 0;
      const ageDepreciation = costBreakdown.find(c => c.category === 'Age Depreciation')?.cost || 0;
      
      // Get property type name for display
      const propertyTypeName = buildingType === 'VEHICLE' 
        ? 'Vehicle' 
        : (buildingType === 'BOAT' ? 'Boat' : 'Business Property');
      
      return [
        {
          name: 'Total Assessment',
          children: [
            {
              name: `${propertyTypeName} Assessment`,
              children: [
                { name: 'Base Assessment', size: baseAssessment, color: '#243E4D' },
                { name: 'Condition Adjustment', size: conditionAdjustment, color: '#243E4D' },
                { name: 'Regional Adjustment', size: regionalAdjustment, color: '#243E4D' },
                { 
                  name: ageDepreciationName, 
                  size: ageDepreciation, 
                  color: depreciationColor,
                  special: 'age-depreciation',
                  percentage: deprecationPercentage,
                  buildingAge: buildingAge,
                  pattern: buildingAge > 0 ? "diagonal-stripes" : undefined
                },
              ]
            },
            {
              name: 'Materials',
              children: materialsChildren
            }
          ]
        }
      ];
    } else {
      // For standard building types
      const baseCost = costBreakdown.find(c => c.category === 'Base Cost')?.cost || 0;
      const complexityAdjustment = costBreakdown.find(c => c.category === 'Complexity Adjustment')?.cost || 0;
      const conditionAdjustment = costBreakdown.find(c => c.category === 'Condition Adjustment')?.cost || 0;
      const regionalAdjustment = costBreakdown.find(c => c.category === 'Regional Adjustment')?.cost || 0;
      const ageDepreciation = costBreakdown.find(c => c.category === 'Age Depreciation')?.cost || 0;
      
      return [
        {
          name: 'Total Cost',
          children: [
            {
              name: 'Building Costs',
              children: [
                { name: 'Base Cost', size: baseCost, color: '#243E4D' },
                { name: 'Complexity Adjustment', size: complexityAdjustment, color: '#243E4D' },
                { name: 'Condition Adjustment', size: conditionAdjustment, color: '#243E4D' },
                { name: 'Regional Adjustment', size: regionalAdjustment, color: '#243E4D' },
                { 
                  name: ageDepreciationName, 
                  size: ageDepreciation, 
                  color: depreciationColor,
                  special: 'age-depreciation',
                  percentage: deprecationPercentage,
                  buildingAge: buildingAge,
                  pattern: buildingAge > 0 ? "diagonal-stripes" : undefined
                },
              ]
            },
            {
              name: 'Materials',
              children: materialsChildren
            }
          ]
        }
      ];
    }
  };

  // Save the current calculation as a scenario
  const saveAsScenario = (name: string, description?: string) => {
    const formValues = form.getValues();
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name,
      description,
      formValues,
      materials: [...materials],
      totalCost,
      costBreakdown: [...costBreakdown]
    };
    
    setScenarios([...scenarios, newScenario]);
    setCurrentScenario(newScenario);
    setShowScenarioModal(false);
  };
  
  // Load a scenario
  const loadScenario = (scenario: Scenario) => {
    // Reset form with scenario values
    form.reset(scenario.formValues);
    
    // Set materials
    setMaterials([...scenario.materials]);
    
    // Set cost data
    setTotalCost(scenario.totalCost);
    setCostBreakdown([...scenario.costBreakdown]);
    
    // Generate new timeline
    const timeline = generateTimelineData(scenario.totalCost);
    setTimelineData(timeline);
    
    setCurrentScenario(scenario);
  };
  
  // Delete a scenario
  const deleteScenario = (scenarioId: string) => {
    const updatedScenarios = scenarios.filter(s => s.id !== scenarioId);
    setScenarios(updatedScenarios);
    
    // If the current scenario was deleted, set current to null
    if (currentScenario && currentScenario.id === scenarioId) {
      setCurrentScenario(null);
    }
    
    // If the scenario was in comparison, remove it
    if (scenarioComparison.baseline?.id === scenarioId) {
      setScenarioComparison({...scenarioComparison, baseline: null});
    }
    if (scenarioComparison.comparison?.id === scenarioId) {
      setScenarioComparison({...scenarioComparison, comparison: null});
    }
  };
  
  // Set scenarios for comparison
  const setComparisonScenarios = (type: 'baseline' | 'comparison', scenario: Scenario | null) => {
    setScenarioComparison({
      ...scenarioComparison,
      [type]: scenario
    });
  };
  
  // Calculate the difference between two scenarios
  const calculateScenarioDifference = () => {
    if (!scenarioComparison.baseline || !scenarioComparison.comparison) {
      return null;
    }
    
    const baseline = scenarioComparison.baseline;
    const comparison = scenarioComparison.comparison;
    
    const costDifference = comparison.totalCost - baseline.totalCost;
    const percentDifference = (costDifference / baseline.totalCost) * 100;
    
    return {
      costDifference,
      percentDifference,
      isIncrease: costDifference > 0
    };
  };

  // Submit form handler
  const onSubmit = (data: CalculatorFormValues) => {
    const result = calculateTotalCost(data, materials);
    setTotalCost(result.totalCost);
    setCostBreakdown(result.breakdown);
    setRegionalMultiplier(result.regionalMultiplier);
    
    // Generate timeline data when form is submitted
    const timeline = generateTimelineData(result.totalCost);
    setTimelineData(timeline);
    
    // Generate treemap data for cost breakdown visualization
    const treemap = prepareTreemapData();
    setTreemapData(treemap);
    
    // Set active tab to results when form is submitted
    setActiveTab("results");
  };

  // Update cost when form values or materials change
  useEffect(() => {
    if (form.formState.isValid) {
      const data = form.getValues();
      const result = calculateTotalCost(data, materials);
      setTotalCost(result.totalCost);
      setCostBreakdown(result.breakdown);
      setRegionalMultiplier(result.regionalMultiplier);
      
      // Generate timeline data when cost changes
      if (result.totalCost > 0) {
        const timeline = generateTimelineData(result.totalCost);
        setTimelineData(timeline);
        
        // Generate treemap data for cost breakdown visualization
        const treemap = prepareTreemapData();
        setTreemapData(treemap);
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
            <TabsList className="grid w-full grid-cols-4 bg-[#e6eef2]">
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
              <TabsTrigger 
                value="scenarios" 
                className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white"
                disabled={scenarios.length === 0}
              >
                Scenarios {scenarios.length > 0 && `(${scenarios.length})`}
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
                                  <Input type="number" {...field} className="border-gray-200" />
                                </FormControl>
                                <FormDescription>
                                  Enter the total square footage of the building
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        {/* Show vehicle value field for vehicle type */}
                        {watchBuildingType === 'VEHICLE' && (
                          <>
                            <FormField
                              control={form.control}
                              name="vehicleValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Vehicle Value ($)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} className="border-gray-200" />
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
                                    <Input {...field} className="border-gray-200" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vehicleModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Model</FormLabel>
                                  <FormControl>
                                    <Input {...field} className="border-gray-200" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="vehicleYear"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Year</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} className="border-gray-200" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        
                        {/* Show boat value field for boat type */}
                        {watchBuildingType === 'BOAT' && (
                          <>
                            <FormField
                              control={form.control}
                              name="boatValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Boat Value ($)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} className="border-gray-200" />
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
                                    <Input type="number" {...field} className="border-gray-200" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="boatType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Boat Type</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200">
                                        <SelectValue placeholder="Select boat type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="POWER">Power Boat</SelectItem>
                                      <SelectItem value="SAIL">Sail Boat</SelectItem>
                                      <SelectItem value="PWC">Personal Watercraft</SelectItem>
                                      <SelectItem value="HOUSE">House Boat</SelectItem>
                                      <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        
                        {/* Show business property value field for business property type */}
                        {watchBuildingType === 'BUSINESS_PROPERTY' && (
                          <>
                            <FormField
                              control={form.control}
                              name="businessPropertyValue"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Property Value ($)</FormLabel>
                                  <FormControl>
                                    <Input type="number" {...field} className="border-gray-200" />
                                  </FormControl>
                                  <FormDescription>
                                    Enter the current market value of the business property
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="businessPropertyType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Property Type</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200">
                                        <SelectValue placeholder="Select property type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                                      <SelectItem value="FURNITURE">Furniture</SelectItem>
                                      <SelectItem value="INVENTORY">Inventory</SelectItem>
                                      <SelectItem value="COMPUTER">Computer/IT</SelectItem>
                                      <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="businessPropertyCategory"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-200">
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="RETAIL">Retail</SelectItem>
                                      <SelectItem value="RESTAURANT">Restaurant</SelectItem>
                                      <SelectItem value="OFFICE">Office</SelectItem>
                                      <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                                      <SelectItem value="MEDICAL">Medical</SelectItem>
                                      <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                        
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
                      {/* Show complexity factor only for building types */}
                      {(watchBuildingType === 'RESIDENTIAL' || 
                        watchBuildingType === 'COMMERCIAL' || 
                        watchBuildingType === 'INDUSTRIAL' || 
                        watchBuildingType === 'AGRICULTURAL') && (
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
                      )}
                      
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
                      
                      <FormField
                        control={form.control}
                        name="buildingAge"
                        render={({ field }) => {
                          // Calculate depreciation percentage for display
                          const buildingType = form.getValues().buildingType;
                          const deprecationPercentage = getDepreciationPercentage(field.value, buildingType);
                          const depreciationColor = getDepreciationColor(deprecationPercentage);
                          
                          return (
                            <FormItem className="bg-[#e6eef2] p-3 rounded-md">
                              <div className="flex justify-between items-center">
                                <FormLabel>Building Age (years)</FormLabel>
                                <div className="flex items-center gap-2">
                                  {field.value > 0 && (
                                    <Badge 
                                      variant="outline" 
                                      className="bg-white border-gray-200"
                                      style={{ color: depreciationColor }}
                                    >
                                      Depreciation: {deprecationPercentage}%
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="bg-white text-[#243E4D] border-[#29B7D3]/30">
                                    {field.value}
                                  </Badge>
                                </div>
                              </div>
                              <FormControl>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Input
                                    type="number"
                                    {...field}
                                    min={0}
                                    className="border-gray-200"
                                  />
                                  <TooltipProvider>
                                    <UITooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-[#29B7D3] cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="w-80">
                                          <p className="text-xs mb-2">
                                            <span className="font-medium">Building Age Impact:</span> Age affects depreciation due to 
                                            wear and tear, outdated systems, and reduced remaining useful life.
                                          </p>
                                          <div className="bg-gray-100 p-2 rounded-md mb-2">
                                            <h5 className="text-xs font-medium mb-1">Depreciation Rates by Building Type:</h5>
                                            <ul className="text-xs space-y-1">
                                              <li className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                                                <span>Residential: 1.333% per year (min. value: 30%)</span>
                                              </li>
                                              <li className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-amber-500 mr-1"></div>
                                                <span>Commercial: 1% per year (min. value: 25%)</span>
                                              </li>
                                              <li className="flex items-center">
                                                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                                <span>Industrial: 0.889% per year (min. value: 20%)</span>
                                              </li>
                                            </ul>
                                          </div>
                                          <p className="text-xs italic">
                                            Higher depreciation means lower property value assessment and potentially 
                                            lower taxes or insurance costs.
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </UITooltip>
                                  </TooltipProvider>
                                </div>
                              </FormControl>
                              {field.value > 0 ? (
                                <div className="mt-2">
                                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500" 
                                      style={{ 
                                        width: `${Math.min(100, deprecationPercentage * 1.5)}%`,
                                        backgroundColor: depreciationColor
                                      }}
                                    />
                                  </div>
                                  <FormDescription className="mt-1">
                                    Building has lost {deprecationPercentage}% of its value due to age
                                  </FormDescription>
                                </div>
                              ) : (
                                <FormDescription className="mt-2">
                                  Enter the age of the building in years (0 for new construction)
                                </FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
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
                {/* What-If Scenario Actions */}
                <div className="bg-[#e6eef2] p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center text-[#243E4D]">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    <p className="text-sm">
                      {currentScenario 
                        ? `Current scenario: ${currentScenario.name}` 
                        : "Save your calculation as a scenario to compare different options."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="bg-white border-[#29B7D3]/30 text-[#243E4D] hover:bg-[#e8f8fb] hover:text-[#243E4D]"
                      onClick={() => setShowScenarioModal(true)}
                    >
                      Save as Scenario
                    </Button>
                    {scenarios.length > 0 && (
                      <Button 
                        variant="outline" 
                        className="bg-white border-[#3CAB36]/30 text-[#243E4D] hover:bg-[#edf7ed] hover:text-[#243E4D]"
                        onClick={() => setActiveTab("scenarios")}
                      >
                        Compare Scenarios
                      </Button>
                    )}
                  </div>
                </div>
              
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
                
                {/* Age Depreciation Section */}
                {form.getValues().buildingAge > 0 && (
                  <div className="mt-4">
                    <div className="bg-white border border-dashed p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center">
                          <Building className="h-5 w-5 mr-2" style={{ color: getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)) }} />
                          <h4 className="text-lg font-medium">Age Depreciation Impact</h4>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="font-normal"
                          style={{ 
                            borderColor: getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)),
                            color: getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)),
                            backgroundColor: `${getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType))}10`
                          }}
                        >
                          Age: {form.getValues().buildingAge} years
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="text-sm text-gray-600 mb-1">Depreciation Rate</div>
                          <div className="text-xl font-medium" style={{ color: getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)) }}>
                            {getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {form.getValues().buildingType === 'RESIDENTIAL' ? '1.333% per year' : form.getValues().buildingType === 'COMMERCIAL' ? '1% per year' : '0.889% per year'}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="text-sm text-gray-600 mb-1">Cost Impact</div>
                          <div className="text-xl font-medium">
                            -${(costBreakdown.find(c => c.category === 'Age Depreciation')?.cost || 0).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {((costBreakdown.find(c => c.category === 'Age Depreciation')?.cost || 0) / totalCost * 100).toFixed(1)}% of total cost
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="text-sm text-gray-600 mb-1">Retained Value</div>
                          <div className="text-xl font-medium text-[#3CAB36]">
                            {(100 - getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType))}%
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Minimum retained value: {form.getValues().buildingType === 'RESIDENTIAL' ? '30%' : form.getValues().buildingType === 'COMMERCIAL' ? '25%' : '20%'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed depreciation calculation information */}
                      <div className="mt-4 p-3 bg-[#f8f9fa] rounded-md border">
                        <h5 className="text-sm font-medium text-[#243E4D] mb-2 flex items-center">
                          <Info className="h-4 w-4 mr-1 text-[#29B7D3]" />
                          Depreciation Formula Details
                        </h5>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                            <span className="text-gray-600">Building Type:</span>
                            <span className="font-medium">{buildingTypes.find(t => t.value === form.getValues().buildingType)?.label}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                            <span className="text-gray-600">Annual Depreciation Rate:</span>
                            <span className="font-medium">
                              {form.getValues().buildingType === 'RESIDENTIAL' ? '1.333' : 
                               form.getValues().buildingType === 'COMMERCIAL' ? '1.000' : 
                               form.getValues().buildingType === 'INDUSTRIAL' ? '0.889' : '1.000'}% per year
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-b border-gray-200 pb-1">
                            <span className="text-gray-600">Minimum Retained Value:</span>
                            <span className="font-medium">
                              {form.getValues().buildingType === 'RESIDENTIAL' ? '30' : 
                               form.getValues().buildingType === 'COMMERCIAL' ? '25' : 
                               form.getValues().buildingType === 'INDUSTRIAL' ? '20' : '25'}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Formula Applied:</span>
                            <span className="font-medium">Max(Minimum Value, 1.0 - (Age × Annual Rate))</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-[#e6eef2] rounded-md text-xs text-[#243E4D] flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-[#243E4D]" />
                        <p>Different building types depreciate at different rates based on Benton County Building Cost Assessment standards. Residential buildings depreciate faster (1.333% per year) than commercial (1.000% per year) and industrial buildings (0.889% per year).</p>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Cost Comparison</div>
                          <div className="text-xs text-gray-500">Impact of building age on total cost</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col bg-white p-2 rounded border">
                            <div className="text-sm text-gray-500">If New Building</div>
                            <div className="text-lg font-medium">
                              ${(totalCost + (costBreakdown.find(c => c.category === 'Age Depreciation')?.cost || 0)).toLocaleString()}
                            </div>
                            <div className="mt-1">
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full">No Depreciation</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col bg-white p-2 rounded border">
                            <div className="text-sm text-gray-500">Current Estimate</div>
                            <div className="text-lg font-medium" style={{ color: getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)) }}>
                              ${totalCost.toLocaleString()}
                            </div>
                            <div className="mt-1">
                              <span className="text-xs px-1.5 py-0.5 rounded-full text-white" 
                                style={{ backgroundColor: getDepreciationColor(getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)) }}>
                                With {getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)}% Depreciation
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500" 
                          style={{ 
                            width: `${100 - getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)}%`,
                            backgroundColor: "#3CAB36" 
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>Depreciated: {getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)}%</span>
                        <span>Retained: {100 - getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)}%</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 bg-[#e8f8fb] p-3 rounded border-l-4 border-[#29B7D3] text-sm">
                      <div className="flex items-start">
                        <Info className="text-[#29B7D3] h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-[#243E4D] mb-1">
                            <span className="font-medium">Understanding Age Depreciation:</span> Building age impacts value due to wear and tear, 
                            outdated systems, and reduced remaining useful life.
                          </p>
                          <p className="text-[#243E4D]">
                            Different building types depreciate at different rates based on construction materials, typical usage patterns, 
                            and industry standards. The calculator applies appropriate depreciation rates for {form.getValues().buildingType.toLowerCase()} buildings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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
                          {costBreakdown.map((item) => {
                            // Special styling for Age Depreciation
                            const isDepreciation = item.category === 'Age Depreciation';
                            const deprecationPercentage = getDepreciationPercentage(
                              form.getValues().buildingAge, 
                              form.getValues().buildingType
                            );
                            const depreciationColor = getDepreciationColor(deprecationPercentage);
                            
                            return (
                              <TableRow 
                                key={item.category} 
                                className={isDepreciation ? "bg-gray-50" : ""}
                              >
                                <TableCell>
                                  <div className="flex items-center">
                                    {isDepreciation && (
                                      <Building className="h-4 w-4 mr-1" style={{ color: depreciationColor }} />
                                    )}
                                    <span>{item.category}</span>
                                    {isDepreciation && form.getValues().buildingAge > 0 && (
                                      <Badge 
                                        className="ml-2 text-white" 
                                        style={{ backgroundColor: depreciationColor }}
                                      >
                                        {deprecationPercentage}% Loss
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span 
                                    className={isDepreciation ? "font-medium" : ""}
                                    style={{ color: isDepreciation ? depreciationColor : "inherit" }}
                                  >
                                    ${item.cost.toLocaleString()}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className="font-normal"
                                    style={{ 
                                      borderColor: isDepreciation ? depreciationColor : "inherit",
                                      color: isDepreciation ? depreciationColor : "inherit" 
                                    }}
                                  >
                                    {((item.cost / totalCost) * 100).toFixed(1)}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
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
                        const isDepreciation = item.category === 'Age Depreciation';
                        
                        // Special styling for Age Depreciation
                        const buildingAge = form.getValues().buildingAge;
                        const buildingType = form.getValues().buildingType;
                        const deprecationPercentage = getDepreciationPercentage(buildingAge, buildingType);
                        const depreciationColor = getDepreciationColor(deprecationPercentage);
                        
                        const barColors = ['#243E4D', '#3CAB36', '#29B7D3'];
                        const barColor = isDepreciation ? depreciationColor : barColors[index % 3];
                        const bgColor = index % 3 === 0 ? '#e6eef2' : (index % 3 === 1 ? '#e8f7e8' : '#e8f8fb');
                        
                        return (
                          <div key={item.category} className="group relative">
                            <div className="flex justify-between mb-1">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: barColor }}></div>
                                <span className="font-medium text-sm">
                                  {item.category}
                                  {isDepreciation && buildingAge > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded text-white" style={{ backgroundColor: depreciationColor }}>
                                      -{deprecationPercentage}%
                                    </span>
                                  )}
                                </span>
                              </div>
                              <span 
                                className={`text-sm font-semibold ${isDepreciation ? "flex items-center" : ""}`}
                                style={{ color: isDepreciation ? depreciationColor : "inherit" }}
                              >
                                ${item.cost.toLocaleString()}
                              </span>
                            </div>
                            
                            <div 
                              className={`w-full h-10 bg-gray-100 rounded-md overflow-hidden flex items-center ${isDepreciation ? "border" : ""}`}
                              style={{ borderColor: isDepreciation ? `${depreciationColor}50` : "transparent" }}
                              onMouseEnter={() => {
                                setHoveredCostItem(item.category);
                              }}
                              onMouseLeave={() => {
                                setHoveredCostItem(null);
                              }}
                            >
                              {isDepreciation && buildingAge > 0 && (
                                <div 
                                  className="absolute right-0 h-full bg-gray-200 bg-opacity-50 border-l border-dashed flex items-center px-2 text-xs pointer-events-none"
                                  style={{ 
                                    width: `${Math.min(100 - parseFloat(width), 100)}%`,
                                    borderColor: depreciationColor
                                  }}
                                >
                                  <div className="text-gray-600 font-medium">Lost Value</div>
                                </div>
                              )}
                              <div 
                                className={`h-full transition-all duration-1000 ease-in-out flex items-center pl-2 text-white text-xs font-bold origin-left ${isDepreciation && buildingAge > 0 ? "bg-gradient-to-r" : ""}`}
                                style={{ 
                                  width: width, 
                                  backgroundColor: isDepreciation && buildingAge > 0 ? "transparent" : barColor,
                                  backgroundImage: isDepreciation && buildingAge > 0 ? `linear-gradient(to right, ${barColor}, ${barColor}99)` : "none",
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
                                {isDepreciation && buildingAge > 0 && (
                                  <span className="ml-2 text-xs px-1 rounded-sm bg-white text-gray-800">
                                    Retained Value
                                  </span>
                                )}
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
                
                {/* Cost Breakdown Treemap */}
                {treemapData.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center mb-4">
                      <Blocks className="text-[#243E4D] mr-2 h-5 w-5" />
                      <h4 className="text-lg font-medium text-[#243E4D]">Interactive Cost Breakdown</h4>
                    </div>
                    
                    <div className="bg-[#e8f8fb] p-4 rounded-lg mb-4 flex items-center text-sm">
                      <Info className="text-[#29B7D3] mr-2 h-4 w-4" />
                      <p className="text-[#243E4D]">This interactive treemap visualization shows the hierarchical breakdown of costs. Larger blocks represent higher costs. Hover over blocks to see details.</p>
                    </div>
                    
                    <div className="w-full border rounded-md p-4">
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-sm bg-[#243E4D] mr-1"></div>
                            <span className="text-xs">Building Costs</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-4 h-4 rounded-sm bg-[#3CAB36] mr-1"></div>
                            <span className="text-xs">Materials</span>
                          </div>
                          {form.getValues().buildingAge > 0 && (
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-sm mr-1" 
                                style={{ 
                                  backgroundColor: getDepreciationColor(
                                    getDepreciationPercentage(
                                      form.getValues().buildingAge, 
                                      form.getValues().buildingType
                                    )
                                  ) 
                                }}
                              ></div>
                              <span className="text-xs">Age Depreciation</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <Treemap
                            data={treemapData}
                            dataKey="size"
                            nameKey="name"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#243E4D"
                            animationBegin={0}
                            animationDuration={1500}
                            animationEasing="ease-out"
                          />
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <PlayCircle className="h-5 w-5 mr-2 text-[#29B7D3]" />
                    Interactive Cost Explainer
                  </h3>
                  <div className="p-2 bg-white border rounded-lg mb-6">
                    <div className="flex items-center mb-2">
                      <p className="text-sm text-gray-600">Watch how different factors impact your building cost estimate:</p>
                    </div>
                    <CostImpactAnimation 
                      buildingType={form.getValues().buildingType}
                      baseCost={form.getValues().squareFootage * getBaseCostPerSqFt(form.getValues().buildingType, form.getValues().quality)}
                      complexityFactor={form.getValues().complexityFactor}
                      conditionFactor={form.getValues().conditionFactor}
                      regionalMultiplier={getRegionalMultiplier(form.getValues().region)}
                      ageDepreciation={getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType)}
                      region={form.getValues().region}
                      buildingAge={form.getValues().buildingAge}
                      squareFootage={form.getValues().squareFootage}
                      size="md"
                    />
                    <p className="text-xs text-gray-500 mt-2 italic">
                      Click the play button to see how costs accumulate from base cost through each adjustment factor.
                    </p>
                  </div>
                  
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-[#243E4D]" />
                    Export Options
                  </h3>
                  
                  <div className="mb-4">
                    <QuickExportButton 
                      calculation={{
                        buildingType: form.getValues().buildingType,
                        squareFootage: form.getValues().squareFootage,
                        quality: form.getValues().quality,
                        buildingAge: form.getValues().buildingAge,
                        region: form.getValues().region,
                        complexityFactor: form.getValues().complexityFactor,
                        conditionFactor: form.getValues().conditionFactor,
                        baseCost: form.getValues().squareFootage * getBaseCostPerSqFt(form.getValues().buildingType, form.getValues().quality),
                        regionalMultiplier: getRegionalMultiplier(form.getValues().region),
                        ageDepreciation: getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType),
                        totalCost: calculateTotalCost(form.getValues(), materials).totalCost,
                        materialCosts: materials.map(material => ({
                          category: 'Materials',
                          description: material.name,
                          quantity: material.quantity,
                          unitCost: material.unitPrice,
                          totalCost: material.quantity * material.unitPrice
                        }))
                      }}
                    />
                  </div>
                  
                  <h4 className="text-sm font-medium mb-2 text-gray-600">Advanced Export Options</h4>
                  <div className="flex flex-wrap gap-2">
                    <ExportPdfDialog 
                      calculation={{
                        buildingType: form.getValues().buildingType,
                        squareFootage: form.getValues().squareFootage,
                        quality: form.getValues().quality,
                        buildingAge: form.getValues().buildingAge,
                        region: form.getValues().region,
                        complexityFactor: form.getValues().complexityFactor,
                        conditionFactor: form.getValues().conditionFactor,
                        baseCost: form.getValues().squareFootage * getBaseCostPerSqFt(form.getValues().buildingType, form.getValues().quality),
                        regionalMultiplier: getRegionalMultiplier(form.getValues().region),
                        ageDepreciation: getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType),
                        totalCost: calculateTotalCost(form.getValues(), materials).totalCost,
                        materialCosts: materials.map(material => ({
                          category: 'Materials',
                          description: material.name,
                          quantity: material.quantity,
                          unitCost: material.unitPrice,
                          totalCost: material.quantity * material.unitPrice
                        }))
                      }}
                    />
                    
                    <ExportExcelDialog 
                      calculation={{
                        buildingType: form.getValues().buildingType,
                        squareFootage: form.getValues().squareFootage,
                        quality: form.getValues().quality,
                        buildingAge: form.getValues().buildingAge,
                        region: form.getValues().region,
                        complexityFactor: form.getValues().complexityFactor,
                        conditionFactor: form.getValues().conditionFactor,
                        baseCost: form.getValues().squareFootage * getBaseCostPerSqFt(form.getValues().buildingType, form.getValues().quality),
                        regionalMultiplier: getRegionalMultiplier(form.getValues().region),
                        ageDepreciation: getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType),
                        totalCost: calculateTotalCost(form.getValues(), materials).totalCost,
                        materialCosts: materials.map(material => ({
                          category: 'Materials',
                          description: material.name,
                          quantity: material.quantity,
                          unitCost: material.unitPrice,
                          totalCost: material.quantity * material.unitPrice
                        }))
                      }}
                    />
                    
                    <PrintDialog 
                      calculation={{
                        buildingType: form.getValues().buildingType,
                        squareFootage: form.getValues().squareFootage,
                        quality: form.getValues().quality,
                        buildingAge: form.getValues().buildingAge,
                        region: form.getValues().region,
                        complexityFactor: form.getValues().complexityFactor,
                        conditionFactor: form.getValues().conditionFactor,
                        baseCost: form.getValues().squareFootage * getBaseCostPerSqFt(form.getValues().buildingType, form.getValues().quality),
                        regionalMultiplier: getRegionalMultiplier(form.getValues().region),
                        ageDepreciation: getDepreciationPercentage(form.getValues().buildingAge, form.getValues().buildingType),
                        totalCost: calculateTotalCost(form.getValues(), materials).totalCost,
                        materialCosts: materials.map(material => ({
                          category: 'Materials',
                          description: material.name,
                          quantity: material.quantity,
                          unitCost: material.unitPrice,
                          totalCost: material.quantity * material.unitPrice
                        }))
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-4">
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
                
                {/* Advanced Cost Prediction Engine */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-medium text-[#243E4D] mb-4 flex items-center">
                    <BrainCircuit className="mr-2 h-5 w-5 text-[#29B7D3]" />
                    Advanced Cost Prediction
                  </h3>
                  <PredictiveCostAnalysis 
                    buildingType={form.getValues().buildingType}
                    squareFeet={form.getValues().squareFootage}
                    quality={form.getValues().quality}
                    buildingAge={form.getValues().buildingAge}
                    region={form.getValues().region}
                    complexityFactor={form.getValues().complexityFactor}
                    conditionFactor={form.getValues().conditionFactor}
                  />
                </div>
                
                {/* Material Substitution Engine */}
                <div className="mt-8 pt-8 border-t">
                  <h3 className="text-xl font-medium text-[#243E4D] mb-4 flex items-center">
                    <Share2 className="mr-2 h-5 w-5 text-[#3CAB36]" />
                    Material Substitution Recommendations
                  </h3>
                  <MaterialSubstitutionEngine 
                    buildingType={form.getValues().buildingType}
                    region={form.getValues().region}
                    quality={form.getValues().quality}
                    currentMaterials={materials}
                    onSubstitutionApplied={(materialId, newMaterial) => {
                      updateMaterial(materialId, 'name', newMaterial.name);
                      updateMaterial(materialId, 'unitPrice', newMaterial.unitPrice);
                    }}
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* What-If Scenarios Tab */}
            <TabsContent value="scenarios">
              <div className="space-y-6">
                <div className="bg-[#e6eef2] p-4 rounded-lg mb-6 flex items-center text-sm">
                  <Info className="text-[#243E4D] mr-2 h-4 w-4" />
                  <p className="text-[#243E4D]">
                    What-If Scenario Analysis allows you to create and compare different building scenarios to make better decisions.
                  </p>
                </div>
                
                {scenarios.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <p className="text-lg text-gray-500">No scenarios saved yet.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create a scenario from the Results tab to compare different building options.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium text-[#243E4D] flex items-center">
                          <Save className="mr-2 h-5 w-5 text-[#3CAB36]" />
                          Saved Scenarios
                        </h3>
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader className="bg-gray-100">
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead className="w-[120px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scenarios.map((scenario) => (
                                <TableRow key={scenario.id} className={currentScenario?.id === scenario.id ? "bg-[#e8f8fb]/30" : ""}>
                                  <TableCell className="font-medium">
                                    {scenario.name}
                                    {currentScenario?.id === scenario.id && (
                                      <Badge className="ml-2 bg-[#29B7D3] text-white">Current</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>${scenario.totalCost.toLocaleString()}</TableCell>
                                  <TableCell>
                                    {regions.find(r => r.value === scenario.formValues.region)?.label}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => loadScenario(scenario)}
                                        className="h-8 w-8 text-[#3CAB36]"
                                      >
                                        <TooltipProvider>
                                          <UITooltip>
                                            <TooltipTrigger asChild>
                                              <span className="sr-only">Load</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Load scenario</p>
                                            </TooltipContent>
                                          </UITooltip>
                                        </TooltipProvider>
                                        <Save className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => deleteScenario(scenario.id)}
                                        className="h-8 w-8 text-red-500"
                                      >
                                        <TooltipProvider>
                                          <UITooltip>
                                            <TooltipTrigger asChild>
                                              <span className="sr-only">Delete</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Delete scenario</p>
                                            </TooltipContent>
                                          </UITooltip>
                                        </TooltipProvider>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium text-[#243E4D] flex items-center">
                          <ArrowLeftRight className="mr-2 h-5 w-5 text-[#29B7D3]" />
                          Scenario Comparison
                        </h3>
                        <div className="bg-white border rounded-md p-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Baseline Scenario</label>
                              <Select
                                onValueChange={(value) => {
                                  const scenario = scenarios.find(s => s.id === value);
                                  setComparisonScenarios('baseline', scenario || null);
                                }}
                                value={scenarioComparison.baseline?.id || ""}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select baseline" />
                                </SelectTrigger>
                                <SelectContent>
                                  {scenarios.map((scenario) => (
                                    <SelectItem key={`baseline-${scenario.id}`} value={scenario.id}>
                                      {scenario.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Comparison Scenario</label>
                              <Select
                                onValueChange={(value) => {
                                  const scenario = scenarios.find(s => s.id === value);
                                  setComparisonScenarios('comparison', scenario || null);
                                }}
                                value={scenarioComparison.comparison?.id || ""}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select comparison" />
                                </SelectTrigger>
                                <SelectContent>
                                  {scenarios.map((scenario) => (
                                    <SelectItem key={`comparison-${scenario.id}`} value={scenario.id}>
                                      {scenario.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {scenarioComparison.baseline && scenarioComparison.comparison ? (
                            <div>
                              <div className="flex justify-between p-3 bg-[#e6eef2] rounded-md mb-3">
                                <div>
                                  <h4 className="font-medium">{scenarioComparison.baseline.name}</h4>
                                  <p className="text-sm text-gray-600">${scenarioComparison.baseline.totalCost.toLocaleString()}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-right">{scenarioComparison.comparison.name}</h4>
                                  <p className="text-sm text-gray-600 text-right">${scenarioComparison.comparison.totalCost.toLocaleString()}</p>
                                </div>
                              </div>
                              
                              {(() => {
                                const diff = calculateScenarioDifference();
                                if (!diff) return null;
                                
                                return (
                                  <div className={`p-3 rounded-md ${diff.isIncrease ? 'bg-red-50' : 'bg-green-50'}`}>
                                    <p className="font-medium flex items-center justify-center">
                                      <ArrowRightLeft className={`mr-2 h-4 w-4 ${diff.isIncrease ? 'text-red-500' : 'text-green-500'}`} />
                                      <span className={diff.isIncrease ? 'text-red-500' : 'text-green-500'}>
                                        {diff.isIncrease ? 'Increase' : 'Saving'} of ${Math.abs(diff.costDifference).toLocaleString()} ({Math.abs(diff.percentDifference).toFixed(1)}%)
                                      </span>
                                    </p>
                                  </div>
                                );
                              })()}
                              
                              <div className="mt-4">
                                <h4 className="font-medium mb-2">Key Differences</h4>
                                <div className="space-y-2 text-sm">
                                  {scenarioComparison.baseline.formValues.buildingType !== scenarioComparison.comparison.formValues.buildingType && (
                                    <div className="flex justify-between border-b pb-1">
                                      <span>Building Type:</span>
                                      <div className="flex items-center">
                                        <span>{buildingTypes.find(t => t.value === scenarioComparison.baseline?.formValues.buildingType)?.label}</span>
                                        <ArrowRightLeft className="mx-2 h-3 w-3" />
                                        <span>{buildingTypes.find(t => t.value === scenarioComparison.comparison?.formValues.buildingType)?.label}</span>
                                      </div>
                                    </div>
                                  )}
                                  {scenarioComparison.baseline.formValues.quality !== scenarioComparison.comparison.formValues.quality && (
                                    <div className="flex justify-between border-b pb-1">
                                      <span>Quality:</span>
                                      <div className="flex items-center">
                                        <span>{qualityLevels.find(q => q.value === scenarioComparison.baseline?.formValues.quality)?.label}</span>
                                        <ArrowRightLeft className="mx-2 h-3 w-3" />
                                        <span>{qualityLevels.find(q => q.value === scenarioComparison.comparison?.formValues.quality)?.label}</span>
                                      </div>
                                    </div>
                                  )}
                                  {scenarioComparison.baseline.formValues.region !== scenarioComparison.comparison.formValues.region && (
                                    <div className="flex justify-between border-b pb-1">
                                      <span>Region:</span>
                                      <div className="flex items-center">
                                        <span>{regions.find(r => r.value === scenarioComparison.baseline?.formValues.region)?.label}</span>
                                        <ArrowRightLeft className="mx-2 h-3 w-3" />
                                        <span>{regions.find(r => r.value === scenarioComparison.comparison?.formValues.region)?.label}</span>
                                      </div>
                                    </div>
                                  )}
                                  {scenarioComparison.baseline.formValues.squareFootage !== scenarioComparison.comparison.formValues.squareFootage && (
                                    <div className="flex justify-between border-b pb-1">
                                      <span>Square Footage:</span>
                                      <div className="flex items-center">
                                        <span>{scenarioComparison.baseline.formValues.squareFootage.toLocaleString()}</span>
                                        <ArrowRightLeft className="mx-2 h-3 w-3" />
                                        <span>{scenarioComparison.comparison.formValues.squareFootage.toLocaleString()}</span>
                                      </div>
                                    </div>
                                  )}
                                  {scenarioComparison.baseline.materials.length !== scenarioComparison.comparison.materials.length && (
                                    <div className="flex justify-between border-b pb-1">
                                      <span>Materials:</span>
                                      <div className="flex items-center">
                                        <span>{scenarioComparison.baseline.materials.length} items</span>
                                        <ArrowRightLeft className="mx-2 h-3 w-3" />
                                        <span>{scenarioComparison.comparison.materials.length} items</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Visual Comparison Chart */}
                              {scenarioComparison.baseline && scenarioComparison.comparison && (
                                <div className="mt-6">
                                  <h4 className="font-medium mb-2">Visual Comparison</h4>
                                  <div className="h-64 border rounded-md overflow-hidden">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart
                                        data={[
                                          { name: 'Base Cost', 
                                            [scenarioComparison.baseline.name]: scenarioComparison.baseline.costBreakdown.find(c => c.category === 'Base Cost')?.cost || 0,
                                            [scenarioComparison.comparison.name]: scenarioComparison.comparison.costBreakdown.find(c => c.category === 'Base Cost')?.cost || 0 
                                          },
                                          { name: 'Complexity', 
                                            [scenarioComparison.baseline.name]: scenarioComparison.baseline.costBreakdown.find(c => c.category === 'Complexity Adjustment')?.cost || 0,
                                            [scenarioComparison.comparison.name]: scenarioComparison.comparison.costBreakdown.find(c => c.category === 'Complexity Adjustment')?.cost || 0 
                                          },
                                          { name: 'Condition', 
                                            [scenarioComparison.baseline.name]: scenarioComparison.baseline.costBreakdown.find(c => c.category === 'Condition Adjustment')?.cost || 0,
                                            [scenarioComparison.comparison.name]: scenarioComparison.comparison.costBreakdown.find(c => c.category === 'Condition Adjustment')?.cost || 0 
                                          },
                                          { name: 'Regional', 
                                            [scenarioComparison.baseline.name]: scenarioComparison.baseline.costBreakdown.find(c => c.category === 'Regional Adjustment')?.cost || 0,
                                            [scenarioComparison.comparison.name]: scenarioComparison.comparison.costBreakdown.find(c => c.category === 'Regional Adjustment')?.cost || 0 
                                          },
                                          { name: 'Materials', 
                                            [scenarioComparison.baseline.name]: scenarioComparison.baseline.costBreakdown.find(c => c.category === 'Materials')?.cost || 0,
                                            [scenarioComparison.comparison.name]: scenarioComparison.comparison.costBreakdown.find(c => c.category === 'Materials')?.cost || 0 
                                          },
                                          { name: 'Total', 
                                            [scenarioComparison.baseline.name]: scenarioComparison.baseline.totalCost,
                                            [scenarioComparison.comparison.name]: scenarioComparison.comparison.totalCost 
                                          },
                                        ]}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                      >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip 
                                          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
                                          contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderRadius: '8px',
                                            padding: '10px',
                                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                            border: '1px solid #ddd'
                                          }}
                                        />
                                        <Legend />
                                        <Bar 
                                          dataKey={scenarioComparison.baseline.name} 
                                          fill="#243E4D" 
                                          animationDuration={1500}
                                          animationBegin={0}
                                          name={`${scenarioComparison.baseline.name} (Baseline)`}
                                        />
                                        <Bar 
                                          dataKey={scenarioComparison.comparison.name} 
                                          fill="#29B7D3" 
                                          animationDuration={1500}
                                          animationBegin={300}
                                          name={`${scenarioComparison.comparison.name} (Comparison)`}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4 border rounded-md">
                              <p className="text-gray-500">Select two scenarios to compare</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Summary Dashboard for Scenarios */}
                    <div className="mt-8 p-4 border rounded-lg bg-white shadow-sm">
                      <h3 className="text-lg font-medium text-[#243E4D] mb-4">Scenario Analytics Dashboard</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-[#e6eef2] p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-[#243E4D] mb-1">Total Scenarios</h4>
                          <p className="text-2xl font-bold text-[#243E4D]">{scenarios.length}</p>
                        </div>
                        
                        <div className="bg-[#e8f8fb] p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-[#243E4D] mb-1">Avg. Building Cost</h4>
                          <p className="text-2xl font-bold text-[#29B7D3]">
                            ${Math.round(scenarios.reduce((sum, scenario) => sum + scenario.totalCost, 0) / Math.max(1, scenarios.length)).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="bg-[#edf7ed] p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-[#243E4D] mb-1">Lowest Cost Option</h4>
                          <p className="text-2xl font-bold text-[#3CAB36]">
                            ${scenarios.length > 0 
                              ? Math.min(...scenarios.map(s => s.totalCost)).toLocaleString()
                              : "0"}
                          </p>
                        </div>
                        
                        <div className="bg-[#f5f5f5] p-3 rounded-lg">
                          <h4 className="text-sm font-medium text-[#243E4D] mb-1">Highest Cost Option</h4>
                          <p className="text-2xl font-bold text-[#243E4D]">
                            ${scenarios.length > 0
                              ? Math.max(...scenarios.map(s => s.totalCost)).toLocaleString()
                              : "0"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
      
      {/* Save Scenario Modal */}
      <Dialog open={showScenarioModal} onOpenChange={setShowScenarioModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Scenario</DialogTitle>
            <DialogDescription>
              Save your current calculation as a scenario for future reference and comparison.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="scenario-name" className="text-sm font-medium">
                Scenario Name
              </label>
              <Input 
                id="scenario-name" 
                placeholder="Enter a name for this scenario"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement;
                    if (input.value.trim()) {
                      saveAsScenario(input.value.trim());
                    }
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="scenario-description" className="text-sm font-medium">
                Description (Optional)
              </label>
              <Input id="scenario-description" placeholder="Brief description of this scenario" />
            </div>
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <p className="font-medium">Scenario will include:</p>
              <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                <li>Building specifications (type, size, quality)</li>
                <li>Materials and quantities</li>
                <li>Location and adjustment factors</li>
                <li>Total cost calculation</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScenarioModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const nameInput = document.getElementById('scenario-name') as HTMLInputElement;
                const descInput = document.getElementById('scenario-description') as HTMLInputElement;
                if (nameInput.value.trim()) {
                  saveAsScenario(nameInput.value.trim(), descInput.value.trim() || undefined);
                }
              }}
              className="bg-[#3CAB36] hover:bg-[#3CAB36]/90 text-white"
            >
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BCBSCostCalculator;