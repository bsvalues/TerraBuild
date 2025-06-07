/**
 * Simple Building Cost Calculator Component
 * 
 * This component provides a simplified interface for calculating building costs
 * with offline support. It works even when Supabase is unavailable.
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Building, Calculator, Download, FilePlus, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedSupabase } from '@/components/supabase/EnhancedSupabaseProvider';
import { localDB } from '@/lib/utils/localDatabase';

// Building types
const BUILDING_TYPES = [
  { id: 'RES', label: 'Residential', baseRate: 120 },
  { id: 'COMM', label: 'Commercial', baseRate: 150 },
  { id: 'IND', label: 'Industrial', baseRate: 135 },
  { id: 'AGR', label: 'Agricultural', baseRate: 80 },
  { id: 'INST', label: 'Institutional', baseRate: 145 },
];

// Quality levels
const QUALITY_LEVELS = [
  { id: 'ECO', label: 'Economy', factor: 0.8 },
  { id: 'STD', label: 'Standard', factor: 1.0 },
  { id: 'GOOD', label: 'Good', factor: 1.2 },
  { id: 'HIGH', label: 'High', factor: 1.5 },
  { id: 'LUX', label: 'Luxury', factor: 2.0 },
  { id: 'CUST', label: 'Custom', factor: 2.5 },
];

// Condition options
const CONDITION_OPTIONS = [
  { id: 'POOR', label: 'Poor', factor: 0.7 },
  { id: 'FAIR', label: 'Fair', factor: 0.9 },
  { id: 'AVG', label: 'Average', factor: 1.0 },
  { id: 'GOOD', label: 'Good', factor: 1.1 },
  { id: 'EXC', label: 'Excellent', factor: 1.2 },
];

// Region codes and multipliers
const REGIONS = [
  { id: 'BC-CENTRAL', label: 'Benton County - Central', factor: 1.0 },
  { id: 'BC-NORTH', label: 'Benton County - North', factor: 1.05 },
  { id: 'BC-SOUTH', label: 'Benton County - South', factor: 0.95 },
  { id: 'BC-EAST', label: 'Benton County - East', factor: 0.98 },
  { id: 'BC-WEST', label: 'Benton County - West', factor: 1.02 },
  { id: 'BC-RICHLAND', label: 'Benton County - Richland', factor: 1.08 },
  { id: 'BC-KENNEWICK', label: 'Benton County - Kennewick', factor: 1.06 },
  { id: 'BC-PROSSER', label: 'Benton County - Prosser', factor: 0.93 },
  // Arkansas regions added for expanded coverage
  { id: 'AR-CENTRAL', label: 'Arkansas - Central', factor: 0.9 },
  { id: 'AR-NORTHWEST', label: 'Arkansas - Northwest', factor: 0.95 },
  { id: 'AR-NORTHEAST', label: 'Arkansas - Northeast', factor: 0.88 },
  { id: 'AR-SOUTHWEST', label: 'Arkansas - Southwest', factor: 0.85 },
  { id: 'AR-SOUTHEAST', label: 'Arkansas - Southeast', factor: 0.82 },
];

// Default values for the calculator
const DEFAULT_VALUES = {
  buildingType: 'RES',
  squareFeet: 2000,
  quality: 'STD',
  condition: 'AVG',
  stories: 1,
  basement: false,
  basementFinished: false,
  yearBuilt: new Date().getFullYear() - 10,
  region: 'BC-CENTRAL',
  garageSize: 0,
  complexity: 50, // On a scale of 0-100
};

// Calculator input and result types
interface CalculatorInputs {
  buildingType: string;
  squareFeet: number;
  quality: string;
  condition: string;
  stories: number;
  basement: boolean;
  basementFinished: boolean;
  yearBuilt: number;
  region: string;
  garageSize: number;
  complexity: number;
}

interface CalculationResult {
  totalCost: number;
  costPerSqFt: number;
  baseRate: number;
  adjustedRate: number;
  areaMultiplier: number;
  qualityFactor: number;
  conditionFactor: number;
  ageFactor: number;
  regionFactor: number;
  complexityFactor: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  calculationDate: string;
  inputValues: CalculatorInputs;
}

// Component props
interface BCBSCostCalculatorSimpleProps {
  onResultSaved?: (result: CalculationResult) => void;
  propertyId?: string;
  initialValues?: Partial<CalculatorInputs>;
  readOnly?: boolean;
}

/**
 * Simple Building Cost Calculator Component
 */
const BCBSCostCalculatorSimple: React.FC<BCBSCostCalculatorSimpleProps> = ({
  onResultSaved,
  propertyId,
  initialValues = {},
  readOnly = false,
}) => {
  // Combine default values with any provided initial values
  const combinedInitialValues = { ...DEFAULT_VALUES, ...initialValues };
  
  // State for calculator inputs
  const [inputs, setInputs] = useState<CalculatorInputs>(combinedInitialValues);
  
  // State for calculation result
  const [result, setResult] = useState<CalculationResult | null>(null);
  
  // State for tracking saved calculations
  const [savedCalculations, setSavedCalculations] = useState<CalculationResult[]>([]);
  
  // State for loading state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Supabase context for online/offline status
  const { isOfflineMode, connectionStatus, supabase } = useEnhancedSupabase();
  
  // Load any saved calculations for this property
  useEffect(() => {
    if (propertyId) {
      loadSavedCalculations();
    }
  }, [propertyId]);
  
  // Handle input changes
  const handleInputChange = (
    name: keyof CalculatorInputs, 
    value: any
  ) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
    
    // If basement is false, basementFinished should also be false
    if (name === 'basement' && value === false) {
      setInputs((prev) => ({ ...prev, [name]: value, basementFinished: false }));
    }
  };
  
  // Load saved calculations
  const loadSavedCalculations = async () => {
    if (!propertyId) return;
    
    try {
      setIsLoading(true);
      
      if (isOfflineMode) {
        // Try to load from local database
        const { data, error } = await localDB.query<CalculationResult>(
          'calculations',
          (item) => item.inputValues.propertyId === propertyId
        );
        
        if (error) {
          throw error;
        }
        
        setSavedCalculations(data || []);
      } else if (supabase) {
        // Try to load from Supabase
        const { data, error } = await supabase
          .from('calculations')
          .select('*')
          .eq('property_id', propertyId);
        
        if (error) {
          throw error;
        }
        
        // Convert from database format to our format
        const formattedData = data.map((item) => ({
          ...item.result,
          calculationDate: item.created_at,
          inputValues: {
            ...item.input_values,
            propertyId: item.property_id,
          },
        }));
        
        setSavedCalculations(formattedData);
      }
    } catch (error) {
      console.error('Error loading saved calculations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load saved calculations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate cost
  const calculateCost = () => {
    try {
      // Lookup factors from the constants
      const buildingTypeInfo = BUILDING_TYPES.find((type) => type.id === inputs.buildingType)!;
      const qualityInfo = QUALITY_LEVELS.find((q) => q.id === inputs.quality)!;
      const conditionInfo = CONDITION_OPTIONS.find((c) => c.id === inputs.condition)!;
      const regionInfo = REGIONS.find((r) => r.id === inputs.region)!;
      
      // Base calculations
      const baseRate = buildingTypeInfo.baseRate;
      const qualityFactor = qualityInfo.factor;
      const conditionFactor = conditionInfo.factor;
      const regionFactor = regionInfo.factor;
      
      // Calculate age factor (newer buildings cost more)
      const age = new Date().getFullYear() - inputs.yearBuilt;
      const ageFactor = calculateAgeFactor(age);
      
      // More or less complex than average (1.0)
      const complexityFactor = 0.8 + (inputs.complexity / 100) * 0.4; // Range from 0.8 to 1.2
      
      // Area scale factor (larger buildings cost less per square foot)
      const areaMultiplier = calculateAreaMultiplier(inputs.squareFeet);
      
      // Additional factors
      let totalSqFt = inputs.squareFeet;
      
      // Add basement area if present
      if (inputs.basement) {
        if (inputs.basementFinished) {
          totalSqFt += inputs.squareFeet / inputs.stories * 0.9; // Finished basement at 90% value
        } else {
          totalSqFt += inputs.squareFeet / inputs.stories * 0.5; // Unfinished basement at 50% value
        }
      }
      
      // Add garage if present
      if (inputs.garageSize > 0) {
        totalSqFt += inputs.garageSize * 0.6; // Garage at 60% value
      }
      
      // Multi-story adjustment
      const storyFactor = 1 - ((inputs.stories - 1) * 0.05); // Each additional story reduces cost/sqft by 5%
      
      // Calculate the adjusted rate
      const adjustedRate = baseRate * qualityFactor * conditionFactor * regionFactor * 
                         ageFactor * complexityFactor * storyFactor;
      
      // Final calculations
      const costPerSqFt = adjustedRate * areaMultiplier;
      const totalCost = totalSqFt * costPerSqFt;
      
      // Determine confidence level
      const confidenceLevel = determineConfidenceLevel(inputs);
      
      // Create result object
      const calculationResult: CalculationResult = {
        totalCost,
        costPerSqFt,
        baseRate,
        adjustedRate,
        qualityFactor,
        conditionFactor,
        regionFactor,
        ageFactor,
        complexityFactor,
        areaMultiplier,
        confidenceLevel,
        calculationDate: new Date().toISOString(),
        inputValues: { ...inputs },
      };
      
      setResult(calculationResult);
      return calculationResult;
    } catch (error) {
      console.error('Error in calculation:', error);
      toast({
        title: 'Calculation Error',
        description: error instanceof Error ? error.message : 'An error occurred during calculation',
        variant: 'destructive',
      });
      return null;
    }
  };
  
  // Save calculation result
  const saveCalculation = async () => {
    if (!result) {
      toast({
        title: 'No Calculation',
        description: 'Please calculate the cost first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const calculationToSave = {
        ...result,
        inputValues: {
          ...result.inputValues,
          propertyId: propertyId || 'unknown',
        },
      };
      
      if (isOfflineMode) {
        // Save to local database
        const { data, error } = await localDB.storeWithSync(
          'calculations', 
          {
            calculationId: `calc_${Date.now()}`,
            propertyId: propertyId || 'unknown',
            date: new Date().toISOString(),
            result: calculationToSave,
          }
        );
        
        if (error) {
          throw error;
        }
        
        setSavedCalculations((prev) => [...prev, calculationToSave]);
        
        toast({
          title: 'Calculation Saved Locally',
          description: 'The calculation has been saved to your device and will sync when online',
        });
      } else if (supabase) {
        // Save to Supabase
        const { error } = await supabase
          .from('calculations')
          .insert({
            property_id: propertyId || 'unknown',
            input_values: result.inputValues,
            result: {
              totalCost: result.totalCost,
              costPerSqFt: result.costPerSqFt,
              baseRate: result.baseRate,
              adjustedRate: result.adjustedRate,
              areaMultiplier: result.areaMultiplier,
              qualityFactor: result.qualityFactor,
              conditionFactor: result.conditionFactor,
              ageFactor: result.ageFactor,
              regionFactor: result.regionFactor,
              complexityFactor: result.complexityFactor,
              confidenceLevel: result.confidenceLevel,
            },
          });
        
        if (error) {
          throw error;
        }
        
        setSavedCalculations((prev) => [...prev, calculationToSave]);
        
        toast({
          title: 'Calculation Saved',
          description: 'The calculation has been saved to the database',
        });
      }
      
      // Notify parent if callback provided
      if (onResultSaved) {
        onResultSaved(calculationToSave);
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      toast({
        title: 'Save Error',
        description: error instanceof Error ? error.message : 'Failed to save calculation',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Export calculation as JSON
  const exportCalculation = () => {
    if (!result) {
      toast({
        title: 'No Calculation',
        description: 'Please calculate the cost first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const dataStr = JSON.stringify(result, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileDefaultName = `cost-calculation-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (error) {
      console.error('Error exporting calculation:', error);
      toast({
        title: 'Export Error',
        description: error instanceof Error ? error.message : 'Failed to export calculation',
        variant: 'destructive',
      });
    }
  };
  
  // Helper functions for calculations
  
  // Calculate area multiplier (larger buildings cost less per square foot)
  const calculateAreaMultiplier = (squareFeet: number): number => {
    if (squareFeet <= 1000) return 1.1;
    if (squareFeet <= 2000) return 1.0;
    if (squareFeet <= 3000) return 0.95;
    if (squareFeet <= 4000) return 0.9;
    if (squareFeet <= 5000) return 0.85;
    return 0.8; // For buildings larger than 5000 sq ft
  };
  
  // Calculate age factor (newer buildings cost more to replace)
  const calculateAgeFactor = (age: number): number => {
    if (age <= 1) return 1.0; // New building
    if (age <= 5) return 0.98;
    if (age <= 10) return 0.95;
    if (age <= 20) return 0.9;
    if (age <= 30) return 0.85;
    if (age <= 50) return 0.8;
    return 0.75; // For buildings older than 50 years
  };
  
  // Determine the confidence level of the calculation
  const determineConfidenceLevel = (inputs: CalculatorInputs): 'LOW' | 'MEDIUM' | 'HIGH' => {
    // Count how many fields have values
    const filledFields = Object.values(inputs).filter(
      (value) => value !== null && value !== undefined && value !== ''
    ).length;
    
    // Calculate the percentage of fields filled
    const percentFilled = filledFields / Object.keys(inputs).length;
    
    // Determine confidence level based on percentage of fields filled
    if (percentFilled >= 0.9) return 'HIGH';
    if (percentFilled >= 0.7) return 'MEDIUM';
    return 'LOW';
  };
  
  // Render the calculator
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Building Cost Calculator
          </CardTitle>
          <CardDescription>
            Calculate the estimated cost of a building based on its characteristics.
            {isOfflineMode && (
              <div className="mt-2 text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span>Running in offline mode. Calculations will be saved locally.</span>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Building Type and Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="buildingType">Building Type</Label>
              <Select
                disabled={readOnly}
                value={inputs.buildingType}
                onValueChange={(value) => handleInputChange('buildingType', value)}
              >
                <SelectTrigger id="buildingType">
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  {BUILDING_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                disabled={readOnly}
                value={inputs.region}
                onValueChange={(value) => handleInputChange('region', value)}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Square Feet and Stories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="squareFeet">Square Feet</Label>
              <Input
                id="squareFeet"
                type="number"
                disabled={readOnly}
                value={inputs.squareFeet}
                onChange={(e) => handleInputChange('squareFeet', Number(e.target.value))}
                min={100}
                max={100000}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stories">Number of Stories</Label>
              <Select
                disabled={readOnly}
                value={inputs.stories.toString()}
                onValueChange={(value) => handleInputChange('stories', Number(value))}
              >
                <SelectTrigger id="stories">
                  <SelectValue placeholder="Select number of stories" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Quality and Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select
                disabled={readOnly}
                value={inputs.quality}
                onValueChange={(value) => handleInputChange('quality', value)}
              >
                <SelectTrigger id="quality">
                  <SelectValue placeholder="Select quality level" />
                </SelectTrigger>
                <SelectContent>
                  {QUALITY_LEVELS.map((quality) => (
                    <SelectItem key={quality.id} value={quality.id}>
                      {quality.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                disabled={readOnly}
                value={inputs.condition}
                onValueChange={(value) => handleInputChange('condition', value)}
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((condition) => (
                    <SelectItem key={condition.id} value={condition.id}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Year Built and Garage Size */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearBuilt">Year Built</Label>
              <Input
                id="yearBuilt"
                type="number"
                disabled={readOnly}
                value={inputs.yearBuilt}
                onChange={(e) => handleInputChange('yearBuilt', Number(e.target.value))}
                min={1800}
                max={new Date().getFullYear()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="garageSize">Garage Size (sq ft)</Label>
              <Input
                id="garageSize"
                type="number"
                disabled={readOnly}
                value={inputs.garageSize}
                onChange={(e) => handleInputChange('garageSize', Number(e.target.value))}
                min={0}
                max={2000}
              />
            </div>
          </div>
          
          {/* Basement Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="basement"
                disabled={readOnly}
                checked={inputs.basement}
                onCheckedChange={(checked) => handleInputChange('basement', checked)}
              />
              <Label htmlFor="basement">Has Basement</Label>
            </div>
            {inputs.basement && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="basementFinished"
                  disabled={readOnly}
                  checked={inputs.basementFinished}
                  onCheckedChange={(checked) => handleInputChange('basementFinished', checked)}
                />
                <Label htmlFor="basementFinished">Finished Basement</Label>
              </div>
            )}
          </div>
          
          {/* Complexity Slider */}
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label htmlFor="complexity">Complexity</Label>
              <span className="text-sm text-gray-500">{inputs.complexity}%</span>
            </div>
            <Slider
              id="complexity"
              disabled={readOnly}
              value={[inputs.complexity]}
              onValueChange={(values) => handleInputChange('complexity', values[0])}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Simple</span>
              <span>Standard</span>
              <span>Complex</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={readOnly}
            onClick={() => setInputs(DEFAULT_VALUES)}
          >
            Reset
          </Button>
          <div className="space-x-2">
            <Button
              type="button"
              disabled={readOnly}
              onClick={calculateCost}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Calculate
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Results Card */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
            <CardDescription>
              Estimated as of {new Date(result.calculationDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium">Total Estimated Cost</p>
                <p className="text-3xl font-bold">
                  ${result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-sm text-gray-500">
                  Confidence: {result.confidenceLevel.toLowerCase()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Cost Per Square Foot</p>
                <p className="text-2xl font-semibold">
                  ${result.costPerSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500">
                  Base rate: ${result.baseRate.toFixed(2)}/sq ft
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Factors table */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Adjustment Factors</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Quality:</span>
                  <span>{result.qualityFactor.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Condition:</span>
                  <span>{result.conditionFactor.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Region:</span>
                  <span>{result.regionFactor.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Age:</span>
                  <span>{result.ageFactor.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Complexity:</span>
                  <span>{result.complexityFactor.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Area:</span>
                  <span>{result.areaMultiplier.toFixed(2)}x</span>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={exportCalculation}
              disabled={readOnly}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={saveCalculation}
              disabled={isSaving || readOnly}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Calculation'}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Saved Calculations */}
      {propertyId && savedCalculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus className="h-5 w-5" />
              Saved Calculations
            </CardTitle>
            <CardDescription>
              Previous cost calculations for this property
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedCalculations.map((calc, index) => (
                <div
                  key={index}
                  className="border p-4 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex justify-between mb-2">
                    <h3 className="font-medium">
                      {new Date(calc.calculationDate).toLocaleDateString()}
                    </h3>
                    <span className="text-gray-500">
                      {BUILDING_TYPES.find((t) => t.id === calc.inputValues.buildingType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-lg font-bold">
                      ${calc.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    <span>
                      ${calc.costPerSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 })}/sq ft
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {calc.inputValues.squareFeet} sq ft • 
                    {QUALITY_LEVELS.find((q) => q.id === calc.inputValues.quality)?.label} quality • 
                    {REGIONS.find((r) => r.id === calc.inputValues.region)?.label}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BCBSCostCalculatorSimple;