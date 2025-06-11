import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, TrendingUp, Calculator, MapPin, Activity,
  AlertTriangle, CheckCircle, DollarSign, Home,
  Zap, Target, BarChart3, PieChart, LineChart
} from 'lucide-react';

interface PropertyIntelligenceProps {
  selectedProperty?: any;
  marketData?: any;
  onInsightGenerated: (insight: any) => void;
}

export const PropertyIntelligenceDashboard: React.FC<PropertyIntelligenceProps> = ({
  selectedProperty,
  marketData,
  onInsightGenerated
}) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [aiAnalysisRunning, setAiAnalysisRunning] = useState(false);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [investmentMetrics, setInvestmentMetrics] = useState<any>(null);

  useEffect(() => {
    if (selectedProperty) {
      generatePropertyInsights();
    }
  }, [selectedProperty]);

  const generatePropertyInsights = async () => {
    if (!selectedProperty) return;
    
    setAiAnalysisRunning(true);
    
    try {
      // Simulate AI-powered property analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const propertyInsights = {
        valuationAccuracy: calculateValuationAccuracy(selectedProperty),
        marketPosition: analyzeMarketPosition(selectedProperty),
        investmentPotential: assessInvestmentPotential(selectedProperty),
        riskFactors: identifyRiskFactors(selectedProperty),
        comparativeAnalysis: generateComparativeAnalysis(selectedProperty),
        futureProjections: projectFutureTrends(selectedProperty)
      };
      
      setInsights([propertyInsights]);
      setMarketTrends(generateMarketTrends());
      setInvestmentMetrics(calculateInvestmentMetrics(selectedProperty));
      onInsightGenerated(propertyInsights);
      
    } catch (error) {
      console.error('AI analysis failed:', error);
    } finally {
      setAiAnalysisRunning(false);
    }
  };

  const calculateValuationAccuracy = (property: any) => {
    const assessedValue = property.total_value || 0;
    const landValue = property.land_value || 0;
    const marketConfidence = Math.min(95, 65 + Math.random() * 30);
    
    return {
      assessedValue,
      estimatedMarketValue: assessedValue * (0.95 + Math.random() * 0.1),
      confidence: marketConfidence,
      lastUpdated: new Date().toLocaleDateString(),
      methodology: 'AI-Enhanced Comparative Market Analysis'
    };
  };

  const analyzeMarketPosition = (property: any) => {
    const typeWeights = {
      'Single Family': 0.85,
      'Condominium': 0.75,
      'Townhouse': 0.80,
      'Multi-Family': 0.70
    };
    
    const baseScore = 7.2;
    const typeMultiplier = typeWeights[property.property_type] || 0.75;
    const locationBonus = property.city === 'Richland' ? 0.5 : 0.2;
    
    return {
      overallScore: Math.min(10, baseScore * typeMultiplier + locationBonus),
      pricePerSqft: Math.round((property.total_value || 0) / (property.land_area || 1000)),
      marketVelocity: 'Moderate',
      absorptionRate: '3.2 months',
      competitivePosition: 'Above Average'
    };
  };

  const assessInvestmentPotential = (property: any) => {
    const age = new Date().getFullYear() - (property.year_built || 2000);
    const ageScore = Math.max(0, 10 - age * 0.1);
    const locationScore = property.city === 'Richland' ? 8.5 : 6.5;
    
    return {
      overallGrade: 'B+',
      appreciationForecast: '3.8% annually',
      renovationPotential: age > 20 ? 'High' : 'Moderate',
      cashFlowProjection: 'Positive',
      marketCycle: 'Mid-Growth Phase',
      riskLevel: 'Low-Moderate'
    };
  };

  const identifyRiskFactors = (property: any) => {
    return [
      {
        category: 'Environmental',
        risk: 'Low',
        description: 'Minimal flood/earthquake risk',
        impact: 2
      },
      {
        category: 'Market',
        risk: 'Moderate',
        description: 'Interest rate sensitivity',
        impact: 5
      },
      {
        category: 'Economic',
        risk: 'Low',
        description: 'Stable local employment',
        impact: 3
      }
    ];
  };

  const generateComparativeAnalysis = (property: any) => {
    return {
      similarProperties: 24,
      averageDaysOnMarket: 45,
      priceVariance: '±8%',
      competitorAnalysis: 'Favorably positioned',
      uniqueSellingPoints: [
        'Prime location',
        'Recent updates',
        'Established neighborhood'
      ]
    };
  };

  const projectFutureTrends = (property: any) => {
    return {
      oneYear: { value: (property.total_value || 0) * 1.038, confidence: 82 },
      threeYear: { value: (property.total_value || 0) * 1.118, confidence: 71 },
      fiveYear: { value: (property.total_value || 0) * 1.205, confidence: 65 },
      marketDrivers: [
        'Population growth',
        'Infrastructure development',
        'Economic diversification'
      ]
    };
  };

  const generateMarketTrends = () => {
    return {
      medianPrice: 425000,
      priceGrowth: '+3.2%',
      inventory: 1.8,
      absorption: '2.8 months',
      newListings: '+12%',
      pendingSales: '+8%'
    };
  };

  const calculateInvestmentMetrics = (property: any) => {
    const value = property.total_value || 400000;
    return {
      capRate: '6.2%',
      cashOnCash: '8.4%',
      roi: '12.1%',
      irr: '11.8%',
      paybackPeriod: '12.3 years',
      breakEven: '94% occupancy'
    };
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  if (!selectedProperty) {
    return (
      <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <div className="text-slate-400">Select a property to view AI-powered insights</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/95 border-slate-600 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Brain className="h-4 w-4" />
          Property Intelligence Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>
            <TabsTrigger value="investment" className="text-xs">Investment</TabsTrigger>
            <TabsTrigger value="forecast" className="text-xs">Forecast</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3 space-y-3">
            {aiAnalysisRunning ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 animate-pulse text-blue-400" />
                  <span className="text-sm text-white">AI Analysis in Progress...</span>
                </div>
                <Progress value={75} className="h-2" />
                <div className="text-xs text-slate-400">Analyzing comparable properties and market trends</div>
              </div>
            ) : insights.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded p-3">
                    <div className="text-xs text-slate-400">Market Position</div>
                    <div className={`text-lg font-bold ${getScoreColor(insights[0]?.marketPosition?.overallScore || 0)}`}>
                      {insights[0]?.marketPosition?.overallScore?.toFixed(1)}/10
                    </div>
                    <div className="text-xs text-slate-300">{insights[0]?.marketPosition?.competitivePosition}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-3">
                    <div className="text-xs text-slate-400">Valuation Confidence</div>
                    <div className="text-lg font-bold text-green-400">
                      {insights[0]?.valuationAccuracy?.confidence?.toFixed(0)}%
                    </div>
                    <div className="text-xs text-slate-300">AI-Enhanced CMA</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">Risk Assessment</div>
                  {insights[0]?.riskFactors?.map((risk: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{risk.category}</span>
                      <div className="flex items-center gap-2">
                        <span className={getRiskColor(risk.risk)}>{risk.risk}</span>
                        <div className="w-12 bg-slate-700 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${
                              risk.impact <= 3 ? 'bg-green-400' : 
                              risk.impact <= 6 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${risk.impact * 10}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-600">
                  <div className="text-xs font-medium text-slate-300 mb-2">Investment Grade</div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {insights[0]?.investmentPotential?.overallGrade}
                    </Badge>
                    <span className="text-xs text-green-400">
                      {insights[0]?.investmentPotential?.appreciationForecast}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="market" className="mt-3 space-y-3">
            {marketTrends && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded p-3 text-center">
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-green-400" />
                    <div className="text-xs text-slate-400">Median Price</div>
                    <div className="font-bold text-white">${marketTrends.medianPrice.toLocaleString()}</div>
                    <div className="text-xs text-green-400">{marketTrends.priceGrowth}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-3 text-center">
                    <Home className="h-4 w-4 mx-auto mb-1 text-blue-400" />
                    <div className="text-xs text-slate-400">Inventory</div>
                    <div className="font-bold text-white">{marketTrends.inventory} months</div>
                    <div className="text-xs text-blue-400">Balanced Market</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">Market Metrics</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Absorption Rate</span>
                      <span className="text-white">{marketTrends.absorption}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">New Listings</span>
                      <span className="text-green-400">{marketTrends.newListings}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Pending Sales</span>
                      <span className="text-green-400">{marketTrends.pendingSales}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="investment" className="mt-3 space-y-3">
            {investmentMetrics && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-xs text-slate-400">Cap Rate</div>
                    <div className="font-bold text-green-400">{investmentMetrics.capRate}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-xs text-slate-400">Cash on Cash</div>
                    <div className="font-bold text-blue-400">{investmentMetrics.cashOnCash}</div>
                  </div>
                  <div className="bg-slate-800/50 rounded p-2 text-center">
                    <div className="text-xs text-slate-400">ROI</div>
                    <div className="font-bold text-purple-400">{investmentMetrics.roi}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">IRR</span>
                    <span className="text-white">{investmentMetrics.irr}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Payback Period</span>
                    <span className="text-white">{investmentMetrics.paybackPeriod}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Break Even</span>
                    <span className="text-white">{investmentMetrics.breakEven}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="forecast" className="mt-3 space-y-3">
            {insights.length > 0 && insights[0]?.futureProjections && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">Value Projections</div>
                  {[
                    { period: '1 Year', data: insights[0].futureProjections.oneYear },
                    { period: '3 Years', data: insights[0].futureProjections.threeYear },
                    { period: '5 Years', data: insights[0].futureProjections.fiveYear }
                  ].map((projection, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{projection.period}</span>
                      <div className="text-right">
                        <div className="text-white font-medium">
                          ${projection.data.value.toLocaleString()}
                        </div>
                        <div className="text-slate-400">
                          {projection.data.confidence}% confidence
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-600">
                  <div className="text-xs font-medium text-slate-300 mb-2">Market Drivers</div>
                  <div className="space-y-1">
                    {insights[0].futureProjections.marketDrivers.map((driver: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span className="text-slate-300">{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="pt-3 border-t border-slate-600 mt-3">
          <Button 
            onClick={generatePropertyInsights}
            disabled={aiAnalysisRunning}
            className="w-full"
            size="sm"
          >
            {aiAnalysisRunning ? (
              <>
                <Zap className="h-3 w-3 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-3 w-3 mr-2" />
                Refresh AI Analysis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};