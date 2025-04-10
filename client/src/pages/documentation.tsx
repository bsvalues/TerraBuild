import React from "react";
import MainContent from "@/components/layout/MainContent";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import bentonSeal from '@assets/BC.png';

function DocumentCard({
  title,
  description,
  lastUpdated
}: {
  title: string;
  description: string;
  lastUpdated: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full shadow-md hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-[#47AD55]/20">
        <CardHeader className="pb-2">
          <h3 className="text-xl font-semibold text-[#243E4D]">{title}</h3>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{description}</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-[#243E4D]/70">Last updated: {lastUpdated}</span>
            <span className="text-[#47AD55] font-medium cursor-pointer hover:underline">
              Read More
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DocumentationPage() {
  return (
    <LayoutWrapper>
      <MainContent title="Documentation">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <img 
              src={bentonSeal} 
              alt="Benton County Seal" 
              className="h-16 w-16 mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-[#243E4D] mb-2">
              BCBS Documentation
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive guides and references for the Benton County Building Cost System
            </p>
          </motion.div>

          <Tabs defaultValue="user-guides" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="user-guides">User Guides</TabsTrigger>
              <TabsTrigger value="technical-docs">Technical Documentation</TabsTrigger>
              <TabsTrigger value="api-reference">API Reference</TabsTrigger>
            </TabsList>
            
            <TabsContent value="user-guides">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentCard 
                  title="Getting Started Guide"
                  description="Learn the basics of using the BCBS for cost estimation and analysis."
                  lastUpdated="April 2025"
                />
                <DocumentCard 
                  title="Cost Calculator Guide"
                  description="Detailed instructions for using the cost calculator functionality."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Data Import/Export Guide"
                  description="How to import cost matrices and export calculation results."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Visualization Tools"
                  description="Using charts and graphs to analyze building costs."
                  lastUpdated="April 2025"
                />
                <DocumentCard 
                  title="What-If Scenarios"
                  description="Creating and analyzing cost scenarios with different parameters."
                  lastUpdated="April 2025"
                />
                <DocumentCard 
                  title="Regional Analysis"
                  description="Comparing building costs across different regions of Benton County."
                  lastUpdated="February 2025"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="technical-docs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentCard 
                  title="System Architecture"
                  description="Technical overview of the BCBS architecture and components."
                  lastUpdated="January 2025"
                />
                <DocumentCard 
                  title="Data Models"
                  description="Documentation of the data structures used in BCBS."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Cost Matrix Format"
                  description="Technical specifications for the cost matrix data format."
                  lastUpdated="February 2025"
                />
                <DocumentCard 
                  title="Calculation Methodology"
                  description="Detailed explanation of the cost calculation algorithms."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Integration Guide"
                  description="How to integrate BCBS with other county systems."
                  lastUpdated="April 2025"
                />
                <DocumentCard 
                  title="FTP Synchronization"
                  description="Technical documentation for automated file synchronization."
                  lastUpdated="March 2025"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="api-reference">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentCard 
                  title="API Overview"
                  description="Introduction to the BCBS API and authentication."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Cost Calculator API"
                  description="Endpoints for performing cost calculations programmatically."
                  lastUpdated="April 2025"
                />
                <DocumentCard 
                  title="Data API"
                  description="Endpoints for accessing and managing cost matrix data."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Regional Data API"
                  description="Endpoints for retrieving region-specific cost information."
                  lastUpdated="February 2025"
                />
                <DocumentCard 
                  title="Building Types API"
                  description="Endpoints for working with building type classifications."
                  lastUpdated="March 2025"
                />
                <DocumentCard 
                  title="Export API"
                  description="Endpoints for generating reports and exports."
                  lastUpdated="April 2025"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}