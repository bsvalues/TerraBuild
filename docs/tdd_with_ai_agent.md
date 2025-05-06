# Test-Driven Development with Replit AI Agent

This document demonstrates how the Replit AI Agent can be used to implement Test-Driven Development (TDD) for creating and improving components in the BCBS application.

## TDD Workflow with AI Agent

1. **Write Test Specification**: Define what the component should do in test form
2. **Generate Tests**: Ask the AI Agent to create tests based on the specification
3. **Generate Implementation**: Ask the AI Agent to create component code that passes the tests
4. **Refine & Iterate**: Continuously improve both tests and implementation

## Example: Creating a CostMatrixFilter Component

### Step 1: Define Test Specification

First, we define what our component should do in the form of tests:

```
Create a test specification for a CostMatrixFilter component that should:

1. Allow filtering cost matrix data by:
   - Building type
   - Region 
   - Year
   - Quality

2. Handle the following user interactions:
   - Selecting multiple filters
   - Clearing all filters
   - Applying filters to data

3. Support the following edge cases:
   - Empty data set
   - No matching results
   - Invalid filter combinations
```

### Step 2: Generate Tests

Next, we ask the AI Agent to generate tests based on our specification:

```
Based on the test specification for the CostMatrixFilter component, create a test file using React Testing Library and Jest. Include tests for all requirements and edge cases.
```

### AI-Generated Tests

The AI might generate tests like this:

```tsx
// client/src/components/cost-matrix/CostMatrixFilter.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CostMatrixFilter } from './CostMatrixFilter';

// Mock data for testing
const mockCostMatrixData = [
  { id: 1, buildingType: 'RESIDENTIAL', region: 'RICHLAND', year: 2025, quality: 'STANDARD', baseRate: 125 },
  { id: 2, buildingType: 'COMMERCIAL', region: 'KENNEWICK', year: 2025, quality: 'PREMIUM', baseRate: 200 },
  { id: 3, buildingType: 'INDUSTRIAL', region: 'PASCO', year: 2025, quality: 'ECONOMY', baseRate: 80 },
  { id: 4, buildingType: 'RESIDENTIAL', region: 'RICHLAND', year: 2024, quality: 'LUXURY', baseRate: 250 },
  { id: 5, buildingType: 'COMMERCIAL', region: 'WEST_RICHLAND', year: 2023, quality: 'STANDARD', baseRate: 150 },
];

describe('CostMatrixFilter', () => {
  const onFilterChangeMock = jest.fn();
  
  beforeEach(() => {
    onFilterChangeMock.mockClear();
  });
  
  it('renders all filter options', () => {
    render(
      <CostMatrixFilter 
        data={mockCostMatrixData} 
        onFilterChange={onFilterChangeMock} 
      />
    );
    
    // Check building type filter exists
    expect(screen.getByText(/building type/i)).toBeInTheDocument();
    
    // Check region filter exists
    expect(screen.getByText(/region/i)).toBeInTheDocument();
    
    // Check year filter exists
    expect(screen.getByText(/year/i)).toBeInTheDocument();
    
    // Check quality filter exists
    expect(screen.getByText(/quality/i)).toBeInTheDocument();
    
    // Check clear filters button exists
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });
  
  it('displays unique filter options from data', () => {
    render(
      <CostMatrixFilter 
        data={mockCostMatrixData} 
        onFilterChange={onFilterChangeMock} 
      />
    );
    
    // Open building type dropdown
    fireEvent.click(screen.getByLabelText(/building type/i));
    
    // Check building type options
    expect(screen.getByText('RESIDENTIAL')).toBeInTheDocument();
    expect(screen.getByText('COMMERCIAL')).toBeInTheDocument();
    expect(screen.getByText('INDUSTRIAL')).toBeInTheDocument();
    
    // Close and open region dropdown
    fireEvent.click(screen.getByLabelText(/building type/i)); // Close first dropdown
    fireEvent.click(screen.getByLabelText(/region/i));
    
    // Check region options
    expect(screen.getByText('RICHLAND')).toBeInTheDocument();
    expect(screen.getByText('KENNEWICK')).toBeInTheDocument();
    expect(screen.getByText('PASCO')).toBeInTheDocument();
    expect(screen.getByText('WEST_RICHLAND')).toBeInTheDocument();
  });
  
  it('calls onFilterChange when filters are applied', async () => {
    render(
      <CostMatrixFilter 
        data={mockCostMatrixData} 
        onFilterChange={onFilterChangeMock} 
      />
    );
    
    // Select a building type
    fireEvent.click(screen.getByLabelText(/building type/i));
    fireEvent.click(screen.getByText('RESIDENTIAL'));
    
    // Check callback was called with correct filter
    expect(onFilterChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        buildingType: ['RESIDENTIAL'],
        region: [],
        year: [],
        quality: []
      })
    );
    
    // Select a region
    fireEvent.click(screen.getByLabelText(/region/i));
    fireEvent.click(screen.getByText('RICHLAND'));
    
    // Check callback was called with both filters
    expect(onFilterChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        buildingType: ['RESIDENTIAL'],
        region: ['RICHLAND'],
        year: [],
        quality: []
      })
    );
  });
  
  it('clears all filters when clear button is clicked', async () => {
    render(
      <CostMatrixFilter 
        data={mockCostMatrixData} 
        onFilterChange={onFilterChangeMock} 
      />
    );
    
    // Select a building type and region
    fireEvent.click(screen.getByLabelText(/building type/i));
    fireEvent.click(screen.getByText('RESIDENTIAL'));
    fireEvent.click(screen.getByLabelText(/region/i));
    fireEvent.click(screen.getByText('RICHLAND'));
    
    // Clear mock to focus on next call
    onFilterChangeMock.mockClear();
    
    // Click clear filters button
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
    
    // Check callback was called with empty filters
    expect(onFilterChangeMock).toHaveBeenCalledWith({
      buildingType: [],
      region: [],
      year: [],
      quality: []
    });
  });
  
  it('handles empty data set gracefully', () => {
    render(
      <CostMatrixFilter 
        data={[]} 
        onFilterChange={onFilterChangeMock} 
      />
    );
    
    // Component should render without errors
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    
    // Clear filters button should be disabled
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeDisabled();
  });
  
  it('handles no matching results', async () => {
    const { rerender } = render(
      <CostMatrixFilter 
        data={mockCostMatrixData} 
        onFilterChange={onFilterChangeMock}
        filteredCount={0}
        totalCount={mockCostMatrixData.length}
      />
    );
    
    // Should show no results message
    expect(screen.getByText(/0 of 5 items/i)).toBeInTheDocument();
  });
  
  it('disables invalid filter combinations', async () => {
    // Setup with already filtered data
    render(
      <CostMatrixFilter 
        data={mockCostMatrixData.filter(item => item.buildingType === 'RESIDENTIAL')} 
        onFilterChange={onFilterChangeMock}
        activeFilters={{
          buildingType: ['RESIDENTIAL'],
          region: [],
          year: [],
          quality: []
        }}
      />
    );
    
    // Open region dropdown
    fireEvent.click(screen.getByLabelText(/region/i));
    
    // WEST_RICHLAND should be disabled (no RESIDENTIAL buildings there in our mock data)
    expect(screen.getByText('WEST_RICHLAND')).toHaveAttribute('aria-disabled', 'true');
  });
});
```

### Step 3: Generate Implementation

Now, we ask the AI Agent to implement the component that passes the tests:

```
Implement the CostMatrixFilter component that will pass all the tests. The component should:

1. Accept a data array containing cost matrix items
2. Allow filtering by building type, region, year, and quality
3. Emit filter changes through a callback
4. Handle all edge cases mentioned in the tests
5. Follow our project's UI component standards using shadcn components
```

### AI-Generated Implementation

The AI might generate an implementation like this:

```tsx
// client/src/components/cost-matrix/CostMatrixFilter.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface CostMatrixItem {
  id: number;
  buildingType: string;
  region: string;
  year: number;
  quality: string;
  baseRate: number;
  [key: string]: any; // Allow for additional fields
}

export interface CostMatrixFilters {
  buildingType: string[];
  region: string[];
  year: string[] | number[];
  quality: string[];
}

interface CostMatrixFilterProps {
  data: CostMatrixItem[];
  onFilterChange: (filters: CostMatrixFilters) => void;
  activeFilters?: CostMatrixFilters;
  filteredCount?: number;
  totalCount?: number;
}

export function CostMatrixFilter({
  data,
  onFilterChange,
  activeFilters,
  filteredCount,
  totalCount = data.length
}: CostMatrixFilterProps) {
  // Initialize filters
  const [filters, setFilters] = useState<CostMatrixFilters>(
    activeFilters || {
      buildingType: [],
      region: [],
      year: [],
      quality: []
    }
  );

  // Extract unique values for each filter
  const filterOptions = useMemo(() => {
    if (!data.length) return { buildingTypes: [], regions: [], years: [], qualities: [] };
    
    return {
      buildingTypes: [...new Set(data.map(item => item.buildingType))],
      regions: [...new Set(data.map(item => item.region))],
      years: [...new Set(data.map(item => item.year))].sort((a, b) => b - a), // Sort years descending
      qualities: [...new Set(data.map(item => item.quality))]
    };
  }, [data]);

  // Determine which filter options should be disabled based on current selections
  const getDisabledOptions = (field: keyof CostMatrixFilters, options: string[] | number[]) => {
    if (!data.length || Object.values(filters).flat().length === 0) {
      // If no filters applied, nothing should be disabled
      return options.reduce((acc, option) => ({ ...acc, [option]: false }), {});
    }
    
    // Create a filtered dataset based on current filters, except for the field we're evaluating
    const otherFilters = { ...filters };
    delete otherFilters[field];
    
    // Only filter if we have some other filters applied
    const hasOtherFilters = Object.values(otherFilters).some(f => f.length > 0);
    
    if (!hasOtherFilters) {
      return options.reduce((acc, option) => ({ ...acc, [option]: false }), {});
    }
    
    // Filter the data based on other selected filters
    const filteredData = data.filter(item => {
      return Object.entries(otherFilters).every(([filterField, selectedValues]) => {
        if (selectedValues.length === 0) return true;
        return selectedValues.includes(item[filterField]);
      });
    });
    
    // Find which options don't exist in the filtered dataset
    const availableOptions = new Set(filteredData.map(item => item[field]));
    
    return options.reduce((acc, option) => ({
      ...acc,
      [option]: !availableOptions.has(option)
    }), {});
  };
  
  // Handle filter changes
  const handleFilterChange = (field: keyof CostMatrixFilters, value: string) => {
    // Toggle the selected value
    const newFilters = { ...filters };
    
    if (newFilters[field].includes(value)) {
      newFilters[field] = newFilters[field].filter(v => v !== value);
    } else {
      newFilters[field] = [...newFilters[field], value];
    }
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      buildingType: [],
      region: [],
      year: [],
      quality: []
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };
  
  // Update local filters if activeFilters prop changes
  useEffect(() => {
    if (activeFilters) {
      setFilters(activeFilters);
    }
  }, [activeFilters]);

  // If no data is available, show a message
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Filter Cost Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data available</p>
        </CardContent>
        <CardFooter>
          <Button disabled variant="outline">Clear Filters</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Calculate disabled options for each filter
  const disabledBuildingTypes = getDisabledOptions('buildingType', filterOptions.buildingTypes);
  const disabledRegions = getDisabledOptions('region', filterOptions.regions);
  const disabledYears = getDisabledOptions('year', filterOptions.years);
  const disabledQualities = getDisabledOptions('quality', filterOptions.qualities);
  
  // Count active filters
  const activeFilterCount = Object.values(filters).flat().length;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="mr-2 h-5 w-5" />
          Filter Cost Matrix
        </CardTitle>
        <CardDescription>
          {filteredCount !== undefined ? (
            <span>
              Showing {filteredCount} of {totalCount} items
            </span>
          ) : (
            <span>Select filters to narrow results</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Building Type Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="building-type-filter">
            Building Type
          </label>
          <Select
            onValueChange={(value) => handleFilterChange('buildingType', value)}
          >
            <SelectTrigger id="building-type-filter" aria-label="Building Type">
              <SelectValue placeholder="Select building type" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-72">
                {filterOptions.buildingTypes.map((type) => (
                  <SelectItem 
                    key={type} 
                    value={type}
                    disabled={disabledBuildingTypes[type]}
                  >
                    {type}
                    {filters.buildingType.includes(type) && (
                      <Badge className="ml-2 bg-primary">Selected</Badge>
                    )}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          {filters.buildingType.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.buildingType.map(type => (
                <Badge key={type} variant="outline" className="flex items-center gap-1">
                  {type}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('buildingType', type)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="region-filter">
            Region
          </label>
          <Select
            onValueChange={(value) => handleFilterChange('region', value)}
          >
            <SelectTrigger id="region-filter" aria-label="Region">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-72">
                {filterOptions.regions.map((region) => (
                  <SelectItem 
                    key={region} 
                    value={region}
                    disabled={disabledRegions[region]}
                  >
                    {region}
                    {filters.region.includes(region) && (
                      <Badge className="ml-2 bg-primary">Selected</Badge>
                    )}
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
          {filters.region.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.region.map(region => (
                <Badge key={region} variant="outline" className="flex items-center gap-1">
                  {region}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('region', region)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="year-filter">
            Year
          </label>
          <Select
            onValueChange={(value) => handleFilterChange('year', value)}
          >
            <SelectTrigger id="year-filter" aria-label="Year">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.years.map((year) => (
                <SelectItem 
                  key={year} 
                  value={year.toString()}
                  disabled={disabledYears[year]}
                >
                  {year}
                  {filters.year.includes(year.toString()) && (
                    <Badge className="ml-2 bg-primary">Selected</Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.year.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.year.map(year => (
                <Badge key={year} variant="outline" className="flex items-center gap-1">
                  {year}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('year', year.toString())}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Quality Filter */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="quality-filter">
            Quality
          </label>
          <Select
            onValueChange={(value) => handleFilterChange('quality', value)}
          >
            <SelectTrigger id="quality-filter" aria-label="Quality">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              {filterOptions.qualities.map((quality) => (
                <SelectItem 
                  key={quality} 
                  value={quality}
                  disabled={disabledQualities[quality]}
                >
                  {quality}
                  {filters.quality.includes(quality) && (
                    <Badge className="ml-2 bg-primary">Selected</Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filters.quality.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {filters.quality.map(quality => (
                <Badge key={quality} variant="outline" className="flex items-center gap-1">
                  {quality}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange('quality', quality)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          onClick={clearFilters}
          disabled={activeFilterCount === 0}
        >
          {activeFilterCount > 0 ? `Clear Filters (${activeFilterCount})` : 'Clear Filters'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### Step 4: Refine & Iterate

After generating the initial implementation, we would ask the AI Agent to refine it:

```
The implementation looks good, but I'd like to make a few improvements:

1. Add hover states for the filter badges to make them more interactive
2. Add a loading state for when the data is being fetched
3. Improve the accessibility by adding more descriptive ARIA labels
4. Add a "selected" indicator next to items in the dropdown

Please update the component with these enhancements.
```

The AI would then provide an updated version with these improvements.

## Benefits of TDD with AI Agent

1. **Faster Development**: AI generates both tests and implementation
2. **Better Quality**: Tests ensure implementation meets requirements
3. **Improved Maintainability**: Well-tested code is easier to maintain
4. **Comprehensive Coverage**: AI can consider edge cases humans might miss
5. **Learning Opportunity**: Developers can learn TDD practices from the AI examples

## Recommended TDD Workflow

1. **Start with Requirements**: Clearly define what the component should do
2. **Generate Tests First**: Always ask the AI to write tests before implementation
3. **Review Tests Carefully**: Ensure tests cover all requirements and edge cases
4. **Generate Implementation**: Ask the AI to create code that passes the tests
5. **Run Tests**: Verify that the implementation passes all tests
6. **Refine Iteratively**: Ask for specific improvements while maintaining test coverage

This TDD approach powered by Replit AI Agent can significantly speed up development while ensuring high-quality, well-tested code.