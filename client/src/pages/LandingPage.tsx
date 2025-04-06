import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { 
  ArrowRight, 
  Building2, 
  Calculator, 
  ChartBar, 
  Database, 
  FileSpreadsheet, 
  Map, 
  ChevronDown,
  Quote,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { APP_NAME } from "@/data/constants";

// Import Benton County images
import bentonSeal from '@assets/BC.png';
import bentonScenicLogo from '@assets/ogimage.jpg';
import imageLogo from '@assets/images.png';
import bentonHeader from '@assets/Header-Vineyard-BC.png';
import bentonSunset from '@assets/Arizona-sunset.jpg';
import bentonVineyard from '@assets/3629742582_a3a12b5359_b.jpg';
import additionalImage from '@assets/1.jpg';

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  
  // Rotate through features automatically
  useEffect(() => {
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 5000);
    
    const testimonialInterval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    
    return () => {
      clearInterval(featureInterval);
      clearInterval(testimonialInterval);
    };
  }, []);
  
  const testimonials = [
    {
      quote: "The Benton County Building Cost System has revolutionized how we conduct property assessments. It's accurate, efficient, and has saved countless hours of manual calculations.",
      author: "Maria Johnson",
      title: "Chief Assessor, Benton County",
    },
    {
      quote: "As a property developer, having access to this tool has made planning new projects much more predictable. The regional cost breakdowns are invaluable for our budget forecasting.",
      author: "James Wilson",
      title: "Development Director, PNW Builders",
    },
    {
      quote: "The BCBS provides the most accurate building cost estimates in the region. The data import feature seamlessly integrates with our existing systems.",
      author: "Robert Chen",
      title: "County Commissioner",
    },
    {
      quote: "Before this system, we struggled with inconsistent cost estimations. Now, all departments work from the same reliable data source.",
      author: "Sarah Martinez",
      title: "Construction Manager",
    },
  ];
  
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
        {/* Animated overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        />
        
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          {/* Animated logo */}
          <motion.div 
            className="flex justify-center mb-6"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <img 
              src={bentonSeal} 
              alt="Benton County Seal" 
              className="h-24 w-24 drop-shadow-lg"
            />
          </motion.div>
          
          {/* Animated title */}
          <motion.h1
            className="text-5xl font-bold mb-4 tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {APP_NAME}
          </motion.h1>
          
          {/* Animated subtitle */}
          <motion.p
            className="text-2xl mb-6 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
          >
            The official Building Cost Estimation System for Benton County, Washington
          </motion.p>
          
          {/* Animated buttons */}
          <motion.div 
            className="flex flex-wrap justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
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
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronDown className="h-8 w-8 text-white/70" />
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-[#243E4D]/5 to-white">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-[#243E4D] mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive building cost system provides a suite of tools to help you
              accurately estimate and analyze construction costs.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className={`border-2 transition-all duration-300 hover:shadow-xl group overflow-hidden cursor-pointer ${
                    index === activeFeature 
                      ? 'border-[#47AD55] shadow-lg' 
                      : 'border-transparent'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6 relative">
                    {/* Background pattern only visible on hover or active */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-tr rounded-lg transition-opacity duration-500 opacity-0 ${
                        index === activeFeature ? 'opacity-5' : 'group-hover:opacity-5'
                      }`}
                      style={{
                        backgroundImage: 'radial-gradient(circle at 10px 10px, #47AD55 1px, transparent 0)',
                        backgroundSize: '20px 20px'
                      }}
                    />
                    
                    {/* Animated icon container */}
                    <motion.div 
                      className={`mb-4 p-4 rounded-full inline-flex bg-[#243E4D]/10 transition-all duration-300 ${
                        index === activeFeature ? 'text-[#47AD55] scale-110' : 'text-[#243E4D] group-hover:text-[#47AD55]'
                      }`}
                      whileHover={{ rotate: 10, scale: 1.1 }}
                      animate={index === activeFeature ? { 
                        y: [0, -5, 0],
                        scale: [1, 1.1, 1],
                        transition: { 
                          repeat: 2, 
                          duration: 0.5 
                        }
                      } : {}}
                    >
                      {feature.icon}
                    </motion.div>
                    
                    <h3 className="text-xl font-bold mb-2 transition-colors duration-300 group-hover:text-[#47AD55]">
                      {feature.title}
                    </h3>
                    
                    <p className="text-muted-foreground group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                    
                    {/* Show more link that appears on hover */}
                    <div className={`mt-4 flex items-center gap-1 text-sm font-medium overflow-hidden transition-all duration-300 ${
                      index === activeFeature ? 'text-[#47AD55] max-h-6' : 'max-h-0 group-hover:max-h-6 text-[#243E4D] group-hover:text-[#47AD55]'
                    }`}>
                      <span>Learn more</span>
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-20 bg-[#243E4D] text-white relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4">System Impact</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Our building cost system continues to grow in both data and usage across Benton County.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              className="text-center bg-white/5 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <motion.div 
                className="text-4xl font-bold mb-2 flex justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <motion.div
                  initial={{ number: 0 }}
                  whileInView={{ number: 3500 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.3 }}
                >
                  {({ number }) => <span>{Math.floor(number)}+</span>}
                </motion.div>
              </motion.div>
              <div className="text-white/70">Building Cost Records</div>
            </motion.div>
            
            <motion.div 
              className="text-center bg-white/5 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <motion.div 
                className="text-4xl font-bold mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <motion.div
                  initial={{ number: 0 }}
                  whileInView={{ number: 25 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.4 }}
                >
                  {({ number }) => <span>{Math.floor(number)}+</span>}
                </motion.div>
              </motion.div>
              <div className="text-white/70">Building Types</div>
            </motion.div>
            
            <motion.div 
              className="text-center bg-white/5 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <motion.div 
                className="text-4xl font-bold mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.div
                  initial={{ number: 0 }}
                  whileInView={{ number: 15 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                >
                  {({ number }) => <span>{Math.floor(number)}+</span>}
                </motion.div>
              </motion.div>
              <div className="text-white/70">County Regions</div>
            </motion.div>
            
            <motion.div 
              className="text-center bg-white/5 backdrop-blur-sm rounded-lg p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <motion.div 
                className="text-4xl font-bold mb-2"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <motion.div
                  initial={{ number: 0 }}
                  whileInView={{ number: 97 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.5, delay: 0.6 }}
                >
                  {({ number }) => <span>{Math.floor(number)}%</span>}
                </motion.div>
              </motion.div>
              <div className="text-white/70">Estimation Accuracy</div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Benton County Showcase */}
      <section className="py-16 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bentonHeader})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1
          }}
        ></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#243E4D] mb-4">Benton County Showcase</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the beauty and diversity of Benton County, Washington
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
              <div className="h-64 w-full overflow-hidden">
                <img src={bentonSunset} alt="Benton County Sunset" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 bg-white">
                <h3 className="font-bold text-lg mb-2">Scenic Landscapes</h3>
                <p className="text-sm text-muted-foreground">Breathtaking views across Benton County</p>
              </div>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
              <div className="h-64 w-full overflow-hidden">
                <img src={bentonVineyard} alt="Benton County Vineyards" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 bg-white">
                <h3 className="font-bold text-lg mb-2">Thriving Agriculture</h3>
                <p className="text-sm text-muted-foreground">Benton County's renowned vineyards and farms</p>
              </div>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:scale-105">
              <div className="h-64 w-full overflow-hidden">
                <img src={additionalImage} alt="Benton County Development" className="w-full h-full object-cover" />
              </div>
              <div className="p-4 bg-white">
                <h3 className="font-bold text-lg mb-2">Modern Development</h3>
                <p className="text-sm text-muted-foreground">Growing communities and infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-gradient-to-b from-white to-[#243E4D]/5">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-[#243E4D] mb-4">What People Are Saying</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Trusted by assessors, developers, and construction professionals across Benton County.
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Testimonial carousel */}
            <div className="overflow-hidden">
              <div className="flex flex-col items-center">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-3xl mx-auto text-center px-6"
                >
                  <div className="mb-6 text-[#243E4D]">
                    <Quote className="h-12 w-12 mx-auto opacity-20" />
                  </div>
                  <p className="text-xl mb-8 italic text-gray-700">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  <div>
                    <h4 className="font-bold text-lg text-[#243E4D]">
                      {testimonials[activeTestimonial].author}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonials[activeTestimonial].title}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
            
            {/* Navigation arrows */}
            <div className="flex justify-between absolute top-1/2 left-0 right-0 -mt-4 px-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="bg-white/80 hover:bg-white/90 rounded-full shadow-md"
                onClick={() => setActiveTestimonial(prev => 
                  prev === 0 ? testimonials.length - 1 : prev - 1
                )}
              >
                <ChevronLeft className="h-5 w-5 text-[#243E4D]" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon"
                className="bg-white/80 hover:bg-white/90 rounded-full shadow-md"
                onClick={() => setActiveTestimonial(prev => 
                  (prev + 1) % testimonials.length
                )}
              >
                <ChevronRight className="h-5 w-5 text-[#243E4D]" />
              </Button>
            </div>
            
            {/* Dots indicator */}
            <div className="flex justify-center mt-8 gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === activeTestimonial 
                      ? 'w-8 bg-[#47AD55]' 
                      : 'w-2 bg-[#243E4D]/30 hover:bg-[#243E4D]/50'
                  }`}
                  onClick={() => setActiveTestimonial(index)}
                  aria-label={`View testimonial ${index + 1}`}
                />
              ))}
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