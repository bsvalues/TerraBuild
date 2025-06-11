import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Building2, MapPin, TrendingUp, Eye, Edit } from 'lucide-react';

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  // Enhanced sample properties with AI valuation data
  const sampleProperties = [
    {
      id: 1,
      address: "1234 Columbia Park Trail, Richland, WA 99352",
      type: "Single Family",
      yearBuilt: 2019,
      sqft: 2350,
      marketValue: 495000,
      value: "$495,000",
      status: "Active",
      neighborhood: "Columbia Park",
      zoning: "R-1",
      aiValuation: 512000,
      confidence: "High",
      condition: "Excellent",
      lastUpdated: "2025-01-15"
    },
    {
      id: 2,
      address: "5678 Badger Mountain Loop, Richland, WA 99354",
      type: "Single Family",
      yearBuilt: 2021,
      sqft: 2800,
      marketValue: 675000,
      value: "$675,000",
      status: "Active",
      neighborhood: "Badger Mountain",
      zoning: "R-1",
      aiValuation: 698000,
      confidence: "High",
      condition: "Excellent",
      lastUpdated: "2025-01-14"
    },
    {
      id: 3,
      address: "9012 Desert Hills Dr, West Richland, WA 99353",
      type: "Single Family",
      yearBuilt: 2015,
      sqft: 2100,
      marketValue: 425000,
      value: "$425,000",
      status: "Pending",
      neighborhood: "Desert Hills",
      zoning: "R-1",
      aiValuation: 435000,
      confidence: "Medium",
      condition: "Good",
      lastUpdated: "2025-01-13"
    },
    {
      id: 4,
      address: "3456 Southridge Blvd, Kennewick, WA 99337",
      type: "Single Family",
      yearBuilt: 2020,
      sqft: 2650,
      marketValue: 585000,
      value: "$585,000",
      status: "Active",
      neighborhood: "Southridge",
      zoning: "R-1",
      aiValuation: 605000,
      confidence: "High",
      condition: "Very Good",
      lastUpdated: "2025-01-12"
    }
  ];

  const filteredProperties = sampleProperties.filter(property =>
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Property Management</h1>
            <p className="text-slate-400 mt-2">AI-powered property valuation and analysis platform</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button size="sm">
              <Building2 className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
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

        {/* Property Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Total Properties</p>
                  <p className="text-2xl font-bold text-slate-100">{sampleProperties.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Avg Market Value</p>
                  <p className="text-2xl font-bold text-slate-100">
                    ${Math.round(sampleProperties.reduce((sum, p) => sum + p.marketValue, 0) / sampleProperties.length).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">AI Accuracy</p>
                  <p className="text-2xl font-bold text-slate-100">94.2%</p>
                </div>
                <Eye className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">High Confidence</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {sampleProperties.filter(p => p.confidence === 'High').length}
                  </p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <div className="grid gap-6">
          {filteredProperties.map((property) => (
            <Card key={property.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-slate-100">{property.address}</CardTitle>
                    <p className="text-slate-400 text-sm mt-1">
                      {property.type} • Built {property.yearBuilt} • {property.sqft?.toLocaleString()} sq ft
                    </p>
                    {property.neighborhood && (
                      <p className="text-slate-500 text-xs mt-1">
                        <MapPin className="inline h-3 w-3 mr-1" />
                        {property.neighborhood} • {property.zoning}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right space-y-3">
                    {/* Market Value */}
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">
                        ${property.marketValue?.toLocaleString() || property.value}
                      </p>
                      <p className="text-xs text-slate-400">Market Value</p>
                    </div>
                    
                    {/* AI Valuation */}
                    {property.aiValuation && (
                      <div>
                        <p className="text-lg font-semibold text-blue-400">
                          ${property.aiValuation.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">AI Valuation</p>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                          property.confidence === 'High' ? 'bg-green-500/20 text-green-400' :
                          property.confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {property.confidence} Confidence
                        </div>
                      </div>
                    )}
                    
                    {/* Status */}
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'Active' 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {property.status}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>Condition: {property.condition}</span>
                    <span>•</span>
                    <span>Updated: {property.lastUpdated}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insights Panel */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">AI Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Market Trends</h4>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>• Property values up 5.2% YoY</li>
                  <li>• Badger Mountain showing highest growth</li>
                  <li>• Inventory levels below seasonal average</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Valuation Accuracy</h4>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>• High confidence: 3 properties</li>
                  <li>• Medium confidence: 1 property</li>
                  <li>• Avg accuracy: 94.2%</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Recommendations</h4>
                <ul className="space-y-1 text-sm text-slate-400">
                  <li>• Update older property assessments</li>
                  <li>• Review market comps for accuracy</li>
                  <li>• Schedule property condition updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}