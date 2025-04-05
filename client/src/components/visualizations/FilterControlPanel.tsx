/**
 * FilterControlPanel Component
 * 
 * A component that displays and manages active filters for visualizations,
 * allowing users to view, modify, and clear filters in a centralized interface.
 */
import { ReactNode } from 'react';

import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { 
  Filter,
  X,
  ChevronsUpDown,
  Sliders,
  Calendar,
  MapPin,
  Building,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Slider
} from '@/components/ui/slider';
import { useVisualizationContext } from '@/contexts/visualization-context';
import { useQuery } from '@tanstack/react-query';

interface FilterControlPanelProps {
  compact?: boolean;
  allowedFilters?: ('regions' | 'buildingTypes' | 'costRange' | 'counties')[];
  showClearButton?: boolean;
  className?: string;
}

export function FilterControlPanel({
  compact = false,
  allowedFilters = ['regions', 'buildingTypes', 'costRange', 'counties'],
  showClearButton = true,
  className = '',
}: FilterControlPanelProps) {
  const [isOpen, setIsOpen] = useState(!compact);
  const [costRangeValue, setCostRangeValue] = useState<[number, number]>([0, 1000000]);
  const [maxCostValue, setMaxCostValue] = useState(1000000);
  
  const {
    filters,
    removeRegionFilter,
    removeBuildingTypeFilter,
    removeCountyFilter,
    setCostRange,
    clearAllFilters,
    clearRegionFilters,
    clearBuildingTypeFilters,
    clearCountyFilters,
    clearCostRange,
  } = useVisualizationContext();
  
  // Fetch building cost data for max cost value calculation
  const { data: costMatrixData } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });
  
  // Update max cost value based on data
  useEffect(() => {
    if (costMatrixData && Array.isArray(costMatrixData) && costMatrixData.length > 0) {
      // Find the maximum base cost in the data and add a buffer
      const maxCost = Math.max(
        ...costMatrixData.map((item: any) => 
          (item.baseCost || 0) * (1 + 
            (item.complexityFactorBase || 0) + 
            (item.qualityFactorBase || 0) + 
            (item.conditionFactorBase || 0)
          )
        )
      );
      
      // Round up to nearest 100,000 for nicer slider values
      const roundedMax = Math.ceil(maxCost / 100000) * 100000;
      setMaxCostValue(roundedMax);
      
      // Also update the slider value if it's still at the default
      if (costRangeValue[1] === 1000000) {
        setCostRangeValue([0, roundedMax]);
      }
    }
  }, [costMatrixData]);
  
  // Apply cost range when slider changes
  const handleCostRangeChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setCostRangeValue(range);
    if (setCostRange) {
      setCostRange(range);
    }
  };
  
  // Format the cost value for display
  const formatCost = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value}`;
    }
  };
  
  // Count active filters
  const activeFilterCount = (
    ((filters?.regions && filters.regions.length > 0) ? 1 : 0) +
    ((filters?.buildingTypes && filters.buildingTypes.length > 0) ? 1 : 0) +
    ((filters?.counties && filters.counties.length > 0) ? 1 : 0) +
    (filters?.costRange !== null ? 1 : 0)
  );
  
  return (
    <Card className={`shadow-md ${className}`}>
      <Collapsible open={isOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger 
            asChild
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex justify-between items-center cursor-pointer">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Filters</CardTitle>
                {activeFilterCount > 0 && (
                  <Badge className="ml-2 bg-gray-100 text-gray-800">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </div>
          </CollapsibleTrigger>
          <CardDescription>
            Filter visualizations by region, building type, and more
          </CardDescription>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pb-3">
            {allowedFilters.includes('regions') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Regions</h3>
                  </div>
                  {filters?.regions && filters.regions.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => clearRegionFilters && clearRegionFilters()}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {filters?.regions && filters.regions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {filters?.regions?.map(region => (
                      <Badge 
                        key={region} 
                        variant="outline"
                        className="flex items-center gap-1 pl-2"
                      >
                        {region}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => removeRegionFilter && removeRegionFilter(region)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No region filters applied</p>
                )}
              </div>
            )}
            
            {allowedFilters.includes('buildingTypes') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Building Types</h3>
                  </div>
                  {filters?.buildingTypes && filters.buildingTypes.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => clearBuildingTypeFilters && clearBuildingTypeFilters()}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {filters?.buildingTypes && filters.buildingTypes.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {filters?.buildingTypes?.map(buildingType => (
                      <Badge 
                        key={buildingType} 
                        variant="outline"
                        className="flex items-center gap-1 pl-2"
                      >
                        {buildingType}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => removeBuildingTypeFilter && removeBuildingTypeFilter(buildingType)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No building type filters applied</p>
                )}
              </div>
            )}
            
            {allowedFilters.includes('costRange') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Cost Range</h3>
                  </div>
                  {filters?.costRange && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => clearCostRange && clearCostRange()}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                <div className="px-2">
                  <Slider
                    defaultValue={[0, maxCostValue]}
                    value={costRangeValue}
                    min={0}
                    max={maxCostValue}
                    step={10000}
                    onValueChange={handleCostRangeChange}
                    className="my-6"
                  />
                  <div className="flex justify-between">
                    <span className="text-xs">{formatCost(costRangeValue[0])}</span>
                    <span className="text-xs">{formatCost(costRangeValue[1])}</span>
                  </div>
                </div>
              </div>
            )}
            
            {allowedFilters.includes('counties') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Counties</h3>
                  </div>
                  {filters?.counties && filters.counties.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => clearCountyFilters && clearCountyFilters()}
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {filters?.counties && filters.counties.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {filters?.counties?.map((county: string) => (
                      <Badge 
                        key={county} 
                        variant="outline"
                        className="flex items-center gap-1 pl-2"
                      >
                        {county}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                          onClick={() => removeCountyFilter && removeCountyFilter(county)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No county filters applied</p>
                )}
              </div>
            )}
          </CardContent>
          
          {showClearButton && (
            <CardFooter className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => clearAllFilters && clearAllFilters()}
                disabled={activeFilterCount === 0}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Clear All Filters
              </Button>
            </CardFooter>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Export the component as default as well
export default FilterControlPanel;