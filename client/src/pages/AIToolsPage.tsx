import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AICostPredictor, AIMatrixAnalyzer, AICalculationExplainer } from '@/components/ai';
import { useMCP } from '@/hooks/use-mcp';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import MainContent from '@/components/layout/MainContent';

/**
 * AI Tools Page
 * 
 * This page provides access to the AI-powered tools for the Building Cost System:
 * - Cost Predictor: Predict building costs using AI
 * - Matrix Analyzer: Analyze cost matrix data using AI
 * - Calculation Explainer: Get detailed explanations of building cost calculations
 */
const AIToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('predictor');
  const { mcpStatus, isLoading } = useMCP();
  
  // Function to render API key warning if needed
  const renderApiKeyWarning = () => {
    if (isLoading) {
      return null;
    }
    
    if (mcpStatus && mcpStatus.status === 'api_key_missing') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API Key Missing</AlertTitle>
          <AlertDescription>
            <p className="mb-2">
              OpenAI API key is not configured. AI features will not work properly.
            </p>
            <p>
              Please contact your administrator to set up the OpenAI API key for full functionality.
            </p>
          </AlertDescription>
        </Alert>
      );
    }
    
    return null;
  };
  
  return (
    <LayoutWrapper>
      <MainContent title="AI Tools">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold flex items-center">
              <Sparkles className="mr-2 h-6 w-6 text-primary" />
              AI Tools
            </h1>
            <p className="text-muted-foreground">
              AI-powered tools to enhance your building cost assessment workflow
            </p>
          </div>
          
          {renderApiKeyWarning()}
          
          <Tabs defaultValue="predictor" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full md:w-[600px]">
              <TabsTrigger value="predictor">Cost Predictor</TabsTrigger>
              <TabsTrigger value="analyzer">Matrix Analyzer</TabsTrigger>
              <TabsTrigger value="explainer">Calculation Explainer</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="predictor" className="mt-0">
                <AICostPredictor />
              </TabsContent>
              
              <TabsContent value="analyzer" className="mt-0">
                <AIMatrixAnalyzer />
              </TabsContent>
              
              <TabsContent value="explainer" className="mt-0">
                <AICalculationExplainer />
              </TabsContent>
            </div>
          </Tabs>
          
          <div className="bg-muted/30 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-semibold mb-3 flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              About AI Capabilities
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium">Cost Predictor</h3>
                <p className="text-sm text-muted-foreground">
                  The AI Cost Predictor analyzes building parameters to generate accurate cost estimates.
                  It considers regional factors, building type, and complexity to provide
                  tailored predictions.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Matrix Analyzer</h3>
                <p className="text-sm text-muted-foreground">
                  The Matrix Analyzer examines your cost matrix data to identify patterns,
                  regional variations, and building type differences. It provides insights and
                  recommendations based on the data.
                </p>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-medium">Calculation Explainer</h3>
                <p className="text-sm text-muted-foreground">
                  The Calculation Explainer breaks down complex cost calculations into
                  understandable explanations. It shows how different factors contribute to
                  the final cost and provides additional insights.
                </p>
              </div>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>
                All AI tools are powered by the Model Content Protocol (MCP) using OpenAI's language models.
                They provide insights and recommendations based on building cost data and industry knowledge.
              </p>
            </div>
          </div>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
};

export default AIToolsPage;