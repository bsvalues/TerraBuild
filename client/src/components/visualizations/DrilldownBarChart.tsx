import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { processDataForDrilldown } from '@/lib/visualization-utils';
import { AlertCircle, ArrowLeft, BarChart2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface DrilldownNode {
  name: string;
  value?: number;
  children?: DrilldownNode[];
}

interface DrilldownChartProps {
  title?: string;
  description?: string;
  initialData?: DrilldownNode;
}

/**
 * Drilldown Bar Chart Component
 * Displays a bar chart with drill-down capability for hierarchical data
 */
const DrilldownBarChart: React.FC<DrilldownChartProps> = ({
  title = 'Cost Breakdown',
  description = 'Explore costs by drilling down into categories',
  initialData
}) => {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('Washington');
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>('RESIDENTIAL');
  
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
  
  // Fetch hierarchical cost data
  const { data: hierarchicalData, isLoading, error } = useQuery({
    queryKey: ['/api/benchmarking/hierarchical-costs', selectedRegion, selectedBuildingType],
    queryFn: async () => {
      const response = await fetch('/api/benchmarking/hierarchical-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: selectedRegion, buildingType: selectedBuildingType })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch hierarchical cost data');
      }
      
      return response.json();
    },
    enabled: !!selectedRegion && !!selectedBuildingType,
    retry: 1
  });
  
  // Helper for building type label
  const getBuildingTypeLabel = (type: string) => {
    const found = buildingTypes.find(bt => bt.value === type);
    return found ? found.label : type;
  };
  
  // Process data for chart when hierarchical data or drill path changes
  useEffect(() => {
    if (hierarchicalData?.data) {
      const processedData = processDataForDrilldown(hierarchicalData.data, drillPath);
      setChartData(processedData);
    } else if (initialData) {
      const processedData = processDataForDrilldown(initialData, drillPath);
      setChartData(processedData);
    } else {
      setChartData(null);
    }
  }, [hierarchicalData, initialData, drillPath]);
  
  // Handle bar click for drill-down
  const handleBarClick = (data: any) => {
    if (data && data.name) {
      setDrillPath([...drillPath, data.name]);
    }
  };
  
  // Handle breadcrumb click for navigation
  const handleBreadcrumbClick = (index: number) => {
    if (index < 0) {
      // Go to root level
      setDrillPath([]);
    } else {
      // Go to specific level
      setDrillPath(drillPath.slice(0, index));
    }
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
              Failed to load cost data. Please try again.
            </AlertDescription>
          </Alert>
        ) : chartData && chartData.items && chartData.items.length > 0 ? (
          <div data-testid="drilldown-chart">
            {/* Breadcrumb navigation */}
            <div className="flex items-center mb-4 text-sm" data-testid="drilldown-breadcrumb">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto font-medium hover:bg-transparent hover:underline"
                onClick={() => handleBreadcrumbClick(-1)}
              >
                All
              </Button>
              
              {chartData.breadcrumbs?.map((crumb: string, index: number) => (
                <React.Fragment key={crumb}>
                  <span className="mx-2 text-muted-foreground">/</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto font-medium hover:bg-transparent hover:underline"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    {crumb}
                  </Button>
                </React.Fragment>
              ))}
              
              {chartData.current?.name && (
                <>
                  <span className="mx-2 text-muted-foreground">/</span>
                  <span className="font-medium">{chartData.current.name}</span>
                </>
              )}
            </div>
            
            {drillPath.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mb-4 flex items-center"
                onClick={() => handleBreadcrumbClick(drillPath.length - 1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to {chartData.breadcrumbs?.[chartData.breadcrumbs.length - 1] || 'All'}
              </Button>
            )}
            
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">
                {chartData.current?.name || `${getBuildingTypeLabel(selectedBuildingType)} Costs in ${selectedRegion}`}
              </h3>
              <p className="text-sm text-muted-foreground">
                Click on bars to drill down
              </p>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.items.map((item: any) => ({
                    name: item.name,
                    value: item.value || 0
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    label={{ value: 'Cost ($/sqft)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Average Cost"
                    fill="#2196f3"
                    onClick={handleBarClick}
                    cursor="pointer"
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Drill-down details */}
            {drillPath.length > 0 && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50" data-testid="drilldown-detail">
                <h4 className="text-md font-medium mb-2">Details for {chartData.current?.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Average Cost</div>
                    <div className="text-2xl font-bold text-blue-600">
                      ${chartData.current?.value?.toFixed(2) || '0.00'}/sqft
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Breakdown Items</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {chartData.items.length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              No breakdown data available for the selected criteria.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DrilldownBarChart;