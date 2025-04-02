/**
 * Predictive Cost Analysis Component
 * 
 * A visualization component that uses AI/ML to predict building costs
 * based on various features and provides explanations for the predictions.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ErrorBar,
  Cell,
  Tooltip as RechartsTooltip,
  LabelList,
} from 'recharts';
import {
  AlertCircle,
  BarChart as BarChartIcon,
  Brain,
  Calculator,
  Check,
  ChevronsUpDown,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  Lock,
  Save,
  Search,
  Settings,
  Star,
  X,
} from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useVisualizationContext } from '@/contexts/visualization-context';
import {
  CostPredictionModel,
  type BuildingFeatures,
  type PredictionResult,
  type PredictionExplanation
} from '@/utils/prediction-utils';

// Interface for props
interface PredictiveCostAnalysisProps {
  className?: string;
}

// Schema for the prediction form
const predictionFormSchema = z.object({
  squareFeet: z.coerce.number().positive('Square feet must be a positive number').min(100, 'Minimum 100 square feet'),
  buildingType: z.string().min(1, 'Building type is required'),
  region: z.string().min(1, 'Region is required'),
  year: z.coerce.number().int().min(2020, 'Year must be 2020 or later').max(2030, 'Year must be 2030 or earlier').optional(),
  quality: z.enum(['Basic', 'Standard', 'Premium']).optional(),
  complexity: z.enum(['Low', 'Medium', 'High']).optional(),
  condition: z.enum(['Fair', 'Good', 'Excellent']).optional(),
});

type PredictionFormValues = z.infer<typeof predictionFormSchema>;

/**
 * Format currency values
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage values
 */
const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Predictive Cost Analysis Component
 */
export function PredictiveCostAnalysis({ className = '' }: PredictiveCostAnalysisProps) {
  // Prediction model state
  const [model, setModel] = useState<CostPredictionModel | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  // Prediction state
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [explanation, setExplanation] = useState<PredictionExplanation | null>(null);
  const [savedPredictions, setSavedPredictions] = useState<Array<{
    id: string;
    features: BuildingFeatures;
    prediction: PredictionResult;
    date: Date;
  }>>([]);

  // Feature comparison state
  const [featureComparison, setFeatureComparison] = useState<{
    feature: string;
    values: string[] | number[];
    predictions: Array<{ value: string | number; prediction: PredictionResult }>;
  } | null>(null);

  // Form for prediction inputs
  const form = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionFormSchema),
    defaultValues: {
      squareFeet: 2500,
      buildingType: 'Residential',
      region: 'Eastern',
      year: new Date().getFullYear(),
      quality: 'Standard',
      complexity: 'Medium',
      condition: 'Good',
    }
  });

  // Get the visualization context for potential filters
  const { filters } = useVisualizationContext();

  // Fetch cost matrix data for available options
  const { data: costMatrixData } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Extract available options from cost matrix data
  const availableOptions = useMemo(() => {
    if (!costMatrixData || !Array.isArray(costMatrixData)) return {
      buildingTypes: ['Residential', 'Commercial', 'Industrial'],
      regions: ['Eastern', 'Western', 'Southern', 'Northern'],
      qualities: ['Basic', 'Standard', 'Premium'],
      complexities: ['Low', 'Medium', 'High'],
      conditions: ['Fair', 'Good', 'Excellent']
    };

    // Extract unique values from data
    const buildingTypesSet = new Set();
    const regionsSet = new Set();
    const qualitiesSet = new Set();
    const complexitiesSet = new Set();
    const conditionsSet = new Set();
    
    costMatrixData.forEach(item => {
      if (item.buildingType) buildingTypesSet.add(item.buildingType);
      if (item.region) regionsSet.add(item.region);
      if (item.quality) qualitiesSet.add(item.quality);
      if (item.complexity) complexitiesSet.add(item.complexity);
      if (item.condition) conditionsSet.add(item.condition);
    });
    
    const buildingTypes = Array.from(buildingTypesSet) as string[];
    const regions = Array.from(regionsSet) as string[];
    const qualities = Array.from(qualitiesSet) as string[];
    const complexities = Array.from(complexitiesSet) as string[];
    const conditions = Array.from(conditionsSet) as string[];

    return {
      buildingTypes: buildingTypes.length > 0 ? buildingTypes : ['Residential', 'Commercial', 'Industrial'],
      regions: regions.length > 0 ? regions : ['Eastern', 'Western', 'Southern', 'Northern'],
      qualities: qualities.length > 0 ? qualities : ['Basic', 'Standard', 'Premium'],
      complexities: complexities.length > 0 ? complexities : ['Low', 'Medium', 'High'],
      conditions: conditions.length > 0 ? conditions : ['Fair', 'Good', 'Excellent']
    };
  }, [costMatrixData]);

  // Initialize model on component mount
  useEffect(() => {
    initializeModel();
  }, []);

  // Apply filters from context to form if available
  useEffect(() => {
    if (filters) {
      // Apply building type filter if only one is selected
      if (filters.buildingTypes && filters.buildingTypes.length === 1) {
        form.setValue('buildingType', filters.buildingTypes[0]);
      }

      // Apply region filter if only one is selected
      if (filters.regions && filters.regions.length === 1) {
        form.setValue('region', filters.regions[0]);
      }
    }
  }, [filters, form]);

  /**
   * Initialize the prediction model
   */
  const initializeModel = async () => {
    try {
      setModelLoading(true);
      setModelError(null);

      // Create new model
      const costModel = new CostPredictionModel();

      // Load serialized model from localStorage if available
      const savedModel = localStorage.getItem('costPredictionModel');
      if (savedModel) {
        try {
          await costModel.deserialize(savedModel);
          console.log('Loaded model from localStorage');
        } catch (error) {
          console.warn('Failed to load model from localStorage, training new model');
          await costModel.train();
          
          // Save trained model
          localStorage.setItem('costPredictionModel', costModel.serialize());
        }
      } else {
        await costModel.train();
        
        // Save trained model
        localStorage.setItem('costPredictionModel', costModel.serialize());
      }

      setModel(costModel);
      setModelReady(true);
    } catch (error) {
      console.error('Error initializing model:', error);
      setModelError('Failed to initialize prediction model. Please try refreshing the page.');
    } finally {
      setModelLoading(false);
    }
  };

  /**
   * Generate prediction from form values
   */
  const onSubmit = async (values: PredictionFormValues) => {
    if (!model || !modelReady) {
      setModelError('Model is not ready. Please try again.');
      return;
    }

    try {
      setPredictionLoading(true);
      setPrediction(null);
      setExplanation(null);

      // Build features object
      const features: BuildingFeatures = {
        squareFeet: values.squareFeet,
        buildingType: values.buildingType,
        region: values.region,
        year: values.year,
        quality: values.quality,
        complexity: values.complexity,
        condition: values.condition
      };

      // Generate prediction
      const result = await model.predict(features);
      setPrediction(result);

      // Generate explanation
      const explainResult = await model.explainPrediction(features, result);
      setExplanation(explainResult);
    } catch (error) {
      console.error('Error generating prediction:', error);
      setModelError('Failed to generate prediction. Please try different inputs.');
    } finally {
      setPredictionLoading(false);
    }
  };

  /**
   * Save current prediction to list
   */
  const savePrediction = () => {
    if (!prediction) return;

    const currentFormValues = form.getValues();
    const features: BuildingFeatures = {
      squareFeet: currentFormValues.squareFeet,
      buildingType: currentFormValues.buildingType,
      region: currentFormValues.region,
      year: currentFormValues.year,
      quality: currentFormValues.quality,
      complexity: currentFormValues.complexity,
      condition: currentFormValues.condition
    };

    // Create saved prediction
    const savedPrediction = {
      id: Date.now().toString(),
      features,
      prediction,
      date: new Date()
    };

    // Add to saved predictions
    setSavedPredictions(prev => [savedPrediction, ...prev]);
  };

  /**
   * Remove saved prediction
   */
  const removeSavedPrediction = (id: string) => {
    setSavedPredictions(prev => prev.filter(item => item.id !== id));
  };

  /**
   * Load saved prediction into form
   */
  const loadSavedPrediction = (id: string) => {
    const saved = savedPredictions.find(item => item.id === id);
    if (!saved) return;

    // Set form values
    form.setValue('squareFeet', saved.features.squareFeet);
    form.setValue('buildingType', saved.features.buildingType);
    form.setValue('region', saved.features.region);
    if (saved.features.year) form.setValue('year', saved.features.year);
    if (saved.features.quality) form.setValue('quality', saved.features.quality as any);
    if (saved.features.complexity) form.setValue('complexity', saved.features.complexity as any);
    if (saved.features.condition) form.setValue('condition', saved.features.condition as any);

    // Set prediction and explanation
    setPrediction(saved.prediction);
    
    // Generate explanation for loaded prediction
    if (model && modelReady) {
      model.explainPrediction(saved.features, saved.prediction)
        .then(explainResult => setExplanation(explainResult))
        .catch(error => console.error('Error generating explanation:', error));
    }
  };

  /**
   * Compare predictions across different values for a feature
   */
  const compareFeatureValues = async (feature: string) => {
    if (!model || !modelReady) return;

    const baseFeatures = form.getValues();
    
    try {
      setPredictionLoading(true);
      
      let values: string[] | number[] = [];
      let predictions: Array<{ value: string | number; prediction: PredictionResult }> = [];
      
      // Define values to compare based on feature
      switch (feature) {
        case 'buildingType':
          values = availableOptions.buildingTypes;
          break;
        case 'region':
          values = availableOptions.regions;
          break;
        case 'quality':
          values = availableOptions.qualities;
          break;
        case 'complexity':
          values = availableOptions.complexities;
          break;
        case 'condition':
          values = availableOptions.conditions;
          break;
        case 'squareFeet':
          // Generate range of square footages
          const baseSqFt = baseFeatures.squareFeet;
          values = [
            Math.max(100, Math.round(baseSqFt * 0.5)),
            Math.round(baseSqFt * 0.75),
            baseSqFt,
            Math.round(baseSqFt * 1.25),
            Math.round(baseSqFt * 1.5)
          ];
          break;
        case 'year':
          // Generate range of years
          const currentYear = new Date().getFullYear();
          values = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
          break;
        default:
          return;
      }
      
      // Generate predictions for each value
      for (const value of values) {
        // Create features for this prediction
        const predictionFeatures: BuildingFeatures = {
          ...baseFeatures,
          [feature]: value
        };
        
        // Generate prediction
        const predictionResult = await model.predict(predictionFeatures);
        
        // Add to results
        predictions.push({
          value,
          prediction: predictionResult
        });
      }
      
      // Set comparison data
      setFeatureComparison({
        feature,
        values,
        predictions
      });
    } catch (error) {
      console.error('Error comparing features:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  /**
   * Get formatted base cost for a prediction
   */
  const getFormattedCost = (predictionResult: PredictionResult) => {
    return formatCurrency(predictionResult.baseCost);
  };
  
  /**
   * Convert comparison data to chart format
   */
  const comparisonChartData = useMemo(() => {
    if (!featureComparison) return [];
    
    return featureComparison.predictions.map(item => ({
      name: item.value.toString(),
      cost: item.prediction.baseCost,
      errorLower: item.prediction.baseCost - item.prediction.confidenceInterval.lower,
      errorUpper: item.prediction.confidenceInterval.upper - item.prediction.baseCost
    }));
  }, [featureComparison]);

  /**
   * Create human-readable name for feature
   */
  const getFeatureDisplayName = (feature: string) => {
    const displayNames: Record<string, string> = {
      'squareFeet': 'Square Footage',
      'buildingType': 'Building Type',
      'region': 'Region',
      'year': 'Year Built',
      'quality': 'Quality Level',
      'complexity': 'Complexity',
      'condition': 'Condition'
    };
    
    return displayNames[feature] || feature;
  };

  /**
   * Format confidence score as text
   */
  const getConfidenceText = (score: number) => {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.7) return 'High';
    if (score >= 0.5) return 'Moderate';
    if (score >= 0.3) return 'Low';
    return 'Very Low';
  };

  /**
   * Get color for confidence level
   */
  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 text-green-800';
    if (score >= 0.7) return 'bg-emerald-100 text-emerald-800';
    if (score >= 0.5) return 'bg-amber-100 text-amber-800';
    if (score >= 0.3) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  /**
   * Format impact factor for visualization
   */
  const getImpactColor = (impact: number, direction: string) => {
    const baseColor = direction === 'positive' ? 'bg-blue-' : 'bg-red-';
    
    if (impact >= 0.5) return `${baseColor}500`;
    if (impact >= 0.3) return `${baseColor}400`;
    if (impact >= 0.1) return `${baseColor}300`;
    return `${baseColor}200`;
  };

  /**
   * Render model status
   */
  const renderModelStatus = () => {
    if (modelLoading) {
      return (
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertTitle className="text-blue-800">Initializing prediction model</AlertTitle>
          <AlertDescription className="text-blue-700">
            Please wait while the AI cost prediction model is being initialized.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (modelError) {
      return (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Model Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {modelError}
          </AlertDescription>
        </Alert>
      );
    }
    
    if (modelReady) {
      return (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">AI Model Ready</AlertTitle>
          <AlertDescription className="text-green-700">
            The cost prediction model is ready. Fill in the building details below to generate a prediction.
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };

  return (
    <div className={className}>
      <Card className="shadow-md mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Cost Prediction
              </CardTitle>
              <CardDescription>
                Advanced machine learning model to predict building costs
              </CardDescription>
            </div>
            
            {modelReady && (
              <Button
                variant="outline"
                size="sm"
                disabled={!featureComparison}
                onClick={() => setFeatureComparison(null)}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Comparison
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderModelStatus()}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Prediction Form */}
            <div>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Building Details</CardTitle>
                  <CardDescription>
                    Enter the details of the building to predict its cost
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="squareFeet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Square Feet</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  {...field}
                                  disabled={predictionLoading}
                                />
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!modelReady || predictionLoading}
                                        onClick={() => compareFeatureValues('squareFeet')}
                                      >
                                        <BarChartIcon className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Compare different square footages
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={predictionLoading}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select building type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableOptions.buildingTypes.map(type => (
                                      <SelectItem key={type} value={type}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!modelReady || predictionLoading}
                                        onClick={() => compareFeatureValues('buildingType')}
                                      >
                                        <BarChartIcon className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Compare different building types
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </FormControl>
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
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                  disabled={predictionLoading}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableOptions.regions.map(region => (
                                      <SelectItem key={region} value={region}>
                                        {region}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={!modelReady || predictionLoading}
                                        onClick={() => compareFeatureValues('region')}
                                      >
                                        <BarChartIcon className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Compare different regions
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="additional">
                          <AccordionTrigger>
                            <span className="text-sm font-medium">Additional Details</span>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4 pb-2">
                            <div className="space-y-6">
                              <FormField
                                control={form.control}
                                name="year"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Year Built</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          {...field}
                                          disabled={predictionLoading}
                                        />
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!modelReady || predictionLoading}
                                                onClick={() => compareFeatureValues('year')}
                                              >
                                                <BarChartIcon className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Compare different years
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="quality"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Quality Level</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={field.value}
                                          onValueChange={field.onChange}
                                          disabled={predictionLoading}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select quality" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableOptions.qualities.map(quality => (
                                              <SelectItem key={quality} value={quality}>
                                                {quality}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!modelReady || predictionLoading}
                                                onClick={() => compareFeatureValues('quality')}
                                              >
                                                <BarChartIcon className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Compare different quality levels
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="complexity"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Complexity</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={field.value}
                                          onValueChange={field.onChange}
                                          disabled={predictionLoading}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select complexity" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableOptions.complexities.map(complexity => (
                                              <SelectItem key={complexity} value={complexity}>
                                                {complexity}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!modelReady || predictionLoading}
                                                onClick={() => compareFeatureValues('complexity')}
                                              >
                                                <BarChartIcon className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Compare different complexity levels
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Condition</FormLabel>
                                    <FormControl>
                                      <div className="flex items-center gap-2">
                                        <Select
                                          value={field.value}
                                          onValueChange={field.onChange}
                                          disabled={predictionLoading}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select condition" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableOptions.conditions.map(condition => (
                                              <SelectItem key={condition} value={condition}>
                                                {condition}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!modelReady || predictionLoading}
                                                onClick={() => compareFeatureValues('condition')}
                                              >
                                                <BarChartIcon className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              Compare different conditions
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                      
                      <div className="pt-2">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={!modelReady || predictionLoading}
                        >
                          {predictionLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating Prediction...
                            </>
                          ) : (
                            <>
                              <Calculator className="h-4 w-4 mr-2" />
                              Generate Cost Prediction
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              
              {savedPredictions.length > 0 && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Saved Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {savedPredictions.map((saved) => (
                        <div
                          key={saved.id}
                          className="flex items-center justify-between p-2 border rounded-md hover:bg-slate-50 cursor-pointer"
                          onClick={() => loadSavedPrediction(saved.id)}
                        >
                          <div>
                            <div className="font-medium text-sm">
                              {saved.features.buildingType} in {saved.features.region}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {saved.features.squareFeet.toLocaleString()} sq.ft. · {getFormattedCost(saved.prediction)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSavedPrediction(saved.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Feature Comparison (if active) */}
            {featureComparison ? (
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {getFeatureDisplayName(featureComparison.feature)} Comparison
                    </CardTitle>
                    <CardDescription>
                      Compare how different values affect the predicted cost
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            label={{ 
                              value: getFeatureDisplayName(featureComparison.feature), 
                              position: 'bottom', 
                              offset: 0,
                              dy: 30 
                            }}
                          />
                          <YAxis 
                            tickFormatter={(value) => {
                              return formatCurrency(value);
                            }}
                            label={{ 
                              value: 'Predicted Cost', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle' }
                            }}
                          />
                          <RechartsTooltip
                            formatter={(value: any) => {
                              return [formatCurrency(value), 'Predicted Cost'];
                            }}
                          />
                          <Bar 
                            dataKey="cost" 
                            fill="#3b82f6"
                            isAnimationActive={false}
                          >
                            <LabelList 
                              dataKey="cost" 
                              position="top" 
                              formatter={(value: any) => formatCurrency(value)} 
                              style={{ fontSize: '12px' }}
                            />
                            <ErrorBar 
                              dataKey="errorUpper" 
                              direction="y" 
                              width={4} 
                              strokeWidth={1}
                              stroke="#888" 
                              style={{ opacity: 0.6 }} 
                            />
                            <ErrorBar 
                              dataKey="errorLower" 
                              direction="y" 
                              width={4} 
                              strokeWidth={1}
                              stroke="#888" 
                              style={{ opacity: 0.6 }} 
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 rounded-md bg-slate-50 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-slate-500" />
                        <h4 className="font-medium text-sm">Insights</h4>
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        {(() => {
                          if (!featureComparison.predictions.length) return null;
                          
                          // Sort predictions by cost
                          const sorted = [...featureComparison.predictions].sort((a, b) => 
                            b.prediction.baseCost - a.prediction.baseCost
                          );
                          
                          const highest = sorted[0];
                          const lowest = sorted[sorted.length - 1];
                          const difference = highest.prediction.baseCost - lowest.prediction.baseCost;
                          const percentDiff = (difference / lowest.prediction.baseCost) * 100;
                          
                          return (
                            <>
                              <p>
                                <span className="font-medium text-slate-700">
                                  {getFeatureDisplayName(featureComparison.feature)}
                                </span> has a significant impact on predicted costs.
                              </p>
                              
                              <p>
                                Changing from <span className="font-medium text-slate-700">{lowest.value}</span> to{' '}
                                <span className="font-medium text-slate-700">{highest.value}</span> increases the 
                                predicted cost by <span className="font-medium text-slate-700">
                                  {formatCurrency(difference)}
                                </span> ({percentDiff.toFixed(1)}%).
                              </p>
                              
                              {featureComparison.feature === 'squareFeet' && (
                                <p>
                                  Cost per square foot ranges from{' '}
                                  <span className="font-medium text-slate-700">
                                    {formatCurrency(featureComparison.predictions[0].prediction.baseCost / Number(featureComparison.predictions[0].value))}
                                  </span> to{' '}
                                  <span className="font-medium text-slate-700">
                                    {formatCurrency(featureComparison.predictions[featureComparison.predictions.length - 1].prediction.baseCost / Number(featureComparison.predictions[featureComparison.predictions.length - 1].value))}
                                  </span> per sq.ft.
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Prediction Results */
              <div className="lg:col-span-2">
                {prediction ? (
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Prediction Results</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={savePrediction}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="summary">
                        <TabsList className="mb-4">
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="factors">Contributing Factors</TabsTrigger>
                          <TabsTrigger value="details">Details</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="summary">
                          <div className="space-y-6">
                            {/* Main prediction result */}
                            <div className="bg-slate-50 rounded-lg p-6 text-center">
                              <div className="text-sm font-medium text-muted-foreground mb-1">
                                Estimated Building Cost
                              </div>
                              <div className="text-4xl font-bold text-primary">
                                {formatCurrency(prediction.baseCost)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                95% Confidence Interval: {formatCurrency(prediction.confidenceInterval.lower)} - {formatCurrency(prediction.confidenceInterval.upper)}
                              </div>
                              <Badge 
                                className={`mt-3 ${getConfidenceColor(prediction.confidenceScore)}`}
                              >
                                {getConfidenceText(prediction.confidenceScore)} Confidence
                              </Badge>
                            </div>
                            
                            {/* Explanation summary */}
                            {explanation && (
                              <Alert className="bg-blue-50 border-blue-200">
                                <Lightbulb className="h-4 w-4 text-blue-600" />
                                <AlertTitle className="text-blue-800">AI Insight</AlertTitle>
                                <AlertDescription className="text-blue-700">
                                  {explanation.summary}
                                </AlertDescription>
                              </Alert>
                            )}
                            
                            {/* Building details summary */}
                            <div className="border rounded-lg p-4">
                              <h3 className="text-sm font-medium mb-3">Building Details</h3>
                              <div className="grid grid-cols-2 gap-y-2 text-sm">
                                <div className="text-muted-foreground">Building Type:</div>
                                <div className="font-medium">{form.getValues().buildingType}</div>
                                
                                <div className="text-muted-foreground">Region:</div>
                                <div className="font-medium">{form.getValues().region}</div>
                                
                                <div className="text-muted-foreground">Square Feet:</div>
                                <div className="font-medium">{form.getValues().squareFeet.toLocaleString()}</div>
                                
                                <div className="text-muted-foreground">Year Built:</div>
                                <div className="font-medium">{form.getValues().year || 'Not specified'}</div>
                                
                                <div className="text-muted-foreground">Quality:</div>
                                <div className="font-medium">{form.getValues().quality || 'Not specified'}</div>
                                
                                <div className="text-muted-foreground">Complexity:</div>
                                <div className="font-medium">{form.getValues().complexity || 'Not specified'}</div>
                                
                                <div className="text-muted-foreground">Condition:</div>
                                <div className="font-medium">{form.getValues().condition || 'Not specified'}</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="factors">
                          {explanation ? (
                            <div className="space-y-6">
                              <div className="bg-slate-50 p-4 rounded-lg">
                                <h3 className="font-medium mb-3">Key Factors Influencing Cost</h3>
                                <div className="space-y-4">
                                  {explanation.factors.map((factor, index) => (
                                    <div key={index} className="space-y-1">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{factor.feature}</span>
                                        <span className={
                                          factor.direction === 'positive' 
                                            ? 'text-blue-600' 
                                            : 'text-red-600'
                                        }>
                                          {factor.direction === 'positive' ? 'Increases' : 'Decreases'} Cost
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2.5">
                                        <div 
                                          className={`h-2.5 rounded-full ${getImpactColor(factor.impact, factor.direction)}`}
                                          style={{ width: `${Math.max(5, factor.impact * 100)}%` }}
                                        ></div>
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {factor.description}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <Alert className="bg-amber-50 border-amber-200">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800">Factor Impact</AlertTitle>
                                <AlertDescription className="text-amber-700">
                                  These factors show the relative importance and direction of each feature in 
                                  the prediction. The longer the bar, the more impact that factor has on the 
                                  final cost prediction.
                                </AlertDescription>
                              </Alert>
                              
                              <div className="border rounded-lg p-4">
                                <h3 className="text-sm font-medium mb-3">Try Changing Factors</h3>
                                <div className="text-sm text-muted-foreground">
                                  <p>
                                    Adjust the values of high-impact factors to see how they affect the 
                                    predicted cost. Use the comparison buttons next to each input field 
                                    to explore options.
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-64">
                              <div className="text-center">
                                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                                <p className="text-muted-foreground">Analyzing factors...</p>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="details">
                          <div className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">Base Cost</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(prediction.baseCost)}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Estimated construction cost without adjustments
                                  </p>
                                </CardContent>
                              </Card>
                              
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm font-medium">Adjusted Cost</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">
                                    {formatCurrency(prediction.adjustedCost)}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Cost adjusted for current market conditions
                                  </p>
                                </CardContent>
                              </Card>
                            </div>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Confidence Analysis</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm">Confidence Score</span>
                                      <span className="text-sm font-medium">{(prediction.confidenceScore * 100).toFixed(0)}%</span>
                                    </div>
                                    <Progress value={prediction.confidenceScore * 100} />
                                  </div>
                                  
                                  <div className="text-sm">
                                    <div className="font-medium mb-1">Confidence Interval</div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Lower Bound:</span>
                                      <span>{formatCurrency(prediction.confidenceInterval.lower)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Upper Bound:</span>
                                      <span>{formatCurrency(prediction.confidenceInterval.upper)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Range:</span>
                                      <span>{formatCurrency(prediction.confidenceInterval.upper - prediction.confidenceInterval.lower)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground pt-2">
                                    <p>
                                      Confidence score indicates the model's certainty in this prediction. 
                                      Higher values indicate more reliable predictions. The confidence interval 
                                      shows the range where the actual cost is likely to fall.
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Cost Metrics</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cost per Square Foot:</span>
                                    <span className="font-medium">
                                      {formatCurrency(prediction.baseCost / form.getValues().squareFeet)}
                                    </span>
                                  </div>
                                  
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Square Feet:</span>
                                    <span className="font-medium">
                                      {form.getValues().squareFeet.toLocaleString()}
                                    </span>
                                  </div>
                                  
                                  <Separator className="my-2" />
                                  
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Predicted Total Cost:</span>
                                    <span className="font-medium">
                                      {formatCurrency(prediction.baseCost)}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full">
                    <div className="flex items-center justify-center h-full py-12">
                      <div className="text-center max-w-md p-6">
                        <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">AI Cost Prediction</h3>
                        <p className="text-muted-foreground mb-6">
                          Fill in the building details and click "Generate Cost Prediction" to 
                          get an AI-powered estimate of building costs.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-muted-foreground">
                          <h4 className="font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Pro Tips
                          </h4>
                          <ul className="space-y-2 list-disc pl-4">
                            <li>Enter accurate square footage for the best results</li>
                            <li>Use the comparison feature to see how different factors affect costs</li>
                            <li>Save predictions to compare different building scenarios</li>
                            <li>The more details you provide, the more accurate the prediction</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}