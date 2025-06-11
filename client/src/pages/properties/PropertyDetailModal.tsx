import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Home,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  FileText,
  Camera
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PropertyDetailModal({ property, isOpen, onClose }: PropertyDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!property) return null;

  const aiValuationDetails = {
    estimatedValue: property.aiValuation,
    confidence: property.confidence,
    breakdown: {
      landValue: 125000,
      improvementValue: 370000,
      depreciation: 15,
      marketAdjustment: 8,
      locationPremium: 12
    },
    comparables: [
      { address: "1240 Columbia Park Trail", salePrice: 492000, distance: 0.2, similarity: 94 },
      { address: "1256 Columbia Park Trail", salePrice: 478000, distance: 0.3, similarity: 91 },
      { address: "1268 Columbia Park Trail", salePrice: 505000, distance: 0.4, similarity: 89 }
    ],
    marketTrends: {
      yearOverYear: 5.2,
      quarterOverQuarter: 1.8,
      prediction6Month: 2.1,
      prediction12Month: 4.5
    }
  };

  const riskFactors = [
    { type: 'Environmental', level: 'Low', description: 'No flood zone, seismic risk minimal' },
    { type: 'Market', level: 'Low', description: 'Stable neighborhood with consistent growth' },
    { type: 'Structural', level: 'Very Low', description: 'Recent construction, excellent condition' },
    { type: 'Economic', level: 'Low', description: 'Diversified local economy, stable employment' }
  ];

  const improvementOpportunities = [
    { category: 'Energy Efficiency', impact: 'High', cost: 15000, roi: '185%', timeframe: '2-3 months' },
    { category: 'Curb Appeal', impact: 'Medium', cost: 8000, roi: '150%', timeframe: '1 month' },
    { category: 'Interior Updates', impact: 'High', cost: 25000, roi: '220%', timeframe: '3-4 months' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100">
            {property.address}
          </DialogTitle>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{property.type}</span>
            <span>•</span>
            <span>Built {property.yearBuilt}</span>
            <span>•</span>
            <span>{property.sqft?.toLocaleString()} sq ft</span>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="valuation">AI Valuation</TabsTrigger>
            <TabsTrigger value="market">Market Analysis</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Property Basics */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Home className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Property Type</p>
                      <p className="text-slate-100 font-medium">{property.type}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Year Built</p>
                      <p className="text-slate-100 font-medium">{property.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Square Footage</p>
                      <p className="text-slate-100 font-medium">{property.sqft?.toLocaleString()} sq ft</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Lot Size</p>
                      <p className="text-slate-100 font-medium">0.25 acres</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Bedrooms</p>
                      <p className="text-slate-100 font-medium">4</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Bathrooms</p>
                      <p className="text-slate-100 font-medium">3.5</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Valuation */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <DollarSign className="h-5 w-5" />
                    Current Valuation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Market Value</span>
                      <span className="text-2xl font-bold text-emerald-400">
                        ${property.marketValue?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">AI Valuation</span>
                      <span className="text-xl font-semibold text-blue-400">
                        ${property.aiValuation?.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Confidence Level</span>
                      <Badge className={`${
                        property.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                        property.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {property.confidence}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Price per Sq Ft</span>
                      <span className="text-slate-100 font-medium">
                        ${Math.round(property.aiValuation / property.sqft)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location & Zoning */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <MapPin className="h-5 w-5" />
                  Location & Zoning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-slate-400 text-sm">Neighborhood</p>
                    <p className="text-slate-100 font-medium">{property.neighborhood}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Zoning</p>
                    <p className="text-slate-100 font-medium">{property.zoning}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">School District</p>
                    <p className="text-slate-100 font-medium">Richland School District</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="valuation" className="space-y-6">
            {/* AI Valuation Breakdown */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <BarChart3 className="h-5 w-5" />
                  AI Valuation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Land Value</span>
                      <span className="text-slate-100 font-medium">
                        ${aiValuationDetails.breakdown.landValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Improvement Value</span>
                      <span className="text-slate-100 font-medium">
                        ${aiValuationDetails.breakdown.improvementValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Depreciation</span>
                      <span className="text-red-400">-{aiValuationDetails.breakdown.depreciation}%</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Market Adjustment</span>
                      <span className="text-green-400">+{aiValuationDetails.breakdown.marketAdjustment}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Location Premium</span>
                      <span className="text-green-400">+{aiValuationDetails.breakdown.locationPremium}%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                      <span className="text-slate-100 font-semibold">Final Valuation</span>
                      <span className="text-2xl font-bold text-blue-400">
                        ${aiValuationDetails.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparable Properties */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Building2 className="h-5 w-5" />
                  Comparable Properties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiValuationDetails.comparables.map((comp, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg">
                      <div>
                        <p className="text-slate-100 font-medium">{comp.address}</p>
                        <p className="text-slate-400 text-sm">{comp.distance} miles • {comp.similarity}% similar</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-100 font-semibold">${comp.salePrice.toLocaleString()}</p>
                        <p className="text-slate-400 text-sm">Sale Price</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            {/* Market Trends */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <TrendingUp className="h-5 w-5" />
                  Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">+{aiValuationDetails.marketTrends.yearOverYear}%</p>
                    <p className="text-slate-400 text-sm">Year over Year</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-400">+{aiValuationDetails.marketTrends.quarterOverQuarter}%</p>
                    <p className="text-slate-400 text-sm">Quarter over Quarter</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">+{aiValuationDetails.marketTrends.prediction6Month}%</p>
                    <p className="text-slate-400 text-sm">6-Month Forecast</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-400">+{aiValuationDetails.marketTrends.prediction12Month}%</p>
                    <p className="text-slate-400 text-sm">12-Month Forecast</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            {/* Risk Assessment */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Shield className="h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskFactors.map((risk, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          risk.level === 'Very Low' ? 'bg-green-500' :
                          risk.level === 'Low' ? 'bg-yellow-500' :
                          risk.level === 'Medium' ? 'bg-orange-500' :
                          'bg-red-500'
                        }`} />
                        <div>
                          <p className="text-slate-100 font-medium">{risk.type}</p>
                          <p className="text-slate-400 text-sm">{risk.description}</p>
                        </div>
                      </div>
                      <Badge variant={risk.level === 'Very Low' || risk.level === 'Low' ? 'success' : 'warning'}>
                        {risk.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            {/* Improvement Opportunities */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Zap className="h-5 w-5" />
                  Value Enhancement Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {improvementOpportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-slate-100 font-semibold">{opportunity.category}</h4>
                          <p className="text-slate-400 text-sm">Estimated ROI: {opportunity.roi}</p>
                        </div>
                        <Badge className={`${
                          opportunity.impact === 'High' ? 'bg-green-500/20 text-green-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {opportunity.impact} Impact
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Investment</p>
                          <p className="text-slate-100 font-medium">${opportunity.cost.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Timeframe</p>
                          <p className="text-slate-100 font-medium">{opportunity.timeframe}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t border-slate-700">
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}