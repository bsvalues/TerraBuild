import React, { useState, useEffect } from 'react';
import { Search, Filter, Map, Building2, Calculator, TrendingUp, Zap, Eye, BarChart3, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

const PropertiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedView, setSelectedView] = useState('list');
  const { toast } = useToast();

  // Fetch properties data
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    enabled: true,
  });

  // Fetch property analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/properties/analytics'],
    enabled: true,
  });

  const handleAIValuation = async (property: any) => {
    toast({
      title: "AI Valuation Started",
      description: `Analyzing property using TerraFusion AI engine`,
    });

    try {
      const response = await fetch('/api/properties/ai-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "AI Valuation Complete",
          description: `Estimated value: ${result.valuation.formattedValue}`,
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Error",
        description: "Unable to complete AI valuation",
        variant: "destructive"
      });
    }
  };

  const handleAnalyzeCosts = (property: any) => {
    toast({
      title: "Cost Analysis Initiated",
      description: `Analyzing replacement costs for ${property.address}`,
    });
    window.location.href = `/calculator?property=${property.id}`;
  };

  const handleValueTrends = (property: any) => {
    toast({
      title: "Value Trend Analysis",
      description: `Loading market trends for ${property.address}`,
    });
    window.location.href = `/trend-analysis?property=${property.id}`;
  };

  const handleViewDetails = (property: any) => {
    toast({
      title: "Property Details",
      description: `Opening detailed view for ${property.address}`,
    });
    window.location.href = `/properties/detail/${property.id}`;
  };

  // Sample property data with enhanced valuation metrics
  const sampleProperties = [
    {
      id: '1',
      address: '1234 Columbia Park Trail, Richland, WA',
      assessedValue: 485000,
      marketValue: 495000,
      aiValuation: 487500,
      confidence: 'High',
      type: 'Residential',
      yearBuilt: 2018,
      sqft: 2200,
      bedrooms: 4,
      bathrooms: 2.5,
      lotSize: 0.25,
      status: 'Active',
      lastSale: '2022-03-15',
      pricePerSqft: 221,
      appreciationRate: 5.2,
      neighborhood: 'Columbia Park',
      zoning: 'R-1',
      taxAssessment: 478000,
      improvements: ['New HVAC', 'Updated Kitchen'],
      condition: 'Excellent'
    },
    {
      id: '2', 
      address: '5678 Gage Boulevard, Kennewick, WA',
      value: '$650,000',
      type: 'Commercial',
      yearBuilt: 2015,
      sqft: 4500,
      status: 'Active'
    },
    {
      id: '3',
      address: '9012 Road 68, Pasco, WA', 
      value: '$395,000',
      type: 'Residential',
      yearBuilt: 2020,
      sqft: 1800,
      status: 'Under Review'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Benton County Washington Properties</h1>
          <p className="text-slate-400 mt-1">Comprehensive property valuation and analysis for Benton County WA</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Map className="h-4 w-4 mr-2" />
            Map View
          </Button>
          <Button size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by address, parcel ID, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Button variant="outline" onClick={() => setFilterOpen(!filterOpen)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid gap-6">
        {sampleProperties.map((property: any) => (
          <Card key={property.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-slate-100">{property.address}</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">{property.type} • Built {property.yearBuilt} • {property.sqft?.toLocaleString()} sq ft</p>
                  {property.neighborhood && (
                    <p className="text-slate-500 text-xs mt-1">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {property.neighborhood} • {property.zoning}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="space-y-2">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">
                        ${property.marketValue?.toLocaleString() || property.value}
                      </p>
                      <p className="text-xs text-slate-400">Market Value</p>
                    </div>
                    {property.aiValuation && (
                      <div>
                        <p className="text-lg font-semibold text-blue-400">
                          ${property.aiValuation.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">AI Valuation</p>
                        <Badge variant="secondary" className={`text-xs ${
                          property.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                          property.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {property.confidence} Confidence
                        </Badge>
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    property.status === 'Active' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {property.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAnalyzeCosts(property)}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Analyze Costs
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleValueTrends(property)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Value Trends
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleViewDetails(property)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PropertiesPage;