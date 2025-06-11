import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Map, Layers, Calculator, TrendingUp, Navigation, 
  Search, Filter, Download, Share2, Settings,
  Zap, Brain, Target, Activity, AlertTriangle,
  CheckCircle, Clock, MapPin, Ruler, Eye
} from 'lucide-react';

interface EnhancedGISFeaturesProps {
  onFeatureSelect: (feature: string) => void;
  activeFeatures: Set<string>;
}

export const EnhancedGISFeatures: React.FC<EnhancedGISFeaturesProps> = ({
  onFeatureSelect,
  activeFeatures
}) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>('proximity');

  const spatialAnalysisTools = [
    {
      id: 'proximity',
      name: 'Proximity Analysis',
      description: 'Find properties within specified distance of amenities',
      icon: <Navigation className="h-4 w-4" />,
      color: 'bg-blue-500'
    },
    {
      id: 'buffer',
      name: 'Buffer Analysis', 
      description: 'Create distance buffers around selected areas',
      icon: <Target className="h-4 w-4" />,
      color: 'bg-green-500'
    },
    {
      id: 'overlay',
      name: 'Overlay Analysis',
      description: 'Combine multiple data layers for complex analysis',
      icon: <Layers className="h-4 w-4" />,
      color: 'bg-purple-500'
    },
    {
      id: 'watershed',
      name: 'Watershed Analysis',
      description: 'Analyze drainage patterns and flood zones',
      icon: <Activity className="h-4 w-4" />,
      color: 'bg-cyan-500'
    },
    {
      id: 'viewshed',
      name: 'Viewshed Analysis',
      description: 'Calculate visibility and scenic value impact',
      icon: <Eye className="h-4 w-4" />,
      color: 'bg-orange-500'
    },
    {
      id: 'network',
      name: 'Network Analysis',
      description: 'Optimize routes and accessibility calculations',
      icon: <Share2 className="h-4 w-4" />,
      color: 'bg-red-500'
    }
  ];

  const marketAnalysisFeatures = [
    {
      id: 'comps',
      name: 'Comparable Sales',
      description: 'AI-powered comparable property analysis',
      icon: <Calculator className="h-4 w-4" />,
      status: 'active'
    },
    {
      id: 'trends',
      name: 'Market Trends',
      description: 'Historical price trends and forecasting',
      icon: <TrendingUp className="h-4 w-4" />,
      status: 'active'
    },
    {
      id: 'absorption',
      name: 'Market Absorption',
      description: 'Supply and demand analysis by area',
      icon: <Brain className="h-4 w-4" />,
      status: 'coming-soon'
    },
    {
      id: 'demographics',
      name: 'Demographics',
      description: 'Population and economic indicators',
      icon: <Search className="h-4 w-4" />,
      status: 'active'
    }
  ];

  const measurementTools = [
    {
      id: 'distance',
      name: 'Distance Measurement',
      description: 'Measure distances between points',
      icon: <Ruler className="h-4 w-4" />
    },
    {
      id: 'area',
      name: 'Area Calculation',
      description: 'Calculate area of selected regions',
      icon: <Map className="h-4 w-4" />
    },
    {
      id: 'elevation',
      name: 'Elevation Profile',
      description: 'View elevation changes along a path',
      icon: <TrendingUp className="h-4 w-4" />
    }
  ];

  return (
    <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Zap className="h-4 w-4" />
          Enhanced GIS Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="spatial" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="spatial" className="text-xs">Spatial</TabsTrigger>
            <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="spatial" className="mt-3 space-y-2">
            <div className="text-xs text-slate-400 mb-2">Spatial Analysis</div>
            {spatialAnalysisTools.map((tool) => (
              <Button
                key={tool.id}
                variant={selectedAnalysis === tool.id ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-xs h-auto p-2"
                onClick={() => {
                  setSelectedAnalysis(tool.id);
                  onFeatureSelect(tool.id);
                }}
              >
                <div className={`w-2 h-2 rounded-full ${tool.color} mr-2`} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-slate-400 text-xs">{tool.description}</div>
                </div>
                {tool.icon}
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="market" className="mt-3 space-y-2">
            <div className="text-xs text-slate-400 mb-2">Market Analysis</div>
            {marketAnalysisFeatures.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between p-2 rounded border border-slate-600 bg-slate-800/50"
              >
                <div className="flex items-center gap-2 flex-1">
                  {feature.icon}
                  <div>
                    <div className="text-xs font-medium text-white">{feature.name}</div>
                    <div className="text-xs text-slate-400">{feature.description}</div>
                  </div>
                </div>
                <Badge 
                  variant={feature.status === 'active' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {feature.status === 'active' ? 'Active' : 'Soon'}
                </Badge>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="tools" className="mt-3 space-y-2">
            <div className="text-xs text-slate-400 mb-2">Measurement Tools</div>
            {measurementTools.map((tool) => (
              <Button
                key={tool.id}
                variant={activeFeatures.has(tool.id) ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start text-xs h-auto p-2"
                onClick={() => onFeatureSelect(tool.id)}
              >
                {tool.icon}
                <div className="flex-1 text-left ml-2">
                  <div className="font-medium">{tool.name}</div>
                  <div className="text-slate-400 text-xs">{tool.description}</div>
                </div>
              </Button>
            ))}
            
            <div className="pt-2 border-t border-slate-600">
              <div className="text-xs text-slate-400 mb-2">Export & Share</div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};