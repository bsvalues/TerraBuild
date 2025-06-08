import React, { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const TrendAnalysisPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('12-months');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const trends = [
    {
      category: 'Residential',
      period: '12 months',
      change: 8.5,
      direction: 'up',
      avgValue: '$485,000',
      volume: 1247,
      forecast: 'Continued growth expected'
    },
    {
      category: 'Commercial',
      period: '12 months',
      change: 12.3,
      direction: 'up',
      avgValue: '$1,250,000',
      volume: 348,
      forecast: 'Strong upward trend'
    },
    {
      category: 'Industrial',
      period: '12 months',
      change: -2.1,
      direction: 'down',
      avgValue: '$875,000',
      volume: 89,
      forecast: 'Market stabilizing'
    },
    {
      category: 'Agricultural',
      period: '12 months',
      change: 4.7,
      direction: 'up',
      avgValue: '$325,000',
      volume: 156,
      forecast: 'Moderate growth'
    }
  ];

  const regionalTrends = [
    { region: 'Corvallis', change: 9.2, avgValue: '$495,000', volume: 847 },
    { region: 'Philomath', change: 6.8, avgValue: '$425,000', volume: 289 },
    { region: 'Monroe', change: 11.5, avgValue: '$385,000', volume: 134 },
    { region: 'Alsea', change: 3.9, avgValue: '$325,000', volume: 67 }
  ];

  const costFactorTrends = [
    { factor: 'Foundation Costs', change: 15.2, impact: 'High' },
    { factor: 'Roofing Materials', change: 22.8, impact: 'High' },
    { factor: 'HVAC Systems', change: 8.9, impact: 'Medium' },
    { factor: 'Electrical Work', change: 12.4, impact: 'Medium' },
    { factor: 'Plumbing', change: 6.7, impact: 'Low' },
    { factor: 'Interior Finishes', change: 4.3, impact: 'Low' }
  ];

  const keyMetrics = [
    { label: 'Overall Market Growth', value: '+8.5%', trend: 'up', desc: 'YoY change' },
    { label: 'Properties Analyzed', value: '1,840', trend: 'up', desc: 'Last 12 months' },
    { label: 'Avg Days on Market', value: '32 days', trend: 'down', desc: '15% faster' },
    { label: 'Price Volatility', value: 'Low', trend: 'stable', desc: '±3.2% variance' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Trend Analysis</h1>
          <p className="text-slate-400 mt-1">Market trends and property value forecasting</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Period
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Forecast
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {keyMetrics.map((metric, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-8 w-8 text-emerald-400" />
                ) : metric.trend === 'down' ? (
                  <TrendingDown className="h-8 w-8 text-red-400" />
                ) : (
                  <BarChart3 className="h-8 w-8 text-sky-400" />
                )}
                <div>
                  <div className="text-2xl font-bold text-slate-100">{metric.value}</div>
                  <div className="text-sm text-slate-400">{metric.label}</div>
                  <div className="text-xs text-slate-500">{metric.desc}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3-months">Last 3 Months</SelectItem>
            <SelectItem value="6-months">Last 6 Months</SelectItem>
            <SelectItem value="12-months">Last 12 Months</SelectItem>
            <SelectItem value="24-months">Last 24 Months</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Property category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="residential">Residential</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
            <SelectItem value="industrial">Industrial</SelectItem>
            <SelectItem value="agricultural">Agricultural</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Property Type Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    {trend.direction === 'up' ? (
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-400" />
                    )}
                    <div>
                      <div className="font-medium text-slate-100">{trend.category}</div>
                      <div className="text-sm text-slate-400">
                        {trend.volume} properties • Avg: {trend.avgValue}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {trend.direction === 'up' ? '+' : ''}{trend.change}%
                    </div>
                    <div className="text-xs text-slate-400">{trend.period}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Regional Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regionalTrends.map((region, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div>
                    <div className="font-medium text-slate-100">{region.region}</div>
                    <div className="text-sm text-slate-400">
                      {region.volume} sales • Avg: {region.avgValue}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">+{region.change}%</div>
                    </div>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Construction Cost Factor Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costFactorTrends.map((factor, index) => (
              <div key={index} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-slate-100">{factor.factor}</div>
                  <Badge 
                    variant="outline" 
                    className={
                      factor.impact === 'High' ? 'border-red-500/30 text-red-400' :
                      factor.impact === 'Medium' ? 'border-yellow-500/30 text-yellow-400' :
                      'border-emerald-500/30 text-emerald-400'
                    }
                  >
                    {factor.impact}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">+{factor.change}%</span>
                  <span className="text-slate-400 text-sm">YoY</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Market Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="text-sm font-medium text-emerald-400 mb-1">Strong Growth</div>
                <div className="text-xs text-slate-300">
                  Residential market showing sustained 8.5% growth with low inventory driving prices.
                </div>
              </div>
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-lg">
                <div className="text-sm font-medium text-sky-400 mb-1">Regional Variation</div>
                <div className="text-xs text-slate-300">
                  Monroe leading with 11.5% growth, while Alsea shows more moderate gains at 3.9%.
                </div>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="text-sm font-medium text-yellow-400 mb-1">Cost Pressure</div>
                <div className="text-xs text-slate-300">
                  Material costs rising 15-23% creating upward pressure on replacement values.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">6-Month Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Residential</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">+6-8%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Commercial</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">+8-12%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Industrial</span>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400 font-medium">Stable</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Construction Costs</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">+10-15%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrendAnalysisPage;