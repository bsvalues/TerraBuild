import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CostSourceSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
}

export function CostSourceSelector({
  value,
  onChange,
  label = 'Cost Data Source'
}: CostSourceSelectorProps) {
  // Get available sources
  const sourcesQuery = useQuery({
    queryKey: ['/api/cost-factors/sources'],
    refetchOnWindowFocus: false
  });

  // Format source name for display
  const formatSourceName = (source: string) => {
    switch (source) {
      case 'marshallSwift':
        return 'Marshall & Swift';
      case 'rsMeans':
        return 'RS Means';
      case 'costFacto':
        return 'CostFacto';
      case 'bentonCounty':
        return 'Benton County';
      default:
        return source;
    }
  };

  const handleChange = (selectedValue: string) => {
    if (onChange) {
      onChange(selectedValue);
    }
  };

  // Determine the currently selected value
  const selectedValue = value || (sourcesQuery.data?.current as string) || '';

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select value={selectedValue} onValueChange={handleChange} disabled={sourcesQuery.isLoading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select cost data source" />
        </SelectTrigger>
        <SelectContent>
          {sourcesQuery.isLoading ? (
            <SelectItem value="loading" disabled>Loading sources...</SelectItem>
          ) : sourcesQuery.error ? (
            <SelectItem value="error" disabled>Error loading sources</SelectItem>
          ) : (sourcesQuery.data?.data || []).length === 0 ? (
            <SelectItem value="none" disabled>No sources available</SelectItem>
          ) : (
            (sourcesQuery.data?.data || []).map((source: string) => (
              <SelectItem key={source} value={source}>
                {formatSourceName(source)}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default CostSourceSelector;