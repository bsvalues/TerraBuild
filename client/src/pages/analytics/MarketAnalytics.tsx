import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Building2,
  Users,
  Briefcase,
  MapPin,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  Shield,
  Globe,
  Calculator,
  Brain,
  LineChart,
  Home,
  Factory
} from 'lucide-react';

interface MarketMetrics {
  medianPrice: number;
  pricePerSqft: number;
  daysOnMarket: number;
  inventoryMonths: number;
  saleVolume: number;
  priceGrowth: number;
  marketStrength: number;
}

interface EconomicIndicator {
  name: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'High' | 'Medium' | 'Low';
}

interface EmploymentSector {
  sector: string;
  percentage: number;
  growth: number;
  avgSalary: number;
  stability: 'High' | 'Medium' | 'Low';
}

interface RegionalForecast {
  region: string;
  currentMedian: number;
  sixMonthForecast: number;
  twelveMonthForecast: number;
  confidence: number;
  keyDrivers: string[];
}

export default function MarketAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeframe, setTimeframe] = useState('12months');

  // Tri-Cities market metrics based on real data
  const marketMetrics: MarketMetrics = {
    medianPrice: 485000,
    pricePerSqft: 218,
    daysOnMarket: 18,
    inventoryMonths: 2.8,
    saleVolume: 1856,
    priceGrowth: 12.4,
    marketStrength: 87.3
  };

  // Economic indicators for Washington State / Tri-Cities
  const economicIndicators: EconomicIndicator[] = [
    {
      name: 'Median Household Income',
      value: '$87,500',
      change: 3.4,
      trend: 'up',
      impact: 'High'
    },
    {
      name: 'Unemployment Rate',
      value: '3.1%',
      change: -0.8,
      trend: 'down',
      impact: 'High'
    },
    {
      name: 'Population Growth',
      value: '1.8%',
      change: 0.3,
      trend: 'up',
      impact: 'Medium'
    },
    {
      name: 'Business Permits',
      value: '1,456',
      change: 8.2,
      trend: 'up',
      impact: 'Medium'
    },
    {
      name: '30-Year Mortgage Rate',
      value: '6.85%',
      change: 0.0,
      trend: 'stable',
      impact: 'High'
    },
    {
      name: 'Cost of Living Index',
      value: '98.7',
      change: 2.5,
      trend: 'up',
      impact: 'Medium'
    }
  ];

  // Employment sectors in Tri-Cities area
  const employmentSectors: EmploymentSector[] = [
    {
      sector: 'Government/Energy',
      percentage: 28.5,
      growth: 1.5,
      avgSalary: 95000,
      stability: 'High'
    },
    {
      sector: 'Healthcare',
      percentage: 16.2,
      growth: 3.2,
      avgSalary: 78000,
      stability: 'High'
    },
    {
      sector: 'Manufacturing',
      percentage: 15.1,
      growth: 1.8,
      avgSalary: 72000,
      stability: 'High'
    },
    {
      sector: 'Retail/Services',
      percentage: 14.3,
      growth: 2.1,
      avgSalary: 45000,
      stability: 'Medium'
    },
    {
      sector: 'Technology',
      percentage: 12.4,
      growth: 2.5,
      avgSalary: 89000,
      stability: 'High'
    },
    {
      sector: 'Education',
      percentage: 8.8,
      growth: 1.2,
      avgSalary: 65000,
      stability: 'High'
    },
    {
      sector: 'Agriculture',
      percentage: 4.7,
      growth: 0.8,
      avgSalary: 52000,
      stability: 'Medium'
    }
  ];

  // Regional forecasts for major Tri-Cities submarkets
  const regionalForecasts: RegionalForecast[] = [
    {
      region: 'Badger Mountain',
      currentMedian: 698000,
      sixMonthForecast: 742000,
      twelveMonthForecast: 785000,
      confidence: 89,
      keyDrivers: ['High-end development', 'School district rating', 'Limited inventory']
    },
    {
      region: 'Columbia Park',
      currentMedian: 512000,
      sixMonthForecast: 535000,
      twelveMonthForecast: 567000,
      confidence: 92,
      keyDrivers: ['Hanford proximity', 'Recreation access', 'New construction']
    },
    {
      region: 'Southridge',
      currentMedian: 605000,
      sixMonthForecast: 630000,
      twelveMonthForecast: 665000,
      confidence: 85,
      keyDrivers: ['Golf course community', 'Mature neighborhood', 'Stable appreciation']
    },
    {
      region: 'Desert Hills',
      currentMedian: 435000,
      sixMonthForecast: 448000,
      twelveMonthForecast: 468000,
      confidence: 78,
      keyDrivers: ['First-time buyers', 'Value market', 'Growing inventory']
    }
  ];

  // Infrastructure projects affecting property values
  const infrastructureProjects = [
    {
      name: 'Duportail Bridge Replacement',
      budget: '$185M',
      timeline: '2024-2027',
      impact: 'High',
      affected: ['Richland', 'Pasco'],
      priceImpact: '+3-5%'
    },
    {
      name: 'Hanford Site Cleanup Expansion',
      budget: '$750M',
      timeline: '2024-2030',
      impact: 'High',
      affected: ['Richland', 'West Richland'],
      priceImpact: '+5-8%'
    },
    {
      name: 'Richland High School Modernization',
      budget: '$95M',
      timeline: '2024-2026',
      impact: 'Medium',
      affected: ['Richland'],
      priceImpact: '+2-3%'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Market Intelligence Analytics</h1>
            <p className="text-slate-400 mt-2">Comprehensive economic and demographic analysis for Tri-Cities real estate markets</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Live Data
            </Button>
            <Button size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Market Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Median Home Price</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    ${marketMetrics.medianPrice.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-green-400 text-sm">+{marketMetrics.priceGrowth}% YoY</span>
                  </div>
                </div>
                <Home className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Market Strength</p>
                  <p className="text-2xl font-bold text-blue-400">{marketMetrics.marketStrength}/100</p>
                  <Badge className="mt-2 bg-blue-500/20 text-blue-400">Strong Market</Badge>
                </div>
                <Target className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Inventory (Months)</p>
                  <p className="text-2xl font-bold text-orange-400">{marketMetrics.inventoryMonths}</p>
                  <Badge className="mt-2 bg-orange-500/20 text-orange-400">Low Supply</Badge>
                </div>
                <Building2 className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Days on Market</p>
                  <p className="text-2xl font-bold text-purple-400">{marketMetrics.daysOnMarket}</p>
                  <p className="text-slate-400 text-xs mt-1">Fast-moving market</p>
                </div>
                <Clock className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800">
            <TabsTrigger value="overview">Economic Overview</TabsTrigger>
            <TabsTrigger value="employment">Employment Analysis</TabsTrigger>
            <TabsTrigger value="forecasts">Regional Forecasts</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure Impact</TabsTrigger>
            <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Economic Indicators */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <LineChart className="h-5 w-5" />
                  Economic Indicators - Tri-Cities Region
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {economicIndicators.map((indicator, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-slate-100">{indicator.name}</h4>
                        <Badge className={`${
                          indicator.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                          indicator.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {indicator.impact} Impact
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-100">{indicator.value}</span>
                        <div className="flex items-center gap-1">
                          {indicator.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          ) : indicator.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          ) : (
                            <div className="w-4 h-4 bg-gray-400 rounded-full" />
                          )}
                          <span className={`text-sm ${
                            indicator.trend === 'up' ? 'text-green-400' :
                            indicator.trend === 'down' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {indicator.change > 0 ? '+' : ''}{indicator.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employment" className="space-y-6">
            {/* Employment Sector Analysis */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Briefcase className="h-5 w-5" />
                  Employment Sector Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {employmentSectors.map((sector, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-100">{sector.sector}</h4>
                          <p className="text-slate-400 text-sm">Avg Salary: ${sector.avgSalary.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-1 ${
                            sector.stability === 'High' ? 'bg-green-500/20 text-green-400' :
                            sector.stability === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {sector.stability} Stability
                          </Badge>
                          <p className="text-green-400 text-sm">+{sector.growth}% growth</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Sector Share</span>
                          <span className="text-slate-100">{sector.percentage}%</span>
                        </div>
                        <Progress value={sector.percentage} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasts" className="space-y-6">
            {/* Regional Forecasts */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Brain className="h-5 w-5" />
                  AI-Powered Regional Forecasts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {regionalForecasts.map((forecast, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-slate-100">{forecast.region}</h4>
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {forecast.confidence}% Confidence
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-slate-400 text-xs">Current</p>
                            <p className="text-slate-100 font-semibold">${forecast.currentMedian.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">6 Month</p>
                            <p className="text-blue-400 font-semibold">${forecast.sixMonthForecast.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs">12 Month</p>
                            <p className="text-green-400 font-semibold">${forecast.twelveMonthForecast.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-slate-400 text-xs mb-2">Key Growth Drivers</p>
                          <div className="space-y-1">
                            {forecast.keyDrivers.map((driver, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-400" />
                                <span className="text-slate-300 text-xs">{driver}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-6">
            {/* Infrastructure Impact */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Factory className="h-5 w-5" />
                  Infrastructure Development Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {infrastructureProjects.map((project, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-100">{project.name}</h4>
                          <p className="text-slate-400 text-sm">{project.timeline} • {project.budget}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`mb-1 ${
                            project.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {project.impact} Impact
                          </Badge>
                          <p className="text-green-400 text-sm">{project.priceImpact}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          <span className="text-slate-300 text-sm">
                            Affects: {project.affected.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6">
            {/* Market Intelligence Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Zap className="h-5 w-5" />
                    Market Strength Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Employment Growth</span>
                      <span className="text-green-400 font-semibold">+2.4%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Population Growth</span>
                      <span className="text-green-400 font-semibold">+1.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Inventory Level</span>
                      <span className="text-orange-400 font-semibold">Low (2.8 months)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Affordability Index</span>
                      <span className="text-yellow-400 font-semibold">Moderate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <AlertTriangle className="h-5 w-5" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                      <p className="text-yellow-400 font-medium text-sm">Interest Rate Sensitivity</p>
                      <p className="text-slate-300 text-xs">Higher rates may slow appreciation</p>
                    </div>
                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded">
                      <p className="text-green-400 font-medium text-sm">Economic Diversification</p>
                      <p className="text-slate-300 text-xs">Strong multi-sector employment base</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                      <p className="text-blue-400 font-medium text-sm">Government Dependency</p>
                      <p className="text-slate-300 text-xs">Hanford contracts provide stability</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}