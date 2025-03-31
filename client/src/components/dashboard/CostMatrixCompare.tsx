import React, { useState, useEffect } from 'react';
import { useCostMatrix } from '@/hooks/use-cost-matrix';
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
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  CheckIcon, 
  XIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  DiffIcon,
  RefreshCcwIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge-custom';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MatrixDiff {
  buildingType: string;
  region: string;
  year1: number;
  year2: number;
  baseCost1: number;
  baseCost2: number;
  difference: number;
  percentageChange: number;
}

export default function CostMatrixCompare() {
  const { getAll: getAllMatrices } = useCostMatrix();
  const matrices = getAllMatrices.data || [];
  
  const [matrix1Id, setMatrix1Id] = useState<string>('');
  const [matrix2Id, setMatrix2Id] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('table');
  const [diffResults, setDiffResults] = useState<MatrixDiff[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>({
    increases: 0,
    decreases: 0,
    noChange: 0,
    averageChange: 0,
    maxIncrease: { value: 0, type: '', region: '' },
    maxDecrease: { value: 0, type: '', region: '' },
  });
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Organize matrices by year for easier selection
  const matricesByYear = matrices.reduce((acc: { [key: string]: any[] }, matrix: any) => {
    const year = matrix.matrixYear;
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(matrix);
    return acc;
  }, {});
  
  // Available years for comparison
  const years = Object.keys(matricesByYear).sort((a, b) => Number(b) - Number(a));

  // Calculate the difference between two matrices
  const calculateDiff = () => {
    if (!matrix1Id || !matrix2Id || matrix1Id === matrix2Id) {
      return;
    }
    
    setIsComparing(true);
    
    // Find the selected matrices
    const matrix1 = matrices.find((m: any) => m.id === Number(matrix1Id));
    const matrix2 = matrices.find((m: any) => m.id === Number(matrix2Id));
    
    if (!matrix1 || !matrix2) {
      setIsComparing(false);
      return;
    }
    
    // Create comparison data
    // In a real implementation, this would make an API call to get detailed data
    // For now, we'll simulate some differences based on the matrices we have
    
    setTimeout(() => {
      // Generate comparison data for each building type and region combination
      const buildingTypes = [...new Set(matrices.map((m: any) => m.buildingType))];
      const regions = [...new Set(matrices.map((m: any) => m.region))];
      
      const results: MatrixDiff[] = [];
      let totalChange = 0;
      let increases = 0;
      let decreases = 0;
      let noChange = 0;
      let maxIncrease = { value: 0, type: '', region: '' };
      let maxDecrease = { value: 0, type: '', region: '' };
      
      buildingTypes.forEach(type => {
        regions.forEach(region => {
          // Get base costs from matrices (or simulate them)
          const baseCost1 = Number(matrix1.baseCost || (Math.random() * 200 + 100).toFixed(2));
          const baseCost2 = Number(matrix2.baseCost || (Math.random() * 200 + 100).toFixed(2));
          
          const difference = baseCost2 - baseCost1;
          const percentageChange = (difference / baseCost1) * 100;
          
          // Track statistics
          totalChange += percentageChange;
          
          if (percentageChange > 0) {
            increases++;
            if (percentageChange > maxIncrease.value) {
              maxIncrease = { value: percentageChange, type, region };
            }
          } else if (percentageChange < 0) {
            decreases++;
            if (percentageChange < maxDecrease.value) {
              maxDecrease = { value: percentageChange, type, region };
            }
          } else {
            noChange++;
          }
          
          results.push({
            buildingType: type,
            region,
            year1: matrix1.matrixYear,
            year2: matrix2.matrixYear,
            baseCost1,
            baseCost2,
            difference,
            percentageChange
          });
        });
      });
      
      // Calculate average change
      const averageChange = totalChange / results.length;
      
      setDiffResults(results);
      setSummaryStats({
        increases,
        decreases,
        noChange,
        averageChange,
        maxIncrease,
        maxDecrease
      });
      
      setIsComparing(false);
    }, 1000); // Simulate API delay
  };
  
  // Format currency for display
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };
  
  // Reset comparison
  const resetComparison = () => {
    setMatrix1Id('');
    setMatrix2Id('');
    setDiffResults([]);
    setSummaryStats({
      increases: 0,
      decreases: 0,
      noChange: 0,
      averageChange: 0,
      maxIncrease: { value: 0, type: '', region: '' },
      maxDecrease: { value: 0, type: '', region: '' },
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DiffIcon className="h-5 w-5" />
          Cost Matrix Comparison
        </CardTitle>
        <CardDescription>
          Compare building costs between different matrix years to analyze trends and changes.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium">Base Matrix (Earlier Year)</label>
            <Select 
              value={matrix1Id} 
              onValueChange={setMatrix1Id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select base matrix" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={`year-${year}`} value={`year-${year}`} disabled>
                    {year}
                  </SelectItem>
                ))}
                {matrices.map((matrix: any) => (
                  <SelectItem key={matrix.id} value={String(matrix.id)}>
                    {matrix.matrixYear} - {matrix.region} - {matrix.buildingType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium">Comparison Matrix (Later Year)</label>
            <Select 
              value={matrix2Id} 
              onValueChange={setMatrix2Id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select comparison matrix" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={`year-${year}`} value={`year-${year}`} disabled>
                    {year}
                  </SelectItem>
                ))}
                {matrices.map((matrix: any) => (
                  <SelectItem key={matrix.id} value={String(matrix.id)}>
                    {matrix.matrixYear} - {matrix.region} - {matrix.buildingType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <Button 
            onClick={calculateDiff} 
            disabled={!matrix1Id || !matrix2Id || isComparing}
          >
            {isComparing ? (
              <>
                <RefreshCcwIcon className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
              <>
                <DiffIcon className="mr-2 h-4 w-4" />
                Compare Matrices
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetComparison}
            disabled={isComparing || (!matrix1Id && !matrix2Id)}
          >
            Reset
          </Button>
        </div>
        
        {isComparing && (
          <div className="mb-6">
            <Progress value={50} className="w-full" />
            <p className="text-sm text-center mt-2">Processing comparison...</p>
          </div>
        )}
        
        {diffResults.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUpIcon className="mr-2 h-4 w-4 text-green-500" />
                    Increases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.increases}</div>
                  <p className="text-sm text-muted-foreground">building costs increased</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <TrendingDownIcon className="mr-2 h-4 w-4 text-red-500" />
                    Decreases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryStats.decreases}</div>
                  <p className="text-sm text-muted-foreground">building costs decreased</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    Average Change
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercentage(summaryStats.averageChange)}
                  </div>
                  <p className="text-sm text-muted-foreground">average cost change</p>
                </CardContent>
              </Card>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="chart">Chart View</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table">
                <Table>
                  <TableCaption>
                    Cost Matrix Comparison: {diffResults[0]?.year1} vs {diffResults[0]?.year2}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Building Type</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>{diffResults[0]?.year1} Cost</TableHead>
                      <TableHead>{diffResults[0]?.year2} Cost</TableHead>
                      <TableHead>Difference</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diffResults.map((diff, index) => (
                      <TableRow key={index}>
                        <TableCell>{diff.buildingType}</TableCell>
                        <TableCell>{diff.region}</TableCell>
                        <TableCell>{formatCurrency(diff.baseCost1)}</TableCell>
                        <TableCell>{formatCurrency(diff.baseCost2)}</TableCell>
                        <TableCell>{formatCurrency(diff.difference)}</TableCell>
                        <TableCell>
                          <Badge variant={diff.percentageChange > 0 ? 'danger' : diff.percentageChange < 0 ? 'success' : 'default'}>
                            {diff.percentageChange > 0 ? (
                              <TrendingUpIcon className="mr-1 h-3 w-3" />
                            ) : diff.percentageChange < 0 ? (
                              <TrendingDownIcon className="mr-1 h-3 w-3" />
                            ) : (
                              <span className="mr-1">→</span>
                            )}
                            {formatPercentage(diff.percentageChange)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="chart">
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={diffResults}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="buildingType" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      <Legend />
                      <Bar name={`${diffResults[0]?.year1} Cost`} dataKey="baseCost1" fill="#8884d8" />
                      <Bar name={`${diffResults[0]?.year2} Cost`} dataKey="baseCost2" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="summary">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Largest Cost Increases</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      The most significant cost increases between 
                      {diffResults[0]?.year1} and {diffResults[0]?.year2}:
                    </p>
                    
                    {summaryStats.maxIncrease.value > 0 ? (
                      <div className="pl-4 border-l-2 border-green-500">
                        <p className="font-medium">
                          {summaryStats.maxIncrease.type} in {summaryStats.maxIncrease.region}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Increased by {formatPercentage(summaryStats.maxIncrease.value)}
                        </p>
                      </div>
                    ) : (
                      <p>No cost increases found.</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Largest Cost Decreases</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      The most significant cost decreases between 
                      {diffResults[0]?.year1} and {diffResults[0]?.year2}:
                    </p>
                    
                    {summaryStats.maxDecrease.value < 0 ? (
                      <div className="pl-4 border-l-2 border-red-500">
                        <p className="font-medium">
                          {summaryStats.maxDecrease.type} in {summaryStats.maxDecrease.region}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Decreased by {formatPercentage(Math.abs(summaryStats.maxDecrease.value))}
                        </p>
                      </div>
                    ) : (
                      <p>No cost decreases found.</p>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Overall Analysis</h3>
                    <p className="text-sm">
                      Between {diffResults[0]?.year1} and {diffResults[0]?.year2}, 
                      building costs have {summaryStats.averageChange > 0 ? 'increased' : 'decreased'} by 
                      an average of {formatPercentage(Math.abs(summaryStats.averageChange))}.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                      <li>
                        {summaryStats.increases} building types showed an increase in cost
                      </li>
                      <li>
                        {summaryStats.decreases} building types showed a decrease in cost
                      </li>
                      <li>
                        {summaryStats.noChange} building types showed no change in cost
                      </li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Compare cost matrices to understand cost evolution over time.
        </p>
      </CardFooter>
    </Card>
  );
}