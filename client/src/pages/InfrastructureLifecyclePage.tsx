import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import InfrastructureLifecycleStoryTeller from '@/components/InfrastructureLifecycleStoryTeller';
import InfrastructureLifecycleAnimation from '@/components/visualizations/InfrastructureLifecycleAnimation';
import Infrastructure3DLifecycle from '@/components/visualizations/Infrastructure3DLifecycle';

const InfrastructureLifecyclePage: React.FC = () => {
  const [showInfoCard, setShowInfoCard] = useState(true);
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-primary">Infrastructure Lifecycle Storyteller</h1>
          <p className="text-muted-foreground mt-2">
            Explore the complete lifecycle of infrastructure assets from planning to end-of-life
          </p>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowInfoCard(!showInfoCard)}
              >
                <Info className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show/hide information about this feature</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Information card */}
      {showInfoCard && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Card className="p-6 bg-muted/40 border border-primary/20">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">About the Infrastructure Lifecycle Visualizations</h3>
                <p className="text-muted-foreground">
                  This feature provides three different ways to explore and understand the complete 
                  lifecycle of infrastructure assets in Benton County. Each visualization offers a 
                  unique perspective on how infrastructure evolves from planning to end-of-life.
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                  <li><span className="font-medium">Storyteller View:</span> A simplified narrative walkthrough of each lifecycle stage</li>
                  <li><span className="font-medium">Advanced Animation:</span> Detailed visualization with comprehensive metrics and comparisons</li>
                  <li><span className="font-medium">3D Interactive Model:</span> Explore three-dimensional representations of each lifecycle stage</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Use the auto-play feature to watch the entire lifecycle unfold automatically, or navigate 
                  manually between stages to study specific phases in detail.
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowInfoCard(false)}
              >
                Dismiss
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
      
      {/* Main content */}
      <Tabs defaultValue="storyteller" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="storyteller" className="flex items-center gap-2">
            <span className="hidden sm:inline">Storyteller View</span>
            <span className="sm:hidden">Basic</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <span className="hidden sm:inline">Advanced Animation</span>
            <span className="sm:hidden">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="3d" className="flex items-center gap-2">
            <span className="hidden sm:inline">3D Interactive Model</span>
            <span className="sm:hidden">3D Model</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="storyteller" className="mt-6">
          <InfrastructureLifecycleStoryTeller />
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6">
          <InfrastructureLifecycleAnimation />
        </TabsContent>
        
        <TabsContent value="3d" className="mt-6">
          <Infrastructure3DLifecycle />
        </TabsContent>
      </Tabs>
      
      {/* Additional resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Why Lifecycle Matters</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Understanding the full lifecycle helps optimize resource allocation,
                reduce long-term costs, and improve infrastructure sustainability.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Cost Distribution</h3>
              <p className="text-sm text-muted-foreground mt-2">
                While construction costs are significant, operation and maintenance
                costs over an asset's lifetime typically exceed initial investment.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Planning Impact</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Decisions made during the planning phase have the highest impact
                on lifecycle costs, with diminishing influence in later stages.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InfrastructureLifecyclePage;