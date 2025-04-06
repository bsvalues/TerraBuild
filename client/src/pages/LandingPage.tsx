import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BentonBranding } from '@/components/BentonBranding';
import { 
  Calculator, 
  History, 
  CheckCircle2, 
  BarChart3, 
  BrainCircuit, 
  MessageSquareText, 
  AlertTriangle, 
  ThumbsUp, 
  ArrowRight,
  LogIn,
  Home,
  Users
} from 'lucide-react';

// Import Benton County header image
import headerImage from '@assets/Header-Vineyard-BC.png';

export default function LandingPage() {
  const [_, navigate] = useLocation();

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleDashboard = () => {
    navigate('/app');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-4 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BentonBranding className="mr-4" />
              <span className="font-bold text-lg text-[#243E4D]">LevyMaster</span>
            </div>
            
            <div className="hidden md:flex space-x-8 text-[#243E4D]">
              <Link href="/" className="hover:text-[#29B7D3] transition-colors">
                Home
              </Link>
              <Link href="#features" className="hover:text-[#29B7D3] transition-colors">
                Features
              </Link>
              <Link href="#analytics" className="hover:text-[#29B7D3] transition-colors">
                Analytics
              </Link>
              <Link href="#about" className="hover:text-[#29B7D3] transition-colors">
                About
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                className="border-[#243E4D] text-[#243E4D] hover:bg-[#243E4D] hover:text-white"
                onClick={handleLogin}
              >
                <LogIn className="mr-2 h-4 w-4" /> Log In
              </Button>
              <Button 
                className="bg-[#29B7D3] text-white hover:bg-[#1e9cb5]"
                onClick={handleDashboard}
              >
                <Users className="mr-2 h-4 w-4" /> Go to App
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Empty space to compensate for fixed header */}
      <div className="pt-20"></div>
      
      {/* Hero Section */}
      <section 
        className="relative bg-gradient-to-b from-[#1e3a5f] to-[#2c5282] text-white py-16 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(30, 58, 95, 0.85), rgba(44, 82, 130, 0.9)), url(${headerImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <BentonBranding className="mb-8 w-24 h-24" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">LevyMaster</h1>
            <h2 className="text-xl md:text-2xl mb-6">Benton County's Intelligent Property Tax Platform</h2>
            <p className="text-lg mb-8 max-w-2xl opacity-90">
              Transform complex tax calculations into streamlined workflows for property owners.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="bg-[#29B7D3] hover:bg-[#1e9cb5] text-white">
                Calculate Levy
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Property Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Tax Analysis Tools Section */}
      <section id="features" className="py-16 bg-[#f5f7fa]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-[#243E4D]">
            Powerful Tax Analysis Tools
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Comprehensive solutions for property tax management in Benton County
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Levy Calculation Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-[#243E4D]">Levy Calculation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Accurate calculation of property taxes based on up-to-date assessment values, exemptions, and levy rates.
                </p>
              </CardContent>
            </Card>

            {/* Historical Analysis Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <History className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl text-[#243E4D]">Historical Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Compare property values and tax charges over time with interactive visualizations and trend insights.
                </p>
              </CardContent>
            </Card>

            {/* Compliance Verification Card */}
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-xl text-[#243E4D]">Compliance Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Automated verification of property classifications and exemption eligibility based on county regulations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Interactive Dashboard Section */}
      <section id="analytics" className="py-16 relative bg-gradient-to-r from-[#2c5282] to-[#1e3a5f] text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">Interactive Dashboard</h2>
          
          <div className="grid md:grid-cols-5 gap-8 items-center">
            <div className="md:col-span-2">
              <div className="space-y-6">
                <p className="text-lg mb-4">
                  Monitor key metrics, visualize trends, and gain insights with our intuitive dashboard interface.
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-[#29B7D3]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p>Real-time data visualization</p>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-[#29B7D3]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p>Customizable reports and exports</p>
                  </div>
                  <div className="flex items-start">
                    <div className="mt-1 mr-3 text-[#29B7D3]">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p>Advanced trend analysis</p>
                  </div>
                </div>

                <Button variant="outline" className="text-white border-white hover:bg-white/10">
                  Explore Dashboard
                </Button>
              </div>
            </div>
            
            <div className="md:col-span-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="aspect-video rounded-md bg-gray-800/40 flex items-center justify-center">
                <BarChart3 className="h-24 w-24 text-[#29B7D3] opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Intelligence Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-[#243E4D]">
            AI-Powered Intelligence
          </h2>
          <div className="w-16 h-1 bg-[#29B7D3] mx-auto mb-12"></div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Predictive Analysis Card */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="mr-4 text-blue-500">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                  <CardTitle>Predictive Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-gray-600 mb-4">
                  Leverage advanced machine learning algorithms to predict future trends for accurate property tax forecasts and planning decisions.
                </p>
                <Button variant="ghost" size="sm" className="text-blue-500">
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Natural Language Analysis Card */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="mr-4 text-indigo-500">
                    <MessageSquareText className="h-6 w-6" />
                  </div>
                  <CardTitle>Natural Language Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-gray-600 mb-4">
                  Use intuitive questions in plain English to extract complex property data, financial trends, and compliance requirements.
                </p>
                <Button variant="ghost" size="sm" className="text-indigo-500">
                  Try It Out <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Intelligent Recommendations Card */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="mr-4 text-amber-500">
                    <ThumbsUp className="h-6 w-6" />
                  </div>
                  <CardTitle>Intelligent Recommendations</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-gray-600 mb-4">
                  Receive data-driven recommendations for optimizing tax rates, improving assessments, and enhancing operational efficiency.
                </p>
                <Button variant="ghost" size="sm" className="text-amber-500">
                  View Examples <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Anomaly Detection Card */}
            <Card className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center">
                  <div className="mr-4 text-red-500">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <CardTitle>Anomaly Detection</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-gray-600 mb-4">
                  Automatically identify unusual patterns, outliers, and potential errors in tax assessment calculations and property data.
                </p>
                <Button variant="ghost" size="sm" className="text-red-500">
                  View Anomalies <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* System Capabilities Section */}
      <section id="about" className="py-16 bg-[#f5f7fa]">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-[#243E4D]">
            System Capabilities
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Trusted tools for comprehensive property tax management
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {/* Accuracy */}
            <div>
              <div className="text-purple-600 text-4xl font-bold mb-2">100%</div>
              <div className="text-gray-700">Accuracy</div>
            </div>
            
            {/* Compliance */}
            <div>
              <div className="text-green-600 text-4xl font-bold mb-2">99.9%</div>
              <div className="text-gray-700">Compliance Rate</div>
            </div>
            
            {/* Years Experience */}
            <div>
              <div className="text-amber-600 text-4xl font-bold mb-2">5+</div>
              <div className="text-gray-700">Years Experience</div>
            </div>
            
            {/* Client Success */}
            <div>
              <div className="text-red-600 text-4xl font-bold mb-2">10+</div>
              <div className="text-gray-700">Service Awards</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 bg-gradient-to-r from-[#3182ce] to-[#805ad5]">
        <div className="container mx-auto px-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Transform Your Tax Calculations?
            </h2>
            <p className="mb-8 opacity-90">
              Start exploring the powerful features of LevyMaster today
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={handleDashboard}
              >
                Start Calculating
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white hover:bg-white/10"
                onClick={handleLogin}
              >
                Log In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a365d] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center">
                <BentonBranding className="w-8 h-8 mr-3" />
                <span className="font-bold">Benton County</span>
              </div>
              <p className="text-sm mt-2 text-gray-300">
                Providing quality services for citizens in Benton County since 1905.
                <br />© 2025 Benton County Government. All rights reserved.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Quick Links</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white">Property Records</a></li>
                <li><a href="#" className="hover:text-white">Tax Calculator</a></li>
                <li><a href="#" className="hover:text-white">Payment Options</a></li>
                <li><a href="#" className="hover:text-white">Contact Assessor</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-2">Contact Information</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>5600 W Canal Drive, Kennewick, WA</li>
                <li>Phone: (509) 555-1212</li>
                <li>Email: info@bentoncounty.gov</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}