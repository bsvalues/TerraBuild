import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter, RotateCcw } from 'lucide-react';

interface FilterOption {
  id: string;
  label: string;
  checked: boolean;
}

interface RangeFilter {
  min: number;
  max: number;
  value: [number, number];
  step?: number;
  formatValue?: (value: number) => string;
}

interface DataSlicerProps {
  title?: string;
  categories: {
    id: string;
    name: string;
    type: 'select' | 'multiselect' | 'range';
    options?: FilterOption[];
    range?: RangeFilter;
    defaultValue?: string;
  }[];
  onFilterChange: (filters: Record<string, any>) => void;
  className?: string;
  compact?: boolean;
}

export default function DataSlicer({
  title = 'Filters',
  categories,
  onFilterChange,
  className = '',
  compact = false,
}: DataSlicerProps) {
  const [filters, setFilters] = useState<Record<string, any>>(() => {
    // Initialize filters based on provided categories
    const initialFilters: Record<string, any> = {};
    
    categories.forEach(category => {
      if (category.type === 'select') {
        initialFilters[category.id] = category.defaultValue || '';
      } else if (category.type === 'multiselect') {
        initialFilters[category.id] = category.options?.filter(opt => opt.checked).map(opt => opt.id) || [];
      } else if (category.type === 'range') {
        initialFilters[category.id] = category.range?.value || [category.range?.min || 0, category.range?.max || 100];
      }
    });
    
    return initialFilters;
  });
  
  const [activeFiltersCount, setActiveFiltersCount] = useState(() => {
    // Count initially active filters
    let count = 0;
    
    Object.entries(filters).forEach(([key, value]) => {
      const category = categories.find(c => c.id === key);
      
      if (category?.type === 'select' && value) count++;
      if (category?.type === 'multiselect' && Array.isArray(value) && value.length > 0) count++;
      if (category?.type === 'range') {
        const range = category.range;
        if (range && (value[0] > range.min || value[1] < range.max)) count++;
      }
    });
    
    return count;
  });
  
  const handleSelectChange = (categoryId: string, value: string) => {
    // Treat '_all' as empty string for internal state
    const actualValue = value === '_all' ? '' : value;
    const newFilters = { ...filters, [categoryId]: actualValue };
    setFilters(newFilters);
    updateActiveFiltersCount(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleMultiSelectChange = (categoryId: string, optionId: string, checked: boolean) => {
    const currentValues = [...(filters[categoryId] || [])];
    
    if (checked) {
      currentValues.push(optionId);
    } else {
      const index = currentValues.indexOf(optionId);
      if (index !== -1) {
        currentValues.splice(index, 1);
      }
    }
    
    const newFilters = { ...filters, [categoryId]: currentValues };
    setFilters(newFilters);
    updateActiveFiltersCount(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleRangeChange = (categoryId: string, value: [number, number]) => {
    const newFilters = { ...filters, [categoryId]: value };
    setFilters(newFilters);
    updateActiveFiltersCount(newFilters);
    onFilterChange(newFilters);
  };
  
  const updateActiveFiltersCount = (newFilters: Record<string, any>) => {
    let count = 0;
    
    Object.entries(newFilters).forEach(([key, value]) => {
      const category = categories.find(c => c.id === key);
      
      if (category?.type === 'select' && value) count++;
      if (category?.type === 'multiselect' && Array.isArray(value) && value.length > 0) count++;
      if (category?.type === 'range') {
        const range = category.range;
        if (range && (value[0] > range.min || value[1] < range.max)) count++;
      }
    });
    
    setActiveFiltersCount(count);
  };
  
  const resetFilters = () => {
    const initialFilters: Record<string, any> = {};
    
    categories.forEach(category => {
      if (category.type === 'select') {
        initialFilters[category.id] = '';
      } else if (category.type === 'multiselect') {
        initialFilters[category.id] = [];
      } else if (category.type === 'range') {
        initialFilters[category.id] = [category.range?.min || 0, category.range?.max || 100];
      }
    });
    
    setFilters(initialFilters);
    setActiveFiltersCount(0);
    onFilterChange(initialFilters);
  };
  
  return (
    <Card 
      className={`${className} ${compact ? 'border-0 shadow-none bg-transparent' : ''}`}
      style={{ 
        transformStyle: 'preserve-3d', 
        perspective: '1000px'
      }}
    >
      {!compact && (
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base text-[#243E4D] flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {title}
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="outline" 
                  className="ml-2 font-normal"
                  style={{ 
                    transformStyle: 'preserve-3d', 
                    transform: 'translateZ(1px)' 
                  }}
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="text-xs h-8 px-2 text-neutral-500 hover:text-[#243E4D]"
                style={{ 
                  transformStyle: 'preserve-3d', 
                  transform: 'translateZ(1px)' 
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={compact ? 'p-0' : ''}>
        {compact ? (
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <div key={category.id} className="relative">
                {category.type === 'select' && (
                  <Select
                    value={filters[category.id] ? filters[category.id] : '_all'}
                    onValueChange={(value) => handleSelectChange(category.id, value)}
                  >
                    <SelectTrigger className="w-auto min-w-[150px] h-9 text-sm">
                      <SelectValue placeholder={category.name} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All {category.name}</SelectItem>
                      {category.options?.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
            
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-9 px-2 text-neutral-500 hover:text-[#243E4D]"
                style={{ 
                  transformStyle: 'preserve-3d', 
                  transform: 'translateZ(1px)' 
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={categories.map(c => c.id)} className="space-y-2">
            {categories.map(category => (
              <AccordionItem key={category.id} value={category.id} className="border border-neutral-200 rounded-md px-3">
                <AccordionTrigger className="py-2 text-sm hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span>{category.name}</span>
                    {category.type === 'multiselect' && filters[category.id]?.length > 0 && (
                      <Badge 
                        variant="outline" 
                        className="ml-2 font-normal text-xs"
                        style={{ 
                          transformStyle: 'preserve-3d', 
                          transform: 'translateZ(1px)' 
                        }}
                      >
                        {filters[category.id].length}
                      </Badge>
                    )}
                    {category.type === 'range' && (
                      <Badge 
                        variant="outline" 
                        className="ml-2 font-normal text-xs"
                        style={{ 
                          transformStyle: 'preserve-3d', 
                          transform: 'translateZ(1px)' 
                        }}
                      >
                        {category.range?.formatValue?.(filters[category.id][0]) || filters[category.id][0]} - {category.range?.formatValue?.(filters[category.id][1]) || filters[category.id][1]}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3">
                  {category.type === 'select' && (
                    <Select
                      value={filters[category.id] ? filters[category.id] : '_all'}
                      onValueChange={(value) => handleSelectChange(category.id, value)}
                    >
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={`Select ${category.name}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_all">All {category.name}</SelectItem>
                        {category.options?.map(option => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {category.type === 'multiselect' && (
                    <div className="space-y-2">
                      {category.options?.map(option => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`${category.id}-${option.id}`}
                            checked={filters[category.id]?.includes(option.id)}
                            onCheckedChange={(checked) => 
                              handleMultiSelectChange(category.id, option.id, checked === true)
                            }
                          />
                          <Label 
                            htmlFor={`${category.id}-${option.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {category.type === 'range' && category.range && (
                    <div className="space-y-4 pt-4">
                      <Slider 
                        min={category.range.min}
                        max={category.range.max}
                        step={category.range.step || 1}
                        value={filters[category.id]}
                        onValueChange={(value) => 
                          handleRangeChange(category.id, value as [number, number])
                        }
                      />
                      <div className="flex justify-between text-xs text-neutral-500">
                        <span>{category.range.formatValue?.(filters[category.id][0]) || filters[category.id][0]}</span>
                        <span>{category.range.formatValue?.(filters[category.id][1]) || filters[category.id][1]}</span>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}