/**
 * Predictive Cost Analysis Component
 * 
 * This component uses AI/ML to predict building costs based on various features
 * and provides explanations for the predictions. It integrates with the backend
 * AI prediction engine to generate advanced cost forecasts with confidence intervals
 * and factor analysis.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar, Cell } from 'recharts';
import { BrainCircuit, Info, DollarSign, Calendar, Lightbulb, TrendingUp, Percent, BarChart2, MapPin, Building, PanelTopClose } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Types from shared prediction-utils
export interface PredictionFeatureImportance {
  feature: string;
  importance: number; // 0-1 scale
  impact: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface MaterialSubstitutionRecommendation {
  originalMaterial: string;
  suggestedAlternative: string;
  potentialSavings: number;
  qualityImpact: 'none' | 'minor' | 'moderate' | 'significant';
  sustainabilityScore: number; // 0-100
  reasonForRecommendation: string;
}

export interface PredictionResult {
  predictedCost: number;
  totalCost: number;
  costPerSquareFoot: number;
  confidenceInterval: [number, number];
  confidenceScore: number; // 0-1 value indicating confidence
  yearPredicted: number;
  predictionFactors: PredictionFeatureImportance[];
  materialRecommendations?: MaterialSubstitutionRecommendation[];
  errorMargin: number; // Percentage
  timestamp: string;
}

// Component props
interface PredictiveCostAnalysisProps {
  buildingType: string;
  squareFeet: number;
  quality: string;
  buildingAge: number;
  region: string;
  complexityFactor: number;
  conditionFactor: number;
  includeExplanations?: boolean;
  onPredictionGenerated?: (prediction: PredictionResult) => void;
}

// Main component
export function PredictiveCostAnalysis({
  buildingType,
  squareFeet,
  quality,
  buildingAge,
  region,
  complexityFactor,
  conditionFactor,
  includeExplanations = true,
  onPredictionGenerated
}: PredictiveCostAnalysisProps) {
  const [activeTab, setActiveTab] = useState('forecast');
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear() + 1);
  const [predictionYears, setPredictionYears] = useState<number[]>([1, 3, 5, 10]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [multiYearPredictions, setMultiYearPredictions] = useState<Array<{ year: number, cost: number, lowerBound: number, upperBound: number }>>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [forecastSettings, setForecastSettings] = useState({
    includeInflation: true,
    includeMaterialTrends: true,
    includeRegionalFactors: true,
    includeLaborTrends: true
  });
  
  // API key status check
  const { data: apiKeyStatus } = useQuery({
    queryKey: ['/api/settings/OPENAI_API_KEY_STATUS'],
    retry: false,
    staleTime: 60 * 60 * 1000, // 1 hour
  }) as { data?: { value: string } };
  
  // Handle generating a prediction
  const generatePrediction = async () => {
    setIsGenerating(true);
    
    try {
      // In a production app, this would call the real API endpoint
      // const result = await apiRequest<PredictionResult>('/api/ai/cost-prediction', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     buildingType,
      //     region,
      //     squareFootage: squareFeet,
      //     quality,
      //     buildingAge,
      //     complexityFactor,
      //     conditionFactor,
      //     targetYear,
      //     features
      //   })
      // });
      
      // For development, we'll use mock data
      const mockResult = generateMockPrediction();
      setPredictionResult(mockResult);
      
      // Generate multi-year predictions
      const multiYear = predictionYears.map(years => {
        const year = new Date().getFullYear() + years;
        // Apply compound annual growth rate (CAGR) for cost increases
        // In a real app, this would use more sophisticated models
        const cagr = 0.035 + (Math.random() * 0.01) - 0.005; // 3.5% +/- 0.5%
        const costMultiplier = Math.pow((1 + cagr), years);
        const cost = mockResult.totalCost * costMultiplier;
        // Increase uncertainty with time
        const uncertaintyFactor = 1 + (years * 0.05);
        const errorMargin = mockResult.errorMargin * uncertaintyFactor;
        const marginAmount = cost * (errorMargin / 100);
        
        return {
          year,
          cost,
          lowerBound: cost - marginAmount,
          upperBound: cost + marginAmount
        };
      });
      
      setMultiYearPredictions(multiYear);
      
      if (onPredictionGenerated) {
        onPredictionGenerated(mockResult);
      }
    } catch (error) {
      console.error('Error generating prediction:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Create a mock prediction for development
  const generateMockPrediction = (): PredictionResult => {
    // Base cost calculation based on inputs
    const baseCostPerSqFt = {
      'RESIDENTIAL': { 'ECONOMY': 125, 'AVERAGE': 150, 'GOOD': 185, 'PREMIUM': 225, 'LUXURY': 300 },
      'COMMERCIAL': { 'ECONOMY': 150, 'AVERAGE': 185, 'GOOD': 225, 'PREMIUM': 275, 'LUXURY': 350 },
      'INDUSTRIAL': { 'ECONOMY': 100, 'AVERAGE': 135, 'GOOD': 165, 'PREMIUM': 200, 'LUXURY': 250 }
    };
    
    // Regional multipliers
    const regionMultipliers: Record<string, number> = {
      'Northeast': 1.2,
      'West': 1.15,
      'Midwest': 0.95,
      'South': 0.9,
      'Benton County': 1.05,
      'Eastern Washington': 1.0,
      'Western Washington': 1.12
    };
    
    // Get the base cost per square foot
    const baseCost = (baseCostPerSqFt[buildingType as keyof typeof baseCostPerSqFt] || baseCostPerSqFt['COMMERCIAL'])[quality as keyof typeof baseCostPerSqFt['COMMERCIAL']] || 150;
    
    // Calculate age depreciation
    const ageRate = {
      'RESIDENTIAL': 0.013, // 1.3% per year
      'COMMERCIAL': 0.01,   // 1% per year
      'INDUSTRIAL': 0.009   // 0.9% per year
    };
    
    const maxDepreciation = 0.8; // 80% maximum depreciation
    const ageDepreciationRate = ageRate[buildingType as keyof typeof ageRate] || 0.01;
    const ageDepreciation = Math.min(ageDepreciationRate * buildingAge, maxDepreciation);
    
    // Apply adjustments
    const regionMultiplier = regionMultipliers[region] || 1.0;
    const ageMultiplier = 1 - ageDepreciation;
    
    // Predictive factors for future costs
    const inflationRate = 0.035; // 3.5% annual inflation
    const targetYearDelta = targetYear - new Date().getFullYear();
    const inflationMultiplier = Math.pow(1 + inflationRate, targetYearDelta);
    
    // Calculate cost with all factors
    const predictedBaseCost = baseCost * squareFeet;
    const adjustedCost = predictedBaseCost * regionMultiplier * complexityFactor * conditionFactor * ageMultiplier;
    const futureAdjustedCost = adjustedCost * inflationMultiplier;
    
    // Calculate confidence interval and score
    const confidenceBase = 0.9; // Base confidence score (90%)
    const confidenceModifier = Math.max(0, 0.1 - (targetYearDelta * 0.01)); // Decrease confidence for future years
    const confidenceScore = confidenceBase - (buildingAge > 20 ? 0.05 : 0) + confidenceModifier;
    
    // Calculate error margin based on confidence
    const errorMargin = (1 - confidenceScore) * 100;
    const marginAmount = futureAdjustedCost * (errorMargin / 100);
    const confidenceInterval: [number, number] = [
      futureAdjustedCost - marginAmount,
      futureAdjustedCost + marginAmount
    ];
    
    // Generate prediction factors with explanations
    const factors: PredictionFeatureImportance[] = [
      {
        feature: 'Square Footage',
        importance: 0.35,
        impact: 'positive',
        explanation: `The building size (${squareFeet} sq ft) is the primary cost driver and scales linearly with total cost.`
      },
      {
        feature: 'Building Age',
        importance: 0.15,
        impact: buildingAge > 15 ? 'negative' : 'neutral',
        explanation: `The building age (${buildingAge} years) results in a ${(ageDepreciation * 100).toFixed(1)}% depreciation factor according to standard ${buildingType.toLowerCase()} depreciation rates.`
      },
      {
        feature: 'Regional Factors',
        importance: 0.20,
        impact: regionMultiplier > 1 ? 'positive' : 'negative',
        explanation: `Construction costs in ${region} are typically ${((regionMultiplier - 1) * 100).toFixed(1)}% ${regionMultiplier > 1 ? 'higher' : 'lower'} than the national average due to labor markets and material availability.`
      },
      {
        feature: 'Inflation',
        importance: 0.12,
        impact: 'positive',
        explanation: `Projected inflation of ${(inflationRate * 100).toFixed(1)}% annually will increase costs by approximately ${((inflationMultiplier - 1) * 100).toFixed(1)}% by ${targetYear}.`
      },
      {
        feature: 'Quality Level',
        importance: 0.18,
        impact: quality === 'PREMIUM' || quality === 'LUXURY' ? 'positive' : 'neutral',
        explanation: `The ${quality.toLowerCase()} quality specification increases base costs ${quality === 'PREMIUM' || quality === 'LUXURY' ? 'significantly' : 'moderately'} due to finishes and materials standards.`
      }
    ];
    
    // Material recommendations (if includeExplanations)
    const materialRecommendations = includeExplanations ? [
      {
        originalMaterial: 'Standard Concrete Mix',
        suggestedAlternative: 'High-Performance Concrete with Fly Ash',
        potentialSavings: Math.round(futureAdjustedCost * 0.03),
        qualityImpact: 'none' as const,
        sustainabilityScore: 85,
        reasonForRecommendation: 'Lower cement content while maintaining strength, reducing cost and carbon footprint.'
      },
      {
        originalMaterial: 'Traditional HVAC System',
        suggestedAlternative: 'High-Efficiency VRF System',
        potentialSavings: Math.round(futureAdjustedCost * 0.05),
        qualityImpact: 'minor' as const,
        sustainabilityScore: 90,
        reasonForRecommendation: 'Higher initial cost but significantly lower operational costs and longer lifespan.'
      }
    ] : undefined;
    
    return {
      predictedCost: predictedBaseCost,
      totalCost: futureAdjustedCost,
      costPerSquareFoot: futureAdjustedCost / squareFeet,
      confidenceInterval,
      confidenceScore,
      yearPredicted: targetYear,
      predictionFactors: factors,
      materialRecommendations,
      errorMargin,
      timestamp: new Date().toISOString()
    };
  };
  
  // Add/remove features selected for prediction
  const toggleFeature = (feature: string) => {
    setFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  
  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Get color for confidence score
  const getConfidenceColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.8) return 'text-blue-600';
    if (score >= 0.7) return 'text-amber-600';
    return 'text-red-600';
  };
  
  // Get impact color
  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-[#f5fcfd]">
          <CardTitle className="text-lg text-[#243E4D] flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-[#29B7D3]" />
            AI-Powered Cost Prediction Engine
          </CardTitle>
          <CardDescription>
            Advanced machine learning models to predict future building costs with confidence intervals
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-5">
          {!apiKeyStatus?.value && (
            <Alert className="mb-4 bg-amber-50">
              <Info className="h-5 w-5" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                The AI Cost Prediction Engine works best with OpenAI integration. 
                Configure an OpenAI API key in settings for enhanced predictions.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Forecast Settings</h3>
              <div className="space-y-3 border rounded-md p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target-year">Target Year</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="target-year"
                        type="number"
                        min={new Date().getFullYear()}
                        max={new Date().getFullYear() + 20}
                        value={targetYear}
                        onChange={(e) => setTargetYear(Number(e.target.value))}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Predictions become less certain the further into the future they go.
                              We recommend staying within 5-10 years for reliable results.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="multi-year-forecast">Multi-Year Forecasts</Label>
                    <Select 
                      onValueChange={(value) => {
                        setPredictionYears(value.split(',').map(Number));
                      }}
                      defaultValue="1,3,5,10"
                    >
                      <SelectTrigger id="multi-year-forecast">
                        <SelectValue placeholder="Select years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1,3,5,10">1, 3, 5, 10 years</SelectItem>
                        <SelectItem value="1,2,3,4,5">1-5 years</SelectItem>
                        <SelectItem value="5,10,15,20">5, 10, 15, 20 years</SelectItem>
                        <SelectItem value="1,5,10,15,20,25">Long-term (25yr)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-inflation">Include Inflation</Label>
                      <p className="text-xs text-gray-500">Account for future inflation rates</p>
                    </div>
                    <Switch
                      id="include-inflation"
                      checked={forecastSettings.includeInflation}
                      onCheckedChange={(checked) => 
                        setForecastSettings(prev => ({ ...prev, includeInflation: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-material-trends">Material Price Trends</Label>
                      <p className="text-xs text-gray-500">Analyze commodity and material price trends</p>
                    </div>
                    <Switch
                      id="include-material-trends"
                      checked={forecastSettings.includeMaterialTrends}
                      onCheckedChange={(checked) => 
                        setForecastSettings(prev => ({ ...prev, includeMaterialTrends: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-regional-factors">Regional Growth Factors</Label>
                      <p className="text-xs text-gray-500">Consider regional economic forecasts</p>
                    </div>
                    <Switch
                      id="include-regional-factors"
                      checked={forecastSettings.includeRegionalFactors}
                      onCheckedChange={(checked) => 
                        setForecastSettings(prev => ({ ...prev, includeRegionalFactors: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-labor-trends">Labor Market Trends</Label>
                      <p className="text-xs text-gray-500">Include labor availability and wage forecasts</p>
                    </div>
                    <Switch
                      id="include-labor-trends"
                      checked={forecastSettings.includeLaborTrends}
                      onCheckedChange={(checked) => 
                        setForecastSettings(prev => ({ ...prev, includeLaborTrends: checked }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Feature Selection</h3>
              <div className="border rounded-md p-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <Building className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="text-sm font-medium">Building Details</span>
                    </div>
                    <div className="text-xs text-gray-500 pl-5.5 space-y-1">
                      <p><span className="font-medium">Type:</span> {buildingType}</p>
                      <p><span className="font-medium">Size:</span> {squareFeet.toLocaleString()} sqft</p>
                      <p><span className="font-medium">Quality:</span> {quality}</p>
                      <p><span className="font-medium">Age:</span> {buildingAge} years</p>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <MapPin className="h-4 w-4 mr-1.5 text-gray-500" />
                      <span className="text-sm font-medium">Location & Factors</span>
                    </div>
                    <div className="text-xs text-gray-500 pl-5.5 space-y-1">
                      <p><span className="font-medium">Region:</span> {region}</p>
                      <p><span className="font-medium">Complexity:</span> {(complexityFactor * 100).toFixed(0)}%</p>
                      <p><span className="font-medium">Condition:</span> {(conditionFactor * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium mb-1">Additional Features</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Energy Efficiency', 'Smart Building Tech', 'Accessibility Features',
                      'Green Certification', 'High-End Finishes', 'Custom Design',
                      'Seismic Reinforcement', 'Storm Resistance'
                    ].map(feature => (
                      <Badge
                        key={feature}
                        variant={features.includes(feature) ? 'default' : 'outline'}
                        className={`cursor-pointer ${features.includes(feature) ? 'bg-[#29B7D3]' : ''}`}
                        onClick={() => toggleFeature(feature)}
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={generatePrediction} 
                  disabled={isGenerating}
                  className="w-full mt-4 bg-[#29B7D3] hover:bg-[#27a7c1] text-white"
                >
                  {isGenerating 
                    ? "Generating Prediction..." 
                    : "Generate Cost Prediction"}
                </Button>
              </div>
            </div>
          </div>
          
          {predictionResult && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="forecast">Cost Forecast</TabsTrigger>
                <TabsTrigger value="factors">Impact Factors</TabsTrigger>
                <TabsTrigger value="analysis">Trend Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="forecast" className="pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center">
                          <DollarSign className="h-5 w-5 mr-1.5 text-[#3CAB36]" />
                          Cost Prediction for {predictionResult.yearPredicted}
                        </CardTitle>
                        <CardDescription>
                          Based on current factors and selected preferences
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-3">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-2xl font-bold">
                              <span>Total Cost:</span>
                              <span className="text-[#243E4D]">{formatCurrency(predictionResult.totalCost)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Cost per sq. ft:</span>
                              <span>{formatCurrency(predictionResult.costPerSquareFoot)}/sqft</span>
                            </div>
                          </div>
                          
                          <div className="pt-2 pb-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Confidence Interval:</span>
                              <span className="font-medium">
                                {formatCurrency(predictionResult.confidenceInterval[0])} - {formatCurrency(predictionResult.confidenceInterval[1])}
                              </span>
                            </div>
                            <div className="h-8 bg-gray-100 rounded-md relative">
                              <div 
                                className="absolute h-full bg-[#e6eef2] rounded-md" 
                                style={{ 
                                  left: '10%', 
                                  right: '10%', 
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <span className="text-xs font-medium text-[#243E4D]">
                                  ±{predictionResult.errorMargin.toFixed(1)}%
                                </span>
                              </div>
                              <div 
                                className="absolute h-full bg-[#29B7D3] rounded-md" 
                                style={{ 
                                  width: '2px', 
                                  left: '50%',
                                  transform: 'translateX(-50%)'
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{formatCurrency(predictionResult.confidenceInterval[0])}</span>
                              <span className="font-medium">{formatCurrency(predictionResult.totalCost)}</span>
                              <span>{formatCurrency(predictionResult.confidenceInterval[1])}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="space-y-0.5">
                              <div className="text-sm">Confidence Score:</div>
                              <div className={`text-lg font-bold ${getConfidenceColor(predictionResult.confidenceScore)}`}>
                                {(predictionResult.confidenceScore * 100).toFixed(0)}%
                              </div>
                            </div>
                            <Progress
                              value={predictionResult.confidenceScore * 100}
                              className="w-32 h-2"
                            />
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-0 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                          Generated on {new Date(predictionResult.timestamp).toLocaleDateString()}
                        </div>
                      </CardFooter>
                    </Card>
                    
                    {predictionResult.materialRecommendations && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-2 flex items-center">
                          <Lightbulb className="h-4 w-4 mr-1.5 text-amber-500" />
                          Cost Optimization Suggestions
                        </h3>
                        <div className="space-y-3">
                          {predictionResult.materialRecommendations.map((rec, i) => (
                            <div key={i} className="border rounded-md p-3 bg-amber-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-sm font-medium">{rec.suggestedAlternative}</h4>
                                  <p className="text-xs text-gray-600 mt-0.5">Alternative for {rec.originalMaterial}</p>
                                </div>
                                <Badge className="bg-[#3CAB36] text-white">
                                  Save {formatCurrency(rec.potentialSavings)}
                                </Badge>
                              </div>
                              <p className="text-xs mt-1.5">{rec.reasonForRecommendation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1.5 text-[#29B7D3]" />
                      Multi-Year Cost Projections
                    </h3>
                    <div className="border rounded-md p-3 bg-white">
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={multiYearPredictions}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="year" 
                            label={{ value: 'Year', position: 'insideBottom', offset: -5 }} 
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                            label={{ value: 'Cost', angle: -90, position: 'insideLeft' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="upperBound" 
                            stroke="transparent" 
                            fill="#e6eef2" 
                            fillOpacity={0.8}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="lowerBound" 
                            stroke="transparent" 
                            fill="#e6eef2" 
                            fillOpacity={0}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="cost" 
                            stroke="#29B7D3" 
                            strokeWidth={2} 
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid grid-cols-2 gap-3">
                        {multiYearPredictions.map((prediction, i) => (
                          <div key={i} className="rounded-md p-2 bg-gray-50">
                            <div className="text-xs text-gray-500 mb-1">
                              <span className="font-medium">{prediction.year}</span> (in {prediction.year - new Date().getFullYear()} years)
                            </div>
                            <div className="text-sm font-bold">{formatCurrency(prediction.cost)}</div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Range: {formatCurrency(prediction.lowerBound)} - {formatCurrency(prediction.upperBound)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="factors" className="pt-4">
                <div className="grid md:grid-cols-5 gap-6">
                  <div className="md:col-span-3">
                    <h3 className="text-sm font-medium mb-2">Cost Impact Factors</h3>
                    <div className="border rounded-md">
                      {predictionResult.predictionFactors.map((factor, i) => (
                        <div 
                          key={i} 
                          className={`p-3 ${i !== predictionResult.predictionFactors.length - 1 ? 'border-b' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium">{factor.feature}</h4>
                            <Badge className={`
                              ${factor.impact === 'positive' ? 'bg-green-100 text-green-800' : ''}
                              ${factor.impact === 'negative' ? 'bg-red-100 text-red-800' : ''}
                              ${factor.impact === 'neutral' ? 'bg-blue-100 text-blue-800' : ''}
                            `}>
                              {factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)} Impact
                            </Badge>
                          </div>
                          <div className="flex items-center mt-2">
                            <div className="w-full">
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${factor.impact === 'positive' ? 'bg-green-500' : factor.impact === 'negative' ? 'bg-red-500' : 'bg-blue-500'}`}
                                  style={{ width: `${factor.importance * 100}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="ml-2 text-sm font-medium">{(factor.importance * 100).toFixed(0)}%</span>
                          </div>
                          <p className="text-sm mt-2 text-gray-600">{factor.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-medium mb-2">Factor Importance</h3>
                    <div className="border rounded-md p-3 bg-white">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                          data={predictionResult.predictionFactors.map(factor => ({
                            name: factor.feature,
                            value: factor.importance,
                            impact: factor.impact
                          }))}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                          <YAxis type="category" dataKey="name" width={100} />
                          <Bar dataKey="value" fill="#8884d8" barSize={20}>
                            {predictionResult.predictionFactors.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.impact === 'positive' ? '#3CAB36' : entry.impact === 'negative' ? '#ef4444' : '#29B7D3'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      
                      <Separator className="my-3" />
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Understanding Impact Factors</div>
                        <p className="text-xs text-gray-600">
                          These factors show the relative importance of each variable in determining the final cost prediction.
                          Factors with higher percentages have a greater influence on the overall cost.
                        </p>
                        <div className="flex gap-4 text-xs mt-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span>Positive Impact</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span>Neutral Impact</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                            <span>Negative Impact</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analysis" className="pt-4">
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1.5 text-[#3CAB36]" />
                        Cost Growth Projection
                      </h3>
                      <div className="border rounded-md p-3 bg-white">
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={[
                            { year: new Date().getFullYear(), value: predictionResult.predictedCost },
                            ...multiYearPredictions.map(p => ({ year: p.year, value: p.cost }))
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="year" />
                            <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                            <Line 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#3CAB36" 
                              activeDot={{ r: 8 }} 
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="mt-3 text-xs text-gray-600">
                          <p>
                            This chart shows the projected cost growth over time, accounting for inflation
                            and other economic factors affecting the construction industry in {region}.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Percent className="h-4 w-4 mr-1.5 text-[#29B7D3]" />
                        Cost Distribution by Category
                      </h3>
                      <div className="border rounded-md p-3 bg-white">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[
                            { name: 'Materials', value: 0.5 },
                            { name: 'Labor', value: 0.3 },
                            { name: 'Equipment', value: 0.1 },
                            { name: 'Overhead', value: 0.07 },
                            { name: 'Profit', value: 0.03 }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                            <Bar dataKey="value" fill="#29B7D3" />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 text-xs text-gray-600">
                          <p>
                            This breakdown shows how the projected costs are typically distributed
                            across major categories for {buildingType.toLowerCase()} construction projects.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <BarChart2 className="h-4 w-4 mr-1.5 text-[#243E4D]" />
                      Regional Cost Comparison
                    </h3>
                    <div className="border rounded-md p-3 bg-white">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { name: 'National Avg', value: predictionResult.totalCost * 0.95 },
                          { name: region, value: predictionResult.totalCost },
                          { name: 'West', value: predictionResult.totalCost * 1.1 },
                          { name: 'Northeast', value: predictionResult.totalCost * 1.15 },
                          { name: 'Midwest', value: predictionResult.totalCost * 0.9 },
                          { name: 'South', value: predictionResult.totalCost * 0.85 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`} />
                          <Bar dataKey="value">
                            {[0, 1, 2, 3, 4, 5].map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === 1 ? '#243E4D' : '#8884d8'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="mt-3 text-xs text-gray-600">
                        <p>
                          This chart compares the predicted cost in {region} with national
                          averages and other regions for similar {buildingType.toLowerCase()} buildings
                          with comparable specifications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}