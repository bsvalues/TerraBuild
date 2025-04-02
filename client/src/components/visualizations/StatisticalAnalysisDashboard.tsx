/**
 * Statistical Analysis Dashboard Component
 * 
 * A visualization component that provides advanced statistical analysis
 * of building costs data, including summary statistics, distribution analysis,
 * outlier detection, and correlation analysis.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';
import {
  AlertCircle,
  BarChart2,
  Calculator,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Info,
  Maximize2,
  Minimize2,
  TrendingDown,
  TrendingUp,
  X,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisualizationContext } from '@/contexts/visualization-context';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip as TooltipUI,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  calculateSummaryStatistics,
  detectOutliers,
  calculateCorrelations,
  calculateDistribution,
  calculateZScore,
  calculatePercentile,
  filterDataStatistically,
  type SummaryStatistics,
  type CorrelationMatrix
} from '@/utils/statistical-utils';

interface StatisticalAnalysisDashboardProps {
  className?: string;
}

type MetricType = 'baseCost' | 'adjustedCost' | 'complexityFactor' | 'qualityFactor' | 'conditionFactor';

export function StatisticalAnalysisDashboard({ className = '' }: StatisticalAnalysisDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('baseCost');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    summary: true,
    distribution: true,
    outliers: true,
    correlation: true
  });
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [stats, setStats] = useState<SummaryStatistics | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationMatrix | null>(null);
  const [outliers, setOutliers] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<{ x: number, y: number }[]>([]);

  const { filters } = useVisualizationContext();

  // Fetch cost matrix data
  const { data: costMatrixData, isLoading } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Metric options with display names
  const metricOptions = [
    { value: 'baseCost', label: 'Base Cost' },
    { value: 'adjustedCost', label: 'Adjusted Cost' },
    { value: 'complexityFactor', label: 'Complexity Factor' },
    { value: 'qualityFactor', label: 'Quality Factor' },
    { value: 'conditionFactor', label: 'Condition Factor' }
  ];

  // Get display name for selected metric
  const getMetricDisplayName = (metric: MetricType): string => {
    return metricOptions.find(option => option.value === metric)?.label || metric;
  };

  // Toggle expanded state of a card
  const toggleCardExpanded = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  // Format numbers with commas
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Apply filters and calculate statistics when data or filters change
  useEffect(() => {
    if (!costMatrixData || !Array.isArray(costMatrixData) || costMatrixData.length === 0) {
      return;
    }

    // Apply filters from context
    let filtered = [...costMatrixData];
    
    if (filters?.regions && filters.regions.length > 0) {
      filtered = filtered.filter(item => filters.regions.includes(item.region));
    }
    
    if (filters?.buildingTypes && filters.buildingTypes.length > 0) {
      filtered = filtered.filter(item => filters.buildingTypes.includes(item.buildingType));
    }
    
    setFilteredData(filtered);

    // Calculate statistics for the selected metric
    const metricValues = filtered.map(item => {
      if (selectedMetric === 'complexityFactor' || selectedMetric === 'qualityFactor' || selectedMetric === 'conditionFactor') {
        // Convert factors to percentages for better readability
        return item[selectedMetric] * 100;
      }
      return item[selectedMetric];
    }).filter(val => val !== undefined && val !== null);

    const calculatedStats = calculateSummaryStatistics(metricValues);
    setStats(calculatedStats);

    // Calculate distribution data
    setDistributionData(calculateDistribution(metricValues, 10));

    // Detect outliers
    const outlierValues = detectOutliers(metricValues);
    setOutliers(filtered.filter(item => {
      const value = selectedMetric === 'complexityFactor' || selectedMetric === 'qualityFactor' || selectedMetric === 'conditionFactor'
        ? item[selectedMetric] * 100
        : item[selectedMetric];
      return outlierValues.includes(value);
    }));

    // Calculate correlations
    const correlationMatrix = calculateCorrelations(filtered, [
      'baseCost',
      'adjustedCost',
      'complexityFactor',
      'qualityFactor',
      'conditionFactor'
    ]);
    setCorrelations(correlationMatrix);
  }, [costMatrixData, filters, selectedMetric]);

  // Format values based on metric type
  const formatValue = (value: number, metric: MetricType) => {
    if (metric === 'baseCost' || metric === 'adjustedCost') {
      return formatCurrency(value);
    } else if (
      metric === 'complexityFactor' ||
      metric === 'qualityFactor' ||
      metric === 'conditionFactor'
    ) {
      return formatPercentage(value / 100); // Convert back from percentage
    }
    return formatNumber(value);
  };

  // Generate colors for correlation matrix
  const getCorrelationColor = (value: number) => {
    if (value >= 0.8) return '#34D399'; // Strong positive (green)
    if (value >= 0.5) return '#34D39999'; // Moderate positive (light green)
    if (value >= 0.3) return '#34D39966'; // Weak positive (very light green)
    if (value <= -0.8) return '#EF4444'; // Strong negative (red)
    if (value <= -0.5) return '#EF444499'; // Moderate negative (light red)
    if (value <= -0.3) return '#EF444466'; // Weak negative (very light red)
    return '#6B728066'; // Negligible (gray)
  };

  // Calculate if a statistic is an outlier compared to other metrics
  const isOutlierStat = (stat: string, value: number): boolean => {
    if (!stats) return false;
    
    // For now, just mark anything beyond 2 standard deviations as an outlier
    const zScore = Math.abs(calculateZScore(value, stats.mean, stats.standardDeviation));
    return zScore > 2;
  };

  // Download statistics as CSV
  const downloadStatistics = () => {
    if (!stats) return;
    
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Mean', stats.mean.toString()],
      ['Median', stats.median.toString()],
      ['Minimum', stats.min.toString()],
      ['Maximum', stats.max.toString()],
      ['Range', stats.range.toString()],
      ['Standard Deviation', stats.standardDeviation.toString()],
      ['Variance', stats.variance.toString()],
      ['Count', stats.count.toString()],
      ['First Quartile (Q1)', stats.q1.toString()],
      ['Third Quartile (Q3)', stats.q3.toString()],
      ['Interquartile Range', stats.iqr.toString()]
    ];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedMetric}_statistics.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render a statistics card with value and comparison
  const renderStatisticsCard = (
    title: string,
    value: number | undefined,
    secondaryText: string,
    icon: React.ReactNode,
    testId: string
  ) => {
    if (value === undefined) return null;
    
    const isOutlier = isOutlierStat(title, value);
    
    return (
      <Card className="shadow-sm" data-testid={`statistics-card-${testId}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="rounded-full bg-primary/10 p-1">
              {icon}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid={`statistics-value-${testId}`}>
            {formatValue(value, selectedMetric)}
            {isOutlier && (
              <TooltipProvider>
                <TooltipUI>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 ml-1 inline text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This value is statistically significant</p>
                  </TooltipContent>
                </TooltipUI>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{secondaryText}</p>
        </CardContent>
      </Card>
    );
  };

  // Render empty state when no data is available
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-md p-6">
      <Calculator className="h-8 w-8 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium mb-1">No Data Available</h3>
      <p className="text-center text-sm text-muted-foreground mb-4">
        There is no data available for the current selection. 
        Try selecting a different metric or changing your filters.
      </p>
    </div>
  );

  return (
    <div className={className}>
      <Card className="shadow-md mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Statistical Analysis</CardTitle>
              <CardDescription>
                Advanced statistical insights for building cost data
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
                <SelectTrigger className="w-[180px]">
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
              
              <Button variant="outline" size="sm" onClick={downloadStatistics} disabled={!stats}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : filteredData.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-6">
              {/* Summary Statistics Section */}
              <Collapsible 
                open={expandedCards.summary}
                onOpenChange={() => toggleCardExpanded('summary')}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Summary Statistics</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedCards.summary ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats && (
                      <>
                        {renderStatisticsCard(
                          'Mean',
                          stats.mean,
                          'Average value across all data points',
                          <Calculator className="h-4 w-4 text-primary" />,
                          'mean'
                        )}
                        
                        {renderStatisticsCard(
                          'Median',
                          stats.median,
                          'Middle value (50th percentile)',
                          <BarChart2 className="h-4 w-4 text-primary" />,
                          'median'
                        )}
                        
                        {renderStatisticsCard(
                          'Standard Deviation',
                          stats.standardDeviation,
                          'Measure of data dispersion',
                          <Zap className="h-4 w-4 text-primary" />,
                          'std-dev'
                        )}
                        
                        {renderStatisticsCard(
                          'Range',
                          stats.range,
                          `Min: ${formatValue(stats.min, selectedMetric)}, Max: ${formatValue(stats.max, selectedMetric)}`,
                          <Maximize2 className="h-4 w-4 text-primary" />,
                          'range'
                        )}
                      </>
                    )}
                  </div>
                  
                  {stats && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Quartile Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">First Quartile (Q1)</span>
                              <span className="font-medium">{formatValue(stats.q1, selectedMetric)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Median (Q2)</span>
                              <span className="font-medium">{formatValue(stats.median, selectedMetric)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Third Quartile (Q3)</span>
                              <span className="font-medium">{formatValue(stats.q3, selectedMetric)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Interquartile Range</span>
                              <span className="font-medium">{formatValue(stats.iqr, selectedMetric)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Sample Size</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Data Points</span>
                              <span className="font-medium">{stats.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Filtered Data Points</span>
                              <span className="font-medium">{filteredData.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Percentage of Total</span>
                              <span className="font-medium">
                                {costMatrixData && Array.isArray(costMatrixData) && costMatrixData.length > 0 
                                  ? `${((filteredData.length / costMatrixData.length) * 100).toFixed(1)}%` 
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              {/* Distribution Analysis Section */}
              <Collapsible 
                open={expandedCards.distribution}
                onOpenChange={() => toggleCardExpanded('distribution')}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Distribution Analysis</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedCards.distribution ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">
                            Distribution of {getMetricDisplayName(selectedMetric)}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-72" data-testid="distribution-chart">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                  dataKey="x" 
                                  tickFormatter={(value) => {
                                    // Format x-axis labels based on metric type
                                    return formatValue(value, selectedMetric);
                                  }}
                                  label={{ 
                                    value: getMetricDisplayName(selectedMetric),
                                    position: 'insideBottom',
                                    offset: -10
                                  }}
                                />
                                <YAxis 
                                  label={{ 
                                    value: 'Frequency',
                                    angle: -90,
                                    position: 'insideLeft'
                                  }}
                                />
                                <Tooltip 
                                  formatter={(value, name, props) => {
                                    if (name === 'x') {
                                      return [formatValue(props.payload.x, selectedMetric), 'Value'];
                                    }
                                    return [value, 'Frequency'];
                                  }}
                                />
                                <Bar 
                                  dataKey="y" 
                                  fill="#3498db" 
                                  name="Frequency"
                                  isAnimationActive={false}
                                >
                                  {distributionData.map((entry, index) => {
                                    // Highlight bins containing outliers
                                    const binHasOutlier = stats && ((entry.x < stats.q1 - 1.5 * stats.iqr) || (entry.x > stats.q3 + 1.5 * stats.iqr));
                                    return <Cell key={`cell-${index}`} fill={binHasOutlier ? '#e74c3c' : '#3498db'} />;
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div>
                      <Card className="shadow-sm h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Distribution Insights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {stats && (
                              <>
                                {/* Distribution shape insight */}
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Distribution Shape</h4>
                                  {Math.abs((stats.mean - stats.median) / stats.standardDeviation) > 0.2 ? (
                                    <div className="flex items-center text-sm">
                                      <Badge className="mr-2 bg-blue-500">Skewed</Badge>
                                      <span className="text-muted-foreground">
                                        {stats.mean > stats.median ? 'Right (positive) skew' : 'Left (negative) skew'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-sm">
                                      <Badge className="mr-2 bg-green-500">Symmetric</Badge>
                                      <span className="text-muted-foreground">
                                        Values are evenly distributed around the mean
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Data concentration insight */}
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Data Concentration</h4>
                                  <div className="text-sm text-muted-foreground">
                                    <p>
                                      50% of values fall between{' '}
                                      <span className="font-medium">{formatValue(stats.q1, selectedMetric)}</span> and{' '}
                                      <span className="font-medium">{formatValue(stats.q3, selectedMetric)}</span>
                                    </p>
                                    <p className="mt-1">
                                      Central tendency:{' '}
                                      {stats.iqr / stats.range < 0.3 ? (
                                        <Badge className="bg-blue-500">Highly concentrated</Badge>
                                      ) : stats.iqr / stats.range > 0.6 ? (
                                        <Badge className="bg-amber-500">Widely dispersed</Badge>
                                      ) : (
                                        <Badge className="bg-green-500">Moderately spread</Badge>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Outliers insight */}
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Outlier Analysis</h4>
                                  <div className="text-sm text-muted-foreground">
                                    {outliers.length > 0 ? (
                                      <div>
                                        <p>
                                          <Badge className="bg-amber-500 mr-2">{outliers.length} outliers detected</Badge>
                                          ({((outliers.length / filteredData.length) * 100).toFixed(1)}% of data)
                                        </p>
                                        <p className="mt-1">
                                          Outlier thresholds: below{' '}
                                          <span className="font-medium">
                                            {formatValue(stats.q1 - 1.5 * stats.iqr, selectedMetric)}
                                          </span>{' '}
                                          or above{' '}
                                          <span className="font-medium">
                                            {formatValue(stats.q3 + 1.5 * stats.iqr, selectedMetric)}
                                          </span>
                                        </p>
                                      </div>
                                    ) : (
                                      <p>
                                        <Badge className="bg-green-500 mr-2">No outliers detected</Badge>
                                        Data follows expected distribution
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Outlier Detection Section */}
              <Collapsible 
                open={expandedCards.outliers}
                onOpenChange={() => toggleCardExpanded('outliers')}
                className="space-y-2"
                data-testid="outlier-detection"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Outlier Detection</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedCards.outliers ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  {outliers.length > 0 ? (
                    <div>
                      <Alert className="mb-4 bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Outliers Detected</AlertTitle>
                        <AlertDescription className="text-amber-700">
                          {outliers.length} outlier{outliers.length !== 1 ? 's' : ''} detected in the dataset.
                          These may represent exceptional cases or data errors.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="overflow-x-auto">
                        <Table>
                          <TableCaption>Outliers based on {getMetricDisplayName(selectedMetric)}</TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Region</TableHead>
                              <TableHead>Building Type</TableHead>
                              <TableHead>Value</TableHead>
                              <TableHead>Z-Score</TableHead>
                              <TableHead>Percentile</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {outliers.map((item, index) => {
                              const value = selectedMetric === 'complexityFactor' || 
                                selectedMetric === 'qualityFactor' || 
                                selectedMetric === 'conditionFactor'
                                ? item[selectedMetric] * 100
                                : item[selectedMetric];
                              
                              const zScore = stats ? calculateZScore(value, stats.mean, stats.standardDeviation) : 0;
                              
                              const allValues = filteredData.map(item => {
                                return selectedMetric === 'complexityFactor' || 
                                  selectedMetric === 'qualityFactor' || 
                                  selectedMetric === 'conditionFactor'
                                  ? item[selectedMetric] * 100
                                  : item[selectedMetric];
                              }).sort((a, b) => a - b);
                              
                              const percentile = calculatePercentile(value, allValues);
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>{item.region}</TableCell>
                                  <TableCell>{item.buildingType}</TableCell>
                                  <TableCell className="font-medium">
                                    {formatValue(value, selectedMetric)}
                                  </TableCell>
                                  <TableCell>
                                    <span className={zScore > 0 ? 'text-red-500' : 'text-blue-500'}>
                                      {zScore > 0 ? '+' : ''}{zScore.toFixed(2)}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {percentile.toFixed(1)}%
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ) : (
                    <Alert className="bg-green-50 border-green-200">
                      <Info className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">No Outliers Detected</AlertTitle>
                      <AlertDescription className="text-green-700">
                        All data points for {getMetricDisplayName(selectedMetric)} fall within the expected range.
                      </AlertDescription>
                    </Alert>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              {/* Correlation Analysis Section */}
              <Collapsible 
                open={expandedCards.correlation}
                onOpenChange={() => toggleCardExpanded('correlation')}
                className="space-y-2"
                data-testid="correlation-matrix"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Correlation Analysis</h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {expandedCards.correlation ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  {correlations ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card className="shadow-sm overflow-auto">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Correlation Matrix</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="min-w-[500px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead></TableHead>
                                  {metricOptions.map(option => (
                                    <TableHead key={option.value}>{option.label}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {metricOptions.map(rowOption => (
                                  <TableRow key={rowOption.value}>
                                    <TableCell className="font-medium">{rowOption.label}</TableCell>
                                    {metricOptions.map(colOption => {
                                      const correlation = correlations[rowOption.value]?.[colOption.value] || 0;
                                      return (
                                        <TableCell 
                                          key={colOption.value}
                                          style={{
                                            backgroundColor: getCorrelationColor(correlation),
                                            textAlign: 'center'
                                          }}
                                        >
                                          {correlation.toFixed(2)}
                                        </TableCell>
                                      );
                                    })}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          <div className="mt-4 text-sm text-muted-foreground">
                            <p>
                              Correlation scale: -1 (perfect negative) to +1 (perfect positive). 
                              Values close to 0 indicate no correlation.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium">Key Relationships</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {Object.keys(correlations).map(metric1 => {
                              // Find strongest correlation for this metric (excluding self-correlation)
                              let strongestCorrelation = 0;
                              let strongestMetric = '';
                              
                              Object.keys(correlations[metric1]).forEach(metric2 => {
                                if (metric1 !== metric2) {
                                  const correlation = Math.abs(correlations[metric1][metric2]);
                                  if (correlation > Math.abs(strongestCorrelation)) {
                                    strongestCorrelation = correlations[metric1][metric2];
                                    strongestMetric = metric2;
                                  }
                                }
                              });
                              
                              // Only show if there's a meaningful correlation
                              if (Math.abs(strongestCorrelation) >= 0.3 && strongestMetric) {
                                const metric1Label = metricOptions.find(o => o.value === metric1)?.label || metric1;
                                const metric2Label = metricOptions.find(o => o.value === strongestMetric)?.label || strongestMetric;
                                
                                return (
                                  <div key={metric1} className="flex items-center gap-3">
                                    <div 
                                      className="h-8 w-8 rounded-full flex items-center justify-center"
                                      style={{ backgroundColor: getCorrelationColor(strongestCorrelation) }}
                                    >
                                      {strongestCorrelation > 0 ? (
                                        <TrendingUp className="h-4 w-4 text-white" />
                                      ) : (
                                        <TrendingDown className="h-4 w-4 text-white" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium">
                                        {metric1Label} {strongestCorrelation > 0 ? 'increases' : 'decreases'} with {metric2Label}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        Correlation strength: {Math.abs(strongestCorrelation).toFixed(2)}{' '}
                                        ({Math.abs(strongestCorrelation) > 0.7 ? 'Strong' : 
                                           Math.abs(strongestCorrelation) > 0.4 ? 'Moderate' : 'Weak'})
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                            
                            {Object.keys(correlations).every(metric1 => 
                              Object.keys(correlations[metric1]).every(metric2 => 
                                metric1 === metric2 || Math.abs(correlations[metric1][metric2]) < 0.3
                              )
                            ) && (
                              <div className="text-center py-6">
                                <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-muted-foreground">
                                  No significant correlations detected between metrics
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">
                        Insufficient data to calculate correlations
                      </p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}