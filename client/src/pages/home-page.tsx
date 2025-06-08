import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart, 
  Building, 
  Calculator, 
  FileBarChart, 
  Grid3X3, 
  ImageDown, 
  Layers, 
  Map, 
  Upload,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TerraFusionLogo from '@/components/TerraFusionLogo';

const HomePage = () => {
  const { user } = useAuth();

  const quickAccessItems = [
    {
      icon: Calculator,
      title: "Cost Estimation Wizard",
      description: "Calculate building costs with Benton County data",
      path: "/cost-wizard"
    },
    {
      icon: Map,
      title: "Valuation Maps",
      description: "View property value distributions",
      path: "/maps"
    },
    {
      icon: Building,
      title: "Property Search",
      description: "Find and manage properties",
      path: "/properties"
    },
    {
      icon: Layers,
      title: "Matrix Explorer",
      description: "Explore cost matrix data",
      path: "/matrix"
    },
  ];

  const toolsItems = [
    {
      icon: Upload,
      title: "Data Import",
      description: "Import property and cost data",
      path: "/import"
    },
    {
      icon: BarChart,
      title: "Analytics Dashboard",
      description: "Advanced property analytics",
      path: "/dashboards"
    },
    {
      icon: FileBarChart,
      title: "Reports",
      description: "Generate detailed reports",
      path: "/reports"
    },
    {
      icon: ImageDown,
      title: "Export Tools",
      description: "Export data and visuals",
      path: "/export"
    },
  ];

  return (
    <div className="space-y-8">
      {/* TerraFusion Hero Section */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="heroPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M0 10 Q5 5 10 10 Q15 15 20 10" stroke="#00e5ff" strokeWidth="0.5" fill="none" opacity="0.3"/>
                <path d="M0 15 Q5 10 10 15 Q15 20 20 15" stroke="#00e5ff" strokeWidth="0.5" fill="none" opacity="0.2"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroPattern)"/>
          </svg>
        </div>

        <div className="relative p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 flex-1">
            <TerraFusionLogo variant="circular" size="lg" className="flex-shrink-0" />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-100 mb-3">
                Welcome to TerraFusion
              </h1>
              <p className="text-cyan-400 text-lg mb-2">
                AI That Understands Land
              </p>
              <p className="text-slate-300 max-w-2xl leading-relaxed">
                Advanced geospatial property valuation platform for Benton County. 
                Streamline your assessment workflows with cutting-edge AI-powered analysis and comprehensive municipal property data.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <Link href="/cost-wizard">
              <Button 
                className="bg-gradient-to-r from-cyan-400 to-cyan-600 text-slate-900 hover:from-cyan-300 hover:to-cyan-500 border-0 shadow-lg font-semibold"
                size="lg"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Start Analysis
              </Button>
            </Link>
            <Link href="/maps">
              <Button 
                variant="outline" 
                className="border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400"
                size="lg"
              >
                <Map className="mr-2 h-5 w-5" />
                View Maps
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics bar */}
        <div className="bg-slate-900/60 backdrop-blur-sm px-8 py-4 border-t border-cyan-400/20">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-slate-400">Active Session:</span>
              <span className="text-cyan-400 font-medium">{user?.name || user?.username || 'User'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-slate-400">System Status:</span>
              <span className="text-green-400 font-medium">Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-slate-400">Data Source:</span>
              <span className="text-blue-400 font-medium">Benton County</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Quick Access</h2>
            <p className="text-slate-400">Essential tools for property valuation and analysis</p>
          </div>
          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
            View All <Grid3X3 className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {quickAccessItems.map((item, index) => (
            <Link key={index} href={item.path}>
              <Card className="group hover:bg-slate-800/50 transition-all duration-300 cursor-pointer border-slate-700/50 bg-slate-800/30 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-400/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <item.icon className="h-10 w-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                    <div className="w-2 h-2 bg-cyan-400 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <CardTitle className="text-slate-100 group-hover:text-white transition-colors text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-400 group-hover:text-slate-300 transition-colors">
                  {item.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools & Resources section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">Tools & Resources</h2>
            <p className="text-slate-400">Advanced utilities for data management and reporting</p>
          </div>
          <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
            View All <Settings className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {toolsItems.map((item, index) => (
            <Link key={index} href={item.path}>
              <Card className="group hover:bg-slate-800/50 transition-all duration-300 cursor-pointer border-slate-700/50 bg-slate-800/30 hover:border-cyan-400/30 hover:shadow-lg hover:shadow-cyan-400/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <item.icon className="h-8 w-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <CardTitle className="text-slate-100 group-hover:text-white transition-colors">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-slate-400 group-hover:text-slate-300 transition-colors text-sm">
                  {item.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-100 mb-1">Recent Activity</h2>
              <p className="text-slate-400">Latest property analyses and system updates</p>
            </div>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Reports
            </Button>
          </div>
          <Card className="border-slate-700/50 bg-slate-800/30">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[
                  { icon: Calculator, title: "Residential property valuation completed", detail: "Property ID: #18423 - 1250 Oakwood Lane", time: "Today, 10:23 AM", color: "cyan" },
                  { icon: Map, title: "Geographic analysis updated", detail: "Benton County District 5 - Market trends", time: "Today, 9:15 AM", color: "blue" },
                  { icon: FileText, title: "Cost matrix export generated", detail: "2024 Building Cost Standards - Commercial", time: "Yesterday, 4:30 PM", color: "emerald" }
                ].map((activity, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/40 border border-slate-700/30">
                    <div className={`p-2 rounded-full bg-${activity.color}-500/10 border border-${activity.color}-500/20`}>
                      <activity.icon className={`h-5 w-5 text-${activity.color}-400`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-slate-100 truncate">{activity.title}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0">{activity.time}</span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 truncate">{activity.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-700/50 bg-slate-900/40">
              <Button variant="ghost" className="mx-auto text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Quick Stats */}
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-100 mb-1">System Overview</h3>
            <p className="text-slate-400">Real-time platform statistics</p>
          </div>
          <div className="space-y-4">
            {[
              { label: "Properties Analyzed", value: "1,247", change: "+12%", icon: Building },
              { label: "Active Matrices", value: "8", change: "stable", icon: Grid3X3 },
              { label: "Reports Generated", value: "89", change: "+5%", icon: FileBarChart },
              { label: "Data Accuracy", value: "99.8%", change: "+0.1%", icon: TrendingUp }
            ].map((stat, i) => (
              <Card key={i} className="border-slate-700/50 bg-slate-800/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
                    <p className={`text-xs ${stat.change.startsWith('+') ? 'text-emerald-400' : stat.change === 'stable' ? 'text-slate-400' : 'text-red-400'}`}>
                      {stat.change}
                    </p>
                  </div>
                  <stat.icon className="h-8 w-8 text-cyan-400 opacity-60" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;