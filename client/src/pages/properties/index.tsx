import React, { useState } from 'react';
import { Search, Filter, Map, Building2, Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const PropertiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeCosts = (property: any) => {
    toast({
      title: "Cost Analysis Initiated",
      description: `Analyzing replacement costs for ${property.address}`,
    });
    // Navigate to calculator with property data
    window.location.href = `/calculator?property=${property.id}`;
  };

  const handleValueTrends = (property: any) => {
    toast({
      title: "Value Trend Analysis",
      description: `Loading market trends for ${property.address}`,
    });
    // Navigate to trend analysis
    window.location.href = `/trend-analysis?property=${property.id}`;
  };

  const handleViewDetails = (property: any) => {
    toast({
      title: "Property Details",
      description: `Opening detailed view for ${property.address}`,
    });
    // Navigate to property details
    window.location.href = `/properties/detail/${property.id}`;
  };

  const properties = [
    {
      id: '1',
      address: '1234 Columbia Park Trail, Richland, WA',
      value: '$485,000',
      type: 'Residential',
      yearBuilt: 2018,
      sqft: 2200,
      status: 'Active'
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
        {properties.map((property) => (
          <Card key={property.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-slate-100">{property.address}</CardTitle>
                  <p className="text-slate-400 text-sm mt-1">{property.type} • Built {property.yearBuilt} • {property.sqft.toLocaleString()} sq ft</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">{property.value}</p>
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