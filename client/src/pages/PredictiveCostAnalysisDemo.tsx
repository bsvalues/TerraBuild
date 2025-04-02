/**
 * Predictive Cost Analysis Demo Page
 * 
 * This page demonstrates the AI-powered predictive cost analysis capabilities
 * of the BCBS application, including multi-variable regression modeling,
 * feature impact analysis, and confidence interval calculation.
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Info, HelpCircle, Lightbulb, Sparkles, BarChart2, BadgeDollarSign, Database } from 'lucide-react';
import { PredictiveCostAnalysis } from '@/components/visualizations/PredictiveCostAnalysis';
import { Separator } from '@/components/ui/separator';
import { VisualizationContextProvider } from '@/contexts/visualization-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PredictiveCostAnalysisDemo() {
  const [showIntroduction, setShowIntroduction] = useState(true);

  return (
    <VisualizationContextProvider>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI Predictive Cost Analysis
            </h1>
            <p className="text-muted-foreground">
              Advanced machine learning models for building cost prediction and analysis
            </p>
          </div>
        </div>

        {showIntroduction && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">AI-Powered Cost Prediction</AlertTitle>
            <AlertDescription className="text-blue-700">
              This advanced feature uses machine learning to predict building costs based on multiple variables.
              The model analyzes historical data patterns to provide accurate predictions with confidence intervals
              and detailed explanations of contributing factors.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-7">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">About Machine Learning Model</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <span className="font-medium text-foreground">Multi-variable Regression</span>: The prediction engine uses a sophisticated regression model that accounts for multiple building characteristics simultaneously.
                </p>
                <p>
                  <span className="font-medium text-foreground">Adaptive Learning</span>: The model improves over time as it processes more data, increasing accuracy with each prediction.
                </p>
                <p>
                  <span className="font-medium text-foreground">Feature Importance Analysis</span>: Identifies which building features have the most significant impact on cost to help inform decision-making.
                </p>
                <p>
                  <span className="font-medium text-foreground">Confidence Scoring</span>: Each prediction includes a confidence score and interval based on data quality and model certainty.
                </p>
              </CardContent>
            </Card>
            
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  <span className="font-medium text-foreground">1. Enter Building Details</span>: Provide information about the building including square footage, type, region, and other characteristics.
                </p>
                <p>
                  <span className="font-medium text-foreground">2. Generate Prediction</span>: The AI model will process the information and generate a cost prediction with confidence intervals.
                </p>
                <p>
                  <span className="font-medium text-foreground">3. Review Analysis</span>: Examine the contributing factors and explanations to understand what's driving the cost prediction.
                </p>
                <p>
                  <span className="font-medium text-foreground">4. Compare Options</span>: Use the comparison feature to explore how different building characteristics impact costs.
                </p>
                <p>
                  <span className="font-medium text-foreground">5. Save Predictions</span>: Save predictions for different scenarios to compare and reference later.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-5">
            <Tabs defaultValue="prediction" className="space-y-4">
              <TabsList>
                <TabsTrigger value="prediction" className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  AI Prediction
                </TabsTrigger>
                <TabsTrigger value="about" className="flex items-center gap-1">
                  <Info className="h-4 w-4" />
                  About This Technology
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="prediction" className="space-y-4">
                <PredictiveCostAnalysis />
              </TabsContent>
              
              <TabsContent value="about" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>How the AI Prediction Works</CardTitle>
                    <CardDescription>
                      Understanding the technology behind the predictive cost analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Database className="h-4 w-4 text-blue-500" />
                        Data Training
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The model is trained on historical building cost data from Benton County. It learns patterns
                        between building characteristics (square footage, type, region, etc.) and their associated costs.
                        This training process creates a mathematical model that can predict costs for new buildings
                        with similar characteristics.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        Regression Analysis
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The heart of the prediction engine is a multi-variable regression model with regularization
                        to improve stability and generalization. This type of model quantifies the relationship
                        between multiple input variables and the target variable (cost). The model calculates
                        coefficients for each feature, determining how much each characteristic influences
                        the final cost prediction.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-green-500" />
                        Confidence Calculation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Each prediction includes a confidence score and interval. These are calculated based on:
                        (1) how similar the new building is to those in the training data, (2) completeness of input
                        features, and (3) the model's overall accuracy on similar buildings. The confidence interval
                        provides a range where the actual cost is likely to fall.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <BadgeDollarSign className="h-4 w-4 text-amber-500" />
                        Feature Importance
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        The model evaluates which features most strongly influence the cost prediction. This analysis
                        examines the magnitude of each feature's coefficient and the value of the feature to determine
                        its impact on the final prediction. This information is used to generate the explanation
                        of factors driving the cost prediction.
                      </p>
                    </div>
                    
                    <Alert className="bg-blue-50 border-blue-200 mt-4">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Continuous Improvement</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        This predictive system is designed to improve over time. As more data becomes available
                        and more predictions are made, the model's accuracy increases. The system can be updated
                        with new building cost data to ensure it stays current with market conditions.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <CardTitle className="text-sm">Data-Driven Planning</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Make informed building decisions based on AI predictions rather than guesswork or outdated cost tables.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <CardTitle className="text-sm">Feature Optimization</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Identify which building features have the biggest cost impact to optimize designs for budgetary constraints.
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <CardTitle className="text-sm">Scenario Comparison</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-xs text-muted-foreground">
                  Compare different building scenarios to find the optimal balance between features and cost.
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </VisualizationContextProvider>
  );
}