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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import { 
  Skeleton 
} from '@/components/ui/skeleton';
import {
  AlertCircle,
  FileText,
  InfoIcon,
  Building,
  Map,
  Star,
  Award,
  Clock
} from 'lucide-react';
import { loadCostFactorsData, CostFactorsData } from '@/lib/utils/loadCostFactors';
import { useQuery } from '@tanstack/react-query';

/**
 * Component to display the cost factors data loaded from costFactors.json
 */
export function CostFactorDataPanel() {
  const { data: costFactors, isLoading, error, isError } = useQuery({
    queryKey: ['costFactorsData'],
    queryFn: loadCostFactorsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const [activeTab, setActiveTab] = useState('regions');

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !costFactors) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading cost factors</AlertTitle>
        <AlertDescription>
          {error instanceof Error 
            ? error.message 
            : 'Could not load cost factor data. Please try again later.'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{costFactors.source}</CardTitle>
        <CardDescription>
          Version {costFactors.version} ({costFactors.year}) - Last updated: {new Date(costFactors.lastUpdated).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="regions">
              <Map className="h-4 w-4 mr-2" />
              Regions
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Star className="h-4 w-4 mr-2" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="condition">
              <Award className="h-4 w-4 mr-2" />
              Condition
            </TabsTrigger>
            <TabsTrigger value="baseRates">
              <Building className="h-4 w-4 mr-2" />
              Base Rates
            </TabsTrigger>
            <TabsTrigger value="aging">
              <Clock className="h-4 w-4 mr-2" />
              Aging
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="regions" className="space-y-4">
            <h3 className="text-lg font-medium">Region Factors</h3>
            <div className="space-y-2">
              {Object.entries(costFactors.regionFactors).map(([region, factor]) => (
                <div key={region} className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">{region}</span>
                  <span className="font-medium">{factor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="quality" className="space-y-4">
            <h3 className="text-lg font-medium">Quality Factors</h3>
            <div className="space-y-2">
              {Object.entries(costFactors.qualityFactors).map(([quality, factor]) => (
                <div key={quality} className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">{quality}</span>
                  <span className="font-medium">{factor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="condition" className="space-y-4">
            <h3 className="text-lg font-medium">Condition Factors</h3>
            <div className="space-y-2">
              {Object.entries(costFactors.conditionFactors).map(([condition, factor]) => (
                <div key={condition} className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">{condition}</span>
                  <span className="font-medium">{factor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="baseRates" className="space-y-4">
            <h3 className="text-lg font-medium">Base Rates</h3>
            <div className="space-y-2">
              {Object.entries(costFactors.baseRates).map(([type, rate]) => (
                <div key={type} className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">{type}</span>
                  <span className="font-medium">${rate.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="aging" className="space-y-4">
            <h3 className="text-lg font-medium">Aging Factors</h3>
            <div className="space-y-2">
              {Object.entries(costFactors.agingFactors).map(([age, factor]) => (
                <div key={age} className="flex justify-between border-b pb-1">
                  <span className="text-muted-foreground">{age}</span>
                  <span className="font-medium">{factor.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="text-xs text-muted-foreground flex items-center">
          <FileText className="h-3 w-3 mr-1" />
          Data loaded from costFactors.json
        </div>
      </CardFooter>
    </Card>
  );
}