import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardContent } from '@/components/ui/enterprise-card';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { 
  Database, 
  Building2, 
  DollarSign, 
  MapPin, 
  FileText,
  TrendingUp,
  Calendar,
  CheckCircle
} from 'lucide-react';

// Mock data for Benton County cost factors - in real app this would come from API
const costFactorData = {
  baseRates: {
    'residential_single': 150,
    'residential_multi': 140,
    'commercial_office': 180,
    'commercial_retail': 160,
    'industrial_warehouse': 120,
    'institutional_school': 200
  },
  qualityFactors: {
    'economy': 0.85,
    'standard': 1.0,
    'good': 1.15,
    'excellent': 1.35
  },
  regionFactors: {
    'Benton County': 1.0,
    'Corvallis': 1.05,
    'Philomath': 0.98,
    'Albany': 1.02
  },
  constructionFactors: {
    'frame': 1.0,
    'masonry': 1.2,
    'steel': 1.3,
    'concrete': 1.4
  }
};

export default function CostFactorTablesPage() {
  const [activeTab, setActiveTab] = React.useState('base-rates');

  // In real app, this would fetch from API
  const { data: factors, isLoading } = useQuery({
    queryKey: ['cost-factors'],
    queryFn: () => Promise.resolve(costFactorData),
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Factor Tables"
        description="Comprehensive cost factors and multipliers used for Benton County building cost assessments"
        icon={Database}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cost Analysis" },
          { label: "Cost Factors" }
        ]}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Active Factors"
          value="24"
          description="Currently in use"
          icon={Database}
        />
        <MetricCard
          title="Last Updated"
          value="2024"
          description="Benton County standards"
          icon={Calendar}
        />
        <MetricCard
          title="Base Rate Range"
          value="$120-200"
          unit="per sq ft"
          icon={DollarSign}
        />
        <MetricCard
          title="Regions Covered"
          value="4"
          description="Benton County areas"
          icon={MapPin}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="base-rates" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Base Rates
          </TabsTrigger>
          <TabsTrigger value="quality-factors" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Quality Factors
          </TabsTrigger>
          <TabsTrigger value="regional-factors" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Regional Factors
          </TabsTrigger>
          <TabsTrigger value="construction-factors" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Construction Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="base-rates" className="mt-6">
          <EnterpriseCard>
            <EnterpriseCardHeader icon={Building2}>
              <EnterpriseCardTitle>Base Construction Rates</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Building Type</TableHead>
                    <TableHead>Base Rate ($/sq ft)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Single Family Residential</TableCell>
                    <TableCell>$150.00</TableCell>
                    <TableCell><Badge variant="outline">Residential</Badge></TableCell>
                    <TableCell><Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Multi-Family Residential</TableCell>
                    <TableCell>$140.00</TableCell>
                    <TableCell><Badge variant="outline">Residential</Badge></TableCell>
                    <TableCell><Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Commercial Office</TableCell>
                    <TableCell>$180.00</TableCell>
                    <TableCell><Badge variant="outline">Commercial</Badge></TableCell>
                    <TableCell><Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Commercial Retail</TableCell>
                    <TableCell>$160.00</TableCell>
                    <TableCell><Badge variant="outline">Commercial</Badge></TableCell>
                    <TableCell><Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Industrial Warehouse</TableCell>
                    <TableCell>$120.00</TableCell>
                    <TableCell><Badge>Industrial</Badge></TableCell>
                    <TableCell><Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Educational Facility</TableCell>
                    <TableCell>$200.00</TableCell>
                    <TableCell><Badge variant="outline">Institutional</Badge></TableCell>
                    <TableCell><Badge variant="default" className="bg-emerald-600"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>

        <TabsContent value="quality-factors" className="mt-6">
          <EnterpriseCard>
            <EnterpriseCardHeader icon={TrendingUp}>
              <EnterpriseCardTitle>Construction Quality Multipliers</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quality Class</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Economy</TableCell>
                    <TableCell>0.85</TableCell>
                    <TableCell><Badge variant="destructive">-15%</Badge></TableCell>
                    <TableCell>Basic materials and finishes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Standard</TableCell>
                    <TableCell>1.00</TableCell>
                    <TableCell><Badge variant="outline">Baseline</Badge></TableCell>
                    <TableCell>Standard construction materials</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Good</TableCell>
                    <TableCell>1.15</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+15%</Badge></TableCell>
                    <TableCell>Above-average materials and finishes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Excellent</TableCell>
                    <TableCell>1.35</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+35%</Badge></TableCell>
                    <TableCell>Premium materials and custom finishes</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>

        <TabsContent value="regional-factors" className="mt-6">
          <EnterpriseCard>
            <EnterpriseCardHeader icon={MapPin}>
              <EnterpriseCardTitle>Regional Cost Adjustments</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Factor</TableHead>
                    <TableHead>Adjustment</TableHead>
                    <TableHead>Market Conditions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Benton County (Base)</TableCell>
                    <TableCell>1.00</TableCell>
                    <TableCell><Badge variant="outline">Baseline</Badge></TableCell>
                    <TableCell>Standard market rates</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Corvallis</TableCell>
                    <TableCell>1.05</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+5%</Badge></TableCell>
                    <TableCell>Higher demand, university town</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Albany</TableCell>
                    <TableCell>1.02</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+2%</Badge></TableCell>
                    <TableCell>Slightly elevated costs</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Philomath</TableCell>
                    <TableCell>0.98</TableCell>
                    <TableCell><Badge variant="destructive">-2%</Badge></TableCell>
                    <TableCell>Lower cost area</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>

        <TabsContent value="construction-factors" className="mt-6">
          <EnterpriseCard>
            <EnterpriseCardHeader icon={FileText}>
              <EnterpriseCardTitle>Construction Type Multipliers</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Construction Type</TableHead>
                    <TableHead>Multiplier</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Typical Use</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Wood Frame</TableCell>
                    <TableCell>1.00</TableCell>
                    <TableCell><Badge variant="outline">Baseline</Badge></TableCell>
                    <TableCell>Most residential construction</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Masonry</TableCell>
                    <TableCell>1.20</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+20%</Badge></TableCell>
                    <TableCell>Commercial buildings, fire resistance</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Steel Frame</TableCell>
                    <TableCell>1.30</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+30%</Badge></TableCell>
                    <TableCell>Large commercial, industrial</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Concrete</TableCell>
                    <TableCell>1.40</TableCell>
                    <TableCell><Badge variant="default" className="bg-amber-600">+40%</Badge></TableCell>
                    <TableCell>High-rise, institutional buildings</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}