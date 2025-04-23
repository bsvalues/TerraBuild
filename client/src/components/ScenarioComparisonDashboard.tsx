import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Copy, Trash2, BarChart3, ArrowRight, Info, Plus, GitCompare, FileDown, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CalculationResult } from './BCBSCostCalculatorAPI';

// Helper function to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Helper function to calculate percent difference
const calculatePercentDifference = (value1: number, value2: number) => {
  if (value1 === 0) return 0;
  return ((value2 - value1) / value1) * 100;
};

interface ScenarioComparisonDashboardProps {
  savedScenarios: CalculationResult[];
  onDeleteScenario: (index: number) => void;
  onClearAllScenarios: () => void;
  onExportComparison: () => void;
}

export default function ScenarioComparisonDashboard({
  savedScenarios,
  onDeleteScenario,
  onClearAllScenarios,
  onExportComparison
}: ScenarioComparisonDashboardProps) {
  const [activeTab, setActiveTab] = useState('table');
  
  // If no scenarios, show empty state
  if (savedScenarios.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Scenario Comparison Dashboard</CardTitle>
          <CardDescription>
            Save calculation results to compare different building scenarios side by side
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GitCompare className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium mb-2">No scenarios saved yet</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Calculate building costs with different parameters and save them as scenarios to compare side by side.
            </p>
            <Badge variant="outline" className="mb-2">
              <Info className="h-3 w-3 mr-1" />
              Tip: Click "Save as Scenario" after calculating costs
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const comparisonData = savedScenarios.map((scenario, index) => ({
    name: `Scenario ${index + 1}`,
    totalCost: scenario.totalCost || 0,
    costPerSqft: scenario.costPerSqft || 0,
    squareFootage: scenario.squareFootage || 0,
    buildingType: scenario.buildingType || 'Unknown',
    region: scenario.region || 'Unknown',
    complexity: scenario.complexityFactor || 1,
    condition: scenario.conditionFactor || 1,
  }));

  // Calculate potential savings (difference between highest and lowest cost)
  const highestCost = Math.max(...savedScenarios.map(s => s.totalCost || 0));
  const lowestCost = Math.min(...savedScenarios.map(s => s.totalCost || 0));
  const potentialSavings = highestCost - lowestCost;
  const percentSavings = calculatePercentDifference(highestCost, lowestCost);

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Scenario Comparison Dashboard</CardTitle>
          <CardDescription>
            Compare different building scenarios side by side
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onClearAllScenarios}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Clear All</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear all saved scenarios</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onExportComparison}>
                  <FileDown className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export comparison as PDF</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Summary Alert - show potential savings */}
        {potentialSavings > 0 && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <Info className="h-4 w-4 text-green-700" />
            <AlertTitle>Potential Cost Savings Identified</AlertTitle>
            <AlertDescription>
              Choosing the most cost-effective scenario could save up to {formatCurrency(potentialSavings)} ({Math.abs(percentSavings).toFixed(1)}% difference)
            </AlertDescription>
          </Alert>
        )}
        
        {/* Comparison Tabs */}
        <Tabs defaultValue="table" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="chart">Cost Chart</TabsTrigger>
            <TabsTrigger value="factors">Factor Comparison</TabsTrigger>
          </TabsList>
          
          {/* Table View */}
          <TabsContent value="table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scenario</TableHead>
                    <TableHead>Building Type</TableHead>
                    <TableHead>Square Feet</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Complexity</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead className="text-right">Cost per sqft</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedScenarios.map((scenario, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">Scenario {index + 1}</TableCell>
                      <TableCell>{scenario.buildingType || 'Unknown'}</TableCell>
                      <TableCell>{scenario.squareFootage?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        {scenario.region ? scenario.region.replace(/_/g, ' ') : 'Unknown'}
                      </TableCell>
                      <TableCell>{scenario.complexityFactor?.toFixed(2) || '1.00'}</TableCell>
                      <TableCell>{scenario.conditionFactor?.toFixed(2) || '1.00'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(scenario.costPerSqft || 0)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(scenario.totalCost || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => onDeleteScenario(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Chart View */}
          <TabsContent value="chart">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  <Bar dataKey="totalCost" name="Total Cost" fill="#0088FE">
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.totalCost === lowestCost ? '#00C49F' : '#0088FE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-center text-gray-500 mt-2">
              Note: The lowest cost scenario is highlighted in green
            </div>
          </TabsContent>
          
          {/* Factor Comparison View */}
          <TabsContent value="factors">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost per Square Foot Comparison */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Cost per Square Foot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(value)}
                          labelFormatter={(label) => `${label}`}
                        />
                        <Bar dataKey="costPerSqft" name="Cost per sq ft" fill="#00C49F" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Complexity vs Condition Factors */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Complexity vs Condition Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparisonData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 3]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="complexity" name="Complexity Factor" fill="#8884d8" />
                        <Bar dataKey="condition" name="Condition Factor" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-gray-500">
          {savedScenarios.length} scenario{savedScenarios.length !== 1 ? 's' : ''} saved
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => setActiveTab(activeTab === 'table' ? 'chart' : activeTab === 'chart' ? 'factors' : 'table')}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Switch View
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}