import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import bentonSeal from '@assets/BC.png';
import arizonaSunset from '@assets/Arizona-sunset.jpg';
import vineyardHeader from '@assets/Header-Vineyard-BC.png';
import ogimage from '@assets/ogimage.jpg';
import { BarChart3, Calculator, Database, LineChart, Map, FileSpreadsheet, Upload, Download, BrainCircuit, PieChart, Building, User } from 'lucide-react';

export default function LandingPage() {
  const [_, navigate] = useLocation();
  // Mock authenticated state - always set to true to bypass login
  const isAuthenticated = true;
  const user = { name: "Admin User", username: "admin" };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero section */}
      <section className="relative bg-gradient-to-r from-[#1a3b5c] to-[#235789] text-white">
        <div className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center text-center">
          <img src={bentonSeal} alt="Benton County Seal" className="w-24 h-24 mb-6" />
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Benton County Washington Building Cost Assessment System
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl">
            The official Building Cost Estimation System for Benton County, Washington
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button 
                  size="lg" 
                  className="bg-[#29B7D3] hover:bg-[#21a6bf] text-white font-medium"
                  onClick={() => navigate('/dashboard')}
                >
                  <Calculator className="mr-2 h-5 w-5" /> Go to Dashboard
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  onClick={() => navigate('/calculator')}
                >
                  <Calculator className="mr-2 h-5 w-5" /> Launch Calculator
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  onClick={() => navigate('/data-import')}
                >
                  <Upload className="mr-2 h-5 w-5" /> Import Data
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  className="bg-[#29B7D3] hover:bg-[#21a6bf] text-white font-medium"
                  onClick={() => navigate('/cost-wizard')}
                >
                  <Calculator className="mr-2 h-5 w-5" /> Launch Cost Wizard
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="bg-transparent border-white text-white hover:bg-white/10"
                  onClick={() => navigate('/calculator')}
                >
                  <Calculator className="mr-2 h-5 w-5" /> Try Calculator
                </Button>
              </>
            )}
          </div>
          {isAuthenticated && user && (
            <div className="mt-4 bg-white/10 px-4 py-2 rounded-full flex items-center">
              <User className="h-4 w-4 mr-2 text-white/80" />
              <span className="text-white/80 text-sm">Welcome, {user.name || user.username}</span>
            </div>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/10 to-transparent"></div>
      </section>

      {/* Features section */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-[#243E4D]">Essential Assessment Tools</h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Our comprehensive building cost system provides a suite of tools to help you accurately estimate and analyze construction costs.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-t-4 border-t-[#29B7D3]">
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
                  className="text-[#29B7D3] px-0 hover:bg-transparent hover:text-[#29B7D3]/80"
                  onClick={() => navigate('/calculator')}
                >
                  Learn more
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-t-4 border-t-[#47AD55]">
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
                  className="text-[#47AD55] px-0 hover:bg-transparent hover:text-[#47AD55]/80"
                  onClick={() => navigate('/visualizations')}
                >
                  Learn more
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-t-4 border-t-[#7C5295]">
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
                  className="text-[#7C5295] px-0 hover:bg-transparent hover:text-[#7C5295]/80"
                  onClick={() => navigate('/regional-cost-comparison')}
                >
                  Learn more
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-t-4 border-t-[#EA7317]">
              <CardHeader>
                <div className="bg-[#fdf0e6] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <div className="flex">
                    <Upload className="h-5 w-5 text-[#EA7317]" />
                    <Download className="h-5 w-5 text-[#EA7317] -ml-1" />
                  </div>
                </div>
                <CardTitle>Data Import/Export</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Easily import and export cost data in various formats, including Excel and PDF.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="text-[#EA7317] px-0 hover:bg-transparent hover:text-[#EA7317]/80"
                  onClick={() => navigate('/data-import')}
                >
                  Learn more
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-t-4 border-t-[#5C7AEA]">
              <CardHeader>
                <div className="bg-[#ebeffe] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <BrainCircuit className="h-6 w-6 text-[#5C7AEA]" />
                </div>
                <CardTitle>What-If Scenarios</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Model different building scenarios and see how they affect overall costs.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="text-[#5C7AEA] px-0 hover:bg-transparent hover:text-[#5C7AEA]/80"
                  onClick={() => navigate('/what-if-scenarios')}
                >
                  Learn more
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="border-t-4 border-t-[#E63946]">
              <CardHeader>
                <div className="bg-[#fdebed] p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-6 w-6 text-[#E63946]" />
                </div>
                <CardTitle>Cost Matrix Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Maintain and update cost matrices for different building types and regions.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="ghost" 
                  className="text-[#E63946] px-0 hover:bg-transparent hover:text-[#E63946]/80"
                  onClick={() => navigate('/data-import')}
                >
                  Learn more
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
          <p className="text-center text-lg text-gray-200 mb-12 max-w-3xl mx-auto">
            Our building cost system continues to grow in both data and usage across Benton County.
          </p>
          
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
          <h2 className="text-3xl font-bold text-center mb-3 text-[#243E4D]">Benton County Showcase</h2>
          <p className="text-center text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Discover the beauty and diversity of Benton County, Washington
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <img 
                  src={arizonaSunset}
                  alt="Sunset at Red Mountain" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <h3 className="font-bold text-lg">Sunset at Red Mountain</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <h4 className="font-semibold text-lg mb-2">Scenic Landscapes</h4>
                <p className="text-muted-foreground">
                  Breathtaking views across Benton County's diverse geography, from rolling hills to river valleys.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <img 
                  src={vineyardHeader}
                  alt="Benton County Vineyards" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <h3 className="font-bold text-lg">Wine Country</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <h4 className="font-semibold text-lg mb-2">Thriving Agriculture</h4>
                <p className="text-muted-foreground">
                  Benton County's renowned vineyards and farms produce some of Washington's finest crops and wines.
                </p>
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <img 
                  src={ogimage}
                  alt="Prosser Downtown" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <div className="text-white">
                    <h3 className="font-bold text-lg">Prosser Downtown</h3>
                  </div>
                </div>
              </div>
              <CardContent className="pt-6">
                <h4 className="font-semibold text-lg mb-2">Modern Development</h4>
                <p className="text-muted-foreground">
                  Growing communities and sustainable infrastructure support the county's expanding economic activity.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-center mt-10">
            <Button 
              variant="outline" 
              size="lg"
              className="border-[#243E4D] text-[#243E4D]"
              onClick={() => navigate('/geo-assessment')}
            >
              <Map className="mr-2 h-5 w-5" /> View County Map
            </Button>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="py-16 bg-[#f8f9fa]">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6 text-[#243E4D]">About The System</h2>
              <p className="text-lg text-muted-foreground mb-6">
                The Benton County Building Cost System (BCBS) is the official tool used by county assessors, property managers, and construction professionals to accurately estimate building costs across Benton County, Washington.
              </p>
              <p className="text-lg text-muted-foreground mb-6">
                Our system leverages advanced data analytics and machine learning to provide the most accurate building cost estimations based on real construction data collected over many years.
              </p>
              
              <ul className="space-y-3 mt-8">
                <li className="flex items-start">
                  <div className="bg-[#e6f7fb] rounded-full p-1 mr-3 mt-1">
                    <svg className="h-4 w-4 text-[#29B7D3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-muted-foreground">Updated annually with the latest cost data</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#e6f7fb] rounded-full p-1 mr-3 mt-1">
                    <svg className="h-4 w-4 text-[#29B7D3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-muted-foreground">Integrated with county assessment systems</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-[#e6f7fb] rounded-full p-1 mr-3 mt-1">
                    <svg className="h-4 w-4 text-[#29B7D3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-muted-foreground">Continuously improved through user feedback</span>
                </li>
              </ul>
              
              <div className="flex flex-wrap gap-4 mt-8">
                <Button 
                  className="bg-[#243E4D] hover:bg-[#1a2c38] text-white"
                  onClick={() => navigate('/data-exploration')}
                >
                  <Database className="mr-2 h-5 w-5" /> Explore Data
                </Button>
                <Button 
                  variant="outline" 
                  className="border-[#243E4D] text-[#243E4D]"
                  onClick={() => navigate('/benchmarking')}
                >
                  <BarChart3 className="mr-2 h-5 w-5" /> View Benchmarks
                </Button>
              </div>
            </div>
            
            <div className="md:w-1/2 relative">
              <img 
                src={ogimage}
                alt="Benton County Building" 
                className="rounded-lg shadow-lg w-full h-auto object-cover"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-lg shadow-lg hidden md:block">
                <img src={bentonSeal} alt="Benton County Seal" className="w-16 h-16" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#243E4D] text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-10">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center mb-4">
                <img src={bentonSeal} alt="Benton County Seal" className="w-12 h-12 mr-3" />
                <div>
                  <h3 className="font-bold text-lg">Benton County</h3>
                  <p className="text-gray-300 text-sm">Washington State</p>
                </div>
              </div>
              <p className="text-gray-300 max-w-sm">
                The official building cost estimation system for Benton County's property assessment and construction planning.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="font-semibold text-lg mb-4">Tools</h4>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => navigate('/calculator')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                      Calculator
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/visualizations')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                      Visualizations
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/data-import')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                      Data Import
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <button onClick={() => navigate('/documentation')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                      Documentation
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/tutorials')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                      Tutorials
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/faq')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                      FAQ
                    </button>
                  </li>
                  {isAuthenticated ? (
                    <>
                      <li>
                        <button onClick={() => navigate('/dashboard')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                          My Dashboard
                        </button>
                      </li>
                      <li>
                        <button onClick={() => navigate('/account')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                          Account Settings
                        </button>
                      </li>
                    </>
                  ) : (
                    <li>
                      <button onClick={() => navigate('/auth')} className="text-gray-300 hover:text-white transition-colors bg-transparent">
                        Sign In
                      </button>
                    </li>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-4">Contact</h4>
                <ul className="space-y-2">
                  <li><a href="https://www.co.benton.wa.us" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">County Website</a></li>
                  <li><a href="mailto:support@bentoncounty.gov" className="text-gray-300 hover:text-white transition-colors">Email Support</a></li>
                  <li><span className="text-gray-300">(509) 736-3086</span></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 Benton County. All rights reserved.</p>
            <div className="flex space-x-4">
              <button onClick={() => navigate('/privacy')} className="text-gray-400 text-sm hover:text-white transition-colors bg-transparent">
                Privacy Policy
              </button>
              <button onClick={() => navigate('/terms')} className="text-gray-400 text-sm hover:text-white transition-colors bg-transparent">
                Terms of Use
              </button>
              <button onClick={() => navigate('/accessibility')} className="text-gray-400 text-sm hover:text-white transition-colors bg-transparent">
                Accessibility
              </button>
              {isAuthenticated && (
                <button 
                  onClick={() => {
                    // This will trigger logout when implemented in auth context
                    navigate('/');
                  }} 
                  className="text-gray-400 text-sm hover:text-white transition-colors bg-transparent"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}