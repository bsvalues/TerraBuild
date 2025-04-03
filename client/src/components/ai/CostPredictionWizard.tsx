import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  MapPin, 
  Square, 
  Calendar, 
  SlidersHorizontal, 
  Activity, 
  ListChecks,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Bot,
  BrainCircuit,
  Lightbulb,
  Zap,
  BarChart,
  Settings,
  Cpu,
  Info
} from 'lucide-react';

// Define the schemas for each step
const buildingTypeSchema = z.object({
  buildingType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'], {
    required_error: "Please select a building type",
  }),
});

const locationSchema = z.object({
  region: z.string().min(1, "Please select a region"),
});

const dimensionsSchema = z.object({
  squareFootage: z.coerce
    .number()
    .positive("Square footage must be a positive number")
    .min(100, "Square footage must be at least 100")
    .max(1000000, "Square footage must be less than 1,000,000"),
});

const ageSchema = z.object({
  yearBuilt: z.coerce
    .number()
    .int("Year must be a whole number")
    .min(1900, "Year must be after 1900")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  buildingAge: z.number().optional(),
});

const qualitySchema = z.object({
  quality: z.enum(['ECONOMY', 'AVERAGE', 'GOOD', 'PREMIUM', 'LUXURY'], {
    required_error: "Please select a quality level",
  }),
});

const complexitySchema = z.object({
  complexityFactor: z.coerce
    .number()
    .min(0.5, "Complexity factor must be at least 0.5")
    .max(1.5, "Complexity factor must be at most 1.5")
    .default(1.0),
  conditionFactor: z.coerce
    .number()
    .min(0.5, "Condition factor must be at least 0.5")
    .max(1.5, "Condition factor must be at most 1.5")
    .default(1.0),
});

const featuresSchema = z.object({
  features: z.array(z.string()).default([]),
  customFeatures: z.string().optional(),
});

// Schema for AI provider selection
const providerSchema = z.object({
  provider: z.string().default('openai'),
});

// Combine all schemas
const wizardSchema = buildingTypeSchema
  .merge(locationSchema)
  .merge(dimensionsSchema)
  .merge(ageSchema)
  .merge(qualitySchema)
  .merge(complexitySchema)
  .merge(featuresSchema)
  .merge(providerSchema);

// Type for our form values
type WizardFormValues = z.infer<typeof wizardSchema>;

// Pre-defined values for dropdowns
const REGIONS = [
  { id: 'central', name: 'Central Washington' },
  { id: 'eastern', name: 'Eastern Washington' },
  { id: 'western', name: 'Western Washington' },
  { id: 'northern', name: 'Northern Washington' },
  { id: 'southern', name: 'Southern Washington' },
  { id: 'benton', name: 'Benton County' },
];

// AI Provider options
const AI_PROVIDERS = [
  { id: 'openai', name: 'OpenAI GPT-4o' },
  { id: 'anthropic', name: 'Anthropic Claude 3' },
];

// Common features by building type
const COMMON_FEATURES = {
  RESIDENTIAL: [
    'Garage', 'Basement', 'Deck/Patio', 'Fireplace', 'Swimming Pool',
    'Central Air', 'Solar Panels', 'Smart Home System', 'Finished Attic',
  ],
  COMMERCIAL: [
    'Elevator', 'Loading Dock', 'Security System', 'HVAC Zoning',
    'Fire Sprinkler System', 'Backup Generator', 'Commercial Kitchen',
    'Conference Rooms', 'Server Room',
  ],
  INDUSTRIAL: [
    'Heavy Power', 'High Bay Ceiling', 'Crane System', 'Floor Drains',
    'Compressed Air System', 'Climate Control', 'Clean Room', 'Waste Management',
    'Hazard Controls', 'Vehicle Maintenance Bays'
  ]
};

// Additional explanations for different steps
const STEP_EXPLANATIONS = {
  buildingType: {
    title: "Building Type",
    description: "The type of building significantly impacts construction costs. Choose the option that best matches your project.",
    help: {
      RESIDENTIAL: "Homes, apartments, condos, and other dwellings for people to live in.",
      COMMERCIAL: "Office buildings, retail spaces, hotels, and other business-related structures.",
      INDUSTRIAL: "Factories, warehouses, processing facilities, and other manufacturing or storage buildings."
    }
  },
  location: {
    title: "Location",
    description: "Geographic location affects material and labor costs due to regional market conditions.",
    help: "Different regions have varying construction costs based on local regulations, labor rates, and material availability."
  },
  dimensions: {
    title: "Building Size",
    description: "The square footage is a primary factor in determining overall cost.",
    help: "Larger buildings generally cost more in total but may have a lower cost per square foot due to economies of scale."
  },
  age: {
    title: "Building Age",
    description: "For existing buildings, age helps determine depreciation and renovation requirements.",
    help: "Older buildings may require more extensive updates to meet current codes and standards."
  },
  quality: {
    title: "Quality Level",
    description: "The quality of materials and finishes greatly impacts the overall cost.",
    help: {
      ECONOMY: "Basic materials and standard finishes; functional but minimal amenities.",
      AVERAGE: "Standard-grade materials with some upgraded finishes in key areas.",
      GOOD: "Above-average materials with attention to detail and design elements.",
      PREMIUM: "High-quality materials throughout with custom features and finishes.",
      LUXURY: "Top-of-the-line materials, custom design, and premium features."
    }
  },
  complexity: {
    title: "Complexity Factors",
    description: "Building design complexity and current condition affect overall costs.",
    help: "Higher complexity (unusual shapes, custom elements) increases costs. Better condition means fewer repairs needed."
  },
  features: {
    title: "Special Features",
    description: "Special features or amenities that add to the building's value and cost.",
    help: "Select all features that apply to your building. These will be factored into the cost prediction."
  },
  provider: {
    title: "AI Provider",
    description: "Select the AI provider to use for cost prediction calculations.",
    help: "Different AI providers may have slightly different prediction methodologies and capabilities."
  }
};

// Interactive tips that will appear while users complete the form
const AI_TIPS = {
  buildingType: [
    "Commercial buildings typically cost 15-20% more per square foot than residential buildings",
    "Industrial buildings often require specialized materials and systems, affecting cost",
    "Mixed-use buildings combine multiple types and are typically priced at the higher range"
  ],
  location: [
    "Western Washington generally has 10-15% higher construction costs than Eastern Washington",
    "Urban areas typically have higher labor and permit costs than rural locations",
    "Some regions may have additional requirements for seismic, snow load, or wind considerations"
  ],
  dimensions: [
    "Construction costs generally decrease per square foot as building size increases",
    "For residential properties, costs typically range from $150-$300 per square foot in Washington",
    "Consider how much space you truly need - overbuilding can lead to unnecessary expenses"
  ],
  age: [
    "Buildings over 40 years old often require more extensive updates to meet current codes",
    "Age-related depreciation can significantly impact valuation for tax and insurance purposes",
    "Historical buildings (pre-1950) may qualify for tax incentives but also face stricter renovation requirements"
  ],
  quality: [
    "Premium quality construction typically costs 30-50% more than average quality",
    "Investing in better quality for key systems (HVAC, roofing, insulation) often pays off in the long run",
    "Consider where quality matters most - focus premium materials on high-use areas"
  ],
  complexity: [
    "Unique or irregular building shapes can increase costs by 15-25%",
    "Buildings in fair or poor condition may require an additional 10-30% budget for renovations",
    "Simple, rectangular designs with standard roof pitches are most economical to build"
  ],
  features: [
    "Energy-efficient features may cost more upfront but can reduce long-term operating expenses",
    "Some premium features add disproportionately to cost but may not add equivalent resale value",
    "Security systems and smart building technology are becoming standard expectations in commercial buildings"
  ],
  provider: [
    "OpenAI GPT-4o provides detailed cost predictions with extensive reasoning about industry trends",
    "Anthropic Claude 3 offers an alternative approach with focus on regional cost factors",
    "Different AI providers may have slightly different specialties in construction cost analysis"
  ],
};

export default function CostPredictionWizard() {
  const { toast } = useToast();
  
  // Track the current step
  const [currentStep, setCurrentStep] = useState(0);
  
  // Track whether the AI assistant is providing tips
  const [showAITips, setShowAITips] = useState(true);
  
  // Track the current AI tip index for each step
  const [currentTipIndex, setCurrentTipIndex] = useState<Record<string, number>>({
    buildingType: 0,
    location: 0,
    dimensions: 0,
    age: 0,
    quality: 0,
    complexity: 0,
    features: 0,
    provider: 0,
  });
  
  // State for wizard result
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Setup form with initial values
  const form = useForm<WizardFormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      buildingType: undefined,
      region: '',
      squareFootage: 0,
      yearBuilt: new Date().getFullYear() - 10,
      buildingAge: 10,
      quality: undefined,
      complexityFactor: 1.0,
      conditionFactor: 1.0,
      features: [],
      customFeatures: '',
      provider: 'openai',
    },
    mode: "onChange",
  });
  
  // Define the steps of the wizard
  const steps = [
    { name: 'buildingType', schema: buildingTypeSchema, icon: Building2 },
    { name: 'location', schema: locationSchema, icon: MapPin },
    { name: 'dimensions', schema: dimensionsSchema, icon: Square },
    { name: 'age', schema: ageSchema, icon: Calendar },
    { name: 'quality', schema: qualitySchema, icon: Activity },
    { name: 'complexity', schema: complexitySchema, icon: SlidersHorizontal },
    { name: 'features', schema: featuresSchema, icon: ListChecks },
    { name: 'provider', schema: providerSchema, icon: Cpu },
  ];
  
  // Add a completion step
  const totalSteps = steps.length + 1;
  
  // Calculate the current step's schema
  const currentSchema = steps[currentStep]?.schema || z.object({});
  
  // Get the current step name
  const currentStepName = steps[currentStep]?.name || 'complete';

  // Get available features based on building type
  const availableFeatures = form.watch('buildingType') 
    ? COMMON_FEATURES[form.watch('buildingType')] 
    : [];
  
  // Helper to toggle a feature selection
  const toggleFeature = (feature: string) => {
    const currentFeatures = form.watch('features') || [];
    if (currentFeatures.includes(feature)) {
      form.setValue('features', currentFeatures.filter(f => f !== feature));
    } else {
      form.setValue('features', [...currentFeatures, feature]);
    }
  };
  
  // Calculate year built from age or vice versa
  const updateBuildingAge = (yearBuilt: number) => {
    const currentYear = new Date().getFullYear();
    const buildingAge = currentYear - yearBuilt;
    form.setValue('buildingAge', buildingAge);
  };
  
  const updateYearBuilt = (buildingAge: number) => {
    const currentYear = new Date().getFullYear();
    const yearBuilt = currentYear - buildingAge;
    form.setValue('yearBuilt', yearBuilt);
  };
  
  // Handle next step
  const handleNext = async () => {
    // Validate the current step
    try {
      const result = await form.trigger(Object.keys(currentSchema.shape) as any);
      
      if (!result) {
        // Form has errors, don't proceed
        return;
      }
      
      // Special case for age step - ensure both values are set
      if (currentStepName === 'age') {
        const yearBuilt = form.getValues('yearBuilt');
        updateBuildingAge(yearBuilt);
      }
      
      // If this is the last normal step, submit the form
      if (currentStep === steps.length - 1) {
        await handleSubmit();
        setCurrentStep(currentStep + 1);
        return;
      }
      
      // Move to the next step
      setCurrentStep(currentStep + 1);
      
      // Advance the AI tip index for the next step
      const nextStepName = steps[currentStep + 1]?.name;
      if (nextStepName) {
        setCurrentTipIndex(prev => ({
          ...prev,
          [nextStepName]: 0, // Reset to first tip for this new step
        }));
      }
    } catch (error) {
      console.error('Validation error:', error);
    }
  };
  
  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = form.getValues();
      
      // Add any custom features to the features array
      if (values.customFeatures) {
        const customFeaturesList = values.customFeatures
          .split(',')
          .map(feature => feature.trim())
          .filter(feature => feature.length > 0);
        
        values.features = [...values.features, ...customFeaturesList];
      }
      
      setIsSubmitting(true);
      
      // Call the API to get the prediction
      const response = await fetch('/api/mcp/enhanced-predict-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingType: values.buildingType,
          region: values.region,
          squareFootage: values.squareFootage,
          quality: values.quality,
          buildingAge: values.buildingAge,
          yearBuilt: values.yearBuilt,
          complexityFactor: values.complexityFactor,
          conditionFactor: values.conditionFactor,
          features: values.features,
          targetYear: new Date().getFullYear() + 1, // Target next year for prediction
          provider: values.provider, // Add the selected AI provider
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }
      
      const result = await response.json();
      setPredictionResult(result);
      
      toast({
        title: "Prediction Complete",
        description: "Your building cost prediction is ready!",
        variant: "default",
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get prediction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cycle through AI tips
  const cycleAITip = () => {
    if (!showAITips) return;
    
    setCurrentTipIndex(prev => {
      const tips = AI_TIPS[currentStepName as keyof typeof AI_TIPS] || [];
      return {
        ...prev,
        [currentStepName]: (prev[currentStepName] + 1) % tips.length
      };
    });
  };
  
  // Calculate progress percentage
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;
  
  // Animation variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };
  
  // Function to render the current step
  const renderCurrentStep = () => {
    const explanation = STEP_EXPLANATIONS[currentStepName as keyof typeof STEP_EXPLANATIONS];
    
    // Render completion step with results
    if (currentStep >= steps.length) {
      return (
        <motion.div
          key="completion"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Prediction Complete!</h2>
            <p className="text-gray-500">
              Here's your detailed building cost prediction based on the information provided.
            </p>
          </div>
          
          {predictionResult ? (
            <div className="space-y-6">
              {predictionResult.fallback && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-2">
                      <HelpCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Using Fallback Prediction</h3>
                        <p className="text-sm text-amber-700">{predictionResult.note || "AI prediction service is temporarily unavailable. We're using our standard calculation engine instead."}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Predicted Cost</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${typeof predictionResult.totalCost === 'string' 
                        ? predictionResult.totalCost 
                        : predictionResult.totalCost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-500">Total estimated cost</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Cost Per Square Foot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${typeof predictionResult.costPerSquareFoot === 'string'
                        ? predictionResult.costPerSquareFoot
                        : predictionResult.costPerSquareFoot.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-sm text-gray-500">Per square foot</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Cost Prediction Factors
                  </CardTitle>
                  <CardDescription>
                    These factors influenced your building cost prediction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {predictionResult.predictionFactors?.map((factor: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{factor.factor || factor.feature}</div>
                          <Badge variant={
                            factor.impact === 'positive' ? 'default' : 
                            factor.impact === 'negative' ? 'danger' : 'outline'
                          }>
                            {factor.impact === 'positive' ? 'Increases Cost' : 
                             factor.impact === 'negative' ? 'Decreases Cost' : 'Neutral Impact'}
                          </Badge>
                        </div>
                        <Progress value={factor.importance * 100} className="h-2" />
                        <p className="text-sm text-gray-500">{factor.explanation}</p>
                        <Separator className="my-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {(predictionResult.materialRecommendations || predictionResult.materialSubstitutions) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2" />
                      Material Recommendations
                    </CardTitle>
                    <CardDescription>
                      Potential cost-saving alternatives for your project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {predictionResult.materialRecommendations && predictionResult.materialRecommendations.map((rec: any, index: number) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <div className="font-medium">Replace: {rec.originalMaterial}</div>
                            <Badge variant="outline">
                              Save ${typeof rec.potentialSavings === 'string' 
                                ? rec.potentialSavings 
                                : rec.potentialSavings.toLocaleString('en-US')}
                            </Badge>
                          </div>
                          <p className="text-sm">With: <span className="font-medium">{rec.suggestedAlternative}</span></p>
                          <p className="text-sm text-gray-500">{rec.reasonForRecommendation}</p>
                          <Badge variant={
                            rec.qualityImpact === 'none' ? 'outline' : 
                            rec.qualityImpact === 'minor' ? 'success' :
                            rec.qualityImpact === 'moderate' ? 'default' : 'danger'
                          } className="mt-1">
                            Quality Impact: {rec.qualityImpact}
                          </Badge>
                          <Separator className="my-2" />
                        </div>
                      ))}
                      
                      {predictionResult.materialSubstitutions && predictionResult.materialSubstitutions.map((rec: any, index: number) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <div className="font-medium">Replace: {rec.originalMaterial}</div>
                            <Badge variant="outline">
                              Save {rec.potentialSavings}
                            </Badge>
                          </div>
                          <p className="text-sm">With: <span className="font-medium">{rec.substituteMaterial}</span></p>
                          <Badge variant="outline" className="mt-1">
                            Quality Impact: {rec.qualityImpact}
                          </Badge>
                          <Separator className="my-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex justify-between items-center">
                <Button variant="outline" onClick={() => setCurrentStep(0)}>
                  Start New Prediction
                </Button>
                <Button variant="default" onClick={() => {
                  // Here you would normally export the prediction
                  toast({
                    title: "Coming Soon",
                    description: "Export functionality will be available soon!",
                  });
                }}>
                  Export Prediction
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-3">Generating your prediction...</span>
            </div>
          )}
        </motion.div>
      );
    }
    
    return (
      <motion.div
        key={currentStep}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Step Title */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center">
            {steps[currentStep].icon && React.createElement(steps[currentStep].icon, { className: "h-6 w-6 mr-2" })}
            {explanation?.title || currentStepName}
          </h2>
          <p className="text-gray-500">{explanation?.description}</p>
        </div>
        
        {/* AI Assistant Tips */}
        {showAITips && AI_TIPS[currentStepName as keyof typeof AI_TIPS] && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <BrainCircuit className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-blue-700">AI Assistant Tip</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {AI_TIPS[currentStepName as keyof typeof AI_TIPS][currentTipIndex[currentStepName] || 0]}
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-7 text-xs text-blue-600"
                onClick={cycleAITip}
              >
                Next Tip <Zap className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Building Type Step */}
        {currentStepName === 'buildingType' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].map((type) => (
              <Card 
                key={type} 
                className={`cursor-pointer transition-all hover:bg-gray-50 ${
                  form.watch('buildingType') === type ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => form.setValue('buildingType', type as any)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{type.charAt(0) + type.slice(1).toLowerCase()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">
                    {explanation?.help && typeof explanation.help === 'object' 
                      ? explanation.help[type as keyof typeof explanation.help] 
                      : ''}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Location Step */}
        {currentStepName === 'location' && (
          <div className="space-y-4">
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
                      {REGIONS.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the region where the building is located.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {explanation?.help && typeof explanation.help === 'string' && (
              <div className="flex items-start mt-4">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">{explanation.help}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Dimensions Step */}
        {currentStepName === 'dimensions' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="squareFootage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Square Footage</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the total square footage of the building.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {explanation?.help && typeof explanation.help === 'string' && (
              <div className="flex items-start mt-4">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">{explanation.help}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Age Step */}
        {currentStepName === 'age' && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="yearBuilt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Built</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e.target.valueAsNumber);
                        updateBuildingAge(e.target.valueAsNumber);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the year the building was constructed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="buildingAge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Age (years)</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e.target.valueAsNumber);
                          updateYearBuilt(e.target.valueAsNumber);
                        }}
                      />
                    </FormControl>
                    <span className="text-sm text-gray-500">years</span>
                  </div>
                  <FormDescription>
                    The calculated age of the building.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {explanation?.help && typeof explanation.help === 'string' && (
              <div className="flex items-start mt-4">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">{explanation.help}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Quality Step */}
        {currentStepName === 'quality' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['ECONOMY', 'AVERAGE', 'GOOD', 'PREMIUM', 'LUXURY'].map((quality) => (
                <Card 
                  key={quality} 
                  className={`cursor-pointer transition-all hover:bg-gray-50 ${
                    form.watch('quality') === quality ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => form.setValue('quality', quality as any)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{quality.charAt(0) + quality.slice(1).toLowerCase()}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      {explanation?.help && typeof explanation.help === 'object' 
                        ? explanation.help[quality as keyof typeof explanation.help] 
                        : ''}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Complexity Step */}
        {currentStepName === 'complexity' && (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="complexityFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Building Complexity Factor</FormLabel>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Simple</span>
                      <span className="text-sm font-medium">{field.value.toFixed(2)}</span>
                      <span className="text-sm">Complex</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0.5}
                        max={1.5}
                        step={0.01}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Rate the complexity of the building design. Higher values indicate more complex structures.
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
                  <FormLabel>Building Condition Factor</FormLabel>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Poor</span>
                      <span className="text-sm font-medium">{field.value.toFixed(2)}</span>
                      <span className="text-sm">Excellent</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0.5}
                        max={1.5}
                        step={0.01}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Rate the current condition of the building. Higher values indicate better condition.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {explanation?.help && typeof explanation.help === 'string' && (
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">{explanation.help}</p>
              </div>
            )}
          </div>
        )}
        
        {/* Features Step */}
        {currentStepName === 'features' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableFeatures.map((feature) => (
                <div
                  key={feature}
                  className={`
                    flex items-center p-3 border rounded-md cursor-pointer transition-colors
                    ${form.watch('features')?.includes(feature) 
                      ? 'bg-primary/10 border-primary/20' 
                      : 'bg-white hover:bg-gray-50'}
                  `}
                  onClick={() => toggleFeature(feature)}
                >
                  <div className="mr-3">
                    {form.watch('features')?.includes(feature) ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            
            <FormField
              control={form.control}
              name="customFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Features</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter custom features, separated by commas"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Add any additional features not listed above, separated by commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {explanation?.help && typeof explanation.help === 'string' && (
              <div className="flex items-start mt-4">
                <HelpCircle className="h-5 w-5 mr-2 text-blue-500 mt-0.5" />
                <p className="text-sm text-gray-600">{explanation.help}</p>
              </div>
            )}
          </div>
        )}
        
        {/* AI Provider Selection Step */}
        {currentStepName === 'provider' && (
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select AI Provider</FormLabel>
                  <FormDescription>
                    Choose which AI provider to use for your building cost prediction
                  </FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-all
                        ${field.value === 'openai' 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'hover:bg-slate-50'}
                      `}
                      onClick={() => form.setValue('provider', 'openai')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-lg">OpenAI</div>
                        <div className={`w-4 h-4 rounded-full ${field.value === 'openai' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Uses OpenAI's GPT-4o model for detailed cost analysis with industry expertise.
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Zap className="h-3 w-3 mr-1" /> Optimized for detailed reasoning
                      </div>
                    </div>
                    
                    <div
                      className={`
                        border rounded-lg p-4 cursor-pointer transition-all
                        ${field.value === 'anthropic' 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'hover:bg-slate-50'}
                      `}
                      onClick={() => form.setValue('provider', 'anthropic')}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-lg">Anthropic Claude</div>
                        <div className={`w-4 h-4 rounded-full ${field.value === 'anthropic' ? 'bg-primary' : 'bg-gray-200'}`}></div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Uses Anthropic's Claude 3 model for nuanced regional cost factors and contextual analysis.
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Settings className="h-3 w-3 mr-1" /> Specialty in regional variations
                      </div>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Card className="bg-blue-50 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Info className="h-4 w-4 mr-1 text-blue-500" />
                  <span className="text-blue-700">About AI Providers</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-800">
                  Both providers offer similar accuracy but may have subtle differences in how they approach cost calculations.
                  You can try both to see which gives results that better match your expectations.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <Card className="w-full mx-auto shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Bot className="h-5 w-5 mr-2" />
              AI Cost Prediction Wizard
            </CardTitle>
            <CardDescription>
              Get an accurate building cost prediction in a few easy steps
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">AI Tips</span>
            <Switch
              checked={showAITips}
              onCheckedChange={setShowAITips}
            />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Step {currentStep + 1} of {totalSteps}</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form className="space-y-6">
            <AnimatePresence mode="wait">
              {renderCurrentStep()}
            </AnimatePresence>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-6">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSubmitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        {currentStep < steps.length ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {currentStep === steps.length - 1 ? (
              <>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Processing
                  </>
                ) : (
                  <>
                    Complete
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}