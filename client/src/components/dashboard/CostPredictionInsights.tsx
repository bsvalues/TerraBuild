import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, InfoIcon, Building, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CostPredictionInsightsProps {
  title?: string;
  description?: string;
  className?: string;
  showControls?: boolean;
}

export function CostPredictionInsights({
  title = "Cost Prediction Insights",
  description = "AI-powered trend analysis and cost predictions",
  className,
  showControls = true
}: CostPredictionInsightsProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);
  const [predictionYears, setPredictionYears] = useState<number>(3);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState<boolean>(false);

  // Fetch cost matrix data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Get unique regions and building types for filters
  const getUniqueRegions = (data: any[]): string[] => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item.region))].sort();
  };

  const getUniqueBuildingTypes = (data: any[]): { value: string, label: string }[] => {
    if (!data || !Array.isArray(data)) return [];
    
    const uniqueTypes = new Map();
    data.forEach(item => {
      if (!uniqueTypes.has(item.buildingType)) {
        uniqueTypes.set(item.buildingType, item.buildingTypeDescription || item.buildingType);
      }
    });
    
    return Array.from(uniqueTypes.entries()).map(([value, label]) => ({ value, label }));
  };

  // Process historical data and generate predictions
  const processDataWithPredictions = () => {
    if (!data || !Array.isArray(data)) return { historical: [], predicted: [] };
    
    // Filter by selected region and building type
    let filteredData = data;
    if (selectedRegion) {
      filteredData = filteredData.filter(item => item.region === selectedRegion);
    }
    if (selectedBuildingType) {
      filteredData = filteredData.filter(item => item.buildingType === selectedBuildingType);
    }
    
    // Group by year and calculate average cost
    const yearlyData = filteredData.reduce((acc, item) => {
      const year = item.matrixYear;
      if (!acc[year]) {
        acc[year] = { year, count: 0, totalCost: 0 };
      }
      acc[year].count += 1;
      acc[year].totalCost += parseFloat(item.baseCost);
      return acc;
    }, {});
    
    // Convert to array and calculate average
    const historicalData = Object.values(yearlyData)
      .map((item: any) => ({
        year: item.year,
        cost: parseFloat((item.totalCost / item.count).toFixed(2))
      }))
      .sort((a, b) => a.year - b.year);
    
    // Generate prediction data
    const predictedData = generatePredictions(historicalData, predictionYears);
    
    return { 
      historical: historicalData,
      predicted: predictedData
    };
  };

  // Simple linear regression model for predictions
  const generatePredictions = (historicalData: any[], yearsToPredict: number) => {
    if (historicalData.length < 2) return [];
    
    // Prepare data for linear regression
    const n = historicalData.length;
    const years = historicalData.map(d => d.year);
    const costs = historicalData.map(d => d.cost);
    
    // Calculate means
    const meanYear = years.reduce((a, b) => a + b, 0) / n;
    const meanCost = costs.reduce((a, b) => a + b, 0) / n;
    
    // Calculate coefficients for y = mx + b
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (years[i] - meanYear) * (costs[i] - meanCost);
      denominator += (years[i] - meanYear) ** 2;
    }
    
    const slope = numerator / denominator;
    const intercept = meanCost - (slope * meanYear);
    
    // Function to predict cost for a given year
    const predictCost = (year: number) => intercept + (slope * year);
    
    // Generate prediction data
    const latestYear = Math.max(...years);
    const predictedData = [];
    
    for (let i = 1; i <= yearsToPredict; i++) {
      const year = latestYear + i;
      const predictedCost = predictCost(year);
      predictedData.push({
        year,
        cost: parseFloat(predictedCost.toFixed(2)),
        isPrediction: true
      });
    }
    
    return predictedData;
  };

  // Calculate the growth rate
  const calculateGrowthRate = (data: any[]) => {
    if (!data || data.length < 2) return { rate: 0, description: 'Insufficient data' };
    
    // Sort by year
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    
    // Get first and last data points
    const firstYear = sortedData[0];
    const lastYear = sortedData[sortedData.length - 1];
    
    // Calculate CAGR (Compound Annual Growth Rate)
    const yearDiff = lastYear.year - firstYear.year;
    const cagr = ((lastYear.cost / firstYear.cost) ** (1 / yearDiff) - 1) * 100;
    
    return {
      rate: parseFloat(cagr.toFixed(2)),
      description: `${cagr >= 0 ? '+' : ''}${cagr.toFixed(2)}% annual average`
    };
  };

  // Get AI-generated insights from the new AI prediction API
  const generateAIInsights = async (forceRefresh = false) => {
    setAnalysisLoading(true);
    
    try {
      const { historical, predicted } = processDataWithPredictions();
      
      if (historical.length < 2) {
        setInsightText("Insufficient historical data available for AI analysis.");
        setShowInsight(true);
        setAnalysisLoading(false);
        return;
      }
      
      // Get the latest historical data point year
      const currentYear = historical[historical.length-1].year;
      // Get the future year for prediction
      const futureYear = currentYear + predictionYears;
      
      // First check if OpenAI is configured
      const statusResponse = await fetch('/api/ai/openai-status');
      const statusData = await statusResponse.json();
      
      if (!statusData.configured) {
        setInsightText(`AI insights require OpenAI API key configuration. Status: ${statusData.message}`);
        setShowInsight(true);
        setAnalysisLoading(false);
        return;
      }
      
      // Prepare API request
      const requestData = {
        buildingType: selectedBuildingType || "RESIDENTIAL",
        region: selectedRegion || "Benton County",
        targetYear: futureYear,
        squareFootage: 2000, // Default square footage
        selectedFactors: ["inflation", "materials", "labor"],
        forceRefresh: forceRefresh // Add force refresh option to bypass cache
      };
      
      // Call the AI prediction API
      const response = await fetch('/api/ai/predict-cost', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        throw new Error(`Error from API: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Handle error from the prediction engine
      if (result.error) {
        // Check specifically for quota exceeded error
        if (result.error.includes("exceeded your current quota") || 
            result.error.includes("insufficient_quota")) {
          throw new Error("OpenAI API quota exceeded. Please update your subscription or contact your administrator.");
        } else {
          throw new Error(result.error);
        }
      }
      
      // Format the AI insight text
      const insightText = `
        Based on AI analysis of historical cost data from ${historical[0].year} to ${historical[historical.length-1].year}, 
        building costs for ${selectedBuildingType || "all building types"} in ${selectedRegion || "all regions"} 
        are predicted to reach $${result.predictedCost.toFixed(2)}/sq.ft by ${futureYear}.
        
        ${result.confidenceInterval ? 
          `This prediction has a confidence interval of $${result.confidenceInterval.lower.toFixed(2)} to $${result.confidenceInterval.upper.toFixed(2)}/sq.ft.` : 
          ''}
        
        Key factors affecting this prediction:
        ${result.factors ? result.factors.map(factor => `- ${factor.name} (${factor.impact} impact): ${factor.description}`).join('\n') : '- No specific factors provided'}
        
        ${result.summary ? `\nSummary:\n${result.summary}` : ''}
      `;
      
      setInsightText(insightText);
      setShowInsight(true);
      setAnalysisLoading(false);
      
    } catch (error) {
      console.error("Error generating AI insights:", error);
      setInsightText("An error occurred while generating insights: " + 
        (error instanceof Error ? error.message : "Unknown error"));
      setShowInsight(true);
      setAnalysisLoading(false);
    }
  };

  const { historical, predicted } = processDataWithPredictions();
  const chartData = [...historical, ...predicted];
  const regions = getUniqueRegions(data);
  const buildingTypes = getUniqueBuildingTypes(data);
  const growthRate = calculateGrowthRate(historical);

  // Get current building type label
  const getCurrentBuildingTypeLabel = () => {
    if (!selectedBuildingType) return "All Building Types";
    const found = buildingTypes.find(t => t.value === selectedBuildingType);
    return found ? found.label : selectedBuildingType;
  };

  // Rendering loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Rendering error state
  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load cost prediction data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Rendering empty state
  if (!historical.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">No historical data available for the selected criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {title} <TrendingUp className="h-5 w-5 text-blue-500" />
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {showControls && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
              <Select
                value={selectedRegion || "all"}
                onValueChange={(value) => setSelectedRegion(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedBuildingType || "all"}
                onValueChange={(value) => setSelectedBuildingType(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Building Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Building Types</SelectItem>
                  {buildingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={predictionYears.toString()}
                onValueChange={(value) => setPredictionYears(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Prediction Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {selectedRegion || "All Regions"}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            {getCurrentBuildingTypeLabel()}
          </Badge>
          <Badge 
            variant={growthRate.rate >= 0 ? "default" : "destructive"}
            className="flex items-center gap-1"
          >
            <TrendingUp className="h-3 w-3" />
            {growthRate.description}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.toString()}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value}`}
                width={80}
                domain={['auto', 'auto']}
                label={{ 
                  value: 'Base Cost ($/sqft)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
              />
              <Tooltip 
                formatter={(value) => [`$${parseFloat(value as string).toFixed(2)}`, 'Base Cost']}
                labelFormatter={(label) => `Year: ${label}`}
              />
              <Legend />
              
              {/* Historical data line */}
              <Line
                type="monotone"
                dataKey="cost"
                data={historical}
                name="Historical Cost"
                stroke="#1f77b4"
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
              />
              
              {/* Prediction data line */}
              <Line
                type="monotone"
                dataKey="cost"
                data={predicted}
                name="Predicted Cost"
                stroke="#ff7f0e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ strokeWidth: 2 }}
              />
              
              {/* Trend line */}
              <ReferenceLine
                stroke="#888"
                strokeDasharray="3 3"
                label="Trend"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <InfoIcon className="h-5 w-5 text-blue-500" />
              AI-Powered Insights
            </h3>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => generateAIInsights(false)}
                disabled={analysisLoading}
              >
                {analysisLoading ? 'Analyzing...' : 'Generate Insights'}
              </Button>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => generateAIInsights(true)}
                disabled={analysisLoading}
                title="Bypass cache and get fresh insights"
              >
                Refresh
              </Button>
            </div>
          </div>
          
          {showInsight && insightText && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-sm">
              <p className="text-blue-800 whitespace-pre-line">{insightText}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="font-medium mb-2 text-sm">Current Cost</h4>
              <div className="text-2xl font-bold text-blue-700">
                ${historical.length > 0 ? historical[historical.length-1].cost : 'N/A'}
                <span className="text-sm font-normal text-gray-500 ml-1">per sq.ft</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                As of {historical.length > 0 ? historical[historical.length-1].year : 'N/A'}
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
              <h4 className="font-medium mb-2 text-sm">Projected Cost</h4>
              <div className="text-2xl font-bold text-orange-700">
                ${predicted.length > 0 ? predicted[predicted.length-1].cost : 'N/A'}
                <span className="text-sm font-normal text-gray-500 ml-1">per sq.ft</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Projected for {predicted.length > 0 ? predicted[predicted.length-1].year : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}