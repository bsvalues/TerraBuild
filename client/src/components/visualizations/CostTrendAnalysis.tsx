/**
 * Cost Trend Analysis Component
 * 
 * A visualization component that analyzes and displays building cost trends
 * over time, including trend detection, seasonality analysis, and forecasting.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label,
  Brush
} from 'recharts';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  HelpCircle,
  Info,
  LineChart as LineChartIcon,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Waves,
  XCircle,
  Zap
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useVisualizationContext } from '@/contexts/visualization-context';
import {
  detectTrends,
  detectSeasonality,
  forecastValues,
  calculateGrowthRate,
  formatGrowthRate,
  groupTimeSeriesByPeriod,
  calculateMovingAverage,
  type TrendResult,
  type SeasonalityResult,
  type ForecastResult
} from '@/utils/trend-utils';

// Interface for props
interface CostTrendAnalysisProps {
  className?: string;
}

// Time period options for grouping
type TimePeriod = 'year' | 'quarter' | 'month';

// Available metrics to analyze
type CostMetric = 'baseCost' | 'adjustedCost' | 'complexityFactor' | 'qualityFactor' | 'conditionFactor';

// Chart display modes
type ChartMode = 'line' | 'area';

/**
 * Format a date period for display
 */
const formatPeriod = (period: string): string => {
  if (period.includes('-Q')) {
    // Handle quarterly format (e.g., "2022-Q2")
    const [year, quarter] = period.split('-Q');
    return `Q${quarter} ${year}`;
  } else if (period.includes('-')) {
    // Handle monthly format (e.g., "2022-05")
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }
  
  // Default to showing the raw period (likely a year)
  return period;
};

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
 * Cost Trend Analysis Component
 */
export function CostTrendAnalysis({ className = '' }: CostTrendAnalysisProps) {
  // State for visualization options
  const [selectedMetric, setSelectedMetric] = useState<CostMetric>('baseCost');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('quarter');
  const [chartMode, setChartMode] = useState<ChartMode>('line');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(false);
  const [movingAverageWindow, setMovingAverageWindow] = useState<number>(3);
  const [showForecast, setShowForecast] = useState<boolean>(false);
  const [forecastPeriods, setForecastPeriods] = useState<number>(4);
  const [selectedDateRange, setSelectedDateRange] = useState<[number, number] | null>(null);
  const [selectedBuildingTypes, setSelectedBuildingTypes] = useState<string[]>([]);

  // State for analysis results
  const [trendAnalysis, setTrendAnalysis] = useState<TrendResult | null>(null);
  const [seasonalityAnalysis, setSeasonalityAnalysis] = useState<SeasonalityResult | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [growthRate, setGrowthRate] = useState<number>(0);

  // Get filter context
  const { filters } = useVisualizationContext();

  // Fetch cost trend data
  const { data: costTrendData, isLoading } = useQuery({
    queryKey: ['/api/cost-matrix/trends'],
  });

  // Metric options
  const metricOptions = [
    { value: 'baseCost', label: 'Base Cost' },
    { value: 'adjustedCost', label: 'Adjusted Cost' },
    { value: 'complexityFactor', label: 'Complexity Factor' },
    { value: 'qualityFactor', label: 'Quality Factor' },
    { value: 'conditionFactor', label: 'Condition Factor' }
  ];

  // Time period options
  const timePeriodOptions = [
    { value: 'year', label: 'Yearly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'month', label: 'Monthly' }
  ];

  // Calculate period length based on selected time period
  const getPeriodLength = (): number => {
    switch (timePeriod) {
      case 'month': return 12;
      case 'quarter': return 4;
      case 'year': return 1;
      default: return 4;
    }
  };

  // Format display name for selected metric
  const getMetricDisplayName = (metric: CostMetric): string => {
    return metricOptions.find(option => option.value === metric)?.label || metric;
  };

  // Format value based on metric type
  const formatValue = (value: number, metric: CostMetric): string => {
    if (metric === 'baseCost' || metric === 'adjustedCost') {
      return formatCurrency(value);
    } else if (
      metric === 'complexityFactor' ||
      metric === 'qualityFactor' ||
      metric === 'conditionFactor'
    ) {
      return formatPercentage(value);
    }
    return value.toLocaleString();
  };

  // Process the data for visualization
  const processedData = useMemo(() => {
    if (!costTrendData || !Array.isArray(costTrendData) || costTrendData.length === 0) {
      return [];
    }

    // Apply filters
    let filteredData = [...costTrendData];
    
    // Apply building type filter from the component state
    if (selectedBuildingTypes.length > 0) {
      filteredData = filteredData.filter(item => 
        selectedBuildingTypes.includes(item.buildingType)
      );
    }
    // Apply filters from the global context
    else if (filters?.buildingTypes && filters.buildingTypes.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.buildingTypes.includes(item.buildingType)
      );
    }
    
    // Apply region filter from the global context
    if (filters?.regions && filters.regions.length > 0) {
      filteredData = filteredData.filter(item => 
        filters.regions.includes(item.region)
      );
    }

    // Group by time period
    const groupedData = groupTimeSeriesByPeriod(
      filteredData,
      'date',
      selectedMetric,
      timePeriod
    );

    // Calculate moving average if enabled
    if (showMovingAverage && groupedData.length >= movingAverageWindow) {
      const values = groupedData.map(d => d.value);
      const movingAvg = calculateMovingAverage(values, movingAverageWindow);

      // Add moving average to the data
      groupedData.forEach((item, index) => {
        if (!isNaN(movingAvg[index])) {
          (item as any)['movingAverage'] = movingAvg[index];
        }
      });
    }

    return groupedData;
  }, [costTrendData, selectedMetric, timePeriod, filters, selectedBuildingTypes, showMovingAverage, movingAverageWindow]);

  // Generate forecast data if enabled
  const forecastedData = useMemo(() => {
    if (!showForecast || processedData.length < 4 || forecastPeriods <= 0) {
      return [];
    }

    const historicalValues = processedData.map(d => d.value);
    const periodLength = getPeriodLength();

    // Generate forecast with confidence intervals
    const forecast = forecastValues(historicalValues, forecastPeriods, {
      periodLength,
      includeConfidenceIntervals: true
    }) as ForecastResult;

    setForecastData(forecast);

    // Create data points for the forecast
    const lastPeriod = processedData[processedData.length - 1].period;
    const forecastData = [];

    for (let i = 0; i < forecastPeriods; i++) {
      let nextPeriod: string;

      if (timePeriod === 'year') {
        const year = parseInt(lastPeriod) + i + 1;
        nextPeriod = year.toString();
      } else if (timePeriod === 'quarter') {
        const [year, quarter] = lastPeriod.split('-Q');
        let nextYear = parseInt(year);
        let nextQuarter = parseInt(quarter) + i + 1;

        while (nextQuarter > 4) {
          nextQuarter -= 4;
          nextYear += 1;
        }

        nextPeriod = `${nextYear}-Q${nextQuarter}`;
      } else if (timePeriod === 'month') {
        const [year, month] = lastPeriod.split('-');
        let nextYear = parseInt(year);
        let nextMonth = parseInt(month) + i + 1;

        while (nextMonth > 12) {
          nextMonth -= 12;
          nextYear += 1;
        }

        nextPeriod = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      } else {
        // Fallback
        nextPeriod = `F${i + 1}`;
      }

      forecastData.push({
        period: nextPeriod,
        isForecast: true,
        value: forecast.values[i],
        upperBound: forecast.upperBound[i],
        lowerBound: forecast.lowerBound[i]
      });
    }

    return forecastData;
  }, [processedData, showForecast, forecastPeriods, timePeriod]);

  // Combined data for charting (historical + forecast)
  const chartData = useMemo(() => {
    // Add a null value between historical and forecast data to break the line
    const breakPoint = forecastedData.length > 0 ? [{ period: 'break', value: null }] : [];
    return [...processedData, ...breakPoint, ...forecastedData];
  }, [processedData, forecastedData]);

  // Available building types for filtering
  const availableBuildingTypes = useMemo(() => {
    if (!costTrendData || !Array.isArray(costTrendData)) return [];
    
    const types = new Set<string>();
    costTrendData.forEach(item => {
      if (item.buildingType) {
        types.add(item.buildingType);
      }
    });
    
    return Array.from(types).sort();
  }, [costTrendData]);

  // Run analysis when data changes
  useEffect(() => {
    if (processedData.length < 3) return;

    // Get values for analysis
    const values = processedData.map(d => d.value);

    // Trend analysis
    const trend = detectTrends(values);
    setTrendAnalysis(trend);

    // Seasonality analysis
    const periodLength = getPeriodLength();
    if (values.length >= periodLength * 2) {
      const seasonality = detectSeasonality(values, periodLength);
      setSeasonalityAnalysis(seasonality);
    } else {
      setSeasonalityAnalysis(null);
    }

    // Growth rate calculation
    const annualizedGrowthRate = calculateGrowthRate(values, {
      periodsPerYear: periodLength
    });
    setGrowthRate(annualizedGrowthRate);
  }, [processedData, timePeriod]);

  // Handle date range selection via the chart brush
  const handleBrushChange = (newRange: any) => {
    if (newRange && newRange.startIndex !== undefined && newRange.endIndex !== undefined) {
      setSelectedDateRange([newRange.startIndex, newRange.endIndex]);
    } else {
      setSelectedDateRange(null);
    }
  };

  // Handle building type selection/deselection
  const toggleBuildingType = (buildingType: string) => {
    setSelectedBuildingTypes(prev => {
      if (prev.includes(buildingType)) {
        return prev.filter(type => type !== buildingType);
      } else {
        return [...prev, buildingType];
      }
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedBuildingTypes([]);
    setSelectedDateRange(null);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    const isForecast = data.isForecast;
    
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <div className="font-medium mb-1">
          {formatPeriod(label)}
          {isForecast && (
            <Badge className="ml-2 bg-blue-100 text-blue-800">Forecast</Badge>
          )}
        </div>
        
        {payload.map((entry: any, index: number) => {
          if (entry.dataKey === 'value') {
            return (
              <div key={`value-${index}`} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {getMetricDisplayName(selectedMetric)}:
                </span>
                <span className="font-medium">{formatValue(entry.value, selectedMetric)}</span>
              </div>
            );
          } else if (entry.dataKey === 'movingAverage') {
            return (
              <div key={`ma-${index}`} className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {movingAverageWindow}-Period MA:
                </span>
                <span className="font-medium">{formatValue(entry.value, selectedMetric)}</span>
              </div>
            );
          }
          return null;
        })}
        
        {isForecast && data.upperBound !== undefined && data.lowerBound !== undefined && (
          <div className="mt-1 pt-1 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Range:</span>
              <span>
                {formatValue(data.lowerBound, selectedMetric)} - {formatValue(data.upperBound, selectedMetric)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Download chart data as CSV
  const downloadChartData = () => {
    const headers = ['Period', 'Value'];
    if (showMovingAverage) {
      headers.push(`${movingAverageWindow}-Period Moving Average`);
    }
    if (showForecast) {
      headers.push('Is Forecast', 'Lower Bound', 'Upper Bound');
    }
    
    const rows = chartData
      .filter(item => item.period !== 'break') // Remove the break point
      .map(item => {
        const row = [
          formatPeriod(item.period),
          item.value !== null ? item.value.toString() : ''
        ];
        
        if (showMovingAverage) {
          row.push((item as any).movingAverage !== undefined ? (item as any).movingAverage.toString() : '');
        }
        
        if (showForecast) {
          row.push((item as any).isForecast ? 'Yes' : 'No');
          row.push((item as any).lowerBound !== undefined ? (item as any).lowerBound.toString() : '');
          row.push((item as any).upperBound !== undefined ? (item as any).upperBound.toString() : '');
        }
        
        return row;
      });
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedMetric}_trend_analysis.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render trend indicator badge
  const renderTrendIndicator = () => {
    if (!trendAnalysis) return null;
    
    const { trend, confidence } = trendAnalysis;
    
    let color = '';
    let icon = null;
    let label = '';
    
    if (trend === 'upward') {
      color = 'bg-green-100 text-green-800';
      icon = <TrendingUp className="h-3 w-3 mr-1" />;
      label = 'Upward Trend';
    } else if (trend === 'downward') {
      color = 'bg-red-100 text-red-800';
      icon = <TrendingDown className="h-3 w-3 mr-1" />;
      label = 'Downward Trend';
    } else {
      color = 'bg-gray-100 text-gray-800';
      icon = <ArrowRight className="h-3 w-3 mr-1" />;
      label = 'Stable/Neutral';
    }
    
    // Only show as "detected" if confidence is high enough
    const isDetected = confidence > 0.7;
    
    return (
      <Badge 
        className={`${color} flex items-center`}
        data-testid="trend-indicator"
      >
        {icon}
        {label} {isDetected ? 'Detected' : 'Possible'}
      </Badge>
    );
  };

  // Render trend detail cards
  const renderTrendDetails = () => {
    if (!trendAnalysis) return null;
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold" data-testid="growth-rate">
                  {formatGrowthRate(growthRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Annualized rate
                </p>
              </div>
              <div className={`p-2 rounded-full ${
                growthRate > 0.05 ? 'bg-green-100' : 
                growthRate < 0 ? 'bg-red-100' : 'bg-gray-100'
              }`}>
                {growthRate > 0.05 ? (
                  <TrendingUp className="h-5 w-5 text-green-700" />
                ) : growthRate < 0 ? (
                  <TrendingDown className="h-5 w-5 text-red-700" />
                ) : (
                  <ArrowRight className="h-5 w-5 text-gray-700" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Trend Strength</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {(trendAnalysis.strength * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  R² value
                </p>
              </div>
              <div className={`p-2 rounded-full ${
                trendAnalysis.strength > 0.7 ? 'bg-green-100' : 
                trendAnalysis.strength > 0.3 ? 'bg-amber-100' : 'bg-gray-100'
              }`}>
                {trendAnalysis.strength > 0.7 ? (
                  <Zap className="h-5 w-5 text-green-700" />
                ) : trendAnalysis.strength > 0.3 ? (
                  <Zap className="h-5 w-5 text-amber-700" />
                ) : (
                  <Zap className="h-5 w-5 text-gray-700" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Seasonality</CardTitle>
          </CardHeader>
          <CardContent className="py-1">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-2xl font-bold">
                  {seasonalityAnalysis?.hasSeasonal ? 'Detected' : 'Not Detected'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {seasonalityAnalysis?.hasSeasonal ? 
                    `${seasonalityAnalysis.period}-period cycle` : 
                    'No regular pattern'}
                </p>
              </div>
              <div className={`p-2 rounded-full ${
                seasonalityAnalysis?.hasSeasonal ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                {seasonalityAnalysis?.hasSeasonal ? (
                  <Waves className="h-5 w-5 text-blue-700" />
                ) : (
                  <Waves className="h-5 w-5 text-gray-700" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-md p-6">
      <LineChartIcon className="h-8 w-8 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium mb-1">No Trend Data Available</h3>
      <p className="text-center text-sm text-muted-foreground mb-4">
        There is no time series data available for the current selection.
        Try selecting a different metric or changing your filters.
      </p>
    </div>
  );

  return (
    <div className={className}>
      <Card className="shadow-md mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Cost Trend Analysis</CardTitle>
              <CardDescription>
                Analyze and visualize building cost trends over time
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2" data-testid="trend-filters">
              <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as CostMetric)}>
                <SelectTrigger className="w-[140px]" data-testid="metric-selector">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={downloadChartData}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {trendAnalysis && (
            <div className="flex items-center gap-2 mt-2" data-testid="trend-metrics">
              {renderTrendIndicator()}
              
              <Badge className="bg-blue-100 text-blue-800">
                <Calendar className="h-3 w-3 mr-1" />
                {chartData.length} Periods
              </Badge>
              
              {processedData.length > 0 && (
                <Badge className="bg-indigo-100 text-indigo-800">
                  <Info className="h-3 w-3 mr-1" />
                  {formatValue(processedData[processedData.length - 1].value, selectedMetric)}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading trend data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-6">
              <div className="h-80" data-testid="trend-chart">
                <ResponsiveContainer width="100%" height="100%">
                  {chartMode === 'line' ? (
                    <LineChart 
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatPeriod}
                        height={40}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatValue(value, selectedMetric)}
                        width={80}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      
                      {/* Historical data line */}
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name={getMetricDisplayName(selectedMetric)} 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />
                      
                      {/* Moving average line */}
                      {showMovingAverage && (
                        <Line 
                          type="monotone" 
                          dataKey="movingAverage" 
                          name={`${movingAverageWindow}-Period MA`} 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          connectNulls
                        />
                      )}
                      
                      {/* Forecast line with confidence interval */}
                      {showForecast && forecastedData.length > 0 && (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="Forecast" 
                            stroke="#8b5cf6" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            connectNulls={false}
                            dot={{ r: 5, fill: '#8b5cf6' }}
                            activeDot={{ r: 6 }}
                            data-testid="forecast-data"
                          />
                          
                          {/* Confidence interval */}
                          <ReferenceLine 
                            x={processedData[processedData.length - 1].period}
                            stroke="#d1d5db" 
                            strokeDasharray="3 3"
                            label={{ value: 'Forecast Start', position: 'insideBottomLeft', fill: '#6b7280', fontSize: 12 }}
                          />
                          
                          {forecastedData.map((item, index) => (
                            <ReferenceArea 
                              key={`ra-${index}`}
                              x1={item.period} 
                              x2={item.period}
                              y1={item.lowerBound} 
                              y2={item.upperBound} 
                              fill="#8b5cf633" 
                              fillOpacity={0.3}
                              stroke="none"
                            />
                          ))}
                        </>
                      )}
                      
                      {/* Brush for selecting date range */}
                      <Brush 
                        dataKey="period" 
                        height={30} 
                        stroke="#8884d8"
                        tickFormatter={formatPeriod}
                        onChange={handleBrushChange}
                      />
                    </LineChart>
                  ) : (
                    <AreaChart 
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 10, bottom: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={formatPeriod}
                        height={40}
                      />
                      <YAxis 
                        tickFormatter={(value) => formatValue(value, selectedMetric)}
                        width={80}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      
                      {/* Historical data area */}
                      <Area
                        type="monotone" 
                        dataKey="value" 
                        name={getMetricDisplayName(selectedMetric)} 
                        stroke="#3b82f6" 
                        fill="#3b82f633" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                      />
                      
                      {/* Moving average line */}
                      {showMovingAverage && (
                        <Line 
                          type="monotone" 
                          dataKey="movingAverage" 
                          name={`${movingAverageWindow}-Period MA`} 
                          stroke="#10b981" 
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                          connectNulls
                        />
                      )}
                      
                      {/* Forecast area with confidence interval */}
                      {showForecast && forecastedData.length > 0 && (
                        <>
                          <Area 
                            type="monotone" 
                            dataKey="value" 
                            name="Forecast" 
                            stroke="#8b5cf6" 
                            fill="#8b5cf633"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            connectNulls={false}
                            dot={{ r: 4, fill: '#8b5cf6' }}
                            activeDot={{ r: 6 }}
                          />
                          
                          {/* Confidence interval */}
                          <ReferenceLine 
                            x={processedData[processedData.length - 1].period}
                            stroke="#d1d5db" 
                            strokeDasharray="3 3"
                            label={{ value: 'Forecast Start', position: 'insideBottomLeft', fill: '#6b7280', fontSize: 12 }}
                          />
                          
                          {forecastedData.map((item, index) => (
                            <ReferenceArea 
                              key={`ra-${index}`}
                              x1={item.period} 
                              x2={item.period}
                              y1={item.lowerBound} 
                              y2={item.upperBound} 
                              fill="#8b5cf633" 
                              fillOpacity={0.3}
                              stroke="none"
                            />
                          ))}
                        </>
                      )}
                      
                      {/* Brush for selecting date range */}
                      <Brush 
                        dataKey="period" 
                        height={30} 
                        stroke="#8884d8"
                        tickFormatter={formatPeriod}
                        onChange={handleBrushChange}
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
              
              {/* Analysis details */}
              {trendAnalysis && renderTrendDetails()}
              
              {/* Chart options */}
              <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={chartMode === 'line' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartMode('line')}
                      >
                        <LineChartIcon className="h-4 w-4 mr-1" />
                        Line
                      </Button>
                      <Button
                        variant={chartMode === 'area' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setChartMode('area')}
                      >
                        <LineChartIcon className="h-4 w-4 mr-1" />
                        Area
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label 
                      htmlFor="show-ma" 
                      className="text-sm flex items-center cursor-pointer"
                    >
                      <span className="mr-2">Moving Avg</span>
                      <Switch 
                        id="show-ma" 
                        checked={showMovingAverage} 
                        onCheckedChange={setShowMovingAverage} 
                      />
                    </label>
                    
                    {showMovingAverage && (
                      <Select 
                        value={movingAverageWindow.toString()} 
                        onValueChange={(value) => setMovingAverageWindow(parseInt(value))}
                      >
                        <SelectTrigger className="w-[80px] h-8">
                          <SelectValue placeholder="Periods" />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 6, 8].map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} {num === 1 ? 'period' : 'periods'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label 
                    htmlFor="show-forecast" 
                    className="text-sm flex items-center cursor-pointer"
                  >
                    <span className="mr-2">Forecast</span>
                    <Switch 
                      id="show-forecast" 
                      checked={showForecast} 
                      onCheckedChange={setShowForecast}
                      data-testid="forecast-toggle" 
                    />
                  </label>
                  
                  {showForecast && (
                    <Select 
                      value={forecastPeriods.toString()} 
                      onValueChange={(value) => setForecastPeriods(parseInt(value))}
                    >
                      <SelectTrigger className="w-[80px] h-8">
                        <SelectValue placeholder="Periods" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 4, 6, 8, 12].map(num => (
                          <SelectItem key={num} value={num.toString()}>
                            {num} {num === 1 ? 'period' : 'periods'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex-col items-start gap-2 border-t px-6 pt-4 pb-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="building-types">
              <AccordionTrigger className="text-sm font-medium py-2">
                <Filter className="h-4 w-4 mr-2" />
                Building Type Filters
                {selectedBuildingTypes.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {selectedBuildingTypes.length}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableBuildingTypes.map(type => (
                    <Badge
                      key={type}
                      variant={selectedBuildingTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleBuildingType(type)}
                    >
                      {selectedBuildingTypes.includes(type) ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : null}
                      {type}
                    </Badge>
                  ))}
                  
                  {selectedBuildingTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="date-range" data-testid="date-range-filter">
              <AccordionTrigger className="text-sm font-medium py-2">
                <Calendar className="h-4 w-4 mr-2" />
                Time Period
                {selectedDateRange && (
                  <Badge variant="outline" className="ml-2">
                    Selected
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-muted-foreground">
                  {processedData.length > 0 ? (
                    <p>
                      Available time range: <span className="font-medium">{formatPeriod(processedData[0].period)}</span> to <span className="font-medium">{formatPeriod(processedData[processedData.length - 1].period)}</span>
                    </p>
                  ) : (
                    <p>No time range available</p>
                  )}
                  <p className="mt-1">Use the brush below the chart to select a specific date range, or click "Reset" to view all data.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="help">
              <AccordionTrigger className="text-sm font-medium py-2">
                <HelpCircle className="h-4 w-4 mr-2" />
                Understanding Trend Analysis
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Trend Detection</span>: We analyze the data to determine if there's a statistically significant upward, downward, or neutral trend.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Growth Rate</span>: The annualized percentage change over the selected time period, taking into account compounding effects.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Moving Average</span>: Smooths out short-term fluctuations to highlight longer-term trends.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Forecast</span>: Predicts future values based on historical patterns, including trend and seasonality. Shaded areas show the confidence intervals.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Seasonality</span>: Detects regularly repeating patterns in the data, such as quarterly or monthly cycles.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardFooter>
      </Card>
    </div>
  );
}