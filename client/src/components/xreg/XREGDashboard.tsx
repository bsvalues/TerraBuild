import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, BarChart2, FileText, Settings, Home, TrendingUp } from 'lucide-react';
import PredictionExplainer from './PredictionExplainer';
import AgentFeed from './AgentFeed';

export default function XREGDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock function to simulate loading a property
  const handlePropertyLoad = (id: string) => {
    setIsLoading(true);
    setPropertyId(id);
    
    // Simulate API call delay
    setTimeout(() => {
      // In a real implementation, this would be an API call
      // For now, we'll just set some mock data
      setPredictionData({});
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">XREG Cost Valuation Dashboard</h1>
        <p className="text-muted-foreground">
          Explainable AI-driven property cost assessment and valuation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar with Property Search/Selection */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Property Selection</CardTitle>
              <CardDescription>
                Select a property to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Property ID</label>
                <div className="flex mt-1">
                  <input 
                    type="text" 
                    placeholder="Enter property ID"
                    className="flex-1 px-3 py-2 border rounded-l-md"
                  />
                  <Button 
                    variant="default"
                    className="rounded-l-none"
                    onClick={() => handlePropertyLoad('123456')}
                  >
                    Load
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Quick Filters</label>
                <Select defaultValue="residential">
                  <SelectTrigger>
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Region</label>
                <Select defaultValue="kennewick">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kennewick">Kennewick</SelectItem>
                    <SelectItem value="richland">Richland</SelectItem>
                    <SelectItem value="west_richland">West Richland</SelectItem>
                    <SelectItem value="prosser">Prosser</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Agent Feed Card */}
          <div className="mt-6">
            <AgentFeed />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2">
          <Card className="min-h-[600px]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  {propertyId ? `Property #${propertyId} Analysis` : 'Property Analysis'}
                </CardTitle>
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab}
                  className="w-auto"
                >
                  <TabsList>
                    <TabsTrigger value="overview">
                      <Home className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="prediction">
                      <BarChart2 className="h-4 w-4 mr-2" />
                      Prediction
                    </TabsTrigger>
                    <TabsTrigger value="reports">
                      <FileText className="h-4 w-4 mr-2" />
                      Reports
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-3">Loading property data...</span>
                </div>
              ) : propertyId ? (
                <TabsContent value="overview" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Property Summary</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Address:</span>
                            <span className="font-medium">123 Main St, Kennewick, WA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Building Type:</span>
                            <span className="font-medium">Residential (Single Family)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Year Built:</span>
                            <span className="font-medium">1974</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Living Area:</span>
                            <span className="font-medium">1,950 sq ft</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Cost Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Base Value:</span>
                            <span className="font-medium">$180,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Predicted Value:</span>
                            <span className="font-medium text-green-600">$241,320</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="font-medium">High (87%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Updated:</span>
                            <span className="font-medium">Today, 10:30 AM</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Value Explanation</h3>
                    <PredictionExplainer />
                  </div>
                </TabsContent>

                <TabsContent value="prediction" className="mt-0">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Value Prediction Details</h3>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Base County Value:</span>
                          <span>$180,000</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Predicted Value:</span>
                          <span className="text-green-600 font-bold">$241,320</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Difference:</span>
                          <span className="text-green-600">+$61,320 (+34.1%)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Prediction Model</h3>
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Model:</span>
                          <span>Gradient Boosted Trees (XGBoost)</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Training Data:</span>
                          <span>3,214 similar properties</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Accuracy (R²):</span>
                          <span>0.87</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="font-medium">Last Trained:</span>
                          <span>Yesterday, 11:45 PM</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">What-If Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Living Area (sq ft)</label>
                          <div className="flex items-center">
                            <Slider
                              defaultValue={[1950]}
                              max={3000}
                              min={1000}
                              step={50}
                              className="flex-1 mr-4"
                            />
                            <span className="w-16 text-right">1,950</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Condition</label>
                          <Select defaultValue="fair">
                            <SelectTrigger>
                              <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="poor">Poor</SelectItem>
                              <SelectItem value="fair">Fair</SelectItem>
                              <SelectItem value="good">Good</SelectItem>
                              <SelectItem value="excellent">Excellent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium mb-1 block">Roof Type</label>
                          <Select defaultValue="metal">
                            <SelectTrigger>
                              <SelectValue placeholder="Select Roof Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asphalt">Asphalt</SelectItem>
                              <SelectItem value="metal">Metal</SelectItem>
                              <SelectItem value="tile">Tile</SelectItem>
                              <SelectItem value="slate">Slate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button className="w-full mt-2">
                          Recalculate Prediction
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reports" className="mt-0">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium mb-4">Available Reports</h3>
                    
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Cost Valuation Report</h4>
                          <p className="text-sm text-muted-foreground">Detailed breakdown of property cost valuation</p>
                        </div>
                        <Button>Generate</Button>
                      </div>
                      
                      <div className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Region Comparison Report</h4>
                          <p className="text-sm text-muted-foreground">Compare against similar properties in the region</p>
                        </div>
                        <Button>Generate</Button>
                      </div>
                      
                      <div className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">Historical Value Trend</h4>
                          <p className="text-sm text-muted-foreground">Property value changes over time</p>
                        </div>
                        <Button>Generate</Button>
                      </div>
                    </div>
                    
                    <Alert>
                      <InfoIcon className="h-4 w-4" />
                      <AlertTitle>Report Generation</AlertTitle>
                      <AlertDescription>
                        Reports are generated using the latest property data and cost matrix.
                        Generated reports will be available for download as PDF.
                      </AlertDescription>
                    </Alert>
                  </div>
                </TabsContent>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-center">
                  <BarChart2 className="h-16 w-16 mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium mb-2">No Property Selected</h3>
                  <p className="text-muted-foreground max-w-md">
                    Enter a property ID or use the filters to select a property and view its analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}