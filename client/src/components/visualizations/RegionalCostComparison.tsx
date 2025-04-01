/**
 * RegionalCostComparison Component
 * 
 * A bar chart visualization that compares building costs across different regions
 * with enhanced micro-interactions using the DataPointExplorer component.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataPointExplorer, DataPoint } from './DataPointExplorer';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
// Import theme hook
import { useTheme } from '@/hooks/use-theme';

interface RegionalCostComparisonProps {
  data: Array<{
    region: string;
    baseCost: number;
    adjustedCost: number;
    buildingType: string;
    costFactors?: {
      quality?: number;
      complexity?: number;
      condition?: number;
      other?: number;
    };
    metadata?: Record<string, any>;
  }>;
  onRegionSelect?: (region: string) => void;
  buildingTypes?: string[];
}

export function RegionalCostComparison({ 
  data, 
  onRegionSelect, 
  buildingTypes = [] 
}: RegionalCostComparisonProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('baseCost');
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>(
    buildingTypes.length > 0 ? buildingTypes[0] : 'All'
  );
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(null);

  // Filter data based on building type selection
  const filteredData = selectedBuildingType === 'All' 
    ? data 
    : data.filter(item => item.buildingType === selectedBuildingType);

  // Prepare data for the chart based on active tab
  const chartData = filteredData.map(item => ({
    region: item.region,
    value: activeTab === 'baseCost' ? item.baseCost : item.adjustedCost,
    buildingType: item.buildingType,
    costFactors: item.costFactors,
    metadata: item.metadata,
  }));

  // Sort data by value (cost) in descending order for better visualization
  chartData.sort((a, b) => b.value - a.value);

  // Generate colors for the bars with a slight gradient effect
  const getBarColor = (index: number) => {
    const baseColor = theme.primary || '#2563eb';
    const opacity = 1 - (index * 0.1); // Decrease opacity for each subsequent bar
    return `${baseColor}${Math.max(Math.floor(opacity * 255), 50).toString(16).padStart(2, '0')}`;
  };

  // Convert chart data to DataPoint format for the explorer
  const createDataPoint = (item: any, index: number): DataPoint => ({
    id: `${item.region}-${index}`,
    label: item.region,
    value: item.value,
    category: item.buildingType,
    description: `Building costs in the ${item.region} region for ${item.buildingType} type buildings.`,
    metadata: {
      ...item.metadata,
      ...(item.costFactors ? {
        qualityFactor: item.costFactors.quality,
        complexityFactor: item.costFactors.complexity,
        conditionFactor: item.costFactors.condition,
      } : {})
    },
    color: getBarColor(index),
    trend: determineTrend(item.value, chartData),
  });

  // Handle exploring a data point (region) in detail
  const handleExplore = (dataPoint: DataPoint) => {
    setSelectedDataPoint(dataPoint);
    const region = dataPoint.label;
    onRegionSelect?.(region);
  };

  // Custom tooltip component for the chart using DataPointExplorer
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) {
      return null;
    }

    const data = payload[0].payload;
    const dataPoint = createDataPoint(data, chartData.findIndex(d => d.region === data.region));

    return (
      <Card className="p-0 shadow-md border border-gray-200 bg-white">
        <CardContent className="pt-4 px-4 pb-3">
          <div className="font-medium text-sm">{dataPoint.label}</div>
          <div className="font-semibold text-lg">${dataPoint.value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{dataPoint.category} type</div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Regional Cost Comparison</CardTitle>
            <CardDescription>
              {activeTab === 'baseCost' 
                ? 'Base construction costs by region' 
                : 'Adjusted construction costs including factors'
              }
            </CardDescription>
          </div>
          
          {buildingTypes.length > 0 && (
            <Select
              value={selectedBuildingType}
              onValueChange={setSelectedBuildingType}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Building Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {buildingTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
        <TabsList className="mb-4">
          <TabsTrigger value="baseCost">Base Cost</TabsTrigger>
          <TabsTrigger value="adjustedCost">Adjusted Cost</TabsTrigger>
        </TabsList>
        
        <TabsContent value="baseCost" className="pt-0 px-0">
          <CardContent className="p-0 pb-6 pl-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="region" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70}
                  tickMargin={20}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Legend />
                <Bar dataKey="value" name="Base Cost">
                  {chartData.map((entry, index) => {
                    const dataPoint = createDataPoint(entry, index);
                    return (
                      <Cell key={`cell-${index}`}>
                        <DataPointExplorer
                          dataPoint={dataPoint}
                          onExplore={handleExplore}
                          highlightRelated={selectedDataPoint?.id === dataPoint.id}
                        >
                          <rect
                            key={`rect-${index}`}
                            x={0}
                            y={0}
                            width="100%"
                            height="100%"
                            fill={getBarColor(index)}
                            rx={4}
                            ry={4}
                          />
                        </DataPointExplorer>
                      </Cell>
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="adjustedCost" className="pt-0 px-0">
          <CardContent className="p-0 pb-6 pl-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="region" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  tickMargin={20}
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
                <Legend />
                <Bar dataKey="value" name="Adjusted Cost">
                  {chartData.map((entry, index) => {
                    const dataPoint = createDataPoint(entry, index);
                    return (
                      <Cell key={`cell-${index}`}>
                        <DataPointExplorer
                          dataPoint={dataPoint}
                          onExplore={handleExplore}
                          highlightRelated={selectedDataPoint?.id === dataPoint.id}
                        >
                          <rect
                            key={`rect-${index}`}
                            x={0}
                            y={0}
                            width="100%"
                            height="100%"
                            fill={getBarColor(index)}
                            rx={4}
                            ry={4}
                          />
                        </DataPointExplorer>
                      </Cell>
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

// Helper function to determine trend based on comparison with average
function determineTrend(value: number, data: any[]): 'up' | 'down' | 'neutral' {
  if (data.length <= 1) return 'neutral';
  
  const average = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  
  if (value > average * 1.1) {
    return 'up';
  } else if (value < average * 0.9) {
    return 'down';
  }
  
  return 'neutral';
}