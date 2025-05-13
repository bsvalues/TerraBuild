import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loadCostFactorsData } from '@/lib/utils/loadCostFactors';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  BarChart, 
  Buildings, 
  CheckCircle2, 
  FileBarChart, 
  Filter, 
  Map, 
  RefreshCw, 
  Search, 
  Table2,
  Calculator
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Type definitions
interface RegionInfo {
  id: string;
  category: string;
  factor: number;
  description: string;
}

const MatrixExplorerPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('regions');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Load cost factors data
  const { data: costFactors, isLoading, error } = useQuery({
    queryKey: ['costFactorsData'],
    queryFn: loadCostFactorsData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Process region data for display
  const getRegionCategory = (regionId: string): string => {
    if (regionId.match(/^\d+N-\d+E$/)) {
      return 'Township-Range';
    } else if (regionId.match(/^\d{4}/)) {
      return 'TCA';
    } else if (regionId.includes(' ')) {
      return 'Hood Code';
    } else if (['Richland', 'Kennewick', 'Prosser', 'West Richland', 'Benton City', 'Finley', 'Paterson', 'Plymouth'].includes(regionId)) {
      return 'City';
    } else {
      return 'Other';
    }
  };

  const getRegionDescription = (regionId: string): string => {
    const cityDescriptions: Record<string, string> = {
      'Richland': 'City of Richland, WA',
      'Kennewick': 'City of Kennewick, WA',
      'Prosser': 'City of Prosser, WA',
      'West Richland': 'City of West Richland, WA',
      'Benton City': 'City of Benton City, WA',
      'Finley': 'Finley area (unincorporated)',
      'Paterson': 'Paterson area (unincorporated)',
      'Plymouth': 'Plymouth area (unincorporated)'
    };

    if (cityDescriptions[regionId]) {
      return cityDescriptions[regionId];
    }

    if (regionId.match(/^\d+N-\d+E$/)) {
      return `Township ${regionId} area in Benton County`;
    } 
    
    if (regionId.match(/^\d{4}/)) {
      return `Tax Code Area ${regionId} in Benton County`;
    }
    
    if (regionId.includes(' ')) {
      const hoodCodeMatches: Record<string, string> = {
        '52100 001': 'West Benton Area (Hood Code)',
        '52100 010': 'Plymouth Area (Hood Code)',
        '52100 100': 'Richland Area (Hood Code)',
        '52100 140': 'Kennewick Area (Hood Code)',
        '52100 240': 'Prosser Area (Hood Code)',
        '52100 200': 'Rural Area (Hood Code)',
        '530300 002': 'Benton City Area (Hood Code)',
        '530300 001': 'Benton City Area (Hood Code)',
        '530300 500': 'Prosser Area (Hood Code)',
        '530200 100': 'West Richland Area (Hood Code)',
        '530200 120': 'Richland Area (Hood Code)',
        '530200 140': 'Kennewick Area (Hood Code)',
        '530200 401': 'West Richland Area (Hood Code)',
        '540100 001': 'Finley Area (Hood Code)',
        '540200 001': 'Finley Area (Hood Code)',
        '540200 100': 'Paterson Area (Hood Code)',
      };

      return hoodCodeMatches[regionId] || `Hood Code ${regionId}`;
    }

    return `Region code ${regionId}`;
  };

  const processedRegions: RegionInfo[] = React.useMemo(() => {
    if (!costFactors?.regionFactors) return [];
    
    return Object.entries(costFactors.regionFactors).map(([id, factor]) => ({
      id,
      category: getRegionCategory(id),
      factor: factor as number,
      description: getRegionDescription(id)
    }));
  }, [costFactors]);

  // Filter regions based on search term and category
  const filteredRegions = React.useMemo(() => {
    return processedRegions.filter(region => {
      const matchesSearch = 
        region.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        region.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || region.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [processedRegions, searchTerm, filterCategory]);

  // Available categories for filtering
  const categories = React.useMemo(() => {
    const uniqueCategories = Array.from(new Set(processedRegions.map(r => r.category)));
    return ['all', ...uniqueCategories.sort()];
  }, [processedRegions]);

  // Count of items by category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: processedRegions.length };
    processedRegions.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return counts;
  }, [processedRegions]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Table2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Benton County Matrix Explorer</h1>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          <AlertTitle>Loading Matrix Data</AlertTitle>
          <AlertDescription>
            Retrieving the latest Benton County cost matrix data...
          </AlertDescription>
        </Alert>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            There was an error loading the Benton County matrix data.
            {error instanceof Error && (
              <div className="mt-2 text-xs">{error.message}</div>
            )}
          </AlertDescription>
        </Alert>
      ) : costFactors ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Benton County Cost Matrix Data
              </CardTitle>
              <CardDescription>
                Explore the cost factors used in property valuations from the {costFactors.source} ({costFactors.year})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b mb-4">
                  <TabsList className="w-full justify-start border-b-0 bg-transparent px-0 mb-0">
                    <TabsTrigger 
                      value="regions" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Region Factors
                    </TabsTrigger>
                    <TabsTrigger 
                      value="quality" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Quality Factors
                    </TabsTrigger>
                    <TabsTrigger 
                      value="building" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Building Types
                    </TabsTrigger>
                    <TabsTrigger 
                      value="condition" 
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                    >
                      Condition Factors
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="regions" className="mt-0">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search regions..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="flex-shrink-0">
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger className="w-[200px] gap-2">
                          <Filter className="h-4 w-4" />
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category === 'all' ? 'All Categories' : category}{' '}
                              <span className="text-muted-foreground ml-1">
                                ({categoryCounts[category]})
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">Region ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Category</TableHead>
                          <TableHead className="w-[120px] text-right">Factor Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegions.length > 0 ? (
                          filteredRegions.map(region => (
                            <TableRow key={region.id}>
                              <TableCell className="font-mono text-sm">
                                {region.id}
                              </TableCell>
                              <TableCell>{region.description}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {region.category}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {region.factor.toFixed(2)}x
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No regions found matching your search criteria.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Showing {filteredRegions.length} of {processedRegions.length} region factors
                  </div>
                </TabsContent>
                
                <TabsContent value="quality" className="mt-0">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quality Level</TableHead>
                          <TableHead>Factor Value</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costFactors?.qualityFactors ? (
                          Object.entries(costFactors.qualityFactors).map(([level, factor]) => (
                            <TableRow key={level}>
                              <TableCell className="font-medium">{level}</TableCell>
                              <TableCell>{(factor as number).toFixed(2)}x</TableCell>
                              <TableCell>
                                {level === 'LOW' && 'Basic construction quality with minimal features'}
                                {level === 'ECONOMY' && 'Standard construction with adequate features'}
                                {level === 'STANDARD' && 'Average construction quality (baseline)'}
                                {level === 'GOOD' && 'Above average construction quality with good features'}
                                {level === 'EXCELLENT' && 'Premium construction with high-end finishes'}
                                {level === 'LUXURY' && 'Exceptional quality with luxury materials and features'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No quality factors available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="building" className="mt-0">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Building Type</TableHead>
                          <TableHead className="text-right">Base Rate ($/sqft)</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costFactors?.baseRates ? (
                          Object.entries(costFactors.baseRates).map(([type, rate]) => (
                            <TableRow key={type}>
                              <TableCell className="font-medium">{type}</TableCell>
                              <TableCell className="text-right">
                                ${(rate as number).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {type === 'RESIDENTIAL' && 'Single-family residential buildings'}
                                {type === 'COMMERCIAL' && 'Commercial and retail properties'}
                                {type === 'INDUSTRIAL' && 'Warehouses, factories and industrial spaces'}
                                {type === 'MULTIFAMILY' && 'Apartments and multi-unit residential buildings'}
                                {type === 'OFFICE' && 'Office buildings and professional spaces'}
                                {type === 'RETAIL' && 'Stores, shops and customer-facing commercial spaces'}
                                {type === 'WAREHOUSE' && 'Storage facilities and distribution centers'}
                                {type === 'AGRICULTURAL' && 'Farm buildings and agricultural structures'}
                                {type === 'SPECIALTY' && 'Unique or specialty-purpose structures'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No building base rates available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
                
                <TabsContent value="condition" className="mt-0">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Condition</TableHead>
                          <TableHead className="text-right">Factor Value</TableHead>
                          <TableHead>Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costFactors?.conditionFactors ? (
                          Object.entries(costFactors.conditionFactors).map(([condition, factor]) => (
                            <TableRow key={condition}>
                              <TableCell className="font-medium">{condition}</TableCell>
                              <TableCell className="text-right">
                                {(factor as number).toFixed(2)}x
                              </TableCell>
                              <TableCell>
                                {condition === 'POOR' && 'Building requires significant repairs, many systems failing'}
                                {condition === 'FAIR' && 'Functional but shows wear, some repairs needed'}
                                {condition === 'AVERAGE' && 'Normal wear for age, routine maintenance needed'}
                                {condition === 'GOOD' && 'Well-maintained with minor wear, no immediate repairs needed'}
                                {condition === 'EXC' && 'Like new condition with all systems recently updated'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              No condition factors available.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">
                    Updated {new Date(costFactors.lastUpdated).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate('/cost/estimate')}>
                    <Calculator className="h-4 w-4" />
                    Open Cost Wizard
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        More Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Matrix Tools</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/test-cost-factors')}>
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Test API Endpoint
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Map className="h-4 w-4 mr-2" />
                        Visualize Region Map
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Buildings className="h-4 w-4 mr-2" />
                        Building Type Analysis
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Matrix Usage Guide</CardTitle>
              <CardDescription>How to use the Benton County matrix data in your valuations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Region Identifiers</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Benton County uses several different types of geographic identifiers in their assessment system:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-1">Cities</h4>
                      <p className="text-sm text-muted-foreground">Incorporated municipalities like Richland, Kennewick, etc.</p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-1">Tax Code Areas (TCA)</h4>
                      <p className="text-sm text-muted-foreground">Numeric codes like 1111H, 1210 designating tax jurisdictions</p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-1">Hood Codes</h4>
                      <p className="text-sm text-muted-foreground">Neighborhood identifiers in format "52100 100"</p>
                    </div>
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-1">Township-Range</h4>
                      <p className="text-sm text-muted-foreground">Public Land Survey System coordinates (e.g., "10N-24E")</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Using the Matrix</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    To use this matrix data effectively in your property valuations:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm">
                    <li>Identify the appropriate region identifier for the property</li>
                    <li>Select the building type that best matches the structure</li>
                    <li>Assess the quality and condition of the building</li>
                    <li>Apply these factors to the base rate using the Cost Estimation Wizard</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default MatrixExplorerPage;