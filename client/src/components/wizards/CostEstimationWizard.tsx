/**
 * Cost Estimation Wizard
 * 
 * An interactive step-by-step wizard that guides users through the process of
 * estimating building costs with detailed explanations and recommendations.
 */

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  ArrowRight, 
  Building, 
  Check, 
  HelpCircle, 
  Info, 
  Save,
  Download,
  AreaChart,
  Home,
  Ruler,
  Calendar,
  MapPin,
  Sparkles,
  ThermometerSnowflake,
  Clipboard,
  ClipboardCheck,
  BarChart,
  RefreshCw
} from 'lucide-react';
import { useEnhancedSupabase } from '@/components/supabase/EnhancedSupabaseProvider';
import { localDB } from '@/lib/utils/localDatabase';
import StepGuidancePanel from './StepGuidancePanel';

// Building types with explanations
const BUILDING_TYPES = [
  { id: 'RES', label: 'Residential', baseRate: 120, icon: <Home className="h-5 w-5" />, 
    description: 'Single-family homes, duplexes, townhouses, and apartment buildings.' },
  { id: 'COMM', label: 'Commercial', baseRate: 150, icon: <Building className="h-5 w-5" />, 
    description: 'Office buildings, retail spaces, restaurants, and hotels.' },
  { id: 'IND', label: 'Industrial', baseRate: 135, icon: <AreaChart className="h-5 w-5" />, 
    description: 'Factories, warehouses, manufacturing facilities, and distribution centers.' },
  { id: 'AGR', label: 'Agricultural', baseRate: 80, icon: <Ruler className="h-5 w-5" />, 
    description: 'Barns, silos, equipment storage, and other farm structures.' },
  { id: 'INST', label: 'Institutional', baseRate: 145, icon: <Building className="h-5 w-5" />, 
    description: 'Schools, hospitals, government buildings, and churches.' },
];

// Quality levels with explanations
const QUALITY_LEVELS = [
  { id: 'ECO', label: 'Economy', factor: 0.8, 
    description: 'Basic construction with minimal features and standard materials.' },
  { id: 'STD', label: 'Standard', factor: 1.0, 
    description: 'Average quality construction with standard features and materials.' },
  { id: 'GOOD', label: 'Good', factor: 1.2, 
    description: 'Above-average construction with some enhanced features and better materials.' },
  { id: 'HIGH', label: 'High', factor: 1.5, 
    description: 'High-quality construction with premium features and materials.' },
  { id: 'LUX', label: 'Luxury', factor: 2.0, 
    description: 'Exceptional quality with custom features and premium materials throughout.' },
  { id: 'CUST', label: 'Custom', factor: 2.5, 
    description: 'Fully customized construction with architectural details and unique features.' },
];

// Condition options with explanations
const CONDITION_OPTIONS = [
  { id: 'POOR', label: 'Poor', factor: 0.7, 
    description: 'Significant wear with major systems needing replacement.' },
  { id: 'FAIR', label: 'Fair', factor: 0.9, 
    description: 'Showing age with some systems needing update or repair.' },
  { id: 'AVG', label: 'Average', factor: 1.0, 
    description: 'Normal wear for age with functioning systems.' },
  { id: 'GOOD', label: 'Good', factor: 1.1, 
    description: 'Well-maintained with updated systems and minimal wear.' },
  { id: 'EXC', label: 'Excellent', factor: 1.2, 
    description: 'Like new condition with all systems recently updated.' },
];

// Region codes and multipliers with explanations
const REGIONS = [
  { id: 'BC-CENTRAL', label: 'Benton County - Central', factor: 1.0, 
    description: 'Average construction costs for the central region of Benton County.' },
  { id: 'BC-NORTH', label: 'Benton County - North', factor: 1.05, 
    description: 'Slightly higher costs due to terrain and access in the northern region.' },
  { id: 'BC-SOUTH', label: 'Benton County - South', factor: 0.95, 
    description: 'Slightly lower costs in the more accessible southern region.' },
  { id: 'BC-EAST', label: 'Benton County - East', factor: 0.98, 
    description: 'Near average costs with good contractor availability in the eastern region.' },
  { id: 'BC-WEST', label: 'Benton County - West', factor: 1.02, 
    description: 'Moderately higher costs due to location factors in the western region.' },
  { id: 'BC-RICHLAND', label: 'Benton County - Richland', factor: 1.08, 
    description: 'Higher costs reflecting urban premium in the Richland area.' },
  { id: 'BC-KENNEWICK', label: 'Benton County - Kennewick', factor: 1.06, 
    description: 'Higher costs reflecting urban premium in the Kennewick area.' },
  { id: 'BC-PROSSER', label: 'Benton County - Prosser', factor: 0.93, 
    description: 'Lower costs in the rural Prosser area.' },
  // Arkansas regions
  { id: 'AR-CENTRAL', label: 'Arkansas - Central', factor: 0.9, 
    description: 'Central Arkansas region including Little Rock area.' },
  { id: 'AR-NORTHWEST', label: 'Arkansas - Northwest', factor: 0.95, 
    description: 'Northwest Arkansas including Fayetteville and Bentonville.' },
  { id: 'AR-NORTHEAST', label: 'Arkansas - Northeast', factor: 0.88, 
    description: 'Northeast Arkansas including Jonesboro area.' },
  { id: 'AR-SOUTHWEST', label: 'Arkansas - Southwest', factor: 0.85, 
    description: 'Southwest Arkansas including Texarkana region.' },
  { id: 'AR-SOUTHEAST', label: 'Arkansas - Southeast', factor: 0.82, 
    description: 'Southeast Arkansas including Pine Bluff area.' },
];

// Roofing types
const ROOFING_TYPES = [
  { id: 'ASPHALT', label: 'Asphalt Shingles', factor: 1.0, 
    description: 'Standard and most common roofing material.' },
  { id: 'METAL', label: 'Metal Roof', factor: 1.15, 
    description: 'Durable and long-lasting metal panels or shingles.' },
  { id: 'TILE', label: 'Clay/Concrete Tile', factor: 1.3, 
    description: 'Heavy, decorative tiles with excellent durability.' },
  { id: 'SLATE', label: 'Slate', factor: 1.5, 
    description: 'Premium natural stone roofing with longest lifespan.' },
  { id: 'WOOD', label: 'Wood Shakes', factor: 1.2, 
    description: 'Traditional wood shingles with natural appearance.' },
  { id: 'FLAT', label: 'Flat/Built-up', factor: 0.95, 
    description: 'Membrane or built-up roofing for flat or low-slope roofs.' },
];

// Exterior types
const EXTERIOR_TYPES = [
  { id: 'VINYL', label: 'Vinyl Siding', factor: 0.9, 
    description: 'Economical and low-maintenance plastic siding.' },
  { id: 'WOOD', label: 'Wood Siding', factor: 1.0, 
    description: 'Traditional wood clapboard or shingles.' },
  { id: 'BRICK', label: 'Brick', factor: 1.2, 
    description: 'Classic brick veneer with excellent durability.' },
  { id: 'STONE', label: 'Stone', factor: 1.35, 
    description: 'Premium natural or manufactured stone exterior.' },
  { id: 'STUCCO', label: 'Stucco', factor: 1.1, 
    description: 'Cement-based coating with smooth or textured finish.' },
  { id: 'FIBER', label: 'Fiber Cement', factor: 1.05, 
    description: 'Durable composite siding resembling wood.' },
  { id: 'METAL', label: 'Metal', factor: 1.0, 
    description: 'Metal panels or siding used primarily on industrial buildings.' },
];

// HVAC types
const HVAC_TYPES = [
  { id: 'NONE', label: 'None', factor: 0.8, 
    description: 'No central heating or cooling systems.' },
  { id: 'BASEB', label: 'Baseboard/Space Heaters', factor: 0.85, 
    description: 'Electric or hydronic baseboard heating without central cooling.' },
  { id: 'FORCED', label: 'Forced Air', factor: 1.0, 
    description: 'Standard central forced air heating and cooling system.' },
  { id: 'HEAT_PUMP', label: 'Heat Pump', factor: 1.1, 
    description: 'Energy-efficient heat pump system for heating and cooling.' },
  { id: 'RADIANT', label: 'Radiant Heat', factor: 1.15, 
    description: 'In-floor radiant heating system for comfortable heat distribution.' },
  { id: 'GEOTHERM', label: 'Geothermal', factor: 1.25, 
    description: 'Premium geothermal heating and cooling system.' },
  { id: 'MULTI', label: 'Multi-zone', factor: 1.2, 
    description: 'Multiple zone system with separate temperature controls.' },
];

// Wizard steps
enum WizardStep {
  WELCOME = 0,
  BUILDING_TYPE = 1,
  BUILDING_SIZE = 2,
  QUALITY = 3,
  CONDITION = 4,
  LOCATION = 5,
  CONSTRUCTION = 6,
  DETAILS = 7,
  RESULTS = 8,
  SAVE = 9,
}

// Default calculator input values
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
  complexity: 50,
  roofType: 'ASPHALT',
  exteriorType: 'VINYL',
  hvacType: 'FORCED',
  fireplaces: 0,
  bathrooms: 2,
  projectName: '',
  notes: '',
};

// Input types
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
  roofType: string;
  exteriorType: string;
  hvacType: string;
  fireplaces: number;
  bathrooms: number;
  projectName: string;
  notes: string;
}

// Result types
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
  roofFactor: number;
  exteriorFactor: number;
  hvacFactor: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  calculationDate: string;
  inputValues: CalculatorInputs;
  breakdownCosts: {
    foundation: number;
    framing: number;
    exterior: number;
    roofing: number;
    interiorFinish: number;
    plumbing: number;
    electrical: number;
    hvac: number;
    specialFeatures: number;
  };
}

// Component props
interface CostEstimationWizardProps {
  onSave?: (result: CalculationResult) => void;
  onExit?: () => void;
  propertyId?: string;
  initialValues?: Partial<CalculatorInputs>;
}

/**
 * Cost Estimation Wizard Component
 */
const CostEstimationWizard: React.FC<CostEstimationWizardProps> = ({
  onSave,
  onExit,
  propertyId,
  initialValues = {},
}) => {
  // Combined initial values
  const combinedInitialValues = { ...DEFAULT_VALUES, ...initialValues };
  
  // State for wizard
  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.WELCOME);
  const [inputs, setInputs] = useState<CalculatorInputs>(combinedInitialValues);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [estimateHistory, setEstimateHistory] = useState<CalculationResult[]>([]);
  
  // Supabase hooks
  const { isOfflineMode, supabase } = useEnhancedSupabase();
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Load any saved estimates for comparison if property ID is provided
  useEffect(() => {
    if (propertyId) {
      loadPreviousEstimates();
    }
  }, [propertyId]);
  
  // Load previous estimates
  const loadPreviousEstimates = async () => {
    if (!propertyId) return;
    
    try {
      if (isOfflineMode) {
        // Load from local database
        const { data, error } = await localDB.query<any>(
          'calculations',
          (item) => item.propertyId === propertyId
        );
        
        if (error) throw error;
        
        if (data && data.length) {
          setEstimateHistory(data.map((item: any) => item.result));
        }
      } else if (supabase) {
        // Load from Supabase
        const { data, error } = await supabase
          .from('calculations')
          .select('*')
          .eq('property_id', propertyId);
        
        if (error) throw error;
        
        if (data && data.length) {
          setEstimateHistory(data.map(item => ({
            ...item.result,
            inputValues: item.input_values,
            calculationDate: item.calculation_date,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading previous estimates:', error);
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    const totalSteps = Object.keys(WizardStep).length / 2; // Enum has twice as many entries
    return Math.round((currentStep / totalSteps) * 100);
  };
  
  // Go to next step
  const nextStep = () => {
    if (currentStep < WizardStep.SAVE) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Go to previous step
  const prevStep = () => {
    if (currentStep > WizardStep.WELCOME) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };
  
  // Go to specific step
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
    window.scrollTo(0, 0);
  };
  
  // Handle input changes
  const handleInputChange = (name: keyof CalculatorInputs, value: any) => {
    setInputs(prev => ({ ...prev, [name]: value }));
    
    // Special handling for basement
    if (name === 'basement' && value === false) {
      setInputs(prev => ({ ...prev, basementFinished: false }));
    }
  };
  
  // Calculate the cost estimate
  const calculateEstimate = () => {
    try {
      // Get values from inputs and look up the corresponding factors
      const buildingTypeInfo = BUILDING_TYPES.find(t => t.id === inputs.buildingType)!;
      const qualityInfo = QUALITY_LEVELS.find(q => q.id === inputs.quality)!;
      const conditionInfo = CONDITION_OPTIONS.find(c => c.id === inputs.condition)!;
      const regionInfo = REGIONS.find(r => r.id === inputs.region)!;
      const roofInfo = ROOFING_TYPES.find(r => r.id === inputs.roofType)!;
      const exteriorInfo = EXTERIOR_TYPES.find(e => e.id === inputs.exteriorType)!;
      const hvacInfo = HVAC_TYPES.find(h => h.id === inputs.hvacType)!;
      
      // Base rate and adjustment factors
      const baseRate = buildingTypeInfo.baseRate;
      const qualityFactor = qualityInfo.factor;
      const conditionFactor = conditionInfo.factor;
      const regionFactor = regionInfo.factor;
      const roofFactor = roofInfo.factor;
      const exteriorFactor = exteriorInfo.factor;
      const hvacFactor = hvacInfo.factor;
      
      // Age factor calculation
      const age = new Date().getFullYear() - inputs.yearBuilt;
      const ageFactor = calculateAgeFactor(age);
      
      // Complexity factor - ranges from 0.8 to 1.2
      const complexityFactor = 0.8 + (inputs.complexity / 100) * 0.4;
      
      // Area scale factor - larger buildings cost less per square foot
      const areaMultiplier = calculateAreaMultiplier(inputs.squareFeet);
      
      // Calculate total square footage including all spaces
      let totalSqFt = inputs.squareFeet;
      
      // Add basement if present
      if (inputs.basement) {
        const basementSqFt = inputs.squareFeet / inputs.stories;
        if (inputs.basementFinished) {
          totalSqFt += basementSqFt * 0.9; // Finished basement at 90% value
        } else {
          totalSqFt += basementSqFt * 0.5; // Unfinished basement at 50% value
        }
      }
      
      // Add garage if present
      if (inputs.garageSize > 0) {
        totalSqFt += inputs.garageSize * 0.6; // Garage at 60% value
      }
      
      // Story adjustment - multi-story buildings cost less per sqft
      const storyFactor = 1 - ((inputs.stories - 1) * 0.05);
      
      // Special features adjustment
      const fireplaceFactor = 1 + (inputs.fireplaces * 0.02); // Each fireplace adds 2%
      const bathroomFactor = 1 + (Math.max(0, inputs.bathrooms - 1) * 0.03); // Each bathroom beyond the first adds 3%
      
      // Calculate the final adjusted rate
      const adjustedRate = baseRate * qualityFactor * conditionFactor * regionFactor 
                         * ageFactor * complexityFactor * storyFactor
                         * (roofFactor * 0.1 + 0.9) // Roof affects 10% of the total
                         * (exteriorFactor * 0.15 + 0.85) // Exterior affects 15% of the total
                         * (hvacFactor * 0.08 + 0.92) // HVAC affects 8% of the total
                         * fireplaceFactor * bathroomFactor;
      
      // Calculate cost per square foot and total cost
      const costPerSqFt = adjustedRate * areaMultiplier;
      const totalCost = totalSqFt * costPerSqFt;
      
      // Break down the cost by category
      const totalSqFtOriginal = inputs.squareFeet;
      const breakdownCosts = {
        foundation: totalCost * 0.12, // 12% for foundation
        framing: totalCost * 0.20, // 20% for framing
        exterior: totalCost * 0.15, // 15% for exterior finishes
        roofing: totalCost * 0.10, // 10% for roofing
        interiorFinish: totalCost * 0.20, // 20% for interior finishes
        plumbing: totalCost * 0.08, // 8% for plumbing
        electrical: totalCost * 0.07, // 7% for electrical
        hvac: totalCost * 0.05, // 5% for HVAC
        specialFeatures: totalCost * 0.03, // 3% for special features
      };
      
      // Determine confidence level
      const confidenceLevel = determineConfidenceLevel(inputs);
      
      // Create result object
      const calculationResult: CalculationResult = {
        totalCost,
        costPerSqFt,
        baseRate,
        adjustedRate,
        areaMultiplier,
        qualityFactor,
        conditionFactor,
        ageFactor,
        regionFactor,
        complexityFactor,
        roofFactor,
        exteriorFactor,
        hvacFactor,
        confidenceLevel,
        calculationDate: new Date().toISOString(),
        inputValues: { ...inputs },
        breakdownCosts,
      };
      
      setResult(calculationResult);
      return calculationResult;
    } catch (error) {
      console.error('Error calculating estimate:', error);
      toast({
        title: 'Calculation Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
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
        description: 'Please complete the wizard to calculate an estimate first',
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
          projectName: inputs.projectName,
          notes: inputs.notes,
        }
      };
      
      if (isOfflineMode) {
        // Save to local database
        const { error } = await localDB.storeWithSync(
          'calculations',
          {
            id: `calc_${Date.now()}`,
            propertyId: propertyId || 'unknown',
            date: new Date().toISOString(),
            result: calculationToSave,
          }
        );
        
        if (error) throw error;
        
        toast({
          title: 'Calculation Saved Locally',
          description: 'The calculation has been saved locally and will sync when online',
        });
      } else if (supabase) {
        // Save to Supabase
        const { error } = await supabase
          .from('calculations')
          .insert({
            property_id: propertyId || null,
            calculation_date: new Date().toISOString(),
            building_type: result.inputValues.buildingType,
            square_feet: result.inputValues.squareFeet,
            quality: result.inputValues.quality,
            condition: result.inputValues.condition,
            year_built: result.inputValues.yearBuilt,
            region: result.inputValues.region,
            total_cost: result.totalCost,
            cost_per_sqft: result.costPerSqFt,
            base_rate: result.baseRate,
            adjusted_rate: result.adjustedRate,
            quality_factor: result.qualityFactor,
            condition_factor: result.conditionFactor,
            age_factor: result.ageFactor,
            region_factor: result.regionFactor,
            confidence_level: result.confidenceLevel,
            input_values: result.inputValues,
            result: {
              totalCost: result.totalCost,
              costPerSqFt: result.costPerSqFt,
              breakdownCosts: result.breakdownCosts,
              factors: {
                quality: result.qualityFactor,
                condition: result.conditionFactor,
                age: result.ageFactor,
                region: result.regionFactor,
                complexity: result.complexityFactor,
                roof: result.roofFactor,
                exterior: result.exteriorFactor,
                hvac: result.hvacFactor,
              }
            },
            notes: inputs.notes,
          });
        
        if (error) throw error;
        
        toast({
          title: 'Calculation Saved',
          description: 'The calculation has been saved to the database',
        });
      }
      
      // Notify parent component if callback provided
      if (onSave) {
        onSave(calculationToSave);
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
        description: 'Please complete the wizard to calculate an estimate first',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const dataStr = JSON.stringify(result, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = inputs.projectName
        ? `${inputs.projectName.replace(/\s+/g, '-')}-estimate.json`
        : `cost-estimate-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      toast({
        title: 'Export Complete',
        description: 'The calculation has been exported as JSON',
      });
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
    if (squareFeet <= 7500) return 0.82;
    if (squareFeet <= 10000) return 0.8;
    return 0.78; // For buildings larger than 10,000 sq ft
  };
  
  // Calculate age factor (newer buildings cost more to replace)
  const calculateAgeFactor = (age: number): number => {
    if (age <= 1) return 1.0; // New building
    if (age <= 5) return 0.98;
    if (age <= 10) return 0.95;
    if (age <= 20) return 0.9;
    if (age <= 30) return 0.85;
    if (age <= 40) return 0.82;
    if (age <= 50) return 0.8;
    if (age <= 75) return 0.78;
    return 0.75; // For buildings older than 75 years
  };
  
  // Determine confidence level based on the completeness of inputs
  const determineConfidenceLevel = (inputs: CalculatorInputs): 'LOW' | 'MEDIUM' | 'HIGH' => {
    // Calculate the number of fields with values
    let filledCount = 0;
    let totalCount = 0;
    
    // Count main fields (excluding notes and projectName which are optional)
    const mainFields = Object.entries(inputs).filter(([key]) => 
      key !== 'notes' && key !== 'projectName'
    );
    
    totalCount = mainFields.length;
    
    // Count fields with valid values
    for (const [key, value] of mainFields) {
      if (
        (typeof value === 'number' && !isNaN(value)) || 
        (typeof value === 'string' && value.trim() !== '') ||
        (typeof value === 'boolean')
      ) {
        filledCount++;
      }
    }
    
    // Calculate percentage filled
    const percentFilled = filledCount / totalCount;
    
    // Determine confidence level
    if (percentFilled >= 0.9) return 'HIGH';
    if (percentFilled >= 0.7) return 'MEDIUM';
    return 'LOW';
  };
  
  // Render different steps based on current step
  const renderStep = () => {
    switch (currentStep) {
      case WizardStep.WELCOME:
        return renderWelcomeStep();
      case WizardStep.BUILDING_TYPE:
        return renderBuildingTypeStep();
      case WizardStep.BUILDING_SIZE:
        return renderBuildingSizeStep();
      case WizardStep.QUALITY:
        return renderQualityStep();
      case WizardStep.CONDITION:
        return renderConditionStep();
      case WizardStep.LOCATION:
        return renderLocationStep();
      case WizardStep.CONSTRUCTION:
        return renderConstructionStep();
      case WizardStep.DETAILS:
        return renderDetailsStep();
      case WizardStep.RESULTS:
        return renderResultsStep();
      case WizardStep.SAVE:
        return renderSaveStep();
      default:
        return renderWelcomeStep();
    }
  };
  
  // Welcome step
  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Building className="h-16 w-16 mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Building Cost Estimation Wizard</h2>
        <p className="text-muted-foreground">
          This wizard will guide you through the process of estimating building costs step-by-step.
        </p>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <h3 className="font-medium mb-2">What you'll need:</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span>Basic information about the building type and size</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span>Details about the quality and condition of the building</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span>Location information for regional cost adjustments</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <span>Construction details like roofing, exterior, and HVAC</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-300">How it works</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              The wizard uses the Benton County Building Cost System methodology to calculate building costs
              based on regional data, quality factors, and current construction costs.
              Each input affects the final estimate, and you'll see explanations along the way.
            </p>
          </div>
        </div>
      </div>
      
      {propertyId && (
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-300">Property Data Loaded</h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                We've pre-filled some information based on the selected property. You can review and modify any details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Building type step
  const renderBuildingTypeStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Select Building Type</h2>
        <p className="text-muted-foreground">
          The building type determines the base construction cost of the structure.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BUILDING_TYPES.map((type) => (
          <div 
            key={type.id}
            className={`border rounded-md p-4 cursor-pointer transition-all ${
              inputs.buildingType === type.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('buildingType', type.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {type.icon}
                <h3 className="font-medium">{type.label}</h3>
              </div>
              <div className="text-sm font-semibold">
                ${type.baseRate}/sq ft
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {type.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">How this affects your estimate</h3>
            <p className="text-sm text-muted-foreground">
              The building type establishes the base cost per square foot before other adjustments.
              Commercial and institutional buildings typically cost more than residential or agricultural structures
              due to more complex systems, higher-grade materials, and stricter code requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Building size step
  const renderBuildingSizeStep = () => {
    // Get selected building type
    const buildingTypeInfo = BUILDING_TYPES.find(t => t.id === inputs.buildingType)!;
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Building Size & Configuration</h2>
          <p className="text-muted-foreground">
            Enter the size and basic configuration of the {buildingTypeInfo.label.toLowerCase()} building.
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="squareFeet">Total Square Footage</Label>
              <span className="text-sm text-muted-foreground">Above Grade</span>
            </div>
            <Input 
              id="squareFeet"
              type="number"
              value={inputs.squareFeet}
              onChange={e => handleInputChange('squareFeet', Number(e.target.value))}
              min={100}
              max={100000}
            />
            <p className="text-xs text-muted-foreground">
              Enter the total above-grade square footage of the building
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stories">Number of Stories</Label>
            <Select
              value={inputs.stories.toString()}
              onValueChange={value => handleInputChange('stories', Number(value))}
            >
              <SelectTrigger id="stories">
                <SelectValue placeholder="Select number of stories" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'Story' : 'Stories'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Multi-story buildings generally cost less per square foot than single-story buildings of the same total area
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="basement"
                checked={inputs.basement}
                onCheckedChange={checked => handleInputChange('basement', checked)}
              />
              <Label htmlFor="basement">Building has a basement</Label>
            </div>
            
            {inputs.basement && (
              <div className="ml-7 mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="basementFinished"
                    checked={inputs.basementFinished}
                    onCheckedChange={checked => handleInputChange('basementFinished', checked)}
                  />
                  <Label htmlFor="basementFinished">Basement is finished</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  A finished basement includes complete wall, ceiling, and floor finishes, electrical, and climate control
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="garageSize">Garage Size (square feet)</Label>
            <Input 
              id="garageSize"
              type="number"
              value={inputs.garageSize}
              onChange={e => handleInputChange('garageSize', Number(e.target.value))}
              min={0}
              max={5000}
            />
            <p className="text-xs text-muted-foreground">
              Enter 0 if there is no garage. Typical sizes: 1-car (240-300 sq ft), 2-car (400-600 sq ft)
            </p>
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">How this affects your estimate</h3>
              <p className="text-sm text-muted-foreground">
                Building size directly impacts the total cost. Larger buildings typically cost less per square foot
                due to economies of scale. The total size and configuration (including basements and garages)
                will be factored into the final cost estimate.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Quality step
  const renderQualityStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Building Quality</h2>
        <p className="text-muted-foreground">
          Select the quality level that best describes the construction and materials.
        </p>
      </div>
      
      <div className="space-y-4">
        {QUALITY_LEVELS.map((quality) => (
          <div 
            key={quality.id}
            className={`border rounded-md p-4 cursor-pointer transition-all ${
              inputs.quality === quality.id 
                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('quality', quality.id)}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{quality.label}</h3>
              <div className="text-sm font-medium text-muted-foreground">
                Factor: {quality.factor.toFixed(2)}x
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {quality.description}
            </p>
          </div>
        ))}
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">How this affects your estimate</h3>
            <p className="text-sm text-muted-foreground">
              The quality level directly multiplies the base cost. For example, luxury construction (2.0x)
              costs twice as much per square foot as standard construction (1.0x) due to premium materials,
              craftsmanship, and features.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Condition step
  const renderConditionStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Building Condition & Age</h2>
        <p className="text-muted-foreground">
          Enter the building's age and current condition.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="yearBuilt">Year Built</Label>
          <Input 
            id="yearBuilt"
            type="number"
            value={inputs.yearBuilt}
            onChange={e => handleInputChange('yearBuilt', Number(e.target.value))}
            min={1800}
            max={new Date().getFullYear()}
          />
          <p className="text-xs text-muted-foreground">
            Enter the year the building was constructed
          </p>
        </div>
        
        <div className="space-y-3 pt-2">
          <Label>Building Condition</Label>
          
          {CONDITION_OPTIONS.map((condition) => (
            <div 
              key={condition.id}
              className={`border rounded-md p-3 cursor-pointer transition-all ${
                inputs.condition === condition.id 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleInputChange('condition', condition.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{condition.label}</h3>
                <div className="text-sm font-medium text-muted-foreground">
                  Factor: {condition.factor.toFixed(2)}x
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {condition.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">How this affects your estimate</h3>
            <p className="text-sm text-muted-foreground">
              Age and condition affect the depreciated value of the building. Newer buildings and
              those in better condition have higher replacement costs than older buildings or those
              in poorer condition. The age is used to calculate an age factor, while the condition
              directly multiplies the base cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Location step
  const renderLocationStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Building Location</h2>
        <p className="text-muted-foreground">
          Select the region where the building is located for accurate cost adjustments.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={inputs.region}
            onValueChange={value => handleInputChange('region', value)}
          >
            <SelectTrigger id="region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <div className="max-h-[300px] overflow-y-auto">
                <SelectItem value="" disabled>Benton County Regions</SelectItem>
                {REGIONS.filter(r => r.id.startsWith('BC-')).map(region => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.label} ({region.factor.toFixed(2)}x)
                  </SelectItem>
                ))}
                <SelectItem value="" disabled>Arkansas Regions</SelectItem>
                {REGIONS.filter(r => r.id.startsWith('AR-')).map(region => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.label} ({region.factor.toFixed(2)}x)
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
        
        {/* Show explanation for selected region */}
        {inputs.region && (
          <div className="bg-primary/5 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium">
                  {REGIONS.find(r => r.id === inputs.region)?.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {REGIONS.find(r => r.id === inputs.region)?.description}
                </p>
                <p className="text-sm font-medium mt-1">
                  Regional Cost Factor: {REGIONS.find(r => r.id === inputs.region)?.factor.toFixed(2)}x
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">How this affects your estimate</h3>
            <p className="text-sm text-muted-foreground">
              Construction costs vary significantly by location due to differences in labor costs,
              material availability, transportation costs, and market conditions. The regional cost
              factor adjusts the base cost to reflect these local variations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Construction step
  const renderConstructionStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Construction Details</h2>
        <p className="text-muted-foreground">
          Provide additional details about the building's construction elements.
        </p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="roofType">Roof Type</Label>
          <Select
            value={inputs.roofType}
            onValueChange={value => handleInputChange('roofType', value)}
          >
            <SelectTrigger id="roofType">
              <SelectValue placeholder="Select roof type" />
            </SelectTrigger>
            <SelectContent>
              {ROOFING_TYPES.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label} ({type.factor.toFixed(2)}x)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {ROOFING_TYPES.find(r => r.id === inputs.roofType)?.description}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="exteriorType">Exterior Wall Type</Label>
          <Select
            value={inputs.exteriorType}
            onValueChange={value => handleInputChange('exteriorType', value)}
          >
            <SelectTrigger id="exteriorType">
              <SelectValue placeholder="Select exterior type" />
            </SelectTrigger>
            <SelectContent>
              {EXTERIOR_TYPES.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label} ({type.factor.toFixed(2)}x)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {EXTERIOR_TYPES.find(e => e.id === inputs.exteriorType)?.description}
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hvacType">HVAC System Type</Label>
          <Select
            value={inputs.hvacType}
            onValueChange={value => handleInputChange('hvacType', value)}
          >
            <SelectTrigger id="hvacType">
              <SelectValue placeholder="Select HVAC type" />
            </SelectTrigger>
            <SelectContent>
              {HVAC_TYPES.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label} ({type.factor.toFixed(2)}x)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {HVAC_TYPES.find(h => h.id === inputs.hvacType)?.description}
          </p>
        </div>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">How this affects your estimate</h3>
            <p className="text-sm text-muted-foreground">
              The exterior, roofing, and HVAC systems are major components of a building's cost.
              Premium materials like slate roofing or stone exteriors significantly increase construction costs,
              while standard materials like asphalt shingles or vinyl siding are more economical.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Details step
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Additional Details</h2>
        <p className="text-muted-foreground">
          Provide final details to refine your cost estimate.
        </p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Number of Bathrooms</Label>
          <Input 
            id="bathrooms"
            type="number"
            value={inputs.bathrooms}
            onChange={e => handleInputChange('bathrooms', Number(e.target.value))}
            min={0}
            max={20}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fireplaces">Number of Fireplaces</Label>
          <Input 
            id="fireplaces"
            type="number"
            value={inputs.fireplaces}
            onChange={e => handleInputChange('fireplaces', Number(e.target.value))}
            min={0}
            max={10}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="complexity">Building Complexity</Label>
              <span className="text-sm text-muted-foreground">{inputs.complexity}%</span>
            </div>
            <Slider
              id="complexity"
              value={[inputs.complexity]}
              onValueChange={values => handleInputChange('complexity', values[0])}
              min={0}
              max={100}
              step={10}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Simple</span>
              <span>Average</span>
              <span>Complex</span>
            </div>
          </div>
          
          <div className="bg-primary/5 p-3 rounded-md">
            <p className="text-sm">
              Building complexity refers to the architectural intricacy and design features:
            </p>
            <ul className="text-sm mt-2 space-y-1">
              <li><strong>Simple (0-30%):</strong> Basic rectangular design, minimal corners or angles</li>
              <li><strong>Average (40-60%):</strong> Standard design with some architectural features</li>
              <li><strong>Complex (70-100%):</strong> Custom design with multiple angles, levels, or unique features</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium">Final Step</h3>
            <p className="text-sm text-muted-foreground">
              After this step, we'll calculate your building cost estimate based on all the information you've provided.
              You can review and adjust any details before finalizing the estimate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Results step
  const renderResultsStep = () => {
    // Calculate estimate if we don't have one yet
    if (!result) {
      const calculationResult = calculateEstimate();
      if (!calculationResult) {
        return (
          <div className="text-center p-8">
            <h2 className="text-xl font-bold text-red-500">Calculation Error</h2>
            <p className="mt-2">
              There was an error calculating the estimate. Please go back and check your inputs.
            </p>
            <Button 
              onClick={() => goToStep(WizardStep.BUILDING_TYPE)} 
              variant="outline"
              className="mt-4"
            >
              Review Inputs
            </Button>
          </div>
        );
      }
    }
    
    // Get nicely formatted values for display
    const formattedTotal = result ? result.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '';
    const formattedPerSqFt = result ? result.costPerSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '';
    
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Cost Estimate Results</h2>
          <p className="text-muted-foreground">
            Here's your estimated building cost based on the information provided.
          </p>
        </div>
        
        <div className="bg-primary/5 p-6 rounded-md text-center">
          <h3 className="text-lg font-medium mb-2">Total Estimated Cost</h3>
          <div className="text-4xl font-bold text-primary mb-2">
            ${formattedTotal}
          </div>
          <div className="text-lg">
            ${formattedPerSqFt} per square foot
          </div>
          <div className="mt-2 inline-flex items-center text-sm bg-muted px-2 py-1 rounded-full">
            <span className="font-medium mr-1">Confidence:</span> 
            {result?.confidenceLevel === 'HIGH' && 'High'}
            {result?.confidenceLevel === 'MEDIUM' && 'Medium'}
            {result?.confidenceLevel === 'LOW' && 'Low'}
          </div>
        </div>
        
        {/* Cost breakdown */}
        <div className="space-y-4">
          <h3 className="font-medium">Cost Breakdown</h3>
          
          <div className="bg-muted p-4 rounded-md">
            <div className="space-y-3">
              {result?.breakdownCosts && (
                <>
                  <div className="flex justify-between items-center">
                    <span>Foundation</span>
                    <span className="font-medium">${result.breakdownCosts.foundation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Framing & Structure</span>
                    <span className="font-medium">${result.breakdownCosts.framing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Exterior Finishes</span>
                    <span className="font-medium">${result.breakdownCosts.exterior.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Roofing</span>
                    <span className="font-medium">${result.breakdownCosts.roofing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Interior Finishes</span>
                    <span className="font-medium">${result.breakdownCosts.interiorFinish.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Plumbing</span>
                    <span className="font-medium">${result.breakdownCosts.plumbing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Electrical</span>
                    <span className="font-medium">${result.breakdownCosts.electrical.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>HVAC</span>
                    <span className="font-medium">${result.breakdownCosts.hvac.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Special Features</span>
                    <span className="font-medium">${result.breakdownCosts.specialFeatures.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Adjustment Factors */}
        <div className="space-y-4">
          <h3 className="font-medium">Adjustment Factors</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 bg-muted p-4 rounded-md">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Quality</div>
              <div className="font-medium">{result?.qualityFactor.toFixed(2)}x</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Condition</div>
              <div className="font-medium">{result?.conditionFactor.toFixed(2)}x</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Region</div>
              <div className="font-medium">{result?.regionFactor.toFixed(2)}x</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Age</div>
              <div className="font-medium">{result?.ageFactor.toFixed(2)}x</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Complexity</div>
              <div className="font-medium">{result?.complexityFactor.toFixed(2)}x</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Area</div>
              <div className="font-medium">{result?.areaMultiplier.toFixed(2)}x</div>
            </div>
          </div>
        </div>
        
        {/* Compare with history if available */}
        {estimateHistory.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Comparison with Previous Estimates</h3>
            
            <div className="bg-muted p-4 rounded-md space-y-3">
              {estimateHistory.slice(0, 3).map((prevEstimate, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      ${prevEstimate.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(prevEstimate.calculationDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div>
                      ${prevEstimate.costPerSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 })}/sq ft
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {QUALITY_LEVELS.find(q => q.id === prevEstimate.inputValues.quality)?.label} quality
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 dark:text-blue-300">Next Steps</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                You can now save this estimate, export it, or continue to refine your inputs.
                Click "Next" to save this estimate or "Back" to adjust your inputs.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => exportCalculation()}>
            <Download className="mr-2 h-4 w-4" />
            Export as JSON
          </Button>
        </div>
      </div>
    );
  };
  
  // Save step
  const renderSaveStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Save Your Estimate</h2>
        <p className="text-muted-foreground">
          Add a name and notes to your estimate before saving.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Estimate Name</Label>
          <Input 
            id="projectName"
            value={inputs.projectName}
            onChange={e => handleInputChange('projectName', e.target.value)}
            placeholder="e.g., Main Street Property 2025 Estimate"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            className="w-full min-h-[100px] p-3 rounded-md border"
            value={inputs.notes}
            onChange={e => handleInputChange('notes', e.target.value)}
            placeholder="Add any additional notes about this estimate..."
          />
        </div>
      </div>
      
      <div className="bg-primary/5 p-4 rounded-md">
        <h3 className="font-medium mb-2">Estimate Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cost:</span>
            <span className="font-bold">
              ${result?.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Per Square Foot:</span>
            <span className="font-medium">
              ${result?.costPerSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Building Type:</span>
            <span>
              {BUILDING_TYPES.find(t => t.id === inputs.buildingType)?.label}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Square Feet:</span>
            <span>{inputs.squareFeet.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quality:</span>
            <span>{QUALITY_LEVELS.find(q => q.id === inputs.quality)?.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Region:</span>
            <span>{REGIONS.find(r => r.id === inputs.region)?.label.split(' - ')[1]}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToStep(WizardStep.RESULTS)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onExit && onExit()}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveCalculation}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Estimate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main wizard card - takes up 2/3 of the width on larger screens */}
        <Card className="w-full lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart className="h-6 w-6 text-primary" />
                <CardTitle>Building Cost Estimation Wizard</CardTitle>
              </div>
            </div>
            <CardDescription>
              Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
            </CardDescription>
            <Progress value={calculateProgress()} className="h-2 mt-2" />
          </CardHeader>
          
          <CardContent>
            {renderStep()}
          </CardContent>
      
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === WizardStep.WELCOME}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex space-x-1">
                    {Array.from({ length: Object.keys(WizardStep).length / 2 }).map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          index === currentStep 
                            ? 'bg-primary' 
                            : index < currentStep
                              ? 'bg-primary/40'
                              : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Step {currentStep + 1} of {Object.keys(WizardStep).length / 2}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              onClick={nextStep}
              disabled={currentStep === WizardStep.SAVE}
            >
              {currentStep === WizardStep.RESULTS ? (
                <>
                  Save Estimate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Step guidance panel - takes up 1/3 of the width on larger screens */}
        <div className="lg:block">
          <StepGuidancePanel currentStep={currentStep} />
        </div>
      </div>
    </div>
  );
};

export default CostEstimationWizard;