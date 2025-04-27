import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import { 
  DataFlowWorkflow, 
  WorkflowStep, 
  WorkflowProvider 
} from '@/components/workflow';
import { useDataFlow } from '@/contexts/DataFlowContext';
import { useToast } from '@/hooks/use-toast';
import {
  Calculator,
  Building2,
  Map,
  Check,
  LineChart,
  FileSpreadsheet,
  Save,
  Download,
  Share2,
  Info,
  HelpCircle,
  CalendarDays,
  SquareDot,
  PaintBucket,
  Star,
  Gauge,
  Layers,
  ArrowRight,
  Activity,
  Lightbulb,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Define calculator workflow steps with enhanced metadata
const calculatorWorkflowSteps: WorkflowStep[] = [
  {
    id: 'property',
    label: 'Property Information',
    description: 'Select or enter property details',
    helpText: 'Enter the basic property information. You can select an existing property or create a new one.',
    estimatedTime: '2-3 mins',
    icon: <Building2 className="h-4 w-4" />,
    requiredData: ['propertyId', 'propertyLocation', 'propertyType'],
  },
  {
    id: 'parameters',
    label: 'Building Parameters',
    description: 'Define building type, quality, and other parameters',
    helpText: 'Specify the building parameters including type, quality, condition, and other attributes.',
    estimatedTime: '3-5 mins',
    icon: <Layers className="h-4 w-4" />,
    requiredData: ['buildingType', 'quality', 'condition', 'squareFootage'],
  },
  {
    id: 'calculation',
    label: 'Calculate',
    description: 'Run cost calculation with selected parameters',
    helpText: 'Review and confirm your selections, then run the calculation process.',
    estimatedTime: '1-2 mins',
    icon: <Calculator className="h-4 w-4" />,
    requiredData: ['propertyId', 'buildingType', 'region'],
  },
  {
    id: 'results',
    label: 'Results',
    description: 'View and analyze calculation results',
    helpText: 'View the detailed calculation results and metrics. The results are based on the current cost matrix data.',
    estimatedTime: '2-4 mins',
    icon: <LineChart className="h-4 w-4" />,
  },
  {
    id: 'save',
    label: 'Save & Export',
    description: 'Save and export your calculation results',
    helpText: 'Save your calculation to the database and/or export it in various formats.',
    estimatedTime: '1-2 mins',
    icon: <Save className="h-4 w-4" />,
  },
];

// Property Selection Component
const PropertySelectionStep: React.FC = () => {
  const { state, updateState } = useDataFlow();
  const { toast } = useToast();
  const [propertyId, setPropertyId] = useState<string>(state.propertyId || '');
  const [location, setLocation] = useState<string>('');
  const [propertyType, setPropertyType] = useState<string>('');
  
  // Demo property data
  const demoProperties = [
    { id: 'prop-001', name: 'Riverfront Office Building', location: 'Richland, WA', type: 'Commercial' },
    { id: 'prop-002', name: 'Sunset Hills Residence', location: 'Kennewick, WA', type: 'Residential' },
    { id: 'prop-003', name: 'Mountain View Industrial Park', location: 'Pasco, WA', type: 'Industrial' },
    { id: 'prop-004', name: 'Harbor Springs Community Center', location: 'Benton City, WA', type: 'Municipal' },
    { id: 'prop-005', name: 'Orchard Creek Farm', location: 'Prosser, WA', type: 'Agricultural' },
  ];
  
  const handlePropertyChange = (id: string) => {
    setPropertyId(id);
    const property = demoProperties.find(p => p.id === id);
    if (property) {
      setLocation(property.location);
      setPropertyType(property.type);
    }
  };
  
  const handleSave = () => {
    if (!propertyId) {
      toast({
        title: 'Property Required',
        description: 'Please select a property to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    const selectedProperty = demoProperties.find(p => p.id === propertyId);
    
    // Update the data flow state
    updateState({
      propertyId,
      propertyDetails: selectedProperty ? {
        id: selectedProperty.id,
        name: selectedProperty.name,
        location: selectedProperty.location,
        type: selectedProperty.type,
      } : null,
    });
    
    toast({
      title: 'Property Selected',
      description: `Property "${selectedProperty?.name}" has been selected.`,
    });
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            Select Property
          </CardTitle>
          <CardDescription>
            Choose an existing property from the database or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="property-select">Property</Label>
              <Select value={propertyId} onValueChange={handlePropertyChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {demoProperties.map(property => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} ({property.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {propertyId && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={location} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Property Type</Label>
                  <Input 
                    id="type" 
                    value={propertyType} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSave} className="ml-auto">
            <Check className="h-4 w-4 mr-2" />
            Save Property Selection
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-amber-500" />
            Property Information Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-3">
            <p>
              The property selection step establishes the foundation for your cost calculation. 
              Each property in Benton County has specific attributes that affect its valuation.
            </p>
            
            <div className="flex items-start bg-amber-50 p-3 rounded-md border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium text-amber-800">Important Note</p>
                <p className="text-amber-700">
                  Selecting a property automatically pulls in its geographic region, 
                  which is a critical factor in the cost calculation process.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Building Parameters Step
const BuildingParametersStep: React.FC = () => {
  const { state, updateState } = useDataFlow();
  const { toast } = useToast();
  const [buildingType, setBuildingType] = useState<string>(state.buildingType || '');
  const [quality, setQuality] = useState<string>(state.quality || '');
  const [condition, setCondition] = useState<string>(state.condition || '');
  const [squareFootage, setSquareFootage] = useState<string>('2500');
  const [region, setRegion] = useState<string>(state.region || 'CENTRAL');
  
  const handleSave = () => {
    if (!buildingType || !quality || !condition || !region) {
      toast({
        title: 'Missing Parameters',
        description: 'Please fill out all required fields before continuing.',
        variant: 'destructive',
      });
      return;
    }
    
    // Update the data flow state
    updateState({
      buildingType,
      buildingTypeDetails: { code: buildingType, name: getBuildingTypeName(buildingType) },
      quality,
      qualityDetails: { code: quality, name: getQualityName(quality) },
      condition,
      conditionDetails: { code: condition, name: getConditionName(condition) },
      region,
      regionDetails: { code: region, name: getRegionName(region) },
    });
    
    toast({
      title: 'Parameters Saved',
      description: 'Building parameters have been saved successfully.',
    });
  };
  
  // Helper functions to get display names
  const getBuildingTypeName = (code: string): string => {
    const types: Record<string, string> = {
      RES1: 'Single Family Residential',
      RES2: 'Multi-Family Residential',
      COM1: 'Commercial - Office',
      COM2: 'Commercial - Retail',
      IND1: 'Industrial - Light',
      IND2: 'Industrial - Heavy',
      AGR1: 'Agricultural',
      MUN1: 'Municipal',
    };
    return types[code] || code;
  };
  
  const getQualityName = (code: string): string => {
    const qualities: Record<string, string> = {
      LOW: 'Low Quality',
      AVG: 'Average Quality',
      GOOD: 'Good Quality',
      HIGH: 'High Quality',
      PREM: 'Premium Quality',
    };
    return qualities[code] || code;
  };
  
  const getConditionName = (code: string): string => {
    const conditions: Record<string, string> = {
      POOR: 'Poor Condition',
      FAIR: 'Fair Condition',
      AVG: 'Average Condition',
      GOOD: 'Good Condition',
      EXC: 'Excellent Condition',
    };
    return conditions[code] || code;
  };
  
  const getRegionName = (code: string): string => {
    const regions: Record<string, string> = {
      CENTRAL: 'Central Benton County',
      EAST: 'Eastern Benton County',
      WEST: 'Western Benton County',
      NORTH: 'Northern Benton County',
      SOUTH: 'Southern Benton County',
    };
    return regions[code] || code;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            Building Parameters
          </CardTitle>
          <CardDescription>
            Define the building type, quality, condition, and other parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="buildingType">Building Type</Label>
              <Select value={buildingType} onValueChange={setBuildingType}>
                <SelectTrigger id="buildingType" className="w-full">
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RES1">Single Family Residential</SelectItem>
                  <SelectItem value="RES2">Multi-Family Residential</SelectItem>
                  <SelectItem value="COM1">Commercial - Office</SelectItem>
                  <SelectItem value="COM2">Commercial - Retail</SelectItem>
                  <SelectItem value="IND1">Industrial - Light</SelectItem>
                  <SelectItem value="IND2">Industrial - Heavy</SelectItem>
                  <SelectItem value="AGR1">Agricultural</SelectItem>
                  <SelectItem value="MUN1">Municipal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quality">Quality</Label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger id="quality" className="w-full">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low Quality</SelectItem>
                    <SelectItem value="AVG">Average Quality</SelectItem>
                    <SelectItem value="GOOD">Good Quality</SelectItem>
                    <SelectItem value="HIGH">High Quality</SelectItem>
                    <SelectItem value="PREM">Premium Quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger id="condition" className="w-full">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POOR">Poor Condition</SelectItem>
                    <SelectItem value="FAIR">Fair Condition</SelectItem>
                    <SelectItem value="AVG">Average Condition</SelectItem>
                    <SelectItem value="GOOD">Good Condition</SelectItem>
                    <SelectItem value="EXC">Excellent Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input 
                  id="squareFootage" 
                  value={squareFootage} 
                  onChange={(e) => setSquareFootage(e.target.value)} 
                  type="number"
                  min="100"
                />
              </div>
              
              <div>
                <Label htmlFor="region">Region</Label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger id="region" className="w-full">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CENTRAL">Central Benton County</SelectItem>
                    <SelectItem value="EAST">Eastern Benton County</SelectItem>
                    <SelectItem value="WEST">Western Benton County</SelectItem>
                    <SelectItem value="NORTH">Northern Benton County</SelectItem>
                    <SelectItem value="SOUTH">Southern Benton County</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button onClick={handleSave} className="ml-auto">
            <Check className="h-4 w-4 mr-2" />
            Save Parameters
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Building Parameters Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-3">
            <p>
              Building parameters are crucial factors in determining the cost. 
              Each combination of building type, quality, and condition affects the final cost calculation.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1">Building Type</h4>
                <p className="text-blue-700 text-xs">
                  Defines the primary use and structure type of the building, which determines the base cost matrix used.
                </p>
              </div>
              
              <div className="bg-green-50 p-3 rounded-md border border-green-200">
                <h4 className="font-medium text-green-800 mb-1">Quality</h4>
                <p className="text-green-700 text-xs">
                  Reflects the quality of materials and craftsmanship, which affects the cost multiplier.
                </p>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-md border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-1">Condition</h4>
                <p className="text-purple-700 text-xs">
                  Indicates the current state of the building, affecting depreciation and current value.
                </p>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-1">Region</h4>
                <p className="text-amber-700 text-xs">
                  Geographic location within Benton County, which affects regional cost adjustments.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Calculation Step Component
const CalculationStep: React.FC = () => {
  const { state, updateState, addDataSnapshot } = useDataFlow();
  const { toast } = useToast();
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  
  const handleCalculate = () => {
    if (!state.propertyId || !state.buildingType || !state.region) {
      toast({
        title: 'Missing Information',
        description: 'Please complete the previous steps before calculating costs.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsCalculating(true);
    
    // Simulate calculation process
    setTimeout(() => {
      // Generate a calculation result
      const calculationId = `calc-${Date.now()}`;
      const calculationResults = {
        id: calculationId,
        timestamp: new Date().toISOString(),
        propertyId: state.propertyId,
        buildingType: state.buildingType,
        region: state.region,
        quality: state.quality,
        condition: state.condition,
        baseCost: 125.50, // $ per square foot
        adjustedCost: calculateAdjustedCost(),
        totalCost: calculateTotalCost(),
        confidenceLevel: 'high',
        factors: {
          regionFactor: getRegionFactor(state.region),
          qualityFactor: getQualityFactor(state.quality),
          conditionFactor: getConditionFactor(state.condition),
        }
      };
      
      // Update state with calculation results
      updateState({
        calculationId,
        calculationResults,
      });
      
      // Add data snapshot
      addDataSnapshot({
        id: `snap-${Date.now()}`,
        data: calculationResults,
        source: 'calculation-engine',
        operation: 'calculate',
      });
      
      setIsCalculating(false);
      setCalculationComplete(true);
      
      toast({
        title: 'Calculation Complete',
        description: 'The building cost calculation has been completed successfully.',
      });
    }, 2000);
  };
  
  // Helper functions for calculation
  const getRegionFactor = (region: string | null | undefined): number => {
    const factors: Record<string, number> = {
      CENTRAL: 1.0,
      EAST: 0.95,
      WEST: 1.05,
      NORTH: 1.02,
      SOUTH: 0.98,
    };
    return factors[region || 'CENTRAL'] || 1.0;
  };
  
  const getQualityFactor = (quality: string | null | undefined): number => {
    const factors: Record<string, number> = {
      LOW: 0.85,
      AVG: 1.0,
      GOOD: 1.15,
      HIGH: 1.30,
      PREM: 1.50,
    };
    return factors[quality || 'AVG'] || 1.0;
  };
  
  const getConditionFactor = (condition: string | null | undefined): number => {
    const factors: Record<string, number> = {
      POOR: 0.75,
      FAIR: 0.9,
      AVG: 1.0,
      GOOD: 1.1,
      EXC: 1.2,
    };
    return factors[condition || 'AVG'] || 1.0;
  };
  
  const calculateAdjustedCost = (): number => {
    const baseCost = 125.50; // $ per square foot
    const regionFactor = getRegionFactor(state.region);
    const qualityFactor = getQualityFactor(state.quality);
    const conditionFactor = getConditionFactor(state.condition);
    
    return baseCost * regionFactor * qualityFactor * conditionFactor;
  };
  
  const calculateTotalCost = (): number => {
    const adjustedCost = calculateAdjustedCost();
    const squareFootage = 2500; // Default value
    
    return adjustedCost * squareFootage;
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Cost Calculation
          </CardTitle>
          <CardDescription>
            Run the calculation with selected property and building parameters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium mb-3">Calculation Parameters Summary</h3>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Property</Label>
                  <p className="font-medium">
                    {state.propertyDetails?.name || 'No property selected'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Building Type</Label>
                    <p className="font-medium">
                      {state.buildingTypeDetails?.name || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">Region</Label>
                    <p className="font-medium">
                      {state.regionDetails?.name || 'Not specified'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Quality</Label>
                    <p className="font-medium">
                      {state.qualityDetails?.name || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-gray-500">Condition</Label>
                    <p className="font-medium">
                      {state.conditionDetails?.name || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button 
                onClick={handleCalculate}
                disabled={isCalculating || calculationComplete}
                className="min-w-[200px]"
              >
                {isCalculating ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    Calculating...
                  </>
                ) : calculationComplete ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Calculation Complete
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Run Calculation
                  </>
                )}
              </Button>
            </div>
            
            {calculationComplete && state.calculationResults && (
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-3">Preliminary Results</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Base Cost (per sq ft):</span>
                    <span className="font-medium">${state.calculationResults.baseCost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-blue-700">Adjusted Cost (per sq ft):</span>
                    <span className="font-medium">${state.calculationResults.adjustedCost.toFixed(2)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg">
                    <span className="text-blue-800 font-medium">Total Building Cost:</span>
                    <span className="font-bold">${state.calculationResults.totalCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Results Step Component
const ResultsStep: React.FC = () => {
  const { state } = useDataFlow();
  const [showDetails, setShowDetails] = useState(false);
  
  if (!state.calculationResults) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Calculation Results</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Please complete the calculation step before viewing results.
          Go back to the previous step and run the calculation.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LineChart className="h-5 w-5 text-blue-500" />
            Calculation Results
          </CardTitle>
          <CardDescription>
            Detailed breakdown of the building cost calculation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <h2 className="text-xl font-medium text-blue-800 mb-2">Total Building Cost</h2>
              <div className="text-3xl font-bold text-blue-900">
                ${state.calculationResults.totalCost.toLocaleString()}
              </div>
              <p className="text-blue-700 mt-2">
                Based on {state.buildingTypeDetails?.name} in {state.regionDetails?.name}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gray-50 shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Base Cost</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">
                    ${state.calculationResults.baseCost.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">per square foot</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50 shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Adjusted Cost</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold">
                    ${state.calculationResults.adjustedCost.toFixed(2)}
                  </div>
                  <p className="text-xs text-gray-500">per square foot</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50 shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm">Confidence Level</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl font-bold capitalize">
                    {state.calculationResults.confidenceLevel}
                  </div>
                  <p className="text-xs text-gray-500">based on data quality</p>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}
            </Button>
            
            {showDetails && (
              <div className="space-y-4">
                <h3 className="font-medium">Adjustment Factors</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Region Factor</span>
                      <span className="font-medium">{state.calculationResults.factors.regionFactor.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${state.calculationResults.factors.regionFactor * 50}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Quality Factor</span>
                      <span className="font-medium">{state.calculationResults.factors.qualityFactor.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${state.calculationResults.factors.qualityFactor * 50}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Condition Factor</span>
                      <span className="font-medium">{state.calculationResults.factors.conditionFactor.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${state.calculationResults.factors.conditionFactor * 50}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Save & Export Step Component
const SaveExportStep: React.FC = () => {
  const { state, addDataSnapshot } = useDataFlow();
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [projectName, setProjectName] = useState<string>(`Building Cost Calculation - ${new Date().toLocaleDateString()}`);
  
  if (!state.calculationResults) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Results to Save</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Please complete the calculation process before attempting to save or export results.
        </p>
      </div>
    );
  }
  
  const handleSave = () => {
    if (!projectName.trim()) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a name for this calculation project.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSaving(true);
    
    // Simulate saving process
    setTimeout(() => {
      // Add data snapshot for the save operation
      addDataSnapshot({
        id: `save-${Date.now()}`,
        data: {
          calculationId: state.calculationId,
          projectName,
          savedAt: new Date().toISOString(),
        },
        source: 'save-system',
        operation: 'create',
      });
      
      setIsSaving(false);
      
      toast({
        title: 'Project Saved',
        description: `"${projectName}" has been saved to your projects.`,
      });
    }, 1500);
  };
  
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      // Add data snapshot for the export operation
      addDataSnapshot({
        id: `export-${Date.now()}`,
        data: {
          calculationId: state.calculationId,
          projectName,
          format: exportFormat,
          exportedAt: new Date().toISOString(),
        },
        source: 'export-system',
        operation: 'export',
      });
      
      setIsExporting(false);
      
      toast({
        title: 'Export Complete',
        description: `Project exported as ${exportFormat.toUpperCase()} file.`,
      });
    }, 2000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Save className="h-5 w-5 text-blue-500" />
            Save Project
          </CardTitle>
          <CardDescription>
            Save this calculation to your projects for future reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input 
                id="projectName" 
                value={projectName} 
                onChange={(e) => setProjectName(e.target.value)} 
                placeholder="Enter a name for this calculation"
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Project
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-500" />
            Export Results
          </CardTitle>
          <CardDescription>
            Export the calculation results in various formats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="exportFormat">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="exportFormat" className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleExport} disabled={isExporting} variant="outline">
                {isExporting ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-pulse" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export as {exportFormat.toUpperCase()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-500" />
            Share Results
          </CardTitle>
          <CardDescription>
            Share this calculation with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="shareLink">Share Link</Label>
              <div className="flex gap-2">
                <Input 
                  id="shareLink" 
                  value={`https://terrabuild.benton-county.gov/shared/${state.calculationId}`} 
                  readOnly 
                  className="flex-1"
                />
                <Button variant="outline" onClick={() => {
                  toast({
                    title: 'Link Copied',
                    description: 'Share link has been copied to clipboard.',
                  });
                }}>
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Step Content Wrapper Component
const StepContent: React.FC = () => {
  const { useWorkflow } = require('./workflow');
  const { currentStep } = useWorkflow();
  
  switch (currentStep) {
    case 'property':
      return <PropertySelectionStep />;
    case 'parameters':
      return <BuildingParametersStep />;
    case 'calculation':
      return <CalculationStep />;
    case 'results':
      return <ResultsStep />;
    case 'save':
      return <SaveExportStep />;
    default:
      return (
        <div className="text-center p-8">
          <p className="text-gray-500">Unknown step</p>
        </div>
      );
  }
};

// Enhanced Calculator Page Component
const EnhancedCalculatorPageV2: React.FC = () => {
  return (
    <MainLayout
      pageTitle="Building Cost Calculator"
      pageDescription="Calculate building costs based on property characteristics, building type, and regional factors."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Tools", href: "#" },
        { label: "Cost Calculator", href: "/calculator" }
      ]}
    >
      <div className="space-y-6">
        <DataFlowWorkflow
          workflowId="cost-calculator-v2"
          steps={calculatorWorkflowSteps}
          initialStep="property"
          title="Building Cost Calculator"
          description="Calculate building costs in Benton County using official data and regional adjustments"
          showDataFlowVisualizer={true}
          variant="default"
        />
      </div>
    </MainLayout>
  );
};

export default EnhancedCalculatorPageV2;