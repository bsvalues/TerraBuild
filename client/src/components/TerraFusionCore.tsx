import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Calculator, 
  TrendingUp, 
  Settings, 
  FileText, 
  Database,
  Zap
} from 'lucide-react';

interface CountyMetrics {
  totalProperties: number;
  assessedValue: number;
  accuracy: number;
  processingTime: number;
}

interface TerraFusionCoreProps {
  county?: string;
}

const TerraFusionCore: React.FC<TerraFusionCoreProps> = ({ county = "Benton County" }) => {
  const [metrics, setMetrics] = useState<CountyMetrics>({
    totalProperties: 45234,
    assessedValue: 2840000000,
    accuracy: 98.7,
    processingTime: 0.3
  });
  
  const [activeFlow, setActiveFlow] = useState<string>('geographic');

  const flows = [
    {
      id: 'geographic',
      title: 'Geographic Assessment',
      icon: MapPin,
      description: 'Tesla Energy - Autonomous property discovery and mapping',
      color: 'bg-blue-500'
    },
    {
      id: 'financial',
      title: 'Financial Analysis', 
      icon: Calculator,
      description: 'Jobs Simplicity - Elegant cost calculations',
      color: 'bg-green-500'
    },
    {
      id: 'predictive',
      title: 'Predictive Intelligence',
      icon: TrendingUp,
      description: 'Musk Scale - AI-driven future projections',
      color: 'bg-purple-500'
    }
  ];

  const goldenMetrics = [
    { label: 'System Accuracy', value: metrics.accuracy, target: 99, unit: '%' },
    { label: 'Processing Speed', value: metrics.processingTime, target: 1, unit: 's' },
    { label: 'County Satisfaction', value: 97.2, target: 95, unit: '%' },
    { label: 'Cost Reduction', value: 78.5, target: 75, unit: '%' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Zap className="h-12 w-12 text-cyan-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              TerraFusion
            </h1>
          </div>
          <p className="text-xl text-slate-300">
            {county} Infrastructure Brain - The Golden Pattern
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <Badge variant="outline" className="bg-cyan-400/20 text-cyan-400 border-cyan-400">
              Tesla Precision
            </Badge>
            <Badge variant="outline" className="bg-green-400/20 text-green-400 border-green-400">
              Jobs Elegance
            </Badge>
            <Badge variant="outline" className="bg-purple-400/20 text-purple-400 border-purple-400">
              Musk Autonomy
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {goldenMetrics.map((metric, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{metric.label}</span>
                  <span className="text-2xl font-bold text-white">
                    {metric.value}{metric.unit}
                  </span>
                </div>
                <Progress 
                  value={(metric.value / metric.target) * 100} 
                  className="h-2"
                />
                <div className="text-xs text-slate-500 mt-1">
                  Target: {metric.target}{metric.unit}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {flows.map((flow) => {
            const Icon = flow.icon;
            const isActive = activeFlow === flow.id;
            
            return (
              <Card 
                key={flow.id} 
                className={`cursor-pointer transition-all duration-300 ${
                  isActive 
                    ? 'bg-slate-700/50 border-cyan-400 shadow-lg shadow-cyan-400/20' 
                    : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
                }`}
                onClick={() => setActiveFlow(flow.id)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${flow.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{flow.title}</CardTitle>
                      <CardDescription className="text-slate-400">
                        {flow.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isActive && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Properties</div>
                          <div className="text-white font-semibold">
                            {metrics.totalProperties.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">Value</div>
                          <div className="text-white font-semibold">
                            ${(metrics.assessedValue / 1000000000).toFixed(1)}B
                          </div>
                        </div>
                      </div>
                      <Button className="w-full bg-cyan-500 hover:bg-cyan-600">
                        Launch {flow.title}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Database className="h-5 w-5 mr-2 text-cyan-400" />
                Data Harmonics
              </CardTitle>
              <CardDescription>
                Tesla's "Energy, Frequency, Vibration" in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Market Frequency</span>
                  <span className="text-green-400 font-semibold">Stable</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assessment Energy</span>
                  <span className="text-cyan-400 font-semibold">High</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Data Vibration</span>
                  <span className="text-purple-400 font-semibold">Optimal</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <FileText className="h-5 w-5 mr-2 text-green-400" />
                Brady/Belichick Execution
              </CardTitle>
              <CardDescription>
                Tactical excellence in county operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Game Plan Status</span>
                  <span className="text-green-400 font-semibold">Executing</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Performance Metrics</span>
                  <span className="text-cyan-400 font-semibold">Superior</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Strategic Position</span>
                  <span className="text-purple-400 font-semibold">Dominant</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm">
            "If you want to understand the universe, think in terms of energy, frequency, and vibration." - Nikola Tesla
          </p>
          <p className="text-slate-500 text-xs mt-2">
            TerraFusion Platform - Engineered for divine geometry in county infrastructure
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerraFusionCore;