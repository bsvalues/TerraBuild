import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Benton County branding colors
const COLORS = ['#243E4D', '#3CAB36', '#29B7D3', '#4a6b7a', '#6ac766', '#5acbdf'];

interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

interface ComparisonData {
  regions?: string[];
  buildingTypes?: string[];
  buildingTypeLabels?: string[];
  values: number[];
}

interface CostBreakdownData {
  calculationId: number;
  totalCost: number;
  categories: string[];
  values: number[];
  percentages: number[];
}

const DataVisualization: React.FC = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('timeSeries');
  
  // Time series params
  const [buildingType, setBuildingType] = useState('RES1');
  const [region, setRegion] = useState('Western');
  const [startYear, setStartYear] = useState('2020');
  const [endYear, setEndYear] = useState('2025');
  
  // Comparison params
  const [comparisonBuildingType, setComparisonBuildingType] = useState('RES1');
  const [comparisonRegion, setComparisonRegion] = useState('Western');
  const [comparisonYear, setComparisonYear] = useState('2025');
  const [squareFootage, setSquareFootage] = useState('2000');
  
  // Cost breakdown params
  const [calculationId, setCalculationId] = useState<string>('');

  // Fetch time series data
  const timeSeriesQuery = useQuery({
    queryKey: ['/api/analytics/time-series', buildingType, region, startYear, endYear],
    queryFn: async () => {
      if (!buildingType || !region || !startYear || !endYear) {
        return [] as TimeSeriesDataPoint[];
      }
      const response = await fetch(
        `/api/analytics/time-series?buildingType=${buildingType}&region=${region}&startYear=${startYear}&endYear=${endYear}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch time series data');
      }
      return response.json() as Promise<TimeSeriesDataPoint[]>;
    },
    enabled: selectedTab === 'timeSeries'
  });

  // Fetch regional comparison data
  const regionalComparisonQuery = useQuery({
    queryKey: ['/api/analytics/regional-comparison', comparisonBuildingType, comparisonYear, squareFootage],
    queryFn: async () => {
      if (!comparisonBuildingType || !comparisonYear || !squareFootage) {
        return { values: [] } as ComparisonData;
      }
      const response = await fetch(
        `/api/analytics/regional-comparison?buildingType=${comparisonBuildingType}&year=${comparisonYear}&squareFootage=${squareFootage}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch regional comparison data');
      }
      return response.json() as Promise<ComparisonData>;
    },
    enabled: selectedTab === 'regionalComparison'
  });

  // Fetch building type comparison data
  const buildingTypeComparisonQuery = useQuery({
    queryKey: ['/api/analytics/building-type-comparison', comparisonRegion, comparisonYear, squareFootage],
    queryFn: async () => {
      if (!comparisonRegion || !comparisonYear || !squareFootage) {
        return { values: [] } as ComparisonData;
      }
      const response = await fetch(
        `/api/analytics/building-type-comparison?region=${comparisonRegion}&year=${comparisonYear}&squareFootage=${squareFootage}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch building type comparison data');
      }
      return response.json() as Promise<ComparisonData>;
    },
    enabled: selectedTab === 'buildingTypeComparison'
  });

  // Fetch cost breakdown data
  const costBreakdownQuery = useQuery({
    queryKey: ['/api/analytics/cost-breakdown', calculationId],
    queryFn: async () => {
      if (!calculationId) {
        throw new Error('Calculation ID is required');
      }
      const response = await fetch(`/api/analytics/cost-breakdown/${calculationId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cost breakdown data');
      }
      return response.json() as Promise<CostBreakdownData>;
    },
    enabled: selectedTab === 'costBreakdown' && !!calculationId,
    retry: false
  });

  // Handle cost breakdown error
  React.useEffect(() => {
    if (costBreakdownQuery.isError) {
      const errorMessage = costBreakdownQuery.error instanceof Error 
        ? costBreakdownQuery.error.message 
        : 'Unknown error';
      
      toast({
        title: 'Error',
        description: `Failed to fetch cost breakdown: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  }, [costBreakdownQuery.isError, costBreakdownQuery.error, toast]);

  // Transform data for regional comparison chart
  const regionalComparisonData = React.useMemo(() => {
    if (!regionalComparisonQuery.data?.regions || !regionalComparisonQuery.data?.values) {
      return [];
    }
    
    return regionalComparisonQuery.data.regions.map((region, index) => ({
      name: region,
      value: regionalComparisonQuery.data.values[index],
    }));
  }, [regionalComparisonQuery.data]);

  // Transform data for building type comparison chart
  const buildingTypeComparisonData = React.useMemo(() => {
    if (
      !buildingTypeComparisonQuery.data?.buildingTypes || 
      !buildingTypeComparisonQuery.data?.buildingTypeLabels || 
      !buildingTypeComparisonQuery.data?.values
    ) {
      return [];
    }
    
    return buildingTypeComparisonQuery.data.buildingTypes.map((type, index) => ({
      name: buildingTypeComparisonQuery.data.buildingTypeLabels?.[index] || type,
      value: buildingTypeComparisonQuery.data.values[index],
    }));
  }, [buildingTypeComparisonQuery.data]);

  // Transform data for pie chart
  const costBreakdownPieData = React.useMemo(() => {
    if (!costBreakdownQuery.data?.categories || !costBreakdownQuery.data?.values) {
      return [];
    }
    
    return costBreakdownQuery.data.categories.map((category, index) => ({
      name: category,
      value: costBreakdownQuery.data.values[index],
    }));
  }, [costBreakdownQuery.data]);

  // Helper function to render loading state
  const renderLoading = () => (
    <div className="space-y-4 w-full">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );

  // Helper function to render error state
  const renderError = (message: string) => (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold text-[#243E4D]">Data Visualization</h1>
      <p className="text-[#243E4D]/70">
        Interactive visualizations and analytics for building cost data
      </p>

      <Tabs 
        value={selectedTab} 
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-6 bg-[#243E4D]/10">
          <TabsTrigger value="timeSeries" className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white">Time Series</TabsTrigger>
          <TabsTrigger value="regionalComparison" className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white">Regional Comparison</TabsTrigger>
          <TabsTrigger value="buildingTypeComparison" className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white">Building Type Comparison</TabsTrigger>
          <TabsTrigger value="costBreakdown" className="data-[state=active]:bg-[#243E4D] data-[state=active]:text-white">Cost Breakdown</TabsTrigger>
        </TabsList>

        {/* Time Series Tab */}
        <TabsContent value="timeSeries">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#243E4D]">Cost Trends Over Time</CardTitle>
              <CardDescription className="text-[#243E4D]/70">
                View how base costs for building types have changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#243E4D]">Building Type</label>
                  <Select 
                    value={buildingType} 
                    onValueChange={setBuildingType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RES1">Residential (RES1)</SelectItem>
                      <SelectItem value="COM1">Commercial (COM1)</SelectItem>
                      <SelectItem value="IND1">Industrial (IND1)</SelectItem>
                      <SelectItem value="AGR1">Agricultural (AGR1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#243E4D]">Region</label>
                  <Select 
                    value={region} 
                    onValueChange={setRegion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Western">Western</SelectItem>
                      <SelectItem value="Eastern">Eastern</SelectItem>
                      <SelectItem value="Northern">Northern</SelectItem>
                      <SelectItem value="Southern">Southern</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#243E4D]">Start Year</label>
                  <Input 
                    type="number" 
                    value={startYear} 
                    onChange={e => setStartYear(e.target.value)}
                    min="2000"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#243E4D]">End Year</label>
                  <Input 
                    type="number" 
                    value={endYear} 
                    onChange={e => setEndYear(e.target.value)}
                    min="2000"
                    max="2030"
                  />
                </div>
              </div>

              {timeSeriesQuery.isLoading ? (
                renderLoading()
              ) : timeSeriesQuery.isError ? (
                renderError(`Failed to load time series data: ${timeSeriesQuery.error instanceof Error ? timeSeriesQuery.error.message : 'Unknown error'}`)
              ) : (timeSeriesQuery.data?.length || 0) === 0 ? (
                <div className="text-center py-8 text-[#243E4D]/60">
                  No data available for the selected criteria
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesQuery.data}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Base Cost']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Base Cost" 
                        stroke="#29B7D3" 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Comparison Tab */}
        <TabsContent value="regionalComparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#243E4D]">Regional Cost Comparison</CardTitle>
              <CardDescription className="text-[#243E4D]/70">
                Compare construction costs across different regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#243E4D]">Building Type</label>
                  <Select 
                    value={comparisonBuildingType} 
                    onValueChange={setComparisonBuildingType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RES1">Residential (RES1)</SelectItem>
                      <SelectItem value="COM1">Commercial (COM1)</SelectItem>
                      <SelectItem value="IND1">Industrial (IND1)</SelectItem>
                      <SelectItem value="AGR1">Agricultural (AGR1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <Input 
                    type="number" 
                    value={comparisonYear} 
                    onChange={e => setComparisonYear(e.target.value)}
                    min="2000"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Square Footage</label>
                  <Input 
                    type="number" 
                    value={squareFootage} 
                    onChange={e => setSquareFootage(e.target.value)}
                    min="100"
                  />
                </div>
              </div>

              {regionalComparisonQuery.isLoading ? (
                renderLoading()
              ) : regionalComparisonQuery.isError ? (
                renderError(`Failed to load regional comparison data: ${regionalComparisonQuery.error instanceof Error ? regionalComparisonQuery.error.message : 'Unknown error'}`)
              ) : (regionalComparisonData?.length || 0) === 0 ? (
                <div className="text-center py-8 text-[#243E4D]/60">
                  No data available for the selected criteria
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={regionalComparisonData}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Total Cost']} />
                      <Legend />
                      <Bar dataKey="value" name="Total Cost" fill="#3CAB36" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Building Type Comparison Tab */}
        <TabsContent value="buildingTypeComparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#243E4D]">Building Type Cost Comparison</CardTitle>
              <CardDescription className="text-[#243E4D]/70">
                Compare construction costs across different building types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Region</label>
                  <Select 
                    value={comparisonRegion} 
                    onValueChange={setComparisonRegion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Western">Western</SelectItem>
                      <SelectItem value="Eastern">Eastern</SelectItem>
                      <SelectItem value="Northern">Northern</SelectItem>
                      <SelectItem value="Southern">Southern</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <Input 
                    type="number" 
                    value={comparisonYear} 
                    onChange={e => setComparisonYear(e.target.value)}
                    min="2000"
                    max="2030"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Square Footage</label>
                  <Input 
                    type="number" 
                    value={squareFootage} 
                    onChange={e => setSquareFootage(e.target.value)}
                    min="100"
                  />
                </div>
              </div>

              {buildingTypeComparisonQuery.isLoading ? (
                renderLoading()
              ) : buildingTypeComparisonQuery.isError ? (
                renderError(`Failed to load building type comparison data: ${buildingTypeComparisonQuery.error instanceof Error ? buildingTypeComparisonQuery.error.message : 'Unknown error'}`)
              ) : (buildingTypeComparisonData?.length || 0) === 0 ? (
                <div className="text-center py-8 text-[#243E4D]/60">
                  No data available for the selected criteria
                </div>
              ) : (
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={buildingTypeComparisonData}
                      margin={{
                        top: 5, right: 30, left: 20, bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Total Cost']} />
                      <Legend />
                      <Bar dataKey="value" name="Total Cost" fill="#243E4D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cost Breakdown Tab */}
        <TabsContent value="costBreakdown">
          <Card>
            <CardHeader>
              <CardTitle className="text-[#243E4D]">Cost Breakdown Analysis</CardTitle>
              <CardDescription className="text-[#243E4D]/70">
                View detailed cost breakdown for a specific calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Calculation ID</label>
                  <Input 
                    type="number" 
                    value={calculationId} 
                    onChange={e => setCalculationId(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => costBreakdownQuery.refetch()}
                    disabled={!calculationId || costBreakdownQuery.isLoading}
                    className="bg-[#243E4D] hover:bg-[#243E4D]/90"
                  >
                    Load Breakdown
                  </Button>
                </div>
              </div>

              {costBreakdownQuery.isLoading ? (
                renderLoading()
              ) : costBreakdownQuery.isError ? (
                renderError(`${costBreakdownQuery.error instanceof Error ? costBreakdownQuery.error.message : 'Unknown error'}`)
              ) : !costBreakdownQuery.data && !calculationId ? (
                <div className="text-center py-8 text-[#243E4D]/60">
                  Enter a calculation ID to view cost breakdown
                </div>
              ) : !costBreakdownQuery.data ? (
                <div className="text-center py-8 text-[#243E4D]/60">
                  No data available for the selected calculation
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-[#243E4D]">Total Cost: ${costBreakdownQuery.data.totalCost.toLocaleString()}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={costBreakdownPieData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#243E4D"
                            dataKey="value"
                          >
                            {costBreakdownPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="text-md font-medium mb-2 text-[#243E4D]">Cost Breakdown</h4>
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-2 text-[#243E4D]">Category</th>
                            <th className="text-right py-2 text-[#243E4D]">Amount</th>
                            <th className="text-right py-2 text-[#243E4D]">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {costBreakdownQuery.data.categories.map((category, index) => (
                            <tr key={category} className="border-t">
                              <td className="py-2 capitalize">{category}</td>
                              <td className="text-right py-2">${costBreakdownQuery.data.values[index].toLocaleString()}</td>
                              <td className="text-right py-2">{costBreakdownQuery.data.percentages[index]}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataVisualization;