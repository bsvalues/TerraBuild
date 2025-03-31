import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCostFactors } from "@/hooks/use-cost-factors";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Save, RefreshCw, Sliders } from "lucide-react";
import { regions, buildingTypes } from "@/data/constants";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Define the cost factor types that can be weighted
export type CostFactorType = 
  | "regionFactor" 
  | "complexityFactor" 
  | "qualityFactor" 
  | "conditionFactor" 
  | "sizeFactor" 
  | "heightFactor" 
  | "ageFactor";

export type CostFactorWeight = {
  id: string;
  name: string;
  factorType: CostFactorType;
  description: string;
  defaultWeight: number;
  currentWeight: number;
  impactDescription: string;
};

// Default cost factor weights (these would ideally come from the database)
const defaultCostFactors: CostFactorWeight[] = [
  {
    id: "region",
    name: "Region Factor",
    factorType: "regionFactor",
    description: "Adjusts costs based on the region within Benton County",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of regional cost differences"
  },
  {
    id: "complexity",
    name: "Complexity Factor",
    factorType: "complexityFactor",
    description: "Adjusts costs based on building complexity",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of building complexity"
  },
  {
    id: "quality",
    name: "Quality Factor",
    factorType: "qualityFactor",
    description: "Adjusts costs based on building quality",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of quality differences"
  },
  {
    id: "condition",
    name: "Condition Factor",
    factorType: "conditionFactor",
    description: "Adjusts costs based on building condition",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of building condition"
  },
  {
    id: "size",
    name: "Size Factor",
    factorType: "sizeFactor",
    description: "Adjusts costs based on building size (economies of scale)",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of building size"
  },
  {
    id: "height",
    name: "Height Factor",
    factorType: "heightFactor",
    description: "Adjusts costs based on building height",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of building height"
  },
  {
    id: "age",
    name: "Age Factor",
    factorType: "ageFactor",
    description: "Adjusts costs based on building age",
    defaultWeight: 1.0,
    currentWeight: 1.0,
    impactDescription: "Higher values increase the impact of building age"
  }
];

type PresetItem = {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
};

// Predefined presets for common weighting scenarios
const predefinedPresets: PresetItem[] = [
  {
    id: "standard",
    name: "Standard Assessment",
    description: "Default Benton County assessment weights",
    weights: {
      region: 1.0,
      complexity: 1.0,
      quality: 1.0,
      condition: 1.0,
      size: 1.0,
      height: 1.0,
      age: 1.0
    }
  },
  {
    id: "modern-emphasis",
    name: "Modern Construction",
    description: "Emphasizes quality and complexity factors for modern buildings",
    weights: {
      region: 1.0,
      complexity: 1.4,
      quality: 1.3,
      condition: 0.9,
      size: 1.0,
      height: 1.1,
      age: 0.7
    }
  },
  {
    id: "historic",
    name: "Historic Property",
    description: "Adjusts weights for historic properties",
    weights: {
      region: 1.0,
      complexity: 1.2,
      quality: 1.1,
      condition: 0.8,
      size: 0.9,
      height: 1.0,
      age: 1.5
    }
  },
  {
    id: "commercial-focus",
    name: "Commercial Focus",
    description: "Weighted for commercial property assessment",
    weights: {
      region: 1.2,
      complexity: 1.2,
      quality: 1.1,
      condition: 1.0,
      size: 1.3,
      height: 1.2,
      age: 0.9
    }
  }
];

type CostFactorWeightingResult = {
  buildingType: string;
  region: string;
  basePrice: number;
  adjustedPrice: number;
  difference: number;
  factorImpact: {
    factorType: CostFactorType;
    originalImpact: number;
    adjustedImpact: number;
    netChange: number;
  }[];
};

export function CostFactorWeightSlider() {
  const [weights, setWeights] = useState<CostFactorWeight[]>(defaultCostFactors);
  const [userPresets, setUserPresets] = useState<PresetItem[]>([]);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("Central Benton");
  const [selectedBuildingType, setSelectedBuildingType] = useState("R1");
  const [previewResults, setPreviewResults] = useState<CostFactorWeightingResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  
  const { toast } = useToast();
  const { createCostFactor, updateCostFactor } = useCostFactors();
  
  useEffect(() => {
    // Load saved presets from localStorage
    const savedPresets = localStorage.getItem("costFactorPresets");
    if (savedPresets) {
      try {
        setUserPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error("Error loading saved presets:", error);
      }
    }
  }, []);

  // Update a single weight factor
  const updateWeight = (id: string, value: number) => {
    setWeights(
      weights.map((weight) =>
        weight.id === id ? { ...weight, currentWeight: value } : weight
      )
    );
  };

  // Reset all weights to their default values
  const resetToDefaults = () => {
    setWeights(
      weights.map((weight) => ({
        ...weight,
        currentWeight: weight.defaultWeight
      }))
    );
    
    toast({
      title: "Weights Reset",
      description: "All weights have been reset to their default values",
    });
  };

  // Apply a predefined preset
  const applyPreset = (presetId: string) => {
    const allPresets = [...predefinedPresets, ...userPresets];
    const preset = allPresets.find(p => p.id === presetId);
    
    if (!preset) return;
    
    setSelectedPreset(presetId);
    
    // Update weights based on the preset
    setWeights(
      weights.map((weight) => ({
        ...weight,
        currentWeight: preset.weights[weight.id] || weight.defaultWeight
      }))
    );
    
    toast({
      title: `Applied "${preset.name}" Preset`,
      description: preset.description,
    });
  };

  // Save the current weights as a new preset
  const saveAsPreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Error Saving Preset",
        description: "Please provide a name for your preset",
        variant: "destructive"
      });
      return;
    }
    
    // Create the preset object
    const newPreset: PresetItem = {
      id: `user-${Date.now()}`,
      name: presetName,
      description: presetDescription || "Custom weight configuration",
      weights: weights.reduce((acc, weight) => {
        acc[weight.id] = weight.currentWeight;
        return acc;
      }, {} as Record<string, number>)
    };
    
    // Add to user presets
    const updatedPresets = [...userPresets, newPreset];
    setUserPresets(updatedPresets);
    
    // Save to localStorage
    localStorage.setItem("costFactorPresets", JSON.stringify(updatedPresets));
    
    // Reset form
    setPresetName("");
    setPresetDescription("");
    
    // Show success toast
    toast({
      title: "Preset Saved",
      description: `Your preset "${newPreset.name}" has been saved successfully`,
    });
  };

  // Delete a user preset
  const deletePreset = (presetId: string) => {
    const updatedPresets = userPresets.filter(p => p.id !== presetId);
    setUserPresets(updatedPresets);
    localStorage.setItem("costFactorPresets", JSON.stringify(updatedPresets));
    
    if (selectedPreset === presetId) {
      setSelectedPreset("");
    }
    
    toast({
      title: "Preset Deleted",
      description: "Your custom preset has been deleted",
    });
  };

  // Generate a preview of how the weights would affect a cost calculation
  const generatePreview = async () => {
    setIsPreviewLoading(true);
    
    // In a real implementation, this would call the API with the weights
    // For now, we'll simulate a result
    setTimeout(() => {
      const basePrice = 127.50; // Base price per square foot
      
      // Calculate the adjusted price based on weights
      const regionWeight = weights.find(w => w.id === "region")?.currentWeight || 1.0;
      const complexityWeight = weights.find(w => w.id === "complexity")?.currentWeight || 1.0;
      const qualityWeight = weights.find(w => w.id === "quality")?.currentWeight || 1.0;
      
      // Simulate how each factor contributes to the final price
      const factorContributions = weights.map(weight => {
        const originalImpact = basePrice * 0.05; // 5% impact per factor (simplified)
        const adjustedImpact = originalImpact * weight.currentWeight;
        return {
          factorType: weight.factorType,
          originalImpact,
          adjustedImpact,
          netChange: adjustedImpact - originalImpact
        };
      });
      
      // Calculate the new price with weighted factors
      const totalAdjustment = factorContributions.reduce((sum, factor) => sum + factor.netChange, 0);
      const adjustedPrice = basePrice + totalAdjustment;
      
      setPreviewResults({
        buildingType: selectedBuildingType,
        region: selectedRegion,
        basePrice,
        adjustedPrice,
        difference: adjustedPrice - basePrice,
        factorImpact: factorContributions
      });
      
      setIsPreviewLoading(false);
    }, 1000); // Simulate API delay
  };

  // Save the current weights to the database
  const saveWeightsToSystem = async () => {
    // This would update the cost factors in the database
    toast({
      title: "Weights Saved",
      description: "Your custom weight factors have been saved to the system",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Cost Factor Weighting Tool</h3>
          <p className="text-sm text-muted-foreground">
            Customize how different factors influence building cost calculations for Benton County assessments
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="editor" className="mt-0 space-y-4">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Factor Weight Adjustment</CardTitle>
            <CardDescription>
              Adjust the weights of different factors that influence building cost calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {weights.map((factor) => (
              <div key={factor.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`slider-${factor.id}`} className="font-medium">
                    {factor.name}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      ({factor.currentWeight.toFixed(2)}×)
                    </span>
                  </Label>
                  <Input
                    id={`input-${factor.id}`}
                    type="number"
                    min={0}
                    max={2}
                    step={0.1}
                    value={factor.currentWeight}
                    onChange={(e) => updateWeight(factor.id, parseFloat(e.target.value))}
                    className="w-16 h-8 text-right"
                  />
                </div>
                <Slider
                  id={`slider-${factor.id}`}
                  min={0}
                  max={2}
                  step={0.1}
                  value={[factor.currentWeight]}
                  onValueChange={(values) => updateWeight(factor.id, values[0])}
                />
                <p className="text-xs text-muted-foreground">{factor.impactDescription}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reset to Defaults
            </Button>
            <Button onClick={saveWeightsToSystem}>
              <Save className="mr-2 h-4 w-4" /> Save Weights
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Preview Impact</CardTitle>
            <CardDescription>
              See how your weight adjustments would affect cost calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preview-region">Region</Label>
                <Select
                  value={selectedRegion}
                  onValueChange={setSelectedRegion}
                >
                  <SelectTrigger id="preview-region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="preview-building-type">Building Type</Label>
                <Select
                  value={selectedBuildingType}
                  onValueChange={setSelectedBuildingType}
                >
                  <SelectTrigger id="preview-building-type">
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                onClick={generatePreview}
                disabled={isPreviewLoading}
              >
                <Sliders className="mr-2 h-4 w-4" />
                {isPreviewLoading ? "Calculating..." : "Calculate Impact"}
              </Button>
            </div>
            
            {previewResults && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Standard Price</div>
                    <div className="text-2xl font-bold">
                      ${previewResults.basePrice.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">per square foot</div>
                  </div>
                  
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground">Adjusted Price</div>
                    <div className="text-2xl font-bold text-primary">
                      ${previewResults.adjustedPrice.toFixed(2)}
                    </div>
                    <div className="text-xs flex items-center">
                      <Badge variant={previewResults.difference >= 0 ? "default" : "destructive"}>
                        {previewResults.difference >= 0 ? "+" : ""}
                        ${Math.abs(previewResults.difference).toFixed(2)}
                      </Badge>
                      <span className="ml-1 text-muted-foreground">per square foot</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={previewResults.factorImpact.map(impact => ({
                        name: weights.find(w => w.factorType === impact.factorType)?.name || impact.factorType,
                        original: impact.originalImpact,
                        adjusted: impact.adjustedImpact,
                        change: impact.netChange
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="original" name="Standard Impact" fill="#8884d8" />
                      <Bar dataKey="adjusted" name="Adjusted Impact" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="presets" className="mt-0 space-y-4">
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Predefined Presets</CardTitle>
            <CardDescription>
              Standard weighting configurations for different assessment scenarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predefinedPresets.map((preset) => (
                <div 
                  key={preset.id} 
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedPreset === preset.id 
                      ? "border-primary bg-primary/10" 
                      : "hover:border-neutral-300"
                  }`}
                  onClick={() => applyPreset(preset.id)}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-sm text-muted-foreground">{preset.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Custom Presets</CardTitle>
            <CardDescription>
              Saved weight configurations for your specific assessment needs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userPresets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userPresets.map((preset) => (
                  <div 
                    key={preset.id} 
                    className={`p-4 border rounded-lg relative ${
                      selectedPreset === preset.id 
                        ? "border-primary bg-primary/10" 
                        : "hover:border-neutral-300"
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-sm text-muted-foreground mb-6">{preset.description}</div>
                    <div className="absolute bottom-2 right-2 flex">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                        }}
                      >
                        Delete
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyPreset(preset.id)}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven't saved any custom presets yet.</p>
                <p className="text-sm">Use the form below to save your current weights as a preset.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Save New Preset</CardTitle>
            <CardDescription>
              Save your current weight settings as a reusable preset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input 
                id="preset-name" 
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="e.g., East Benton Commercial"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="preset-description">Description (Optional)</Label>
              <Input 
                id="preset-description" 
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Brief description of this weight configuration"
              />
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button onClick={saveAsPreset}>
              <Save className="mr-2 h-4 w-4" /> Save as Preset
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </div>
  );
}