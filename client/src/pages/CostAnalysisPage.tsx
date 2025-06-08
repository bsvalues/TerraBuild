import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardContent } from '@/components/ui/enterprise-card';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Target,
  MapPin,
  Calculator,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Sample cost analysis data - replace with real API calls
const costAnalysisData = {
  summary: {
    avgCostPerSqFt: 165,
    totalProjects: 1247,
    avgProjectSize: 2850,
    costTrend: 'up',
    trendValue: 8.5
  },
  regionAnalysis: [
    { region: 'Benton County', avgCost: 165, projects: 450, trend: 'stable' },
    { region: 'Corvallis', avgCost: 173, projects: 380, trend: 'up' },
    { region: 'Albany', avgCost: 168, projects: 285, trend: 'up' },
    { region: 'Philomath', avgCost: 162, projects: 132, trend: 'down' }
  ],
  buildingTypeAnalysis: [
    { type: 'Single Family Residential', avgCost: 150, count: 485, marketShare: 38.9 },
    { type: 'Commercial Office', avgCost: 180, count: 245, marketShare: 19.6 },
    { type: 'Commercial Retail', avgCost: 160, count: 198, marketShare: 15.9 },
    { type: 'Multi-Family Residential', avgCost: 140, count: 156, marketShare: 12.5 },
    { type: 'Industrial Warehouse', avgCost: 120, count: 98, marketShare: 7.9 },
    { type: 'Educational Facility', avgCost: 200, count: 65, marketShare: 5.2 }
  ],
  costDistribution: {
    foundation: 15,
    framing: 25,
    roofing: 10,
    exterior: 15,
    interior: 20,
    mechanical: 15
  }
};

export default function CostAnalysisPage() {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('12months');

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['cost-analysis', selectedRegion, selectedTimeframe],
    queryFn: () => Promise.resolve(costAnalysisData),
    staleTime: 1000 * 60 * 5
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Analysis Dashboard"
        description="Comprehensive analysis of building costs across Benton County regions and property types"
        icon={BarChart3}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cost Analysis" }
        ]}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Average Cost/Sq Ft"
          value={`$${analysisData?.summary.avgCostPerSqFt || 165}`}
          trend={analysisData?.summary.costTrend as any}
          trendValue={`+${analysisData?.summary.trendValue || 8.5}%`}
          icon={DollarSign}
          description="Last 12 months"
        />
        <MetricCard
          title="Total Projects"
          value={analysisData?.summary.totalProjects?.toLocaleString() || "1,247"}
          trend="up"
          trendValue="+12%"
          icon={Building2}
          description="All time"
        />
        <MetricCard
          title="Avg Project Size"
          value={`${analysisData?.summary.avgProjectSize?.toLocaleString() || "2,850"}`}
          unit="sq ft"
          icon={Target}
          description="Typical project"
        />
        <MetricCard
          title="Cost Accuracy"
          value="98.5%"
          trend="up"
          trendValue="+0.3%"
          icon={TrendingUp}
          description="Prediction accuracy"
        />
      </div>

      {/* Analysis Controls */}
      <EnterpriseCard>
        <EnterpriseCardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="benton-county">Benton County</SelectItem>
                  <SelectItem value="corvallis">Corvallis</SelectItem>
                  <SelectItem value="albany">Albany</SelectItem>
                  <SelectItem value="philomath">Philomath</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                  <SelectItem value="24months">Last 24 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="bg-sky-600 hover:bg-sky-700 mt-6">
              <Calculator className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </EnterpriseCardContent>
      </EnterpriseCard>

      <Tabs defaultValue="regional" className="w-full">
        <TabsList className="bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regional Analysis
          </TabsTrigger>
          <TabsTrigger value="building-types" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Building Types
          </TabsTrigger>
          <TabsTrigger value="cost-breakdown" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Cost Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regional" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnterpriseCard>
              <EnterpriseCardHeader icon={MapPin}>
                <EnterpriseCardTitle>Regional Cost Comparison</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-4">
                  {analysisData?.regionAnalysis.map((region, index) => (
                    <div key={region.region} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-200">{region.region}</h4>
                        <p className="text-sm text-slate-400">{region.projects} projects</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-slate-200">${region.avgCost}/sq ft</p>
                        <div className="flex items-center gap-1">
                          {region.trend === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                          ) : region.trend === 'down' ? (
                            <ArrowDownRight className="h-4 w-4 text-red-400" />
                          ) : (
                            <div className="w-4 h-4" />
                          )}
                          <span className={`text-xs ${
                            region.trend === 'up' ? 'text-emerald-400' : 
                            region.trend === 'down' ? 'text-red-400' : 
                            'text-slate-400'
                          }`}>
                            {region.trend === 'stable' ? 'Stable' : region.trend === 'up' ? 'Rising' : 'Declining'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>

            <EnterpriseCard>
              <EnterpriseCardHeader icon={TrendingUp}>
                <EnterpriseCardTitle>Cost Trends</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-6">
                  <div className="text-center p-6 bg-sky-500/10 rounded-lg border border-sky-500/20">
                    <p className="text-2xl font-bold text-sky-400">+8.5%</p>
                    <p className="text-slate-400">Average cost increase</p>
                    <p className="text-xs text-slate-500 mt-1">vs. previous year</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Material Costs</span>
                      <span className="text-amber-400">+12.3%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Labor Costs</span>
                      <span className="text-amber-400">+6.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Permit Fees</span>
                      <span className="text-emerald-400">+2.1%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Equipment</span>
                      <span className="text-amber-400">+4.5%</span>
                    </div>
                  </div>
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>
          </div>
        </TabsContent>

        <TabsContent value="building-types" className="mt-6">
          <EnterpriseCard>
            <EnterpriseCardHeader icon={Building2}>
              <EnterpriseCardTitle>Building Type Analysis</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {analysisData?.buildingTypeAnalysis.map((type, index) => (
                  <div key={type.type} className="p-4 bg-slate-800/30 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-slate-200 text-sm">{type.type}</h4>
                      <span className="text-xs text-slate-400">{type.marketShare}%</span>
                    </div>
                    <p className="text-xl font-bold text-sky-400">${type.avgCost}/sq ft</p>
                    <p className="text-sm text-slate-400">{type.count} projects</p>
                    <div className="mt-2 bg-slate-700/50 rounded-full h-2">
                      <div 
                        className="bg-sky-500 h-2 rounded-full" 
                        style={{ width: `${type.marketShare * 2.5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>

        <TabsContent value="cost-breakdown" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EnterpriseCard>
              <EnterpriseCardHeader icon={PieChart}>
                <EnterpriseCardTitle>Average Cost Distribution</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-4">
                  {Object.entries(analysisData?.costDistribution || {}).map(([category, percentage]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400 capitalize">{category}</span>
                        <span className="text-slate-300">{percentage}%</span>
                      </div>
                      <div className="bg-slate-700/50 rounded-full h-2">
                        <div 
                          className="bg-sky-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>

            <EnterpriseCard>
              <EnterpriseCardHeader icon={Calculator}>
                <EnterpriseCardTitle>Cost Analysis Summary</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <h4 className="font-medium text-emerald-400 mb-2">Most Cost-Effective</h4>
                    <p className="text-slate-300">Industrial Warehouse</p>
                    <p className="text-sm text-slate-400">$120/sq ft average</p>
                  </div>
                  
                  <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <h4 className="font-medium text-amber-400 mb-2">Highest Premium</h4>
                    <p className="text-slate-300">Educational Facilities</p>
                    <p className="text-sm text-slate-400">$200/sq ft average</p>
                  </div>
                  
                  <div className="p-4 bg-sky-500/10 rounded-lg border border-sky-500/20">
                    <h4 className="font-medium text-sky-400 mb-2">Most Popular</h4>
                    <p className="text-slate-300">Single Family Residential</p>
                    <p className="text-sm text-slate-400">38.9% of all projects</p>
                  </div>
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}