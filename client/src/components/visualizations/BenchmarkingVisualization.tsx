import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface BenchmarkingVisualizationProps {
  buildingType?: string;
  region?: string;
  year?: number;
  squareFootage?: number;
  calculationId?: number;
}

const BenchmarkingVisualization: React.FC<BenchmarkingVisualizationProps> = ({
  buildingType,
  region,
  year,
  squareFootage,
  calculationId
}) => {
  const [activeTab, setActiveTab] = useState('costPerSqft');
  
  // Format query parameters
  const queryParams = new URLSearchParams();
  if (buildingType) queryParams.append('buildingType', buildingType);
  if (region) queryParams.append('region', region);
  if (year) queryParams.append('year', year.toString());
  if (squareFootage) queryParams.append('squareFootage', squareFootage.toString());
  
  // Determine the API endpoint
  const endpoint = calculationId 
    ? `/api/analytics/benchmark/${calculationId}` 
    : `/api/analytics/benchmark?${queryParams.toString()}`;
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['benchmarkData', calculationId || buildingType, region, year, squareFootage],
    queryFn: () => apiRequest(endpoint),
    enabled: !!(calculationId || (buildingType && region && squareFootage))
  });
  
  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-3/4" /></CardTitle>
          {/* Fix for DOM nesting error - remove Skeleton from inside CardDescription (p tag) */}
          <div className="text-sm text-muted-foreground mt-1">
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !data) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>Benchmarking Error</CardTitle>
          <CardDescription>Unable to load benchmarking data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No benchmark data available. Please check your parameters and try again.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Check if we have any data to display
  if (!data.statistics.regional && !data.statistics.statewide) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle>No Benchmark Data</CardTitle>
          <CardDescription>
            No comparable data available for {data.buildingType} in {data.region}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {data.message || "Try different parameters to view benchmarking data."}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format chart data for cost per square foot
  const costPerSqftChartData = [
    {
      name: "Your Building",
      regional: data.costPerSqftBenchmarks.regional.percentile,
      statewide: data.costPerSqftBenchmarks.statewide.percentile,
      costPerSqft: data.costPerSqft
    }
  ];
  
  // Format chart data for total cost
  const totalCostChartData = [
    {
      name: "Your Building",
      regional: data.totalCostBenchmarks.regional.percentile,
      statewide: data.totalCostBenchmarks.statewide.percentile,
      totalCost: data.totalCost
    }
  ];
  
  // Format progress values (0-100)
  const regionalPercentile = data.costPerSqftBenchmarks.regional.percentile;
  const statewidePercentile = data.costPerSqftBenchmarks.statewide.percentile;
  
  // Helper function to get color based on percentile
  const getPercentileColor = (percentile: number) => {
    if (percentile < 25) return 'bg-green-500';
    if (percentile < 50) return 'bg-blue-500';
    if (percentile < 75) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Building Cost Benchmarking</CardTitle>
        <CardDescription>
          Compare your {data.buildingTypeDescription || data.buildingType} building 
          against others in {data.regionDescription || data.region} and statewide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="costPerSqft" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="costPerSqft">Cost Per Square Foot</TabsTrigger>
            <TabsTrigger value="totalCost">Total Cost</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="costPerSqft">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Regional Comparison</div>
                  <div className="text-sm text-muted-foreground">
                    {regionalPercentile}% percentile
                  </div>
                </div>
                <Progress 
                  value={regionalPercentile} 
                  className={`h-3 ${getPercentileColor(regionalPercentile)}`} 
                />
                <div className="text-sm mt-1">
                  {data.costPerSqftBenchmarks.regional.description}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Statewide Comparison</div>
                  <div className="text-sm text-muted-foreground">
                    {statewidePercentile}% percentile
                  </div>
                </div>
                <Progress 
                  value={statewidePercentile} 
                  className={`h-3 ${getPercentileColor(statewidePercentile)}`} 
                />
                <div className="text-sm mt-1">
                  {data.costPerSqftBenchmarks.statewide.description}
                </div>
              </div>
              
              <div className="border p-4 rounded-md">
                <div className="text-sm font-medium mb-2">Your Cost Per Square Foot</div>
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(data.costPerSqft)} / sq.ft
                </div>
                <div className="text-sm text-muted-foreground">
                  Based on {data.squareFootage.toLocaleString()} sq.ft {data.buildingType} building
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={costPerSqftChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Percentile', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Cost ($/sq.ft)', angle: 90, position: 'insideRight' }} />
                  <Tooltip formatter={(value, name) => {
                    if (name === 'costPerSqft') return [formatCurrency(value as number), 'Cost Per Sq.Ft'];
                    return [`${value}%`, name === 'regional' ? 'Regional Percentile' : 'Statewide Percentile'];
                  }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="regional" fill="#8884d8" name="Regional Percentile" />
                  <Bar yAxisId="left" dataKey="statewide" fill="#82ca9d" name="Statewide Percentile" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="totalCost">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Regional Total Cost</div>
                  <div className="text-sm text-muted-foreground">
                    {data.totalCostBenchmarks.regional.percentile}% percentile
                  </div>
                </div>
                <Progress 
                  value={data.totalCostBenchmarks.regional.percentile} 
                  className={`h-3 ${getPercentileColor(data.totalCostBenchmarks.regional.percentile)}`} 
                />
                <div className="text-sm mt-1">
                  {data.totalCostBenchmarks.regional.description}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="text-sm font-medium">Statewide Total Cost</div>
                  <div className="text-sm text-muted-foreground">
                    {data.totalCostBenchmarks.statewide.percentile}% percentile
                  </div>
                </div>
                <Progress 
                  value={data.totalCostBenchmarks.statewide.percentile} 
                  className={`h-3 ${getPercentileColor(data.totalCostBenchmarks.statewide.percentile)}`} 
                />
                <div className="text-sm mt-1">
                  {data.totalCostBenchmarks.statewide.description}
                </div>
              </div>
              
              <div className="border p-4 rounded-md">
                <div className="text-sm font-medium mb-2">Your Total Building Cost</div>
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(data.totalCost)}
                </div>
                <div className="text-sm text-muted-foreground">
                  For a {data.squareFootage.toLocaleString()} sq.ft {data.buildingType} building
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Regional Statistics</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Minimum Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.regional.min)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Maximum Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.regional.max)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Average Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.regional.average)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Median Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.regional.median)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Sample Size</td>
                      <td className="text-right">{data.statistics.regionalSampleSize} buildings</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="border p-4 rounded-md">
                <h3 className="font-medium mb-2">Statewide Statistics</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Minimum Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.statewide.min)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Maximum Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.statewide.max)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Average Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.statewide.average)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Median Cost/Sq.Ft</td>
                      <td className="text-right">{formatCurrency(data.statistics.statewide.median)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Sample Size</td>
                      <td className="text-right">{data.statistics.statewideSampleSize} buildings</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="border p-4 rounded-md md:col-span-2">
                <h3 className="font-medium mb-2">Your Building Details</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Building Type</td>
                      <td className="text-right">{data.buildingTypeDescription || data.buildingType}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Region</td>
                      <td className="text-right">{data.regionDescription || data.region}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Square Footage</td>
                      <td className="text-right">{data.squareFootage.toLocaleString()} sq.ft</td>
                    </tr>
                    <tr>
                      <td className="py-1">Cost Per Square Foot</td>
                      <td className="text-right">{formatCurrency(data.costPerSqft)}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Total Cost</td>
                      <td className="text-right">{formatCurrency(data.totalCost)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BenchmarkingVisualization;