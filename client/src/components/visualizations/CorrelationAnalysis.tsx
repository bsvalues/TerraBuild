import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CorrelationAnalysisProps } from '@/lib/visualizationTypes';
import { 
  formatCurrency, 
  calculateCorrelation, 
  calculateTrendLine,
  detectOutliers
} from '@/lib/visualizationUtils';
import { AlertCircle, Info } from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Line,
  ZAxis,
  Legend
} from 'recharts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Statistical Correlation Analysis Component
 * 
 * Displays scatter plot visualization for cost vs. size correlation with trend line
 */
export function CorrelationAnalysis({
  buildings,
  costs,
  correlations,
  isLoading = false,
  onDataPointSelect
}: CorrelationAnalysisProps) {
  const [selectedPoint, setSelectedPoint] = useState<number | null>(null);
  
  // Process data for visualization
  const { 
    chartData, 
    correlation, 
    trendLine,
    outlierIndices,
    hasValidData
  } = useMemo(() => {
    if (!correlations || !buildings || buildings.length === 0) {
      return { 
        chartData: [], 
        correlation: null, 
        trendLine: null,
        outlierIndices: [],
        hasValidData: false
      };
    }
    
    // Create data for scatter plot
    const data = buildings.map((building, index) => ({
      id: building.id || index,
      county: building.county || 'Unknown',
      x: correlations.size[index], // Size
      y: correlations.cost[index], // Cost
      qualityGrade: building.qualityGrade || 'Unknown'
    }));
    
    // Filter out points with null/undefined values
    const validData = data.filter(d => 
      d.x !== null && d.x !== undefined && 
      d.y !== null && d.y !== undefined
    );
    
    const validXValues = correlations.size.filter(x => x !== null && x !== undefined) as number[];
    const validYValues = correlations.cost.filter(y => y !== null && y !== undefined) as number[];
    
    // Calculate correlation coefficient
    const corr = calculateCorrelation(validXValues, validYValues);
    
    // Calculate trend line
    const trend = calculateTrendLine(validXValues, validYValues);
    
    // Detect outliers
    const outliers = detectOutliers(validYValues);
    
    return {
      chartData: validData,
      correlation: corr,
      trendLine: trend,
      outlierIndices: outliers,
      hasValidData: validData.length >= 2
    };
  }, [buildings, correlations]);
  
  // Format correlation coefficient for display
  const correlationText = useMemo(() => {
    if (correlation === null) return 'N/A';
    
    const value = Math.abs(correlation);
    let strength = 'No';
    
    if (value > 0.7) strength = 'Strong';
    else if (value > 0.4) strength = 'Moderate';
    else if (value > 0.2) strength = 'Weak';
    
    const direction = correlation > 0 ? 'positive' : 'negative';
    return `${strength} ${direction} correlation (r = ${correlation.toFixed(2)})`;
  }, [correlation]);
  
  // Handle point click
  const handlePointClick = (data: any) => {
    setSelectedPoint(data.id);
    if (onDataPointSelect) {
      onDataPointSelect(data.id);
    }
  };
  
  // Custom tooltip component for scatter plot
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-md shadow-md p-2 text-sm">
          <p className="font-medium">{data.county}</p>
          <p>Size: {data.x}</p>
          <p>Cost: {formatCurrency(data.y)}</p>
          <p>Quality: {data.qualityGrade}</p>
        </div>
      );
    }
  
    return null;
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!hasValidData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Statistical Correlation Analysis</CardTitle>
          <CardDescription>
            Analyze the relationship between building size and cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient data for correlation analysis. At least two data points with both size and cost values are required.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Statistical Correlation Analysis</CardTitle>
            <CardDescription>
              Analyze the relationship between building size and cost
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="rounded-full p-1 hover:bg-accent cursor-help">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>This chart shows the relationship between building size and cost.</p>
                <p className="mt-1">Points represent individual buildings, and the line shows the trend.</p>
                <p className="mt-1">Outliers are highlighted in orange.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 10, right: 30, left: 30, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Size" 
                label={{ value: 'Building Size', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Cost" 
                label={{ value: 'Cost ($)', angle: -90, position: 'left' }}
              />
              <ZAxis range={[60, 60]} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Regular data points */}
              <Scatter
                name="Buildings"
                data={chartData.filter((_, i) => !outlierIndices.includes(i))}
                fill="#8884d8"
                shape="circle"
                onClick={handlePointClick}
                cursor="pointer"
              />
              
              {/* Outlier data points */}
              {outlierIndices.length > 0 && (
                <Scatter
                  name="Outliers"
                  data={chartData.filter((_, i) => outlierIndices.includes(i))}
                  fill="#ff7300"
                  shape="circle"
                  onClick={handlePointClick}
                  cursor="pointer"
                />
              )}
              
              {/* Trend line */}
              {trendLine && (
                <Line
                  name="Trend"
                  data-testid="trend-line"
                  type="linear"
                  dataKey="y"
                  stroke="#ff7300"
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  points={[
                    { x: trendLine.points[0][0], y: trendLine.points[0][1] },
                    { x: trendLine.points[1][0], y: trendLine.points[1][1] }
                  ]}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline" className="text-sm">
            Data points: {chartData.length}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Correlation: {correlationText}
          </Badge>
          {outlierIndices.length > 0 && (
            <Badge variant="outline" className="text-sm bg-orange-100">
              Outliers: {outlierIndices.length}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}