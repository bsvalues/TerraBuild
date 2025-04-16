import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ScenarioResults from "../components/scenarios/ScenarioResults";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Edit, Trash2, Save, BarChartHorizontal } from "lucide-react";

// Define scenario types for TypeScript
interface Scenario {
  id: number;
  name: string;
  description: string;
  parameters: {
    buildingType: string;
    region: string;
    baseYear: number;
    comparisonYear: number;
    adjustmentFactor: number;
    qualityFactor: number;
    conditionFactor: number;
    complexityFactor: number;
    [key: string]: any;
  };
  results: {
    baseCost: number;
    adjustedCost: number;
    difference: number;
    percentChange: number;
    details?: {
      factor: string;
      impact: number;
      percentImpact: number;
    }[];
    chartData?: any[];
  };
  is_saved: boolean;
  created_at: string;
}

export default function WhatIfScenariosPage() {
  const { toast } = useToast();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("scenarios");
  
  // Selected scenario
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  
  // Dialog states
  const [newScenarioOpen, setNewScenarioOpen] = useState(false);
  const [editScenarioOpen, setEditScenarioOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Form data for new/edit scenario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    buildingType: "R1",
    region: "Central Benton",
    baseYear: 2025,
    comparisonYear: 2025,
    adjustmentFactor: 1.0,
    qualityFactor: 1.0,
    conditionFactor: 1.0,
    complexityFactor: 1.0
  });
  
  // Fetch scenarios from API
  const { data: scenarios, isLoading, error } = useQuery<Scenario[]>({
    queryKey: ["/api/what-if-scenarios"],
    refetchOnWindowFocus: false,
  });
  
  // Handle selecting a scenario
  const handleSelectScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setActiveTab("results");
  };
  
  // Handle creating a new scenario
  const handleCreateScenario = () => {
    // Mock API call - In a real app, this would call the API to create the scenario
    toast({
      title: "Scenario Created",
      description: `${formData.name} has been created.`,
    });
    
    setNewScenarioOpen(false);
    // Reset form data
    setFormData({
      name: "",
      description: "",
      buildingType: "R1",
      region: "Central Benton",
      baseYear: 2025,
      comparisonYear: 2025,
      adjustmentFactor: 1.0,
      qualityFactor: 1.0,
      conditionFactor: 1.0,
      complexityFactor: 1.0
    });
  };
  
  // Handle updating a scenario
  const handleUpdateScenario = () => {
    // Mock API call - In a real app, this would call the API to update the scenario
    toast({
      title: "Scenario Updated",
      description: `${formData.name} has been updated.`,
    });
    
    setEditScenarioOpen(false);
  };
  
  // Handle deleting a scenario
  const handleDeleteScenario = () => {
    // Mock API call - In a real app, this would call the API to delete the scenario
    toast({
      title: "Scenario Deleted",
      description: "The scenario has been removed.",
    });
    
    setDeleteConfirmOpen(false);
    setSelectedScenario(null);
    setActiveTab("scenarios");
  };
  
  // Handle saving a scenario
  const handleSaveScenario = () => {
    // Mock API call - In a real app, this would call the API to save the scenario
    toast({
      title: "Scenario Saved",
      description: "The scenario has been saved to your collection.",
    });
  };
  
  // Handle edit scenario button
  const handleEditClick = (scenario: Scenario) => {
    setFormData({
      name: scenario.name,
      description: scenario.description,
      buildingType: scenario.parameters.buildingType,
      region: scenario.parameters.region,
      baseYear: scenario.parameters.baseYear,
      comparisonYear: scenario.parameters.comparisonYear,
      adjustmentFactor: scenario.parameters.adjustmentFactor,
      qualityFactor: scenario.parameters.qualityFactor,
      conditionFactor: scenario.parameters.conditionFactor,
      complexityFactor: scenario.parameters.complexityFactor
    });
    setEditScenarioOpen(true);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading scenarios...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          <p>Error loading scenarios. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>What-If Scenarios | BCBS</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">What-If Scenarios</h1>
            <p className="text-muted-foreground">
              Create and analyze different cost scenarios for building assessments
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button onClick={() => setNewScenarioOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Scenario
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="scenarios">Scenarios List</TabsTrigger>
            {selectedScenario && (
              <TabsTrigger value="results">Scenario Results</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="scenarios">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios && scenarios.length > 0 ? (
                scenarios.map((scenario) => (
                  <Card key={scenario.id} className="h-full flex flex-col">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="line-clamp-1">{scenario.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          {scenario.is_saved ? (
                            <Save className="h-4 w-4 text-green-500" />
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleSaveScenario()}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditClick(scenario)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteConfirmOpen(true)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {scenario.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Building Type:</span>
                          <p>{scenario.parameters.buildingType}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Region:</span>
                          <p>{scenario.parameters.region}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Base Year:</span>
                          <p>{scenario.parameters.baseYear}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comparison Year:</span>
                          <p>{scenario.parameters.comparisonYear}</p>
                        </div>
                      </div>
                      {scenario.results && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Base Cost:</span>
                            <span>${scenario.results.baseCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Adjusted Cost:</span>
                            <span>${scenario.results.adjustedCost.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center font-medium">
                            <span>Impact:</span>
                            <span className={
                              scenario.results.percentChange >= 0 
                                ? "text-green-600" 
                                : "text-red-600"
                            }>
                              {scenario.results.percentChange >= 0 ? "+" : ""}
                              {scenario.results.percentChange.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleSelectScenario(scenario)}
                      >
                        <BarChartHorizontal className="mr-2 h-4 w-4" />
                        View Analysis
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center p-8">
                  <h3 className="text-lg font-medium mb-2">No Scenarios Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first what-if scenario to analyze different building cost factors.
                  </p>
                  <Button onClick={() => setNewScenarioOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Scenario
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            {selectedScenario && (
              <ScenarioResults scenario={selectedScenario} />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* New Scenario Dialog */}
      <Dialog open={newScenarioOpen} onOpenChange={setNewScenarioOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New What-If Scenario</DialogTitle>
            <DialogDescription>
              Configure parameters to evaluate building cost variations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Residential Cost Analysis"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this scenario"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R1">Residential - Single Family</SelectItem>
                    <SelectItem value="R2">Residential - Multi-Family</SelectItem>
                    <SelectItem value="C1">Commercial - Retail</SelectItem>
                    <SelectItem value="C4">Commercial - Warehouse</SelectItem>
                    <SelectItem value="I1">Industrial - Manufacturing</SelectItem>
                    <SelectItem value="A1">Agricultural</SelectItem>
                    <SelectItem value="S1">Special Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="East Benton">East Benton</SelectItem>
                    <SelectItem value="Central Benton">Central Benton</SelectItem>
                    <SelectItem value="West Benton">West Benton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="baseYear">Base Year</Label>
                <Select
                  value={formData.baseYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, baseYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="comparisonYear">Comparison Year</Label>
                <Select
                  value={formData.comparisonYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, comparisonYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qualityFactor">Quality Factor</Label>
                <Select
                  value={formData.qualityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, qualityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">Low (0.8)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Very Good (1.2)</SelectItem>
                    <SelectItem value="1.5">Excellent (1.5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="conditionFactor">Condition Factor</Label>
                <Select
                  value={formData.conditionFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, conditionFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.7">Poor (0.7)</SelectItem>
                    <SelectItem value="0.85">Fair (0.85)</SelectItem>
                    <SelectItem value="1.0">Average (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Excellent (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="complexityFactor">Complexity Factor</Label>
                <Select
                  value={formData.complexityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, complexityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.9">Simple (0.9)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.05">Complex (1.05)</SelectItem>
                    <SelectItem value="1.1">Very Complex (1.1)</SelectItem>
                    <SelectItem value="1.2">Highly Complex (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="adjustmentFactor">Regional Adjustment</Label>
                <Select
                  value={formData.adjustmentFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, adjustmentFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.95">Low (-5%)</SelectItem>
                    <SelectItem value="1.0">Standard (0%)</SelectItem>
                    <SelectItem value="1.05">Moderate (+5%)</SelectItem>
                    <SelectItem value="1.1">High (+10%)</SelectItem>
                    <SelectItem value="1.15">Very High (+15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario}>
              Create Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Scenario Dialog */}
      <Dialog open={editScenarioOpen} onOpenChange={setEditScenarioOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Scenario</DialogTitle>
            <DialogDescription>
              Update parameters to refine your cost analysis.
            </DialogDescription>
          </DialogHeader>
          
          {/* Same form as new scenario dialog */}
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Scenario Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Residential Cost Analysis"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this scenario"
              />
            </div>
            
            {/* Same parameters as new scenario dialog */}
            {/* Building type and region */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-buildingType">Building Type</Label>
                <Select
                  value={formData.buildingType}
                  onValueChange={(value) => setFormData({ ...formData, buildingType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R1">Residential - Single Family</SelectItem>
                    <SelectItem value="R2">Residential - Multi-Family</SelectItem>
                    <SelectItem value="C1">Commercial - Retail</SelectItem>
                    <SelectItem value="C4">Commercial - Warehouse</SelectItem>
                    <SelectItem value="I1">Industrial - Manufacturing</SelectItem>
                    <SelectItem value="A1">Agricultural</SelectItem>
                    <SelectItem value="S1">Special Purpose</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-region">Region</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="East Benton">East Benton</SelectItem>
                    <SelectItem value="Central Benton">Central Benton</SelectItem>
                    <SelectItem value="West Benton">West Benton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Years */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-baseYear">Base Year</Label>
                <Select
                  value={formData.baseYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, baseYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-comparisonYear">Comparison Year</Label>
                <Select
                  value={formData.comparisonYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, comparisonYear: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2020">2020</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Factors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-qualityFactor">Quality Factor</Label>
                <Select
                  value={formData.qualityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, qualityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">Low (0.8)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Very Good (1.2)</SelectItem>
                    <SelectItem value="1.5">Excellent (1.5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-conditionFactor">Condition Factor</Label>
                <Select
                  value={formData.conditionFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, conditionFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.7">Poor (0.7)</SelectItem>
                    <SelectItem value="0.85">Fair (0.85)</SelectItem>
                    <SelectItem value="1.0">Average (1.0)</SelectItem>
                    <SelectItem value="1.1">Good (1.1)</SelectItem>
                    <SelectItem value="1.2">Excellent (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-complexityFactor">Complexity Factor</Label>
                <Select
                  value={formData.complexityFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, complexityFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.9">Simple (0.9)</SelectItem>
                    <SelectItem value="1.0">Standard (1.0)</SelectItem>
                    <SelectItem value="1.05">Complex (1.05)</SelectItem>
                    <SelectItem value="1.1">Very Complex (1.1)</SelectItem>
                    <SelectItem value="1.2">Highly Complex (1.2)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-adjustmentFactor">Regional Adjustment</Label>
                <Select
                  value={formData.adjustmentFactor.toString()}
                  onValueChange={(value) => setFormData({ ...formData, adjustmentFactor: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select factor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.95">Low (-5%)</SelectItem>
                    <SelectItem value="1.0">Standard (0%)</SelectItem>
                    <SelectItem value="1.05">Moderate (+5%)</SelectItem>
                    <SelectItem value="1.1">High (+10%)</SelectItem>
                    <SelectItem value="1.15">Very High (+15%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateScenario}>
              Update Scenario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this scenario? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteScenario}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}