/**
 * Benton County Property Valuation Interface
 * 
 * User-driven AI-powered property valuation system that integrates authentic
 * Benton County Washington data for comprehensive property analysis and results display.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, TrendingUp, Home, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

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
  const queryClient = useQueryClient();

  // Search Benton County properties
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['/api/benton-county/search', searchQuery],
    enabled: searchQuery.length > 2,
    select: (data: any) => data?.data || []
  });

  // AI-powered property valuation mutation
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
        description: "Property analysis using Benton County data completed successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Valuation Error",
        description: "Please verify API credentials for Benton County data access",
        variant: "destructive"
      });
    }
  });

  const handlePropertySelect = (property: BentonCountyProperty) => {
    setSelectedProperty(property);
    setValuationResult(null);
  };

  const handleStartValuation = () => {
    if (selectedProperty) {
      valuationMutation.mutate(selectedProperty.parcelId);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'default';
      case 'medium': return 'outline';
      case 'low': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Benton County Property Valuation
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered property analysis using authentic Benton County Washington data
        </p>
      </div>

      {/* Property Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Benton County Properties
          </CardTitle>
          <CardDescription>
            Enter an address, parcel ID, or city to search authentic county records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="e.g., 1234 Columbia Park Trail, Richland"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button disabled={isSearching || searchQuery.length < 3}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Search Results</h3>
              {searchResults.map((property: BentonCountyProperty) => (
                <Card 
                  key={property.parcelId}
                  className={`cursor-pointer transition-colors ${
                    selectedProperty?.parcelId === property.parcelId 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{property.address}</h4>
                        <p className="text-sm text-gray-600">
                          {property.city}, WA {property.zipCode}
                        </p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Parcel: {property.parcelId}</span>
                          <span>{property.buildingType}</span>
                          <span>{property.totalSqFt.toLocaleString()} sq ft</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(property.assessedValue)}
                        </p>
                        <p className="text-sm text-gray-500">Assessed Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Property Details */}
      {selectedProperty && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedProperty.address}</h3>
                <p className="text-gray-600">{selectedProperty.city}, WA {selectedProperty.zipCode}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Parcel ID:</span>
                  <p>{selectedProperty.parcelId}</p>
                </div>
                <div>
                  <span className="font-medium">Property Type:</span>
                  <p>{selectedProperty.propertyType}</p>
                </div>
                <div>
                  <span className="font-medium">Building Type:</span>
                  <p>{selectedProperty.buildingType}</p>
                </div>
                <div>
                  <span className="font-medium">Year Built:</span>
                  <p>{selectedProperty.yearBuilt}</p>
                </div>
                <div>
                  <span className="font-medium">Total Sq Ft:</span>
                  <p>{selectedProperty.totalSqFt.toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium">Lot Size:</span>
                  <p>{selectedProperty.lotSizeSqFt.toLocaleString()} sq ft</p>
                </div>
                <div>
                  <span className="font-medium">Zoning:</span>
                  <p>{selectedProperty.zoning}</p>
                </div>
                <div>
                  <span className="font-medium">Neighborhood:</span>
                  <p>{selectedProperty.neighborhood}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Building Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Stories: {selectedProperty.buildingDetails.stories}</span>
                  <span>Quality: {selectedProperty.buildingDetails.quality}</span>
                  <span>Condition: {selectedProperty.buildingDetails.condition}</span>
                  <span>Heating: {selectedProperty.buildingDetails.heatingType}</span>
                  <span>Basement: {selectedProperty.buildingDetails.basement ? 'Yes' : 'No'}</span>
                  <span>Garage: {selectedProperty.buildingDetails.garage ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <Button 
                onClick={handleStartValuation}
                disabled={valuationMutation.isPending}
                className="w-full"
              >
                {valuationMutation.isPending ? 'Analyzing...' : 'Start AI Valuation'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Current Assessed Value</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(selectedProperty.assessedValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Market Value</span>
                  <span className="text-lg">
                    {formatCurrency(selectedProperty.marketValue)}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h4 className="font-medium mb-2">Tax History</h4>
                <div className="space-y-2">
                  {selectedProperty.taxHistory.map((tax) => (
                    <div key={tax.year} className="flex justify-between text-sm">
                      <span>{tax.year}</span>
                      <span>{formatCurrency(tax.assessedValue)}</span>
                      <span>{formatCurrency(tax.taxAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Valuation Results */}
      {valuationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              AI-Powered Valuation Results
            </CardTitle>
            <CardDescription>
              Analysis completed using authentic Benton County data and market trends
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Valuation Result */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Estimated Property Value
              </h3>
              <p className="text-4xl font-bold text-green-600 mb-2">
                {formatCurrency(valuationResult.aiAnalysis.estimatedValue)}
              </p>
              <Badge variant={getConfidenceBadgeVariant(valuationResult.aiAnalysis.confidenceLevel)}>
                {valuationResult.aiAnalysis.confidenceLevel} Confidence
              </Badge>
            </div>

            {/* Market Comparison */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Assessed Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(valuationResult.property.assessedValue)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Market Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(valuationResult.property.marketValue)}
                </p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <p className="text-sm text-gray-600">Price per Sq Ft</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(valuationResult.marketData.pricePerSqFt)}
                </p>
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                AI Analysis Insights
              </h4>
              <div className="space-y-2">
                {valuationResult.aiAnalysis.insights.map((insight, index) => (
                  <Alert key={index}>
                    <AlertDescription>{insight}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold mb-3">Recommendations</h4>
              <div className="space-y-2">
                {valuationResult.aiAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center">
              Analysis completed on {new Date(valuationResult.timestamp).toLocaleString()}
              using authentic Benton County Washington property data
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}