import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Map,
  LayoutGrid,
  Layers,
  Filter,
  MapPin,
  Building,
  Share2,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Search,
  Home,
  PenTool,
  MoveHorizontal,
  CircleDot,
  Info,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";

// Map regions data (would connect to API in real implementation)
const regionData = [
  {
    id: "richland",
    name: "Richland",
    code: "52100 100",
    township: "10N-28E",
    propertyCount: 12485,
    averageValue: 425600,
    valuationFactor: 1.15,
    recentUpdates: 247,
    bounds: [46.2501, -119.3425, 46.3324, -119.2253],
    color: "#3b82f6"
  },
  {
    id: "kennewick",
    name: "Kennewick",
    code: "52100 140",
    township: "08N-29E",
    propertyCount: 16750,
    averageValue: 392100,
    valuationFactor: 1.08,
    recentUpdates: 318,
    bounds: [46.1671, -119.2214, 46.2467, -119.0761],
    color: "#14b8a6"
  },
  {
    id: "west_richland",
    name: "West Richland",
    code: "52100 160",
    township: "09N-27E",
    propertyCount: 6320,
    averageValue: 447300,
    valuationFactor: 1.21,
    recentUpdates: 128,
    bounds: [46.2567, -119.4182, 46.3305, -119.3381],
    color: "#8b5cf6"
  },
  {
    id: "pasco",
    name: "Pasco",
    code: "52100 120",
    township: "09N-30E",
    propertyCount: 14820,
    averageValue: 356700,
    valuationFactor: 0.97,
    recentUpdates: 276,
    bounds: [46.1971, -119.1684, 46.2758, -119.0412],
    color: "#f59e0b"
  },
  {
    id: "prosser",
    name: "Prosser",
    code: "52100 180",
    township: "09N-24E",
    propertyCount: 2830,
    averageValue: 319400,
    valuationFactor: 0.89,
    recentUpdates: 67,
    bounds: [46.1924, -119.8184, 46.2293, -119.7427],
    color: "#ec4899"
  },
  {
    id: "benton_city",
    name: "Benton City",
    code: "52100 200",
    township: "09N-26E",
    propertyCount: 1860,
    averageValue: 297800,
    valuationFactor: 0.84,
    recentUpdates: 42,
    bounds: [46.2399, -119.5214, 46.2791, -119.4526],
    color: "#10b981"
  }
];

// Layer types for the map
const mapLayers = [
  { id: "standard", name: "Standard", icon: Map },
  { id: "satellite", name: "Satellite", icon: LayoutGrid },
  { id: "hybrid", name: "Hybrid", icon: Layers },
  { id: "terrain", name: "Terrain", icon: LayoutGrid }
];

// Map visualization types
const vizTypes = [
  { id: "region", name: "Region Boundaries", icon: Map },
  { id: "value", name: "Property Value Heatmap", icon: Layers },
  { id: "density", name: "Property Density", icon: LayoutGrid },
  { id: "factor", name: "Cost Factors", icon: Filter },
  { id: "updates", name: "Recent Updates", icon: RotateCcw }
];

// Property data for region detail view
const sampleProperties = [
  {
    id: "P10055732",
    address: "152 Meadow Hills Dr",
    type: "Residential",
    value: 425000,
    lastUpdated: "2025-02-15"
  },
  {
    id: "P10055148",
    address: "2187 Riverfront Way",
    type: "Residential",
    value: 682000,
    lastUpdated: "2025-02-28"
  },
  {
    id: "P10056344",
    address: "845 Columbia Point Dr",
    type: "Residential",
    value: 578300,
    lastUpdated: "2025-03-05"
  },
  {
    id: "C10023187",
    address: "12400 Tapteal Dr",
    type: "Commercial",
    value: 1876000,
    lastUpdated: "2025-01-22"
  },
  {
    id: "P10058921",
    address: "3315 Westlake Dr",
    type: "Residential",
    value: 395000,
    lastUpdated: "2025-03-12"
  }
];

const ValuationMapsPage = () => {
  const [selectedTab, setSelectedTab] = useState("map");
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeMapTool, setActiveMapTool] = useState<string>("pan");
  const [selectedLayer, setSelectedLayer] = useState("standard");
  const [selectedViz, setSelectedViz] = useState("region");
  const [searchQuery, setSearchQuery] = useState("");
  const [zoomLevel, setZoomLevel] = useState(50);
  
  // Get the selected region data if a region is selected
  const regionDetail = selectedRegion 
    ? regionData.find(r => r.id === selectedRegion) 
    : null;
  
  // Filtering regions based on search query
  const filteredRegions = regionData.filter(
    region => 
      region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.township.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Handle region selection
  const handleRegionSelect = (regionId: string) => {
    setSelectedRegion(regionId);
    setSelectedTab("detail");
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Reset the selected region
  const handleBackToMap = () => {
    setSelectedTab("map");
    setSelectedRegion(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Valuation Maps</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-blue-700 text-blue-200">
            <Share2 className="mr-2 h-4 w-4" />
            Share Map
          </Button>
          <Button variant="outline" className="border-blue-700 text-blue-200">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="map" className="data-[state=active]:bg-blue-800/50">
            <Map className="h-4 w-4 mr-2" />
            Map View
          </TabsTrigger>
          {selectedRegion && (
            <TabsTrigger value="detail" className="data-[state=active]:bg-blue-800/50">
              <Info className="h-4 w-4 mr-2" />
              Region Detail
            </TabsTrigger>
          )}
          <TabsTrigger value="layers" className="data-[state=active]:bg-blue-800/50">
            <Layers className="h-4 w-4 mr-2" />
            Layers & Filters
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-blue-800/50">
            <Building className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-blue-900/30 border-blue-800/40">
                <CardHeader>
                  <CardTitle className="text-blue-100">Regions</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      placeholder="Search regions..."
                      className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  <div className="space-y-3">
                    {filteredRegions.length > 0 ? (
                      filteredRegions.map((region) => (
                        <div
                          key={region.id}
                          className="bg-blue-900/50 p-3 rounded-md border border-blue-800/40 hover:border-blue-700/60 cursor-pointer transition-colors"
                          onClick={() => handleRegionSelect(region.id)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-blue-100 font-medium">{region.name}</h3>
                              <div className="text-blue-400 text-sm mt-1">
                                Hood Code: {region.code}
                              </div>
                              <div className="text-blue-400 text-sm">
                                Township: {region.township}
                              </div>
                            </div>
                            <div 
                              className="h-3 w-3 rounded-full" 
                              style={{ backgroundColor: region.color }}
                            />
                          </div>
                          <div className="flex justify-between mt-3 text-sm">
                            <span className="text-blue-300">{region.propertyCount.toLocaleString()} properties</span>
                            <span className="text-blue-300">Avg: {formatCurrency(region.averageValue)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <MapPin className="h-8 w-8 text-blue-700/50 mx-auto mb-2" />
                        <p className="text-blue-300">No regions found</p>
                        <p className="text-blue-400 text-sm mt-1">
                          Try different search terms
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-blue-900/30 border-blue-800/40">
                <CardContent className="p-0">
                  {/* Map Controls */}
                  <div className="p-2 bg-blue-900/60 border-b border-blue-800/40 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                        <SelectTrigger className="w-[140px] h-8 bg-blue-900/50 text-blue-200 border-blue-700/50">
                          <SelectValue placeholder="Base layer" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-950 border-blue-800/60">
                          {mapLayers.map(layer => (
                            <SelectItem key={layer.id} value={layer.id} className="text-blue-200">
                              <div className="flex items-center">
                                <layer.icon className="h-4 w-4 mr-2 text-blue-400" />
                                {layer.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={selectedViz} onValueChange={setSelectedViz}>
                        <SelectTrigger className="w-[180px] h-8 bg-blue-900/50 text-blue-200 border-blue-700/50">
                          <SelectValue placeholder="Visualization" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-950 border-blue-800/60">
                          {vizTypes.map(viz => (
                            <SelectItem key={viz.id} value={viz.id} className="text-blue-200">
                              <div className="flex items-center">
                                <viz.icon className="h-4 w-4 mr-2 text-blue-400" />
                                {viz.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant={activeMapTool === "pan" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                        onClick={() => setActiveMapTool("pan")}
                      >
                        <MoveHorizontal className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={activeMapTool === "draw" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                        onClick={() => setActiveMapTool("draw")}
                      >
                        <PenTool className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={activeMapTool === "measure" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                        onClick={() => setActiveMapTool("measure")}
                      >
                        <CircleDot className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant={activeMapTool === "info" ? "default" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                        onClick={() => setActiveMapTool("info")}
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 mx-1 bg-blue-800/40" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                      >
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 bg-blue-900/70"
                      >
                        <Home className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Map Display */}
                  <div className="bg-blue-950 aspect-[16/9] max-h-[600px] relative flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-16 w-16 text-blue-700/40 mx-auto mb-2" />
                      <h3 className="text-blue-200 text-lg font-medium">Interactive GIS Map</h3>
                      <p className="text-blue-400 mt-1 max-w-md">
                        This is where the interactive map would be displayed.
                        Select a region from the list to view detailed information.
                      </p>
                      
                      {/* Map Legend */}
                      <div className="absolute bottom-4 right-4 bg-blue-900/80 p-3 rounded-md border border-blue-800/60">
                        <h4 className="text-blue-200 text-sm font-medium mb-2">{selectedViz === "value" ? "Property Value" : "Region Legend"}</h4>
                        <div className="space-y-1.5">
                          {regionData.slice(0, 4).map((region) => (
                            <div key={region.id} className="flex items-center text-xs">
                              <div 
                                className="h-3 w-3 rounded-full mr-2" 
                                style={{ backgroundColor: region.color }}
                              />
                              <span className="text-blue-300 mr-2">{region.name}</span>
                              {selectedViz === "value" && (
                                <span className="text-blue-400">
                                  Avg: {formatCurrency(region.averageValue)}
                                </span>
                              )}
                              {selectedViz === "factor" && (
                                <span className="text-blue-400">
                                  Factor: {region.valuationFactor.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Zoom slider */}
                      <div className="absolute bottom-4 left-4 bg-blue-900/80 p-2 rounded-md border border-blue-800/60 flex items-center space-x-2">
                        <ZoomOut className="h-4 w-4 text-blue-400" />
                        <Slider
                          value={[zoomLevel]}
                          min={0}
                          max={100}
                          step={1}
                          className="w-32"
                          onValueChange={(value) => setZoomLevel(value[0])}
                        />
                        <ZoomIn className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-900/30 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-blue-100">Property Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-100">
                      {regionData.reduce((total, region) => total + region.propertyCount, 0).toLocaleString()}
                    </div>
                    <p className="text-blue-400 text-sm mt-1">
                      Total properties across all regions
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900/30 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-blue-100">Average Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-100">
                      {formatCurrency(
                        regionData.reduce((sum, region) => sum + region.averageValue, 0) / regionData.length
                      )}
                    </div>
                    <p className="text-blue-400 text-sm mt-1">
                      Average property value across regions
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900/30 border-blue-800/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-blue-100">Recent Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-100">
                      {regionData.reduce((total, region) => total + region.recentUpdates, 0).toLocaleString()}
                    </div>
                    <p className="text-blue-400 text-sm mt-1">
                      Property valuations updated in last 30 days
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="detail" className="space-y-4">
          {regionDetail && (
            <>
              <Button 
                variant="outline" 
                className="border-blue-700 text-blue-200"
                onClick={handleBackToMap}
              >
                <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                Back to Map
              </Button>
              
              <Card className="bg-blue-900/30 border-blue-800/40">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-blue-100 text-xl flex items-center">
                        {regionDetail.name}
                        <Badge className="ml-2 bg-blue-700/50">{regionDetail.code}</Badge>
                      </CardTitle>
                      <CardDescription className="text-blue-300">
                        Township: {regionDetail.township} • Property Count: {regionDetail.propertyCount.toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button variant="outline" className="border-blue-700 text-blue-200">
                      <Download className="mr-2 h-4 w-4" />
                      Export Region Data
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-1">
                      <Label className="text-blue-300">Average Property Value</Label>
                      <div className="text-2xl font-bold text-blue-100">{formatCurrency(regionDetail.averageValue)}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-blue-300">Regional Cost Factor</Label>
                      <div className="text-2xl font-bold text-blue-100">{regionDetail.valuationFactor.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-blue-300">Recent Updates</Label>
                      <div className="text-2xl font-bold text-blue-100">{regionDetail.recentUpdates}</div>
                    </div>
                  </div>
                  
                  <Separator className="my-6 bg-blue-800/40" />
                  
                  <div className="space-y-4">
                    <h3 className="text-blue-100 font-medium">Sample Properties in {regionDetail.name}</h3>
                    <div className="rounded-md border border-blue-800/40 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-blue-900/60 border-b border-blue-800/40">
                          <tr>
                            <th className="text-left p-3 text-blue-200 font-medium">Property ID</th>
                            <th className="text-left p-3 text-blue-200 font-medium">Address</th>
                            <th className="text-left p-3 text-blue-200 font-medium">Type</th>
                            <th className="text-left p-3 text-blue-200 font-medium">Value</th>
                            <th className="text-left p-3 text-blue-200 font-medium">Last Updated</th>
                            <th className="text-left p-3 text-blue-200 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleProperties.map((property, index) => (
                            <tr 
                              key={property.id}
                              className={`border-b border-blue-800/40 ${
                                index % 2 === 0 ? 'bg-blue-900/30' : 'bg-blue-900/10'
                              } hover:bg-blue-800/30`}
                            >
                              <td className="p-3 text-blue-200">{property.id}</td>
                              <td className="p-3 text-blue-200">{property.address}</td>
                              <td className="p-3">
                                <Badge className={`${
                                  property.type === 'Residential' 
                                    ? 'bg-blue-700/50 hover:bg-blue-700/70' 
                                    : 'bg-purple-700/50 hover:bg-purple-700/70'
                                }`}>
                                  {property.type}
                                </Badge>
                              </td>
                              <td className="p-3 text-blue-200">{formatCurrency(property.value)}</td>
                              <td className="p-3 text-blue-300">{property.lastUpdated}</td>
                              <td className="p-3">
                                <Button variant="outline" size="sm" className="border-blue-700 text-blue-200">
                                  View Details
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-center mt-4">
                      <Button variant="outline" className="border-blue-700 text-blue-200">
                        View All Properties
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-blue-900/30 border-blue-800/40">
                  <CardHeader>
                    <CardTitle className="text-blue-100">Value Distribution</CardTitle>
                    <CardDescription className="text-blue-300">
                      Property value distribution across {regionDetail.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Layers className="h-12 w-12 text-blue-700/40 mx-auto mb-2" />
                      <p className="text-blue-200">Value distribution chart would appear here</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-900/30 border-blue-800/40">
                  <CardHeader>
                    <CardTitle className="text-blue-100">Property Types</CardTitle>
                    <CardDescription className="text-blue-300">
                      Breakdown of property types in {regionDetail.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] flex items-center justify-center">
                    <div className="text-center">
                      <Layers className="h-12 w-12 text-blue-700/40 mx-auto mb-2" />
                      <p className="text-blue-200">Property type distribution chart would appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="layers" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Map Layers</CardTitle>
              <CardDescription className="text-blue-300">
                Configure the layers and visualizations displayed on the map
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Base Map</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {mapLayers.map(layer => (
                        <div
                          key={layer.id}
                          className={`p-3 rounded-md border flex items-center gap-2 cursor-pointer ${
                            selectedLayer === layer.id
                              ? 'border-blue-500 bg-blue-900/50'
                              : 'border-blue-800/40 bg-blue-900/20 hover:bg-blue-900/30'
                          }`}
                          onClick={() => setSelectedLayer(layer.id)}
                        >
                          <layer.icon className="h-5 w-5 text-blue-400" />
                          <span className="text-blue-200">{layer.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Data Layers</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="layer-boundaries" className="accent-blue-500" defaultChecked />
                        <Label htmlFor="layer-boundaries" className="text-blue-200">Region Boundaries</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="layer-parcels" className="accent-blue-500" defaultChecked />
                        <Label htmlFor="layer-parcels" className="text-blue-200">Property Parcels</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="layer-streets" className="accent-blue-500" defaultChecked />
                        <Label htmlFor="layer-streets" className="text-blue-200">Streets & Roads</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="layer-landmarks" className="accent-blue-500" />
                        <Label htmlFor="layer-landmarks" className="text-blue-200">Landmarks</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="layer-zones" className="accent-blue-500" />
                        <Label htmlFor="layer-zones" className="text-blue-200">Zoning Areas</Label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Data Visualization</h3>
                    <div className="space-y-3">
                      {vizTypes.map(viz => (
                        <div
                          key={viz.id}
                          className={`p-3 rounded-md border flex items-center gap-2 cursor-pointer ${
                            selectedViz === viz.id
                              ? 'border-blue-500 bg-blue-900/50'
                              : 'border-blue-800/40 bg-blue-900/20 hover:bg-blue-900/30'
                          }`}
                          onClick={() => setSelectedViz(viz.id)}
                        >
                          <viz.icon className="h-5 w-5 text-blue-400" />
                          <div>
                            <div className="text-blue-200">{viz.name}</div>
                            <div className="text-blue-400 text-sm">
                              {viz.id === 'region' && 'Display region boundaries with color coding'}
                              {viz.id === 'value' && 'Heatmap showing property values across the county'}
                              {viz.id === 'density' && 'Visualization of property density by area'}
                              {viz.id === 'factor' && 'Map of regional cost adjustment factors'}
                              {viz.id === 'updates' && 'Highlight areas with recent valuation updates'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-blue-100 font-medium mb-2">Property Filters</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="type-filter" className="text-sm text-blue-300">Property Type</Label>
                          <Select defaultValue="all">
                            <SelectTrigger id="type-filter" className="bg-blue-900/50 border-blue-700/50 text-blue-200">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-blue-950 border-blue-800/60">
                              <SelectItem value="all" className="text-blue-200">All Types</SelectItem>
                              <SelectItem value="residential" className="text-blue-200">Residential</SelectItem>
                              <SelectItem value="commercial" className="text-blue-200">Commercial</SelectItem>
                              <SelectItem value="industrial" className="text-blue-200">Industrial</SelectItem>
                              <SelectItem value="agricultural" className="text-blue-200">Agricultural</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor="value-filter" className="text-sm text-blue-300">Value Range</Label>
                          <Select defaultValue="all">
                            <SelectTrigger id="value-filter" className="bg-blue-900/50 border-blue-700/50 text-blue-200">
                              <SelectValue placeholder="All Values" />
                            </SelectTrigger>
                            <SelectContent className="bg-blue-950 border-blue-800/60">
                              <SelectItem value="all" className="text-blue-200">All Values</SelectItem>
                              <SelectItem value="low" className="text-blue-200">&lt; $300,000</SelectItem>
                              <SelectItem value="medium" className="text-blue-200">$300,000 - $600,000</SelectItem>
                              <SelectItem value="high" className="text-blue-200">&gt; $600,000</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-blue-700 hover:bg-blue-600">
                        Apply Filters
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="properties" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-blue-100">Property Search</CardTitle>
                  <CardDescription className="text-blue-300">
                    Find properties by ID, address, or owner name
                  </CardDescription>
                </div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-blue-700 text-blue-200">
                      <Filter className="mr-2 h-4 w-4" />
                      Advanced Search
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-blue-950 border border-blue-800/60">
                    <div className="space-y-4">
                      <h4 className="font-medium text-blue-100">Advanced Search Filters</h4>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-blue-300">Property Type</Label>
                          <Select defaultValue="all">
                            <SelectTrigger className="w-full bg-blue-900/50 border-blue-700/50 text-blue-200">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent className="bg-blue-950 border-blue-800/60">
                              <SelectItem value="all" className="text-blue-200">All Types</SelectItem>
                              <SelectItem value="residential" className="text-blue-200">Residential</SelectItem>
                              <SelectItem value="commercial" className="text-blue-200">Commercial</SelectItem>
                              <SelectItem value="industrial" className="text-blue-200">Industrial</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-blue-300">Region</Label>
                          <Select defaultValue="all">
                            <SelectTrigger className="w-full bg-blue-900/50 border-blue-700/50 text-blue-200">
                              <SelectValue placeholder="All Regions" />
                            </SelectTrigger>
                            <SelectContent className="bg-blue-950 border-blue-800/60">
                              <SelectItem value="all" className="text-blue-200">All Regions</SelectItem>
                              {regionData.map(region => (
                                <SelectItem key={region.id} value={region.id} className="text-blue-200">
                                  {region.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-blue-300">Value Range</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input 
                              placeholder="Min" 
                              className="bg-blue-900/50 border-blue-700/50 text-blue-200"
                            />
                            <Input 
                              placeholder="Max" 
                              className="bg-blue-900/50 border-blue-700/50 text-blue-200"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Checkbox id="recent-updates" />
                          <Label htmlFor="recent-updates" className="text-blue-200">Only show recently updated</Label>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-blue-700 hover:bg-blue-600">Apply Filters</Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search properties by ID, address, or owner name..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-blue-700/40 mx-auto mb-3" />
                <h3 className="text-blue-100 text-lg font-medium">Enter search criteria</h3>
                <p className="text-blue-300 mt-2 max-w-md mx-auto">
                  Search for properties by ID, address, or owner name to view detailed information and valuation history.
                </p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  <Button variant="outline" className="border-blue-700 text-blue-200 flex items-center justify-center gap-2">
                    <Map className="h-4 w-4" />
                    Search By Map
                  </Button>
                  <Button variant="outline" className="border-blue-700 text-blue-200 flex items-center justify-center gap-2">
                    <Building className="h-4 w-4" />
                    Browse Recent
                  </Button>
                  <Button variant="outline" className="border-blue-700 text-blue-200 flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Property List
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ValuationMapsPage;