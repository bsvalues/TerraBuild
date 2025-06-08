import React, { useState } from 'react';
import { Database, Edit, Plus, Download, Upload, Search, Filter, Brain, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const CostFactorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const costFactors = [
    {
      id: 1,
      category: 'Foundation',
      factor: 'Concrete Slab',
      baseRate: 8.50,
      qualityMultiplier: 1.2,
      region: 'Benton County',
      lastUpdated: '2025-06-01',
      status: 'active'
    },
    {
      id: 2,
      category: 'Foundation',
      factor: 'Full Basement',
      baseRate: 45.75,
      qualityMultiplier: 1.8,
      region: 'Benton County',
      lastUpdated: '2025-06-01',
      status: 'active'
    },
    {
      id: 3,
      category: 'Roofing',
      factor: 'Asphalt Shingle',
      baseRate: 12.25,
      qualityMultiplier: 1.0,
      region: 'Benton County',
      lastUpdated: '2025-05-15',
      status: 'active'
    },
    {
      id: 4,
      category: 'Roofing',
      factor: 'Metal Roofing',
      baseRate: 18.50,
      qualityMultiplier: 1.4,
      region: 'Benton County',
      lastUpdated: '2025-05-15',
      status: 'active'
    },
    {
      id: 5,
      category: 'Exterior',
      factor: 'Vinyl Siding',
      baseRate: 6.75,
      qualityMultiplier: 1.1,
      region: 'Benton County',
      lastUpdated: '2025-05-20',
      status: 'active'
    },
    {
      id: 6,
      category: 'Exterior',
      factor: 'Brick Veneer',
      baseRate: 14.25,
      qualityMultiplier: 1.6,
      region: 'Benton County',
      lastUpdated: '2025-05-20',
      status: 'active'
    },
    {
      id: 7,
      category: 'HVAC',
      factor: 'Central Air/Heat',
      baseRate: 25.00,
      qualityMultiplier: 1.3,
      region: 'Benton County',
      lastUpdated: '2025-06-01',
      status: 'active'
    },
    {
      id: 8,
      category: 'HVAC',
      factor: 'Heat Pump System',
      baseRate: 28.75,
      qualityMultiplier: 1.5,
      region: 'Benton County',
      lastUpdated: '2025-06-01',
      status: 'active'
    }
  ];

  const categories = [
    'All Categories',
    'Foundation',
    'Roofing',
    'Exterior',
    'HVAC',
    'Plumbing',
    'Electrical',
    'Interior'
  ];

  const filteredFactors = costFactors.filter(factor => {
    const matchesSearch = factor.factor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factor.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           factor.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Cost Factor Tables</h1>
          <p className="text-slate-400 mt-1">Manage building cost factors and regional adjustments</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('Running AI analysis on cost factors...')}
            className="hover:bg-slate-700 hover:border-slate-600"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Analysis
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('Generating cost trend forecast...')}
            className="hover:bg-slate-700 hover:border-slate-600"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trend Forecast
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => console.log('Exporting cost factor data...')}
            className="hover:bg-slate-700 hover:border-slate-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Button 
            size="sm"
            onClick={() => console.log('Generating new cost factors using AI...')}
            className="hover:bg-slate-600"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Factors
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-sky-400" />
              <div>
                <div className="text-2xl font-bold text-slate-100">{costFactors.length}</div>
                <div className="text-sm text-slate-400">Total Factors</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">8</div>
                <div className="text-sm text-slate-400">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">0</div>
                <div className="text-sm text-slate-400">Pending Review</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-slate-500/20 rounded-lg flex items-center justify-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-100">Jun 1</div>
                <div className="text-sm text-slate-400">Last Update</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search cost factors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => {
            const categoryValue = category === 'All Categories' ? 'all' : category.toLowerCase();
            return (
              <Button
                key={category}
                variant={selectedCategory === categoryValue ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(categoryValue)}
              >
                {category}
              </Button>
            );
          })}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => console.log('Opening advanced filter options...')}
          className="hover:bg-slate-700 hover:border-slate-600"
        >
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Cost Factor Database</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Category</TableHead>
                <TableHead className="text-slate-300">Factor</TableHead>
                <TableHead className="text-slate-300">Base Rate ($/sq ft)</TableHead>
                <TableHead className="text-slate-300">Quality Multiplier</TableHead>
                <TableHead className="text-slate-300">Region</TableHead>
                <TableHead className="text-slate-300">Last Updated</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFactors.map((factor) => (
                <TableRow key={factor.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell>
                    <Badge variant="outline" className="border-sky-500/30 text-sky-400">
                      {factor.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-100 font-medium">{factor.factor}</TableCell>
                  <TableCell className="text-slate-300">${factor.baseRate.toFixed(2)}</TableCell>
                  <TableCell className="text-slate-300">{factor.qualityMultiplier}x</TableCell>
                  <TableCell className="text-slate-300">{factor.region}</TableCell>
                  <TableCell className="text-slate-300">{factor.lastUpdated}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={factor.status === 'active' 
                        ? 'border-emerald-500/30 text-emerald-400' 
                        : 'border-yellow-500/30 text-yellow-400'}
                    >
                      {factor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => console.log('Edit factor:', factor.factor)}
                        className="hover:bg-slate-700 hover:border-slate-600"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => console.log('Analyze factor:', factor.factor)}
                        className="hover:bg-slate-700 hover:border-slate-600"
                      >
                        <Brain className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Regional Adjustments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Urban Areas</span>
                <span className="text-slate-100 font-medium">+15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Rural Areas</span>
                <span className="text-slate-100 font-medium">-8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Coastal Zones</span>
                <span className="text-slate-100 font-medium">+22%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Quality Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Economy</span>
                <span className="text-slate-100 font-medium">0.8x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Standard</span>
                <span className="text-slate-100 font-medium">1.0x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Above Average</span>
                <span className="text-slate-100 font-medium">1.3x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Custom</span>
                <span className="text-slate-100 font-medium">1.8x</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">AI Analysis Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Regional Market Analysis</span>
                <span className="text-emerald-400 text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Cost Trend Prediction</span>
                <span className="text-emerald-400 text-xs">Running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Historical Data Mining</span>
                <span className="text-sky-400 text-xs">Processing</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Local Contractor Data</span>
                <span className="text-yellow-400 text-xs">Verified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostFactorsPage;