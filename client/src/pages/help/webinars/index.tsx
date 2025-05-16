import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  Clock, 
  User,
  Calendar,
  ChevronRight,
  FileDown,
  Search,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

// Webinar categories
const categories = [
  "All Webinars",
  "Cost Calculation",
  "Regional Analysis",
  "Property Valuation",
  "Data Quality",
  "AI Agents",
  "Reporting",
  "System Updates"
];

// Detailed webinar data
const webinarData = [
  {
    id: 1,
    title: "Advanced Regional Cost Analysis",
    duration: "45:22",
    date: "May 2, 2025",
    instructor: "Sarah Johnson",
    category: "Regional Analysis",
    level: "Advanced",
    description: "This comprehensive webinar explores advanced techniques for analyzing regional cost variations across Benton County. Learn how to leverage township/range coordinates, hood codes, and TCAs to perform detailed cost comparisons and identify valuation patterns.",
    viewCount: 342,
    tags: ["regional", "cost-analysis", "hood-codes", "township-range"],
    hasQuiz: true
  },
  {
    id: 2,
    title: "Property Data Quality Management",
    duration: "38:15",
    date: "May 10, 2025",
    instructor: "Michael Chen",
    category: "Data Quality",
    level: "Intermediate",
    description: "Learn essential techniques for ensuring data quality in property records. This webinar covers validation methods, data cleaning processes, and how to use the Data Quality Agent to identify and resolve issues with property data integrity.",
    viewCount: 287,
    tags: ["data-quality", "validation", "data-integrity", "quality-agent"],
    hasQuiz: false
  },
  {
    id: 3,
    title: "Working with AI Agents",
    duration: "52:40",
    date: "May 15, 2025",
    instructor: "Dr. Alicia Martinez",
    category: "AI Agents",
    level: "Advanced",
    description: "This in-depth webinar demonstrates how to effectively use the AI agent system for automated analysis and decision support. Learn how to communicate with agents, interpret their outputs, and integrate their recommendations into your valuation workflow.",
    viewCount: 198,
    tags: ["ai", "agents", "automation", "analysis"],
    hasQuiz: true
  },
  {
    id: 4,
    title: "Creating Custom Valuation Reports",
    duration: "41:10",
    date: "May 20, 2025",
    instructor: "Robert Taylor",
    category: "Reporting",
    level: "Intermediate",
    description: "Master the art of creating professional, customized valuation reports. This webinar walks through the process of selecting data points, formatting reports, adding visualizations, and generating PDF outputs for different stakeholders.",
    viewCount: 163,
    tags: ["reports", "pdf", "visualization", "customization"],
    hasQuiz: false
  },
  {
    id: 5,
    title: "2025 System Update Overview",
    duration: "35:45",
    date: "April 28, 2025",
    instructor: "Thomas Wilson",
    category: "System Updates",
    level: "Beginner",
    description: "This webinar provides a complete overview of the 2025 system update, including new features, improved workflows, and changes to the cost matrix data. Learn how these updates improve accuracy and efficiency in property valuations.",
    viewCount: 412,
    tags: ["update", "features", "2025-release", "overview"],
    hasQuiz: false
  },
  {
    id: 6,
    title: "Cost Calculation Fundamentals",
    duration: "48:25",
    date: "May 5, 2025",
    instructor: "Jennifer Park",
    category: "Cost Calculation",
    level: "Beginner",
    description: "A thorough introduction to the fundamentals of cost calculation in the BCBS system. This webinar covers base costs, adjustment factors, depreciation, and the influence of quality factors on final valuations.",
    viewCount: 329,
    tags: ["calculation", "fundamentals", "adjustments", "depreciation"],
    hasQuiz: true
  }
];

const WebinarsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Webinars");
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter webinars based on search and category
  const filteredWebinars = webinarData.filter(webinar => 
    (selectedCategory === "All Webinars" || webinar.category === selectedCategory) &&
    (webinar.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
     webinar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     webinar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-100">Educational Webinars</h1>
          <p className="text-blue-300 mt-1">Learn at your own pace with our comprehensive webinar library</p>
        </div>
        <Link href="/help">
          <Button variant="outline" className="text-blue-200 border-blue-700">
            Back to Help Center
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-blue-900/30 border-blue-800/40 sticky top-6">
            <CardHeader>
              <CardTitle className="text-blue-100">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search webinars..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="space-y-1">
                {categories.map((category) => (
                  <Button 
                    key={category}
                    variant={selectedCategory === category ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      selectedCategory === category 
                        ? "bg-blue-700 hover:bg-blue-600 text-blue-50" 
                        : "text-blue-300 hover:text-blue-200 hover:bg-blue-900/60"
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
              
              <Separator className="my-4 bg-blue-800/40" />
              
              <div>
                <h3 className="text-blue-100 font-medium mb-2">Difficulty Level</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="beginner" className="mr-2 accent-blue-400" />
                    <label htmlFor="beginner" className="text-blue-200">Beginner</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="intermediate" className="mr-2 accent-blue-400" />
                    <label htmlFor="intermediate" className="text-blue-200">Intermediate</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="advanced" className="mr-2 accent-blue-400" />
                    <label htmlFor="advanced" className="text-blue-200">Advanced</label>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4 bg-blue-800/40" />
              
              <div>
                <h3 className="text-blue-100 font-medium mb-2">Duration</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="short" className="mr-2 accent-blue-400" />
                    <label htmlFor="short" className="text-blue-200">Under 30 minutes</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="medium" className="mr-2 accent-blue-400" />
                    <label htmlFor="medium" className="text-blue-200">30-45 minutes</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="long" className="mr-2 accent-blue-400" />
                    <label htmlFor="long" className="text-blue-200">Over 45 minutes</label>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4 bg-blue-800/40" />
              
              <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                <h3 className="text-blue-100 font-medium flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-400" />
                  Upcoming Live Sessions
                </h3>
                <p className="text-blue-300 text-sm mt-1">
                  Join interactive live training sessions with our experts
                </p>
                <Button className="w-full mt-3 bg-blue-700 hover:bg-blue-600">
                  View Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          {selectedCategory !== "All Webinars" && (
            <div className="mb-4">
              <h2 className="text-xl font-medium text-blue-100">{selectedCategory}</h2>
              <p className="text-blue-300">
                {selectedCategory === "Cost Calculation" && "Learn the fundamentals and advanced techniques of building cost calculation."}
                {selectedCategory === "Regional Analysis" && "Understand how to analyze and compare costs across different regions."}
                {selectedCategory === "Property Valuation" && "Master the principles and methods of accurate property valuation."}
                {selectedCategory === "Data Quality" && "Discover best practices for ensuring data integrity and quality."}
                {selectedCategory === "AI Agents" && "Learn how to leverage AI agents for automated analysis and insights."}
                {selectedCategory === "Reporting" && "Create professional reports and visualizations for stakeholders."}
                {selectedCategory === "System Updates" && "Stay current with the latest system features and improvements."}
              </p>
            </div>
          )}
          
          {filteredWebinars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredWebinars.map((webinar) => (
                <Card 
                  key={webinar.id}
                  className="bg-blue-900/30 border-blue-800/40 overflow-hidden hover:border-blue-700/60 transition-colors"
                >
                  <div className="aspect-video bg-blue-950 relative flex items-center justify-center">
                    <Play className="h-12 w-12 text-blue-500/70 absolute" />
                    <div className="absolute bottom-2 right-2 bg-blue-900/80 text-blue-200 text-xs px-2 py-1 rounded">
                      {webinar.duration}
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge className={
                        webinar.level === 'Beginner' ? 'bg-green-600/50 hover:bg-green-600/70' :
                        webinar.level === 'Intermediate' ? 'bg-blue-600/50 hover:bg-blue-600/70' :
                        'bg-purple-600/50 hover:bg-purple-600/70'
                      }>
                        {webinar.level}
                      </Badge>
                    </div>
                    {webinar.hasQuiz && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="border-blue-700/50 text-blue-200">
                          Quiz
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="text-blue-100 font-medium">{webinar.title}</h3>
                    <p className="text-blue-400 text-sm mt-1 line-clamp-2">
                      {webinar.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3 text-xs text-blue-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{webinar.date}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        <span>{webinar.instructor}</span>
                      </div>
                    </div>
                    
                    <Link href={`/help/webinars/${webinar.id}`}>
                      <Button className="w-full mt-3 bg-blue-700 hover:bg-blue-600">
                        Watch Webinar
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-blue-900/20 rounded-lg border border-blue-800/40">
              <BookOpen className="h-12 w-12 text-blue-700/50 mx-auto mb-3" />
              <h2 className="text-lg font-medium text-blue-100">No Webinars Found</h2>
              <p className="text-blue-300 mt-1">
                Try adjusting your search or category filters to find more content.
              </p>
              <Button 
                variant="outline" 
                className="mt-4 border-blue-700 text-blue-200"
                onClick={() => {
                  setSelectedCategory("All Webinars");
                  setSearchTerm('');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
          
          {selectedCategory !== "All Webinars" && (
            <div className="mt-6 bg-blue-900/30 p-5 rounded-lg border border-blue-800/40">
              <h3 className="text-lg font-medium text-blue-100 mb-3">Key Concepts in {selectedCategory}</h3>
              
              {selectedCategory === "Cost Calculation" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Base Cost Principles</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Understanding how base costs are determined for different building types and how they serve as the foundation for all valuation calculations.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Adjustment Factors</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Learn how quality, condition, age, and regional factors affect the final valuation through multiplicative adjustment factors.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Depreciation Models</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Explore different depreciation calculation methods and how they account for physical, functional, and economic obsolescence.
                    </p>
                  </div>
                </div>
              )}
              
              {selectedCategory === "Regional Analysis" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Geographic Identifiers</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Understanding the different region identification systems used in Benton County, including township/range coordinates, hood codes, and TCAs.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Regional Cost Variations</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Analyze how and why construction costs vary between different areas of the county based on economic factors and market conditions.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Comparative Analysis</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Learn techniques for comparing costs across multiple regions to identify patterns and outliers in valuation data.
                    </p>
                  </div>
                </div>
              )}
              
              {selectedCategory === "Data Quality" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Validation Rules</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Understanding the system's data validation rules and how they ensure accuracy and consistency in property records.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Data Cleaning Processes</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Learn systematic approaches to identifying and correcting errors, inconsistencies, and missing values in property data.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Quality Metrics</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Explore the key metrics used to measure data quality and how to interpret quality scores for different data sets.
                    </p>
                  </div>
                </div>
              )}
              
              {selectedCategory === "AI Agents" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Agent Capabilities</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Understanding the specific capabilities of each AI agent in the system and which tasks they're optimized to perform.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Command Syntax</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Learn the proper syntax for communicating with agents and how to structure requests for optimal results.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Integration Methods</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Explore how to integrate agent outputs into your workflow and combine insights from multiple agents.
                    </p>
                  </div>
                </div>
              )}
              
              {(selectedCategory !== "Cost Calculation" && 
                selectedCategory !== "Regional Analysis" && 
                selectedCategory !== "Data Quality" && 
                selectedCategory !== "AI Agents") && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Core Principles</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Understanding the fundamental concepts and best practices in {selectedCategory.toLowerCase()}.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Advanced Techniques</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Learn specialized methods and approaches for complex {selectedCategory.toLowerCase()} scenarios.
                    </p>
                  </div>
                  <div className="bg-blue-900/40 p-3 rounded-md border border-blue-800/50">
                    <h4 className="text-blue-100 font-medium">Practical Applications</h4>
                    <p className="text-blue-300 text-sm mt-1">
                      Explore real-world applications and case studies demonstrating effective {selectedCategory.toLowerCase()} strategies.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 bg-blue-900/30 p-5 rounded-lg border border-blue-800/40">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-medium text-blue-100">Need specialized training?</h3>
                <p className="text-blue-300 mt-1">Request personalized training sessions for your team</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button className="flex-1 md:flex-auto bg-blue-700 hover:bg-blue-600">
                  Request Training
                </Button>
                <Button variant="outline" className="flex-1 md:flex-auto border-blue-700 text-blue-200">
                  <FileDown className="mr-2 h-4 w-4" />
                  Training Catalog
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebinarsPage;