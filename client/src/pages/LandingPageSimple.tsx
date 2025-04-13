import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import bentonSeal from '@assets/BC.png';
import arizonaSunset from '@assets/Arizona-sunset.jpg';
import { Calculator, Database, LineChart, Map, Upload, BarChart3 } from 'lucide-react';

export default function LandingPageSimple() {
  const [_, setLocation] = useLocation();

  // Navigation function using wouter's setLocation
  const navigateTo = (path: string) => {
    setLocation(path);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <section className="relative bg-gradient-to-r from-[#1a3b5c] to-[#235789] text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <img src={bentonSeal} alt="Benton County Seal" className="w-24 h-24 mx-auto mb-6" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Benton County Building Cost Assessment System
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            The official Building Cost Estimation System for Benton County, Washington
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-[#29B7D3] hover:bg-[#21a6bf] text-white font-medium"
              onClick={() => navigateTo('/calculator')}
            >
              <Calculator className="mr-2 h-5 w-5" /> Launch Calculator
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-transparent border-white text-white hover:bg-white/10"
              onClick={() => navigateTo('/data-import')}
            >
              <Upload className="mr-2 h-5 w-5" /> Import Data
            </Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-6 text-[#243E4D]">Powerful Features</h2>
          <p className="text-center text-lg text-muted-foreground mb-10 max-w-3xl mx-auto">
            Our comprehensive building cost system provides a suite of tools to help you accurately estimate and analyze construction costs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-md">
              <CardHeader>
                <div className="bg-[#e6f7fb] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-[#29B7D3]" />
                </div>
                <CardTitle>Cost Calculator</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Accurately calculate building costs based on structure type, size, and region.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => navigateTo('/calculator')}
                  className="px-0 hover:bg-transparent"
                >
                  Learn more &rarr;
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="shadow-md">
              <CardHeader>
                <div className="bg-[#e9f7eb] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-[#47AD55]" />
                </div>
                <CardTitle>Data Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced charts and graphs to help interpret complex cost data at a glance.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => navigateTo('/visualizations')}
                  className="px-0 hover:bg-transparent"
                >
                  Learn more &rarr;
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="shadow-md">
              <CardHeader>
                <div className="bg-[#f0ebf7] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <Map className="h-6 w-6 text-[#7C5295]" />
                </div>
                <CardTitle>Regional Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Compare construction costs across different regions in Benton County.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  onClick={() => navigateTo('/regional-cost-comparison')}
                  className="px-0 hover:bg-transparent"
                >
                  Learn more &rarr;
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="py-16 bg-[#243E4D] text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">System Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#29B7D3] mb-2">3,500+</div>
              <div className="text-lg text-gray-200">Building Cost Records</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#29B7D3] mb-2">25+</div>
              <div className="text-lg text-gray-200">Building Types</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#29B7D3] mb-2">15+</div>
              <div className="text-lg text-gray-200">County Regions</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-[#29B7D3] mb-2">97%</div>
              <div className="text-lg text-gray-200">Estimation Accuracy</div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-[#243E4D]">Benton County Showcase</h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Discover the beauty and diversity of Benton County, Washington
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-64">
                <img 
                  src={arizonaSunset}
                  alt="Sunset at Red Mountain" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <h3 className="font-bold text-xl">Scenic Landscapes</h3>
                    <p className="text-sm">Breathtaking views across Benton County's diverse geography.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative h-64">
                <img 
                  src={bentonSeal}
                  alt="Benton County Development" 
                  className="absolute inset-0 w-full h-full object-cover bg-slate-200 p-8"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <h3 className="font-bold text-xl">Modern Development</h3>
                    <p className="text-sm">Growing communities and sustainable infrastructure.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Button 
              variant="outline" 
              size="lg"
              className="border-[#243E4D] text-[#243E4D]"
              onClick={() => navigateTo('/geo-assessment')}
            >
              <Map className="mr-2 h-5 w-5" /> View County Map
            </Button>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-[#243E4D] text-center">About The System</h2>
            <p className="text-lg text-muted-foreground mb-6 text-center">
              The Benton County Building Cost System (BCBS) is the official tool used by county assessors, property managers, and construction professionals to accurately estimate building costs across Benton County, Washington.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              <Button 
                className="bg-[#243E4D] hover:bg-[#1a2c38] text-white"
                onClick={() => navigateTo('/data-exploration')}
              >
                <Database className="mr-2 h-5 w-5" /> Explore Data
              </Button>
              <Button 
                variant="outline" 
                className="border-[#243E4D] text-[#243E4D]"
                onClick={() => navigateTo('/benchmarking')}
              >
                <BarChart3 className="mr-2 h-5 w-5" /> View Benchmarks
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#243E4D] text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <img src={bentonSeal} alt="Benton County Seal" className="w-10 h-10 mr-3" />
              <div>
                <h3 className="font-semibold">Benton County</h3>
                <p className="text-sm text-gray-300">Washington State</p>
              </div>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-sm text-gray-300">© 2025 Benton County. All rights reserved.</p>
              <div className="flex gap-4 mt-2 justify-center md:justify-end">
                <a href="#" className="text-xs text-gray-300 hover:text-white">Privacy Policy</a>
                <a href="#" className="text-xs text-gray-300 hover:text-white">Terms of Use</a>
                <a href="#" className="text-xs text-gray-300 hover:text-white">Accessibility</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}