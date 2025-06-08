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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cost Estimation Wizard"
        description="Step-by-step guided process to calculate accurate building costs for Benton County projects"
        icon={Calculator}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cost Analysis" },
          { label: "Wizard" }
        ]}
      />

      {/* Progress Bar */}
      <EnterpriseCard>
        <EnterpriseCardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-200">
                Step {currentStep} of {totalSteps}
              </h3>
              <span className="text-sm text-slate-400">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <Progress 
              value={(currentStep / totalSteps) * 100} 
              className="w-full h-2"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>Project Info</span>
              <span>Specifications</span>
              <span>Quality & Construction</span>
              <span>Results</span>
            </div>
          </div>
        </EnterpriseCardContent>
      </EnterpriseCard>

      {/* Wizard Content */}
      <div className="max-w-4xl mx-auto">
        {renderStep()}
      </div>

      {/* Navigation */}
      {currentStep < totalSteps && !estimate && (
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="bg-sky-600 hover:bg-sky-700"
          >
            Next Step
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Final Actions */}
      {estimate && currentStep === totalSteps && (
        <div className="flex justify-center gap-4 max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => {
              setEstimate(null);
              setCurrentStep(1);
              setWizardData({
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
            }}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Calculator className="mr-2 h-4 w-4" />
            New Estimate
          </Button>

          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Save className="mr-2 h-4 w-4" />
            Save Estimate
          </Button>

          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <FileText className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      )}
    </div>
  );
};

export default CostWizardPage;