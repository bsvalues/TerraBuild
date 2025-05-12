import { useCostFactorSources } from '@/hooks/use-cost-factors.tsx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CostFactorTable from './CostFactorTable';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, HelpCircle } from 'lucide-react';
import ComplexityFactorsTable from './ComplexityFactorsTable';

export function CostFactorDashboard() {
  // Get available cost factor sources
  const { sources, isLoading, error } = useCostFactorSources();

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading cost factor sources</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load cost factor sources'}
        </AlertDescription>
      </Alert>
    );
  }

  // Default building types to show if none are specified
  const defaultBuildingTypes = ['RES', 'COM', 'IND', 'AGR'];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Benton County Cost Factors</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Building Cost Data</CardTitle>
            <CardDescription>
              Cost factors for calculating building valuations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              These data tables replace the Marshall &amp; Swift cost tables with Benton County's 
              own cost factors based on local market analysis and historical data.
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="mr-2 h-4 w-4" />
              {isLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <span>{sources?.length || 0} source tables available</span>
              )}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Multipliers</CardTitle>
            <CardDescription>
              Location-based adjustment factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Regional multipliers are used to adjust costs based on the property's location 
              within Benton County, accounting for local variations in construction costs.
            </p>
          </CardContent>
          <CardFooter>
            <div className="flex items-center text-sm text-muted-foreground">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>See region section for details</span>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Grades</CardTitle>
            <CardDescription>
              Construction quality adjustment factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quality grade factors adjust costs based on the quality of construction,
              from economy (lowest) to luxury (highest).
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="flex items-center text-sm text-muted-foreground">
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>6 quality levels from Economy to Luxury</span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : sources && sources.length > 0 ? (
        <Tabs defaultValue="residential" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="residential">Residential</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="industrial">Industrial</TabsTrigger>
            <TabsTrigger value="complexity">Complexity Factors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="residential" className="p-4 border rounded-md">
            <h2 className="text-2xl font-bold mb-4">Residential Building Cost Factors</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {defaultBuildingTypes.filter(type => type === 'RES').map((type) => (
                <CostFactorTable 
                  key={type} 
                  buildingType={type} 
                  title={`${type} - Residential Buildings`}
                  caption="Base cost factors for residential properties"
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="commercial" className="p-4 border rounded-md">
            <h2 className="text-2xl font-bold mb-4">Commercial Building Cost Factors</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {defaultBuildingTypes.filter(type => type === 'COM').map((type) => (
                <CostFactorTable 
                  key={type} 
                  buildingType={type} 
                  title={`${type} - Commercial Buildings`}
                  caption="Base cost factors for commercial properties"
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="industrial" className="p-4 border rounded-md">
            <h2 className="text-2xl font-bold mb-4">Industrial Building Cost Factors</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {defaultBuildingTypes.filter(type => type === 'IND').map((type) => (
                <CostFactorTable 
                  key={type} 
                  buildingType={type} 
                  title={`${type} - Industrial Buildings`}
                  caption="Base cost factors for industrial properties"
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="complexity" className="p-4 border rounded-md">
            <h2 className="text-2xl font-bold mb-4">Complexity Factors</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ComplexityFactorsTable 
                category="STORIES" 
                title="Story Height Factors"
                caption="Adjustments based on number of stories"
              />
              <ComplexityFactorsTable 
                category="FOUNDATION" 
                title="Foundation Factors"
                caption="Adjustments based on foundation type"
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Alert className="mt-4">
          <HelpCircle className="h-4 w-4" />
          <AlertTitle>No cost factor sources available</AlertTitle>
          <AlertDescription>
            No cost factor sources have been configured. Please contact the system administrator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}