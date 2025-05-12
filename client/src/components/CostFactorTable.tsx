import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { CostSourceSelector } from './CostSourceSelector';

interface CostFactor {
  factorClass: string;
  factorType: string;
  code: string;
  description: string;
  value: number;
  source?: string;
}

interface CostFactorTableProps {
  source?: string;
  factorType?: string;
  onSourceChange?: (source: string) => void;
}

export function CostFactorTable({ 
  source = 'marshallSwift',
  factorType,
  onSourceChange
}: CostFactorTableProps) {
  const [activeTab, setActiveTab] = useState(factorType || 'baseRate');
  
  // Get cost factors
  const factorsQuery = useQuery({
    queryKey: ['/api/cost-factors', source],
    enabled: true,
    refetchOnWindowFocus: false
  });

  // Handle source change
  const handleSourceChange = (value: string) => {
    if (onSourceChange) {
      onSourceChange(value);
    }
  };

  // Get factors of the current type
  const currentFactors = factorsQuery.data?.data
    ? factorsQuery.data.data.filter((factor: CostFactor) => factor.factorType === activeTab)
    : [];

  // Get unique factor types
  const factorTypes = factorsQuery.data?.data
    ? [...new Set(factorsQuery.data.data.map((factor: CostFactor) => factor.factorType))]
    : [];

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">Cost Factors</CardTitle>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Source:</span>
          <Select
            value={source}
            onValueChange={handleSourceChange}
            disabled={sourcesQuery.isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {sourcesQuery.isLoading ? (
                <SelectItem value="loading">Loading...</SelectItem>
              ) : sourcesQuery.isError ? (
                <SelectItem value="error">Error loading sources</SelectItem>
              ) : (
                sourcesQuery.data?.data?.map((src: string) => (
                  <SelectItem key={src} value={src}>
                    {src === 'marshallSwift' ? 'Marshall & Swift' : 
                     src === 'rsMeans' ? 'RS Means' :
                     src === 'costFacto' ? 'CostFacto' :
                     src === 'bentonCounty' ? 'Benton County' : 
                     src}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {factorsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : factorsQuery.isError ? (
          <div className="text-center py-4 text-red-500">
            Error loading cost factors
          </div>
        ) : factorTypes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No cost factors available for this source
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {factorTypes.map((type: string) => (
                <TabsTrigger key={type} value={type}>
                  {type === 'baseRate' ? 'Base Rates' :
                   type === 'region' ? 'Regional Factors' :
                   type === 'quality' ? 'Quality Factors' :
                   type === 'condition' ? 'Condition Factors' :
                   type === 'age' ? 'Age Factors' :
                   type}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {factorTypes.map((type: string) => (
              <TabsContent key={type} value={type}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentFactors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No factors available
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentFactors.map((factor: CostFactor) => (
                        <TableRow key={factor.code}>
                          <TableCell className="font-medium">{factor.code}</TableCell>
                          <TableCell>{factor.description}</TableCell>
                          <TableCell className="text-right">
                            {type === 'baseRate'
                              ? `$${factor.value.toFixed(2)}/sqft`
                              : factor.value.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}