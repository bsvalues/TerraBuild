import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Map, Layers, Zap, Building2, TrendingUp, MapPin, Filter, Download, Activity, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const MapsPage = () => {
  const [selectedLayer, setSelectedLayer] = useState('property-values');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [analysisMode, setAnalysisMode] = useState<'value' | 'trends' | 'costs' | 'ai'>('value');
  const [timeRange, setTimeRange] = useState('1year');

  const mapLayers = [
    { id: 'property-values', name: 'Property Values', icon: Building2, active: selectedLayer === 'property-values' },
    { id: 'cost-trends', name: 'Cost Trends', icon: TrendingUp, active: selectedLayer === 'cost-trends' },
    { id: 'districts', name: 'Tax Districts', icon: MapPin, active: selectedLayer === 'districts' },
    { id: 'zoning', name: 'Zoning Areas', icon: Layers, active: selectedLayer === 'zoning' }
  ];

  const regions = [
    { id: 'richland', name: 'Richland', properties: 15010, avgValue: '$819,635' },
    { id: 'kennewick', name: 'Kennewick', properties: 18010, avgValue: '$617,854' },
    { id: 'pasco', name: 'Pasco', properties: 12005, avgValue: '$463,330' },
    { id: 'west-richland', name: 'West Richland', properties: 5005, avgValue: '$597,497' },
    { id: 'prosser', name: 'Prosser', properties: 1405, avgValue: '$357,855' },
    { id: 'benton-city', name: 'Benton City', properties: 705, avgValue: '$272,495' }
  ];

  // Fetch real geographic analysis data from Benton County database
  const { data: mapData, isLoading: mapLoading } = useQuery({
    queryKey: ['/api/geographic/map-data', analysisMode, timeRange],
    staleTime: 300000 // 5 minutes
  });

  const { data: regionalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/geographic/regional-stats'],
    staleTime: 600000 // 10 minutes
  });

  const { data: liveAnalysis } = useQuery({
    queryKey: ['/api/geographic/live-analysis'],
    refetchInterval: 30000 // 30 seconds
  });

  const analytics = [
    { label: 'Total Properties Mapped', value: '52,141', change: '+5.2%' },
    { label: 'Coverage Area', value: '1,703 sq mi', change: '100%' },
    { label: 'Avg Property Value', value: '$677,488', change: '+5.2%' },
    { label: 'Last Updated', value: 'Jun 11, 2025', change: 'Current' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Geographic Analysis</h1>
          <p className="text-slate-400 mt-1">Interactive mapping and spatial analysis for 52,141 Benton County properties</p>
        </div>
        <div className="flex gap-3">
          <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Property Values</SelectItem>
              <SelectItem value="trends">Market Trends</SelectItem>
              <SelectItem value="costs">Building Costs</SelectItem>
              <SelectItem value="ai">AI Insights</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Map
          </Button>
          <Button size="sm" disabled={mapLoading}>
            {mapLoading ? (
              <Activity className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {mapLoading ? 'Loading...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {analytics.map((stat, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Map className="h-8 w-8 text-sky-400" />
                <div>
                  <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xs text-emerald-400">{stat.change}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-100">Interactive Map</CardTitle>
                <div className="flex gap-2">
                  <Select value={selectedLayer} onValueChange={setSelectedLayer}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mapLayers.map((layer) => (
                        <SelectItem key={layer.id} value={layer.id}>
                          {layer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-[16/10] bg-slate-900/50 rounded-lg border border-slate-700/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="text-sm font-medium text-slate-100">Benton County, WA</div>
                      <div className="text-xs text-slate-400">
                        {selectedLayer === 'property-values' && 'Property Value Heatmap • 52,141 Properties'}
                        {selectedLayer === 'cost-trends' && 'Cost Trend Analysis • Market Movement'}
                        {selectedLayer === 'districts' && 'Tax District Boundaries • Geographic Zones'}
                        {selectedLayer === 'zoning' && 'Zoning Classifications • Land Use Areas'}
                      </div>
                    </div>
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      {selectedLayer === 'property-values' && (
                        <>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                            <span className="text-slate-300">High Value ($800K+)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-slate-300">Medium Value ($400-800K)</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span className="text-slate-300">Lower Value (Under $400K)</span>
                          </div>
                        </>
                      )}
                      {selectedLayer === 'cost-trends' && (
                        <>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                            <span className="text-slate-300">Rising Trend ↗</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-amber-500 rounded"></div>
                            <span className="text-slate-300">Stable Market →</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span className="text-slate-300">Declining ↘</span>
                          </div>
                        </>
                      )}
                      {selectedLayer === 'districts' && (
                        <>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-purple-500 rounded"></div>
                            <span className="text-slate-300">Tax Districts</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-violet-400 rounded"></div>
                            <span className="text-slate-300">Boundaries</span>
                          </div>
                        </>
                      )}
                      {selectedLayer === 'zoning' && (
                        <>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                            <span className="text-slate-300">Residential</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-teal-400 rounded"></div>
                            <span className="text-slate-300">Commercial</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs mt-1">
                            <div className="w-3 h-3 bg-sky-400 rounded"></div>
                            <span className="text-slate-300">Industrial</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <div className="text-slate-400 text-lg font-medium">
                        {mapLoading ? 'Loading Geographic Data...' : 'TerraFusion-AI Interactive Map'}
                      </div>
                      <div className="text-slate-500 text-sm">
                        {mapData ? `${mapData.properties?.length || 0} properties loaded` : 'Geographic data visualization'}
                      </div>
                      {mapData && (
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-blue-900/30 p-2 rounded">
                            Analysis: {analysisMode.charAt(0).toUpperCase() + analysisMode.slice(1)}
                          </div>
                          <div className="bg-green-900/30 p-2 rounded">
                            Properties: {mapData.properties?.length || 0}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layer-Specific Property Visualization */}
                  {mapData?.properties.slice(0, 30).map((property, index) => {
                    let markerColor = '#3b82f6';
                    let markerSize = 'w-3 h-3';
                    let markerIcon = 'w-1 h-1 bg-white rounded-full';
                    
                    // Change visualization based on selected layer
                    switch (selectedLayer) {
                      case 'property-values':
                        markerColor = property.value > 800000 ? '#10b981' : 
                                    property.value > 500000 ? '#3b82f6' :
                                    property.value > 300000 ? '#f59e0b' : '#ef4444';
                        markerSize = property.value > 600000 ? 'w-4 h-4' : 'w-3 h-3';
                        break;
                      case 'cost-trends':
                        markerColor = property.marketTrend === 'up' ? '#10b981' : 
                                    property.marketTrend === 'stable' ? '#f59e0b' : '#ef4444';
                        markerIcon = property.marketTrend === 'up' ? 'w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-white' : markerIcon;
                        break;
                      case 'districts':
                        markerColor = '#8b5cf6';
                        markerSize = 'w-2 h-2';
                        break;
                      case 'zoning':
                        markerColor = '#06b6d4';
                        markerIcon = 'w-1 h-1 bg-white';
                        break;
                    }

                    return (
                      <div
                        key={property.id}
                        className={`absolute ${markerSize} rounded-full border border-white shadow-lg cursor-pointer transform -translate-x-1.5 -translate-y-1.5 hover:scale-150 transition-all hover:z-10`}
                        style={{
                          left: `${(() => {
                            // Convert real coordinates to map position using Benton County bounds
                            const bentonLngMin = -119.8, bentonLngMax = -119.0;
                            const normalizedLng = (property.coordinates[0] - bentonLngMin) / (bentonLngMax - bentonLngMin);
                            return Math.max(15, Math.min(85, normalizedLng * 70 + 15));
                          })()}%`,
                          top: `${(() => {
                            const bentonLatMin = 46.0, bentonLatMax = 46.5;
                            const normalizedLat = (property.coordinates[1] - bentonLatMin) / (bentonLatMax - bentonLatMin);
                            return Math.max(15, Math.min(75, (1 - normalizedLat) * 60 + 15));
                          })()}%`,
                          backgroundColor: markerColor,
                          transform: 'translate(-50%, -50%)'
                        }}
                        title={`${property.address}\n${property.city}\n$${property.value.toLocaleString()}\n${property.sqft} sqft\nBuilt: ${property.yearBuilt}\nLayer: ${selectedLayer}`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <div className={markerIcon} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Market Hotspots from Real Benton County Coordinates */}
                  {selectedLayer === 'property-values' && mapData?.marketAnalysis?.hotspots?.map((hotspot, index) => {
                    // Convert real coordinates to map position using Benton County bounds
                    const bentonLngMin = -119.8, bentonLngMax = -119.0;
                    const bentonLatMin = 46.0, bentonLatMax = 46.5;
                    const normalizedLng = (hotspot.center[0] - bentonLngMin) / (bentonLngMax - bentonLngMin);
                    const normalizedLat = (hotspot.center[1] - bentonLatMin) / (bentonLatMax - bentonLatMin);
                    const mapX = Math.max(15, Math.min(85, normalizedLng * 70 + 15));
                    const mapY = Math.max(15, Math.min(75, (1 - normalizedLat) * 60 + 15));
                    
                    return (
                      <div
                        key={`hotspot-${index}`}
                        className="absolute rounded-full border-2 border-orange-400/70 bg-orange-400/25 animate-pulse"
                        style={{
                          left: `${mapX}%`,
                          top: `${mapY}%`,
                          width: `${hotspot.intensity * 60}px`,
                          height: `${hotspot.intensity * 60}px`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        title={`Market Hotspot ${index + 1}\nReal Coordinates: ${hotspot.center[0].toFixed(4)}, ${hotspot.center[1].toFixed(4)}\nIntensity: ${(hotspot.intensity * 100).toFixed(1)}%\nRadius: ${hotspot.radius}m`}
                      />
                    );
                  })}

                  <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-1">Selected Area</div>
                    <div className="text-sm font-medium text-slate-100">Tri-Cities Metro Area</div>
                    <div className="text-xs text-slate-400">52,141 properties</div>
                    <div className="text-xs text-emerald-400">Avg: $677,488</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 text-lg">Map Layers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mapLayers.map((layer) => (
                  <div
                    key={layer.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLayer === layer.id
                        ? 'bg-sky-500/10 border-sky-500/30'
                        : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-700/30'
                    }`}
                    onClick={() => setSelectedLayer(layer.id)}
                  >
                    <layer.icon className={`h-5 w-5 ${
                      selectedLayer === layer.id ? 'text-sky-400' : 'text-slate-400'
                    }`} />
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${
                        selectedLayer === layer.id ? 'text-slate-100' : 'text-slate-300'
                      }`}>
                        {layer.name}
                      </div>
                    </div>
                    {layer.active && (
                      <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 text-lg flex items-center gap-2">
                Regional Summary
                {statsLoading && <Activity className="h-4 w-4 animate-spin" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(regionalStats || regions).map((region) => (
                  <div key={region.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-slate-100">{region.name}</div>
                      <Badge variant="outline" className="border-sky-500/30 text-sky-400 text-xs">
                        {region.properties.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-400">
                      Avg Value: <span className="text-emerald-400 font-medium">{region.avgValue}</span>
                    </div>
                    {regionalStats && (
                      <div className="text-xs text-slate-500 mt-1">
                        Total Value: ${Math.round((region.totalValue || 0) / 1000000)}M
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 text-lg">Analysis Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Value Trend Analysis
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Property Density
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MapPin className="h-4 w-4 mr-2" />
                  Distance Analysis
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Layers className="h-4 w-4 mr-2" />
                  Zoning Overlay
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapsPage;