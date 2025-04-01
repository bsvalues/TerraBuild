import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LabelList
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
import { AlertCircle, MapPin, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RegionalCostComparisonProps {
  title?: string;
  description?: string;
  className?: string;
  showControls?: boolean;
}

interface RegionalCostData {
  region: string;
  buildingType: string;
  baseCost: number;
  buildingTypeDescription: string;
  matrixYear: number;
}

const COLORS = [
  '#1f77b4', '#2ca02c', '#ff7f0e', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

export function RegionalCostComparison({ 
  title = "Regional Cost Comparison", 
  description = "Compare building costs across different regions",
  className,
  showControls = true
}: RegionalCostComparisonProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'horizontal' | 'vertical'>('horizontal');

  // Fetch all cost matrix data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Get available years
  const getAvailableYears = (data: any[]): number[] => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item.matrixYear))].sort((a, b) => b - a); // Most recent first
  };

  // Get available building types
  const getAvailableBuildingTypes = (data: any[]): { value: string, label: string }[] => {
    if (!data || !Array.isArray(data)) return [];
    
    const uniqueTypes = new Map();
    data.forEach(item => {
      if (!uniqueTypes.has(item.buildingType)) {
        uniqueTypes.set(item.buildingType, item.buildingTypeDescription || item.buildingType);
      }
    });
    
    return Array.from(uniqueTypes.entries()).map(([value, label]) => ({ value, label }));
  };

  // Process data for chart
  const processChartData = () => {
    if (!data || !Array.isArray(data)) return [];
    
    // If no year selected, use most recent year
    const yearToUse = selectedYear || Math.max(...getAvailableYears(data));
    
    let filteredData = data.filter(item => item.matrixYear === yearToUse);
    
    if (selectedBuildingType) {
      filteredData = filteredData.filter(item => item.buildingType === selectedBuildingType);
    } else if (filteredData.length > 0) {
      // If no building type selected, get the most common one
      const typeCounts = filteredData.reduce((acc, item) => {
        acc[item.buildingType] = (acc[item.buildingType] || 0) + 1;
        return acc;
      }, {});
      
      const mostCommonType = Object.keys(typeCounts).reduce((a, b) => 
        typeCounts[a] > typeCounts[b] ? a : b
      );
      
      filteredData = filteredData.filter(item => item.buildingType === mostCommonType);
    }
    
    // Group by region and calculate average if needed
    const regionData = filteredData.reduce((acc, item) => {
      const region = item.region;
      if (!acc[region]) {
        acc[region] = {
          region,
          costValue: 0,
          count: 0,
          buildingTypes: []
        };
      }
      
      acc[region].costValue += parseFloat(item.baseCost);
      acc[region].count += 1;
      acc[region].buildingTypes.push(item.buildingType);
      
      return acc;
    }, {});
    
    // Convert to array and calculate average cost
    return Object.values(regionData).map((item: any) => {
      return {
        region: item.region,
        cost: (item.costValue / item.count).toFixed(2),
        buildingTypes: [...new Set(item.buildingTypes)]
      };
    }).sort((a, b) => parseFloat(b.cost) - parseFloat(a.cost)); // Sort by cost descending
  };

  const chartData = processChartData();
  const availableYears = getAvailableYears(data);
  const availableBuildingTypes = getAvailableBuildingTypes(data);
  
  // Get selected building type description
  const getSelectedBuildingTypeDescription = (): string => {
    if (!selectedBuildingType || !availableBuildingTypes.length) return 'All Types';
    
    const selectedType = availableBuildingTypes.find(t => t.value === selectedBuildingType);
    return selectedType ? selectedType.label : selectedBuildingType;
  };

  // Calculate regional cost range
  const getRegionalCostRange = () => {
    if (!chartData.length) return { min: 0, max: 0, average: 0, range: 0 };
    
    const costs = chartData.map(item => parseFloat(item.cost));
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    const sum = costs.reduce((acc, cost) => acc + cost, 0);
    const average = sum / costs.length;
    
    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      average: average.toFixed(2),
      range: (max - min).toFixed(2)
    };
  };

  const costRange = getRegionalCostRange();
  
  // Calculate region with highest and lowest costs
  const getHighestLowestRegions = () => {
    if (!chartData.length) return { highest: null, lowest: null };
    
    return {
      highest: chartData[0],
      lowest: chartData[chartData.length - 1]
    };
  };

  const { highest, lowest } = getHighestLowestRegions();

  // Format tooltip
  const formatTooltip = (value, name, props) => {
    return [`$${value}/sq.ft`, 'Base Cost'];
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
              Failed to load regional cost comparison data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Rendering empty state
  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">No data available for the selected criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          
          {showControls && (
            <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
              <Select
                value={selectedYear?.toString() || (availableYears[0]?.toString() || '')}
                onValueChange={(value) => setSelectedYear(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={selectedBuildingType || "all"}
                onValueChange={(value) => setSelectedBuildingType(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Building Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Building Types</SelectItem>
                  {availableBuildingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select
                value={chartType}
                onValueChange={(value: 'horizontal' | 'vertical') => setChartType(value)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chart Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                  <SelectItem value="vertical">Vertical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building className="h-3 w-3" />
            {getSelectedBuildingTypeDescription()}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            Year: {selectedYear || availableYears[0]}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50">
            Range: ${costRange.range}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'horizontal' ? (
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} horizontal={true} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  tickCount={5}
                  domain={['dataMin - 10', 'dataMax + 10']}
                />
                <YAxis 
                  dataKey="region" 
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="cost" name="Base Cost per Sq.Ft">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                  <LabelList 
                    dataKey="cost" 
                    position="right"
                    formatter={(value) => `$${value}`}
                  />
                </Bar>
              </BarChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                <XAxis 
                  dataKey="region" 
                  tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
                  height={70}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  label={{ 
                    value: 'Base Cost per Sq.Ft ($)', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                />
                <Tooltip formatter={formatTooltip} />
                <Legend />
                <Bar dataKey="cost" name="Base Cost per Sq.Ft">
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                  <LabelList 
                    dataKey="cost" 
                    position="top"
                    formatter={(value) => `$${value}`}
                  />
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {highest && lowest && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 bg-green-50 p-3 rounded-md">
              <MapPin className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Lowest Cost Region</p>
                <p><span className="font-semibold">{lowest.region}</span> at <span className="font-semibold text-green-600">${lowest.cost}/sq.ft</span></p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-red-50 p-3 rounded-md">
              <MapPin className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium">Highest Cost Region</p>
                <p><span className="font-semibold">{highest.region}</span> at <span className="font-semibold text-red-600">${highest.cost}/sq.ft</span></p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}