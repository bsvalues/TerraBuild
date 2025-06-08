import React, { useState } from 'react';
import { Map, Layers, Zap, Building2, TrendingUp, MapPin, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const MapsPage = () => {
  const [selectedLayer, setSelectedLayer] = useState('property-values');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const mapLayers = [
    { id: 'property-values', name: 'Property Values', icon: Building2, active: true },
    { id: 'cost-trends', name: 'Cost Trends', icon: TrendingUp, active: false },
    { id: 'districts', name: 'Tax Districts', icon: MapPin, active: false },
    { id: 'zoning', name: 'Zoning Areas', icon: Layers, active: false }
  ];

  const regions = [
    { id: 'corvallis', name: 'Corvallis', properties: 12847, avgValue: '$485,000' },
    { id: 'philomath', name: 'Philomath', properties: 4521, avgValue: '$425,000' },
    { id: 'monroe', name: 'Monroe', properties: 1876, avgValue: '$385,000' },
    { id: 'alsea', name: 'Alsea', properties: 892, avgValue: '$325,000' }
  ];

  const analytics = [
    { label: 'Total Properties Mapped', value: '20,136', change: '+2.3%' },
    { label: 'Coverage Area', value: '679 sq mi', change: '100%' },
    { label: 'Avg Property Value', value: '$458,000', change: '+5.7%' },
    { label: 'Last Updated', value: 'Jun 8, 2025', change: 'Current' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Geographic Analysis</h1>
          <p className="text-slate-400 mt-1">Interactive mapping and spatial analysis tools</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Map
          </Button>
          <Button size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Run Analysis
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
                      <div className="text-sm font-medium text-slate-100">Benton County</div>
                      <div className="text-xs text-slate-400">Property Value Heatmap</div>
                    </div>
                    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                        <span className="text-slate-300">High Value ($500K+)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-slate-300">Medium Value ($300-500K)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-slate-300">Lower Value (Under $300K)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                      <div className="text-slate-400 text-lg font-medium">Interactive Map Loading</div>
                      <div className="text-slate-500 text-sm">Geographic data visualization</div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
                    <div className="text-xs text-slate-400 mb-1">Selected Area</div>
                    <div className="text-sm font-medium text-slate-100">Corvallis Urban Area</div>
                    <div className="text-xs text-slate-400">12,847 properties</div>
                    <div className="text-xs text-emerald-400">Avg: $485,000</div>
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
              <CardTitle className="text-slate-100 text-lg">Regional Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {regions.map((region) => (
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