import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardContent } from '@/components/ui/enterprise-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Calculator, 
  Building2, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  DollarSign,
  FileText,
  MapPin,
  Layers,
  Home,
  Save
} from 'lucide-react';

const CostWizardPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    projectName: '',
    buildingType: '',
    squareFootage: '',
    stories: '1',
    qualityClass: 'standard',
    region: 'Benton County',
    yearBuilt: new Date().getFullYear().toString(),
    constructionType: 'frame',
    occupancyType: 'residential',
    notes: ''
  });
  const [estimate, setEstimate] = useState<any>(null);
  
  const totalSteps = 4;

  const buildingTypes = [
    { value: "residential_single", label: "Single Family Residential" },
    { value: "residential_multi", label: "Multi-Family Residential" },
    { value: "commercial_office", label: "Commercial Office" },
    { value: "commercial_retail", label: "Commercial Retail" },
    { value: "industrial_warehouse", label: "Industrial Warehouse" },
    { value: "institutional_school", label: "Educational Facility" }
  ];

  const qualityClasses = [
    { value: "economy", label: "Economy" },
    { value: "standard", label: "Standard" },
    { value: "good", label: "Good" },
    { value: "excellent", label: "Excellent" }
  ];

  const constructionTypes = [
    { value: "frame", label: "Wood Frame" },
    { value: "masonry", label: "Masonry" },
    { value: "steel", label: "Steel Frame" },
    { value: "concrete", label: "Concrete" }
  ];

  const updateWizardData = (field: string, value: string) => {
    setWizardData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateEstimate = () => {
    const baseCostPerSqFt = {
      "residential_single": 150,
      "residential_multi": 140,
      "commercial_office": 180,
      "commercial_retail": 160,
      "industrial_warehouse": 120,
      "institutional_school": 200
    }[wizardData.buildingType] || 150;

    const qualityMultiplier = {
      "economy": 0.85,
      "standard": 1.0,
      "good": 1.15,
      "excellent": 1.35
    }[wizardData.qualityClass] || 1.0;

    const constructionMultiplier = {
      "frame": 1.0,
      "masonry": 1.2,
      "steel": 1.3,
      "concrete": 1.4
    }[wizardData.constructionType] || 1.0;

    const storyMultiplier = parseInt(wizardData.stories) > 1 ? 1.1 : 1.0;
    const sqft = parseFloat(wizardData.squareFootage);
    
    const totalCost = sqft * baseCostPerSqFt * qualityMultiplier * constructionMultiplier * storyMultiplier;
    
    setEstimate({
      totalCost,
      costPerSqFt: totalCost / sqft,
      baseCost: baseCostPerSqFt,
      breakdown: {
        foundation: totalCost * 0.15,
        framing: totalCost * 0.25,
        roofing: totalCost * 0.10,
        exterior: totalCost * 0.15,
        interior: totalCost * 0.20,
        mechanical: totalCost * 0.15
      }
    });
    setCurrentStep(totalSteps);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return wizardData.projectName && wizardData.buildingType;
      case 2:
        return wizardData.squareFootage && wizardData.stories;
      case 3:
        return wizardData.qualityClass && wizardData.constructionType;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <EnterpriseCard>
            <EnterpriseCardHeader icon={Building2}>
              <EnterpriseCardTitle>Project Information</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Project Name</Label>
                  <Input
                    placeholder="Enter project name"
                    value={wizardData.projectName}
                    onChange={(e) => updateWizardData('projectName', e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Building Type</Label>
                  <Select value={wizardData.buildingType} onValueChange={(value) => updateWizardData('buildingType', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                      <SelectValue placeholder="Select building type" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <MapPin className="h-4 w-4 text-sky-400" />
                    <span className="text-slate-300">{wizardData.region}</span>
                  </div>
                </div>
              </div>
            </EnterpriseCardContent>
          </EnterpriseCard>
        );

      case 2:
        return (
          <EnterpriseCard>
            <EnterpriseCardHeader icon={Layers}>
              <EnterpriseCardTitle>Building Specifications</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Square Footage</Label>
                    <Input
                      type="number"
                      placeholder="Enter square footage"
                      value={wizardData.squareFootage}
                      onChange={(e) => updateWizardData('squareFootage', e.target.value)}
                      className="bg-slate-800/50 border-slate-700/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Number of Stories</Label>
                    <Select value={wizardData.stories} onValueChange={(value) => updateWizardData('stories', value)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Story</SelectItem>
                        <SelectItem value="2">2 Stories</SelectItem>
                        <SelectItem value="3">3 Stories</SelectItem>
                        <SelectItem value="4">4+ Stories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Year Built</Label>
                  <Input
                    type="number"
                    placeholder="Enter year built"
                    value={wizardData.yearBuilt}
                    onChange={(e) => updateWizardData('yearBuilt', e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Occupancy Type</Label>
                  <Select value={wizardData.occupancyType} onValueChange={(value) => updateWizardData('occupancyType', value)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                      <SelectItem value="institutional">Institutional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </EnterpriseCardContent>
          </EnterpriseCard>
        );

      case 3:
        return (
          <EnterpriseCard>
            <EnterpriseCardHeader icon={DollarSign}>
              <EnterpriseCardTitle>Quality & Construction</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quality Class</Label>
                    <Select value={wizardData.qualityClass} onValueChange={(value) => updateWizardData('qualityClass', value)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {qualityClasses.map(quality => (
                          <SelectItem key={quality.value} value={quality.value}>
                            {quality.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Construction Type</Label>
                    <Select value={wizardData.constructionType} onValueChange={(value) => updateWizardData('constructionType', value)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {constructionTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Project Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any additional notes about the project..."
                    value={wizardData.notes}
                    onChange={(e) => updateWizardData('notes', e.target.value)}
                    className="bg-slate-800/50 border-slate-700/50"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-center mt-8">
                  <Button onClick={calculateEstimate} className="bg-sky-600 hover:bg-sky-700">
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Cost Estimate
                  </Button>
                </div>
              </div>
            </EnterpriseCardContent>
          </EnterpriseCard>
        );

      case 4:
        return estimate ? (
          <div className="space-y-6">
            <EnterpriseCard variant="feature">
              <div className="text-center py-6">
                <CheckCircle className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
                <h2 className="text-2xl font-bold text-slate-100 mb-2">Estimate Complete</h2>
                <p className="text-slate-400">Your building cost estimate has been calculated</p>
              </div>
            </EnterpriseCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <EnterpriseCard>
                <EnterpriseCardHeader icon={DollarSign}>
                  <EnterpriseCardTitle>Cost Summary</EnterpriseCardTitle>
                </EnterpriseCardHeader>
                <EnterpriseCardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-sky-500/10 rounded-lg border border-sky-500/20">
                      <p className="text-3xl font-bold text-sky-400">
                        ${estimate.totalCost.toLocaleString()}
                      </p>
                      <p className="text-slate-400">Total Estimated Cost</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-800/30 rounded-lg">
                        <p className="text-sm text-slate-400">Cost per Sq Ft</p>
                        <p className="text-lg font-semibold text-slate-200">
                          ${estimate.costPerSqFt.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-800/30 rounded-lg">
                        <p className="text-sm text-slate-400">Base Rate</p>
                        <p className="text-lg font-semibold text-slate-200">
                          ${estimate.baseCost}/sq ft
                        </p>
                      </div>
                    </div>
                  </div>
                </EnterpriseCardContent>
              </EnterpriseCard>

              <EnterpriseCard>
                <EnterpriseCardHeader icon={FileText}>
                  <EnterpriseCardTitle>Cost Breakdown</EnterpriseCardTitle>
                </EnterpriseCardHeader>
                <EnterpriseCardContent>
                  <div className="space-y-3">
                    {Object.entries(estimate.breakdown).map(([category, cost]) => (
                      <div key={category} className="flex justify-between items-center py-2 border-b border-slate-700/30">
                        <span className="text-slate-400 capitalize">{category}</span>
                        <span className="text-slate-200 font-medium">
                          ${(cost as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </EnterpriseCardContent>
              </EnterpriseCard>
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
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
                    <div className="mt-4 pt-2 border-t">
                      <span className="text-sm font-medium block mb-2">Region Visualization:</span>
                      <RegionVisualization 
                        regionId={savedEstimate.inputValues.region}
                        compact={true}
                        showTitle={false}
                      />
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
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setLocation('/matrix')}
          >
            <Layers className="h-4 w-4" />
            Matrix Explorer
          </Button>
        </div>
        
        {!wizardCompleted && (
          <>
            {isLoadingCostFactors ? (
              <div className="flex items-center gap-2 border rounded-md px-3 py-1.5 bg-muted">
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading cost factors...</span>
              </div>
            ) : costFactorsError ? (
              <div className="flex items-center gap-2 border border-destructive rounded-md px-3 py-1.5 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Error loading cost factors</span>
              </div>
            ) : costFactors ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  toast({
                    title: "Cost Factors Source",
                    description: `Using ${costFactors.source} (v${costFactors.version})`,
                  });
                }}
              >
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Using Benton County Cost Factors
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  toast({
                    title: "Cost Factors",
                    description: "Using fallback cost factors data",
                    variant: "destructive"
                  });
                }}
              >
                <Database className="h-4 w-4" />
                Using Default Cost Factors
              </Button>
            )}
          </>
        )}
      </div>
      
      <div className="container mx-auto">
        {isLoadingCostFactors && !wizardCompleted && (
          <Alert className="mb-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <AlertTitle>Loading Cost Factors</AlertTitle>
            <AlertDescription>
              Loading cost factors data from Benton County Building Cost Standards...
            </AlertDescription>
          </Alert>
        )}
        
        {costFactorsError && !wizardCompleted && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error Loading Cost Factors</AlertTitle>
            <AlertDescription>
              There was an error loading the cost factors data. The calculation will use built-in defaults.
              {costFactorsError instanceof Error && (
                <div className="mt-2 text-xs">{costFactorsError.message}</div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {costFactors && !isLoadingCostFactors && !wizardCompleted && (
          <Alert className="mb-4 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            <AlertTitle>Cost Factors Loaded Successfully</AlertTitle>
            <AlertDescription>
              Using {costFactors.source} version {costFactors.version} ({costFactors.year}).
              Last updated: {new Date(costFactors.lastUpdated).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}

        {renderContent()}
        
        {wizardCompleted && (
          <div className="mt-8 border-t pt-8">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary" />
              Cost Factors Used in Calculation
            </h2>
            <p className="text-muted-foreground mb-4">
              The following cost factors from Benton County Building Cost Standards were used in the calculation.
              These factors are loaded directly from data/costFactors.json.
            </p>
            <CostFactorDataPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default CostWizardPage;