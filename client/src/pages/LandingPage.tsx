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
  ChevronDown
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
  
  // Rotate through features automatically
  useEffect(() => {
    const featureInterval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6);
    }, 5000);
    
    return () => {
      clearInterval(featureInterval);
    };
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
                <span>3,500+</span>
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
                <span>25+</span>
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
                <span>15+</span>
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
                <span>97%</span>
              </motion.div>
              <div className="text-white/70">Estimation Accuracy</div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Benton County Showcase */}
      <section className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${bentonHeader})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08
          }}
        ></div>
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-[#243E4D] mb-4">Benton County Showcase</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the beauty and diversity of Benton County, Washington
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="group"
            >
              <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-2xl bg-white">
                <div className="h-64 w-full overflow-hidden relative">
                  <motion.img 
                    src={bentonSunset} 
                    alt="Benton County Sunset" 
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="text-white font-medium"
                    >
                      Sunset at Red Mountain
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 text-[#243E4D] group-hover:text-[#47AD55] transition-colors duration-300">Scenic Landscapes</h3>
                  <p className="text-muted-foreground mb-3">Breathtaking views across Benton County's diverse geography, from rolling hills to river valleys.</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-[#47AD55] overflow-hidden max-h-0 group-hover:max-h-6 transition-all duration-300">
                    <span>Learn more about our landscapes</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group"
            >
              <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-2xl bg-white">
                <div className="h-64 w-full overflow-hidden relative">
                  <motion.img 
                    src={bentonVineyard} 
                    alt="Benton County Vineyards" 
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="text-white font-medium"
                    >
                      Wine Country
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 text-[#243E4D] group-hover:text-[#47AD55] transition-colors duration-300">Thriving Agriculture</h3>
                  <p className="text-muted-foreground mb-3">Benton County's renowned vineyards and farms produce some of Washington's finest crops and wines.</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-[#47AD55] overflow-hidden max-h-0 group-hover:max-h-6 transition-all duration-300">
                    <span>Explore agricultural heritage</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group"
            >
              <div className="rounded-lg overflow-hidden shadow-lg transition-all duration-500 group-hover:shadow-2xl bg-white">
                <div className="h-64 w-full overflow-hidden relative">
                  <motion.img 
                    src={additionalImage} 
                    alt="Benton County Development" 
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                      className="text-white font-medium"
                    >
                      Prosser Downtown
                    </motion.div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 text-[#243E4D] group-hover:text-[#47AD55] transition-colors duration-300">Modern Development</h3>
                  <p className="text-muted-foreground mb-3">Growing communities and sustainable infrastructure support the county's expanding economic activity.</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-[#47AD55] overflow-hidden max-h-0 group-hover:max-h-6 transition-all duration-300">
                    <span>Discover development projects</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="flex justify-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button 
              size="lg" 
              variant="outline" 
              className="border-[#243E4D] text-[#243E4D] hover:bg-[#243E4D] hover:text-white"
            >
              View County Map
              <Map className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="py-24 bg-gradient-to-b from-[#243E4D]/5 to-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative">
                <h2 className="text-4xl font-bold text-[#243E4D] mb-6 relative z-10">
                  About The System
                  <div className="absolute -z-10 w-12 h-12 rounded-full bg-[#47AD55]/10 -top-4 -left-4"></div>
                </h2>
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 relative z-10">
                  <motion.p 
                    className="text-lg mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  >
                    The Benton County Building Cost System (BCBS) is the official tool used by county assessors,
                    property managers, and construction professionals to accurately estimate building costs 
                    across Benton County, Washington.
                  </motion.p>
                  <motion.p 
                    className="text-lg mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Our system leverages advanced data analytics and machine learning to provide the most
                    accurate building cost estimations based on real construction data collected over many years.
                  </motion.p>
                  
                  <motion.div 
                    className="mt-6 space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#47AD55]/20 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-[#47AD55]"></div>
                      </div>
                      <span className="text-gray-700">Updated annually with the latest cost data</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#47AD55]/20 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-[#47AD55]"></div>
                      </div>
                      <span className="text-gray-700">Integrated with county assessment systems</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-[#47AD55]/20 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-[#47AD55]"></div>
                      </div>
                      <span className="text-gray-700">Continuously improved through user feedback</span>
                    </div>
                  </motion.div>
                </div>
                <div className="absolute w-40 h-40 rounded-full bg-[#243E4D]/5 -bottom-10 -right-10 -z-10"></div>
              </div>
              
              <motion.div 
                className="flex flex-wrap gap-4 mt-10"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link href="/data-exploration">
                  <Button 
                    size="lg" 
                    className="bg-[#243E4D] hover:bg-[#1c313d] transition-transform hover:translate-y-[-2px]"
                  >
                    Explore Data
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/benchmarking">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-[#243E4D] text-[#243E4D] hover:bg-[#243E4D] hover:text-white transition-transform hover:translate-y-[-2px]"
                  >
                    View Benchmarks
                    <ChartBar className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute -top-6 -left-6 w-24 h-24 bg-[#47AD55]/10 rounded-lg"
                  animate={{ 
                    rotate: [0, 10, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                ></motion.div>
                <motion.div
                  className="absolute -bottom-8 -right-8 w-32 h-32 bg-[#243E4D]/10 rounded-lg"
                  animate={{ 
                    rotate: [0, -10, 0],
                    scale: [1, 1.08, 1]
                  }}
                  transition={{ 
                    duration: 7,
                    repeat: Infinity,
                    repeatType: "reverse" 
                  }}
                ></motion.div>
                <motion.img 
                  src={imageLogo} 
                  alt="Benton County Building" 
                  className="max-w-lg rounded-xl shadow-xl relative z-10 border-4 border-white"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* County Branding Footer */}
      <footer className="pt-16 pb-8 bg-gradient-to-b from-white to-[#243E4D]/10">
        <div className="container mx-auto px-6">
          {/* Top section with logo and navigation */}
          <div className="border-b border-gray-200 pb-8 mb-8">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
              <motion.div 
                className="flex flex-col items-center md:items-start"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center mb-4">
                  <motion.img 
                    src={bentonSeal} 
                    alt="Benton County Seal" 
                    className="h-16 w-16 mr-4"
                    whileHover={{ rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  />
                  <div>
                    <div className="text-xl font-bold text-[#243E4D]">Benton County</div>
                    <div className="text-sm text-muted-foreground">Washington State</div>
                  </div>
                </div>
                <p className="text-muted-foreground max-w-md text-center md:text-left mb-4">
                  The official building cost estimation system for Benton County's property assessment and construction planning.
                </p>
              </motion.div>
              
              <motion.div 
                className="grid grid-cols-2 md:grid-cols-3 gap-x-16 gap-y-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div>
                  <h3 className="font-semibold text-[#243E4D] mb-3">Tools</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/calculator">
                        <motion.span 
                          className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Calculator className="h-4 w-4" />
                          <span>Calculator</span>
                        </motion.span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/visualizations">
                        <motion.span 
                          className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChartBar className="h-4 w-4" />
                          <span>Visualizations</span>
                        </motion.span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/data-import">
                        <motion.span 
                          className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Database className="h-4 w-4" />
                          <span>Data Import</span>
                        </motion.span>
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#243E4D] mb-3">Resources</h3>
                  <ul className="space-y-2">
                    <li>
                      <Link href="/documentation">
                        <motion.span 
                          className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span>Documentation</span>
                        </motion.span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/tutorials">
                        <motion.span 
                          className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span>Tutorials</span>
                        </motion.span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq">
                        <motion.span 
                          className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span>FAQ</span>
                        </motion.span>
                      </Link>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-[#243E4D] mb-3">Contact</h3>
                  <ul className="space-y-2">
                    <li>
                      <motion.a 
                        href="https://www.co.benton.wa.us"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span>County Website</span>
                      </motion.a>
                    </li>
                    <li>
                      <motion.a 
                        href="mailto:contact@bentoncounty.wa.gov"
                        className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span>Email Support</span>
                      </motion.a>
                    </li>
                    <li>
                      <motion.a 
                        href="tel:(509)736-3086"
                        className="text-muted-foreground hover:text-[#47AD55] cursor-pointer flex items-center gap-2"
                        whileHover={{ x: 3 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span>(509) 736-3086</span>
                      </motion.a>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Bottom section with copyright */}
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              © {new Date().getFullYear()} Benton County. All rights reserved.
            </div>
            <div className="mt-3 md:mt-0">
              <ul className="flex gap-6">
                <li><a href="#" className="hover:text-[#47AD55]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#47AD55]">Terms of Use</a></li>
                <li><a href="#" className="hover:text-[#47AD55]">Accessibility</a></li>
              </ul>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}