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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  HelpCircle,
  Home,
  Building,
  AreaChart,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  BarChart,
  RefreshCw
} from 'lucide-react';
import { useEnhancedSupabase } from '@/components/supabase/EnhancedSupabaseProvider';
import { localDB } from '@/lib/utils/localDatabase';
import StepGuidancePanel from './StepGuidancePanel';

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

// Building types data
const BUILDING_TYPES = [
  { id: 'RES', label: 'Residential', baseRate: 120, icon: <Home className="h-5 w-5" />, 
    description: 'Single-family homes, duplexes, townhouses, and apartment buildings.' },
  { id: 'COMM', label: 'Commercial', baseRate: 150, icon: <Building className="h-5 w-5" />, 
    description: 'Office buildings, retail spaces, restaurants, and hotels.' },
  { id: 'IND', label: 'Industrial', baseRate: 135, icon: <AreaChart className="h-5 w-5" />, 
    description: 'Factories, warehouses, manufacturing facilities, and distribution centers.' },
  { id: 'AGR', label: 'Agricultural', baseRate: 80, icon: <Building className="h-5 w-5" />, 
    description: 'Barns, silos, equipment storage, and other farm structures.' },
  { id: 'INST', label: 'Institutional', baseRate: 145, icon: <Building className="h-5 w-5" />, 
    description: 'Schools, hospitals, government buildings, and churches.' },
];

// Quality levels data
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

// Condition options data
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

// Regions data
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

// Roofing types data
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

// Exterior types data
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

// HVAC types data
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
  complexity: 50,
  roofType: 'ASPHALT',
  exteriorType: 'VINYL',
  hvacType: 'FORCED',
  fireplaces: 0,
  bathrooms: 2,
  projectName: '',
  notes: '',
};

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
  
  // Helper function to calculate age factor based on building age
  const calculateAgeFactor = (age: number): number => {
    if (age <= 0) return 1.0; // New construction
    if (age <= 5) return 0.98;
    if (age <= 10) return 0.95;
    if (age <= 15) return 0.9;
    if (age <= 20) return 0.85;
    if (age <= 30) return 0.8;
    if (age <= 40) return 0.75;
    if (age <= 50) return 0.7;
    return 0.65; // Very old buildings (50+ years)
  };
  
  // Helper function to calculate area multiplier (economies of scale)
  const calculateAreaMultiplier = (sqFt: number): number => {
    if (sqFt <= 1000) return 1.1; // Small buildings cost more per sqft
    if (sqFt <= 2000) return 1.0; // Base rate for standard size
    if (sqFt <= 3000) return 0.95;
    if (sqFt <= 5000) return 0.9;
    if (sqFt <= 10000) return 0.85;
    return 0.8; // Very large buildings (economies of scale)
  };
  
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
        framing: totalCost * 0.16, // 16% for framing
        exterior: totalCost * 0.14, // 14% for exterior walls and finishes
        roofing: totalCost * 0.09, // 9% for roofing
        interiorFinish: totalCost * 0.22, // 22% for interior finishes
        plumbing: totalCost * 0.08, // 8% for plumbing
        electrical: totalCost * 0.07, // 7% for electrical
        hvac: totalCost * 0.08, // 8% for HVAC
        specialFeatures: totalCost * 0.04, // 4% for special features
      };
      
      // Determine confidence level based on completeness of inputs
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
      
      // Set the result in state and return it
      setResult(calculationResult);
      return calculationResult;
    } catch (error) {
      console.error('Error calculating estimate:', error);
      toast({
        title: "Calculation Error",
        description: "There was an error calculating the estimate. Please check your inputs.",
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Determine confidence level based on input completeness
  const determineConfidenceLevel = (inputs: CalculatorInputs): 'LOW' | 'MEDIUM' | 'HIGH' => {
    // Count number of completed fields
    let completedFields = 0;
    const totalFields = Object.keys(inputs).length;
    
    // Check each field for completion
    for (const [key, value] of Object.entries(inputs)) {
      if (value !== null && value !== undefined && value !== '') {
        if (typeof value === 'number' && value > 0) completedFields++;
        else if (typeof value === 'boolean') completedFields++;
        else if (typeof value === 'string' && value.trim() !== '') completedFields++;
      }
    }
    
    // Calculate completion percentage
    const completionPercentage = (completedFields / totalFields) * 100;
    
    // Determine confidence level based on completion percentage
    if (completionPercentage >= 85) return 'HIGH';
    if (completionPercentage >= 70) return 'MEDIUM';
    return 'LOW';
  };
  
  // Save the estimate to the database
  const saveEstimate = async () => {
    if (!result) {
      toast({
        title: "No Result to Save",
        description: "Please complete the estimation process first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      const calculationData = {
        propertyId: propertyId || null,
        buildingType: inputs.buildingType,
        squareFeet: inputs.squareFeet,
        quality: inputs.quality,
        condition: inputs.condition,
        yearBuilt: inputs.yearBuilt,
        region: inputs.region,
        calculationDate: new Date().toISOString(),
        totalCost: result.totalCost,
        costPerSqFt: result.costPerSqFt,
        conditionFactor: result.conditionFactor,
        confidenceLevel: result.confidenceLevel,
        result: result,
        projectName: inputs.projectName || `${inputs.buildingType} Building Estimate`,
        notes: inputs.notes || '',
      };
      
      if (isOfflineMode) {
        // Save to local database
        const { data, error } = await localDB.storeWithSync('calculations', calculationData);
        
        if (error) throw error;
        
        toast({
          title: "Estimate Saved Locally",
          description: "The estimate has been saved to your local database.",
        });
      } else if (supabase) {
        // Save to Supabase
        const { data, error } = await supabase
          .from('calculations')
          .insert({
            property_id: propertyId || null,
            building_type: inputs.buildingType,
            square_feet: inputs.squareFeet,
            quality: inputs.quality,
            condition: inputs.condition,
            year_built: inputs.yearBuilt,
            region: inputs.region,
            calculation_date: new Date().toISOString(),
            total_cost: result.totalCost,
            cost_per_sqft: result.costPerSqFt,
            condition_factor: result.conditionFactor,
            confidence_level: result.confidenceLevel,
            result: result,
            project_name: inputs.projectName || `${inputs.buildingType} Building Estimate`,
            notes: inputs.notes || '',
          });
        
        if (error) throw error;
        
        toast({
          title: "Estimate Saved",
          description: "The estimate has been saved to the database.",
        });
      }
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(result);
      }
      
    } catch (error) {
      console.error('Error saving estimate:', error);
      toast({
        title: "Error Saving Estimate",
        description: "There was an error saving the estimate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Render the appropriate step content
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
  
  // Render placeholder steps for now
  const renderWelcomeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Welcome to the Cost Estimation Wizard</h2>
        <p className="text-muted-foreground">
          This wizard will guide you through creating a detailed building cost estimate based on
          Benton County, Washington and Arkansas building cost data.
        </p>
      </div>
      
      <Alert>
        <AlertTitle className="flex items-center">
          <Info className="mr-2 h-4 w-4" />
          How this estimator works
        </AlertTitle>
        <AlertDescription>
          <p className="mt-2">
            This tool uses verified cost data from multiple sources, including Benton County Assessor's Office
            and regional construction standards, to estimate building costs based on:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Building type, size, and configuration</li>
            <li>Quality grade and current condition</li>
            <li>Regional cost factors and specific location</li>
            <li>Construction features and materials</li>
            <li>Additional components and complexity</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <div className="pt-4">
        <Button onClick={nextStep} className="w-full">
          Start Building Cost Estimation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
  
  // Building type step
  const renderBuildingTypeStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Select Building Type</h2>
        <p className="text-muted-foreground">
          Choose the category that best describes the building you are estimating.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BUILDING_TYPES.map((type) => (
          <div
            key={type.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              inputs.buildingType === type.id 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('buildingType', type.id)}
          >
            <div className="flex items-start">
              <div className={`p-2 rounded-full ${
                inputs.buildingType === type.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                {type.icon}
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <h3 className="font-medium">{type.label}</h3>
                  {inputs.buildingType === type.id && (
                    <CheckCircle2 className="ml-2 h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                <p className="text-xs mt-2">Base rate: ${type.baseRate} per square foot</p>
              </div>
            </div>
          </div>
        ))}
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
              onChange={(e) => handleInputChange('squareFeet', parseInt(e.target.value) || 0)}
              min={100}
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">
              Enter the total finished square footage of the building (heated/cooled space).
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stories">Number of Stories</Label>
            <Select
              value={inputs.stories.toString()}
              onValueChange={(value) => handleInputChange('stories', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of stories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Story</SelectItem>
                <SelectItem value="2">2 Stories</SelectItem>
                <SelectItem value="3">3 Stories</SelectItem>
                <SelectItem value="4">4+ Stories</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="basement"
                checked={inputs.basement}
                onCheckedChange={(checked) => handleInputChange('basement', !!checked)}
              />
              <Label htmlFor="basement" className="cursor-pointer">
                Includes Basement
              </Label>
            </div>
            
            {inputs.basement && (
              <div className="pl-7 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="basementFinished"
                    checked={inputs.basementFinished}
                    onCheckedChange={(checked) => handleInputChange('basementFinished', !!checked)}
                  />
                  <Label htmlFor="basementFinished" className="cursor-pointer">
                    Basement is Finished
                  </Label>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="garageSize">Garage Size (sq ft)</Label>
              <span className="text-sm text-muted-foreground">If applicable</span>
            </div>
            <Input
              id="garageSize"
              type="number"
              value={inputs.garageSize}
              onChange={(e) => handleInputChange('garageSize', parseInt(e.target.value) || 0)}
              min={0}
              className="text-right"
            />
            <p className="text-xs text-muted-foreground">
              Enter 0 if no garage or if garage is already included in total square footage.
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Quality step
  const renderQualityStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Construction Quality</h2>
        <p className="text-muted-foreground">
          Select the quality grade that best describes the construction.
        </p>
      </div>
      
      <div className="space-y-4">
        {QUALITY_LEVELS.map((quality) => (
          <div
            key={quality.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              inputs.quality === quality.id 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('quality', quality.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{quality.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{quality.description}</p>
              </div>
              {inputs.quality === quality.id ? (
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-muted flex items-center justify-center">
                  <span className="text-xs font-medium">{quality.factor.toFixed(1)}x</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Condition step
  const renderConditionStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Building Condition</h2>
        <p className="text-muted-foreground">
          For existing buildings, select the current condition. For new construction, select "Excellent".
        </p>
      </div>
      
      <div className="space-y-4">
        {CONDITION_OPTIONS.map((condition) => (
          <div
            key={condition.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              inputs.condition === condition.id 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('condition', condition.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{condition.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{condition.description}</p>
              </div>
              {inputs.condition === condition.id ? (
                <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full border border-muted flex items-center justify-center">
                  <span className="text-xs font-medium">{condition.factor.toFixed(1)}x</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Location step
  const renderLocationStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Location & Construction Year</h2>
        <p className="text-muted-foreground">
          Select the region and enter the year the building was constructed.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={inputs.region}
            onValueChange={(value) => handleInputChange('region', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Benton County</SelectLabel>
                <SelectItem value="BC-CENTRAL">Benton County - Central</SelectItem>
                <SelectItem value="BC-NORTH">Benton County - North</SelectItem>
                <SelectItem value="BC-SOUTH">Benton County - South</SelectItem>
                <SelectItem value="BC-EAST">Benton County - East</SelectItem>
                <SelectItem value="BC-WEST">Benton County - West</SelectItem>
                <SelectItem value="BC-RICHLAND">Benton County - Richland</SelectItem>
                <SelectItem value="BC-KENNEWICK">Benton County - Kennewick</SelectItem>
                <SelectItem value="BC-PROSSER">Benton County - Prosser</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Arkansas</SelectLabel>
                <SelectItem value="AR-CENTRAL">Arkansas - Central</SelectItem>
                <SelectItem value="AR-NORTHWEST">Arkansas - Northwest</SelectItem>
                <SelectItem value="AR-NORTHEAST">Arkansas - Northeast</SelectItem>
                <SelectItem value="AR-SOUTHWEST">Arkansas - Southwest</SelectItem>
                <SelectItem value="AR-SOUTHEAST">Arkansas - Southeast</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* Show the regional factor for the selected region */}
          {inputs.region && (
            <p className="text-xs text-muted-foreground mt-1">
              Regional Factor: {REGIONS.find(r => r.id === inputs.region)?.factor.toFixed(2)}x
              <br />
              {REGIONS.find(r => r.id === inputs.region)?.description}
            </p>
          )}
        </div>
        
        <div className="space-y-2 pt-4">
          <Label htmlFor="yearBuilt">Year Built (or anticipated completion)</Label>
          <Input
            id="yearBuilt"
            type="number"
            value={inputs.yearBuilt}
            onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value) || new Date().getFullYear())}
            min={1800}
            max={new Date().getFullYear() + 5}
          />
          <p className="text-xs text-muted-foreground">
            For existing buildings, this affects depreciation. For new construction, use current or future year.
          </p>
        </div>
      </div>
    </div>
  );
  
  // Construction step
  const renderConstructionStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Construction Materials</h2>
        <p className="text-muted-foreground">
          Select the primary materials used in the construction.
        </p>
      </div>
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="roofType">Roof Type</Label>
          <Select
            value={inputs.roofType}
            onValueChange={(value) => handleInputChange('roofType', value)}
          >
            <SelectTrigger>
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
          {inputs.roofType && (
            <p className="text-xs text-muted-foreground mt-1">
              {ROOFING_TYPES.find(t => t.id === inputs.roofType)?.description}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="exteriorType">Exterior Wall Type</Label>
          <Select
            value={inputs.exteriorType}
            onValueChange={(value) => handleInputChange('exteriorType', value)}
          >
            <SelectTrigger>
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
          {inputs.exteriorType && (
            <p className="text-xs text-muted-foreground mt-1">
              {EXTERIOR_TYPES.find(t => t.id === inputs.exteriorType)?.description}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="hvacType">HVAC System</Label>
          <Select
            value={inputs.hvacType}
            onValueChange={(value) => handleInputChange('hvacType', value)}
          >
            <SelectTrigger>
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
          {inputs.hvacType && (
            <p className="text-xs text-muted-foreground mt-1">
              {HVAC_TYPES.find(t => t.id === inputs.hvacType)?.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
  
  // Details step
  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Additional Features</h2>
        <p className="text-muted-foreground">
          Enter additional details that affect the building cost.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="bathrooms">Number of Bathrooms</Label>
          <Input
            id="bathrooms"
            type="number"
            value={inputs.bathrooms}
            onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="fireplaces">Number of Fireplaces</Label>
          <Input
            id="fireplaces"
            type="number"
            value={inputs.fireplaces}
            onChange={(e) => handleInputChange('fireplaces', parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="complexity">Design Complexity</Label>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Simple</span>
              <span>Average</span>
              <span>Complex</span>
            </div>
          </div>
          <Slider
            id="complexity"
            value={[inputs.complexity]}
            onValueChange={(value) => handleInputChange('complexity', value[0])}
            min={0}
            max={100}
            step={5}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Simple designs have basic rectangular layouts. Complex designs have multiple levels, irregular shapes, or custom features.
          </p>
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
          
          <div className="flex items-center justify-center mt-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              result?.confidenceLevel === 'HIGH' 
                ? 'bg-green-100 text-green-800' 
                : result?.confidenceLevel === 'MEDIUM'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {result?.confidenceLevel} Confidence
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Cost Breakdown</h3>
          
          {result && (
            <div className="space-y-2">
              {Object.entries(result.breakdownCosts).map(([key, value]) => {
                const percentage = (value / result.totalCost * 100).toFixed(1);
                const formattedValue = value.toLocaleString(undefined, { maximumFractionDigits: 0 });
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase());
                
                return (
                  <div key={key} className="grid grid-cols-5 gap-2 items-center">
                    <div className="col-span-2 text-sm">{label}</div>
                    <div className="col-span-2 h-2 bg-muted rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right text-sm">${formattedValue}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="space-y-4 pt-4">
          <h3 className="font-medium">Adjustment Factors Applied</h3>
          
          {result && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-sm">Base Rate: <span className="font-medium">${result.baseRate.toFixed(2)}</span></div>
              <div className="text-sm">Adjusted Rate: <span className="font-medium">${result.adjustedRate.toFixed(2)}</span></div>
              <div className="text-sm">Quality: <span className="font-medium">{result.qualityFactor.toFixed(2)}x</span></div>
              <div className="text-sm">Region: <span className="font-medium">{result.regionFactor.toFixed(2)}x</span></div>
              <div className="text-sm">Condition: <span className="font-medium">{result.conditionFactor.toFixed(2)}x</span></div>
              <div className="text-sm">Age: <span className="font-medium">{result.ageFactor.toFixed(2)}x</span></div>
              <div className="text-sm">Area: <span className="font-medium">{result.areaMultiplier.toFixed(2)}x</span></div>
              <div className="text-sm">Complexity: <span className="font-medium">{result.complexityFactor.toFixed(2)}x</span></div>
            </div>
          )}
        </div>
        
        <Alert className="bg-blue-50 text-blue-800 border-blue-200">
          <AlertTitle className="flex items-center">
            <Info className="mr-2 h-4 w-4" />
            About this estimate
          </AlertTitle>
          <AlertDescription className="text-sm">
            This estimate is based on average construction costs for similar buildings in the selected region.
            Actual costs may vary based on specific design choices, site conditions, and market factors.
            For a more precise estimate, consult with a professional contractor or cost estimator.
          </AlertDescription>
        </Alert>
      </div>
    );
  };
  
  // Save step
  const renderSaveStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Save Your Estimate</h2>
        <p className="text-muted-foreground">
          Enter a name and any notes for this estimate, then save it for future reference.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectName">Estimate Name</Label>
          <Input
            id="projectName"
            value={inputs.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            placeholder={`${BUILDING_TYPES.find(t => t.id === inputs.buildingType)?.label} Building Estimate`}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={inputs.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Add any notes or additional details about this estimate..."
          />
        </div>
        
        <div className="pt-4">
          <Button
            onClick={saveEstimate}
            className="w-full"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Save Estimate
              </>
            )}
          </Button>
          
          {onExit && (
            <Button
              variant="outline"
              onClick={onExit}
              className="w-full mt-2"
              disabled={isSaving}
            >
              Exit Wizard
            </Button>
          )}
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