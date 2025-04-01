/**
 * MCP Overview Page
 * 
 * This page provides an overview of the Model Content Protocol (MCP)
 * and how it's implemented in the Building Cost Building System.
 */

import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Code, Database, Server, Workflow } from 'lucide-react';
import { MCPVisualizations } from '@/components/visualizations/MCPVisualizations';

export default function MCPOverviewPage() {
  return (
    <div className="container py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Model Content Protocol</h1>
          <p className="text-muted-foreground">
            Implementation and overview of the Model Content Protocol in our building cost system
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl">
          <TabsTrigger value="overview">
            <BookOpen className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="architecture">
            <Server className="mr-2 h-4 w-4" />
            Architecture
          </TabsTrigger>
          <TabsTrigger value="implementation">
            <Code className="mr-2 h-4 w-4" />
            Implementation
          </TabsTrigger>
          <TabsTrigger value="demo">
            <Workflow className="mr-2 h-4 w-4" />
            Demo
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>What is the Model Content Protocol?</CardTitle>
              <CardDescription>
                A standardized framework for AI model interaction and content processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The <strong>Model Content Protocol (MCP)</strong> is a framework designed to standardize how AI models and agents 
                interact with content. It defines standard formats for representing data, establishes controls for content 
                generation, and outlines common processing pipelines.
              </p>
              
              <h3 className="text-xl font-semibold mt-6">Key Components</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">Schema Registry</h4>
                  <p className="text-sm mt-2">
                    Central repository of data schemas that define the structure and validation rules for all data types
                    in the system.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">Function Registry</h4>
                  <p className="text-sm mt-2">
                    Collection of well-defined functions with standardized interfaces for input validation and output formatting.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">Workflow Engine</h4>
                  <p className="text-sm mt-2">
                    Executes sequences of steps to process data following the perception-reasoning-action cycle of AI agents.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">Content Processing Pipeline</h4>
                  <p className="text-sm mt-2">
                    Standardized flow for handling content from input through transformation to output with validation at each stage.
                  </p>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mt-6">Benefits</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Improved interoperability between different AI systems and components</li>
                <li>Consistent data validation and error handling</li>
                <li>Standardized interfaces for modular development</li>
                <li>Enhanced traceability and explainability of AI processes</li>
                <li>Better safety and compliance through formalized content controls</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>MCP in the Building Cost Building System</CardTitle>
              <CardDescription>
                How we've implemented MCP principles in our application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                We've integrated the Model Content Protocol into our Building Cost Building System to enhance 
                our data processing, calculation functions, and visualization components. This implementation 
                follows the core MCP principles of schema-first development, standardized function interfaces, 
                and workflow-based processing.
              </p>
              
              <h3 className="text-xl font-semibold mt-6">Implementation Areas</h3>
              
              <div className="space-y-4 mt-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">Cost Calculation Engine</h4>
                  <p className="text-sm mt-2">
                    Our calculation engine now follows MCP principles with standardized input/output schemas,
                    validation at each stage, and clear function definitions for all cost calculations.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">Data Visualization Pipeline</h4>
                  <p className="text-sm mt-2">
                    Visualizations use the MCP workflow engine to process data through perception (data gathering),
                    reasoning (analysis), and action (visual rendering) stages.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-primary">API Integration</h4>
                  <p className="text-sm mt-2">
                    All API endpoints implement MCP-compliant interfaces with schema validation, standardized
                    error formats, and consistent response structures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="architecture" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>MCP Architecture</CardTitle>
              <CardDescription>
                The layered architecture of the Model Content Protocol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Layered Architecture</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-primary/10 p-4 border-b">
                      <p className="font-medium text-center">Experience Layer</p>
                      <p className="text-xs text-center text-muted-foreground">User-facing presentation and interaction</p>
                    </div>
                    <div className="bg-primary/10 p-4 border-b">
                      <p className="font-medium text-center">Orchestration Layer</p>
                      <p className="text-xs text-center text-muted-foreground">Workflow composition and planning</p>
                    </div>
                    <div className="bg-primary/10 p-4 border-b">
                      <p className="font-medium text-center">Function Layer</p>
                      <p className="text-xs text-center text-muted-foreground">Procedural abstractions and execution</p>
                    </div>
                    <div className="bg-primary/10 p-4 border-b">
                      <p className="font-medium text-center">Semantic Layer</p>
                      <p className="text-xs text-center text-muted-foreground">Meaning representation and classification</p>
                    </div>
                    <div className="bg-primary/10 p-4 border-b">
                      <p className="font-medium text-center">Schema Layer</p>
                      <p className="text-xs text-center text-muted-foreground">JSON Schema-based validation</p>
                    </div>
                    <div className="bg-primary/10 p-4 border-b">
                      <p className="font-medium text-center">Data Structure Layer</p>
                      <p className="text-xs text-center text-muted-foreground">Primitive type definitions and composition</p>
                    </div>
                    <div className="bg-primary/10 p-4">
                      <p className="font-medium text-center">Physical Layer</p>
                      <p className="text-xs text-center text-muted-foreground">Binary content encoding (JSON, XML)</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Perception-Reasoning-Action Cycle</h3>
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                    <div className="border rounded-lg p-4 text-center md:w-1/3">
                      <h4 className="font-medium text-primary">Perception</h4>
                      <p className="text-sm mt-2">
                        Processing inputs, extracting context, recognizing intent, and modeling the environment
                      </p>
                    </div>
                    
                    <div className="hidden md:block">→</div>
                    
                    <div className="border rounded-lg p-4 text-center md:w-1/3">
                      <h4 className="font-medium text-primary">Reasoning</h4>
                      <p className="text-sm mt-2">
                        Planning actions, analyzing dependencies, allocating resources, and forming hypotheses
                      </p>
                    </div>
                    
                    <div className="hidden md:block">→</div>
                    
                    <div className="border rounded-lg p-4 text-center md:w-1/3">
                      <h4 className="font-medium text-primary">Action</h4>
                      <p className="text-sm mt-2">
                        Selecting and invoking functions, binding parameters, capturing and validating results
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Core Components</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Interface Definitions</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Schema Registry</li>
                        <li>• Function Catalog</li>
                        <li>• Type System</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Content Flow</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Input Processing</li>
                        <li>• Transformation Pipeline</li>
                        <li>• Output Formatting</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Execution Environment</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Function Invocation</li>
                        <li>• Workflow Orchestration</li>
                        <li>• State Management</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Agent Collaboration</h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Capability Discovery</li>
                        <li>• Task Decomposition</li>
                        <li>• Result Aggregation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="implementation" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>BCBS MCP Implementation</CardTitle>
              <CardDescription>
                How we've implemented the Model Content Protocol in our system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Core Components</h3>
                  <p>
                    Our implementation of the Model Content Protocol includes several key components:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Schema Registry</h4>
                      <p className="text-sm mt-2">
                        Located in <code>shared/mcp/schemaRegistry.ts</code>, this component provides:
                      </p>
                      <ul className="list-disc pl-6 mt-2 text-sm">
                        <li>Central repository for JSON schemas</li>
                        <li>Schema validation functionality</li>
                        <li>Validation error reporting</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Function Registry</h4>
                      <p className="text-sm mt-2">
                        Located in <code>shared/mcp/functionRegistry.ts</code>, this component provides:
                      </p>
                      <ul className="list-disc pl-6 mt-2 text-sm">
                        <li>Registration of functions with metadata</li>
                        <li>Input/output schema validation</li>
                        <li>Execution with error handling</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Workflow Engine</h4>
                      <p className="text-sm mt-2">
                        Located in <code>shared/mcp/workflow.ts</code>, this component provides:
                      </p>
                      <ul className="list-disc pl-6 mt-2 text-sm">
                        <li>Workflow definition and execution</li>
                        <li>State management between steps</li>
                        <li>Error handling and recovery</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-primary">Visualization Controller</h4>
                      <p className="text-sm mt-2">
                        Located in <code>client/src/components/visualizations/MCPVisualizationController.tsx</code>:
                      </p>
                      <ul className="list-disc pl-6 mt-2 text-sm">
                        <li>MCP-compliant data processing</li>
                        <li>Perception-reasoning-action workflow</li>
                        <li>React context for state management</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Schema-First Development</h3>
                  <p>
                    Following MCP principles, we've defined schemas for all data structures in our system.
                    Examples include:
                  </p>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
                    <pre className="text-sm"><code>{`export const costMatrixSchema: JSONSchemaType<CostMatrix> = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    region: { type: 'string' },
    buildingType: { type: 'string' },
    baseCost: { type: 'number', minimum: 0 },
    county: { type: 'string' },
    state: { type: 'string' },
    complexityFactorBase: { type: 'number', minimum: 0 },
    qualityFactorBase: { type: 'number', minimum: 0 },
    conditionFactorBase: { type: 'number', minimum: 0 },
    year: { type: 'integer', minimum: 2000 }
  },
  required: [
    'id', 'region', 'buildingType', 'baseCost', 'county', 'state', 
    'complexityFactorBase', 'qualityFactorBase', 'conditionFactorBase', 'year'
  ],
  additionalProperties: false
};`}</code></pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Function Definitions</h3>
                  <p>
                    We've defined standardized function interfaces with input/output schemas:
                  </p>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
                    <pre className="text-sm"><code>{`registry.register({
  name: 'calculateBuildingCost',
  description: 'Calculate building cost based on parameters',
  inputSchema: 'BuildingCalculationInput',
  outputSchema: 'BuildingCalculationResult',
  fn: async (params) => {
    // Implementation details
    return {
      baseCost: /* calculation */,
      totalCost: /* calculation */,
      // Additional result properties
    };
  }
});`}</code></pre>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Workflow Implementation</h3>
                  <p>
                    Example of a perception-reasoning-action workflow:
                  </p>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg overflow-auto max-h-60">
                    <pre className="text-sm"><code>{`const visualizationWorkflow = {
  name: 'visualizationWorkflow',
  steps: [
    {
      name: 'perception',
      execute: async (input, state) => {
        // Process and validate input data
        return { ...input, perception: { timestamp: new Date().toISOString() } };
      }
    },
    {
      name: 'reasoning',
      execute: async (input, state) => {
        // Analyze what data needs to be fetched
        return { ...input, reasoning: { queryKeys: ['regionalCosts'] } };
      }
    },
    {
      name: 'action',
      execute: async (input, state) => {
        // Define API endpoints and parameters
        return { ...input, action: { endpoints: ['/api/analytics/...'] } };
      }
    }
  ]
};`}</code></pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="demo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>MCP Visualization Demo</CardTitle>
              <CardDescription>
                Interactive demonstration of the MCP-based visualization system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MCPVisualizations />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}