import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'wouter';
import { 
  HelpCircle, 
  LifeBuoy, 
  FileQuestion, 
  MessageSquare, 
  Phone,
  Mail,
  BookOpen,
  Clock,
  User,
  Search,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle,
  Video,
  ExternalLink,
  Info,
  Send,
  Play,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Common FAQs
const faqs = [
  {
    question: "How do I reset my password?",
    answer: "To reset your password, click on the 'Forgot Password' link on the login page. You'll receive an email with instructions to create a new password. County employees using Single Sign-On should contact their IT department for password resets."
  },
  {
    question: "Why are some regions showing different cost values?",
    answer: "Cost values vary by region due to local market conditions, material availability, labor rates, and other economic factors. The system uses region-specific cost adjustment factors derived from Benton County's cost matrix data to provide the most accurate valuations."
  },
  {
    question: "How often is the cost data updated?",
    answer: "The cost matrix data is typically updated quarterly, with a major annual update in January. However, special updates may be released as needed in response to significant market changes or to incorporate new construction types or improvement categories."
  },
  {
    question: "Can I export reports for offline use?",
    answer: "Yes, all reports can be exported in various formats including PDF, Excel, and CSV. To export a report, navigate to the Reports section, generate your report, and click the 'Export' button in the top-right corner of the report view."
  },
  {
    question: "How do I interpret the confidence score in calculations?",
    answer: "The confidence score (0-1.0) indicates the system's certainty in the calculation based on data quality, completeness, and the predictability of the property type. Scores above 0.85 indicate high confidence, 0.7-0.85 indicate moderate confidence, and below 0.7 suggest manual review may be beneficial."
  },
  {
    question: "What does the 'quality factor' mean in the calculator?",
    answer: "The quality factor represents the overall construction quality of a building, ranging from 'Economy' to 'Premium'. It affects the base cost by applying a multiplier that accounts for construction materials, workmanship, and amenities typical for each quality level."
  },
  {
    question: "How can I see historical valuation data for a property?",
    answer: "To view historical valuation data, navigate to the Property Details page for the specific property, then select the 'History' tab. This will display all previous valuations, when they were performed, and any significant changes in value."
  },
  {
    question: "Why do I see different region identifiers for the same location?",
    answer: "Benton County uses multiple region identification systems including township/range coordinates, hood codes, and tax code areas (TCAs). Each system serves different administrative purposes, but the calculator can work with any of these identifiers."
  },
  {
    question: "What should I do if I find incorrect property data?",
    answer: "If you discover incorrect property data, use the 'Report Data Issue' feature available on each property details page. Provide as much information as possible about the discrepancy, and it will be reviewed by a data quality specialist."
  },
  {
    question: "Can I use the system on my mobile device?",
    answer: "Yes, the system is designed to be responsive and works on mobile devices including smartphones and tablets. However, for complex operations like bulk data imports or detailed report generation, a desktop interface is recommended."
  }
];

// Tutorial topics
const tutorials = [
  {
    id: 1,
    title: "Getting Started with TerraBuild",
    duration: "5:42",
    level: "Beginner",
    views: 342,
    thumbnail: "/tutorial-1.jpg",
    description: "A complete overview of the interface and basic functionality.",
    date: "May 6, 2025"
  },
  {
    id: 2,
    title: "Advanced Cost Calculations",
    duration: "8:15",
    level: "Advanced",
    views: 187,
    thumbnail: "/tutorial-2.jpg",
    description: "Deep dive into complex valuation scenarios and adjustments.",
    date: "May 10, 2025"
  },
  {
    id: 3,
    title: "Working with Regions and Maps",
    duration: "6:30",
    level: "Intermediate",
    views: 245,
    thumbnail: "/tutorial-3.jpg",
    description: "Understanding geographic data and regional identifiers.",
    date: "May 12, 2025"
  },
  {
    id: 4,
    title: "Creating Custom Reports",
    duration: "7:22",
    level: "Intermediate",
    views: 163,
    thumbnail: "/tutorial-4.jpg",
    description: "Learn to generate and customize assessment reports.",
    date: "May 15, 2025"
  },
  {
    id: 5,
    title: "Data Import Essentials",
    duration: "9:18",
    level: "Advanced",
    views: 128,
    thumbnail: "/tutorial-5.jpg",
    description: "Step-by-step guide to importing and validating data.",
    date: "May 20, 2025"
  },
  {
    id: 6,
    title: "Using AI Agents for Analysis",
    duration: "11:05",
    level: "Advanced",
    views: 198,
    thumbnail: "/tutorial-6.jpg",
    description: "Leverage intelligent agents for deeper property insights.",
    date: "May 22, 2025"
  }
];

const HelpSupportPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  
  // Filter FAQs based on search
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle form submission
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send the data to a backend API
    alert('Your message has been sent. Our support team will contact you shortly.');
    setContactName('');
    setContactEmail('');
    setContactSubject('');
    setContactMessage('');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Help & Support</h1>
        <Button variant="outline" className="text-blue-200 border-blue-700">
          <Phone className="mr-2 h-4 w-4" />
          Contact Support
        </Button>
      </div>
      
      <Tabs defaultValue="faq" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="faq" className="data-[state=active]:bg-blue-800/50">
            <FileQuestion className="h-4 w-4 mr-2" />
            Frequently Asked Questions
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="data-[state=active]:bg-blue-800/50">
            <Video className="h-4 w-4 mr-2" />
            Video Tutorials
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-blue-800/50">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Support
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-blue-800/50">
            <BookOpen className="h-4 w-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Frequently Asked Questions</CardTitle>
              <CardDescription className="text-blue-300">
                Find answers to common questions about the Benton County Building Cost Assessment System.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search questions..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-blue-800/40">
                      <AccordionTrigger className="text-blue-100 hover:text-blue-50 hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-blue-200">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-blue-700/50 mx-auto mb-2" />
                    <p className="text-blue-300">No questions found matching your search.</p>
                    <p className="text-blue-400 text-sm mt-1">Try different keywords or contact support for assistance.</p>
                  </div>
                )}
              </Accordion>
              
              <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40 mt-6">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-blue-100 font-medium">Need more help?</h3>
                    <p className="text-blue-300 text-sm mt-1">
                      If you couldn't find what you're looking for, please contact our support team for assistance.
                    </p>
                    <Button className="mt-2 bg-blue-700 hover:bg-blue-600">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact Support
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tutorials" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Video Tutorials</CardTitle>
              <CardDescription className="text-blue-300">
                Learn how to use the system through step-by-step video demonstrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutorials.map((tutorial) => (
                  <div 
                    key={tutorial.id}
                    className="bg-blue-900/20 rounded-md border border-blue-800/40 overflow-hidden"
                  >
                    <div className="aspect-video bg-blue-950 relative flex items-center justify-center">
                      <Play className="h-10 w-10 text-blue-500/70 absolute" />
                      <div className="absolute bottom-2 right-2 bg-blue-900/80 text-blue-200 text-xs px-2 py-1 rounded">
                        {tutorial.duration}
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={
                          tutorial.level === 'Beginner' ? 'bg-green-600/50 hover:bg-green-600/70' :
                          tutorial.level === 'Intermediate' ? 'bg-blue-600/50 hover:bg-blue-600/70' :
                          'bg-purple-600/50 hover:bg-purple-600/70'
                        }>
                          {tutorial.level}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-blue-100 font-medium">{tutorial.title}</h3>
                      <p className="text-blue-400 text-sm mt-1">
                        {tutorial.description}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-blue-500">
                        <span>{tutorial.date}</span>
                        <span>{tutorial.views} views</span>
                      </div>
                      <Button className="w-full mt-3 bg-blue-700 hover:bg-blue-600">
                        Watch Tutorial
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/help/webinars">
                  <Button variant="outline" className="border-blue-700 text-blue-200">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View All Tutorials
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Contact Support</CardTitle>
              <CardDescription className="text-blue-300">
                Get help from our technical support team. We typically respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-blue-200">Full Name</Label>
                        <Input 
                          id="name" 
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Your name" 
                          className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-blue-200">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="your.email@example.com" 
                          className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-blue-200">Subject</Label>
                      <Input 
                        id="subject" 
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Brief description of your issue" 
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-blue-200">Message</Label>
                      <Textarea 
                        id="message" 
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Describe your issue in detail..." 
                        className="min-h-[150px] bg-blue-900/50 border-blue-700/50 text-blue-100"
                        required
                      />
                    </div>
                    
                    <div className="text-blue-300 text-sm">
                      <p>
                        Please include relevant details such as error messages, steps to reproduce the issue,
                        and any screenshots if applicable.
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-700 hover:bg-blue-600">
                        <Send className="mr-2 h-4 w-4" />
                        Submit Support Request
                      </Button>
                    </div>
                  </form>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <h3 className="text-blue-100 font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-blue-400" />
                      Support Hours
                    </h3>
                    <div className="mt-2 space-y-2 text-blue-300">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span>8:00 AM - 5:00 PM PT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span>9:00 AM - 1:00 PM PT</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span>Closed</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <h3 className="text-blue-100 font-medium flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-blue-400" />
                      Phone Support
                    </h3>
                    <p className="mt-2 text-blue-300">
                      Technical Support:<br />
                      <span className="text-blue-100">(509) 555-0123</span>
                    </p>
                    <p className="mt-2 text-blue-300">
                      General Inquiries:<br />
                      <span className="text-blue-100">(509) 555-0145</span>
                    </p>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <h3 className="text-blue-100 font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-400" />
                      Email Support
                    </h3>
                    <p className="mt-2 text-blue-300">
                      Technical Support:<br />
                      <span className="text-blue-100">support@bcbs.bentoncounty.gov</span>
                    </p>
                    <p className="mt-2 text-blue-300">
                      Training Requests:<br />
                      <span className="text-blue-100">training@bcbs.bentoncounty.gov</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Support Resources</CardTitle>
              <CardDescription className="text-blue-300">
                Additional resources to help you get the most out of the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-blue-100 text-lg font-medium">Documentation</h2>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">User Manual</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Comprehensive guide to all system features and functionality.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 border-blue-700 text-blue-200">
                          <FileDown className="mr-2 h-3 w-3" />
                          Download PDF (12.5 MB)
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Quick Start Guide</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Get up and running with the basics in 15 minutes.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 border-blue-700 text-blue-200">
                          <FileDown className="mr-2 h-3 w-3" />
                          Download PDF (3.2 MB)
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">API Documentation</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Technical reference for developers integrating with the system.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 border-blue-700 text-blue-200">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View Online
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Regional Code Reference</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Complete listing of all Benton County region codes and mappings.
                        </p>
                        <Button variant="outline" size="sm" className="mt-2 border-blue-700 text-blue-200">
                          <FileDown className="mr-2 h-3 w-3" />
                          Download Excel (2.8 MB)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-blue-100 text-lg font-medium">Training & Support</h2>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Schedule Training</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Request personalized training sessions for your team.
                        </p>
                        <Button className="mt-2 bg-blue-700 hover:bg-blue-600">
                          Request Training
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <MessageSquare className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Community Forum</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Connect with other users to share tips and solutions.
                        </p>
                        <Button variant="outline" className="mt-2 border-blue-700 text-blue-200">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          Visit Forum
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <BookOpen className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Educational Webinars</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Recorded webinars on advanced topics and best practices.
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-200">Advanced Regional Cost Analysis</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">
                              Watch <Play className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-200">Property Data Quality Management</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">
                              Watch <Play className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-200">Working with AI Agents</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">
                              Watch <Play className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">Release Notes</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Stay informed about the latest features and improvements.
                        </p>
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-200">Version 2.5.0</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">
                              View Details <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-200">Version 2.4.2</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">
                              View Details <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-blue-200">Version 2.4.0</span>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-400 hover:text-blue-300">
                              View Details <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-900/20 p-4 rounded-md border border-blue-800/40">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
                      <div>
                        <h3 className="text-blue-100 font-medium">System Status</h3>
                        <p className="text-blue-300 text-sm mt-1">
                          Check the current status of all system components.
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Web Application</span>
                            <Badge className="bg-green-600/50">Operational</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">API Services</span>
                            <Badge className="bg-green-600/50">Operational</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Database</span>
                            <Badge className="bg-green-600/50">Operational</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-blue-200">Report Generation</span>
                            <Badge className="bg-green-600/50">Operational</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HelpSupportPage;