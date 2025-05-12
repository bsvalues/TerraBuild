import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CostFactor {
  factorClass: string;
  factorType: string;
  code: string;
  description: string;
  value: number;
  source?: string;
}

interface CostFactorResponse {
  success: boolean;
  source: string;
  factors: CostFactor[];
}

/**
 * CostFactorTable Component
 * 
 * Displays cost factors from the selected source in a tabular format
 */
export function CostFactorTable() {
  const [selectedSource, setSelectedSource] = useState<string>('marshallSwift');
  const [availableSources, setAvailableSources] = useState<string[]>(['marshallSwift']);
  
  // Fetch available sources
  const sourcesQuery = useQuery<{ success: boolean, sources: string[] }>({
    queryKey: ['/api/cost-factors/sources'],
    retry: 1,
  });
  
  // Fetch current source
  const currentSourceQuery = useQuery<{ success: boolean, source: string }>({
    queryKey: ['/api/cost-factors/source'],
    retry: 1,
  });
  
  // Fetch cost factors based on selected source
  const costFactorsQuery = useQuery<CostFactorResponse>({
    queryKey: ['/api/cost-factors', { source: selectedSource }],
    retry: 1,
  });
  
  // Update sources when data is loaded
  useEffect(() => {
    if (sourcesQuery.data?.success && sourcesQuery.data.sources.length > 0) {
      setAvailableSources(sourcesQuery.data.sources);
    }
  }, [sourcesQuery.data]);
  
  // Update selected source when current source is loaded
  useEffect(() => {
    if (currentSourceQuery.data?.success) {
      setSelectedSource(currentSourceQuery.data.source);
    }
  }, [currentSourceQuery.data]);
  
  // Handle source change
  const handleSourceChange = async (value: string) => {
    setSelectedSource(value);
    
    try {
      // Update the source on the server
      const response = await fetch('/api/cost-factors/source', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source: value }),
      });
      
      if (response.ok) {
        // Invalidate queries to refresh data
        costFactorsQuery.refetch();
        currentSourceQuery.refetch();
      }
    } catch (error) {
      console.error('Failed to update cost source:', error);
    }
  };
  
  // Group factors by type for better display
  const groupedFactors = React.useMemo(() => {
    if (!costFactorsQuery.data?.factors) return {};
    
    return costFactorsQuery.data.factors.reduce((acc, factor) => {
      if (!acc[factor.factorType]) {
        acc[factor.factorType] = [];
      }
      acc[factor.factorType].push(factor);
      return acc;
    }, {} as Record<string, CostFactor[]>);
  }, [costFactorsQuery.data]);
  
  // Format factor type for display
  const formatFactorType = (type: string) => {
    return type
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Factor$/, ' Factors');
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cost Factors</CardTitle>
          <CardDescription>
            View and manage building cost factors
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Source:</span>
          <Select value={selectedSource} onValueChange={handleSourceChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {availableSources.map(source => (
                <SelectItem key={source} value={source}>
                  {source === 'marshallSwift' ? 'Marshall & Swift' : 'RS Means'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">
            {selectedSource === 'marshallSwift' ? 'Marshall & Swift' : 'RS Means'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {costFactorsQuery.isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading cost factors...</span>
          </div>
        ) : costFactorsQuery.isError ? (
          <div className="text-center py-8 text-destructive">
            Error loading cost factors. Please try again.
          </div>
        ) : Object.keys(groupedFactors).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No cost factors available for {selectedSource === 'marshallSwift' ? 'Marshall & Swift' : 'RS Means'}.
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFactors).map(([factorType, factors]) => (
              <div key={factorType} className="rounded-md border">
                <h3 className="px-4 py-2 bg-muted font-medium text-sm">
                  {formatFactorType(factorType)}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factors.map((factor, index) => (
                      <TableRow key={`${factor.code}-${index}`}>
                        <TableCell className="font-medium">{factor.code}</TableCell>
                        <TableCell>{factor.description}</TableCell>
                        <TableCell className="text-right">
                          {factorType === 'baseRate' 
                            ? `$${factor.value.toFixed(2)}` 
                            : factor.value.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}