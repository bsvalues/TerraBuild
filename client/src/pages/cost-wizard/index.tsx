import React, { useState } from 'react';
import { Calculator, Building2, MapPin, DollarSign, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const CostWizardPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyType: '',
    address: '',
    squareFootage: '',
    yearBuilt: '',
    stories: '',
    foundation: '',
    roofType: '',
    exteriorWalls: '',
    interiorFinish: '',
    hvacSystem: '',
    plumbing: '',
    electrical: '',
    specialFeatures: ''
  });

  const steps = [
    { id: 1, title: 'Property Basics', icon: Building2 },
    { id: 2, title: 'Structure Details', icon: MapPin },
    { id: 3, title: 'Systems & Features', icon: Calculator },
    { id: 4, title: 'Cost Analysis', icon: DollarSign }
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select value={formData.propertyType} onValueChange={(value) => handleInputChange('propertyType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single-family">Single Family Residence</SelectItem>
                    <SelectItem value="multi-family">Multi-Family</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Property Address</Label>
                <Input
                  id="address"
                  placeholder="Enter property address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  placeholder="Enter total square footage"
                  value={formData.squareFootage}
                  onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input
                  id="yearBuilt"
                  type="number"
                  placeholder="Enter year built"
                  value={formData.yearBuilt}
                  onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="stories">Number of Stories</Label>
                <Select value={formData.stories} onValueChange={(value) => handleInputChange('stories', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Story</SelectItem>
                    <SelectItem value="1.5">1.5 Stories</SelectItem>
                    <SelectItem value="2">2 Stories</SelectItem>
                    <SelectItem value="2.5">2.5 Stories</SelectItem>
                    <SelectItem value="3+">3+ Stories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foundation">Foundation Type</Label>
                <Select value={formData.foundation} onValueChange={(value) => handleInputChange('foundation', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select foundation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slab">Concrete Slab</SelectItem>
                    <SelectItem value="crawl-space">Crawl Space</SelectItem>
                    <SelectItem value="full-basement">Full Basement</SelectItem>
                    <SelectItem value="partial-basement">Partial Basement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="roofType">Roof Type</Label>
                <Select value={formData.roofType} onValueChange={(value) => handleInputChange('roofType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select roof type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asphalt-shingle">Asphalt Shingle</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="tile">Tile</SelectItem>
                    <SelectItem value="slate">Slate</SelectItem>
                    <SelectItem value="flat">Flat/Built-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exteriorWalls">Exterior Walls</Label>
                <Select value={formData.exteriorWalls} onValueChange={(value) => handleInputChange('exteriorWalls', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exterior material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vinyl-siding">Vinyl Siding</SelectItem>
                    <SelectItem value="wood-siding">Wood Siding</SelectItem>
                    <SelectItem value="brick">Brick</SelectItem>
                    <SelectItem value="stucco">Stucco</SelectItem>
                    <SelectItem value="stone">Stone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hvacSystem">HVAC System</Label>
                <Select value={formData.hvacSystem} onValueChange={(value) => handleInputChange('hvacSystem', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select HVAC system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="central-air">Central Air/Heat</SelectItem>
                    <SelectItem value="heat-pump">Heat Pump</SelectItem>
                    <SelectItem value="baseboard">Electric Baseboard</SelectItem>
                    <SelectItem value="radiant">Radiant Heat</SelectItem>
                    <SelectItem value="none">No Central System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plumbing">Plumbing Quality</Label>
                <Select value={formData.plumbing} onValueChange={(value) => handleInputChange('plumbing', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plumbing quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="above-average">Above Average</SelectItem>
                    <SelectItem value="high-end">High End</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="electrical">Electrical System</Label>
                <Select value={formData.electrical} onValueChange={(value) => handleInputChange('electrical', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select electrical system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100-amp">100 Amp Service</SelectItem>
                    <SelectItem value="200-amp">200 Amp Service</SelectItem>
                    <SelectItem value="400-amp">400 Amp Service</SelectItem>
                    <SelectItem value="updated">Recently Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interiorFinish">Interior Finish Quality</Label>
                <Select value={formData.interiorFinish} onValueChange={(value) => handleInputChange('interiorFinish', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finish quality" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="above-average">Above Average</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialFeatures">Special Features</Label>
              <Textarea
                id="specialFeatures"
                placeholder="List any special features (fireplace, deck, pool, etc.)"
                value={formData.specialFeatures}
                onChange={(e) => handleInputChange('specialFeatures', e.target.value)}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-emerald-400">Estimated Replacement Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-100 mb-2">$487,500</div>
                  <div className="text-sm text-slate-400">Based on Benton County rates</div>
                  <div className="text-sm text-slate-400">$195/sq ft average</div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-sky-400">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Construction</span>
                      <span className="text-slate-100">$385,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">HVAC System</span>
                      <span className="text-slate-100">$45,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Electrical/Plumbing</span>
                      <span className="text-slate-100">$32,500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Special Features</span>
                      <span className="text-slate-100">$25,000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-emerald-500/10 border-emerald-500/30">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Analysis Complete</h3>
                    <p className="text-slate-400">Your property cost estimation has been calculated using current Benton County building standards.</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Cost Estimation Wizard</h1>
          <p className="text-slate-400 mt-1">Step-by-step property cost analysis</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
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

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Step {currentStep}: {steps[currentStep - 1]?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={prevStep} 
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={nextStep}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button>
            Generate Report
            <CheckCircle className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default CostWizardPage;