import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import MainLayout from '@/components/layout/MainLayout';
import PageHeader from '@/components/layout/PageHeader';
import DataCard from '@/components/ui/data-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataFlowVisualizer } from '@/contexts/DataFlowContext';
import { 
  RefreshCw, 
  FileBarChart, 
  UserIcon, 
  Building,
  BarChart4,
  ListFilter,
  TrendingUp,
  PieChart,
  Factory,
  Camera,
  ArrowUpRight,
  Calendar,
  BarChart,
  ChevronRight
} from 'lucide-react';

// Import chart components
import LineChartComponent from '@/components/charts/LineChartComponent';
import BarChartComponent from '@/components/charts/BarChartComponent';
import PieChartComponent from '@/components/charts/PieChartComponent';
import RadarChartComponent from '@/components/charts/RadarChartComponent';

export default function DashboardPage() {
  // Reference to the dashboard content for screenshot functionality
  const dashboardContentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Query to check OpenAI API key status
  const { data: apiKeyStatus } = useQuery({
    queryKey: ['/api/settings/OPENAI_API_KEY_STATUS'],
    staleTime: 60000, // 1 minute
  });

  // Check if OpenAI API key is configured
  const isApiKeyConfigured = apiKeyStatus && 
    typeof apiKeyStatus === 'object' && 
    'value' in apiKeyStatus && 
    apiKeyStatus.value === 'configured';
    
  // Chart data - type definitions
  interface RegionChartData {
    name: string;
    value: number;
    [key: string]: any;
  }
  
  interface BuildingTypeData {
    name: string;
    residential: number;
    commercial: number;
    [key: string]: any;
  }
  
  interface YearlyTrendData {
    name: string;
    residential: number;
    commercial: number;
    agricultural: number;
    [key: string]: any;
  }
  
  interface ValuationFactorData {
    subject: string;
    value: number;
    benchmark: number;
    [key: string]: any;
  }
  
  // Sample data for charts
  const regionalData: RegionChartData[] = [
    { name: 'West Benton', value: 38 },
    { name: 'Central Benton', value: 42 },
    { name: 'East Benton', value: 20 }
  ];
  
  const buildingTypeData: BuildingTypeData[] = [
    { name: 'R1', residential: 125, commercial: 0 },
    { name: 'R2', residential: 145, commercial: 0 },
    { name: 'R3', residential: 165, commercial: 0 },
    { name: 'C1', residential: 0, commercial: 180 },
    { name: 'C2', residential: 0, commercial: 210 },
    { name: 'C3', residential: 0, commercial: 240 }
  ];
  
  const trendData: YearlyTrendData[] = [
    { name: '2020', residential: 120, commercial: 170, agricultural: 85 },
    { name: '2021', residential: 132, commercial: 175, agricultural: 90 },
    { name: '2022', residential: 141, commercial: 190, agricultural: 95 },
    { name: '2023', residential: 154, commercial: 210, agricultural: 100 },
    { name: '2024', residential: 162, commercial: 215, agricultural: 110 },
    { name: '2025', residential: 178, commercial: 225, agricultural: 120 }
  ];
  
  const valuationFactors: ValuationFactorData[] = [
    { subject: 'Location', value: 85, benchmark: 75 },
    { subject: 'Quality', value: 90, benchmark: 65 },
    { subject: 'Condition', value: 75, benchmark: 70 },
    { subject: 'Size', value: 85, benchmark: 80 }, 
    { subject: 'Age', value: 65, benchmark: 60 },
    { subject: 'Features', value: 78, benchmark: 70 }
  ];

  const stats = [
    { 
      title: 'Total Building Types', 
      value: 12, 
      change: '+2', 
      changeType: 'positive',
      icon: <Building className="h-5 w-5" />
    },
    { 
      title: 'Regions', 
      value: 8, 
      change: '+1', 
      changeType: 'positive',
      icon: <Factory className="h-5 w-5" />
    },
    { 
      title: 'Cost Matrices', 
      value: 32, 
      change: '+5', 
      changeType: 'positive',
      icon: <BarChart4 className="h-5 w-5" />
    },
    { 
      title: 'Active Users', 
      value: 18, 
      change: '+3', 
      changeType: 'positive',
      icon: <UserIcon className="h-5 w-5" />
    },
  ];

  // Header actions
  const headerActions = [
    {
      label: "Refresh Data",
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "outline" as const,
      onClick: () => console.log("Refreshing data..."),
      tooltipText: "Refresh all dashboard data"
    },
    {
      label: "Screenshot",
      icon: <Camera className="h-4 w-4" />,
      variant: "default" as const,
      onClick: () => console.log("Taking screenshot..."),
      tooltipText: "Take a screenshot of the dashboard"
    }
  ];

  return (
    <MainLayout loading={loading}>
      <div>
        <PageHeader
          title="TerraBuild Analytics Dashboard"
          description="Interactive visualizations for building cost analysis and assessment"
          actions={headerActions}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" }
          ]}
          helpText="This dashboard provides an overview of your building cost data and analytics. Use the tabs to navigate between different views."
        />

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <DataCard
                  key={index}
                  title={stat.title}
                  icon={stat.icon}
                  iconColor={
                    index === 0 ? "bg-blue-50 text-blue-500" :
                    index === 1 ? "bg-green-50 text-green-500" :
                    index === 2 ? "bg-purple-50 text-purple-500" :
                    "bg-amber-50 text-amber-500"
                  }
                >
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className={`text-xs ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'} flex items-center`}>
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {stat.change} from last period
                    </div>
                  </div>
                </DataCard>
              ))}
            </div>
            
            {/* Chart Cards Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <BarChart className="h-5 w-5 text-blue-500 mr-2" />
                    Building Cost Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <LineChartComponent 
                      data={trendData}
                      xAxisKey="name"
                      yAxisKey="residential" 
                      lines={[
                        { dataKey: "residential", name: "Residential", color: "#3482F6" },
                        { dataKey: "commercial", name: "Commercial", color: "#10B981" },
                        { dataKey: "agricultural", name: "Agricultural", color: "#8B5CF6" }
                      ]}
                      title="Building Cost Trends Over Time"
                      toolTipTitle="Yearly Average Costs"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <BarChart4 className="h-5 w-5 text-green-500 mr-2" />
                    Regional Cost Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <BarChartComponent 
                      data={buildingTypeData}
                      xAxisKey="name"
                      bars={[
                        { dataKey: "residential", name: "Residential", color: "#3482F6" },
                        { dataKey: "commercial", name: "Commercial", color: "#10B981" }
                      ]}
                      title="Building Type Cost Comparison"
                      toolTipTitle="Cost Per Square Foot ($)"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Chart Cards Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <PieChart className="h-5 w-5 text-purple-500 mr-2" />
                    Building Type Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <PieChartComponent 
                      data={regionalData}
                      nameKey="name"
                      dataKey="value"
                      colors={["#3482F6", "#10B981", "#8B5CF6"]} 
                      title="Regional Cost Distribution"
                      tooltipLabel="Regional Share"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium flex items-center">
                    <TrendingUp className="h-5 w-5 text-amber-500 mr-2" />
                    Cost Prediction Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {isApiKeyConfigured ? (
                      <RadarChartComponent 
                        data={valuationFactors}
                        dataKeyPrimary="value"
                        dataKeySecondary="benchmark"
                        nameKey="subject"
                        title="Valuation Factor Analysis"
                        primaryTitle="Property"
                        secondaryTitle="Benchmark"
                        primaryColor="#3482F6"
                        secondaryColor="#8B5CF6"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-50 rounded">
                        <div className="text-gray-400">
                          API key required for AI-powered insights
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Flow Debug Visualizer */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <FileBarChart className="h-5 w-5 text-blue-500 mr-2" />
                  Data Flow Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataFlowVisualizer show={true} showHistory={true} showActivity={true} />
              </CardContent>
            </Card>

            {/* Quick Access Tools */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-medium flex items-center">
                  <FileBarChart className="h-5 w-5 text-blue-500 mr-2" />
                  Quick Access Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href="/filters">
                    <div className="border rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <ListFilter className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-medium">Advanced Filters</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Fine-tune your cost analysis with advanced filtering options
                      </p>
                    </div>
                  </Link>
                  
                  <Link href="/trends">
                    <div className="border rounded-lg p-4 hover:bg-green-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <h3 className="font-medium">Trend Analysis</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Discover long-term cost trends and seasonal variations
                      </p>
                    </div>
                  </Link>
                  
                  <Link href="/cost-breakdown">
                    <div className="border rounded-lg p-4 hover:bg-purple-50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <PieChart className="h-5 w-5 text-purple-600" />
                        </div>
                        <h3 className="font-medium">Cost Breakdown</h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Detailed breakdown of costs by materials, labor, and other factors
                      </p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Q2 Cost Analysis Report</h3>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" /> Generated on April 15, 2025
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#29B7D3]">
                        View Report <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Annual Building Type Comparative Study</h3>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" /> Generated on March 28, 2025
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#29B7D3]">
                        View Report <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-b pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Regional Material Cost Variance Analysis</h3>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" /> Generated on February 12, 2025
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[#29B7D3]">
                        View Report <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Button className="h-auto py-6 text-left flex justify-start items-start">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Predictive Cost Analysis</h3>
                      <p className="text-sm opacity-90">
                        Forecast future building costs using AI-powered trend analysis
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-6 text-left flex justify-start items-start">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Statistical Comparison Tools</h3>
                      <p className="text-sm opacity-90">
                        Compare costs across different building types and regions
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-6 text-left flex justify-start items-start">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Historical Data Analysis</h3>
                      <p className="text-sm opacity-90">
                        Analyze long-term cost trends and historical patterns
                      </p>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-6 text-left flex justify-start items-start">
                    <div>
                      <h3 className="font-medium text-lg mb-2">Custom Data Queries</h3>
                      <p className="text-sm opacity-90">
                        Build custom queries to extract specific insights from your data
                      </p>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}