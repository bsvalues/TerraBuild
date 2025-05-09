import React from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { 
  BarChart, 
  Building, 
  Calculator, 
  FileBarChart, 
  Grid3X3, 
  ImageDown, 
  Layers, 
  Map, 
  Upload 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  const { user } = useAuth();

  const quickAccessItems = [
    {
      icon: Calculator,
      title: "Cost Calculator",
      description: "Quick property cost calculations",
      path: "/cost-calculator"
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
      {/* Welcome header */}
      <div className="rounded-lg overflow-hidden border border-blue-800/40 bg-gradient-to-r from-blue-950 to-blue-900">
        <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-100 mb-2">
              Welcome back, {user?.name || user?.username || 'User'}
            </h1>
            <p className="text-blue-300 max-w-xl">
              TerraFusion Build provides powerful tools for property valuation, cost analysis, and data-driven insights. Explore the platform to discover how it can streamline your assessment workflows.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Button 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border-0 shadow-md"
              size="lg"
            >
              <Calculator className="mr-2 h-5 w-5" />
              New Calculation
            </Button>
          </div>
        </div>
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 px-8 py-4 border-t border-blue-800/40">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm">
            <div>
              <span className="text-blue-400">Last login:</span>
              <span className="ml-2 text-blue-200">Today, 9:45 AM</span>
            </div>
            <div>
              <span className="text-blue-400">Recent calculations:</span>
              <span className="ml-2 text-blue-200">12</span>
            </div>
            <div>
              <span className="text-blue-400">Properties analyzed:</span>
              <span className="ml-2 text-blue-200">85</span>
            </div>
            <div>
              <span className="text-blue-400">Active matrices:</span>
              <span className="ml-2 text-blue-200">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick access section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-100">Quick Access</h2>
          <Button variant="link" className="text-cyan-400 p-0 hover:text-cyan-300">
            View All <Grid3X3 className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickAccessItems.map((item, index) => (
            <Link key={index} href={item.path}>
              <Card className="hover:bg-blue-900/30 transition-colors cursor-pointer border-blue-800/40 bg-blue-900/20">
                <CardHeader className="pb-2">
                  <item.icon className="h-8 w-8 text-cyan-400 mb-2" />
                  <CardTitle className="text-blue-100">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-400">
                  {item.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Tools section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-blue-100">Tools & Resources</h2>
          <Button variant="link" className="text-cyan-400 p-0 hover:text-cyan-300">
            View All <Grid3X3 className="ml-1 h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {toolsItems.map((item, index) => (
            <Link key={index} href={item.path}>
              <Card className="hover:bg-blue-900/30 transition-colors cursor-pointer border-blue-800/40 bg-blue-900/20">
                <CardHeader className="pb-2">
                  <item.icon className="h-8 w-8 text-cyan-400 mb-2" />
                  <CardTitle className="text-blue-100">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-400">
                  {item.description}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-blue-100 mb-6">Recent Activity</h2>
        <Card className="border-blue-800/40 bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="space-y-5">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="flex items-start gap-4 pb-4 border-b border-blue-800/30">
                  <div className="p-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <Calculator className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <p className="font-medium text-blue-100">Residential property valuation completed</p>
                      <span className="text-xs text-blue-400">Today, 10:23 AM</span>
                    </div>
                    <p className="text-sm text-blue-300 mt-1">Property ID: #18423 - 1250 Oakwood Lane</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-blue-800/30 bg-blue-950/30">
            <Button variant="ghost" className="mx-auto text-cyan-400 hover:text-cyan-300">
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;