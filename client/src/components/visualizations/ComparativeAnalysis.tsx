/**
 * Comparative Analysis Component
 * 
 * A visualization component that enables side-by-side comparison of
 * building costs across multiple regions, types, or time periods.
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis
} from 'recharts';
import {
  Plus,
  Trash2,
  LineChart as LineChartIcon,
  BarChart as BarChartIcon,
  PieChart,
  AlertTriangle,
  Info,
  Download,
  BarChart2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVisualizationContext } from '@/contexts/visualization-context';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface ComparisonItem {
  id: number;
  region: string;
  buildingType: string;
  baseCost: number;
  adjustedCost: number;
  complexityFactor: number;
  qualityFactor: number;
  conditionFactor: number;
  metadata: {
    county?: string;
    state?: string;
    yearBuilt?: number;
    lastUpdated?: string;
  };
  isComplete: boolean;
}

type VisualizationType = 'bar' | 'line' | 'radial';

interface ComparativeAnalysisProps {
  maxComparisons?: number;
  defaultVisualizationType?: VisualizationType;
  className?: string;
}

export function ComparativeAnalysis({
  maxComparisons = 3,
  defaultVisualizationType = 'bar',
  className = '',
}: ComparativeAnalysisProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>('');
  const [comparisonItems, setComparisonItems] = useState<ComparisonItem[]>([]);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [visualizationType, setVisualizationType] = useState<VisualizationType>(defaultVisualizationType);
  const [hasIncompleteData, setHasIncompleteData] = useState(false);

  const { filters } = useVisualizationContext();

  // Color palette for visualizations
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

  // Fetch cost matrix data
  const { data: costMatrixData, isLoading } = useQuery({
    queryKey: ['/api/cost-matrix'],
  });

  // Extract available regions and building types from data
  const regions = costMatrixData && Array.isArray(costMatrixData)
    ? Array.from(new Set(costMatrixData.map((item: any) => item.region)))
    : [];

  const buildingTypes = costMatrixData && Array.isArray(costMatrixData)
    ? Array.from(new Set(costMatrixData.map((item: any) => item.buildingType)))
    : [];

  // Check for incomplete data
  useEffect(() => {
    const incomplete = comparisonItems.some(item => !item.isComplete);
    setHasIncompleteData(incomplete);
  }, [comparisonItems]);

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Add item to comparison
  const addComparisonItem = () => {
    if (!selectedRegion || !selectedBuildingType) return;
    if (comparisonItems.length >= maxComparisons) return;

    // Find matching data
    const matchingItem = costMatrixData && Array.isArray(costMatrixData)
      ? costMatrixData.find((item: any) => 
          item.region === selectedRegion && 
          item.buildingType === selectedBuildingType
        )
      : null;

    if (matchingItem) {
      // Check if data is complete
      const isComplete = Boolean(
        matchingItem.baseCost !== undefined &&
        matchingItem.complexityFactorBase !== undefined &&
        matchingItem.qualityFactorBase !== undefined &&
        matchingItem.conditionFactorBase !== undefined
      );

      const newItem: ComparisonItem = {
        id: matchingItem.id,
        region: matchingItem.region,
        buildingType: matchingItem.buildingType,
        baseCost: matchingItem.baseCost || 0,
        adjustedCost: (matchingItem.baseCost || 0) * (1 + 
          (matchingItem.complexityFactorBase || 0) + 
          (matchingItem.qualityFactorBase || 0) + 
          (matchingItem.conditionFactorBase || 0)
        ),
        complexityFactor: matchingItem.complexityFactorBase || 0,
        qualityFactor: matchingItem.qualityFactorBase || 0,
        conditionFactor: matchingItem.conditionFactorBase || 0,
        metadata: {
          county: matchingItem.county,
          state: matchingItem.state || 'Washington',
          yearBuilt: 2023, // Default year for new data
          lastUpdated: new Date().toLocaleDateString(),
        },
        isComplete
      };

      setComparisonItems(prev => [...prev, newItem]);
      setSelectedRegion('');
      setSelectedBuildingType('');
      setShowComparisonDialog(false);
    }
  };

  // Remove item from comparison
  const removeComparisonItem = (index: number) => {
    setComparisonItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate percentage difference between two items
  const calculatePercentageDifference = (value1: number, value2: number) => {
    if (value1 === 0) return 'N/A';
    
    const diff = ((value2 - value1) / value1) * 100;
    return `${diff.toFixed(1)}%`;
  };

  // Generate comparison data for charting
  const generateComparisonChartData = () => {
    if (comparisonItems.length === 0) return [];

    return [
      {
        name: 'Base Cost',
        ...comparisonItems.reduce((acc, item, index) => {
          acc[`item${index}`] = item.baseCost;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        name: 'Adjusted Cost',
        ...comparisonItems.reduce((acc, item, index) => {
          acc[`item${index}`] = item.adjustedCost;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        name: 'Complexity Factor',
        ...comparisonItems.reduce((acc, item, index) => {
          acc[`item${index}`] = item.baseCost * item.complexityFactor;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        name: 'Quality Factor',
        ...comparisonItems.reduce((acc, item, index) => {
          acc[`item${index}`] = item.baseCost * item.qualityFactor;
          return acc;
        }, {} as Record<string, number>)
      },
      {
        name: 'Condition Factor',
        ...comparisonItems.reduce((acc, item, index) => {
          acc[`item${index}`] = item.baseCost * item.conditionFactor;
          return acc;
        }, {} as Record<string, number>)
      }
    ];
  };

  // Generate radial chart data
  const generateRadialChartData = () => {
    const result: any[] = [];
    
    comparisonItems.forEach((item, index) => {
      // Base cost entry
      result.push({
        name: `${item.region} Base`,
        value: item.baseCost,
        itemIndex: index,
        fill: colors[index % colors.length]
      });
      
      // Adjusted cost entry
      result.push({
        name: `${item.region} Adjusted`,
        value: item.adjustedCost,
        itemIndex: index,
        fill: colors[index % colors.length],
        opacity: 0.7
      });
    });
    
    return result;
  };

  // Export comparison data as CSV
  const exportComparisonData = () => {
    if (comparisonItems.length === 0) return;

    // Generate headers and data rows
    const headers = ['Attribute', ...comparisonItems.map(item => `${item.region} - ${item.buildingType}`)];
    
    const rows = [
      ['Base Cost', ...comparisonItems.map(item => item.baseCost.toString())],
      ['Adjusted Cost', ...comparisonItems.map(item => item.adjustedCost.toString())],
      ['Complexity Factor', ...comparisonItems.map(item => item.complexityFactor.toString())],
      ['Quality Factor', ...comparisonItems.map(item => item.qualityFactor.toString())],
      ['Condition Factor', ...comparisonItems.map(item => item.conditionFactor.toString())],
      ['Region', ...comparisonItems.map(item => item.region)],
      ['Building Type', ...comparisonItems.map(item => item.buildingType)],
      ['County', ...comparisonItems.map(item => item.metadata.county || 'N/A')],
      ['State', ...comparisonItems.map(item => item.metadata.state || 'N/A')],
    ];

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'building_cost_comparison.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Empty state when no items are selected
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-md p-6">
      <Plus className="h-8 w-8 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium mb-1">Select Items to Compare</h3>
      <p className="text-center text-sm text-muted-foreground mb-4">
        Add building cost data points to perform a side-by-side comparison
      </p>
      <Button 
        onClick={() => setShowComparisonDialog(true)}
        data-testid="add-comparison-item"
      >
        Add Item
      </Button>
    </div>
  );

  // Render bar chart visualization
  const renderBarChart = () => (
    <div className="h-80" data-testid="comparison-bar-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={generateComparisonChartData()}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          {comparisonItems.map((_, index) => (
            <Bar 
              key={index} 
              dataKey={`item${index}`} 
              name={`${comparisonItems[index].region} - ${comparisonItems[index].buildingType}`} 
              fill={colors[index % colors.length]} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  // Render line chart visualization
  const renderLineChart = () => (
    <div className="h-80" data-testid="comparison-line-chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={generateComparisonChartData()}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          {comparisonItems.map((_, index) => (
            <Line 
              key={index} 
              type="monotone" 
              dataKey={`item${index}`} 
              name={`${comparisonItems[index].region} - ${comparisonItems[index].buildingType}`} 
              stroke={colors[index % colors.length]} 
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  // Render radial chart visualization
  const renderRadialChart = () => (
    <div className="h-80" data-testid="comparison-radial-chart">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart 
          cx="50%" 
          cy="50%" 
          innerRadius="10%" 
          outerRadius="90%" 
          data={generateRadialChartData()} 
          startAngle={180} 
          endAngle={0}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, Math.max(...comparisonItems.map(item => item.adjustedCost)) * 1.1]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            dataKey="value"
            background
          />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
            content={(props) => {
              // Simplified legend that doesn't rely on custom payload properties
              return (
                <ul className="text-xs">
                  {comparisonItems.map((item, index) => (
                    <li key={`item-${index}`} className="flex items-center mb-1">
                      <span
                        className="w-3 h-3 mr-2 inline-block"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span>{item.region} - {item.buildingType}</span>
                    </li>
                  ))}
                </ul>
              );
            }}
          />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );

  // Render detailed comparison table
  const renderComparisonTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>Cost comparison data for selected regions and building types</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Attribute</TableHead>
            {comparisonItems.map((item, index) => (
              <TableHead key={index} className="text-right">
                {item.region} - {item.buildingType}
              </TableHead>
            ))}
            {comparisonItems.length > 1 && <TableHead className="text-right">Difference</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">Base Cost</TableCell>
            {comparisonItems.map((item, index) => (
              <TableCell key={index} className="text-right">
                {formatCurrency(item.baseCost)}
              </TableCell>
            ))}
            {comparisonItems.length > 1 && (
              <TableCell 
                className="text-right font-medium"
                data-testid={`percentage-difference-0-1`}
              >
                {calculatePercentageDifference(comparisonItems[0].baseCost, comparisonItems[1].baseCost)}
              </TableCell>
            )}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Adjusted Cost</TableCell>
            {comparisonItems.map((item, index) => (
              <TableCell key={index} className="text-right">
                {formatCurrency(item.adjustedCost)}
              </TableCell>
            ))}
            {comparisonItems.length > 1 && (
              <TableCell className="text-right font-medium">
                {calculatePercentageDifference(comparisonItems[0].adjustedCost, comparisonItems[1].adjustedCost)}
              </TableCell>
            )}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Complexity Factor</TableCell>
            {comparisonItems.map((item, index) => (
              <TableCell key={index} className="text-right">
                {(item.complexityFactor * 100).toFixed(1)}%
              </TableCell>
            ))}
            {comparisonItems.length > 1 && (
              <TableCell className="text-right font-medium">
                {((comparisonItems[1].complexityFactor - comparisonItems[0].complexityFactor) * 100).toFixed(1)}%
              </TableCell>
            )}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Quality Factor</TableCell>
            {comparisonItems.map((item, index) => (
              <TableCell key={index} className="text-right">
                {(item.qualityFactor * 100).toFixed(1)}%
              </TableCell>
            ))}
            {comparisonItems.length > 1 && (
              <TableCell className="text-right font-medium">
                {((comparisonItems[1].qualityFactor - comparisonItems[0].qualityFactor) * 100).toFixed(1)}%
              </TableCell>
            )}
          </TableRow>
          <TableRow>
            <TableCell className="font-medium">Condition Factor</TableCell>
            {comparisonItems.map((item, index) => (
              <TableCell key={index} className="text-right">
                {(item.conditionFactor * 100).toFixed(1)}%
              </TableCell>
            ))}
            {comparisonItems.length > 1 && (
              <TableCell className="text-right font-medium">
                {((comparisonItems[1].conditionFactor - comparisonItems[0].conditionFactor) * 100).toFixed(1)}%
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );

  // Render comparison dialog for adding items
  const renderComparisonDialog = () => (
    <Card className="shadow-md mt-4">
      <CardHeader>
        <CardTitle className="text-base">Add Comparison Item</CardTitle>
        <CardDescription>
          Select a region and building type to add to the comparison
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Region</label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region: string) => (
                  <SelectItem key={region} value={region}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Building Type</label>
            <Select value={selectedBuildingType} onValueChange={setSelectedBuildingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a building type" />
              </SelectTrigger>
              <SelectContent>
                {buildingTypes.map((type: string) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setShowComparisonDialog(false)}>
          Cancel
        </Button>
        <Button 
          onClick={addComparisonItem}
          disabled={!selectedRegion || !selectedBuildingType}
        >
          Add to Comparison
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className={className}>
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Comparative Analysis</CardTitle>
              <CardDescription>
                Compare building costs across different regions and building types
              </CardDescription>
            </div>
            
            {comparisonItems.length > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportComparisonData}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowComparisonDialog(true)}
                  disabled={comparisonItems.length >= maxComparisons}
                  data-testid="add-comparison-item"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            )}
          </div>
          
          {comparisonItems.length >= maxComparisons && (
            <p className="text-xs text-amber-600 mt-1">
              Maximum of {maxComparisons} items can be compared
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading data...</p>
              </div>
            </div>
          ) : comparisonItems.length === 0 ? (
            renderEmptyState()
          ) : (
            <div className="space-y-4">
              {hasIncompleteData && (
                <Alert className="bg-amber-50 border-amber-200" data-testid="incomplete-data-warning">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Incomplete Data</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Some items have incomplete data, which may affect comparison accuracy.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-wrap gap-2 mb-4">
                {comparisonItems.map((item, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="flex items-center gap-1 pl-2"
                    style={{ borderColor: colors[index % colors.length] }}
                  >
                    <span className="font-medium">{item.region} Region</span>
                    <span className="text-muted-foreground">({item.buildingType})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground"
                      onClick={() => removeComparisonItem(index)}
                      data-testid={`remove-comparison-item-${index}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              
              <div className="flex justify-center mb-4">
                <Tabs defaultValue="bar" value={visualizationType} onValueChange={(v) => setVisualizationType(v as VisualizationType)}>
                  <TabsList>
                    <TabsTrigger value="bar" data-testid="viz-type-bar">
                      <BarChartIcon className="h-4 w-4 mr-1" />
                      Bar
                    </TabsTrigger>
                    <TabsTrigger value="line" data-testid="viz-type-line">
                      <LineChartIcon className="h-4 w-4 mr-1" />
                      Line
                    </TabsTrigger>
                    <TabsTrigger value="radial" data-testid="viz-type-radial">
                      <PieChart className="h-4 w-4 mr-1" />
                      Radial
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {visualizationType === 'bar' && renderBarChart()}
              {visualizationType === 'line' && renderLineChart()}
              {visualizationType === 'radial' && renderRadialChart()}
              
              <Separator className="my-4" />
              
              {renderComparisonTable()}
            </div>
          )}
        </CardContent>
      </Card>
      
      {showComparisonDialog && renderComparisonDialog()}
    </div>
  );
}