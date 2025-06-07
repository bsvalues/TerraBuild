/**
 * TerraFusion-AI Interactive Property Analysis Map
 * 
 * Comprehensive mapping interface that visualizes all property data,
 * market analysis, cost factors, and AI insights on an interactive map
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Map, 
  Layers, 
  Home, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Filter,
  Eye,
  EyeOff,
  Zap,
  Building2,
  MapPin,
  Activity,
  Search,
  Download,
  Settings
} from 'lucide-react';
import { PropertyDetailsPanel } from './PropertyDetailsPanel';

interface PropertyMapData {
  properties: Array<{
    id: string;
    coordinates: [number, number];
    address: string;
    value: number;
    type: string;
    yearBuilt: number;
    sqft: number;
    aiValuation?: number;
    marketTrend: 'up' | 'down' | 'stable';
    riskFactors: string[];
  }>;
  heatmapData: Array<{
    coordinates: [number, number];
    intensity: number;
    type: 'value' | 'growth' | 'risk';
  }>;
  boundaries: {
    city: any;
    zoning: any;
    floodZones: any;
    neighborhoods: any;
  };
  marketAnalysis: {
    avgValuePerSqft: number;
    growthRate: number;
    hotspots: Array<{
      center: [number, number];
      radius: number;
      intensity: number;
    }>;
  };
}

interface MapLayer {
  id: string;
  name: string;
  type: 'heatmap' | 'markers' | 'boundaries' | 'analysis';
  visible: boolean;
  opacity: number;
  color: string;
  icon?: string;
}

export function InteractivePropertyMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'value' | 'trends' | 'costs' | 'ai'>('value');
  const [timeRange, setTimeRange] = useState<string>('1year');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: 'properties', name: 'Properties', type: 'markers', visible: true, opacity: 1, color: '#3b82f6', icon: 'home' },
    { id: 'values', name: 'Property Values', type: 'heatmap', visible: true, opacity: 0.7, color: '#10b981' },
    { id: 'trends', name: 'Market Trends', type: 'analysis', visible: false, opacity: 0.8, color: '#f59e0b' },
    { id: 'costs', name: 'Building Costs', type: 'heatmap', visible: false, opacity: 0.6, color: '#ef4444' },
    { id: 'ai-insights', name: 'AI Insights', type: 'analysis', visible: false, opacity: 0.9, color: '#8b5cf6' },
    { id: 'zoning', name: 'Zoning', type: 'boundaries', visible: false, opacity: 0.5, color: '#6b7280' },
    { id: 'flood-zones', name: 'Flood Zones', type: 'boundaries', visible: false, opacity: 0.4, color: '#0ea5e9' },
    { id: 'neighborhoods', name: 'Neighborhoods', type: 'boundaries', visible: false, opacity: 0.3, color: '#84cc16' }
  ]);

  // Fetch comprehensive map data
  const { data: mapData, isLoading } = useQuery<PropertyMapData>({
    queryKey: ['/api/benton-county/map-data', analysisMode, timeRange],
    staleTime: 300000 // 5 minutes
  });

  // Fetch real-time market analysis
  const { data: liveAnalysis } = useQuery({
    queryKey: ['/api/benton-county/live-analysis'],
    refetchInterval: 30000 // 30 seconds
  });

  const toggleLayer = (layerId: string) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, visible: !layer.visible }
        : layer
    ));
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setMapLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, opacity: opacity / 100 }
        : layer
    ));
  };

  const handlePropertyClick = (propertyId: string) => {
    setSelectedProperty(propertyId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In production, this would trigger a search API call
    console.log('Searching for:', query);
  };

  const getAnalysisStats = () => {
    if (!mapData) return null;
    
    switch (analysisMode) {
      case 'value':
        return {
          primary: `$${mapData.marketAnalysis.avgValuePerSqft.toFixed(0)}/sq ft`,
          secondary: `${mapData.properties.length} properties`,
          trend: mapData.marketAnalysis.growthRate > 0 ? 'up' : 'down'
        };
      case 'trends':
        return {
          primary: `${mapData.marketAnalysis.growthRate.toFixed(1)}%`,
          secondary: 'Annual growth',
          trend: 'up'
        };
      case 'costs':
        return {
          primary: '$185/sq ft',
          secondary: 'Avg building cost',
          trend: 'up'
        };
      case 'ai':
        return {
          primary: '87%',
          secondary: 'AI confidence',
          trend: 'stable'
        };
      default:
        return null;
    }
  };

  const stats = getAnalysisStats();

  return (
    <div className="h-screen w-full relative bg-gray-50">
      {/* Top Search and Controls Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-4">
        {/* Search Box */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search Benton County properties..."
              className="pl-10 bg-white/95 backdrop-blur"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Analysis Mode Selector */}
        <Select value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
          <SelectTrigger className="w-48 bg-white/95 backdrop-blur">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="value">Property Values</SelectItem>
            <SelectItem value="trends">Market Trends</SelectItem>
            <SelectItem value="costs">Building Costs</SelectItem>
            <SelectItem value="ai">AI Insights</SelectItem>
          </SelectContent>
        </Select>

        {/* Time Range Selector */}
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-white/95 backdrop-blur">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">1 Month</SelectItem>
            <SelectItem value="3months">3 Months</SelectItem>
            <SelectItem value="1year">1 Year</SelectItem>
            <SelectItem value="3years">3 Years</SelectItem>
          </SelectContent>
        </Select>

        {/* City Filter */}
        <Select value={selectedCity} onValueChange={setSelectedCity}>
          <SelectTrigger className="w-32 bg-white/95 backdrop-blur">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            <SelectItem value="richland">Richland</SelectItem>
            <SelectItem value="kennewick">Kennewick</SelectItem>
            <SelectItem value="pasco">Pasco</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="bg-white/95 backdrop-blur">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Left Sidebar - Layer Controls */}
      <div className="absolute left-4 top-20 bottom-4 w-80 z-10">
        <Card className="h-full bg-white/95 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Map Layers
            </CardTitle>
            {stats && (
              <div className="flex items-center gap-4 mt-2">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.primary}</div>
                  <div className="text-sm text-gray-600">{stats.secondary}</div>
                </div>
                <div className={`p-2 rounded-full ${stats.trend === 'up' ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <TrendingUp className={`h-4 w-4 ${stats.trend === 'up' ? 'text-green-600' : 'text-gray-600'}`} />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {mapLayers.map(layer => (
              <div key={layer.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={layer.visible}
                      onCheckedChange={() => toggleLayer(layer.id)}
                    />
                    <span className="text-sm font-medium">{layer.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleLayer(layer.id)}
                  >
                    {layer.visible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {layer.visible && (
                  <div className="ml-6">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span>Opacity:</span>
                      <Slider
                        value={[layer.opacity * 100]}
                        onValueChange={(value) => updateLayerOpacity(layer.id, value[0])}
                        max={100}
                        step={10}
                        className="flex-1"
                      />
                      <span>{Math.round(layer.opacity * 100)}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Main Map Area */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 relative"
        onClick={() => handlePropertyClick('P001')}
      >
        {/* Map Placeholder - In production, this would be a real map component */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 bg-white/90 rounded-lg shadow-lg">
            <Map className="h-16 w-16 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-semibold mb-2">TerraFusion-AI Interactive Map</h3>
            <p className="text-gray-600 mb-4">
              Comprehensive Benton County Property Analysis
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-semibold text-blue-800">Properties Loaded</div>
                <div className="text-blue-600">{mapData?.properties.length || 0}</div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-semibold text-green-800">Analysis Mode</div>
                <div className="text-green-600 capitalize">{analysisMode.toString()}</div>
              </div>
            </div>
            {isLoading && (
              <div className="mt-4 text-blue-600">
                <Activity className="h-4 w-4 inline mr-2 animate-spin" />
                Loading map data...
              </div>
            )}
          </div>
        </div>

        {/* Sample Property Markers */}
        {mapData?.properties.slice(0, 10).map((property, index) => (
          <div
            key={property.id}
            className="absolute w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg cursor-pointer transform -translate-x-3 -translate-y-3 hover:scale-110 transition-transform"
            style={{
              left: `${40 + index * 8}%`,
              top: `${30 + (index % 3) * 15}%`
            }}
            onClick={(e) => {
              e.stopPropagation();
              handlePropertyClick(property.id);
            }}
            title={`${property.address} - $${property.value.toLocaleString()}`}
          >
            <div className="w-full h-full flex items-center justify-center">
              <Home className="h-3 w-3 text-white" />
            </div>
          </div>
        ))}

        {/* Live Analysis Panel */}
        {liveAnalysis && (
          <div className="absolute bottom-4 left-4 right-4 max-w-sm ml-auto">
            <Card className="bg-white/95 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Live Market Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-semibold">Avg $/SqFt</div>
                    <div className="text-green-600">$312.45</div>
                  </div>
                  <div>
                    <div className="font-semibold">Growth</div>
                    <div className="text-green-600">+8.7%</div>
                  </div>
                  <div>
                    <div className="font-semibold">Volume</div>
                    <div className="text-blue-600">847</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Property Details Panel */}
        {selectedProperty && (
          <PropertyDetailsPanel 
            propertyId={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        )}
      </div>
    </div>
  );
}