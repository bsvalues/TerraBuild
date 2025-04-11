import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useWhatIfScenarios, TypedWhatIfScenario, ScenarioParameters, asTypedScenario } from "../lib/hooks/useWhatIfScenarios";
import { Checkbox } from "@/components/ui/checkbox";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import MainContent from "@/components/layout/MainContent";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Calendar,
  ChevronRight,
  Clock,
  Edit,
  FilePlus,
  LayoutList,
  Save,
  Trash2,
  Plus,
  AlertCircle,
  Check,
  X,
  Lightbulb,
} from "lucide-react";

import type { ScenarioVariation } from "@shared/schema";

export default function WhatIfScenariosPage() {
  // Using mock admin user since authentication is disabled
  const mockUser = { id: "1", role: "admin" };
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("list");
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);
  const [editScenarioOpen, setEditScenarioOpen] = useState(false);
  const [newVariationOpen, setNewVariationOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TypedWhatIfScenario | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parameters: {
      baseCost: 200000,
      squareFootage: 2000,
      complexity: 1.0,
      region: "Central"
    }
  });
  // Define a more flexible type for variation form to handle different parameter types
  const [variationForm, setVariationForm] = useState({
    name: "",
    parameterKey: "complexity",
    originalValue: 1.0,
    newValue: 1.1 as string | number,
  });
  
  const {
    getAllScenarios,
    getUserScenarios,
    getScenario,
    getScenarioVariations,
    getScenarioImpact,
    createScenario,
    updateScenario,
    saveScenario,
    deleteScenario,
    addVariation,
    deleteVariation
  } = useWhatIfScenarios();
  
  // Always use getAllScenarios since we have a mock admin user
  const scenariosQuery = getAllScenarios();
  
  // Use a fixed ID (like -1) when no scenario is selected to maintain hook call order
  // This ensures that hooks are always called in the same order regardless of selectedScenario
  const scenarioId = selectedScenario ? selectedScenario.id : -1;
  
  // Always call hooks with consistent parameters
  const scenarioVariationsQuery = getScenarioVariations(scenarioId);
  const scenarioImpactQuery = getScenarioImpact(scenarioId);
  
  // Handle creating a new scenario
  const handleCreateScenario = () => {
    createScenario.mutate({
      ...formData,
      results: {},
      baseCalculationId: null,
    }, {
      onSuccess: (data) => {
        // Data is now properly typed by our hook's transformation
        const typedScenario = asTypedScenario(data);
        toast({
          title: "Scenario Created",
          description: `Successfully created "${typedScenario.name}" scenario`,
        });
        setNewScenarioOpen(false);
        setFormData({
          name: "",
          description: "",
          parameters: {
            baseCost: 200000,
            squareFootage: 2000,
            complexity: 1.0,
            region: "Central"
          }
        });
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to create new scenario",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle updating a scenario
  const handleUpdateScenario = () => {
    if (!selectedScenario) return;
    
    updateScenario.mutate(
      { 
        id: selectedScenario.id, 
        data: formData 
      }, 
      {
        onSuccess: (data) => {
          // Data is now properly typed by our hook's transformation
          const typedScenario = asTypedScenario(data);
          toast({
            title: "Scenario Updated",
            description: `Successfully updated "${typedScenario.name}" scenario`,
          });
          setEditScenarioOpen(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update scenario",
            variant: "destructive"
          });
        }
      }
    );
  };
  
  // Handle saving a scenario
  const handleSaveScenario = (scenario: TypedWhatIfScenario) => {
    saveScenario.mutate(scenario.id, {
      onSuccess: (data) => {
        // Data is now properly typed by our hook's transformation
        const typedScenario = asTypedScenario(data);
        toast({
          title: "Scenario Saved",
          description: `Successfully saved "${typedScenario.name}" scenario`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to save scenario",
          variant: "destructive"
        });
      }
    });
  };
  
  // Handle deleting a scenario
  const handleDeleteScenario = (scenario: TypedWhatIfScenario) => {
    if (confirm(`Are you sure you want to delete the scenario "${scenario.name}"?`)) {
      deleteScenario.mutate(scenario.id, {
        onSuccess: () => {
          toast({
            title: "Scenario Deleted",
            description: `Successfully deleted "${scenario.name}" scenario`,
          });
          if (selectedScenario?.id === scenario.id) {
            setSelectedScenario(null);
            setActiveTab("list");
          }
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to delete scenario",
            variant: "destructive"
          });
        }
      });
    }
  };
  
  // Handle adding a variation
  const handleAddVariation = () => {
    if (!selectedScenario) return;
    
    const originalValue = selectedScenario.parameters[variationForm.parameterKey];
    const newValue = variationForm.newValue;
    
    // Calculate the impact value (simplified example)
    const baseCost = selectedScenario.parameters.baseCost || 0;
    const impactValue = calculateImpact(baseCost, originalValue, newValue, variationForm.parameterKey);
    const impactPercentage = ((impactValue / baseCost) * 100).toFixed(2);
    
    addVariation.mutate(
      {
        scenarioId: selectedScenario.id,
        data: {
          name: variationForm.name,
          parameterKey: variationForm.parameterKey,
          originalValue,
          newValue,
          impactValue: impactValue.toString(),
          impactPercentage
        }
      },
      {
        onSuccess: () => {
          toast({
            title: "Variation Added",
            description: `Successfully added "${variationForm.name}" variation`,
          });
          setNewVariationOpen(false);
          setVariationForm({
            name: "",
            parameterKey: "complexity",
            originalValue: 1.0,
            newValue: 1.1 as string | number,
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to add variation",
            variant: "destructive"
          });
        }
      }
    );
  };
  
  // Helper function to calculate impact of a parameter change
  const calculateImpact = (baseCost: number, originalValue: any, newValue: any, parameterKey: string) => {
    // This is a simplified calculation - in a real app, this would be more sophisticated
    switch (parameterKey) {
      case "complexity":
        return baseCost * (Number(newValue) - Number(originalValue));
      case "squareFootage":
        // Assume $100 per sq ft
        return (Number(newValue) - Number(originalValue)) * 100;
      case "region":
        // Just a placeholder - real calculation would be more complex
        return baseCost * 0.05;
      default:
        return 0;
    }
  };
  
  // Handle deleting a variation
  const handleDeleteVariation = (variation: ScenarioVariation) => {
    if (!selectedScenario) return;
    
    if (confirm(`Are you sure you want to delete the variation "${variation.name}"?`)) {
      deleteVariation.mutate(
        {
          variationId: variation.id,
          scenarioId: selectedScenario.id
        },
        {
          onSuccess: () => {
            toast({
              title: "Variation Deleted",
              description: `Successfully deleted "${variation.name}" variation`,
            });
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to delete variation",
              variant: "destructive"
            });
          }
        }
      );
    }
  };
  
  // Handle selecting a scenario for detailed view
  const handleSelectScenario = (scenario: TypedWhatIfScenario) => {
    setSelectedScenario(scenario);
    setActiveTab("detail");
  };
  
  // Handle opening the edit dialog
  const handleEditClick = (scenario: TypedWhatIfScenario) => {
    setSelectedScenario(scenario);
    setFormData({
      name: scenario.name,
      description: scenario.description || "",
      parameters: scenario.parameters || {
        baseCost: 200000,
        squareFootage: 2000,
        complexity: 1.0,
        region: "Central"
      }
    });
    setEditScenarioOpen(true);
  };
  
  // Prepare chart data for variations impact
  const getImpactChartData = () => {
    if (!scenarioVariationsQuery?.data) return [];
    
    return scenarioVariationsQuery.data.map((variation) => ({
      name: variation.name,
      impact: parseFloat(variation.impactValue || "0"),
      percentage: parseFloat(variation.impactPercentage || "0")
    }));
  };
  
  // Get pie chart data for parameter distribution
  const getParameterDistributionData = () => {
    if (!selectedScenario?.parameters) return [];
    
    const params = selectedScenario.parameters;
    const result = [];
    
    if (params.baseCost) {
      result.push({
        name: "Base Cost",
        value: Number(params.baseCost)
      });
    }
    
    if (scenarioVariationsQuery?.data) {
      for (const variation of scenarioVariationsQuery.data) {
        result.push({
          name: variation.name,
          value: Math.abs(parseFloat(variation.impactValue || "0"))
        });
      }
    }
    
    return result;
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];
  
  return (
    <LayoutWrapper>
      <MainContent title="What-If Scenarios">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center">
                <Lightbulb className="mr-2 h-6 w-6 text-primary" />
                What-If Scenario Analysis
              </h1>
              <p className="text-muted-foreground">
                Create and analyze different scenarios to see how parameter changes affect costs
              </p>
            </div>
            <Button onClick={() => setNewScenarioOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              New Scenario
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="list">Scenarios List</TabsTrigger>
              {selectedScenario && (
                <TabsTrigger value="detail">
                  Scenario Detail
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="list" className="space-y-4">
              {scenariosQuery?.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-[120px] w-full" />
                  <Skeleton className="h-[120px] w-full" />
                  <Skeleton className="h-[120px] w-full" />
                </div>
              ) : scenariosQuery?.data?.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
                      <Lightbulb className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No Scenarios Yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Create your first What-If scenario to start analyzing cost variations
                    </p>
                    <Button onClick={() => setNewScenarioOpen(true)} className="mt-6">
                      <FilePlus className="mr-2 h-4 w-4" />
                      Create First Scenario
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scenariosQuery?.data?.map((scenario) => (
                    <Card key={scenario.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">{scenario.name}</span>
                          {scenario.isSaved && (
                            <Badge variant="outline" className="ml-2 bg-green-50">
                              <Check className="mr-1 h-3 w-3" />
                              Saved
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {new Date(scenario.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {scenario.description || "No description provided"}
                        </p>
                        
                        <div className="mt-4 grid grid-cols-2 gap-1 text-xs">
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Base Cost:</span>
                            ${scenario.parameters.baseCost?.toLocaleString() || 0}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Region:</span>
                            {scenario.parameters.region || "N/A"}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Sq Footage:</span>
                            {scenario.parameters.squareFootage?.toLocaleString() || 0}
                          </div>
                          <div className="flex items-center">
                            <span className="font-medium mr-1">Complexity:</span>
                            {scenario.parameters.complexity || 1.0}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Button variant="ghost" size="sm" onClick={() => handleSelectScenario(scenario)}>
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                        <div className="flex space-x-1">
                          {!scenario.isSaved && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleSaveScenario(scenario)}
                              disabled={saveScenario.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditClick(scenario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteScenario(scenario)}
                            disabled={deleteScenario.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="detail">
              {selectedScenario && (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedScenario.name}</h2>
                      <div className="flex items-center text-sm text-muted-foreground space-x-4 mt-1">
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4" />
                          {new Date(selectedScenario.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4" />
                          Last updated: {new Date(selectedScenario.updatedAt).toLocaleDateString()}
                        </div>
                        {selectedScenario.isSaved && (
                          <Badge variant="outline" className="bg-green-50">
                            <Check className="mr-1 h-3 w-3" />
                            Saved
                          </Badge>
                        )}
                      </div>
                      <p className="mt-4">{selectedScenario.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      {!selectedScenario.isSaved && (
                        <Button 
                          onClick={() => handleSaveScenario(selectedScenario)}
                          disabled={saveScenario.isPending}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Save Scenario
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={() => handleEditClick(selectedScenario)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Base Parameters</CardTitle>
                        <CardDescription>
                          The original parameters for this scenario
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(selectedScenario.parameters || {}).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-1 border-b">
                              <span className="font-medium capitalize">{key}:</span>
                              <span className="text-right">
                                {key === 'baseCost' || key === 'squareFootage' 
                                  ? Number(value).toLocaleString()
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Variations</CardTitle>
                          <CardDescription>
                            Parameter variations and their impact
                          </CardDescription>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => {
                            if (selectedScenario) {
                              setVariationForm({
                                name: "",
                                parameterKey: "complexity",
                                originalValue: selectedScenario.parameters.complexity || 1.0,
                                newValue: ((selectedScenario.parameters.complexity || 1.0) * 1.1) as string | number,
                              });
                              setNewVariationOpen(true);
                            }
                          }}
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Variation
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {scenarioVariationsQuery?.isLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                            <Skeleton className="h-6 w-full" />
                          </div>
                        ) : scenarioVariationsQuery?.data?.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted-foreground">No variations added yet</p>
                            <Button 
                              variant="outline" 
                              className="mt-2"
                              onClick={() => {
                                if (selectedScenario) {
                                  setVariationForm({
                                    name: "",
                                    parameterKey: "complexity",
                                    originalValue: selectedScenario.parameters.complexity || 1.0,
                                    newValue: ((selectedScenario.parameters.complexity || 1.0) * 1.1) as string | number,
                                  });
                                  setNewVariationOpen(true);
                                }
                              }}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Add First Variation
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {scenarioVariationsQuery?.data?.map((variation) => (
                              <div 
                                key={variation.id} 
                                className="flex justify-between items-center p-2 bg-secondary/20 rounded-md"
                              >
                                <div>
                                  <p className="font-medium">{variation.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {variation.parameterKey}: {String(variation.originalValue)} → {String(variation.newValue)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className={
                                    parseFloat(variation.impactValue || "0") > 0 
                                      ? "text-red-500" 
                                      : "text-green-500"
                                  }>
                                    {parseFloat(variation.impactValue || "0") > 0 ? "+" : ""}
                                    ${Math.abs(parseFloat(variation.impactValue || "0")).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {parseFloat(variation.impactPercentage || "0") > 0 ? "+" : ""}
                                    {variation.impactPercentage || "0"}%
                                  </p>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6" 
                                    onClick={() => handleDeleteVariation(variation)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Impact Analysis</CardTitle>
                      <CardDescription>
                        Visualization of parameter changes and their impact
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(scenarioVariationsQuery?.isLoading || scenarioImpactQuery?.isLoading) ? (
                        <Skeleton className="h-[300px] w-full" />
                      ) : scenarioVariationsQuery?.data?.length === 0 ? (
                        <div className="text-center py-6">
                          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-lg">No variations to analyze</p>
                          <p className="text-muted-foreground">
                            Add parameter variations to see their impact analysis
                          </p>
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="h-[300px]">
                            <h3 className="text-base font-medium mb-2">Impact by Variation</h3>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getImpactChartData()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <RechartsTooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                                <Legend />
                                <Bar 
                                  dataKey="impact" 
                                  name="Cost Impact" 
                                  fill="#8884d8" 
                                  animationDuration={1000} 
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                          
                          <div className="h-[300px]">
                            <h3 className="text-base font-medium mb-2">Cost Distribution</h3>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={getParameterDistributionData()}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {getParameterDistributionData().map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Create New Scenario Dialog */}
          <Dialog open={newScenarioOpen} onOpenChange={setNewScenarioOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Scenario</DialogTitle>
                <DialogDescription>
                  Add a new what-if scenario to explore cost variations
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Scenario name"
                    className="col-span-3"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this scenario..."
                    className="col-span-3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="baseCost" className="text-right">
                    Base Cost ($)
                  </Label>
                  <Input
                    id="baseCost"
                    type="number"
                    className="col-span-3"
                    value={formData.parameters.baseCost}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        baseCost: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="squareFootage" className="text-right">
                    Square Footage
                  </Label>
                  <Input
                    id="squareFootage"
                    type="number"
                    className="col-span-3"
                    value={formData.parameters.squareFootage}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        squareFootage: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="region" className="text-right">
                    Region
                  </Label>
                  <Input
                    id="region"
                    className="col-span-3"
                    value={formData.parameters.region}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        region: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="complexity" className="text-right">
                    Complexity
                  </Label>
                  <Input
                    id="complexity"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    className="col-span-3"
                    value={formData.parameters.complexity}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        complexity: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewScenarioOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateScenario} 
                  disabled={!formData.name || createScenario.isPending}
                >
                  Create Scenario
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Scenario Dialog */}
          <Dialog open={editScenarioOpen} onOpenChange={setEditScenarioOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Edit Scenario</DialogTitle>
                <DialogDescription>
                  Update scenario details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Scenario name"
                    className="col-span-3"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Describe this scenario..."
                    className="col-span-3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-baseCost" className="text-right">
                    Base Cost ($)
                  </Label>
                  <Input
                    id="edit-baseCost"
                    type="number"
                    className="col-span-3"
                    value={formData.parameters.baseCost}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        baseCost: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-squareFootage" className="text-right">
                    Square Footage
                  </Label>
                  <Input
                    id="edit-squareFootage"
                    type="number"
                    className="col-span-3"
                    value={formData.parameters.squareFootage}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        squareFootage: Number(e.target.value)
                      }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-region" className="text-right">
                    Region
                  </Label>
                  <Input
                    id="edit-region"
                    className="col-span-3"
                    value={formData.parameters.region}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        region: e.target.value
                      }
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-complexity" className="text-right">
                    Complexity
                  </Label>
                  <Input
                    id="edit-complexity"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    className="col-span-3"
                    value={formData.parameters.complexity}
                    onChange={(e) => setFormData({
                      ...formData,
                      parameters: {
                        ...formData.parameters,
                        complexity: Number(e.target.value)
                      }
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditScenarioOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateScenario} 
                  disabled={!formData.name || updateScenario.isPending}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Add Variation Dialog */}
          <Dialog open={newVariationOpen} onOpenChange={setNewVariationOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add Parameter Variation</DialogTitle>
                <DialogDescription>
                  Create a parameter variation to see its impact on cost
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="variation-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="variation-name"
                    placeholder="Variation name"
                    className="col-span-3"
                    value={variationForm.name}
                    onChange={(e) => setVariationForm({ ...variationForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="variation-parameter" className="text-right">
                    Parameter
                  </Label>
                  <select
                    id="variation-parameter"
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={variationForm.parameterKey}
                    onChange={(e) => {
                      const selectedParameter = e.target.value;
                      const originalValue = selectedScenario?.parameters[selectedParameter] || 0;
                      
                      setVariationForm({
                        ...variationForm,
                        parameterKey: selectedParameter,
                        originalValue: originalValue,
                        newValue: selectedParameter === 'complexity' 
                          ? Number(originalValue) * 1.1 
                          : Number(originalValue) * 1.2
                      });
                    }}
                  >
                    <option value="complexity">Complexity</option>
                    <option value="squareFootage">Square Footage</option>
                    <option value="region">Region</option>
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="variation-original" className="text-right">
                    Original Value
                  </Label>
                  <Input
                    id="variation-original"
                    className="col-span-3"
                    value={variationForm.originalValue}
                    disabled
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="variation-new" className="text-right">
                    New Value
                  </Label>
                  <Input
                    id="variation-new"
                    type={variationForm.parameterKey === 'region' ? 'text' : 'number'}
                    step={variationForm.parameterKey === 'complexity' ? '0.1' : '1'}
                    className="col-span-3"
                    value={variationForm.newValue}
                    onChange={(e) => setVariationForm({
                      ...variationForm,
                      newValue: variationForm.parameterKey === 'region' 
                        ? e.target.value 
                        : Number(e.target.value)
                    })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewVariationOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddVariation} 
                  disabled={!variationForm.name || addVariation.isPending}
                >
                  Add Variation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </MainContent>
    </LayoutWrapper>
  );
}