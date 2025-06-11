import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, MapPin, Navigation, Target, Activity,
  Brain, Zap, TrendingUp, AlertTriangle, CheckCircle
} from 'lucide-react';

interface AdvancedSpatialAnalysisProps {
  selectedProperty?: any;
  onAnalysisRun: (analysisType: string, parameters: any) => void;
}

export const AdvancedSpatialAnalysis: React.FC<AdvancedSpatialAnalysisProps> = ({
  selectedProperty,
  onAnalysisRun
}) => {
  const [analysisType, setAnalysisType] = useState('proximity');
  const [bufferDistance, setBufferDistance] = useState([0.5]);
  const [proximityRadius, setProximityRadius] = useState([1]);
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const analysisTypes = [
    {
      id: 'proximity',
      name: 'Proximity Analysis',
      description: 'Find properties near schools, parks, shopping centers',
      icon: <Navigation className="h-4 w-4" />
    },
    {
      id: 'market-comp',
      name: 'Market Comparables',
      description: 'AI-powered comparable property identification',
      icon: <Calculator className="h-4 w-4" />
    },
    {
      id: 'accessibility',
      name: 'Accessibility Score',
      description: 'Calculate walkability and transit accessibility',
      icon: <MapPin className="h-4 w-4" />
    },
    {
      id: 'flood-risk',
      name: 'Environmental Risk',
      description: 'Assess flood zones and environmental hazards',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      id: 'growth-potential',
      name: 'Growth Potential',
      description: 'Predict area development and value appreciation',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      id: 'demographic',
      name: 'Demographics Impact',
      description: 'Analyze population trends and economic indicators',
      icon: <Activity className="h-4 w-4" />
    }
  ];

  const amenityTypes = [
    'Schools', 'Parks', 'Shopping Centers', 'Hospitals', 'Transit Stations',
    'Restaurants', 'Banks', 'Gas Stations', 'Libraries', 'Recreation Centers'
  ];

  const runAnalysis = async () => {
    if (!selectedProperty) return;
    
    setAnalysisRunning(true);
    
    const parameters = {
      propertyId: selectedProperty.id,
      analysisType,
      bufferDistance: bufferDistance[0],
      proximityRadius: proximityRadius[0],
      coordinates: {
        lat: selectedProperty.latitude,
        lng: selectedProperty.longitude
      }
    };

    try {
      // Simulate analysis processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock results based on analysis type
      const mockResults = generateMockResults(analysisType, selectedProperty);
      setResults(mockResults);
      
      onAnalysisRun(analysisType, parameters);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const generateMockResults = (type: string, property: any) => {
    switch (type) {
      case 'proximity':
        return {
          nearbyAmenities: [
            { type: 'School', name: 'Richland Elementary', distance: 0.3, rating: 4.2 },
            { type: 'Park', name: 'Columbia Park', distance: 0.8, rating: 4.5 },
            { type: 'Shopping', name: 'Columbia Center Mall', distance: 1.2, rating: 4.0 }
          ],
          accessibilityScore: 8.2
        };
      case 'market-comp':
        return {
          comparables: [
            { address: '123 Main St', price: property.total_value * 0.95, similarity: 92 },
            { address: '456 Oak Ave', price: property.total_value * 1.08, similarity: 88 },
            { address: '789 Pine Rd', price: property.total_value * 0.97, similarity: 85 }
          ],
          marketPosition: 'Above Average',
          confidence: 87
        };
      case 'accessibility':
        return {
          walkScore: 72,
          transitScore: 45,
          bikeScore: 58,
          overallAccessibility: 'Good'
        };
      case 'flood-risk':
        return {
          floodZone: 'X (Low Risk)',
          earthquake: 'Moderate',
          wildfire: 'Low',
          overallRisk: 'Low to Moderate'
        };
      case 'growth-potential':
        return {
          growthScore: 7.8,
          projectedAppreciation: '3.2% annually',
          developmentPressure: 'Moderate',
          investmentGrade: 'B+'
        };
      case 'demographic':
        return {
          populationGrowth: '2.1% annually',
          medianIncome: '$68,500',
          ageGroup: '35-54 (dominant)',
          educationLevel: 'College Educated (62%)'
        };
      default:
        return {};
    }
  };

  return (
    <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Brain className="h-4 w-4" />
          Advanced Spatial Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Analysis Type Selection */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-400">Analysis Type</Label>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="bg-slate-800 border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {analysisTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <span>{type.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-slate-400">
            {analysisTypes.find(t => t.id === analysisType)?.description}
          </div>
        </div>

        {/* Parameters based on analysis type */}
        {analysisType === 'proximity' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Search Radius (miles)</Label>
              <Slider
                value={proximityRadius}
                onValueChange={setProximityRadius}
                max={5}
                min={0.1}
                step={0.1}
                className="w-full"
              />
              <div className="text-xs text-slate-400 text-center">
                {proximityRadius[0]} miles
              </div>
            </div>
          </div>
        )}

        {analysisType === 'market-comp' && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-400">Comparison Criteria</Label>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline" className="text-xs justify-center">Size ±20%</Badge>
              <Badge variant="outline" className="text-xs justify-center">Year ±10</Badge>
              <Badge variant="outline" className="text-xs justify-center">Type Match</Badge>
              <Badge variant="outline" className="text-xs justify-center">Location 2mi</Badge>
            </div>
          </div>
        )}

        {/* Run Analysis Button */}
        <Button 
          onClick={runAnalysis}
          disabled={!selectedProperty || analysisRunning}
          className="w-full"
          size="sm"
        >
          {analysisRunning ? (
            <>
              <Zap className="h-3 w-3 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Calculator className="h-3 w-3 mr-2" />
              Run Analysis
            </>
          )}
        </Button>

        {analysisRunning && (
          <div className="space-y-2">
            <Progress value={60} className="h-2" />
            <div className="text-xs text-slate-400 text-center">
              Processing spatial data...
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-3 pt-3 border-t border-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-white">Analysis Complete</span>
            </div>
            
            {analysisType === 'proximity' && results.nearbyAmenities && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">Nearby Amenities</div>
                {results.nearbyAmenities.map((amenity: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">{amenity.name}</span>
                    <span className="text-white">{amenity.distance}mi</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Accessibility Score</span>
                  <span className="text-green-400 font-medium">{results.accessibilityScore}/10</span>
                </div>
              </div>
            )}

            {analysisType === 'market-comp' && results.comparables && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">Market Comparables</div>
                {results.comparables.map((comp: any, idx: number) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">{comp.address}</span>
                      <span className="text-white">${comp.price.toLocaleString()}</span>
                    </div>
                    <div className="text-slate-500">Similarity: {comp.similarity}%</div>
                  </div>
                ))}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-700">
                  <span className="text-slate-400">Market Position</span>
                  <span className="text-blue-400 font-medium">{results.marketPosition}</span>
                </div>
              </div>
            )}

            {analysisType === 'accessibility' && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-slate-300">Accessibility Scores</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Walk Score</span>
                    <span className="text-white">{results.walkScore}/100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Transit Score</span>
                    <span className="text-white">{results.transitScore}/100</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Bike Score</span>
                    <span className="text-white">{results.bikeScore}/100</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};