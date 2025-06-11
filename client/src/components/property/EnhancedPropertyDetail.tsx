import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  MapPin,
  Home,
  Calendar,
  Ruler,
  Bed,
  Bath,
  Car,
  Zap,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  PieChart,
  Calculator,
  Brain,
  Shield,
  Clock,
  X
} from 'lucide-react';

interface PropertyData {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  propertyType: string;
  squareFootage: number;
  lotSize: number;
  yearBuilt: number;
  bedrooms: number;
  bathrooms: number;
  garage: number;
  condition: string;
  latitude: number;
  longitude: number;
}

interface AIValuation {
  estimatedValue: number;
  confidence: number;
  pricePerSqft: number;
  breakdown: {
    replacementCost: number;
    depreciation: number;
    marketAdjustment: number;
    locationPremium: number;
  };
  comparables: PropertyComparable[];
  riskFactors: RiskFactor[];
  recommendations: string[];
  lastUpdated: string;
}

interface PropertyComparable {
  address: string;
  distance: number;
  soldPrice: number;
  soldDate: string;
  adjustedPrice: number;
  similarity: number;
  squareFootage: number;
  pricePerSqft: number;
}

interface RiskFactor {
  category: string;
  level: 'Low' | 'Medium' | 'High';
  impact: number;
  description: string;
}

interface MarketTrend {
  period: string;
  priceChange: number;
  volume: number;
  medianDaysOnMarket: number;
  pricePerSqft: number;
}

interface Props {
  property: PropertyData;
  onClose: () => void;
}

export default function EnhancedPropertyDetail({ property, onClose }: Props) {
  const [activeTab, setActiveTab] = useState('valuation');
  const [aiValuation, setAIValuation] = useState<AIValuation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateAIValuation();
  }, [property.id]);

  const generateAIValuation = async () => {
    setIsLoading(true);
    
    // Simulate AI valuation calculation based on Benton County data
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const valuation: AIValuation = {
      estimatedValue: calculateEstimatedValue(property),
      confidence: calculateConfidence(property),
      pricePerSqft: calculatePricePerSqft(property),
      breakdown: calculateBreakdown(property),
      comparables: generateComparables(property),
      riskFactors: assessRiskFactors(property),
      recommendations: generateRecommendations(property),
      lastUpdated: new Date().toISOString()
    };
    
    setAIValuation(valuation);
    setIsLoading(false);
  };

  const calculateEstimatedValue = (prop: PropertyData): number => {
    // Enhanced replacement cost using Benton County Building Cost Standards
    const baseCostPerSqft = 145; // Good quality construction
    const replacementCost = prop.squareFootage * baseCostPerSqft;
    
    // Age-based depreciation
    const currentYear = new Date().getFullYear();
    const age = currentYear - prop.yearBuilt;
    const depreciation = Math.min(age / 50, 0.8); // Economic life method
    
    // Market adjustment for Tri-Cities area
    const marketMultiplier = 1.12; // Regional premium
    
    // Location premium based on neighborhood
    const locationMultiplier = getLocationMultiplier(prop.city);
    
    return Math.round(replacementCost * (1 - depreciation) * marketMultiplier * locationMultiplier);
  };

  const calculateConfidence = (prop: PropertyData): number => {
    let confidence = 60; // Base confidence
    
    // Data completeness
    if (prop.squareFootage > 0) confidence += 10;
    if (prop.yearBuilt > 1900) confidence += 10;
    if (prop.bedrooms > 0) confidence += 5;
    if (prop.bathrooms > 0) confidence += 5;
    if (prop.lotSize > 0) confidence += 5;
    
    // Market data availability (simulated)
    confidence += 10; // Recent comparables available
    
    return Math.min(confidence, 94);
  };

  const calculatePricePerSqft = (prop: PropertyData): number => {
    const estimatedValue = calculateEstimatedValue(prop);
    return Math.round(estimatedValue / prop.squareFootage);
  };

  const calculateBreakdown = (prop: PropertyData) => {
    const baseCostPerSqft = 145;
    const replacementCost = prop.squareFootage * baseCostPerSqft;
    const currentYear = new Date().getFullYear();
    const age = currentYear - prop.yearBuilt;
    const depreciation = Math.min(age / 50, 0.6);
    
    return {
      replacementCost: Math.round(replacementCost),
      depreciation: Math.round(depreciation * 100) / 100,
      marketAdjustment: 1.12,
      locationPremium: getLocationMultiplier(prop.city)
    };
  };

  const getLocationMultiplier = (city: string): number => {
    const cityMultipliers: { [key: string]: number } = {
      'Richland': 1.08,
      'Kennewick': 1.02,
      'Pasco': 0.94,
      'West Richland': 1.06
    };
    return cityMultipliers[city] || 1.0;
  };

  const generateComparables = (prop: PropertyData): PropertyComparable[] => {
    return [
      {
        address: "1234 Columbia Park Trail, Richland, WA",
        distance: 0.3,
        soldPrice: 485000,
        soldDate: "2024-12-15",
        adjustedPrice: 492000,
        similarity: 0.92,
        squareFootage: 2450,
        pricePerSqft: 198
      },
      {
        address: "5678 Desert Hills Dr, Kennewick, WA",
        distance: 0.8,
        soldPrice: 445000,
        soldDate: "2024-11-28",
        adjustedPrice: 451000,
        similarity: 0.87,
        squareFootage: 2280,
        pricePerSqft: 195
      },
      {
        address: "9012 Badger Mountain Loop, Richland, WA",
        distance: 1.2,
        soldPrice: 525000,
        soldDate: "2024-12-08",
        adjustedPrice: 529000,
        similarity: 0.89,
        squareFootage: 2650,
        pricePerSqft: 198
      }
    ];
  };

  const assessRiskFactors = (prop: PropertyData): RiskFactor[] => {
    const factors: RiskFactor[] = [];
    const currentYear = new Date().getFullYear();
    const age = currentYear - prop.yearBuilt;
    
    if (age > 40) {
      factors.push({
        category: 'Property Age',
        level: 'Medium',
        impact: 3.2,
        description: 'Property age may require major system updates within 10 years'
      });
    }
    
    factors.push({
      category: 'Market Risk',
      level: 'Low',
      impact: 2.1,
      description: 'Tri-Cities market benefits from diverse employment base'
    });
    
    if (calculateEstimatedValue(prop) > 400000) {
      factors.push({
        category: 'Interest Rate Sensitivity',
        level: 'Medium',
        impact: 3.8,
        description: 'Higher-priced properties more sensitive to rate changes'
      });
    }
    
    return factors;
  };

  const generateRecommendations = (prop: PropertyData): string[] => {
    const recommendations: string[] = [];
    const currentYear = new Date().getFullYear();
    const age = currentYear - prop.yearBuilt;
    
    if (age > 25) {
      recommendations.push("Consider energy efficiency upgrades to increase value by $15,000-25,000");
    }
    
    if (prop.condition === 'Average' || prop.condition === 'Fair') {
      recommendations.push("Interior renovation could reduce depreciation and add 8-15% value");
    }
    
    recommendations.push("Strong seller's market - consider listing within next 6 months for optimal returns");
    
    if (prop.squareFootage < 2000) {
      recommendations.push("Square footage addition feasibility analysis recommended");
    }
    
    return recommendations;
  };

  const marketTrends: MarketTrend[] = [
    {
      period: 'Last 30 Days',
      priceChange: 2.3,
      volume: 145,
      medianDaysOnMarket: 18,
      pricePerSqft: 218
    },
    {
      period: 'Last 90 Days', 
      priceChange: 6.8,
      volume: 432,
      medianDaysOnMarket: 22,
      pricePerSqft: 215
    },
    {
      period: 'Last 12 Months',
      priceChange: 12.4,
      volume: 1856,
      medianDaysOnMarket: 28,
      pricePerSqft: 195
    }
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Brain className="h-12 w-12 text-blue-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold text-slate-100 mb-2">AI Analysis in Progress</h3>
            <p className="text-slate-400 mb-4">Generating comprehensive property valuation using Benton County Building Cost Standards</p>
            <Progress value={75} className="h-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">{property.address}</h2>
            <p className="text-slate-400">{property.city}, {property.state} {property.zip}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Property Overview */}
        <div className="p-6 border-b border-slate-700">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <Ruler className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-slate-400 text-xs">Square Feet</p>
              <p className="text-slate-100 font-semibold">{property.squareFootage.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <Calendar className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-slate-400 text-xs">Year Built</p>
              <p className="text-slate-100 font-semibold">{property.yearBuilt}</p>
            </div>
            <div className="text-center">
              <Bed className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-slate-400 text-xs">Bedrooms</p>
              <p className="text-slate-100 font-semibold">{property.bedrooms}</p>
            </div>
            <div className="text-center">
              <Bath className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-slate-400 text-xs">Bathrooms</p>
              <p className="text-slate-100 font-semibold">{property.bathrooms}</p>
            </div>
            <div className="text-center">
              <Car className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-slate-400 text-xs">Garage</p>
              <p className="text-slate-100 font-semibold">{property.garage || 'N/A'}</p>
            </div>
            <div className="text-center">
              <Home className="h-5 w-5 text-slate-400 mx-auto mb-1" />
              <p className="text-slate-400 text-xs">Type</p>
              <p className="text-slate-100 font-semibold">{property.propertyType}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800 mx-6 mt-6">
            <TabsTrigger value="valuation">AI Valuation</TabsTrigger>
            <TabsTrigger value="comparables">Comparables</TabsTrigger>
            <TabsTrigger value="trends">Market Trends</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="valuation" className="space-y-6">
              {aiValuation && (
                <>
                  {/* Valuation Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <DollarSign className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Estimated Value</p>
                          <p className="text-3xl font-bold text-emerald-400">
                            ${aiValuation.estimatedValue.toLocaleString()}
                          </p>
                          <p className="text-slate-400 text-xs mt-1">
                            ${aiValuation.pricePerSqft}/sq ft
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Confidence Score</p>
                          <p className="text-3xl font-bold text-blue-400">{aiValuation.confidence}%</p>
                          <Badge className="mt-2 bg-blue-500/20 text-blue-400">High Confidence</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <Clock className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                          <p className="text-slate-400 text-sm">Last Updated</p>
                          <p className="text-xl font-bold text-purple-400">
                            {new Date(aiValuation.lastUpdated).toLocaleDateString()}
                          </p>
                          <p className="text-slate-400 text-xs mt-1">Real-time analysis</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Valuation Breakdown */}
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-slate-100">
                        <Calculator className="h-5 w-5" />
                        Valuation Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                          <span className="text-slate-300">Replacement Cost</span>
                          <span className="text-slate-100 font-semibold">
                            ${aiValuation.breakdown.replacementCost.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                          <span className="text-slate-300">Depreciation Factor</span>
                          <span className="text-orange-400 font-semibold">
                            -{(aiValuation.breakdown.depreciation * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                          <span className="text-slate-300">Market Adjustment</span>
                          <span className="text-green-400 font-semibold">
                            +{((aiValuation.breakdown.marketAdjustment - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                          <span className="text-slate-300">Location Premium</span>
                          <span className="text-blue-400 font-semibold">
                            +{((aiValuation.breakdown.locationPremium - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="comparables" className="space-y-6">
              {aiValuation?.comparables && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <BarChart3 className="h-5 w-5" />
                      Comparable Properties Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiValuation.comparables.map((comp, index) => (
                        <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-100">{comp.address}</h4>
                              <p className="text-slate-400 text-sm">
                                Sold: {new Date(comp.soldDate).toLocaleDateString()} • {comp.distance} miles away
                              </p>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400">
                              {Math.round(comp.similarity * 100)}% Match
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Sale Price</p>
                              <p className="text-slate-100 font-semibold">${comp.soldPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Adjusted Price</p>
                              <p className="text-slate-100 font-semibold">${comp.adjustedPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Price/Sq Ft</p>
                              <p className="text-slate-100 font-semibold">${comp.pricePerSqft}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <TrendingUp className="h-5 w-5" />
                    Market Trends Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {marketTrends.map((trend, index) => (
                      <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold text-slate-100">{trend.period}</h4>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            <span className="text-green-400 font-semibold">+{trend.priceChange}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-slate-400">Sales Volume</p>
                            <p className="text-slate-100 font-semibold">{trend.volume}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Days on Market</p>
                            <p className="text-slate-100 font-semibold">{trend.medianDaysOnMarket}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Price/Sq Ft</p>
                            <p className="text-slate-100 font-semibold">${trend.pricePerSqft}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risk" className="space-y-6">
              {aiValuation?.riskFactors && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <Shield className="h-5 w-5" />
                      Risk Factor Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiValuation.riskFactors.map((risk, index) => (
                        <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-100">{risk.category}</h4>
                            <Badge className={`${
                              risk.level === 'Low' ? 'bg-green-500/20 text-green-400' :
                              risk.level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {risk.level} Risk
                            </Badge>
                          </div>
                          <p className="text-slate-300 text-sm mb-3">{risk.description}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-sm">Impact Score:</span>
                            <Progress value={risk.impact * 10} className="h-2 flex-1" />
                            <span className="text-slate-100 text-sm">{risk.impact}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              {aiValuation?.recommendations && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-100">
                      <Zap className="h-5 w-5" />
                      AI-Powered Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiValuation.recommendations.map((recommendation, index) => (
                        <div key={index} className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                            <p className="text-slate-300">{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}