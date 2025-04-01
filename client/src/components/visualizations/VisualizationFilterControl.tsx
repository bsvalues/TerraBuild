import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useVisualization } from './VisualizationController';
import { RefreshCw } from 'lucide-react';

// Sample regions and building types
// These would typically come from an API endpoint in production
const AVAILABLE_REGIONS = [
  'Northwest',
  'Northeast',
  'Southwest',
  'Southeast',
  'Central',
  'Eastern',
  'Western',
  'Northern',
  'Southern'
];

const AVAILABLE_BUILDING_TYPES = [
  'Residential',
  'Commercial',
  'Industrial',
  'Agricultural',
  'Institutional',
  'Mixed Use'
];

/**
 * Visualization Filter Control Component
 * 
 * Provides UI controls for filtering visualization data
 */
export function VisualizationFilterControl() {
  const { filters, setFilters, refreshData } = useVisualization();
  const [availableRegions, setAvailableRegions] = useState<string[]>(AVAILABLE_REGIONS);
  const [availableBuildingTypes, setAvailableBuildingTypes] = useState<string[]>(AVAILABLE_BUILDING_TYPES);
  
  // In a real implementation, we would fetch the available regions and building types from an API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        // Simulate API calls to get available regions and building types
        // In production, replace with actual API calls:
        // const regionsResponse = await fetch('/api/regions');
        // const regions = await regionsResponse.json();
        // setAvailableRegions(regions);
        // ...
        
        // Using sample data for now
        setAvailableRegions(AVAILABLE_REGIONS);
        setAvailableBuildingTypes(AVAILABLE_BUILDING_TYPES);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  const handleRegionChange = (value: string) => {
    setFilters({ region: value });
  };
  
  const handleBuildingTypeChange = (value: string) => {
    setFilters({ buildingType: value });
  };
  
  const handleRefresh = () => {
    refreshData();
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label htmlFor="region-select">Region</Label>
            <Select 
              value={filters.region} 
              onValueChange={handleRegionChange}
            >
              <SelectTrigger id="region-select" className="w-full">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {availableRegions.map(region => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 flex-1">
            <Label htmlFor="building-type-select">Building Type</Label>
            <Select 
              value={filters.buildingType} 
              onValueChange={handleBuildingTypeChange}
            >
              <SelectTrigger id="building-type-select" className="w-full">
                <SelectValue placeholder="Select building type" />
              </SelectTrigger>
              <SelectContent>
                {availableBuildingTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            title="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}