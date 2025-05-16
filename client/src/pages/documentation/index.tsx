import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  FileText, 
  Calculator, 
  Search, 
  Building, 
  Map, 
  Database, 
  Info, 
  Download 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Documentation sections
const documentationSections = [
  {
    id: 'overview',
    title: 'System Overview',
    icon: Info,
    description: 'General information about the TerraBuild system',
    content: `
      <h3 class="text-xl font-semibold mb-4">TerraBuild System Overview</h3>
      <p class="mb-4">
        TerraBuild is an advanced geospatial property valuation and diagnostic platform designed specifically for Benton County. 
        It focuses on comprehensive municipal property assessments with cutting-edge data validation and analysis capabilities.
      </p>
      <h4 class="text-lg font-semibold mb-2">Core Features</h4>
      <ul class="list-disc pl-6 mb-4 space-y-2">
        <li>Advanced property valuation with regional adjustments</li>
        <li>Geographic data integration with multiple coordinate systems</li>
        <li>Cost matrix management with historical data tracking</li>
        <li>AI-powered insights and data validation</li>
        <li>Multi-level assessment workflows</li>
      </ul>
      <p class="text-sm text-blue-300 mt-4">Last updated: May 15, 2025</p>
    `
  },
  {
    id: 'calculator',
    title: 'Calculator Tool',
    icon: Calculator,
    description: 'How to use the building cost calculator',
    content: `
      <h3 class="text-xl font-semibold mb-4">Building Cost Calculator Guide</h3>
      <p class="mb-4">
        The Building Cost Calculator provides accurate cost estimations based on the Benton County
        Building Cost Standards (BCBS). This tool uses regional cost data, improvement type, quality factors,
        and more to provide precise valuations.
      </p>
      <h4 class="text-lg font-semibold mb-2">Using the Calculator</h4>
      <ol class="list-decimal pl-6 mb-4 space-y-2">
        <li>Select a geographic region (using township/range, hood code, or TCA)</li>
        <li>Choose the building type and improvement category</li>
        <li>Enter the property details (square footage, year built, etc.)</li>
        <li>Adjust quality and condition factors as needed</li>
        <li>View the calculated valuation and adjustment factors</li>
      </ol>
      <h4 class="text-lg font-semibold mb-2">Advanced Features</h4>
      <p class="mb-4">
        The calculator supports various advanced features such as:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Multi-region comparisons</li>
        <li>Historical valuations</li>
        <li>Depreciation projections</li>
        <li>Improvement-specific modifications</li>
      </ul>
      <p class="text-sm text-blue-300 mt-4">Last updated: May 10, 2025</p>
    `
  },
  {
    id: 'matrix',
    title: 'Matrix Explorer',
    icon: Database,
    description: 'Understanding the cost matrix data structure',
    content: `
      <h3 class="text-xl font-semibold mb-4">Cost Matrix Data Structure</h3>
      <p class="mb-4">
        The Cost Matrix Explorer provides a way to browse and understand the complex cost data
        used for property valuations. This guide explains how to navigate and interpret the matrix data.
      </p>
      <h4 class="text-lg font-semibold mb-2">Matrix Organization</h4>
      <p class="mb-4">
        Matrices are organized by:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Building type (residential, commercial, etc.)</li>
        <li>Region (township/range, hood code, tax code area)</li>
        <li>Year (historical and current data)</li>
        <li>Quality grade (from economy to premium)</li>
      </ul>
      <h4 class="text-lg font-semibold mb-2">Using the Explorer</h4>
      <p class="mb-4">
        The explorer allows you to:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Filter by any combination of the above categories</li>
        <li>Compare matrices across different regions or years</li>
        <li>View detailed cost breakdowns</li>
        <li>Export data for reporting</li>
      </ul>
      <p class="text-sm text-blue-300 mt-4">Last updated: April 28, 2025</p>
    `
  },
  {
    id: 'regions',
    title: 'Geographic Regions',
    icon: Map,
    description: 'Understanding regional identifiers and coordinates',
    content: `
      <h3 class="text-xl font-semibold mb-4">Geographic Region System Guide</h3>
      <p class="mb-4">
        Benton County uses multiple geographic identifier systems that are integrated into TerraBuild.
        Understanding these systems is key to accurate property valuation and analysis.
      </p>
      <h4 class="text-lg font-semibold mb-2">Region Types</h4>
      <ol class="list-decimal pl-6 mb-4 space-y-2">
        <li><strong>Township/Range Coordinates:</strong> Classic land survey system (e.g., "10N-24E")</li>
        <li><strong>Hood Codes:</strong> County-specific area codes (e.g., "52100 100" for Richland)</li>
        <li><strong>Tax Code Areas (TCAs):</strong> Tax assessment districts (e.g., "1111H")</li>
        <li><strong>City Boundaries:</strong> Municipal divisions</li>
      </ol>
      <h4 class="text-lg font-semibold mb-2">Region Map</h4>
      <p class="mb-4">
        The system includes interactive maps to visualize the different region types and their overlaps.
        Use the maps to identify specific properties and their applicable regions for valuation.
      </p>
      <table class="w-full text-sm mb-4 border-collapse">
        <thead>
          <tr class="bg-blue-800/40 border-b border-blue-700">
            <th class="p-2 text-left">City</th>
            <th class="p-2 text-left">Hood Code</th>
            <th class="p-2 text-left">Township/Range</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-blue-800/60">
            <td class="p-2">Richland</td>
            <td class="p-2 font-mono">52100 100</td>
            <td class="p-2 font-mono">10N-28E</td>
          </tr>
          <tr class="border-b border-blue-800/60">
            <td class="p-2">Kennewick</td>
            <td class="p-2 font-mono">52100 140</td>
            <td class="p-2 font-mono">8N-29E</td>
          </tr>
          <tr class="border-b border-blue-800/60">
            <td class="p-2">Prosser</td>
            <td class="p-2 font-mono">52100 320</td>
            <td class="p-2 font-mono">9N-24E</td>
          </tr>
        </tbody>
      </table>
      <p class="text-sm text-blue-300 mt-4">Last updated: May 5, 2025</p>
    `
  },
  {
    id: 'properties',
    title: 'Property Management',
    icon: Building,
    description: 'Working with property records and data',
    content: `
      <h3 class="text-xl font-semibold mb-4">Property Management Guide</h3>
      <p class="mb-4">
        The Property Management module allows you to view, search, and manage all property records
        within the Benton County system.
      </p>
      <h4 class="text-lg font-semibold mb-2">Key Features</h4>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Advanced search and filtering</li>
        <li>Detailed property views</li>
        <li>Improvement tracking</li>
        <li>Valuation history</li>
        <li>Geographic visualization</li>
      </ul>
      <h4 class="text-lg font-semibold mb-2">Data Fields</h4>
      <p class="mb-4">
        Each property record contains the following key information:
      </p>
      <table class="w-full text-sm mb-4 border-collapse">
        <thead>
          <tr class="bg-blue-800/40 border-b border-blue-700">
            <th class="p-2 text-left">Field</th>
            <th class="p-2 text-left">Description</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-blue-800/60">
            <td class="p-2 font-semibold">Parcel ID</td>
            <td class="p-2">Unique county identifier</td>
          </tr>
          <tr class="border-b border-blue-800/60">
            <td class="p-2 font-semibold">Address</td>
            <td class="p-2">Physical location</td>
          </tr>
          <tr class="border-b border-blue-800/60">
            <td class="p-2 font-semibold">Property Type</td>
            <td class="p-2">Residential, Commercial, etc.</td>
          </tr>
          <tr class="border-b border-blue-800/60">
            <td class="p-2 font-semibold">Region</td>
            <td class="p-2">Geographic identifiers</td>
          </tr>
          <tr class="border-b border-blue-800/60">
            <td class="p-2 font-semibold">Improvements</td>
            <td class="p-2">Buildings and structures</td>
          </tr>
        </tbody>
      </table>
      <p class="text-sm text-blue-300 mt-4">Last updated: May 12, 2025</p>
    `
  },
  {
    id: 'import',
    title: 'Data Import',
    icon: Download,
    description: 'Importing and updating cost matrices',
    content: `
      <h3 class="text-xl font-semibold mb-4">Data Import Guide</h3>
      <p class="mb-4">
        The Data Import tool allows administrators to import and update cost matrices and property
        data from external sources.
      </p>
      <h4 class="text-lg font-semibold mb-2">Supported Import Types</h4>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Cost matrices (Excel format)</li>
        <li>Property records (CSV format)</li>
        <li>Region definitions (GeoJSON format)</li>
        <li>Improvement details (CSV format)</li>
      </ul>
      <h4 class="text-lg font-semibold mb-2">Import Process</h4>
      <ol class="list-decimal pl-6 mb-4 space-y-2">
        <li>Select the import type</li>
        <li>Upload the source file</li>
        <li>Map data fields if needed</li>
        <li>Review and validate the data</li>
        <li>Confirm and process the import</li>
      </ol>
      <h4 class="text-lg font-semibold mb-2">Data Validation</h4>
      <p class="mb-4">
        The system performs extensive validation during import to ensure data integrity:
      </p>
      <ul class="list-disc pl-6 mb-4 space-y-1">
        <li>Format and type checking</li>
        <li>Duplicate detection</li>
        <li>Reference validation</li>
        <li>Region consistency</li>
      </ul>
      <p class="text-sm text-blue-300 mt-4">Last updated: April 20, 2025</p>
    `
  }
];

const DocumentationPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter sections based on search
  const filteredSections = documentationSections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get active section
  const activeSection = documentationSections.find(section => section.id === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Documentation</h1>
        <Button variant="outline" className="text-blue-200 border-blue-700">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
        <Input
          placeholder="Search documentation..."
          className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Contents</CardTitle>
            </CardHeader>
            <CardContent>
              <nav className="space-y-1">
                {filteredSections.map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    className={`w-full justify-start mb-1 ${
                      activeTab === section.id
                        ? 'bg-blue-800/60 text-blue-100'
                        : 'text-blue-300 hover:text-blue-200 hover:bg-blue-900/60'
                    }`}
                    onClick={() => setActiveTab(section.id)}
                  >
                    <section.icon className="h-4 w-4 mr-2" />
                    {section.title}
                  </Button>
                ))}
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <div className="flex items-center">
                {activeSection && (
                  <>
                    <activeSection.icon className="h-5 w-5 mr-2 text-blue-300" />
                    <CardTitle className="text-blue-100">{activeSection.title}</CardTitle>
                  </>
                )}
              </div>
              <CardDescription className="text-blue-300">
                {activeSection?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeSection ? (
                <div 
                  className="prose prose-invert prose-blue max-w-none"
                  dangerouslySetInnerHTML={{ __html: activeSection.content }}
                />
              ) : (
                <div className="text-blue-300 text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-blue-500 mb-4" />
                  <p>No documentation section found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;