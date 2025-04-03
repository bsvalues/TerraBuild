import React from 'react';
import { Helmet } from 'react-helmet';
import CostPredictionWizard from '../components/ai/CostPredictionWizard';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Bot, Home, ChevronRight, Info, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AICostWizardPage() {
  const { toast } = useToast();
  
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <Helmet>
        <title>AI Cost Prediction Wizard | Benton County Building Cost System</title>
      </Helmet>
      
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href="/tools">Tools</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator><ChevronRight className="h-3 w-3" /></BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink>AI Cost Wizard</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-start mt-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Bot className="h-7 w-7 mr-2 text-primary" />
              AI Cost Prediction Wizard
            </h1>
            <p className="text-gray-500 mt-1">
              Get an intelligent building cost prediction with step-by-step guidance
            </p>
          </div>
          
          <Button
            variant="outline"
            className="flex items-center"
            onClick={() => {
              toast({
                title: "Help Center",
                description: "The help documentation is coming soon!",
              });
            }}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        </div>
        
        <Separator className="my-6" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostPredictionWizard />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Info className="h-4 w-4 mr-2" />
                About this tool
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="mb-3">
                The AI Cost Prediction Wizard is an advanced tool that combines building industry 
                expertise with artificial intelligence to provide accurate cost estimates for 
                building projects in Benton County, Washington.
              </p>
              <p>
                By following a simple step-by-step process, you'll receive a detailed cost prediction 
                along with insights about factors influencing the cost and potential ways to optimize your project.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="bg-primary/10 text-primary p-1 rounded mr-2 mt-0.5">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span>AI-powered cost predictions based on current market data</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 text-primary p-1 rounded mr-2 mt-0.5">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span>Intelligent guidance through each step of the estimation process</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 text-primary p-1 rounded mr-2 mt-0.5">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span>Detailed breakdown of cost factors and their impacts</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 text-primary p-1 rounded mr-2 mt-0.5">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span>Smart material substitution recommendations</span>
                </li>
                <li className="flex items-start">
                  <div className="bg-primary/10 text-primary p-1 rounded mr-2 mt-0.5">
                    <Bot className="h-3 w-3" />
                  </div>
                  <span>Export capabilities for reports and presentations</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Data Accuracy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                This tool uses real data from the Benton County Cost Matrix and 
                regional construction cost indices, enhanced with AI analysis to 
                provide the most accurate predictions possible.
              </p>
              <p className="mt-3 text-gray-500 italic">
                Note: Results are predictions based on available data and should be used 
                for estimation purposes only. Actual costs may vary.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}