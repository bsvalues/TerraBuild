import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HeatmapVisualizationProps, RegionalCostData } from '@/lib/visualizationTypes';
import { formatCurrency, calculateColor } from '@/lib/visualizationUtils';
import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Regional Cost Heatmap Visualization Component
 * 
 * Displays a color-coded heatmap of building costs by county within a region
 */
export function RegionalCostHeatmap({
  data,
  region,
  buildingType,
  isLoading = false,
  onCountySelect
}: HeatmapVisualizationProps) {
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Calculate min and max costs for color range
  const { minCost, maxCost, sortedData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { minCost: null, maxCost: null, sortedData: [] };
    }
    
    // Get valid cost values
    const validCosts = data
      .filter(county => county.avgCost !== null && county.avgCost !== undefined)
      .map(county => county.avgCost as number);
    
    // Sort data based on current order
    const sorted = [...data].sort((a, b) => {
      const aVal = a.avgCost || 0;
      const bVal = b.avgCost || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
    
    return {
      minCost: validCosts.length > 0 ? Math.min(...validCosts) : null,
      maxCost: validCosts.length > 0 ? Math.max(...validCosts) : null,
      sortedData: sorted
    };
  }, [data, sortOrder]);
  
  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Handle county selection
  const handleCountyClick = (county: RegionalCostData) => {
    setSelectedCounty(county.name);
    if (onCountySelect) {
      onCountySelect(county.name);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-3/4" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-1/2" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {Array(10).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Regional Cost Analysis</CardTitle>
          <CardDescription>
            Building costs across counties in {region}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No cost data available for {buildingType} buildings in {region}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Regional Cost Analysis</CardTitle>
            <CardDescription>
              Building costs across counties in {region}
            </CardDescription>
          </div>
          <button 
            onClick={toggleSortOrder}
            className="flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            Sort by cost {sortOrder === 'asc' ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {sortedData.map((county, index) => (
            <div
              key={county.name || index}
              data-testid={`county-cell-${county.name}`}
              className={`p-4 rounded-md cursor-pointer transition-all hover:scale-105 ${
                selectedCounty === county.name ? 'ring-2 ring-primary' : ''
              }`}
              style={{
                backgroundColor: calculateColor(county.avgCost, minCost, maxCost),
                color: county.avgCost && county.avgCost > (maxCost || 0) * 0.7 ? 'white' : 'black'
              }}
              onClick={() => handleCountyClick(county)}
            >
              <div className="font-medium">{county.name || 'Unknown'}</div>
              <div className="text-sm mt-1">{formatCurrency(county.avgCost)}</div>
              <div className="text-xs mt-1">
                {county.count ? `${county.count} data points` : 'No data'}
              </div>
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex items-center">
          <div className="text-sm mr-2">Cost Range:</div>
          <div className="flex h-2 flex-1 rounded-md overflow-hidden">
            <div className="h-full w-1/3" style={{ background: 'linear-gradient(to right, #0000ff, #00ff00)' }}></div>
            <div className="h-full w-1/3" style={{ background: 'linear-gradient(to right, #00ff00, #ffff00)' }}></div>
            <div className="h-full w-1/3" style={{ background: 'linear-gradient(to right, #ffff00, #ff0000)' }}></div>
          </div>
          <div className="flex justify-between w-full text-xs mt-1">
            <span>{formatCurrency(minCost)}</span>
            <span>{formatCurrency(maxCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}