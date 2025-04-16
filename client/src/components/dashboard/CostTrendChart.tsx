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
  CardFooter,
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
import { AlertCircle } from "lucide-react";

interface CostTrendChartProps {
  title?: string;
  description?: string;
  className?: string;
  showControls?: boolean;
}

interface CostDataPoint {
  year: number;
  region: string;
  buildingType: string;
  baseCost: number;
}

interface ProcessedDataPoint {
  year: number;
  [key: string]: number | string;
}

export function CostTrendChart({ 
  title = "Building Cost Trends", 
  description = "Historical cost trends by region and building type",
  className,
  showControls = true
}: CostTrendChartProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);

  // Fetch time series data from the analytics endpoint
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/time-series', { 
      buildingType: selectedBuildingType || 'residential',
      region: selectedRegion || 'BC-CENTRAL',
      startYear: 2020,
      endYear: 2025
    }],
  });

  // Process data for the chart
  const processData = (rawData: any): ProcessedDataPoint[] => {
    if (!rawData || !rawData.series || !Array.isArray(rawData.series)) return [];

    // The data from analytics endpoint is already properly formatted
    // We just need to transform it for recharts
    return rawData.series.map((item: any) => {
      const dataPoint: ProcessedDataPoint = {
        year: item.year
      };
      
      // Add each region/building type combination as a separate key
      if (item.costByRegionAndType) {
        Object.entries(item.costByRegionAndType).forEach(([key, value]) => {
          dataPoint[key] = parseFloat(value as string);
        });
      }
      
      return dataPoint;
    }).sort((a, b) => a.year - b.year);
  };

  // Get unique regions and building types for filters
  const getUniqueRegions = (data: any[]): string[] => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item.region))];
  };

  const getUniqueBuildingTypes = (data: any[]): string[] => {
    if (!data || !Array.isArray(data)) return [];
    return [...new Set(data.map(item => item.buildingType))];
  };

  // Filter data based on selections
  const filterData = (data: any[]): any[] => {
    if (!data || !Array.isArray(data)) return [];
    
    let filtered = [...data];
    
    if (selectedRegion) {
      filtered = filtered.filter(item => item.region === selectedRegion);
    }
    
    if (selectedBuildingType) {
      filtered = filtered.filter(item => item.buildingType === selectedBuildingType);
    }
    
    return filtered;
  };

  // Apply filters and process data
  const filteredData = data ? filterData(data) : [];
  const processedData = processData(filteredData);
  
  // Get unique keys for chart lines (after region/buildingType filtering)
  const getLineKeys = (): string[] => {
    if (processedData.length === 0) return [];
    
    // Get all keys except 'year'
    const allKeys = Object.keys(processedData[0]).filter(key => key !== 'year');
    
    // If we have both region and building type filters, return all keys
    if (selectedRegion && selectedBuildingType) return allKeys;
    
    // Otherwise, limit to 5 lines for readability
    return allKeys.slice(0, 5);
  };

  // Generate colors for each line
  const colors = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", 
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"
  ];

  // Calculate year-over-year percent change for the most recent years
  const calculateYoYChange = (): { value: number, label: string } | null => {
    if (!processedData || processedData.length < 2) return null;
    
    // Sort by year descending
    const sortedData = [...processedData].sort((a, b) => b.year - a.year);
    
    if (sortedData.length < 2) return null;
    
    const currentYear = sortedData[0];
    const previousYear = sortedData[1];
    
    // If we have both filters active, we can calculate exact change
    if (selectedRegion && selectedBuildingType) {
      const key = `${selectedRegion}_${selectedBuildingType}`;
      const current = currentYear[key] as number;
      const previous = previousYear[key] as number;
      
      if (!current || !previous) return null;
      
      const change = ((current - previous) / previous) * 100;
      return {
        value: change,
        label: `${change > 0 ? '+' : ''}${change.toFixed(1)}% from ${previousYear.year} to ${currentYear.year}`
      };
    }
    
    // Otherwise, calculate average change
    return null;
  };

  const yoyChange = calculateYoYChange();

  // Render loading skeleton
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

  // Render error state
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
              Failed to load cost trend data. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!processedData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground">No data available for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  // Main render
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
                value={selectedRegion || "all"}
                onValueChange={(value) => setSelectedRegion(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {getUniqueRegions(data).map((region) => (
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
                  {getUniqueBuildingTypes(data).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={processedData}
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
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => {
                  // Convert "region_buildingType" to a more readable format
                  const parts = value.split('_');
                  return `${parts[0]} - ${parts[1]}`;
                }}
              />
              
              {getLineKeys().map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={{ strokeWidth: 2 }}
                  name={key.replace('_', ' - ')}
                />
              ))}
              
              {/* Show trend line if we have enough data points */}
              {processedData.length > 1 && getLineKeys().length === 1 && (
                <ReferenceLine
                  stroke="#888"
                  strokeDasharray="3 3"
                  label="Trend"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      
      {yoyChange && (
        <CardFooter>
          <div className={`text-sm font-medium ${yoyChange.value > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {yoyChange.label}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}