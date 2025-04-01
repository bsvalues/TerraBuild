import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { detectOutliers, calculateCorrelation, validateDataCompleteness, calculateConfidenceInterval } from '@/lib/statistics-utils';
import { AlertCircle, TrendingUp, LineChart as LineChartIcon, Activity } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface StatisticalAnalysisProps {
  title?: string;
  description?: string;
}

/**
 * Statistical Analysis Component
 * Displays statistical analysis of cost data including correlations and outliers
 */
const StatisticalAnalysis: React.FC<StatisticalAnalysisProps> = ({
  title = 'Statistical Analysis',
  description = 'Data quality, correlations, and outlier detection'
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Washington');
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>('RESIDENTIAL');
  const [activeTab, setActiveTab] = useState<string>('data-quality');
  
  // Get available regions
  const { data: regionsData } = useQuery({
    queryKey: ['/api/regions'],
    retry: 1
  });
  
  // For simplicity, we'll use a fixed list of building types
  const buildingTypes = [
    { value: 'RESIDENTIAL', label: 'Residential' },
    { value: 'COMMERCIAL', label: 'Commercial' },
    { value: 'INDUSTRIAL', label: 'Industrial' }
  ];
  
  // Fetch cost data for statistical analysis
  const { data: costData, isLoading, error } = useQuery({
    queryKey: ['/api/benchmarking/statistical-data', selectedRegion, selectedBuildingType],
    queryFn: async () => {
      const response = await fetch('/api/benchmarking/statistical-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: selectedRegion, buildingType: selectedBuildingType })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistical data');
      }
      
      return response.json();
    },
    enabled: !!selectedRegion && !!selectedBuildingType,
    retry: 1
  });
  
  // Calculated statistical metrics
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [correlationData, setCorrelationData] = useState<any>(null);
  const [outlierData, setOutlierData] = useState<any>(null);
  
  // Process data when it changes
  useEffect(() => {
    if (costData) {
      // Validate data quality
      if (costData.buildings && Array.isArray(costData.buildings)) {
        const quality = validateDataCompleteness(costData.buildings, ['id', 'region', 'cost', 'size', 'yearBuilt']);
        setDataQuality(quality);
      }
      
      // Calculate correlations
      if (costData.correlations && costData.correlations.size && costData.correlations.cost) {
        // Prepare correlation data for visualization
        const sizes = costData.correlations.size;
        const costs = costData.correlations.cost;
        
        // Convert to scatter plot format
        const scatterData = sizes.map((size: number, index: number) => ({
          size,
          cost: costs[index]
        }));
        
        // Calculate correlation coefficient
        const coefficient = calculateCorrelation(sizes, costs);
        
        setCorrelationData({
          scatterData,
          coefficient,
          trendline: generateTrendline(sizes, costs, coefficient)
        });
      }
      
      // Detect outliers
      if (costData.costs && Array.isArray(costData.costs)) {
        const outliers = detectOutliers(costData.costs);
        setOutlierData(outliers);
      }
    }
  }, [costData]);
  
  // Helper for building type label
  const getBuildingTypeLabel = (type: string) => {
    const found = buildingTypes.find(bt => bt.value === type);
    return found ? found.label : type;
  };
  
  // Generate trendline data for correlation visualization
  const generateTrendline = (sizes: number[], costs: number[], correlation: number) => {
    if (sizes.length < 2 || Math.abs(correlation) < 0.1) return [];
    
    const n = sizes.length;
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / n;
    const avgCost = costs.reduce((sum, cost) => sum + cost, 0) / n;
    
    // Calculate slope and intercept for the trendline (y = mx + b)
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (sizes[i] - avgSize) * (costs[i] - avgCost);
      denominator += Math.pow(sizes[i] - avgSize, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = avgCost - slope * avgSize;
    
    // Generate trendline points
    const minSize = Math.min(...sizes);
    const maxSize = Math.max(...sizes);
    
    return [
      { size: minSize, value: slope * minSize + intercept },
      { size: maxSize, value: slope * maxSize + intercept }
    ];
  };
  
  // Format correlation strength description
  const getCorrelationDescription = (coefficient: number) => {
    const absCoefficient = Math.abs(coefficient);
    
    if (absCoefficient >= 0.9) return 'Very Strong';
    if (absCoefficient >= 0.7) return 'Strong';
    if (absCoefficient >= 0.5) return 'Moderate';
    if (absCoefficient >= 0.3) return 'Weak';
    return 'Very Weak';
  };
  
  // Generate correlation badge color
  const getCorrelationBadgeColor = (coefficient: number) => {
    const absCoefficient = Math.abs(coefficient);
    
    if (absCoefficient >= 0.7) return 'bg-green-100 text-green-800';
    if (absCoefficient >= 0.5) return 'bg-blue-100 text-blue-800';
    if (absCoefficient >= 0.3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Region</label>
            <Select
              value={selectedRegion}
              onValueChange={setSelectedRegion}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(regionsData) && regionsData.map((region: string) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Building Type</label>
            <Select
              value={selectedBuildingType}
              onValueChange={setSelectedBuildingType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Building Type" />
              </SelectTrigger>
              <SelectContent>
                {buildingTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load statistical data. Please try again.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="data-quality" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Data Quality</span>
              </TabsTrigger>
              <TabsTrigger value="correlations" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span>Correlations</span>
              </TabsTrigger>
              <TabsTrigger value="outliers" className="flex items-center gap-2">
                <LineChartIcon className="h-4 w-4" />
                <span>Outliers</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Data Quality Tab */}
            <TabsContent value="data-quality">
              {dataQuality ? (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">
                      Data Quality Assessment
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getBuildingTypeLabel(selectedBuildingType)} buildings in {selectedRegion}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <div className="text-sm font-medium">Completeness Score</div>
                        <div className="text-sm font-bold">{(dataQuality.completenessScore * 100).toFixed(1)}%</div>
                      </div>
                      <Progress value={dataQuality.completenessScore * 100} />
                    </div>
                    
                    <div className="p-4 rounded-md border">
                      <div className="text-sm font-medium mb-2">Data Status</div>
                      <div className="flex items-center gap-2">
                        {dataQuality.isComplete ? (
                          <Badge className="bg-green-100 text-green-800">Complete</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800">Incomplete</Badge>
                        )}
                        
                        {costData?.buildings && (
                          <div className="text-sm text-muted-foreground">
                            {costData.buildings.length} records analyzed
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {!dataQuality.isComplete && dataQuality.missingFields.length > 0 && (
                      <div className="p-4 rounded-md border">
                        <div className="text-sm font-medium mb-2">Missing Data Fields</div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {dataQuality.missingFields.slice(0, 5).map((missing: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span>Record ID: {missing.id}</span>
                              <Badge variant="outline">{missing.field}</Badge>
                            </div>
                          ))}
                          
                          {dataQuality.missingFields.length > 5 && (
                            <div className="text-sm text-muted-foreground text-center">
                              ...and {dataQuality.missingFields.length - 5} more missing fields
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Data Available</AlertTitle>
                  <AlertDescription>
                    No data quality information available for the selected criteria.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {/* Correlations Tab */}
            <TabsContent value="correlations">
              {correlationData ? (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">
                      Size vs. Cost Correlation
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getBuildingTypeLabel(selectedBuildingType)} buildings in {selectedRegion}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-md border text-center mb-4">
                    <div className="text-sm font-medium mb-2">Correlation Coefficient</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {correlationData.coefficient.toFixed(3)}
                    </div>
                    <div className="mt-2">
                      <Badge className={getCorrelationBadgeColor(correlationData.coefficient)}>
                        {getCorrelationDescription(correlationData.coefficient)}
                        {correlationData.coefficient > 0 ? ' Positive' : ' Negative'} Correlation
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number" 
                          dataKey="size"
                          name="Size"
                          label={{ value: 'Building Size (sqft)', position: 'bottom' }}
                        />
                        <YAxis
                          type="number"
                          dataKey="cost"
                          name="Cost"
                          label={{ value: 'Cost ($/sqft)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          formatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
                        />
                        <Scatter 
                          name="Building Data" 
                          data={correlationData.scatterData} 
                          fill="#8884d8"
                        />
                        
                        {/* Trendline */}
                        {correlationData.trendline.length > 0 && (
                          <Line
                            type="monotone"
                            dataKey="value"
                            data={correlationData.trendline}
                            stroke="#ff7300"
                            strokeWidth={2}
                            dot={false}
                            activeDot={false}
                            isAnimationActive={false}
                            name="Trend"
                          />
                        )}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="p-4 rounded-md border bg-gray-50">
                    <div className="text-sm font-medium mb-2">Interpretation</div>
                    <p className="text-sm">
                      {Math.abs(correlationData.coefficient) > 0.7 ? (
                        <>
                          There is a <strong>{correlationData.coefficient > 0 ? 'strong positive' : 'strong negative'}</strong> correlation between building size and cost.
                          {correlationData.coefficient > 0 
                            ? ' This indicates that larger buildings tend to have higher costs per square foot.'
                            : ' This indicates that larger buildings tend to have lower costs per square foot, suggesting economies of scale.'}
                        </>
                      ) : Math.abs(correlationData.coefficient) > 0.3 ? (
                        <>
                          There is a <strong>{correlationData.coefficient > 0 ? 'moderate positive' : 'moderate negative'}</strong> correlation between building size and cost.
                          This suggests that building size has some influence on cost, but other factors are also important.
                        </>
                      ) : (
                        <>
                          There is a <strong>weak correlation</strong> between building size and cost.
                          This suggests that factors other than building size are more important in determining cost per square foot.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Correlation Data</AlertTitle>
                  <AlertDescription>
                    No correlation data available for the selected criteria.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            {/* Outliers Tab */}
            <TabsContent value="outliers">
              {outlierData ? (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">
                      Cost Outlier Detection
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {getBuildingTypeLabel(selectedBuildingType)} buildings in {selectedRegion}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-md border text-center mb-4">
                    <div className="text-sm font-medium mb-2">Outliers Detected</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {outlierData.outliers.length}
                    </div>
                    <div className="mt-2">
                      <Badge variant={outlierData.outliers.length > 0 ? 'default' : 'outline'}>
                        {outlierData.outliers.length > 0 
                          ? `${((outlierData.outliers.length / outlierData.zScores.length) * 100).toFixed(1)}% of data`
                          : 'No outliers found'
                        }
                      </Badge>
                    </div>
                  </div>
                  
                  {costData?.costs && costData?.buildings && outlierData.outliers.length > 0 && (
                    <div className="p-4 rounded-md border">
                      <div className="text-sm font-medium mb-2">Outlier Details</div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {outlierData.outliers.map((cost: number, index: number) => {
                          // Find building data for this outlier
                          const buildingIndex = costData.costs.findIndex((c: number) => c === cost);
                          const building = buildingIndex >= 0 && buildingIndex < costData.buildings.length
                            ? costData.buildings[buildingIndex]
                            : null;
                          
                          return (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <div className="font-medium">${cost.toFixed(2)}/sqft</div>
                                {building && (
                                  <div className="text-xs text-muted-foreground">
                                    ID: {building.id}, Size: {building.size} sqft
                                  </div>
                                )}
                              </div>
                              <Badge variant="outline" className="ml-2">
                                Z-Score: {outlierData.zScores[buildingIndex]?.toFixed(2) || 'N/A'}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4 rounded-md border bg-gray-50">
                    <div className="text-sm font-medium mb-2">Analysis Method</div>
                    <p className="text-sm">
                      Outliers were detected using the Z-score method with a threshold of {outlierData.threshold}.
                      Z-scores measure how many standard deviations a data point is from the mean.
                      {outlierData.outliers.length > 0 
                        ? ' The detected outliers may represent unique properties, data errors, or special cases.'
                        : ' No outliers were detected, suggesting the data is relatively consistent.'}
                    </p>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Outlier Data</AlertTitle>
                  <AlertDescription>
                    No outlier analysis data available for the selected criteria.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticalAnalysis;