import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  BarChart3, 
  FileDown, 
  Calendar, 
  Printer, 
  Share2,
  Building,
  Map,
  LineChart,
  Download,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Sample report templates
const reportTemplates = [
  {
    id: 1,
    name: 'Property Valuation Report',
    description: 'Detailed valuation report for a single property',
    icon: Building,
    type: 'property',
    lastUsed: '2025-05-10',
  },
  {
    id: 2,
    name: 'Regional Market Analysis',
    description: 'Market comparison across regions',
    icon: Map,
    type: 'analysis',
    lastUsed: '2025-04-28',
  },
  {
    id: 3,
    name: 'Quarterly Assessment Summary',
    description: 'Summary of quarterly property assessments',
    icon: BarChart3,
    type: 'summary',
    lastUsed: '2025-05-01',
  },
  {
    id: 4,
    name: 'Year-over-Year Comparison',
    description: 'Historical trend analysis over multiple years',
    icon: LineChart,
    type: 'analysis',
    lastUsed: '2025-03-15',
  },
  {
    id: 5,
    name: 'Cost Matrix Coverage Report',
    description: 'Analysis of cost matrix coverage by region',
    icon: Map,
    type: 'analysis',
    lastUsed: '2025-05-12',
  },
];

// Sample generated reports
const generatedReports = [
  {
    id: 101,
    name: 'Downtown Richland Q2 2025 Assessment',
    description: 'Quarterly assessment for Downtown Richland',
    date: '2025-05-12',
    type: 'Property Assessment',
    format: 'PDF',
    size: '2.4 MB',
  },
  {
    id: 102,
    name: 'Commercial Property Valuation Summary',
    description: 'Summary of commercial property valuations',
    date: '2025-05-05',
    type: 'Summary Report',
    format: 'PDF',
    size: '1.8 MB',
  },
  {
    id: 103,
    name: 'Kennewick Region Analysis - April 2025',
    description: 'Analysis of property values in Kennewick',
    date: '2025-04-28',
    type: 'Regional Analysis',
    format: 'PDF',
    size: '3.1 MB',
  },
  {
    id: 104,
    name: 'BC-10032-54 Property Detail Report',
    description: 'Detailed report for parcel BC-10032-54',
    date: '2025-05-10',
    type: 'Property Detail',
    format: 'PDF',
    size: '1.2 MB',
  },
  {
    id: 105,
    name: 'Q1 2025 Executive Summary',
    description: 'Executive summary for Q1 2025',
    date: '2025-04-15',
    type: 'Executive Report',
    format: 'PDF',
    size: '4.5 MB',
  },
];

const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  // Filter templates based on search
  const filteredTemplates = reportTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter generated reports based on search
  const filteredReports = generatedReports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Report Generator</h1>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="generate" className="data-[state=active]:bg-blue-800/50">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-blue-800/50">
            <Calendar className="h-4 w-4 mr-2" />
            Report History
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-blue-800/50">
            <BarChart3 className="h-4 w-4 mr-2" />
            Report Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Generate New Report</CardTitle>
              <CardDescription className="text-blue-300">
                Create a new report using one of the available templates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-blue-200">Report Template</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedTemplate === template.id
                            ? 'bg-blue-800/70 border-blue-600'
                            : 'bg-blue-900/50 border-blue-800/40 hover:border-blue-700'
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <div className="flex items-start">
                          <div className="bg-blue-800/50 p-2 rounded-full mr-4">
                            <template.icon className="h-5 w-5 text-blue-300" />
                          </div>
                          <div>
                            <h3 className="text-blue-100 font-medium">{template.name}</h3>
                            <p className="text-blue-400 text-sm mt-1">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedTemplate && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-blue-200">Report Title</Label>
                        <Input 
                          placeholder="Enter report title" 
                          className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-blue-200">Report Format</Label>
                        <Select defaultValue="pdf">
                          <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                          <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                            <SelectItem value="pdf">PDF</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-blue-200">Data Selection</Label>
                      <Select defaultValue="region">
                        <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                          <SelectValue placeholder="Select data source" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                          <SelectItem value="region">By Region</SelectItem>
                          <SelectItem value="property">By Property</SelectItem>
                          <SelectItem value="period">By Time Period</SelectItem>
                          <SelectItem value="type">By Property Type</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-blue-200">Region Selection</Label>
                      <Select defaultValue="richland">
                        <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                          <SelectItem value="richland">Richland (52100 100)</SelectItem>
                          <SelectItem value="kennewick">Kennewick (52100 140)</SelectItem>
                          <SelectItem value="prosser">Prosser (52100 320)</SelectItem>
                          <SelectItem value="west-richland">West Richland (52100 240)</SelectItem>
                          <SelectItem value="benton-city">Benton City (52100 180)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-blue-200">Report Options</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="include-charts" defaultChecked />
                          <Label htmlFor="include-charts" className="text-blue-300">Include charts and graphs</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="include-map" defaultChecked />
                          <Label htmlFor="include-map" className="text-blue-300">Include map visualization</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="include-trends" defaultChecked />
                          <Label htmlFor="include-trends" className="text-blue-300">Include historical trends</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="include-recommendations" />
                          <Label htmlFor="include-recommendations" className="text-blue-300">Include AI recommendations</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="border-blue-700 text-blue-200">
                        Preview
                      </Button>
                      <Button className="bg-blue-700 hover:bg-blue-600">
                        Generate Report
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Report History</CardTitle>
              <CardDescription className="text-blue-300">
                View and manage previously generated reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search reports..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <div 
                      key={report.id}
                      className="p-4 rounded-lg border border-blue-800/40 bg-blue-900/40 hover:bg-blue-900/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="space-y-1 mb-2 md:mb-0">
                          <div className="flex items-center">
                            <h3 className="text-blue-100 font-medium">{report.name}</h3>
                            <Badge className="ml-2 bg-blue-800/80 text-blue-200 hover:bg-blue-800">
                              {report.format}
                            </Badge>
                          </div>
                          <p className="text-blue-400 text-sm">{report.description}</p>
                          <div className="flex items-center text-xs text-blue-500">
                            <span>{report.date}</span>
                            <span className="mx-2">•</span>
                            <span>{report.type}</span>
                            <span className="mx-2">•</span>
                            <span>{report.size}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" className="text-blue-300 hover:text-blue-100">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-blue-300 hover:text-blue-100">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-blue-700 text-blue-200">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-blue-700/50 mx-auto mb-2" />
                    <p className="text-blue-300">No reports found matching your search.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Report Templates</CardTitle>
              <CardDescription className="text-blue-300">
                Manage and customize report templates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-6">
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
                <Input
                  placeholder="Search templates..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className="p-4 rounded-lg border border-blue-800/40 bg-blue-900/40 hover:bg-blue-900/50"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between">
                        <div className="flex items-start">
                          <div className="bg-blue-800/50 p-2 rounded-full mr-4">
                            <template.icon className="h-5 w-5 text-blue-300" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-blue-100 font-medium">{template.name}</h3>
                            <p className="text-blue-400 text-sm">{template.description}</p>
                            <div className="flex items-center text-xs text-blue-500">
                              <span>Type: {template.type}</span>
                              <span className="mx-2">•</span>
                              <span>Last used: {template.lastUsed}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 md:mt-0">
                          <Button variant="outline" size="sm" className="border-blue-700 text-blue-200">
                            Edit
                          </Button>
                          <Button size="sm" className="bg-blue-700 hover:bg-blue-600">
                            Use Template
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-blue-700/50 mx-auto mb-2" />
                    <p className="text-blue-300">No templates found matching your search.</p>
                  </div>
                )}

                <div className="flex justify-center mt-6">
                  <Button className="bg-blue-700 hover:bg-blue-600">
                    <FileText className="h-4 w-4 mr-2" />
                    Create New Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;