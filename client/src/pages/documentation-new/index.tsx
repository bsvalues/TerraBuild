import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  Code, 
  Settings, 
  Building, 
  Map,
  Database,
  Info,
  Calculator,
  Download,
  Upload,
  Search,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle,
  FileCode,
  Server,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Documentation sections for quick navigation
const docSections = [
  { id: 'overview', name: 'System Overview', icon: Info },
  { id: 'calculator', name: 'Cost Calculator', icon: Calculator },
  { id: 'regions', name: 'Geographic Regions', icon: Map },
  { id: 'matrix', name: 'Cost Matrix', icon: Database },
  { id: 'properties', name: 'Property Management', icon: Building },
  { id: 'reports', name: 'Reports & Analysis', icon: FileText },
  { id: 'import', name: 'Data Import', icon: Upload },
  { id: 'agents', name: 'AI Agents', icon: Server },
  { id: 'api', name: 'API Reference', icon: Code },
  { id: 'config', name: 'Configuration', icon: Settings },
];

const DocumentationPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Documentation</h1>
        <Button variant="outline" className="text-blue-200 border-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-800/50">
            <Info className="h-4 w-4 mr-2" />
            System Overview
          </TabsTrigger>
          <TabsTrigger value="user" className="data-[state=active]:bg-blue-800/50">
            <BookOpen className="h-4 w-4 mr-2" />
            User Guides
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-blue-800/50">
            <Code className="h-4 w-4 mr-2" />
            API Reference
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-blue-800/50">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Benton County Building Cost Assessment System</CardTitle>
              <CardDescription className="text-blue-300">
                Overview of the TerraBuild system for property valuation and cost assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <p className="text-blue-200">
                The Benton County Building Cost Assessment System (BCBS) is a comprehensive platform for
                property valuation, cost estimation, and assessment management. This documentation provides
                detailed information about the system's features, usage, and configuration.
              </p>
              
              <h2 className="text-blue-100 text-xl mt-6">Key Features</h2>
              <ul className="text-blue-300 mt-2 space-y-1">
                <li>Accurate building cost calculations based on regional cost factors</li>
                <li>Property record management and visualization</li>
                <li>Advanced region-based cost matrix system</li>
                <li>Data quality validation and enhancement</li>
                <li>Historical trend analysis and reporting</li>
                <li>Comprehensive audit trail and version control</li>
                <li>AI-powered insights and recommendations</li>
                <li>Intelligent agent system for automation and analysis</li>
              </ul>
              
              <h2 className="text-blue-100 text-xl mt-6">System Architecture</h2>
              <p className="text-blue-200">
                The system is built on a modern technology stack using React for the frontend and 
                Node.js/Express for the backend, with PostgreSQL as the database. The architecture follows
                a modular design pattern that allows for easy extensions and customizations.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-blue-900/40 p-4 rounded-md border border-blue-800/50">
                  <h3 className="text-blue-100 font-medium flex items-center">
                    <Calculator className="h-4 w-4 mr-2 text-blue-400" />
                    Cost Assessment Module
                  </h3>
                  <p className="text-blue-300 text-sm mt-1">
                    Handles cost calculations, region-specific adjustments, and 
                    valuation algorithms based on Benton County's standards.
                  </p>
                </div>
                
                <div className="bg-blue-900/40 p-4 rounded-md border border-blue-800/50">
                  <h3 className="text-blue-100 font-medium flex items-center">
                    <Map className="h-4 w-4 mr-2 text-blue-400" />
                    Region Management Module
                  </h3>
                  <p className="text-blue-300 text-sm mt-1">
                    Manages geographic regions, hood codes, township/range coordinates,
                    and tax code areas for accurate regional cost adjustments.
                  </p>
                </div>
                
                <div className="bg-blue-900/40 p-4 rounded-md border border-blue-800/50">
                  <h3 className="text-blue-100 font-medium flex items-center">
                    <Server className="h-4 w-4 mr-2 text-blue-400" />
                    AI Agent Framework
                  </h3>
                  <p className="text-blue-300 text-sm mt-1">
                    Intelligent agents for data analysis, quality control, compliance checks,
                    and automated insights generation.
                  </p>
                </div>
              </div>
              
              <h2 className="text-blue-100 text-xl mt-6">System Requirements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
                <div>
                  <h3 className="text-blue-100 font-medium">Server Requirements</h3>
                  <ul className="text-blue-300 text-sm mt-1 space-y-1">
                    <li>Node.js v16+ runtime environment</li>
                    <li>PostgreSQL 14+ database</li>
                    <li>4GB RAM minimum (8GB recommended)</li>
                    <li>20GB storage space</li>
                    <li>Internet connectivity for data updates</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-blue-100 font-medium">Client Requirements</h3>
                  <ul className="text-blue-300 text-sm mt-1 space-y-1">
                    <li>Modern web browser (Chrome, Firefox, Edge, Safari)</li>
                    <li>1366x768 minimum screen resolution</li>
                    <li>JavaScript enabled</li>
                    <li>Cookies enabled for authentication</li>
                  </ul>
                </div>
              </div>
              
              <h2 className="text-blue-100 text-xl mt-6">Version Information</h2>
              <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/50 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-300 text-sm">Current Version</p>
                    <p className="text-blue-100">2.5.0</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-sm">Release Date</p>
                    <p className="text-blue-100">May 14, 2025</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-sm">Build ID</p>
                    <p className="text-blue-100">BC-BCBS-250-20250514</p>
                  </div>
                  <div>
                    <p className="text-blue-300 text-sm">Data Version</p>
                    <p className="text-blue-100">2025.1</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="user" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-blue-900/30 border-blue-800/40 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-blue-100">User Guides</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                    <Input
                      placeholder="Search documentation..."
                      className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    {docSections.map((section) => (
                      <Button 
                        key={section.id}
                        variant="ghost" 
                        className="w-full justify-start text-blue-300 hover:text-blue-200 hover:bg-blue-900/60"
                      >
                        <section.icon className="h-4 w-4 mr-2" />
                        {section.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-blue-900/30 border-blue-800/40">
                <CardHeader>
                  <div className="flex items-center">
                    <Calculator className="h-5 w-5 mr-2 text-blue-300" />
                    <CardTitle className="text-blue-100">Building Cost Calculator Guide</CardTitle>
                  </div>
                  <CardDescription className="text-blue-300">
                    Learn how to use the building cost calculator for accurate property valuations
                  </CardDescription>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  <p className="text-blue-200">
                    The Building Cost Calculator provides accurate cost estimations based on the Benton County
                    Building Cost Standards (BCBS). This tool uses regional cost data, improvement type, quality factors,
                    and more to provide precise valuations.
                  </p>
                  
                  <h2 className="text-blue-100 text-xl mt-6">Using the Calculator</h2>
                  <ol className="text-blue-300 mt-2 space-y-2">
                    <li>
                      <span className="text-blue-200 font-medium">Select a geographic region</span>
                      <p className="text-blue-300 text-sm mt-1">
                        Choose the appropriate region using township/range, hood code, or TCA identifier to apply 
                        region-specific cost factors. The system supports multiple region identification systems.
                      </p>
                    </li>
                    <li>
                      <span className="text-blue-200 font-medium">Choose the building type and improvement category</span>
                      <p className="text-blue-300 text-sm mt-1">
                        Select from residential, commercial, industrial, or other property types, then specify the 
                        improvement category that best describes the structure.
                      </p>
                    </li>
                    <li>
                      <span className="text-blue-200 font-medium">Enter property details</span>
                      <p className="text-blue-300 text-sm mt-1">
                        Provide specific measurements including square footage, number of stories, year built, and 
                        other relevant dimensions.
                      </p>
                    </li>
                    <li>
                      <span className="text-blue-200 font-medium">Adjust quality and condition factors</span>
                      <p className="text-blue-300 text-sm mt-1">
                        Set the appropriate quality grade (economy to premium) and condition rating (poor to excellent) 
                        to refine the valuation.
                      </p>
                    </li>
                    <li>
                      <span className="text-blue-200 font-medium">Review the calculation</span>
                      <p className="text-blue-300 text-sm mt-1">
                        Examine the calculated valuation, including base cost, all applied adjustments, and the 
                        confidence score indicating reliability.
                      </p>
                    </li>
                  </ol>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/50 my-6">
                    <div className="flex">
                      <HelpCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Quality Factor Reference</h3>
                        <p className="text-blue-300 text-sm mt-1 mb-3">
                          The quality factor represents the overall construction quality, affecting the base cost:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-200">Premium (A+)</span>
                            <span className="text-blue-300">×1.40-1.60</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Excellent (A)</span>
                            <span className="text-blue-300">×1.20-1.39</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Good (B)</span>
                            <span className="text-blue-300">×1.05-1.19</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Average (C)</span>
                            <span className="text-blue-300">×0.95-1.04</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Fair (D)</span>
                            <span className="text-blue-300">×0.80-0.94</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-200">Economy (E)</span>
                            <span className="text-blue-300">×0.65-0.79</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-blue-100 text-xl mt-6">Advanced Features</h2>
                  <p className="text-blue-200 mt-2">
                    The calculator includes several advanced features for specialized valuation scenarios:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-900/30 p-4 rounded-md border border-blue-800/40">
                      <h3 className="text-blue-100 font-medium flex items-center">
                        <Map className="h-4 w-4 mr-2 text-blue-400" />
                        Multi-Region Comparisons
                      </h3>
                      <p className="text-blue-300 text-sm mt-1">
                        Compare cost valuations across different regions to identify the impact of location on property values.
                      </p>
                    </div>
                    
                    <div className="bg-blue-900/30 p-4 rounded-md border border-blue-800/40">
                      <h3 className="text-blue-100 font-medium flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-blue-400" />
                        Historical Valuations
                      </h3>
                      <p className="text-blue-300 text-sm mt-1">
                        Calculate property values using historical cost data from previous years for trend analysis.
                      </p>
                    </div>
                    
                    <div className="bg-blue-900/30 p-4 rounded-md border border-blue-800/40">
                      <h3 className="text-blue-100 font-medium flex items-center">
                        <ChevronRight className="h-4 w-4 mr-2 text-blue-400" />
                        Depreciation Projections
                      </h3>
                      <p className="text-blue-300 text-sm mt-1">
                        Project future property values by applying standard or custom depreciation schedules.
                      </p>
                    </div>
                    
                    <div className="bg-blue-900/30 p-4 rounded-md border border-blue-800/40">
                      <h3 className="text-blue-100 font-medium flex items-center">
                        <Building className="h-4 w-4 mr-2 text-blue-400" />
                        Improvement-Specific Modifications
                      </h3>
                      <p className="text-blue-300 text-sm mt-1">
                        Apply specific adjustments for unique features or improvements not covered by standard factors.
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-blue-300 mt-6">Last updated: May 10, 2025</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t border-blue-800/40 pt-6">
                  <Button variant="outline" className="text-blue-300 border-blue-700">
                    Previous: System Overview
                  </Button>
                  <Button className="bg-blue-700 hover:bg-blue-600">
                    Next: Geographic Regions
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-blue-900/30 border-blue-800/40 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-blue-100">API Reference</CardTitle>
                  <CardDescription className="text-blue-300">
                    Technical documentation for the TerraBuild API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-4">
                    <Input
                      placeholder="Search API endpoints..."
                      className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                    />
                  </div>
                
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="authentication" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Authentication
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/auth/login</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/auth/refresh</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/auth/logout</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="properties" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Properties
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/properties</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/properties/:id</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/properties</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">PUT /api/properties/:id</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">DELETE /api/properties/:id</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="cost-matrix" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Cost Matrix
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/cost-matrix</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/cost-matrix/:id</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/cost-matrix</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">PUT /api/cost-matrix/:id</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="regions" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Regions
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/regions</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/regions/:id</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/regions/search</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="calculator" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Calculator
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/calculate</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/cost-factors</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="reports" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Reports
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/reports/generate</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/reports</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/reports/:id</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="agents" className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-200 hover:text-blue-100 hover:no-underline">
                        Agents
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-300">
                        <div className="space-y-1.5">
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/agents</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">GET /api/agents/:id</Button>
                          <Button variant="link" className="p-0 h-auto text-blue-400 hover:text-blue-300 justify-start">POST /api/agents/:id/tasks</Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-blue-900/30 border-blue-800/40">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="mb-2 bg-green-900/50 text-green-400 hover:bg-green-900/70">POST</Badge>
                      <CardTitle className="text-blue-100">/api/calculate</CardTitle>
                      <CardDescription className="text-blue-300">
                        Calculate building cost assessment based on property details
                      </CardDescription>
                    </div>
                    <Button variant="outline" className="text-blue-300 border-blue-700">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Try It
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-blue-100 font-medium mb-2">Description</h3>
                      <p className="text-blue-300">
                        This endpoint performs a comprehensive building cost calculation based on the property details, 
                        region, and other factors provided in the request. The calculation uses the current cost matrix
                        data and applies regional and quality adjustments.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-blue-100 font-medium mb-2">Request Parameters</h3>
                      <div className="rounded-md border border-blue-800/40 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-blue-900/50">
                            <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                              <TableHead className="text-blue-300 w-1/4">Parameter</TableHead>
                              <TableHead className="text-blue-300 w-1/6">Type</TableHead>
                              <TableHead className="text-blue-300 w-1/6">Required</TableHead>
                              <TableHead className="text-blue-300">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">buildingType</TableCell>
                              <TableCell className="text-blue-300">string</TableCell>
                              <TableCell className="text-blue-300">Yes</TableCell>
                              <TableCell className="text-blue-300">
                                Type of building (e.g., "residential", "commercial", "industrial")
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">region</TableCell>
                              <TableCell className="text-blue-300">string</TableCell>
                              <TableCell className="text-blue-300">Yes</TableCell>
                              <TableCell className="text-blue-300">
                                Region identifier (hood code, township/range, or TCA)
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">squareFootage</TableCell>
                              <TableCell className="text-blue-300">number</TableCell>
                              <TableCell className="text-blue-300">Yes</TableCell>
                              <TableCell className="text-blue-300">
                                Total square footage of the building
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">quality</TableCell>
                              <TableCell className="text-blue-300">string</TableCell>
                              <TableCell className="text-blue-300">Yes</TableCell>
                              <TableCell className="text-blue-300">
                                Quality grade of the building (e.g., "excellent", "good", "average", "fair", "poor")
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">yearBuilt</TableCell>
                              <TableCell className="text-blue-300">number</TableCell>
                              <TableCell className="text-blue-300">Yes</TableCell>
                              <TableCell className="text-blue-300">
                                Year the building was constructed
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-blue-100 font-medium mb-2">Example Request</h3>
                        <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/40 font-mono text-sm text-blue-200 overflow-auto">
                          <pre>{`POST /api/calculate HTTP/1.1
Host: api.bcbs.bentoncounty.gov
Content-Type: application/json
Authorization: Bearer {token}

{
  "buildingType": "residential",
  "region": "52100 100",
  "squareFootage": 2400,
  "quality": "good",
  "yearBuilt": 2010,
  "stories": 2,
  "condition": "good",
  "features": [
    "basement",
    "attached_garage"
  ]
}`}</pre>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-blue-100 font-medium mb-2">Example Response</h3>
                        <div className="bg-blue-900/20 p-3 rounded-md border border-blue-800/40 font-mono text-sm text-blue-200 overflow-auto">
                          <pre>{`HTTP/1.1 200 OK
Content-Type: application/json

{
  "calculationId": "calc-2025-05-16-12345",
  "timestamp": "2025-05-16T19:42:15Z",
  "result": {
    "totalValue": 425800,
    "perSquareFootValue": 177.42,
    "components": {
      "baseValue": 380000,
      "qualityAdjustment": 45600,
      "ageAdjustment": -28500,
      "regionAdjustment": 22800,
      "featureAdjustments": 5900
    },
    "confidenceScore": 0.92,
    "regionInfo": {
      "code": "52100 100",
      "name": "Richland",
      "factor": 1.06
    }
  }
}`}</pre>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-blue-100 font-medium mb-2">Response Codes</h3>
                      <div className="rounded-md border border-blue-800/40 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-blue-900/50">
                            <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                              <TableHead className="text-blue-300 w-1/6">Code</TableHead>
                              <TableHead className="text-blue-300">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">200</TableCell>
                              <TableCell className="text-blue-300">
                                Success. Returns the calculation result.
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">400</TableCell>
                              <TableCell className="text-blue-300">
                                Bad Request. Missing or invalid parameters.
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">401</TableCell>
                              <TableCell className="text-blue-300">
                                Unauthorized. Authentication required.
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">404</TableCell>
                              <TableCell className="text-blue-300">
                                Not Found. Region or building type not found in the system.
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">500</TableCell>
                              <TableCell className="text-blue-300">
                                Internal Server Error. An unexpected error occurred.
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Card className="bg-blue-900/30 border-blue-800/40 sticky top-6">
                <CardHeader>
                  <CardTitle className="text-blue-100">Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      System Requirements
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Installation Guide
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Database Setup
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Authentication Configuration
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Cost Matrix Configuration
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Reporting Setup
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Agent Configuration
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      LDAP Integration
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start">
                      Email Settings
                    </Button>
                    <Button variant="link" className="text-blue-300 hover:text-blue-200 p-0 h-auto justify-start font-medium">
                      Environment Variables
                    </Button>
                    <Button variant="link" className="text-cyan-300 hover:text-cyan-200 p-0 h-auto justify-start">
                      Performance Tuning
                    </Button>
                    <Button variant="link" className="text-cyan-300 hover:text-cyan-200 p-0 h-auto justify-start">
                      Backup and Recovery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-3 space-y-6">
              <Card className="bg-cyan-900/30 border-cyan-800/40">
                <CardHeader>
                  <CardTitle className="text-cyan-100">Environment Variables</CardTitle>
                  <CardDescription className="text-cyan-300">
                    Configuration options that can be set through environment variables
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-cyan-100 text-lg mb-2">Overview</h2>
                      <p className="text-cyan-200">
                        The TerraFusion application uses environment variables for configuration to simplify deployment
                        across different environments. These variables can be set in a .env file or through your
                        deployment platform's environment configuration.
                      </p>
                    </div>
                    
                    <div>
                      <h2 className="text-cyan-100 text-lg mb-2">Database Configuration</h2>
                      
                      <div className="rounded-md border border-cyan-800/40 overflow-hidden mb-4">
                        <Table>
                          <TableHeader className="bg-cyan-900/50">
                            <TableRow className="hover:bg-cyan-900/60 border-cyan-800/60">
                              <TableHead className="text-cyan-300 w-1/4">Variable</TableHead>
                              <TableHead className="text-cyan-300 w-1/4">Default</TableHead>
                              <TableHead className="text-cyan-300">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="hover:bg-cyan-900/40 border-cyan-800/40">
                              <TableCell className="font-medium text-cyan-200">DATABASE_URL</TableCell>
                              <TableCell className="text-cyan-300">None (Required)</TableCell>
                              <TableCell className="text-cyan-300">
                                PostgreSQL connection string
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-cyan-900/40 border-cyan-800/40">
                              <TableCell className="font-medium text-cyan-200">DATABASE_POOL_SIZE</TableCell>
                              <TableCell className="text-cyan-300">10</TableCell>
                              <TableCell className="text-cyan-300">
                                Maximum number of database connections in the pool
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">DATABASE_IDLE_TIMEOUT</TableCell>
                              <TableCell className="text-blue-300">30000</TableCell>
                              <TableCell className="text-blue-300">
                                Idle timeout for database connections in milliseconds
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                        <h3 className="text-blue-100 font-medium flex items-center mb-2">
                          <Database className="h-4 w-4 mr-2 text-blue-400" />
                          Example Database Configuration
                        </h3>
                        <div className="font-mono text-sm text-blue-200">
                          <pre>{`# PostgreSQL Connection
DATABASE_URL=postgresql://user:password@localhost:5432/bcbs
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=60000`}</pre>
                        </div>
                      </div>
                    </div>
                    
                    <Separator className="bg-blue-800/40" />
                    
                    <div>
                      <h2 className="text-blue-100 text-lg mb-2">Agent System Configuration</h2>
                      
                      <div className="rounded-md border border-blue-800/40 overflow-hidden mb-4">
                        <Table>
                          <TableHeader className="bg-blue-900/50">
                            <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                              <TableHead className="text-blue-300 w-1/4">Variable</TableHead>
                              <TableHead className="text-blue-300 w-1/4">Default</TableHead>
                              <TableHead className="text-blue-300">Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">ENABLE_AGENTS</TableCell>
                              <TableCell className="text-blue-300">true</TableCell>
                              <TableCell className="text-blue-300">
                                Enable the agent system
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">AGENT_POLL_INTERVAL</TableCell>
                              <TableCell className="text-blue-300">5000</TableCell>
                              <TableCell className="text-blue-300">
                                Agent polling interval in milliseconds
                              </TableCell>
                            </TableRow>
                            <TableRow className="hover:bg-blue-900/40 border-blue-800/40">
                              <TableCell className="font-medium text-blue-200">MAX_CONCURRENT_TASKS</TableCell>
                              <TableCell className="text-blue-300">5</TableCell>
                              <TableCell className="text-blue-300">
                                Maximum number of concurrent agent tasks
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                        <h3 className="text-blue-100 font-medium flex items-center mb-2">
                          <Server className="h-4 w-4 mr-2 text-blue-400" />
                          Example Agent Configuration
                        </h3>
                        <div className="font-mono text-sm text-blue-200">
                          <pre>{`# Agent System Settings
ENABLE_AGENTS=true
AGENT_POLL_INTERVAL=5000
MAX_CONCURRENT_TASKS=10
TASK_TIMEOUT=60000

# Agent-specific settings
ENABLE_DATA_QUALITY_AGENT=true
ENABLE_COST_ANALYSIS_AGENT=true`}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DocumentationPage;