import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertCircle, ArrowRightIcon, BarChart2, LineChart as LineChartIcon, Map, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { queryClient } from '@/lib/queryClient';

// Interface for API data
interface County {
  name: string;
  avgCost: number;
  minCost: number;
  maxCost: number;
  buildingTypes: Array<{
    type: string;
    avgCost: number;
    count: number;
  }>;
}

interface State {
  name: string;
  avgCost: number;
  minCost: number;
  maxCost: number;
  counties: Array<{
    name: string;
    avgCost: number;
    count: number;
  }>;
}

interface RegionTrend {
  region: string;
  buildingType: string;
  trends: Array<{ year: number; cost: number }>;
}

interface CountyTrends {
  counties: Array<{
    name: string;
    trends: Array<{ year: number; cost: number }>;
  }>;
}

interface MaterialComparison {
  regions: Array<{
    name: string;
    materials: Array<{
      name: string;
      cost: number;
      percentage: number;
    }>;
  }>;
}

interface RegionalStatsReport {
  mostExpensiveRegions: Array<{ region: string; avgCost: number }>;
  leastExpensiveRegions: Array<{ region: string; avgCost: number }>;
  costGrowthByRegion: Array<{ region: string; growthRate: number }>;
  buildingTypeDistribution: Array<{ type: string; count: number }>;
  totalDataPoints: number;
}

// Chart colors
const CHART_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

function BenchmarkingPage(): React.JSX.Element {
  const { toast } = useToast();
  
  // State for form selections
  const [activeTab, setActiveTab] = React.useState<string>('county-comparison');
  const [selectedCounties, setSelectedCounties] = React.useState<string[]>([]);
  const [selectedStates, setSelectedStates] = React.useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = React.useState<string[]>([]);
  const [selectedBuildingType, setSelectedBuildingType] = React.useState<string>('RESIDENTIAL');
  const [yearsForTrend, setYearsForTrend] = React.useState<number>(5);
  
  // Fetch available counties, states, regions, and building types
  const { data: counties = [] } = useQuery({
    queryKey: ['/api/benchmarking/counties'],
    retry: 1
  });
  
  const { data: states = [] } = useQuery({
    queryKey: ['/api/benchmarking/states'],
    retry: 1
  });
  
  // Assume regions are the same as the ones in cost matrix
  const { data: regionsData } = useQuery({
    queryKey: ['/api/regions'],
    retry: 1
  });
  
  // For simplicity, we'll use a fixed list of building types
  const buildingTypes = [
    { value: 'RESIDENTIAL', label: 'Residential' },
    { value: 'COMMERCIAL', label: 'Commercial' },
    { value: 'INDUSTRIAL', label: 'Industrial' }
  ];
  
  // Fetch comparison data based on selected options
  const { data: countyComparisonData, isLoading: isCountyComparisonLoading, refetch: refetchCountyComparison } = useQuery({
    queryKey: ['/api/benchmarking/counties/compare', selectedCounties, selectedBuildingType],
    queryFn: async () => {
      if (selectedCounties.length === 0) return { counties: [] };
      
      const response = await fetch('/api/benchmarking/counties/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counties: selectedCounties, buildingType: selectedBuildingType })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch county comparison data');
      }
      
      return response.json();
    },
    enabled: selectedCounties.length > 0 && activeTab === 'county-comparison',
    retry: 1
  });
  
  const { data: stateComparisonData, isLoading: isStateComparisonLoading, refetch: refetchStateComparison } = useQuery({
    queryKey: ['/api/benchmarking/states/compare', selectedStates, selectedBuildingType],
    queryFn: async () => {
      if (selectedStates.length === 0) return { states: [] };
      
      const response = await fetch('/api/benchmarking/states/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ states: selectedStates, buildingType: selectedBuildingType })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch state comparison data');
      }
      
      return response.json();
    },
    enabled: selectedStates.length > 0 && activeTab === 'state-comparison',
    retry: 1
  });
  
  const { data: regionTrendData, isLoading: isRegionTrendLoading, refetch: refetchRegionTrend } = useQuery({
    queryKey: ['/api/benchmarking/trends/region', selectedRegions[0], selectedBuildingType, yearsForTrend],
    queryFn: async () => {
      if (!selectedRegions[0]) return { region: '', buildingType: '', trends: [] };
      
      const response = await fetch('/api/benchmarking/trends/region', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          region: selectedRegions[0],
          buildingType: selectedBuildingType,
          years: yearsForTrend 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch region trend data');
      }
      
      return response.json();
    },
    enabled: selectedRegions.length > 0 && activeTab === 'cost-trends',
    retry: 1
  });
  
  const { data: countyTrendsData, isLoading: isCountyTrendsLoading, refetch: refetchCountyTrends } = useQuery({
    queryKey: ['/api/benchmarking/trends/counties', selectedCounties, selectedBuildingType, yearsForTrend],
    queryFn: async () => {
      if (selectedCounties.length === 0) return { counties: [] };
      
      const response = await fetch('/api/benchmarking/trends/counties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          counties: selectedCounties,
          buildingType: selectedBuildingType,
          years: yearsForTrend 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch county trends data');
      }
      
      return response.json();
    },
    enabled: selectedCounties.length > 0 && activeTab === 'cost-trends',
    retry: 1
  });
  
  const { data: materialComparisonData, isLoading: isMaterialComparisonLoading, refetch: refetchMaterialComparison } = useQuery({
    queryKey: ['/api/benchmarking/materials/compare', selectedRegions, selectedBuildingType],
    queryFn: async () => {
      if (selectedRegions.length === 0) return { regions: [] };
      
      const response = await fetch('/api/benchmarking/materials/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          regions: selectedRegions,
          buildingType: selectedBuildingType 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch material comparison data');
      }
      
      return response.json();
    },
    enabled: selectedRegions.length > 0 && activeTab === 'material-comparison',
    retry: 1
  });
  
  const { data: regionalStatsReport, isLoading: isRegionalStatsLoading } = useQuery({
    queryKey: ['/api/benchmarking/report/regional-stats'],
    queryFn: async () => {
      const response = await fetch('/api/benchmarking/report/regional-stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch regional stats report');
      }
      
      return response.json();
    },
    retry: 1
  });
  
  // Handle form submissions
  const handleCompareCounties = () => {
    if (selectedCounties.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one county to compare.",
        variant: "destructive"
      });
      return;
    }
    
    refetchCountyComparison();
  };
  
  const handleCompareStates = () => {
    if (selectedStates.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one state to compare.",
        variant: "destructive"
      });
      return;
    }
    
    refetchStateComparison();
  };
  
  const handleViewTrends = () => {
    if (selectedRegions.length === 0 && selectedCounties.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one region or county to view trends.",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedRegions.length > 0) {
      refetchRegionTrend();
    }
    
    if (selectedCounties.length > 0) {
      refetchCountyTrends();
    }
  };
  
  const handleCompareMaterials = () => {
    if (selectedRegions.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one region to compare materials.",
        variant: "destructive"
      });
      return;
    }
    
    refetchMaterialComparison();
  };
  
  // Format cost for display
  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };
  
  // Helper for multiple selection
  const toggleSelection = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };
  
  const handleCountySelect = (county: string) => {
    setSelectedCounties(toggleSelection(selectedCounties, county));
  };
  
  const handleStateSelect = (state: string) => {
    setSelectedStates(toggleSelection(selectedStates, state));
  };
  
  const handleRegionSelect = (region: string) => {
    setSelectedRegions(toggleSelection(selectedRegions, region));
  };
  
  // Helper for building type label
  const getBuildingTypeLabel = (type: string) => {
    const found = buildingTypes.find(bt => bt.value === type);
    return found ? found.label : type;
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Benchmarking</h1>
          <p className="text-muted-foreground">
            Compare building costs across regions, counties, and states
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="county-comparison" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>County Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="state-comparison" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>State Comparison</span>
          </TabsTrigger>
          <TabsTrigger value="cost-trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Cost Trends</span>
          </TabsTrigger>
          <TabsTrigger value="material-comparison" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Material Breakdown</span>
          </TabsTrigger>
        </TabsList>
        
        {/* County Comparison Tab */}
        <TabsContent value="county-comparison">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compare Counties</CardTitle>
                <CardDescription>
                  Select counties and building type to compare costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Counties</h3>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                      {Array.isArray(counties) && counties.map((county: string) => (
                        <div key={county} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`county-${county}`}
                            checked={selectedCounties.includes(county)}
                            onChange={() => handleCountySelect(county)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`county-${county}`} className="text-sm">
                            {county}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Building Type</h3>
                    <Select
                      value={selectedBuildingType}
                      onValueChange={setSelectedBuildingType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Building Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleCompareCounties} className="w-full">
                      Compare Counties
                    </Button>
                  </div>
                </div>
                
                {selectedCounties.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedCounties.map((county: string) => (
                      <Badge key={county} className="flex items-center gap-1">
                        {county}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isCountyComparisonLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : countyComparisonData?.counties?.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>County Cost Comparison</CardTitle>
                    <CardDescription>
                      Average costs for {getBuildingTypeLabel(selectedBuildingType)} buildings across selected counties
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={countyComparisonData.counties.map((county: County) => ({
                            name: county.name,
                            avgCost: county.avgCost
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end"
                            height={60}
                            interval={0}
                          />
                          <YAxis 
                            label={{ value: 'Average Cost ($/sqft)', angle: -90, position: 'insideLeft' }} 
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Average Cost']} />
                          <Legend />
                          <Bar 
                            dataKey="avgCost" 
                            name="Average Cost per sqft" 
                            fill="#1f77b4" 
                            animationDuration={1500}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {countyComparisonData.counties.map((county: County, index: number) => (
                    <Card key={county.name}>
                      <CardHeader>
                        <CardTitle className="text-xl">{county.name} County</CardTitle>
                        <CardDescription>
                          Building cost statistics for {getBuildingTypeLabel(selectedBuildingType)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Min Cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCost(county.minCost)}</span>
                            <span className="text-xs text-muted-foreground">per sqft</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Avg Cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCost(county.avgCost)}</span>
                            <span className="text-xs text-muted-foreground">per sqft</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Max Cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCost(county.maxCost)}</span>
                            <span className="text-xs text-muted-foreground">per sqft</span>
                          </div>
                        </div>
                        
                        {county.buildingTypes.length > 0 && (
                          <>
                            <Separator className="my-4" />
                            <h4 className="font-medium mb-2">Building Types</h4>
                            <div className="space-y-2">
                              {county.buildingTypes.map((buildingType) => (
                                <div key={buildingType.type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium">{buildingType.type}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{buildingType.count} entries</span>
                                    <span className="font-semibold text-blue-600">{formatCost(buildingType.avgCost)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : selectedCounties.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Found</AlertTitle>
                    <AlertDescription>
                      No matching data found for the selected counties and building type.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        
        {/* State Comparison Tab */}
        <TabsContent value="state-comparison">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compare States</CardTitle>
                <CardDescription>
                  Select states and building type to compare costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">States</h3>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                      {Array.isArray(states) && states.map((state: string) => (
                        <div key={state} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`state-${state}`}
                            checked={selectedStates.includes(state)}
                            onChange={() => handleStateSelect(state)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`state-${state}`} className="text-sm">
                            {state}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Building Type</h3>
                    <Select
                      value={selectedBuildingType}
                      onValueChange={setSelectedBuildingType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Building Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleCompareStates} className="w-full">
                      Compare States
                    </Button>
                  </div>
                </div>
                
                {selectedStates.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedStates.map(state => (
                      <Badge key={state} className="flex items-center gap-1">
                        {state}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isStateComparisonLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : stateComparisonData?.states?.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>State Cost Comparison</CardTitle>
                    <CardDescription>
                      Average costs for {getBuildingTypeLabel(selectedBuildingType)} buildings across selected states
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={stateComparisonData.states.map((state: State) => ({
                            name: state.name,
                            avgCost: state.avgCost
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end"
                            height={60}
                            interval={0}
                          />
                          <YAxis 
                            label={{ value: 'Average Cost ($/sqft)', angle: -90, position: 'insideLeft' }} 
                            tickFormatter={(value) => `$${value}`}
                          />
                          <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Average Cost']} />
                          <Legend />
                          <Bar 
                            dataKey="avgCost" 
                            name="Average Cost per sqft" 
                            fill="#1f77b4" 
                            animationDuration={1500}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid gap-6 md:grid-cols-2">
                  {stateComparisonData.states.map((state: State) => (
                    <Card key={state.name}>
                      <CardHeader>
                        <CardTitle className="text-xl">{state.name}</CardTitle>
                        <CardDescription>
                          Building cost statistics for {getBuildingTypeLabel(selectedBuildingType)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Min Cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCost(state.minCost)}</span>
                            <span className="text-xs text-muted-foreground">per sqft</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Avg Cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCost(state.avgCost)}</span>
                            <span className="text-xs text-muted-foreground">per sqft</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">Max Cost</span>
                            <span className="text-2xl font-bold text-blue-600">{formatCost(state.maxCost)}</span>
                            <span className="text-xs text-muted-foreground">per sqft</span>
                          </div>
                        </div>
                        
                        {state.counties.length > 0 && (
                          <>
                            <Separator className="my-4" />
                            <h4 className="font-medium mb-2">Counties</h4>
                            <div className="space-y-2">
                              {state.counties.map((county) => (
                                <div key={county.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                  <span className="font-medium">{county.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">{county.count} entries</span>
                                    <span className="font-semibold text-blue-600">{formatCost(county.avgCost)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : selectedStates.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Found</AlertTitle>
                    <AlertDescription>
                      No matching data found for the selected states and building type.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        
        {/* Cost Trends Tab */}
        <TabsContent value="cost-trends">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Trends Over Time</CardTitle>
                <CardDescription>
                  View how building costs have changed over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Regions</h3>
                    <div className="max-h-60 overflow-y-auto p-2 border rounded-md">
                      {Array.isArray(regionsData) && regionsData.map((region: string) => (
                        <div key={region} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            id={`region-${region}`}
                            checked={selectedRegions.includes(region)}
                            onChange={() => handleRegionSelect(region)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`region-${region}`} className="text-sm">
                            {region}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Counties</h3>
                    <div className="max-h-60 overflow-y-auto p-2 border rounded-md">
                      {Array.isArray(counties) && counties.map((county: string) => (
                        <div key={county} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            id={`county-trend-${county}`}
                            checked={selectedCounties.includes(county)}
                            onChange={() => handleCountySelect(county)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`county-trend-${county}`} className="text-sm">
                            {county}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Building Type</h3>
                    <Select
                      value={selectedBuildingType}
                      onValueChange={setSelectedBuildingType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Building Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <h3 className="text-sm font-medium mb-2 mt-4">Years of Data</h3>
                    <Select
                      value={yearsForTrend.toString()}
                      onValueChange={(value) => setYearsForTrend(parseInt(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Last 3 Years</SelectItem>
                        <SelectItem value="5">Last 5 Years</SelectItem>
                        <SelectItem value="10">Last 10 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleViewTrends} className="w-full">
                      View Trends
                    </Button>
                  </div>
                </div>
                
                {(selectedRegions.length > 0 || selectedCounties.length > 0) && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedRegions.map((region: string) => (
                      <Badge key={region} className="flex items-center gap-1 bg-green-100 text-green-800">
                        Region: {region}
                      </Badge>
                    ))}
                    {selectedCounties.map((county: string) => (
                      <Badge key={county} className="flex items-center gap-1 bg-blue-100 text-blue-800">
                        County: {county}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isRegionTrendLoading || isCountyTrendsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {regionTrendData && regionTrendData.trends && regionTrendData.trends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Region Cost Trends: {regionTrendData.region}</CardTitle>
                      <CardDescription>
                        {getBuildingTypeLabel(regionTrendData.buildingType)} building costs over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={regionTrendData.trends}
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="year" 
                            />
                            <YAxis 
                              label={{ value: 'Average Cost ($/sqft)', angle: -90, position: 'insideLeft' }} 
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost per sqft']} />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="cost" 
                              name="Average Cost" 
                              stroke="#8884d8" 
                              activeDot={{ r: 8 }}
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {countyTrendsData && countyTrendsData.counties && countyTrendsData.counties.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>County Cost Trends Comparison</CardTitle>
                      <CardDescription>
                        {getBuildingTypeLabel(selectedBuildingType)} building costs over time across counties
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="year" 
                              type="number"
                              domain={['dataMin', 'dataMax']}
                              allowDecimals={false}
                            />
                            <YAxis 
                              label={{ value: 'Average Cost ($/sqft)', angle: -90, position: 'insideLeft' }} 
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost per sqft']} />
                            <Legend />
                            
                            {countyTrendsData.counties.map((county, index) => {
                              const color = CHART_COLORS[index % CHART_COLORS.length];
                              return (
                                <Line 
                                  key={county.name}
                                  type="monotone" 
                                  data={county.trends}
                                  dataKey="cost" 
                                  name={county.name} 
                                  stroke={color}
                                  strokeWidth={2}
                                  activeDot={{ r: 6 }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {!regionTrendData?.trends?.length && !countyTrendsData?.counties?.length && 
                 (selectedRegions.length > 0 || selectedCounties.length > 0) && (
                  <Card>
                    <CardContent className="pt-6">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No Trend Data Available</AlertTitle>
                        <AlertDescription>
                          No historical cost data found for the selected regions/counties and building type.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>
        
        {/* Material Comparison Tab */}
        <TabsContent value="material-comparison">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Material Cost Breakdown</CardTitle>
                <CardDescription>
                  Compare material costs across different regions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Regions</h3>
                    <div className="max-h-60 overflow-y-auto p-2 border rounded-md">
                      {Array.isArray(regionsData) && regionsData.map((region: string) => (
                        <div key={region} className="flex items-center space-x-2 mb-2">
                          <input
                            type="checkbox"
                            id={`region-material-${region}`}
                            checked={selectedRegions.includes(region)}
                            onChange={() => handleRegionSelect(region)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor={`region-material-${region}`} className="text-sm">
                            {region}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Building Type</h3>
                    <Select
                      value={selectedBuildingType}
                      onValueChange={setSelectedBuildingType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Building Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildingTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button onClick={handleCompareMaterials} className="w-full">
                      Compare Materials
                    </Button>
                  </div>
                </div>
                
                {selectedRegions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedRegions.map(region => (
                      <Badge key={region} className="flex items-center gap-1">
                        {region}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {isMaterialComparisonLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : materialComparisonData?.regions?.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {materialComparisonData.regions.map((region, index) => (
                    <Card key={region.name}>
                      <CardHeader>
                        <CardTitle>{region.name}</CardTitle>
                        <CardDescription>
                          Material cost breakdown for {getBuildingTypeLabel(selectedBuildingType)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={region.materials.map(material => ({
                                name: material.name,
                                cost: material.cost,
                                percentage: material.percentage
                              }))}
                              layout="vertical"
                              margin={{ top: 20, right: 30, left: 100, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                type="number"
                                tickFormatter={(value) => `$${value}`}
                              />
                              <YAxis 
                                dataKey="name" 
                                type="category"
                                width={80}
                              />
                              <Tooltip 
                                formatter={(value, name, props) => {
                                  if (name === 'cost') {
                                    return [`$${Number(value).toFixed(2)}`, 'Cost per sqft'];
                                  }
                                  return [`${props.payload.percentage}%`, 'Percentage'];
                                }}
                              />
                              <Legend />
                              <Bar 
                                dataKey="cost" 
                                name="Cost" 
                                fill={CHART_COLORS[index % CHART_COLORS.length]} 
                                animationDuration={1500}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="space-y-2">
                          {region.materials.map(material => (
                            <div key={material.name} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium">{material.name}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-blue-600 font-medium">{material.percentage}%</span>
                                <span className="font-semibold text-blue-800">{formatCost(material.cost)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : selectedRegions.length > 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No Data Found</AlertTitle>
                    <AlertDescription>
                      No material breakdown data found for the selected regions and building type.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BenchmarkingPage;