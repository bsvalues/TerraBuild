import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createHeatmapData } from '@/lib/visualization-utils';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface County {
  name: string;
  avgCost: number;
  buildingTypes?: Array<{ type: string, avgCost: number, count: number }>;
}

interface HeatmapData {
  region: string;
  data: Array<{ id: string, value: number }>;
  minValue: number;
  maxValue: number;
  colorScale: string[];
}

/**
 * Regional Heatmap Component
 * Displays a heatmap visualization of building costs across counties in a region
 */
const RegionalHeatmap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('Washington');
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>('RESIDENTIAL');
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null);
  
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
  
  // Fetch county data for the selected region
  const { data: countiesData, isLoading, error } = useQuery({
    queryKey: ['/api/benchmarking/regional-costs', selectedRegion, selectedBuildingType],
    queryFn: async () => {
      const response = await fetch('/api/benchmarking/regional-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: selectedRegion, buildingType: selectedBuildingType })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch regional cost data');
      }
      
      return response.json();
    },
    enabled: !!selectedRegion && !!selectedBuildingType,
    retry: 1
  });
  
  // Process data for heatmap when counties data changes
  useEffect(() => {
    if (countiesData?.counties && Array.isArray(countiesData.counties)) {
      const processedData = createHeatmapData(
        selectedRegion,
        countiesData.counties.map((county: County) => ({
          name: county.name,
          avgCost: county.avgCost
        }))
      );
      setHeatmapData(processedData);
    } else {
      setHeatmapData(null);
    }
  }, [countiesData, selectedRegion]);
  
  // Helper for building type label
  const getBuildingTypeLabel = (type: string) => {
    const found = buildingTypes.find(bt => bt.value === type);
    return found ? found.label : type;
  };
  
  // Generate a color for a cell based on its value
  const getCellColor = (value: number) => {
    if (!heatmapData) return '#e3f2fd'; // Default light blue
    
    const { minValue, maxValue, colorScale } = heatmapData;
    const range = maxValue - minValue;
    if (range === 0) return colorScale[0]; // All values are the same
    
    // Calculate position in the color scale (0 to colorScale.length-1)
    const position = ((value - minValue) / range) * (colorScale.length - 1);
    const index = Math.min(Math.floor(position), colorScale.length - 1);
    
    return colorScale[index];
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Regional Cost Density</CardTitle>
        <CardDescription>
          Building cost heatmap visualization across counties
        </CardDescription>
        
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
              Failed to load regional cost data. Please try again.
            </AlertDescription>
          </Alert>
        ) : heatmapData && heatmapData.data.length > 0 ? (
          <div className="p-4" data-testid="cost-heatmap">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium">
                {getBuildingTypeLabel(selectedBuildingType)} Building Costs in {selectedRegion}
              </h3>
              <p className="text-sm text-muted-foreground">
                Average cost per square foot ($/sqft)
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {heatmapData.data.map(county => (
                <div
                  key={county.id}
                  className="heatmap-cell relative p-4 rounded-md transition-all hover:scale-105"
                  style={{ backgroundColor: getCellColor(county.value) }}
                  onMouseOver={(e) => {
                    // Show tooltip with detailed information
                    const tooltip = document.getElementById(`tooltip-${county.id}`);
                    if (tooltip) tooltip.classList.remove('hidden');
                  }}
                  onMouseOut={(e) => {
                    // Hide tooltip
                    const tooltip = document.getElementById(`tooltip-${county.id}`);
                    if (tooltip) tooltip.classList.add('hidden');
                  }}
                >
                  <div className="text-center">
                    <div className="font-medium truncate">{county.id}</div>
                    <div className="text-sm font-bold">${county.value.toFixed(2)}</div>
                  </div>
                  
                  {/* Tooltip */}
                  <div
                    id={`tooltip-${county.id}`}
                    data-testid="heatmap-tooltip"
                    className="absolute z-10 hidden bg-white shadow-lg rounded-md p-3 text-sm -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full w-48"
                  >
                    <div className="font-bold">{county.id} County</div>
                    <div className="mt-1">Average Cost: <span className="font-medium">${county.value.toFixed(2)}/sqft</span></div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {county.value > heatmapData.minValue + ((heatmapData.maxValue - heatmapData.minValue) * 0.75)
                        ? 'High cost area'
                        : county.value < heatmapData.minValue + ((heatmapData.maxValue - heatmapData.minValue) * 0.25)
                          ? 'Low cost area'
                          : 'Average cost area'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="mt-8">
              <div className="text-sm font-medium mb-2">Cost Range ($/sqft)</div>
              <div className="flex h-6">
                {heatmapData.colorScale.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs mt-1">
                <div>${heatmapData.minValue.toFixed(2)}</div>
                <div>${(heatmapData.minValue + (heatmapData.maxValue - heatmapData.minValue) / 2).toFixed(2)}</div>
                <div>${heatmapData.maxValue.toFixed(2)}</div>
              </div>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              No cost data available for the selected region and building type.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default RegionalHeatmap;