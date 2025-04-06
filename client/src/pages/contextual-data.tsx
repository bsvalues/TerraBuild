import React, { useState } from 'react';
import MainContent from '@/components/layout/MainContent';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ContextualDataViewer from '@/components/ContextualDataViewer';
import CostBreakdownCard from '@/components/CostBreakdownCard';
import CostValueRelationship from '@/components/CostValueRelationship';
import DataPointContext from '@/components/DataPointContext';
import { CircleOff, Eye, EyeOff, Info, RefreshCw } from 'lucide-react';

const ContextualDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('simple');
  const [interactions, setInteractions] = useState<Array<{label: string, action: string, timestamp: number}>>([]);
  const [showHelp, setShowHelp] = useState(true);
  
  // Sample cost factors for CostBreakdownCard
  const sampleCostFactors = [
    {
      name: "Regional Multiplier",
      value: 1.25,
      unit: 'multiplier' as const,
      explanation: "This factor accounts for regional differences in labor and material costs. The Central region has a 1.25x multiplier compared to the base rate.",
      impact: 'negative' as const,
      trend: [
        { date: "2021", value: 1.18 },
        { date: "2022", value: 1.20 },
        { date: "2023", value: 1.22 },
        { date: "2024", value: 1.24 },
        { date: "2025", value: 1.25 }
      ]
    },
    {
      name: "Quality Adjustment",
      value: 35000,
      unit: 'currency' as const,
      explanation: "This represents premium materials and finishes that increase the base cost but add significant value.",
      impact: 'positive' as const,
      breakdown: [
        { label: "Materials", value: 20000, percentage: 57 },
        { label: "Fixtures", value: 8500, percentage: 24 },
        { label: "Finishes", value: 6500, percentage: 19 }
      ]
    },
    {
      name: "Complexity Factor",
      value: 15,
      unit: 'percentage' as const,
      explanation: "This factor accounts for additional complexity in the building design that increases construction costs.",
      impact: 'negative' as const
    },
    {
      name: "Age Depreciation",
      value: 8,
      unit: 'percentage' as const,
      explanation: "Reduction in value due to the age and condition of the building.",
      impact: 'positive' as const,
      trend: [
        { date: "Year 5", value: 5 },
        { date: "Year 10", value: 8 },
        { date: "Year 15", value: 12 },
        { date: "Year 20", value: 18 },
        { date: "Year 25", value: 25 }
      ]
    }
  ];
  
  // Sample value points for CostValueRelationship
  const sampleValuePoints = [
    {
      label: "Premium Insulation",
      cost: 12000,
      value: 18000,
      description: "High-performance insulation that reduces energy costs significantly over time.",
      category: "Energy Efficiency"
    },
    {
      label: "Standard Windows",
      cost: 18000,
      value: 16000,
      description: "Basic double-pane windows that provide moderate energy efficiency.",
      category: "Windows"
    },
    {
      label: "Triple-Pane Windows",
      cost: 32000,
      value: 38000,
      description: "High-performance windows with excellent insulation properties and noise reduction.",
      category: "Windows"
    },
    {
      label: "Basic HVAC",
      cost: 25000,
      value: 25000,
      description: "Standard heating and cooling system with average efficiency ratings.",
      category: "HVAC"
    },
    {
      label: "High-Efficiency HVAC",
      cost: 42000,
      value: 58000,
      description: "Premium HVAC system with smart controls and high energy efficiency ratings.",
      category: "HVAC"
    },
    {
      label: "Solar Panels",
      cost: 30000,
      value: 45000,
      description: "Roof-mounted solar panels that reduce electricity costs over time.",
      category: "Energy Efficiency"
    },
    {
      label: "Basic Roof",
      cost: 22000,
      value: 20000,
      description: "Standard asphalt shingle roof with 20-year warranty.",
      category: "Roofing"
    },
    {
      label: "Metal Roof",
      cost: 38000,
      value: 52000,
      description: "Durable metal roof with 50-year warranty and better insulation properties.",
      category: "Roofing"
    }
  ];

  // Handle data point interactions
  const handleDataPointInteraction = (label: string, value: string | number, type: 'hover' | 'click') => {
    console.log(`Interaction detected: ${type} on ${label}, value: ${value}`);
    
    const newInteraction = {
      label,
      action: `${type === 'hover' ? 'Hovered over' : 'Clicked on'} ${label}${value ? ': ' + value : ''}`,
      timestamp: Date.now()
    };
    
    // Update the interactions state
    setInteractions(prevInteractions => {
      console.log('Current interactions:', prevInteractions);
      return [newInteraction, ...prevInteractions.slice(0, 4)];
    });
  };

  return (
    <MainContent title="Contextual Data">
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Contextual Data Exploration</h1>
            <p className="text-muted-foreground mt-1">
              Interactive data visualization with contextual micro-interactions
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-1.5"
            >
              {showHelp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showHelp ? "Hide Help" : "Show Help"}
            </Button>
          </div>
        </div>
        
        {showHelp && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <div className="flex-none text-blue-500">
                  <Info className="h-5 w-5" />
                </div>
                <div className="flex-1 text-blue-800 text-sm">
                  <p className="font-medium mb-1">Contextual Micro-Interactions Guide</p>
                  <p className="mb-2">
                    This page demonstrates contextual micro-interactions that enhance data exploration.
                    Try these interactions:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Hover over data points to see basic context in tooltips</li>
                    <li>Click on data points with popover indicators to see more detailed information</li>
                    <li>Explore the Cost-Value Relationship chart by hovering over points and clicking them</li>
                    <li>Notice how similar types of data use consistent interaction patterns</li>
                    <li>Your interactions will be logged in the right sidebar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="simple">Simple Example</TabsTrigger>
                <TabsTrigger value="cost">Cost Breakdown</TabsTrigger>
                <TabsTrigger value="value">Cost-Value Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="simple" className="space-y-6">
                <ContextualDataViewer
                  title="Building Cost Components"
                  description="Hover or click on values to see additional context"
                  mode="cost"
                  onDataPointInteraction={handleDataPointInteraction}
                />
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Regional Factors</CardTitle>
                      <CardDescription>Contextual data examples</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Material Cost Index:</span>
                          <DataPointContext
                            value={112.5}
                            context="Compared to national baseline (100)"
                            explanation="This index measures the relative cost of materials in this region compared to the national average."
                            trendData={[
                              { date: "2021", value: 108.2 },
                              { date: "2022", value: 110.1 },
                              { date: "2023", value: 111.8 },
                              { date: "2024", value: 112.5 }
                            ]}
                            contextType="hovercard"
                            interactionEffect="pulse"
                            onInteraction={(type, value) => 
                              handleDataPointInteraction("Material Cost Index", value, type)
                            }
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Labor Rate:</span>
                          <DataPointContext
                            value={42.75}
                            format="currency"
                            context="Average hourly rate for skilled labor"
                            explanation="This represents the average hourly cost for construction labor in this region."
                            contextType="tooltip"
                            interactionEffect="glow"
                            onInteraction={(type, value) => 
                              handleDataPointInteraction("Labor Rate", value, type)
                            }
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Regional Multiplier:</span>
                          <DataPointContext
                            value={1.25}
                            context="Adjustment factor for this region"
                            explanation="This multiplier is applied to base costs to account for regional variations in labor and material costs."
                            breakdownData={[
                              { label: "Labor", value: 0.12, percentage: 48 },
                              { label: "Materials", value: 0.08, percentage: 32 },
                              { label: "Other", value: 0.05, percentage: 20 }
                            ]}
                            contextType="popover"
                            interactionEffect="highlight"
                            onInteraction={(type, value) => 
                              handleDataPointInteraction("Regional Multiplier", value, type)
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Quality Factors</CardTitle>
                      <CardDescription>Contextual data examples</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Quality Grade:</span>
                          <DataPointContext
                            value="A-"
                            context="Premium construction quality"
                            explanation="Quality grades range from D (lowest) to A+ (highest). An A- rating indicates premium construction quality with high-end materials and craftsmanship."
                            contextType="tooltip"
                            interactionEffect="pulse"
                            onInteraction={(type, value) => 
                              handleDataPointInteraction("Quality Grade", value, type)
                            }
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Quality Adjustment:</span>
                          <DataPointContext
                            value={32500}
                            format="currency"
                            context="Cost premium for quality grade"
                            explanation="This represents the additional cost associated with higher quality materials and construction methods."
                            breakdownData={[
                              { label: "Materials", value: 18500, percentage: 57 },
                              { label: "Fixtures", value: 8000, percentage: 25 },
                              { label: "Finishes", value: 6000, percentage: 18 }
                            ]}
                            contextType="popover"
                            interactionEffect="glow"
                            onInteraction={(type, value) => 
                              handleDataPointInteraction("Quality Adjustment", value, type)
                            }
                          />
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Lifespan Increase:</span>
                          <DataPointContext
                            value={35}
                            format="percentage"
                            context="Extended lifespan due to quality"
                            explanation="High-quality materials and construction methods extend the expected lifespan of the building by approximately 35%."
                            contextType="tooltip"
                            interactionEffect="highlight"
                            onInteraction={(type, value) => 
                              handleDataPointInteraction("Lifespan Increase", value, type)
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="cost">
                <CostBreakdownCard
                  buildingType="Commercial Office"
                  baseCost={245000}
                  finalCost={306250}
                  squareFootage={2500}
                  costFactors={sampleCostFactors}
                  onFactorInteraction={(factor, type) => 
                    handleDataPointInteraction(factor, "", type)
                  }
                />
              </TabsContent>
              
              <TabsContent value="value">
                <CostValueRelationship
                  dataPoints={sampleValuePoints}
                  highlightCategories={["Windows", "HVAC"]}
                  onSelectDataPoint={(point) => 
                    handleDataPointInteraction(point.label, point.value, 'click')
                  }
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="col-span-1">
            <Card className="border shadow-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Interaction Log</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setInteractions([])}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>
                  Recent interactions with data points
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <CircleOff className="h-8 w-8 mb-2 opacity-40" />
                    <p>No interactions yet</p>
                    <p className="text-xs mt-1">Hover or click on data points to see interactions here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {interactions.map((interaction, i) => (
                      <div key={i} className="border-b pb-2 last:border-0">
                        <div className="text-sm">{interaction.action}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(interaction.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainContent>
  );
};

export default ContextualDataPage;