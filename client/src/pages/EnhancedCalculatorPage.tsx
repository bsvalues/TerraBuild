import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { PageShell, InfoCard, ActionsPanel } from '@/components/layout/PageShell';
import {
  TerraBuildUserFlow,
  calculationWorkflowSteps,
  WorkflowProvider,
  useWorkflow,
  WorkflowNavigation
} from '@/components/TerraBuildUserFlow';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  Building2,
  Map,
  Check,
  LineChart,
  FileSpreadsheet,
  Save,
  Download,
  Share2,
  Info,
  HelpCircle,
  CalendarDays,
  SquareFoot,
  PaintBucket,
  Star,
  Gauge,
  Layers,
  ArrowRight,
  Activity,
  Lightbulb
} from 'lucide-react';
import { useDataFlow } from '@/contexts/DataFlowContext';

const PropertySelection = () => {
  const { nextStep } = useWorkflow();
  const { updateState, state } = useDataFlow();
  const [propertyId, setPropertyId] = useState(state.propertyId || '');
  const [propertyType, setPropertyType] = useState('residential');
  const [address, setAddress] = useState('');
  const [yearBuilt, setYearBuilt] = useState('2010');

  const handleContinue = () => {
    updateState({
      propertyId: propertyId,
      propertyDetails: {
        id: propertyId,
        type: propertyType,
        address: address,
        yearBuilt: yearBuilt
      }
    });

    nextStep();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Property Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property-id">Property ID</Label>
                <Input
                  id="property-id"
                  placeholder="Enter property ID or search..."
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a property ID or search by address
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="property-type">Property Type</Label>
                <Select
                  value={propertyType}
                  onValueChange={setPropertyType}
                >
                  <SelectTrigger id="property-type">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                placeholder="123 Main St, Richland, WA 99352"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year-built">Year Built</Label>
                <Input
                  id="year-built"
                  type="number"
                  placeholder="2010"
                  value={yearBuilt}
                  onChange={(e) => setYearBuilt(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Clear</Button>
          <Button onClick={handleContinue} className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-6">
        <Alert className="bg-[#e6f7fb] border-[#29B7D3]/30">
          <Info className="h-4 w-4" />
          <AlertTitle>Pro Tip</AlertTitle>
          <AlertDescription>
            Using an existing property ID will automatically fill in building parameters
            in the next step based on county records.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

const BuildingParameters = () => {
  const { nextStep, previousStep } = useWorkflow();
  const { updateState, state } = useDataFlow();
  const [buildingType, setBuildingType] = useState(state.buildingType || 'R1');
  const [region, setRegion] = useState(state.region || 'central');
  const [squareFootage, setSquareFootage] = useState('2500');
  const [quality, setQuality] = useState(state.quality || 'average');
  const [condition, setCondition] = useState(state.condition || 'average');
  const [complexityFactor, setComplexityFactor] = useState([1.0]);
  const [complexityDescription, setComplexityDescription] = useState('Standard design with typical features');

  const handleComplexityChange = (value: number[]) => {
    setComplexityFactor(value);
    
    // Update complexity description based on value
    if (value[0] < 0.8) {
      setComplexityDescription('Simple design with minimal features');
    } else if (value[0] < 0.95) {
      setComplexityDescription('Basic design with fewer features than standard');
    } else if (value[0] < 1.05) {
      setComplexityDescription('Standard design with typical features');
    } else if (value[0] < 1.2) {
      setComplexityDescription('Complex design with additional features');
    } else {
      setComplexityDescription('Highly complex design with premium features');
    }
  };

  const handleContinue = () => {
    updateState({
      buildingType: buildingType,
      buildingTypeDetails: { code: buildingType },
      region: region,
      regionDetails: { code: region },
      quality: quality,
      qualityDetails: { level: quality },
      condition: condition,
      conditionDetails: { level: condition }
    });

    nextStep();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Building Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building-type">Building Type</Label>
              <Select
                value={buildingType}
                onValueChange={setBuildingType}
              >
                <SelectTrigger id="building-type">
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="R1">R1 - Single Family Residential</SelectItem>
                  <SelectItem value="R2">R2 - Multi-Family Residential</SelectItem>
                  <SelectItem value="C1">C1 - Retail Commercial</SelectItem>
                  <SelectItem value="C2">C2 - Office Commercial</SelectItem>
                  <SelectItem value="C4">C4 - Warehouse</SelectItem>
                  <SelectItem value="I1">I1 - Light Industrial</SelectItem>
                  <SelectItem value="I2">I2 - Heavy Industrial</SelectItem>
                  <SelectItem value="A1">A1 - Agricultural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select
                value={region}
                onValueChange={setRegion}
              >
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="east">East Benton</SelectItem>
                  <SelectItem value="central">Central Benton</SelectItem>
                  <SelectItem value="west">West Benton</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="square-footage">Square Footage</Label>
            <Input
              id="square-footage"
              type="number"
              placeholder="Enter square footage"
              value={squareFootage}
              onChange={(e) => setSquareFootage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quality">Quality Level</Label>
              <Select
                value={quality}
                onValueChange={setQuality}
              >
                <SelectTrigger id="quality">
                  <SelectValue placeholder="Select quality level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={condition}
                onValueChange={setCondition}
              >
                <SelectTrigger id="condition">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="complexity">Complexity Factor</Label>
              <span className="text-sm font-medium">{complexityFactor[0].toFixed(2)}</span>
            </div>
            <Slider
              id="complexity"
              min={0.5}
              max={1.5}
              step={0.01}
              value={complexityFactor}
              onValueChange={handleComplexityChange}
              className="my-4"
            />
            <p className="text-sm text-muted-foreground">{complexityDescription}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={previousStep}>Back</Button>
          <Button onClick={handleContinue} className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
            Continue <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const CalculateStep = () => {
  const { nextStep, previousStep } = useWorkflow();
  const { updateState, state } = useDataFlow();
  const [calculating, setCalculating] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);

  const handleCalculate = () => {
    // Simulate calculation
    setCalculating(true);
    setTimeout(() => {
      setCalculating(false);
      setCalculationComplete(true);
      
      // Mock calculation results
      updateState({
        calculationId: `CALC-${Date.now()}`,
        calculationResults: {
          totalCost: 325000,
          costPerSqFt: 130,
          regionFactor: 1.05,
          qualityFactor: 1.15,
          conditionFactor: 1.0,
          materials: [
            { name: 'Foundation', cost: 45000 },
            { name: 'Framing', cost: 68000 },
            { name: 'Roofing', cost: 32000 },
            { name: 'Electrical', cost: 28000 },
            { name: 'Plumbing', cost: 35000 },
            { name: 'HVAC', cost: 24000 },
            { name: 'Finishes', cost: 38000 },
            { name: 'Other', cost: 55000 }
          ]
        }
      });
      
      // Add data snapshot
      updateState({
        dataHistory: [
          ...state.dataHistory,
          {
            id: `calc-${Date.now()}`,
            timestamp: Date.now(),
            data: {
              buildingType: state.buildingType,
              region: state.region,
              quality: state.quality,
              condition: state.condition
            },
            source: 'calculation-engine',
            operation: 'calculate'
          }
        ]
      });
    }, 2000);
  };

  const handleContinue = () => {
    nextStep();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Calculate Building Cost</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-2">Calculation Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Building Type:</div>
              <div className="font-medium">{state.buildingType || 'Not specified'}</div>
              
              <div className="text-muted-foreground">Region:</div>
              <div className="font-medium">{state.region || 'Not specified'}</div>
              
              <div className="text-muted-foreground">Quality:</div>
              <div className="font-medium">{state.quality || 'Not specified'}</div>
              
              <div className="text-muted-foreground">Condition:</div>
              <div className="font-medium">{state.condition || 'Not specified'}</div>
            </div>
          </div>
          
          {!calculationComplete ? (
            <div className="flex flex-col items-center justify-center py-6">
              {calculating ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-[#29B7D3]/30 border-t-[#29B7D3] animate-spin mx-auto mb-4"></div>
                  <p className="text-[#243E4D] font-medium">Calculating costs...</p>
                  <p className="text-sm text-muted-foreground mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#e6f7fb] flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-[#29B7D3]" />
                  </div>
                  <p className="text-[#243E4D] font-medium">Ready to calculate</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click the button below to calculate the building cost based on the parameters provided
                  </p>
                  <Button 
                    onClick={handleCalculate} 
                    className="mt-4 bg-[#29B7D3] hover:bg-[#29B7D3]/90"
                  >
                    Calculate Now
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-[#243E4D] font-medium">Calculation Complete</p>
              <p className="text-sm text-muted-foreground mt-2">
                You can now view the detailed results
              </p>
              <Button 
                onClick={handleContinue} 
                className="mt-4 bg-[#29B7D3] hover:bg-[#29B7D3]/90"
              >
                View Results <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={previousStep}>Back</Button>
          {calculationComplete && (
            <Button onClick={handleContinue} className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

const ResultsStep = () => {
  const { nextStep, previousStep } = useWorkflow();
  const { state } = useDataFlow();
  const calculationResults = state.calculationResults || {};
  const materials = calculationResults.materials || [];
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Cost Calculation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-[#e6f7fb]/50 border-[#29B7D3]/20">
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-gray-500 font-medium">Total Cost</div>
                  <div className="text-3xl font-bold text-[#243E4D]">
                    ${calculationResults.totalCost?.toLocaleString() || '0'}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#e6f7fb]/50 border-[#29B7D3]/20">
                <CardContent className="p-4">
                  <div className="text-xs uppercase text-gray-500 font-medium">Cost per Sq Ft</div>
                  <div className="text-3xl font-bold text-[#243E4D]">
                    ${calculationResults.costPerSqFt?.toLocaleString() || '0'}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Cost Breakdown</h3>
              <div className="space-y-2">
                {materials.map((material: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="text-sm">{material.name}</div>
                    <div className="text-sm font-medium">${material.cost.toLocaleString()}</div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium">Total</div>
                  <div className="text-sm font-medium">${calculationResults.totalCost?.toLocaleString() || '0'}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Calculation Factors</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <Map className="h-5 w-5 text-gray-500 mb-1" />
                  <div className="text-xs text-gray-500">Region</div>
                  <div className="text-sm font-medium">{calculationResults.regionFactor || '1.0'}</div>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <Star className="h-5 w-5 text-gray-500 mb-1" />
                  <div className="text-xs text-gray-500">Quality</div>
                  <div className="text-sm font-medium">{calculationResults.qualityFactor || '1.0'}</div>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <Gauge className="h-5 w-5 text-gray-500 mb-1" />
                  <div className="text-xs text-gray-500">Condition</div>
                  <div className="text-sm font-medium">{calculationResults.conditionFactor || '1.0'}</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={previousStep}>Back</Button>
            <Button onClick={nextStep} className="bg-[#29B7D3] hover:bg-[#29B7D3]/90">
              Save & Export <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Alert className="bg-[#e6f7fb] border-[#29B7D3]/30">
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Cost Analysis Insights</AlertTitle>
          <AlertDescription>
            Based on similar properties in the {state.region || 'selected'} region, this cost estimate 
            is approximately 5% higher than the regional average for {state.buildingType || 'this building type'}.
            Consider adjusting quality factors for a more competitive estimate.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

const ExportStep = () => {
  const { previousStep } = useWorkflow();
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportComplete, setExportComplete] = useState(false);
  
  const handleExport = () => {
    // Simulate export
    setTimeout(() => {
      setExportComplete(true);
    }, 1000);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Save & Export Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Save Calculation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calculation-name">Calculation Name</Label>
                    <Input id="calculation-name" placeholder="My Calculation" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calculation-notes">Notes (Optional)</Label>
                    <Input id="calculation-notes" placeholder="Add notes..." />
                  </div>
                  <Button className="w-full">
                    <Save className="mr-2 h-4 w-4" /> Save Calculation
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Export Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Export Format</Label>
                    <Select
                      value={exportFormat}
                      onValueChange={setExportFormat}
                    >
                      <SelectTrigger id="export-format">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="csv">CSV File</SelectItem>
                        <SelectItem value="json">JSON Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <input type="checkbox" id="include-breakdown" className="rounded" />
                      <Label htmlFor="include-breakdown">Include cost breakdown</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-chart" className="rounded" />
                      <Label htmlFor="include-chart">Include visualization charts</Label>
                    </div>
                  </div>
                  
                  <Button className="w-full" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export Now
                  </Button>
                  
                  {exportComplete && (
                    <div className="text-center text-sm text-green-600 font-medium">
                      <Check className="h-4 w-4 inline mr-1" /> Export complete!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Share Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient-email">Recipient Email</Label>
                    <Input id="recipient-email" placeholder="Enter email address" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="share-message">Message (Optional)</Label>
                    <Input id="share-message" placeholder="Add a message..." />
                  </div>
                </div>
                <Button className="w-full md:w-auto">
                  <Share2 className="mr-2 h-4 w-4" /> Share via Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter className="flex justify-start">
          <Button variant="outline" onClick={previousStep}>Back to Results</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const CalculatorWorkflow = () => {
  const { currentStep } = useWorkflow();
  
  return (
    <div className="space-y-8">
      {currentStep === 'property' && <PropertySelection />}
      {currentStep === 'parameters' && <BuildingParameters />}
      {currentStep === 'calculation' && <CalculateStep />}
      {currentStep === 'results' && <ResultsStep />}
      {currentStep === 'save' && <ExportStep />}
    </div>
  );
};

const EnhancedCalculatorPage = () => {
  const [, navigate] = useLocation();
  
  return (
    <WorkflowProvider
      workflowId="cost-calculator"
      steps={calculationWorkflowSteps}
      initialStep="property"
    >
      <PageShell
        title="TerraBuild Cost Calculator"
        description="Calculate building costs based on property characteristics, building type, and regional factors."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Tools", href: "#" },
          { label: "Cost Calculator", href: "/calculator" }
        ]}
        navigationFlow={
          <TerraBuildUserFlow
            steps={calculationWorkflowSteps}
            currentStep="property"
            size="medium"
            showLabels={true}
          />
        }
        helpText="This calculator uses official Benton County cost data and regional adjustments to provide accurate building cost estimates."
        infoAlert={{
          title: "Using the Cost Calculator",
          description: "Follow the step-by-step process to calculate building costs. Each step builds on the information from previous steps.",
          variant: "default"
        }}
        sidebar={
          <div className="space-y-4">
            <ActionsPanel
              title="Quick Actions"
              actions={[
                {
                  label: "View Recently Saved",
                  icon: <CalendarDays className="h-4 w-4" />,
                  href: "#",
                  tooltip: "Access your recently saved calculations"
                },
                {
                  label: "Recent Properties",
                  icon: <Building2 className="h-4 w-4" />,
                  href: "#",
                  tooltip: "View recently accessed properties"
                },
                {
                  label: "Compare Results",
                  icon: <LineChart className="h-4 w-4" />,
                  href: "#",
                  tooltip: "Compare multiple calculation results"
                },
                {
                  label: "What-If Scenarios",
                  icon: <Activity className="h-4 w-4" />,
                  href: "/what-if-scenarios",
                  tooltip: "Explore cost variations with different parameters"
                }
              ]}
            />
            
            <InfoCard
              title="Need Help?"
              description="Get assistance with the cost calculator"
              icon={<HelpCircle className="h-5 w-5" />}
              actions={[
                {
                  label: "View Guide",
                  href: "/documentation/calculator",
                  variant: "ghost"
                }
              ]}
            >
              <div className="space-y-3 text-sm">
                <p>
                  Visit our comprehensive
                  <Button variant="link" className="h-auto p-0 ml-1" onClick={() => navigate('/documentation/calculator')}>
                    calculator documentation
                  </Button>
                </p>
                <p>
                  For detailed help, contact our support team at
                  <span className="text-[#29B7D3] ml-1">support@terrabuild.county.gov</span>
                </p>
              </div>
            </InfoCard>
          </div>
        }
      >
        <CalculatorWorkflow />
      </PageShell>
    </WorkflowProvider>
  );
};

export default EnhancedCalculatorPage;