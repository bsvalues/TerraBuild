import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, PieChart, LineChart, Building, TrendingUp, MapPin } from 'lucide-react';

// Mock data for demonstration
const valuationData = [
  { month: 'Jan', value: 1450000 },
  { month: 'Feb', value: 1530000 },
  { month: 'Mar', value: 1620000 },
  { month: 'Apr', value: 1680000 },
  { month: 'May', value: 1720000 },
  { month: 'Jun', value: 1830000 },
];

const DashboardsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Dashboards</h1>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-800/50">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-blue-800/50">
            <Building className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="regional" className="data-[state=active]:bg-blue-800/50">
            <MapPin className="h-4 w-4 mr-2" />
            Regional
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-800/50">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Total Properties"
              value="3,246"
              description="Across Benton County"
              trend="+22 this month"
              icon={Building}
              trendUp={true}
            />
            <StatsCard
              title="Average Valuation"
              value="$568,420"
              description="Commercial properties"
              trend="+5.4% from last quarter"
              icon={BarChart3}
              trendUp={true}
            />
            <StatsCard
              title="Assessments Completed"
              value="89%"
              description="Current fiscal year"
              trend="+12% from last year"
              icon={PieChart}
              trendUp={true}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-blue-900/30 border-blue-800/40">
              <CardHeader>
                <CardTitle className="text-blue-100">Valuation Trends</CardTitle>
                <CardDescription className="text-blue-300">
                  Average property valuation over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <DemoChart data={valuationData} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/30 border-blue-800/40">
              <CardHeader>
                <CardTitle className="text-blue-100">Property Distribution</CardTitle>
                <CardDescription className="text-blue-300">
                  By building type and region
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] w-full">
                  <DistributionChart />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Property Analytics</CardTitle>
              <CardDescription className="text-blue-300">
                Detailed view of property statistics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 mb-4">
                This dashboard provides property analytics across Benton County, including valuation trends, assessment status, and distribution by property type.
              </p>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <DataCard title="Residential" value="2,328" subtitle="Properties" />
                <DataCard title="Commercial" value="486" subtitle="Properties" />
                <DataCard title="Industrial" value="124" subtitle="Properties" />
                <DataCard title="Agricultural" value="308" subtitle="Properties" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Regional Distribution</CardTitle>
              <CardDescription className="text-blue-300">
                Property distribution by geographic regions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 mb-4">
                View regional property distribution across Benton County using township/range coordinates, hood codes, and tax code areas.
              </p>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <RegionCard name="Richland" code="52100 100" count="845" growth="+4.2%" />
                <RegionCard name="Kennewick" code="52100 140" count="1,204" growth="+6.8%" />
                <RegionCard name="Prosser" code="52100 320" count="312" growth="+1.5%" />
                <RegionCard name="West Richland" code="52100 240" count="385" growth="+5.2%" />
                <RegionCard name="Benton City" code="52100 180" count="196" growth="+2.3%" />
                <RegionCard name="Rural Areas" code="Various" count="304" growth="+0.9%" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Valuation Trends</CardTitle>
              <CardDescription className="text-blue-300">
                Historical and projected property valuations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-blue-200 mb-4">
                Analyze historical trends and projections for property valuations across different property types and regions.
              </p>
              <div className="h-[300px] w-full">
                <TrendChart />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatsCard = ({ title, value, description, trend, icon: Icon, trendUp }) => {
  return (
    <Card className="bg-blue-900/30 border-blue-800/40">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle className="text-blue-100 text-base">{title}</CardTitle>
          <CardDescription className="text-blue-300">{description}</CardDescription>
        </div>
        <div className="bg-blue-800/40 p-2 rounded-full">
          <Icon className="h-5 w-5 text-blue-200" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-100">{value}</div>
        <div className={`text-xs flex items-center ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
          {trendUp ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
          )}
          {trend}
        </div>
      </CardContent>
    </Card>
  );
};

const DataCard = ({ title, value, subtitle }) => {
  return (
    <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/40">
      <h3 className="text-blue-200 text-lg font-medium">{title}</h3>
      <p className="text-blue-100 text-2xl font-bold">{value}</p>
      <p className="text-blue-300 text-sm">{subtitle}</p>
    </div>
  );
};

const RegionCard = ({ name, code, count, growth }) => {
  return (
    <div className="bg-blue-800/30 p-4 rounded-lg border border-blue-700/40">
      <h3 className="text-blue-200 text-lg font-medium">{name}</h3>
      <div className="flex justify-between items-center mt-2">
        <div>
          <p className="text-blue-300 text-xs">Hood Code</p>
          <p className="text-blue-100 text-sm font-mono">{code}</p>
        </div>
        <div className="text-right">
          <p className="text-blue-100 text-xl font-bold">{count}</p>
          <p className="text-emerald-400 text-xs">{growth}</p>
        </div>
      </div>
    </div>
  );
};

// Placeholder for chart components
const DemoChart = ({ data }) => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex items-end">
        {data.map((item, index) => (
          <div 
            key={index}
            className="flex-1 mx-1"
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end', 
              alignItems: 'center'
            }}
          >
            <div 
              className="w-full bg-gradient-to-t from-blue-600 to-cyan-500 rounded-t-sm"
              style={{ 
                height: `${(item.value / 2000000) * 100}%`,
                minHeight: '20px'
              }}
            ></div>
            <span className="text-xs text-blue-300 mt-1">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const DistributionChart = () => {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span className="text-xs text-blue-300">Residential (64%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></div>
            <span className="text-xs text-blue-300">Commercial (18%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
            <span className="text-xs text-blue-300">Industrial (8%)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
            <span className="text-xs text-blue-300">Agricultural (10%)</span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-blue-500 border-r-cyan-500 border-b-indigo-500 border-l-emerald-500"></div>
            <div className="absolute w-24 h-24 rounded-full bg-blue-900/70"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TrendChart = () => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 border-b border-blue-700/30 flex items-end pb-1">
          <div className="w-full h-[40%] relative">
            <div className="absolute bottom-0 left-0 w-full h-1 border-t border-dashed border-blue-500/50"></div>
            <svg viewBox="0 0 300 100" className="w-full h-full overflow-visible">
              <path d="M0,80 C20,70 40,65 60,60 C80,55 100,50 120,48 C140,46 160,45 180,40 C200,35 220,25 240,20 C260,15 280,10 300,5" 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="2"
                    className="drop-shadow-md" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        <div className="h-6 flex justify-between text-xs text-blue-400 pt-1">
          <span>2020</span>
          <span>2021</span>
          <span>2022</span>
          <span>2023</span>
          <span>2024</span>
          <span>2025</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardsPage;