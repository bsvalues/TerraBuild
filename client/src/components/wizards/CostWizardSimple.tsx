import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calculator, MapPin, DollarSign, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

interface FormData {
  buildingType: string;
  squareFootage: string;
  yearBuilt: string;
  quality: string;
  region: string;
}

const CostWizardSimple = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    buildingType: 'residential',
    squareFootage: '',
    yearBuilt: '',
    quality: 'standard',
    region: 'Benton County'
  });

  const steps = [
    { id: 1, title: 'Property Type', icon: Building2 },
    { id: 2, title: 'Property Details', icon: MapPin },
    { id: 3, title: 'Quality & Features', icon: Calculator },
    { id: 4, title: 'Cost Estimate', icon: DollarSign }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateCost = () => {
    const baseRate = 285; // 2025 base rate per sq ft
    const sqft = parseInt(formData.squareFootage) || 0;
    const age = new Date().getFullYear() - (parseInt(formData.yearBuilt) || 2020);
    
    // Quality multipliers
    const qualityMultipliers = {
      economy: 0.8,
      standard: 1.0,
      good: 1.2,
      excellent: 1.5
    };
    
    // Age depreciation
    const ageDepreciation = Math.max(0.7, 1 - (age * 0.015));
    
    const qualityMultiplier = qualityMultipliers[formData.quality as keyof typeof qualityMultipliers] || 1.0;
    const totalCost = sqft * baseRate * qualityMultiplier * ageDepreciation;
    
    return Math.round(totalCost);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Building Type</Label>
                <Select value={formData.buildingType} onValueChange={(value) => updateFormData('buildingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Region</Label>
                <Select value={formData.region} onValueChange={(value) => updateFormData('region', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Benton County">Benton County</SelectItem>
                    <SelectItem value="Franklin County">Franklin County</SelectItem>
                    <SelectItem value="Walla Walla County">Walla Walla County</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Square Footage</Label>
                <Input
                  type="number"
                  placeholder="Enter square footage"
                  value={formData.squareFootage}
                  onChange={(e) => updateFormData('squareFootage', e.target.value)}
                />
              </div>
              
              <div>
                <Label>Year Built</Label>
                <Input
                  type="number"
                  placeholder="Enter year built"
                  value={formData.yearBuilt}
                  onChange={(e) => updateFormData('yearBuilt', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Construction Quality</Label>
                <Select value={formData.quality} onValueChange={(value) => updateFormData('quality', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        const estimatedCost = calculateCost();
        return (
          <div className="space-y-6">
            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardHeader>
                <CardTitle className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Cost Estimation Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-4">
                  <div className="text-4xl font-bold text-slate-100">
                    ${estimatedCost.toLocaleString()}
                  </div>
                  <div className="text-slate-400">
                    Estimated replacement cost for {formData.squareFootage} sq ft {formData.quality} quality {formData.buildingType} building
                  </div>
                  <div className="text-sm text-slate-500">
                    Based on 2025 construction rates: $285/sq ft base rate
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              currentStep >= step.id 
                ? 'bg-sky-500 border-sky-500 text-white' 
                : 'border-slate-600 text-slate-400'
            }`}>
              <step.icon className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-slate-100' : 'text-slate-400'
              }`}>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`mx-6 h-0.5 w-16 ${
                currentStep > step.id ? 'bg-sky-500' : 'bg-slate-600'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Main content */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep} className="bg-sky-600 hover:bg-sky-700">
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Generate Report
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CostWizardSimple;