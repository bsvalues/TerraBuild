/**
 * Benton County Property Valuation Interface
 * 
 * User-driven AI-powered property valuation system that integrates authentic
 * Benton County Washington data for comprehensive property analysis and results display.
 */

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Home, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Info,
  Building2,
  Calendar,
  Ruler
} from 'lucide-react';

// Benton County Property Interface
interface BentonCountyProperty {
  parcelId: string;
  address: string;
  city: string;
  zipCode: string;
  ownerName: string;
  propertyType: string;
  buildingType: string;
  yearBuilt: number;
  totalSqFt: number;
  lotSizeSqFt: number;
  assessedValue: number;
  marketValue: number;
  taxYear: number;
  zoning: string;
  neighborhood: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  buildingDetails: {
    stories: number;
    basement: boolean;
    garage: boolean;
    quality: string;
    condition: string;
    heatingType: string;
    roofType: string;
    exteriorWall: string;
  };
  taxHistory: Array<{
    year: number;
    assessedValue: number;
    taxAmount: number;
  }>;
  permits: Array<{
    permitNumber: string;
    issueDate: string;
    type: string;
    description: string;
    value: number;
  }>;
}

// AI Valuation Result Interface
interface AIValuationResult {
  property: BentonCountyProperty;
  marketData: any;
  costFactors: any;
  aiAnalysis: {
    estimatedValue: number;
    confidenceLevel: string;
    insights: string[];
    recommendations: string[];
  };
  timestamp: string;
}

export function PropertyValuationInterface() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<BentonCountyProperty | null>(null);
  const [valuationResult, setValuationResult] = useState<AIValuationResult | null>(null);
  const { toast } = useToast();

  // Property Search Query
  const { data: searchResults, isLoading: isSearching, refetch: searchProperties } = useQuery({
    queryKey: ['/api/benton-county/search', searchQuery],
    enabled: false,
    staleTime: 0
  });

  // AI Valuation Mutation
  const valuationMutation = useMutation({
    mutationFn: async (parcelId: string) => {
      const response = await fetch('/api/benton-county/ai-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcelId })
      });
      if (!response.ok) throw new Error('Valuation failed');
      return response.json();
    },
    onSuccess: (data) => {
      setValuationResult(data.data);
      toast({
        title: "AI Valuation Complete",
        description: "Advanced property analysis completed with authentic Benton County data",
      });
    },
    onError: (error) => {
      toast({
        title: "Valuation Error",
        description: "Failed to complete AI analysis. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handlePropertySelect = (property: BentonCountyProperty) => {
    setSelectedProperty(property);
    setValuationResult(null);
  };

  const handleAnalyzeProperty = () => {
    if (selectedProperty) {
      valuationMutation.mutate(selectedProperty.parcelId);
    }
  };

  const handleSearch = () => {
    if (searchQuery.length >= 3) {
      searchProperties();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-4xl font-bold text-white">
            TerraFusion-AI Property Valuation
          </h1>
          <p className="text-xl text-cyan-200 max-w-3xl mx-auto">
            Advanced AI-powered property analysis using authentic Benton County Washington data
          </p>
        </div>

        {/* Search Section */}
        <Card className="bg-white/10 backdrop-blur-sm border-cyan-800/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Search className="h-5 w-5 mr-2 text-cyan-400" />
              Property Search
            </CardTitle>
            <CardDescription className="text-cyan-200">
              Search by address, parcel ID, or owner name in Benton County
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Input
                placeholder="Enter address, parcel ID, or owner name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/10 border-cyan-800/50 text-white placeholder-cyan-300"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching || searchQuery.length < 3}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((property: BentonCountyProperty) => (
                  <div
                    key={property.parcelId}
                    onClick={() => handlePropertySelect(property)}
                    className="p-3 bg-white/5 rounded-lg border border-cyan-800/30 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium">{property.address}</p>
                        <p className="text-cyan-300 text-sm">{property.city}, WA {property.zipCode}</p>
                        <p className="text-cyan-400 text-xs">Parcel: {property.parcelId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold">
                          ${property.marketValue?.toLocaleString() || 'N/A'}
                        </p>
                        <p className="text-cyan-300 text-sm">{property.propertyType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Property Details */}
        {selectedProperty && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-sm border-cyan-800/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Home className="h-5 w-5 mr-2 text-cyan-400" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-cyan-300 text-sm">Address</p>
                    <p className="text-white font-medium">{selectedProperty.address}</p>
                    <p className="text-cyan-200">{selectedProperty.city}, WA {selectedProperty.zipCode}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm">Owner</p>
                    <p className="text-white">{selectedProperty.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm">Property Type</p>
                    <Badge variant="secondary" className="bg-cyan-800/50 text-cyan-200">
                      {selectedProperty.propertyType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm">Year Built</p>
                    <p className="text-white">{selectedProperty.yearBuilt}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm">Total Sq Ft</p>
                    <p className="text-white">{selectedProperty.totalSqFt?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-cyan-300 text-sm">Lot Size</p>
                    <p className="text-white">{selectedProperty.lotSizeSqFt?.toLocaleString()} sq ft</p>
                  </div>
                </div>

                <Separator className="bg-cyan-800/50" />

                <div>
                  <p className="text-cyan-300 text-sm mb-2">Current Valuation</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white text-sm">Assessed Value</p>
                      <p className="text-green-400 font-bold text-lg">
                        ${selectedProperty.assessedValue?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-white text-sm">Market Value</p>
                      <p className="text-green-400 font-bold text-lg">
                        ${selectedProperty.marketValue?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAnalyzeProperty}
                  disabled={valuationMutation.isPending}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
                >
                  {valuationMutation.isPending ? (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2 animate-pulse" />
                      AI Analysis in Progress...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Run AI Valuation Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Valuation Results */}
            {valuationResult && (
              <Card className="bg-white/10 backdrop-blur-sm border-cyan-800/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                    AI Valuation Results
                  </CardTitle>
                  <CardDescription className="text-cyan-200">
                    Advanced analysis completed at {new Date(valuationResult.timestamp).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-green-900/30 to-cyan-900/30 rounded-lg border border-green-500/30">
                    <p className="text-green-300 text-sm mb-2">AI Estimated Value</p>
                    <p className="text-green-400 text-3xl font-bold">
                      ${valuationResult.aiAnalysis.estimatedValue.toLocaleString()}
                    </p>
                    <Badge 
                      variant="outline" 
                      className="mt-2 border-green-500/50 text-green-300"
                    >
                      {valuationResult.aiAnalysis.confidenceLevel} Confidence
                    </Badge>
                  </div>

                  {valuationResult.aiAnalysis.insights.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <Info className="h-4 w-4 mr-2 text-cyan-400" />
                        AI Insights
                      </h4>
                      <div className="space-y-2">
                        {valuationResult.aiAnalysis.insights.map((insight, index) => (
                          <Alert key={index} className="bg-blue-900/30 border-blue-500/30">
                            <AlertDescription className="text-blue-200">
                              {insight}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}

                  {valuationResult.aiAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3">Recommendations</h4>
                      <div className="space-y-2">
                        {valuationResult.aiAnalysis.recommendations.map((rec, index) => (
                          <Alert key={index} className="bg-cyan-900/30 border-cyan-500/30">
                            <AlertDescription className="text-cyan-200">
                              {rec}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Information Card */}
        {!selectedProperty && (
          <Card className="bg-white/5 backdrop-blur-sm border-cyan-800/30">
            <CardContent className="p-8 text-center">
              <MapPin className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome to TerraFusion-AI
              </h3>
              <p className="text-cyan-200 max-w-2xl mx-auto">
                Advanced property valuation platform using authentic Benton County data. 
                Search for any property in Richland, Kennewick, Pasco, or other Benton County municipalities 
                to begin comprehensive AI-powered analysis.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}