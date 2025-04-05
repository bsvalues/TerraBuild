import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Brush,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Slider 
} from '@/components/ui/slider';
import { 
  AlertCircle, 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Info,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Map
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'
];

// Types for cost matrix data from the API
interface CostMatrixData {
  id: number;
  region: string;
  buildingType: string;
  buildingTypeDescription: string;
  baseCost: number;
  matrixYear: number;
  complexityFactorBase: number;
  qualityFactorBase: number;
  conditionFactorBase: number;
}

// Type for our data with calculated properties
interface EnhancedCostMatrixData extends CostMatrixData {
  label: string;
  adjustedBaseCost: number;
}

const RegionalCostComparison: React.FC = () => {
  // State for filters
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedBuildingTypes, setSelectedBuildingTypes] = useState<string[]>([]);
  const [complexityFactor, setComplexityFactor] = useState(1);
  const [qualityFactor, setQualityFactor] = useState(1);
  const [conditionFactor, setConditionFactor] = useState(1);
  const [useAdjustedCosts, setUseAdjustedCosts] = useState(true);
  const [chartType, setChartType] = useState('bar'); // 'bar', 'line', 'pie'

  // Fetch cost matrix data
  const { data: costMatrixData, isLoading, error } = useQuery({
    queryKey: ['/api/cost-matrix'],
    staleTime: 60000, // 1 minute
  });

  // Get unique regions and building types for filters
  const regions = useMemo(() => {
    if (!costMatrixData || !Array.isArray(costMatrixData)) return [];
    const uniqueRegions = new Set<string>();
    costMatrixData.forEach((item: CostMatrixData) => uniqueRegions.add(item.region));
    return Array.from(uniqueRegions).sort();
  }, [costMatrixData]);

  const buildingTypes = useMemo(() => {
    if (!costMatrixData || !Array.isArray(costMatrixData)) return [];
    const uniqueTypes = new Set<string>();
    costMatrixData.forEach((item: CostMatrixData) => uniqueTypes.add(item.buildingType));
    return Array.from(uniqueTypes).sort();
  }, [costMatrixData]);

  // Set default selected regions and building types when data loads
  useEffect(() => {
    if (regions.length > 0 && selectedRegions.length === 0) {
      // Select first 3 regions by default, or all if less than 3
      setSelectedRegions(regions.slice(0, Math.min(3, regions.length)));
    }
    
    if (buildingTypes.length > 0 && selectedBuildingTypes.length === 0) {
      // Select first building type by default
      setSelectedBuildingTypes([buildingTypes[0]]);
    }
  }, [regions, buildingTypes, selectedRegions, selectedBuildingTypes]);

  // Calculate adjusted cost based on factors
  const enhancedData: EnhancedCostMatrixData[] = useMemo(() => {
    if (!costMatrixData || !Array.isArray(costMatrixData)) return [];
    
    return costMatrixData.map((item: CostMatrixData) => {
      const adjustedBaseCost = item.baseCost * 
        (item.complexityFactorBase * complexityFactor) * 
        (item.qualityFactorBase * qualityFactor) * 
        (item.conditionFactorBase * conditionFactor);
      
      return {
        ...item,
        label: `${item.region} - ${item.buildingType}`,
        adjustedBaseCost
      };
    });
  }, [costMatrixData, complexityFactor, qualityFactor, conditionFactor]);

  // Apply filters to data
  const filteredData = useMemo(() => {
    return enhancedData.filter(item => 
      (selectedRegions.length === 0 || selectedRegions.includes(item.region)) &&
      (selectedBuildingTypes.length === 0 || selectedBuildingTypes.includes(item.buildingType))
    );
  }, [enhancedData, selectedRegions, selectedBuildingTypes]);

  // Calculate region averages
  const regionAverages = useMemo(() => {
    if (filteredData.length === 0) return [];

    // Use a regular object instead of Map
    const regionMap: Record<string, { total: number, count: number }> = {};
    
    filteredData.forEach(item => {
      const cost = useAdjustedCosts ? item.adjustedBaseCost : item.baseCost;
      if (!regionMap[item.region]) {
        regionMap[item.region] = { total: 0, count: 0 };
      }
      regionMap[item.region].total += cost;
      regionMap[item.region].count += 1;
    });
    
    return Object.entries(regionMap).map(([region, { total, count }]) => ({
      region,
      averageCost: total / count,
      count
    }));
  }, [filteredData, useAdjustedCosts]);

  // Calculate building type averages
  const buildingTypeAverages = useMemo(() => {
    if (filteredData.length === 0) return [];

    // Use a regular object instead of Map
    const typeMap: Record<string, { total: number, count: number, description: string }> = {};
    
    filteredData.forEach(item => {
      const cost = useAdjustedCosts ? item.adjustedBaseCost : item.baseCost;
      if (!typeMap[item.buildingType]) {
        typeMap[item.buildingType] = { 
          total: 0, 
          count: 0, 
          description: item.buildingTypeDescription 
        };
      }
      typeMap[item.buildingType].total += cost;
      typeMap[item.buildingType].count += 1;
    });
    
    return Object.entries(typeMap).map(([buildingType, { total, count, description }]) => ({
      buildingType,
      description,
      averageCost: total / count,
      count
    }));
  }, [filteredData, useAdjustedCosts]);

  // Calculate overall statistics
  const statistics = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        averageCost: 0,
        minCost: 0,
        maxCost: 0,
        median: 0,
        totalItems: 0,
        variance: 0
      };
    }

    const costs = filteredData.map(item => 
      useAdjustedCosts ? item.adjustedBaseCost : item.baseCost
    ).sort((a, b) => a - b);
    
    const totalItems = costs.length;
    const minCost = costs[0];
    const maxCost = costs[totalItems - 1];
    const sum = costs.reduce((total, cost) => total + cost, 0);
    const averageCost = sum / totalItems;
    
    // Calculate median
    const middleIndex = Math.floor(totalItems / 2);
    const median = totalItems % 2 === 0
      ? (costs[middleIndex - 1] + costs[middleIndex]) / 2
      : costs[middleIndex];
    
    // Calculate variance
    const squaredDiffs = costs.map(cost => Math.pow(cost - averageCost, 2));
    const variance = squaredDiffs.reduce((total, diff) => total + diff, 0) / totalItems;
    
    return {
      averageCost,
      minCost,
      maxCost,
      median,
      totalItems,
      variance
    };
  }, [filteredData, useAdjustedCosts]);

  // Format data for charts
  const chartData = useMemo(() => {
    if (chartType === 'pie') {
      // For Pie chart, we want to show region distribution
      return regionAverages.map((item, index) => ({
        name: item.region,
        value: item.averageCost,
        count: item.count,
        color: COLORS[index % COLORS.length]
      }));
    } else {
      // For Bar and Line charts, we show all filtered items
      return filteredData.map(item => ({
        ...item,
        cost: useAdjustedCosts ? item.adjustedBaseCost : item.baseCost
      }));
    }
  }, [chartType, regionAverages, filteredData, useAdjustedCosts]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (chartType === 'pie') {
        return (
          <div className="bg-white p-3 border rounded shadow-sm">
            <p className="text-sm font-medium">{payload[0].name}</p>
            <p className="text-sm">Average Cost: {formatCurrency(payload[0].value)}</p>
            <p className="text-sm text-muted-foreground">Count: {payload[0].payload.count}</p>
          </div>
        );
      } else {
        return (
          <div className="bg-white p-3 border rounded shadow-sm">
            <p className="text-sm font-medium">{payload[0].payload.region}</p>
            <p className="text-sm">{payload[0].payload.buildingType} - {payload[0].payload.buildingTypeDescription}</p>
            <p className="text-sm">Cost: {formatCurrency(payload[0].value)}</p>
            <p className="text-xs text-muted-foreground">Complexity Factor: {formatNumber(payload[0].payload.complexityFactorBase)}</p>
            <p className="text-xs text-muted-foreground">Quality Factor: {formatNumber(payload[0].payload.qualityFactorBase)}</p>
          </div>
        );
      }
    }
    return null;
  };

  // Handle region selection
  const handleRegionChange = (region: string) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  // Handle building type selection
  const handleBuildingTypeChange = (type: string) => {
    setSelectedBuildingTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Handle export data
  const handleExportData = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = 'regional_cost_comparison_data.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Data Exported",
      description: "Regional cost comparison data has been exported to JSON",
      duration: 3000
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-[400px] bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800">Failed to load cost matrix data</h3>
          <p className="text-red-600">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and controls */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Region Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Map className="mr-2 h-4 w-4" /> 
                Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {regions.map(region => (
                  <Badge 
                    key={region} 
                    variant={selectedRegions.includes(region) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleRegionChange(region)}
                  >
                    {region}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Building Type Filter */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <Building2 className="mr-2 h-4 w-4" /> 
                Building Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {buildingTypes.map(type => (
                  <Badge 
                    key={type} 
                    variant={selectedBuildingTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleBuildingTypeChange(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chart Type and Cost Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Chart Type</label>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant={chartType === 'bar' ? "default" : "outline"}
                    onClick={() => setChartType('bar')}
                  >
                    <BarChartIcon className="h-4 w-4 mr-1" /> Bar
                  </Button>
                  <Button 
                    size="sm" 
                    variant={chartType === 'line' ? "default" : "outline"}
                    onClick={() => setChartType('line')}
                  >
                    <LineChartIcon className="h-4 w-4 mr-1" /> Line
                  </Button>
                  <Button 
                    size="sm" 
                    variant={chartType === 'pie' ? "default" : "outline"}
                    onClick={() => setChartType('pie')}
                  >
                    <PieChartIcon className="h-4 w-4 mr-1" /> Pie
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cost Type</label>
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant={useAdjustedCosts ? "default" : "outline"}
                    onClick={() => setUseAdjustedCosts(true)}
                  >
                    Adjusted
                  </Button>
                  <Button 
                    size="sm" 
                    variant={!useAdjustedCosts ? "default" : "outline"}
                    onClick={() => setUseAdjustedCosts(false)}
                  >
                    Base
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Adjustment Factors */}
        <Accordion type="single" collapsible className="bg-white rounded-lg border">
          <AccordionItem value="adjustment-factors" className="border-none">
            <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-gray-50">
              <div className="flex items-center">
                <span className="font-medium">Adjustment Factors</span>
                <Badge variant="outline" className="ml-2">
                  C: {formatNumber(complexityFactor, 2)} | Q: {formatNumber(qualityFactor, 2)} | Co: {formatNumber(conditionFactor, 2)}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Complexity Factor:</label>
                    <span className="text-sm">{formatNumber(complexityFactor, 2)}</span>
                  </div>
                  <Slider
                    value={[complexityFactor]}
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    onValueChange={(values) => setComplexityFactor(values[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Quality Factor:</label>
                    <span className="text-sm">{formatNumber(qualityFactor, 2)}</span>
                  </div>
                  <Slider
                    value={[qualityFactor]}
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    onValueChange={(values) => setQualityFactor(values[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Condition Factor:</label>
                    <span className="text-sm">{formatNumber(conditionFactor, 2)}</span>
                  </div>
                  <Slider
                    value={[conditionFactor]}
                    min={0.5}
                    max={1.5}
                    step={0.01}
                    onValueChange={(values) => setConditionFactor(values[0])}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Average Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.averageCost)}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Min/Max Range</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.minCost)} - {formatCurrency(statistics.maxCost)}</p>
              </div>
              <div className="bg-amber-100 p-2 rounded-full">
                <ArrowUpRight className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Median Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(statistics.median)}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full">
                <ArrowDownRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Total Data Points</p>
                <p className="text-2xl font-bold">{statistics.totalItems}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full">
                <BarChartIcon className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Charts and Tables */}
      <Tabs defaultValue="chart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chart">Charts</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>
        
        {/* Charts Tab */}
        <TabsContent value="chart" className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Cost Analysis Visualization</h3>
            
            <div className="h-[400px]">
              {chartType === 'bar' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="buildingType" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="cost" name="Cost" fill="#8884d8" />
                    <Brush dataKey="buildingType" height={30} stroke="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              
              {chartType === 'line' && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="buildingType" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" name="Cost" stroke="#8884d8" activeDot={{ r: 8 }} />
                    <Brush dataKey="buildingType" height={30} stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              )}
              
              {chartType === 'pie' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={'color' in entry ? entry.color : COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* Table Tab */}
        <TabsContent value="table">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>Building Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Base Cost</TableHead>
                  <TableHead>Adjusted Cost</TableHead>
                  <TableHead>Factors (C/Q/Co)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.region}</TableCell>
                    <TableCell>{item.buildingType}</TableCell>
                    <TableCell>{item.buildingTypeDescription}</TableCell>
                    <TableCell>{formatCurrency(item.baseCost)}</TableCell>
                    <TableCell>{formatCurrency(item.adjustedBaseCost)}</TableCell>
                    <TableCell>
                      {formatNumber(item.complexityFactorBase * complexityFactor, 2)} / {formatNumber(item.qualityFactorBase * qualityFactor, 2)} / {formatNumber(item.conditionFactorBase * conditionFactor, 2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Region Comparison</CardTitle>
                <CardDescription>Average costs by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionAverages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="averageCost" name="Average Cost" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Building Type Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Building Type Comparison</CardTitle>
                <CardDescription>Average costs by building type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={buildingTypeAverages}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="buildingType" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Bar dataKey="averageCost" name="Average Cost" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Detailed Comparison</span>
                <Button size="sm" variant="outline" onClick={handleExportData}>
                  Export Data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Region Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Regions</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Region</TableHead>
                        <TableHead>Avg. Cost</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regionAverages.map(region => (
                        <TableRow key={region.region}>
                          <TableCell className="font-medium">{region.region}</TableCell>
                          <TableCell>{formatCurrency(region.averageCost)}</TableCell>
                          <TableCell>{region.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Building Type Details */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Building Types</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Avg. Cost</TableHead>
                        <TableHead>Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buildingTypeAverages.map(type => (
                        <TableRow key={type.buildingType}>
                          <TableCell className="font-medium" title={type.description}>
                            {type.buildingType}
                          </TableCell>
                          <TableCell>{formatCurrency(type.averageCost)}</TableCell>
                          <TableCell>{type.count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RegionalCostComparison;