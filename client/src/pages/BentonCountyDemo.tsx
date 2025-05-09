import React, { useState } from 'react';
import { Link } from 'wouter';
import BentonBranding from '@/components/BentonBranding';
import BentonCountyHeader from '@/components/ui/benton-county-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BentonColors } from '@/components/BentonBranding';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

// Import enhanced chart components
import {
  PieChartComponent,
  BarChartComponent,
  LineChartComponent,
  RadarChartComponent
} from '@/components/charts';

// Import icons
import { 
  Building, Building2, Home, FileText, BarChart3, PieChart, 
  TrendingUp, MapPin, AlertCircle, ChevronRight, Download, 
  Search, RefreshCw, Play, BrainCircuit, ArrowUpRight, Clipboard
} from 'lucide-react';

// Sample data for the demo
const BENTON_REGIONS = [
  { id: 'west', name: 'West Benton', factor: 0.95 },
  { id: 'central', name: 'Central Benton', factor: 1.0 },
  { id: 'east', name: 'East Benton', factor: 1.05 }
];

const BUILDING_TYPES = [
  { id: 'R1', name: 'Residential - Basic', baseRate: 175.55 },
  { id: 'R2', name: 'Residential - Average', baseRate: 193.25 },
  { id: 'R3', name: 'Residential - Good', baseRate: 215.75 },
  { id: 'C1', name: 'Commercial - Basic', baseRate: 210.85 },
  { id: 'C2', name: 'Commercial - Average', baseRate: 237.50 },
  { id: 'A1', name: 'Agricultural', baseRate: 148.40 }
];

const PROPERTIES = [
  { id: '1001', address: '1234 Vineyard Rd', city: 'Prosser', region: 'west', type: 'R2', size: 2250, year: 2012 },
  { id: '1002', address: '5678 Columbia Ave', city: 'Richland', region: 'central', type: 'C1', size: 5400, year: 2005 },
  { id: '1003', address: '910 Cherry Lane', city: 'Kennewick', region: 'east', type: 'R3', size: 3100, year: 2018 },
  { id: '1004', address: '2468 Winery Way', city: 'Benton City', region: 'west', type: 'A1', size: 12000, year: 2000 },
  { id: '1005', address: '1357 River Rd', city: 'West Richland', region: 'central', type: 'R1', size: 1800, year: 1995 }
];

// Agent insights for the demo
const AGENT_INSIGHTS = [
  {
    id: 'ai1',
    type: 'value',
    title: 'Valuation Insight',
    content: 'Agricultural property values in West Benton have increased 8.3% since last assessment cycle, likely due to new vineyard development near Red Mountain AVA.',
    timestamp: '2025-05-08T10:15:00',
    confidence: 0.92
  },
  {
    id: 'ai2',
    type: 'compliance',
    title: 'Compliance Check',
    content: 'All property assessments are within compliance range of similar properties. Coefficient of Dispersion (COD) is 9.2%, below the IAAO standard of 15% for residential properties.',
    timestamp: '2025-05-08T10:17:30',
    confidence: 0.98
  },
  {
    id: 'ai3',
    type: 'recommendation',
    title: 'Cost Factor Recommendation',
    content: 'Central Benton region could benefit from sub-region division to better reflect the cost variation between north and south areas based on recent construction permit data.',
    timestamp: '2025-05-08T10:20:15',
    confidence: 0.87
  }
];

// Matrix editing history for the audit trail
const EDIT_HISTORY = [
  { 
    id: 'e1', 
    timestamp: '2025-05-07T14:22:00', 
    user: 'Admin User', 
    action: 'Updated base rate for R3 building type from $210.50 to $215.75',
    reason: 'Adjusted based on recent construction cost data from Tri-Cities Home Builders Association'
  },
  { 
    id: 'e2', 
    timestamp: '2025-05-06T11:15:00', 
    user: 'Admin User', 
    action: 'Updated regional factor for East Benton from 1.03 to 1.05',
    reason: 'Adjusted based on analysis of 2024-2025 sales data showing increased market activity'
  }
];

// Chart data for visualizations
const REGIONAL_DATA = [
  { name: 'West Benton', value: 6514, fill: BentonColors.green },
  { name: 'Central Benton', value: 11204, fill: BentonColors.lightBlue },
  { name: 'East Benton', value: 7134, fill: BentonColors.orange },
];

const BUILDING_TYPE_DATA = BUILDING_TYPES.map(type => ({
  name: type.id,
  description: type.name,
  baseRate: type.baseRate,
  westRate: type.baseRate * BENTON_REGIONS.find(r => r.id === 'west')!.factor,
  centralRate: type.baseRate * BENTON_REGIONS.find(r => r.id === 'central')!.factor,
  eastRate: type.baseRate * BENTON_REGIONS.find(r => r.id === 'east')!.factor,
}));

const TREND_DATA = [
  { year: 2020, residential: 155.2, commercial: 189.5, agricultural: 131.8 },
  { year: 2021, residential: 163.7, commercial: 198.2, agricultural: 138.4 },
  { year: 2022, residential: 175.2, commercial: 212.7, agricultural: 142.5 },
  { year: 2023, residential: 184.9, commercial: 222.3, agricultural: 143.2 },
  { year: 2024, residential: 193.6, commercial: 229.4, agricultural: 146.8 },
  { year: 2025, residential: 205.7, commercial: 237.5, agricultural: 148.4 },
];

// Format data for our chart components
interface RegionChartData {
  name: string;
  value: number;
  fill?: string;
  color?: string;
  [key: string]: any;
}

const formatRegionalDataForPieChart = (data: RegionChartData[]) => {
  return data.map(region => ({
    name: region.name,
    value: region.value,
    color: region.fill || region.color // Using color instead of fill to match our new component props
  }));
};

interface BuildingTypeData {
  id: string;
  name: string;
  description?: string;
  baseRate: number;
  centralRate?: number;
  westRate?: number;
  eastRate?: number;
  [key: string]: any;
}

const formatBuildingTypeDataForBarChart = (data: BuildingTypeData[], selectedBuildingType: string) => {
  // Prepare data for the bar chart format
  return data.map(type => ({
    name: type.name || `Type ${type.id}`,
    value: parseFloat((selectedBuildingType ? type.centralRate : type.baseRate) as any) || 0,
    description: type.description,
    fill: type.id === selectedBuildingType ? '#4338ca' : '#60a5fa',
    id: type.id
  }));
};

interface YearlyTrendData {
  year: number;
  residential?: number;
  commercial?: number;
  agricultural?: number;
  value?: number;
  [key: string]: any;
}

const formatTrendDataForLineChart = (data: YearlyTrendData[]) => {
  // Transform for line chart
  return data.map(year => ({
    name: year.year.toString(),
    value: parseFloat((year.residential || year.value || 0).toString()),
    date: `${year.year}-01-01`,
    residential: parseFloat((year.residential || 0).toString()),
    commercial: parseFloat((year.commercial || 0).toString()),
    agricultural: parseFloat((year.agricultural || 0).toString())
  }));
};

// Define interface for radar chart data
interface ValuationFactorData {
  subject: string;
  value: number;
  benchmark: number;
  [key: string]: any;
}

// Create data for radar chart to show valuation factors
const VALUATION_FACTORS: ValuationFactorData[] = [
  { subject: 'Location', value: 85, benchmark: 75 },
  { subject: 'Quality', value: 90, benchmark: 65 },
  { subject: 'Condition', value: 75, benchmark: 70 },
  { subject: 'Size', value: 85, benchmark: 80 }, 
  { subject: 'Age', value: 65, benchmark: 60 },
  { subject: 'Features', value: 78, benchmark: 70 }
];

export default function BentonCountyDemo() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRegion, setSelectedRegion] = useState('central');
  const [selectedBuildingType, setSelectedBuildingType] = useState('R2');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [matrixMode, setMatrixMode] = useState('view'); // 'view' or 'edit'
  const [showAIPanel, setShowAIPanel] = useState(true);
  
  // Get selected property details
  const propertyDetails = selectedProperty 
    ? PROPERTIES.find(p => p.id === selectedProperty) 
    : null;
  
  // Get building type details
  const buildingType = BUILDING_TYPES.find(bt => bt.id === (propertyDetails?.type || selectedBuildingType));
  
  // Get region details
  const region = BENTON_REGIONS.find(r => r.id === (propertyDetails?.region || selectedRegion));
  
  // Calculate base cost
  const baseRate = buildingType?.baseRate || 0;
  const regionFactor = region?.factor || 1;
  const squareFootage = propertyDetails?.size || 2500;
  const baseValue = baseRate * regionFactor * squareFootage;
  
  // Quality and condition factors for the calculation
  const [qualityFactor, setQualityFactor] = useState(1.0);
  const [conditionFactor, setConditionFactor] = useState(1.0);
  
  // Calculate adjusted value
  const adjustedValue = baseValue * qualityFactor * conditionFactor;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <BentonCountyHeader
        title="Benton County Building Cost Assessment System"
        subtitle="2025 Valuation Cycle - Demo"
        showHeroBackground={true}
        hideNavigation={false}
        navigationLinks={[
          { label: 'Dashboard', href: '/benton-demo', active: activeTab === 'dashboard' },
          { label: 'Property Browser', href: '/benton-demo?tab=properties', active: activeTab === 'properties' },
          { label: 'Cost Matrix', href: '/benton-demo?tab=matrix', active: activeTab === 'matrix' },
          { label: 'Analytics', href: '/benton-demo?tab=analytics', active: activeTab === 'analytics' },
          { label: 'Reports', href: '/benton-demo?tab=reports', active: activeTab === 'reports' }
        ]}
      />
      
      <div className="container mx-auto p-6">
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="matrix">Cost Matrix</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={showAIPanel}
                onCheckedChange={setShowAIPanel}
                id="ai-panel"
              />
              <Label htmlFor="ai-panel">AI Insights</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Content Area - Takes 2/3 of the space */}
            <div className="md:col-span-2 space-y-6">
              {/* Dashboard Tab */}
              <TabsContent value="dashboard" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Overview</CardTitle>
                    <CardDescription>
                      Current assessment statistics for Benton County
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-accent" />
                          <span className="text-sm font-medium">Properties</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold">24,852</div>
                          <div className="text-sm text-muted-foreground">Total assessed</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-accent" />
                          <span className="text-sm font-medium">Avg. Value Change</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold">+6.2%</div>
                          <div className="text-sm text-muted-foreground">From previous cycle</div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-accent" />
                          <span className="text-sm font-medium">Cycle Progress</span>
                        </div>
                        <div className="mt-2">
                          <div className="text-2xl font-bold">92%</div>
                          <div className="text-sm text-muted-foreground">Completion rate</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Regional Distribution</h3>
                      <PieChartComponent 
                        data={formatRegionalDataForPieChart(REGIONAL_DATA)} 
                        title="Property Distribution by Region"
                        showLegend={true}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Recent assessment and matrix updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {EDIT_HISTORY.map((edit) => (
                        <div key={edit.id} className="border-b pb-4">
                          <div className="flex justify-between">
                            <div className="font-medium">{edit.action}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(edit.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm mt-1 text-muted-foreground">{edit.reason}</div>
                          <div className="text-sm mt-1">By: {edit.user}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View All Activity
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Properties Tab */}
              <TabsContent value="properties" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Browser</CardTitle>
                    <CardDescription>
                      Browse and select properties for assessment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search properties by address, ID, or owner..."
                          className="w-full pl-9 pr-4 py-2 border rounded-md"
                        />
                      </div>
                      <Button variant="outline">
                        Filter
                      </Button>
                      <Button>
                        Search
                      </Button>
                    </div>
                    
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Property ID</th>
                            <th className="text-left p-3 text-sm font-medium">Address</th>
                            <th className="text-left p-3 text-sm font-medium">City</th>
                            <th className="text-left p-3 text-sm font-medium">Type</th>
                            <th className="text-left p-3 text-sm font-medium">Size</th>
                            <th className="text-left p-3 text-sm font-medium">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {PROPERTIES.map((property) => (
                            <tr key={property.id} className={property.id === selectedProperty ? "bg-accent/10" : "border-t"}>
                              <td className="p-3 text-sm">{property.id}</td>
                              <td className="p-3 text-sm">{property.address}</td>
                              <td className="p-3 text-sm">{property.city}</td>
                              <td className="p-3 text-sm">
                                {BUILDING_TYPES.find(bt => bt.id === property.type)?.name}
                              </td>
                              <td className="p-3 text-sm">{property.size.toLocaleString()} sq ft</td>
                              <td className="p-3 text-sm">
                                <Button 
                                  variant={property.id === selectedProperty ? "default" : "ghost"} 
                                  size="sm"
                                  onClick={() => setSelectedProperty(property.id === selectedProperty ? null : property.id)}
                                >
                                  {property.id === selectedProperty ? "Selected" : "Select"}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedProperty && propertyDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Property Assessment</CardTitle>
                      <CardDescription>
                        Assessment details for {propertyDetails.address}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium mb-3">Property Details</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Property ID:</span>
                              <span>{propertyDetails.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Address:</span>
                              <span>{propertyDetails.address}, {propertyDetails.city}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Region:</span>
                              <span>{BENTON_REGIONS.find(r => r.id === propertyDetails.region)?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Building Type:</span>
                              <span>{BUILDING_TYPES.find(bt => bt.id === propertyDetails.type)?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Size:</span>
                              <span>{propertyDetails.size.toLocaleString()} sq ft</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Year Built:</span>
                              <span>{propertyDetails.year}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-3">Assessment Factors</h3>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between mb-2">
                                <Label htmlFor="quality">Quality Factor: {qualityFactor.toFixed(2)}</Label>
                              </div>
                              <Slider
                                id="quality"
                                min={0.8}
                                max={1.2}
                                step={0.01}
                                value={[qualityFactor]}
                                onValueChange={(vals) => setQualityFactor(vals[0])}
                              />
                            </div>
                            
                            <div>
                              <div className="flex justify-between mb-2">
                                <Label htmlFor="condition">Condition Factor: {conditionFactor.toFixed(2)}</Label>
                              </div>
                              <Slider
                                id="condition"
                                min={0.8}
                                max={1.2}
                                step={0.01}
                                value={[conditionFactor]}
                                onValueChange={(vals) => setConditionFactor(vals[0])}
                              />
                            </div>
                            
                            <Alert className="mt-4">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Calculation Result</AlertTitle>
                              <AlertDescription>
                                <div className="mt-2 space-y-1">
                                  <div className="flex justify-between">
                                    <span>Base Rate:</span>
                                    <span>${baseRate.toFixed(2)}/sq ft</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Regional Factor:</span>
                                    <span>{regionFactor.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Area:</span>
                                    <span>{propertyDetails.size.toLocaleString()} sq ft</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Base Value:</span>
                                    <span>${baseValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Quality Adj:</span>
                                    <span>{(qualityFactor * 100).toFixed(0)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Condition Adj:</span>
                                    <span>{(conditionFactor * 100).toFixed(0)}%</span>
                                  </div>
                                  <Separator className="my-2" />
                                  <div className="flex justify-between font-bold">
                                    <span>Final Value:</span>
                                    <span>${adjustedValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                  </div>
                                </div>
                              </AlertDescription>
                            </Alert>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button variant="outline" onClick={() => setSelectedProperty(null)}>
                        Back to List
                      </Button>
                      <div className="space-x-2">
                        <Button variant="outline">
                          <Clipboard className="mr-2 h-4 w-4" />
                          Save Draft
                        </Button>
                        <Button>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )}
              </TabsContent>
              
              {/* Cost Matrix Tab */}
              <TabsContent value="matrix" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Benton County Cost Matrix</CardTitle>
                      <CardDescription>
                        2025 Cost Matrix for Building Valuations
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant={matrixMode === 'view' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setMatrixMode('view')}
                      >
                        View Mode
                      </Button>
                      <Button 
                        variant={matrixMode === 'edit' ? 'default' : 'outline'} 
                        size="sm"
                        onClick={() => setMatrixMode('edit')}
                      >
                        Edit Mode
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Building Type</th>
                            <th className="text-left p-3 text-sm font-medium">Code</th>
                            {BENTON_REGIONS.map(region => (
                              <th key={region.id} className="text-left p-3 text-sm font-medium">
                                {region.name} 
                                <span className="text-xs text-muted-foreground ml-1">
                                  (x{region.factor})
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {BUILDING_TYPES.map((type) => (
                            <tr key={type.id} className="border-t">
                              <td className="p-3 text-sm font-medium">{type.name}</td>
                              <td className="p-3 text-sm">{type.id}</td>
                              {BENTON_REGIONS.map(region => {
                                const adjustedRate = type.baseRate * region.factor;
                                
                                return (
                                  <td key={region.id} className="p-3 text-sm">
                                    {matrixMode === 'edit' ? (
                                      <input 
                                        type="number" 
                                        step="0.01"
                                        className="border rounded p-1 w-20 text-right"
                                        defaultValue={adjustedRate.toFixed(2)}
                                      />
                                    ) : (
                                      <div className="font-mono">${adjustedRate.toFixed(2)}</div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {matrixMode === 'edit' && (
                      <div className="mt-4 border rounded p-4 bg-muted/20">
                        <h3 className="font-medium mb-2">Edit Justification</h3>
                        <textarea 
                          className="w-full border rounded p-2 h-24"
                          placeholder="Enter justification for the changes..."
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button variant="outline" onClick={() => setMatrixMode('view')}>
                            Cancel
                          </Button>
                          <Button onClick={() => setMatrixMode('view')}>
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {matrixMode === 'view' && (
                      <div className="mt-4">
                        <h3 className="font-medium mb-2">Cost Matrix Audit Trail</h3>
                        <div className="border rounded overflow-hidden">
                          {EDIT_HISTORY.map((edit) => (
                            <div key={edit.id} className="border-b p-3">
                              <div className="flex justify-between">
                                <div className="font-medium">{edit.action}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(edit.timestamp).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-sm mt-1 text-muted-foreground">{edit.reason}</div>
                              <div className="text-sm mt-1">By: {edit.user}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Matrix
                    </Button>
                    <Button>
                      <Download className="mr-2 h-4 w-4" />
                      Export Matrix
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Regional Analysis</CardTitle>
                    <CardDescription>
                      Compare building costs across regions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4 mb-4">
                      <div className="w-1/2">
                        <Label htmlFor="building-type-select" className="block mb-2">Building Type</Label>
                        <Select 
                          value={selectedBuildingType} 
                          onValueChange={setSelectedBuildingType}
                        >
                          <SelectTrigger id="building-type-select">
                            <SelectValue placeholder="Select Building Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {BUILDING_TYPES.map((type) => (
                              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-1/2">
                        <Label htmlFor="metrics-select" className="block mb-2">Metrics</Label>
                        <Select defaultValue="base-cost">
                          <SelectTrigger id="metrics-select">
                            <SelectValue placeholder="Select Metrics" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="base-cost">Base Cost</SelectItem>
                            <SelectItem value="cost-trend">Cost Trend (3yr)</SelectItem>
                            <SelectItem value="cost-comparison">Regional Comparison</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex space-x-4">
                        <div className="w-1/2">
                          <BarChartComponent 
                            data={formatBuildingTypeDataForBarChart(BUILDING_TYPE_DATA, selectedBuildingType)} 
                            title="Regional Cost Comparison"
                            xAxisLabel="Building Type"
                            yAxisLabel="Cost per sq.ft."
                            selectedBuildingType={selectedBuildingType}
                            showGrid={true}
                          />
                        </div>
                        <div className="w-1/2">
                          <PieChartComponent 
                            data={formatRegionalDataForPieChart(REGIONAL_DATA)}
                            title="Property Distribution by Region"
                            showLegend={true}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        {BENTON_REGIONS.map((region) => {
                          const buildingType = BUILDING_TYPES.find(bt => bt.id === selectedBuildingType);
                          const adjustedRate = (buildingType?.baseRate || 0) * region.factor;
                          
                          return (
                            <Card key={region.id} className="shadow-sm">
                              <CardHeader className="py-3">
                                <CardTitle className="text-base">{region.name}</CardTitle>
                              </CardHeader>
                              <CardContent className="py-2">
                                <div className="text-2xl font-bold">${adjustedRate.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">per square foot</div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Cost Trend Analysis</CardTitle>
                    <CardDescription>
                      Building cost trends over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4">
                      <div className="w-1/2">
                        <LineChartComponent
                          data={formatTrendDataForLineChart(TREND_DATA)}
                          title="Benton County Cost Trends (2020-2025)"
                          xAxisLabel="Year"
                          yAxisLabel="Cost per sq.ft."
                          showArea={true}
                          showGradient={true}
                          xAxisDataKey="name"
                          referenceLine={195}
                          referenceLineLabel="County Average"
                        />
                      </div>
                      <div className="w-1/2">
                        <RadarChartComponent
                          data={VALUATION_FACTORS}
                          title="Property Valuation Factors"
                          showLegend={true}
                          metrics={[
                            { key: 'value', name: 'Current Property', color: '#4f46e5' },
                            { key: 'benchmark', name: 'County Average', color: '#60a5fa' }
                          ]}
                          fillOpacity={0.4}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">Trend Insights</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <ArrowUpRight className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Residential costs have increased 7.2% over the past 3 years in Benton County, slightly below the state average of 8.5%.</span>
                        </li>
                        <li className="flex items-start">
                          <ArrowUpRight className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Agricultural building costs show the highest regional variation, with East Benton seeing 12% higher costs than West Benton.</span>
                        </li>
                        <li className="flex items-start">
                          <ArrowUpRight className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Commercial building costs stabilized in 2024 after steady increases in 2022-2023, reflecting reduced commercial construction activity.</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Reports Tab */}
              <TabsContent value="reports" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Reports</CardTitle>
                    <CardDescription>
                      Generate detailed assessment reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="report-type" className="block mb-2">Report Type</Label>
                          <Select defaultValue="property">
                            <SelectTrigger id="report-type">
                              <SelectValue placeholder="Select Report Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="property">Property Assessment</SelectItem>
                              <SelectItem value="neighborhood">Neighborhood Analysis</SelectItem>
                              <SelectItem value="region">Regional Summary</SelectItem>
                              <SelectItem value="trend">Cost Trend Analysis</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="report-format" className="block mb-2">Report Format</Label>
                          <Select defaultValue="pdf">
                            <SelectTrigger id="report-format">
                              <SelectValue placeholder="Select Format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pdf">PDF Document</SelectItem>
                              <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                              <SelectItem value="json">JSON Data</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="report-property" className="block mb-2">Property Selection</Label>
                        <Select value={selectedProperty || ''} onValueChange={setSelectedProperty}>
                          <SelectTrigger id="report-property">
                            <SelectValue placeholder="Select Property" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Properties</SelectItem>
                            {PROPERTIES.map((property) => (
                              <SelectItem key={property.id} value={property.id}>
                                {property.address}, {property.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="bg-muted/20 p-4 rounded-md border">
                        <h3 className="font-medium mb-2">Report Preview</h3>
                        <div className="bg-white p-4 rounded-md border">
                          <div className="flex items-center justify-between pb-3 border-b">
                            <BentonBranding variant="horizontal" size="sm" showTagline={true} />
                            <div className="text-sm text-muted-foreground">
                              {new Date().toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="py-6">
                            <h2 className="text-xl font-bold text-center mb-1">
                              {selectedProperty 
                                ? `Property Assessment Report: ${propertyDetails?.address}`
                                : 'Benton County Assessment Summary Report'}
                            </h2>
                            <p className="text-center text-muted-foreground">
                              2025 Valuation Cycle
                            </p>
                            
                            <div className="mt-4 border-t pt-4">
                              <div className="text-sm text-muted-foreground italic text-center">
                                Preview of report contents would appear here
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline">Preview Full Report</Button>
                    <Button>Generate Report</Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>
                      Previously generated reports
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium">Report Name</th>
                            <th className="text-left p-3 text-sm font-medium">Type</th>
                            <th className="text-left p-3 text-sm font-medium">Date Generated</th>
                            <th className="text-left p-3 text-sm font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            {
                              id: 'r1',
                              name: 'West Benton Residential Assessment',
                              type: 'Region',
                              date: '2025-05-01'
                            },
                            {
                              id: 'r2',
                              name: '1234 Vineyard Rd Property Assessment',
                              type: 'Property',
                              date: '2025-04-28'
                            },
                            {
                              id: 'r3',
                              name: 'Red Mountain AVA Cost Trend Analysis',
                              type: 'Trend',
                              date: '2025-04-15'
                            }
                          ].map((report) => (
                            <tr key={report.id} className="border-t">
                              <td className="p-3 text-sm font-medium">{report.name}</td>
                              <td className="p-3 text-sm">{report.type}</td>
                              <td className="p-3 text-sm">{report.date}</td>
                              <td className="p-3 text-sm">
                                <div className="flex space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
            
            {/* AI Agent Insight Panel - Takes 1/3 of the space */}
            {showAIPanel && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="h-5 w-5 text-primary" />
                      AI Agent Insights
                    </CardTitle>
                    <CardDescription>
                      Real-time AI-powered insights and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {AGENT_INSIGHTS.map((insight) => (
                        <div key={insight.id} className="border rounded-md p-3 bg-muted/10">
                          <div className="flex justify-between items-start">
                            <div className="font-medium flex items-center gap-2">
                              {insight.type === 'value' && <TrendingUp className="h-4 w-4 text-blue-500" />}
                              {insight.type === 'compliance' && <AlertCircle className="h-4 w-4 text-green-500" />}
                              {insight.type === 'recommendation' && <BrainCircuit className="h-4 w-4 text-purple-500" />}
                              {insight.title}
                            </div>
                            <Badge variant="outline">
                              {(insight.confidence * 100).toFixed(0)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm mt-2">{insight.content}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(insight.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant="outline">
                      <Play className="mr-2 h-4 w-4" />
                      Run Analysis on Current Selection
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>What-If Scenario</CardTitle>
                    <CardDescription>
                      Explore valuation scenarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="scenario-base-value" className="block mb-2">Base Value</Label>
                        <input
                          id="scenario-base-value"
                          type="number"
                          disabled
                          className="w-full p-2 border rounded-md bg-muted/20"
                          value={baseValue.toFixed(2)}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="scenario-quality" className="block mb-2">
                          Quality Adjustment: {qualityFactor.toFixed(2)}
                        </Label>
                        <Slider
                          id="scenario-quality"
                          min={0.8}
                          max={1.2}
                          step={0.01}
                          value={[qualityFactor]}
                          onValueChange={(vals) => setQualityFactor(vals[0])}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="scenario-condition" className="block mb-2">
                          Condition Adjustment: {conditionFactor.toFixed(2)}
                        </Label>
                        <Slider
                          id="scenario-condition"
                          min={0.8}
                          max={1.2}
                          step={0.01}
                          value={[conditionFactor]}
                          onValueChange={(vals) => setConditionFactor(vals[0])}
                        />
                      </div>
                      
                      <Alert>
                        <div className="font-medium">Scenario Result</div>
                        <div className="mt-2">
                          <div className="text-sm flex justify-between">
                            <span>Base Value:</span>
                            <span>${baseValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div className="text-sm flex justify-between">
                            <span>Adjusted Value:</span>
                            <span>${adjustedValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                          </div>
                          <div className="text-sm flex justify-between">
                            <span>Difference:</span>
                            <span>{((adjustedValue / baseValue - 1) * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      </Alert>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm">Reset</Button>
                    <Button size="sm">Save Scenario</Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}

