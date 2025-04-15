/**
 * Cost Wizard Page
 * 
 * This page showcases the interactive cost estimation wizard component
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  BarChart3, 
  Building, 
  Calculator, 
  Download, 
  FileText, 
  Home, 
  Save 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CostEstimationWizard from '@/components/wizards/CostEstimationWizardFixed';
import { useQueryClient } from '@tanstack/react-query';

const CostWizardPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [wizardCompleted, setWizardCompleted] = useState(false);
  const [savedEstimate, setSavedEstimate] = useState<any>(null);
  
  // Handle wizard completion
  const handleWizardComplete = (result: any) => {
    setSavedEstimate(result);
    setWizardCompleted(true);
    
    // Invalidate any relevant query cache entries
    queryClient.invalidateQueries({ queryKey: ['/api/calculations'] });
    
    toast({
      title: 'Estimate Saved',
      description: 'Your building cost estimate has been saved successfully.',
    });
  };
  
  // Go back to dashboard
  const goToDashboard = () => {
    setLocation('/dashboard');
  };
  
  // Export saved estimate as JSON
  const exportEstimate = () => {
    if (!savedEstimate) return;
    
    try {
      const dataStr = JSON.stringify(savedEstimate, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const exportFileName = savedEstimate.inputValues.projectName
        ? `${savedEstimate.inputValues.projectName.replace(/\s+/g, '-')}-estimate.json`
        : `cost-estimate-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      toast({
        title: 'Export Complete',
        description: 'The calculation has been exported as JSON',
      });
    } catch (error) {
      console.error('Error exporting calculation:', error);
      toast({
        title: 'Export Error',
        description: error instanceof Error ? error.message : 'Failed to export calculation',
        variant: 'destructive',
      });
    }
  };
  
  // Start a new wizard
  const startNewEstimate = () => {
    setSavedEstimate(null);
    setWizardCompleted(false);
  };
  
  // Render content based on wizard state
  const renderContent = () => {
    if (wizardCompleted) {
      return (
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center mb-8">
            <Building className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Estimate Completed</h1>
            <p className="text-muted-foreground mb-6">
              Your building cost estimate has been saved successfully. You can now view the details, create a new estimate, or return to the dashboard.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={startNewEstimate} className="gap-2">
                <Calculator className="h-4 w-4" />
                Create New Estimate
              </Button>
              <Button onClick={exportEstimate} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Estimate
              </Button>
              <Button onClick={goToDashboard} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
          
          {savedEstimate && (
            <div className="border rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {savedEstimate.inputValues.projectName || 'Building Cost Estimate'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-lg mb-2">Estimate Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-bold">
                        ${savedEstimate.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Per Square Foot:</span>
                      <span>
                        ${savedEstimate.costPerSqFt.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Building Type:</span>
                      <span>
                        {savedEstimate.inputValues.buildingType}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Square Feet:</span>
                      <span>{savedEstimate.inputValues.squareFeet.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Quality:</span>
                      <span>{savedEstimate.inputValues.quality}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Condition:</span>
                      <span>{savedEstimate.inputValues.condition}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Year Built:</span>
                      <span>{savedEstimate.inputValues.yearBuilt}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Region:</span>
                      <span>{savedEstimate.inputValues.region}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Cost Breakdown</h3>
                  <div className="space-y-2">
                    {savedEstimate.breakdownCosts && (
                      <>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Foundation:</span>
                          <span>${savedEstimate.breakdownCosts.foundation.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Framing & Structure:</span>
                          <span>${savedEstimate.breakdownCosts.framing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Exterior Finishes:</span>
                          <span>${savedEstimate.breakdownCosts.exterior.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Roofing:</span>
                          <span>${savedEstimate.breakdownCosts.roofing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Interior Finishes:</span>
                          <span>${savedEstimate.breakdownCosts.interiorFinish.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Plumbing:</span>
                          <span>${savedEstimate.breakdownCosts.plumbing.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">Electrical:</span>
                          <span>${savedEstimate.breakdownCosts.electrical.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground">HVAC:</span>
                          <span>${savedEstimate.breakdownCosts.hvac.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {savedEstimate.inputValues.notes && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Notes</h3>
                  <div className="bg-muted p-3 rounded-md">
                    {savedEstimate.inputValues.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="w-full mt-4 mb-10">
        <CostEstimationWizard 
          onSave={handleWizardComplete} 
          onExit={goToDashboard}
        />
      </div>
    );
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={goToDashboard}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Cost Estimation Wizard</h1>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default CostWizardPage;