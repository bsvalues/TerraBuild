/**
 * GeoAssessment Page
 * 
 * Showcases the GeoAssessment component and provides a user interface for 
 * interacting with geospatial property data and tools.
 */

import React, { useState } from 'react';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';
import GeoAssessment from '@/components/geo/GeoAssessment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Map, 
  Search, 
  Building2, 
  MapPin, 
  ChevronsDown, 
  ChevronsUp,
  Download,
  Share2,
  Printer
} from 'lucide-react';

// Sample data - in a real app, this would come from an API
const sampleLocations = [
  { id: 1, address: "123 Main St, Kennewick, WA 99336", lat: 46.211295, lng: -119.137062 },
  { id: 2, address: "456 Oak Ave, Richland, WA 99352", lat: 46.2808, lng: -119.2836 },
  { id: 3, address: "789 Pine Ln, Prosser, WA 99350", lat: 46.2073, lng: -119.7683 }
];

const GeoAssessmentPage = () => {
  const { toast } = useToast();
  const [selectedLocation, setSelectedLocation] = useState(sampleLocations[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('map');

  // Simulated search function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast({
        title: "Search Error",
        description: "Please enter an address or property ID to search",
        variant: "destructive"
      });
      return;
    }
    
    setShowSearchResults(true);
    
    // Simulate searching
    toast({
      title: "Search Results",
      description: `Found ${sampleLocations.length} matching properties`,
    });
  };

  // Select a property from search results
  const selectProperty = (location: typeof sampleLocations[0]) => {
    setSelectedLocation(location);
    setShowSearchResults(false);
    
    toast({
      title: "Location Selected",
      description: `Selected: ${location.address}`,
    });
  };

  const handleExport = (format: string) => {
    toast({
      title: `Export ${format.toUpperCase()}`,
      description: `Exporting property data in ${format.toUpperCase()} format`,
    });
  };

  return (
    <LayoutWrapper>
      <MainContent title="GeoAssessment">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GeoAssessment</h1>
            <p className="text-muted-foreground">
              Geospatial property assessment and analysis tools
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('print')}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('share')}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Side panel with search */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Find Property</CardTitle>
                <CardDescription>
                  Search by address or property ID
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch}>
                  <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search locations..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Search
                  </Button>
                </form>

                {/* Search results */}
                {showSearchResults && (
                  <div className="mt-4 border rounded-md divide-y max-h-64 overflow-auto">
                    {sampleLocations.map(location => (
                      <div 
                        key={location.id}
                        className="p-3 hover:bg-accent cursor-pointer"
                        onClick={() => selectProperty(location)}
                      >
                        <div className="flex items-start">
                          <MapPin className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{location.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Selected Property</CardTitle>
                <CardDescription>
                  Property information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedLocation ? (
                  <>
                    <div>
                      <Badge className="mb-2">Property ID: {selectedLocation.id}</Badge>
                      <p className="text-sm font-medium">{selectedLocation.address}</p>
                      <p className="text-xs text-muted-foreground">
                        Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Assessment Data</h4>
                      <div className="space-y-1">
                        <p className="text-xs flex justify-between">
                          <span className="text-muted-foreground">Land Value:</span> 
                          <span className="font-medium">$120,500</span>
                        </p>
                        <p className="text-xs flex justify-between">
                          <span className="text-muted-foreground">Building Value:</span> 
                          <span className="font-medium">$245,750</span>
                        </p>
                        <p className="text-xs flex justify-between">
                          <span className="text-muted-foreground">Total Value:</span> 
                          <span className="font-medium">$366,250</span>
                        </p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-medium">Property Details</h4>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ChevronsDown className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs flex justify-between">
                          <span className="text-muted-foreground">Property Type:</span> 
                          <span className="font-medium">Residential</span>
                        </p>
                        <p className="text-xs flex justify-between">
                          <span className="text-muted-foreground">Square Footage:</span> 
                          <span className="font-medium">2,150 sq ft</span>
                        </p>
                        <p className="text-xs flex justify-between">
                          <span className="text-muted-foreground">Year Built:</span> 
                          <span className="font-medium">1998</span>
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <Building2 className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No property selected</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Search for a property above
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main map area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList>
                <TabsTrigger value="map">Standard Map</TabsTrigger>
                <TabsTrigger value="analysis">Analysis Tools</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
            </Tabs>

            <TabsContent value="map" className="mt-0">
              <GeoAssessment 
                propertyId={selectedLocation?.id}
                latitude={selectedLocation?.lat}
                longitude={selectedLocation?.lng}
                address={selectedLocation?.address}
                showFullscreen={true}
              />
            </TabsContent>

            <TabsContent value="analysis" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Tools</CardTitle>
                  <CardDescription>
                    Advanced geospatial analysis capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Comparable Properties</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Find and analyze comparable properties in the area
                      </p>
                      <Button variant="secondary" size="sm">Run Analysis</Button>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Price Trends</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Analyze property value trends for this neighborhood
                      </p>
                      <Button variant="secondary" size="sm">View Trends</Button>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Zoning Analysis</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Check zoning regulations and compliance
                      </p>
                      <Button variant="secondary" size="sm">Check Zoning</Button>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Risk Assessment</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Analyze environmental and natural disaster risks
                      </p>
                      <Button variant="secondary" size="sm">Assess Risks</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>
                    Generate and view property reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Assessment Report</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Detailed property assessment report
                      </p>
                      <Button variant="secondary" size="sm">Generate</Button>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Valuation Report</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Property valuation and analysis
                      </p>
                      <Button variant="secondary" size="sm">Generate</Button>
                    </div>

                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Tax Report</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Property tax history and projections
                      </p>
                      <Button variant="secondary" size="sm">Generate</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
};

export default GeoAssessmentPage;