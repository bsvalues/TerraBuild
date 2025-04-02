import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PredictionInput, PredictionResult, FeatureImportance, predictCostWithConfidence, getInfluentialFactors, performWhatIfAnalysis, generateSensitivityAnalysis } from '@/utils/advanced-prediction-utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { AlertCircle, ArrowRight, TrendingUp, BarChart2, PieChart, Layers, DollarSign } from 'lucide-react';

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  isLoading: boolean;
}

const PredictionForm: React.FC<PredictionFormProps> = ({ onPredict, isLoading }) => {
  const [buildingType, setBuildingType] = useState<string>('residential');
  const [region, setRegion] = useState<string>('Eastern');
  const [squareFootage, setSquareFootage] = useState<number>(2500);
  const [quality, setQuality] = useState<string>('standard');
  const [complexity, setComplexity] = useState<string>('moderate');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPredict({
      buildingType,
      region,
      squareFootage,
      quality,
      complexity
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buildingType">Building Type</Label>
          <Select 
            value={buildingType} 
            onValueChange={setBuildingType}
          >
            <SelectTrigger id="buildingType">
              <SelectValue placeholder="Select building type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="industrial">Industrial</SelectItem>
              <SelectItem value="agricultural">Agricultural</SelectItem>
              <SelectItem value="institutional">Institutional</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select 
            value={region} 
            onValueChange={setRegion}
          >
            <SelectTrigger id="region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Eastern">Eastern</SelectItem>
              <SelectItem value="Western">Western</SelectItem>
              <SelectItem value="Northern">Northern</SelectItem>
              <SelectItem value="Southern">Southern</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="squareFootage">Square Footage: {squareFootage}</Label>
          <span className="text-sm text-muted-foreground">{squareFootage} sq ft</span>
        </div>
        <Slider 
          id="squareFootage"
          min={500}
          max={10000}
          step={100}
          value={[squareFootage]}
          onValueChange={(value) => setSquareFootage(value[0])}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quality">Quality Level</Label>
          <Select 
            value={quality} 
            onValueChange={setQuality}
          >
            <SelectTrigger id="quality">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="economy">Economy</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="complexity">Complexity</Label>
          <Select 
            value={complexity} 
            onValueChange={setComplexity}
          >
            <SelectTrigger id="complexity">
              <SelectValue placeholder="Select complexity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simple">Simple</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="complex">Complex</SelectItem>
              <SelectItem value="very complex">Very Complex</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Calculating..." : "Generate Prediction"}
      </Button>
    </form>
  );
};

interface PredictionResultsProps {
  results: PredictionResult;
}

const PredictionResults: React.FC<PredictionResultsProps> = ({ results }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${results.cost.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Cost Per Sq Ft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${results.costPerSqFt.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Confidence Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <Label>Confidence Score</Label>
              <span className="text-sm">{(results.confidence * 100).toFixed(1)}%</span>
            </div>
            <Progress value={results.confidence * 100} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between mb-1">
              <Label>Error Margin</Label>
              <span className="text-sm">±{(results.error * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(1 - results.error) * 100} className="h-2" />
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>Confidence Interval: ${results.confidenceInterval[0].toLocaleString('en-US', { maximumFractionDigits: 0 })} - ${results.confidenceInterval[1].toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface InfluentialFactorsProps {
  buildingType: string;
}

const InfluentialFactors: React.FC<InfluentialFactorsProps> = ({ buildingType }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/ai/factor-importance', buildingType],
    queryFn: () => getInfluentialFactors(buildingType),
    enabled: !!buildingType
  });
  
  if (isLoading) {
    return <div className="flex justify-center py-8">Loading influential factors...</div>;
  }
  
  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load influential factors. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  const chartData = data.map(factor => ({
    name: factor.name,
    impact: factor.impact * 100,
    direction: factor.direction
  }));
  
  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} label={{ value: 'Impact (%)', position: 'insideBottom', offset: -5 }} />
            <YAxis type="category" dataKey="name" width={100} />
            <RechartsTooltip 
              formatter={(value: number, name: string, props: any) => {
                const factor = data.find(f => f.name === props.payload.name);
                return [`${value.toFixed(1)}% impact`, `${factor?.description || ''}`];
              }}
            />
            <Bar 
              dataKey="impact" 
              fill="#8884d8" 
              barSize={20}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((factor, index) => (
          <Card key={index}>
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">{factor.name}</CardTitle>
                <Badge variant={factor.direction === 'positive' ? 'default' : 'outline'}>
                  {factor.direction === 'positive' ? 'Increases Cost' : 'Decreases Cost'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <CardDescription>{factor.description}</CardDescription>
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Impact</span>
                  <span className="text-xs font-medium">{(factor.impact * 100).toFixed(1)}%</span>
                </div>
                <Progress value={factor.impact * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

interface WhatIfScenarioProps {
  baseInput: PredictionInput;
}

const WhatIfScenario: React.FC<WhatIfScenarioProps> = ({ baseInput }) => {
  const [parameterToVary, setParameterToVary] = useState<string>('quality');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scenarioResults, setScenarioResults] = useState<any | null>(null);
  
  const qualities = ['economy', 'standard', 'premium', 'luxury'];
  const complexities = ['simple', 'moderate', 'complex', 'very complex'];
  const regions = ['Eastern', 'Western', 'Northern', 'Southern'];
  const squareFootages = [1500, 2500, 5000, 10000];
  
  const parameterOptions = [
    { value: 'quality', label: 'Quality Level', values: qualities },
    { value: 'complexity', label: 'Complexity', values: complexities },
    { value: 'region', label: 'Region', values: regions },
    { value: 'squareFootage', label: 'Square Footage', values: squareFootages }
  ];
  
  const handleAnalyzeClick = async () => {
    if (!baseInput) return;
    
    setIsAnalyzing(true);
    
    const selectedParam = parameterOptions.find(p => p.value === parameterToVary);
    
    if (!selectedParam) {
      setIsAnalyzing(false);
      return;
    }
    
    try {
      const results = await performWhatIfAnalysis(baseInput, [
        {
          parameter: parameterToVary,
          values: selectedParam.values
        }
      ]);
      
      setScenarioResults(results);
    } catch (error) {
      console.error('Error in what-if analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const renderChart = () => {
    if (!scenarioResults) return null;
    
    const chartData = scenarioResults.variations.map((variation: any) => ({
      name: variation.parameterValue.toString(),
      cost: variation.prediction.cost,
      percentChange: variation.percentChange
    }));
    
    return (
      <div className="space-y-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Total Cost ($)', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Change (%)', angle: 90, position: 'insideRight' }} />
              <RechartsTooltip formatter={(value: any) => ['$' + value.toLocaleString(), 'Cost']} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line yAxisId="right" type="monotone" dataKey="percentChange" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {scenarioResults.variations.map((variation: any, index: number) => (
            <Card key={index} className={index === 0 ? 'border-primary' : ''}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">
                  {parameterToVary === 'squareFootage' 
                    ? `${variation.parameterValue.toLocaleString()} sq ft` 
                    : variation.parameterValue.charAt(0).toUpperCase() + variation.parameterValue.slice(1)}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Cost</span>
                    <span className="font-medium">${variation.prediction.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cost per Sq Ft</span>
                    <span>${variation.prediction.costPerSqFt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Change</span>
                    <Badge variant={variation.percentChange >= 0 ? 'default' : 'outline'}>
                      {variation.percentChange >= 0 ? '+' : ''}{variation.percentChange.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="parameter">Parameter to Vary</Label>
          <Select 
            value={parameterToVary} 
            onValueChange={setParameterToVary}
          >
            <SelectTrigger id="parameter">
              <SelectValue placeholder="Select parameter" />
            </SelectTrigger>
            <SelectContent>
              {parameterOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button 
            onClick={handleAnalyzeClick} 
            className="w-full"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Scenarios"}
          </Button>
        </div>
      </div>
      
      {scenarioResults ? (
        renderChart()
      ) : (
        <Card className="border-dashed border-muted">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BarChart2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Run "What-If" Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select a parameter to vary and click "Analyze Scenarios" to see how changes affect the building cost.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface SensitivityAnalysisProps {
  input: PredictionInput;
}

const SensitivityAnalysis: React.FC<SensitivityAnalysisProps> = ({ input }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/ai/sensitivity-analysis', JSON.stringify(input)],
    queryFn: () => generateSensitivityAnalysis(input),
    enabled: !!input
  });
  
  if (isLoading) {
    return <div className="flex justify-center py-8">Analyzing sensitivity...</div>;
  }
  
  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to generate sensitivity analysis. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  const chartData = data.map(item => ({
    name: item.parameter,
    sensitivity: item.sensitivity * 100,
  }));
  
  return (
    <div className="space-y-6">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} label={{ value: 'Sensitivity (%)', position: 'insideBottom', offset: -5 }} />
            <YAxis type="category" dataKey="name" width={120} />
            <RechartsTooltip />
            <Bar 
              dataKey="sensitivity" 
              fill="#82ca9d" 
              barSize={20}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((item, index) => (
          <Card key={index}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base">{item.parameter}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <CardDescription>{item.description}</CardDescription>
              <div className="mt-2">
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Sensitivity</span>
                  <span className="text-xs font-medium">{(item.sensitivity * 100).toFixed(1)}%</span>
                </div>
                <Progress value={item.sensitivity * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PredictiveCostAnalysis: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('prediction');
  const [predictionInput, setPredictionInput] = useState<PredictionInput | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);
  
  const mutation = useMutation({
    mutationFn: predictCostWithConfidence,
    onSuccess: (data) => {
      setPredictionData(data);
      setActiveTab('results');
    }
  });
  
  const isLoading = mutation.isPending;
  
  const handlePredict = (input: PredictionInput) => {
    setPredictionInput(input);
    mutation.mutate(input);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Cost Prediction</h2>
          <p className="text-muted-foreground">
            Use machine learning to predict building costs with confidence intervals
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prediction">
            <DollarSign className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Prediction</span>
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!predictionData}>
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Results</span>
          </TabsTrigger>
          <TabsTrigger value="factors" disabled={!predictionInput}>
            <PieChart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Influential Factors</span>
          </TabsTrigger>
          <TabsTrigger value="what-if" disabled={!predictionInput}>
            <Layers className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">What-If Analysis</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="prediction" className="space-y-4 pt-4">
          <PredictionForm onPredict={handlePredict} isLoading={isLoading} />
        </TabsContent>
        
        <TabsContent value="results" className="pt-4">
          {predictionData && <PredictionResults results={predictionData} />}
        </TabsContent>
        
        <TabsContent value="factors" className="pt-4">
          {predictionInput && <InfluentialFactors buildingType={predictionInput.buildingType} />}
        </TabsContent>
        
        <TabsContent value="what-if" className="pt-4">
          {predictionInput && <WhatIfScenario baseInput={predictionInput} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveCostAnalysis;