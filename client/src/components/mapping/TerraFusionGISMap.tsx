import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Map, Layers, Search, Filter, BarChart3, TrendingUp, 
  MapPin, Settings, Eye, EyeOff, Zap, Brain, Target,
  Activity, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

interface Property {
  id: number;
  parcelNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  marketValue: number;
  squareFootage: number;
  propertyType: string;
  year_built: number;
  neighborhood: string;
}

interface GISLayer {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
  geometry_type: string;
}

interface AnalysisResult {
  property_id: number;
  proximity_scores: any;
  accessibility_metrics: any;
  environmental_risk: any;
  market_position: any;
  ai_insights: any;
  confidence_score: number;
}

export const TerraFusionGISMap: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 46.2382, lng: -119.2312 });
  const [zoomLevel, setZoomLevel] = useState(11);
  const [activeAnalysis, setActiveAnalysis] = useState<string | null>(null);
  const [heatmapType, setHeatmapType] = useState('property-values');
  const [activeLayers, setActiveLayers] = useState<Set<number>>(new Set());
  const [searchRadius, setSearchRadius] = useState([1000]);
  const mapRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: layers = [] } = useQuery({
    queryKey: ['/api/gis/layers'],
    queryFn: async () => {
      const response = await fetch('/api/gis/layers?active=true');
      return response.json();
    }
  });

  const { data: properties = [], isLoading: propertiesLoading, error: propertiesError } = useQuery({
    queryKey: ['/api/gis/spatial-search', mapCenter, searchRadius[0]],
    queryFn: async () => {
      const response = await fetch(
        `/api/gis/spatial-search?lat=${mapCenter.lat}&lng=${mapCenter.lng}&radius=${searchRadius[0]}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: heatmapData = [] } = useQuery({
    queryKey: ['/api/gis/heatmap', heatmapType],
    queryFn: async () => {
      const response = await fetch(`/api/gis/heatmap/${heatmapType}`);
      return response.json();
    }
  });

  const { data: analysisResult } = useQuery({
    queryKey: ['/api/gis/analysis-results', selectedProperty?.id],
    queryFn: async () => {
      if (!selectedProperty?.id) return null;
      const response = await fetch(`/api/gis/analysis-results/${selectedProperty.id}`);
      return response.json();
    },
    enabled: !!selectedProperty?.id
  });

  const analyzePropertyMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await fetch(`/api/gis/analyze/property/${propertyId}`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/gis/analysis-results'] });
    }
  });

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setMapCenter({ lat: property.latitude, lng: property.longitude });
    setZoomLevel(16);
  };

  const handleAnalyzeProperty = () => {
    if (selectedProperty) {
      setActiveAnalysis('running');
      analyzePropertyMutation.mutate(selectedProperty.id, {
        onSuccess: () => {
          setActiveAnalysis('completed');
          setTimeout(() => setActiveAnalysis(null), 3000);
        },
        onError: () => {
          setActiveAnalysis('error');
          setTimeout(() => setActiveAnalysis(null), 3000);
        }
      });
    }
  };

  const toggleLayer = (layerId: number) => {
    const newActiveLayers = new Set(activeLayers);
    if (newActiveLayers.has(layerId)) {
      newActiveLayers.delete(layerId);
    } else {
      newActiveLayers.add(layerId);
    }
    setActiveLayers(newActiveLayers);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAnalysisStatusIcon = () => {
    switch (activeAnalysis) {
      case 'running':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <div className="h-screen flex bg-slate-950">
      <div className="w-96 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">TerraFusion GIS</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-2 block">Search Radius (meters)</label>
              <Slider
                value={searchRadius}
                onValueChange={setSearchRadius}
                max={5000}
                min={100}
                step={100}
                className="w-full"
              />
              <div className="text-xs text-slate-500 mt-1">{searchRadius[0]}m</div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-2 block">Heatmap Type</label>
              <Select value={heatmapType} onValueChange={setHeatmapType}>
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="property-values">Property Values</SelectItem>
                  <SelectItem value="density">Property Density</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs defaultValue="properties" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 m-4">
            <TabsTrigger value="properties" className="text-xs">Properties</TabsTrigger>
            <TabsTrigger value="layers" className="text-xs">Layers</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {propertiesLoading && (
                <div className="text-center text-slate-400 p-4">
                  Loading properties...
                </div>
              )}
              {propertiesError && (
                <div className="text-center text-red-400 p-4">
                  Error loading properties
                </div>
              )}
              {properties && Array.isArray(properties) && properties.length > 0 ? (
                properties.map((property: Property) => (
                <Card 
                  key={property.id}
                  className={`cursor-pointer transition-colors ${
                    selectedProperty?.id === property.id 
                      ? 'bg-blue-900/30 border-blue-500' 
                      : 'bg-slate-800/50 border-slate-600 hover:bg-slate-700/50'
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-white">{property.address}</h4>
                      <Badge variant="outline" className="text-xs">
                        {property.propertyType}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Value:</span>
                        <span className="text-green-400">{formatCurrency(property.marketValue || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sq Ft:</span>
                        <span>{property.squareFootage?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Built:</span>
                        <span>{property.year_built || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              ) : (
                <div className="text-center text-slate-400 p-4">
                  No properties found in this area
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="layers" className="flex-1 overflow-auto p-4">
            <div className="space-y-2">
              {layers.map((layer: GISLayer) => (
                <div 
                  key={layer.id}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-600"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{layer.name}</h4>
                    <p className="text-xs text-slate-400">{layer.type} • {layer.geometry_type}</p>
                  </div>
                  <Switch
                    checked={activeLayers.has(layer.id)}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 overflow-auto p-4">
            {selectedProperty ? (
              <div className="space-y-4">
                <Card className="bg-slate-800/50 border-slate-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Selected Property
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs space-y-1">
                      <div className="text-white font-medium">{selectedProperty.address}</div>
                      <div className="text-slate-400">Parcel: {selectedProperty.parcelNumber}</div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleAnalyzeProperty}
                  disabled={analyzePropertyMutation.isPending}
                  className="w-full"
                  variant={activeAnalysis === 'completed' ? 'default' : 'outline'}
                >
                  {getAnalysisStatusIcon()}
                  <span className="ml-2">
                    {activeAnalysis === 'running' ? 'Analyzing...' : 
                     activeAnalysis === 'completed' ? 'Analysis Complete' :
                     activeAnalysis === 'error' ? 'Analysis Failed' : 'Run AI Analysis'}
                  </span>
                </Button>

                {analysisResult && analysisResult.length > 0 && (
                  <Card className="bg-slate-800/50 border-slate-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Latest Analysis
                        <Badge 
                          variant="outline" 
                          className={`ml-auto ${getConfidenceColor(analysisResult[0].confidence_score)}`}
                        >
                          {analysisResult[0].confidence_score.toFixed(1)}% Confidence
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 text-xs">
                        {analysisResult[0].ai_insights?.location_advantages && (
                          <div>
                            <h5 className="text-green-400 font-medium mb-1">Advantages</h5>
                            <ul className="text-slate-300 space-y-1">
                              {analysisResult[0].ai_insights.location_advantages.map((advantage: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                  {advantage}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult[0].ai_insights?.risk_factors && analysisResult[0].ai_insights.risk_factors.length > 0 && (
                          <div>
                            <h5 className="text-yellow-400 font-medium mb-1">Risk Factors</h5>
                            <ul className="text-slate-300 space-y-1">
                              {analysisResult[0].ai_insights.risk_factors.map((risk: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <AlertTriangle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  {risk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult[0].market_position && (
                          <div>
                            <h5 className="text-blue-400 font-medium mb-1">Market Metrics</h5>
                            <div className="grid grid-cols-2 gap-2 text-slate-300">
                              <div>
                                <span className="text-slate-400">Price/Sq Ft:</span>
                                <div className="font-medium">${analysisResult[0].market_position.price_per_sqft?.toFixed(0) || 'N/A'}</div>
                              </div>
                              <div>
                                <span className="text-slate-400">Appreciation:</span>
                                <div className="font-medium text-green-400">
                                  {((analysisResult[0].market_position.appreciation_rate || 0) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h5 className="text-purple-400 font-medium mb-1">Investment Outlook</h5>
                          <div className="text-slate-300">
                            <Badge variant="outline" className="capitalize">
                              {analysisResult[0].ai_insights?.investment_potential || 'Moderate'}
                            </Badge>
                            <span className="ml-2 text-slate-400">
                              {analysisResult[0].ai_insights?.future_outlook || 'Stable'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Select a property to run AI analysis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 relative">
        <div 
          ref={mapRef}
          className="w-full h-full bg-slate-800 flex items-center justify-center"
        >
          <div className="text-center text-slate-400">
            <Map className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Interactive GIS Map</h3>
            <p className="text-sm mb-4">Benton County Property Analysis</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Properties ({properties.length})</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Active Layers ({activeLayers.size})</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>Heatmap: {heatmapType}</span>
              </div>
            </div>
            {selectedProperty && (
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500 rounded">
                <div className="text-blue-400 font-medium">Selected Property</div>
                <div className="text-white text-sm">{selectedProperty.address}</div>
                <div className="text-slate-400 text-xs">
                  Lat: {selectedProperty.latitude.toFixed(6)}, Lng: {selectedProperty.longitude.toFixed(6)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-4 right-4 space-y-2">
          <Button size="sm" variant="outline" className="bg-slate-900/80 border-slate-600">
            <Layers className="h-4 w-4 mr-2" />
            Layers
          </Button>
          <Button size="sm" variant="outline" className="bg-slate-900/80 border-slate-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm" variant="outline" className="bg-slate-900/80 border-slate-600">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <Card className="bg-slate-900/90 border-slate-600 backdrop-blur">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{properties.length}</div>
                  <div className="text-xs text-slate-400">Properties</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(
                      properties.reduce((sum: number, p: Property) => sum + (p.marketValue || 0), 0) / properties.length || 0
                    )}
                  </div>
                  <div className="text-xs text-slate-400">Avg Value</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{activeLayers.size}</div>
                  <div className="text-xs text-slate-400">Active Layers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {selectedProperty && analysisResult ? 
                      `${analysisResult[0]?.confidence_score?.toFixed(0) || 0}%` : 
                      '--'
                    }
                  </div>
                  <div className="text-xs text-slate-400">AI Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};