/**
 * Property Details Panel for TerraFusion-AI Map Analysis
 * 
 * Displays comprehensive property information including valuation,
 * market analysis, AI insights, and building details
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  X, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Building2,
  Calendar,
  Ruler,
  AlertTriangle,
  Zap,
  BarChart3,
  Eye,
  FileText,
  Star
} from 'lucide-react';

interface PropertyDetailsPanelProps {
  propertyId: string | null;
  onClose: () => void;
}

interface PropertyDetails {
  id: string;
  address: string;
  parcelId: string;
  coordinates: { lat: number; lng: number };
  assessedValue: number;
  marketValue: number;
  aiValuation: number;
  sqft: number;
  lotSize: number;
  yearBuilt: number;
  propertyType: string;
  buildingType: string;
  bedrooms?: number;
  bathrooms?: number;
  stories: number;
  condition: string;
  zoning: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  ownerName: string;
  taxYear: number;
  marketTrend: 'up' | 'down' | 'stable';
  priceHistory: Array<{ year: number; value: number }>;
  riskFactors: string[];
  aiInsights: {
    confidence: number;
    insights: string[];
    recommendations: string[];
    comparableProperties: Array<{
      address: string;
      value: number;
      similarity: number;
    }>;
  };
  buildingDetails: {
    exterior: string;
    roofType: string;
    heating: string;
    cooling: string;
    foundation: string;
    garage: boolean;
    basement: boolean;
    fireplace: boolean;
  };
}

export function PropertyDetailsPanel({ propertyId, onClose }: PropertyDetailsPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock property data - in production, this would come from the API
  const propertyData: PropertyDetails = {
    id: propertyId || 'P001',
    address: '1234 George Washington Way, Richland, WA 99352',
    parcelId: 'BC-12345678',
    coordinates: { lat: 46.2396, lng: -119.2782 },
    assessedValue: 425000,
    marketValue: 442000,
    aiValuation: 458000,
    sqft: 2150,
    lotSize: 8500,
    yearBuilt: 1998,
    propertyType: 'Single Family',
    buildingType: 'Residential',
    bedrooms: 4,
    bathrooms: 2.5,
    stories: 2,
    condition: 'Good',
    zoning: 'R-1',
    neighborhood: 'West Richland',
    city: 'Richland',
    zipCode: '99352',
    ownerName: 'Sample Property Owner',
    taxYear: 2024,
    marketTrend: 'up',
    priceHistory: [
      { year: 2020, value: 380000 },
      { year: 2021, value: 395000 },
      { year: 2022, value: 410000 },
      { year: 2023, value: 425000 },
      { year: 2024, value: 442000 }
    ],
    riskFactors: ['flood-zone-proximity', 'age-factor'],
    aiInsights: {
      confidence: 87,
      insights: [
        'Property value shows strong appreciation potential based on location analysis',
        'Building condition and age factors support current market positioning',
        'Neighborhood trends indicate continued growth in property values',
        'Proximity to major employment centers adds significant value'
      ],
      recommendations: [
        'Consider kitchen renovation to maximize value potential',
        'Market timing appears favorable for this property type',
        'Energy efficiency upgrades could increase appeal',
        'Landscape improvements would enhance curb appeal'
      ],
      comparableProperties: [
        { address: '1240 George Washington Way', value: 435000, similarity: 94 },
        { address: '1228 George Washington Way', value: 448000, similarity: 89 },
        { address: '1250 George Washington Way', value: 425000, similarity: 92 }
      ]
    },
    buildingDetails: {
      exterior: 'Vinyl Siding',
      roofType: 'Composition Shingle',
      heating: 'Forced Air Gas',
      cooling: 'Central Air',
      foundation: 'Concrete Slab',
      garage: true,
      basement: false,
      fireplace: true
    }
  };

  if (!propertyId) return null;

  const valueChange = propertyData.marketValue - propertyData.priceHistory[propertyData.priceHistory.length - 2]?.value || 0;
  const valueChangePercent = (valueChange / propertyData.priceHistory[propertyData.priceHistory.length - 2]?.value) * 100;

  return (
    <div className="fixed right-4 top-4 bottom-4 w-96 bg-white rounded-lg shadow-2xl z-50 overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b bg-blue-50">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                {propertyData.address}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Parcel: {propertyData.parcelId}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{propertyData.propertyType}</Badge>
            <Badge variant="outline">{propertyData.city}</Badge>
            {propertyData.marketTrend === 'up' ? (
              <Badge className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Rising
              </Badge>
            ) : propertyData.marketTrend === 'down' ? (
              <Badge className="bg-red-100 text-red-800">
                <TrendingDown className="h-3 w-3 mr-1" />
                Declining
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800">Stable</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-4 p-1 mx-4 mt-4">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="valuation" className="text-xs">Value</TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">AI Insights</TabsTrigger>
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="p-4 space-y-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <div className="text-2xl font-bold text-blue-600">
                    ${propertyData.marketValue.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Market Value</div>
                </Card>
                <Card className="p-3">
                  <div className="text-2xl font-bold text-green-600">
                    ${Math.round(propertyData.marketValue / propertyData.sqft)}
                  </div>
                  <div className="text-xs text-gray-600">Per Sq Ft</div>
                </Card>
              </div>

              {/* Property Info */}
              <Card className="p-3">
                <h4 className="font-semibold mb-2">Property Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year Built:</span>
                    <span>{propertyData.yearBuilt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Square Feet:</span>
                    <span>{propertyData.sqft.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lot Size:</span>
                    <span>{propertyData.lotSize.toLocaleString()} sq ft</span>
                  </div>
                  {propertyData.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bed/Bath:</span>
                      <span>{propertyData.bedrooms}/{propertyData.bathrooms}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stories:</span>
                    <span>{propertyData.stories}</span>
                  </div>
                </div>
              </Card>

              {/* Risk Factors */}
              {propertyData.riskFactors.length > 0 && (
                <Card className="p-3">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                    Risk Factors
                  </h4>
                  <div className="space-y-1">
                    {propertyData.riskFactors.map((factor, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {factor.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="valuation" className="p-4 space-y-4">
              {/* Valuation Comparison */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Valuation Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assessed Value</span>
                    <span className="font-semibold">${propertyData.assessedValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Market Value</span>
                    <span className="font-semibold">${propertyData.marketValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Zap className="h-3 w-3 mr-1" />
                      AI Valuation
                    </span>
                    <span className="font-semibold text-blue-600">${propertyData.aiValuation.toLocaleString()}</span>
                  </div>
                </div>
              </Card>

              {/* Price History */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Price History</h4>
                <div className="space-y-2">
                  {propertyData.priceHistory.slice(-3).map((entry, index) => (
                    <div key={entry.year} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{entry.year}</span>
                      <span className="font-medium">${entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {valueChange !== 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Annual Change</span>
                      <span className={`font-semibold ${valueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {valueChange > 0 ? '+' : ''}${valueChange.toLocaleString()} ({valueChangePercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Comparable Properties */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Comparable Properties</h4>
                <div className="space-y-2">
                  {propertyData.aiInsights.comparableProperties.map((comp, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <div>
                        <div className="font-medium">{comp.address}</div>
                        <div className="text-gray-500">{comp.similarity}% similar</div>
                      </div>
                      <span className="font-semibold">${comp.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="p-4 space-y-4">
              {/* AI Confidence */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-500" />
                  AI Analysis Confidence
                </h4>
                <div className="flex items-center gap-3">
                  <Progress value={propertyData.aiInsights.confidence} className="flex-1" />
                  <span className="font-semibold text-blue-600">{propertyData.aiInsights.confidence}%</span>
                </div>
              </Card>

              {/* AI Insights */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Key Insights</h4>
                <div className="space-y-2">
                  {propertyData.aiInsights.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Star className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* AI Recommendations */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Recommendations</h4>
                <div className="space-y-2">
                  {propertyData.aiInsights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <TrendingUp className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="p-4 space-y-4">
              {/* Building Details */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Building Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exterior:</span>
                    <span>{propertyData.buildingDetails.exterior}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Roof Type:</span>
                    <span>{propertyData.buildingDetails.roofType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heating:</span>
                    <span>{propertyData.buildingDetails.heating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cooling:</span>
                    <span>{propertyData.buildingDetails.cooling}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Foundation:</span>
                    <span>{propertyData.buildingDetails.foundation}</span>
                  </div>
                </div>
              </Card>

              {/* Features */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Features</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${propertyData.buildingDetails.garage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Garage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${propertyData.buildingDetails.basement ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Basement</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${propertyData.buildingDetails.fireplace ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>Fireplace</span>
                  </div>
                </div>
              </Card>

              {/* Location Details */}
              <Card className="p-3">
                <h4 className="font-semibold mb-3">Location Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Neighborhood:</span>
                    <span>{propertyData.neighborhood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zoning:</span>
                    <span>{propertyData.zoning}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Condition:</span>
                    <span>{propertyData.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Owner:</span>
                    <span>{propertyData.ownerName}</span>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}