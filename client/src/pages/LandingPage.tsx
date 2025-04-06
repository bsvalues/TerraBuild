import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Building2, Calculator, ChartBar, Database, FileSpreadsheet, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/data/constants";

// Import Benton County images
import bentonSeal from '@assets/BC.png';
import bentonScenicLogo from '@assets/ogimage.jpg';
import imageLogo from '@assets/images.png';

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  
  // Rotate through features automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const features = [
    {
      icon: <Calculator className="h-6 w-6" />,
      title: "Cost Calculator",
      description: "Accurately calculate building costs based on structure type, size, and region.",
    },
    {
      icon: <ChartBar className="h-6 w-6" />,
      title: "Data Visualization",
      description: "Advanced charts and graphs to help interpret complex cost data at a glance.",
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: "Regional Analysis",
      description: "Compare construction costs across different regions in Benton County.",
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "Data Import/Export",
      description: "Easily import and export cost data in various formats, including Excel and PDF.",
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "What-If Scenarios",
      description: "Model different building scenarios and see how they affect overall costs.",
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6" />,
      title: "Cost Matrix Management",
      description: "Maintain and update cost matrices for different building types and regions.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative h-[600px] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${bentonScenicLogo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <div className="flex justify-center mb-6">
            <img 
              src={bentonSeal} 
              alt="Benton County Seal" 
              className="h-24 w-24 drop-shadow-lg"
            />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            {APP_NAME}
          </h1>
          
          <p className="text-2xl mb-6 max-w-3xl mx-auto">
            The official Building Cost Estimation System for Benton County, Washington
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="/calculator">
              <Button size="lg" className="bg-[#47AD55] hover:bg-[#3a8c45] text-white">
                Launch Calculator
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/data-import">
              <Button size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                Import Data
                <Database className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-[#243E4D]/5 to-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#243E4D] mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive building cost system provides a suite of tools to help you
              accurately estimate and analyze construction costs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className={`border-2 transition-all duration-300 hover:shadow-lg cursor-pointer ${
                  index === activeFeature 
                    ? 'border-[#47AD55] shadow-md' 
                    : 'border-transparent'
                }`}
                onClick={() => setActiveFeature(index)}
              >
                <CardContent className="p-6">
                  <div className={`mb-4 p-3 rounded-full inline-flex bg-[#243E4D]/10 ${
                    index === activeFeature ? 'text-[#47AD55]' : 'text-[#243E4D]'
                  }`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-16 bg-[#243E4D] text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">3,500+</div>
              <div className="text-white/70">Building Cost Records</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-white/70">Building Types</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-white/70">County Regions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">97%</div>
              <div className="text-white/70">Estimation Accuracy</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-[#243E4D] mb-4">About The System</h2>
              <p className="text-lg mb-6">
                The Benton County Building Cost System (BCBS) is the official tool used by county assessors,
                property managers, and construction professionals to accurately estimate building costs 
                across Benton County, Washington.
              </p>
              <p className="text-lg mb-6">
                Our system leverages advanced data analytics and machine learning to provide the most
                accurate building cost estimations based on real construction data collected over many years.
              </p>
              <div className="flex gap-4 mt-8">
                <Link href="/data-exploration">
                  <Button size="lg" className="bg-[#243E4D] hover:bg-[#1c313d]">
                    Explore Data
                  </Button>
                </Link>
                <Link href="/benchmarking">
                  <Button size="lg" variant="outline">
                    View Benchmarks
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <img 
                src={imageLogo} 
                alt="Benton County Building" 
                className="max-w-md rounded-xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* County Branding Footer */}
      <footer className="py-8 bg-[#243E4D]/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src={bentonSeal} 
                alt="Benton County Seal" 
                className="h-12 w-12 mr-4"
              />
              <div>
                <div className="text-lg font-bold text-[#243E4D]">Benton County</div>
                <div className="text-sm text-muted-foreground">Washington State</div>
              </div>
            </div>
            
            <div className="flex gap-8">
              <Link href="/calculator">
                <span className="text-muted-foreground hover:text-[#47AD55] cursor-pointer">Calculator</span>
              </Link>
              <Link href="/visualizations">
                <span className="text-muted-foreground hover:text-[#47AD55] cursor-pointer">Visualizations</span>
              </Link>
              <Link href="/data-import">
                <span className="text-muted-foreground hover:text-[#47AD55] cursor-pointer">Data Import</span>
              </Link>
            </div>
            
            <div className="text-sm text-muted-foreground mt-4 md:mt-0">
              © {new Date().getFullYear()} Benton County. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}