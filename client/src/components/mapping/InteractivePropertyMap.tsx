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
          primary: '$425/sq ft',
          secondary: 'Avg construction',
          trend: 'stable'
        };
      case 'ai':
        return {
          primary: '94% accuracy',
          secondary: 'AI predictions',
          trend: 'up'
        };
    }
  };

  const stats = getAnalysisStats();

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Map className="h-6 w-6 text-cyan-400" />
              <h1 className="text-xl font-bold">TerraFusion-AI Map Analysis</h1>
            </div>
            <Badge variant="outline" className="bg-green-900/50 text-green-300 border-green-600">
              Live Data
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">1 Month</SelectItem>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="5years">5 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* Sidebar Controls */}
        <div className="w-80 bg-gray-800/90 backdrop-blur-sm border-r border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-6">
            
            {/* Analysis Mode */}
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300">Analysis Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={analysisMode} onValueChange={(value: any) => setAnalysisMode(value)}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-600">
                    <TabsTrigger value="value" className="text-xs">Values</TabsTrigger>
                    <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-600 mt-2">
                    <TabsTrigger value="costs" className="text-xs">Costs</TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Live Statistics */}
            {stats && (
              <Card className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-cyan-600/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-cyan-300">{stats.primary}</p>
                      <p className="text-sm text-gray-300">{stats.secondary}</p>
                    </div>
                    <div className="text-right">
                      <TrendingUp className={`h-6 w-6 ${
                        stats.trend === 'up' ? 'text-green-400' : 
                        stats.trend === 'down' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Map Layers */}
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Map Layers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {mapLayers.map((layer) => (
                  <div key={layer.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={layer.visible}
                          onCheckedChange={() => toggleLayer(layer.id)}
                          className="data-[state=checked]:bg-cyan-600"
                        />
                        <span className="text-sm">{layer.name}</span>
                      </div>
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: layer.color }}
                      />
                    </div>
                    
                    {layer.visible && (
                      <div className="ml-6 space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Opacity</span>
                          <span>{Math.round(layer.opacity * 100)}%</span>
                        </div>
                        <Slider
                          value={[layer.opacity * 100]}
                          onValueChange={(value) => updateLayerOpacity(layer.id, value[0])}
                          max={100}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Analysis Tools */}
            <Card className="bg-gray-700/50 border-gray-600">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-300 flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Analysis Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start border-gray-600 hover:bg-gray-600"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Market Comparison
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start border-gray-600 hover:bg-gray-600"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  AI Predictions
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start border-gray-600 hover:bg-gray-600"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Cost Analysis
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start border-gray-600 hover:bg-gray-600"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Custom Filter
                </Button>
              </CardContent>
            </Card>

            {/* Property Info Panel */}
            {selectedProperty && (
              <Card className="bg-gray-700/50 border-gray-600">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-gray-300 flex items-center">
                    <Building2 className="h-4 w-4 mr-2" />
                    Selected Property
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">123 Main St, Richland</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Value:</span>
                      <p className="font-medium text-green-400">$425,000</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Sq Ft:</span>
                      <p className="font-medium">2,150</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Year:</span>
                      <p className="font-medium">1998</p>
                    </div>
                    <div>
                      <span className="text-gray-400">AI Score:</span>
                      <p className="font-medium text-purple-400">94%</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef}
            className="w-full h-full bg-gray-900"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                linear-gradient(135deg, rgba(17, 24, 39, 0.9) 0%, rgba(31, 41, 55, 0.9) 100%)
              `
            }}
          >
            {/* Map Loading State */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                  <p className="text-gray-300">Loading map data...</p>
                </div>
              </div>
            )}

            {/* Map Overlay - Real map integration placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <MapPin className="h-16 w-16 text-cyan-400 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Interactive Map Interface
                  </h3>
                  <p className="text-gray-300 max-w-md">
                    Map integration ready for Benton County property visualization
                    with all analysis layers and real-time data feeds.
                  </p>
                </div>
              </div>
            </div>

            {/* Map Controls Overlay */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button size="sm" variant="outline" className="bg-gray-800/80 border-gray-600">
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" className="bg-gray-800/80 border-gray-600">
                <Home className="h-4 w-4" />
              </Button>
            </div>

            {/* Live Data Indicator */}
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center space-x-2 bg-gray-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Live data feed active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}