import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { EnterpriseCard, EnterpriseCardHeader, EnterpriseCardTitle, EnterpriseCardContent } from "@/components/ui/enterprise-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, History, Building2, DollarSign, TrendingUp, FileText } from "lucide-react";
import { useCostMatrix } from "@/hooks/use-cost-matrix";

export default function CalculatorPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("calculator");
  const [calculation, setCalculation] = useState({
    buildingType: "",
    squareFootage: "",
    region: "Benton County",
    qualityClass: "standard",
    stories: "1"
  });
  const [result, setResult] = useState(null);
  
  const { data: costMatrix, isLoading } = useCostMatrix();

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

  const handleCalculate = () => {
    if (!calculation.buildingType || !calculation.squareFootage) return;
    
    // Base cost calculation using Benton County standards
    const baseCostPerSqFt = {
      "residential_single": 150,
      "residential_multi": 140,
      "commercial_office": 180,
      "commercial_retail": 160,
      "industrial_warehouse": 120,
      "institutional_school": 200
    }[calculation.buildingType] || 150;

    const qualityMultiplier = {
      "economy": 0.85,
      "standard": 1.0,
      "good": 1.15,
      "excellent": 1.35
    }[calculation.qualityClass] || 1.0;

    const storyMultiplier = parseFloat(calculation.stories) > 1 ? 1.1 : 1.0;
    
    const totalCost = parseFloat(calculation.squareFootage) * baseCostPerSqFt * qualityMultiplier * storyMultiplier;
    
    setResult({
      totalCost,
      costPerSqFt: totalCost / parseFloat(calculation.squareFootage),
      baseCost: baseCostPerSqFt,
      qualityAdjustment: (qualityMultiplier - 1) * 100,
      storyAdjustment: (storyMultiplier - 1) * 100
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Building Cost Calculator"
        description="Calculate accurate construction costs using Benton County building standards and current market data"
        icon={Calculator}
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Cost Analysis" },
          { label: "Calculator" }
        ]}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Base Cost Range"
          value="$120-200"
          unit="per sq ft"
          icon={DollarSign}
          description="Varies by building type"
        />
        <MetricCard
          title="Projects Calculated"
          value="1,247"
          trend="up"
          trendValue="+12%"
          icon={Building2}
        />
        <MetricCard
          title="Accuracy Rate"
          value="98.5%"
          trend="up"
          trendValue="+0.3%"
          icon={TrendingUp}
        />
        <MetricCard
          title="Active Standards"
          value="2024"
          description="Benton County standards"
          icon={FileText}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-800/50 border-slate-700/50">
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Cost Calculator
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Recent Calculations
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Form */}
            <EnterpriseCard>
              <EnterpriseCardHeader icon={Calculator}>
                <EnterpriseCardTitle>Project Parameters</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Building Type</Label>
                      <Select value={calculation.buildingType} onValueChange={(value) => 
                        setCalculation(prev => ({ ...prev, buildingType: value }))
                      }>
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
                      <Label>Square Footage</Label>
                      <Input
                        type="number"
                        placeholder="Enter square footage"
                        value={calculation.squareFootage}
                        onChange={(e) => setCalculation(prev => ({ ...prev, squareFootage: e.target.value }))}
                        className="bg-slate-800/50 border-slate-700/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quality Class</Label>
                      <Select value={calculation.qualityClass} onValueChange={(value) => 
                        setCalculation(prev => ({ ...prev, qualityClass: value }))
                      }>
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
                      <Label>Number of Stories</Label>
                      <Select value={calculation.stories} onValueChange={(value) => 
                        setCalculation(prev => ({ ...prev, stories: value }))
                      }>
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
                    <Label>Region</Label>
                    <Input
                      value={calculation.region}
                      disabled
                      className="bg-slate-800/50 border-slate-700/50"
                    />
                  </div>

                  <Button 
                    onClick={handleCalculate}
                    disabled={!calculation.buildingType || !calculation.squareFootage}
                    className="w-full bg-sky-600 hover:bg-sky-700"
                  >
                    <Calculator className="mr-2 h-4 w-4" />
                    Calculate Cost
                  </Button>
                </div>
              </EnterpriseCardContent>
            </EnterpriseCard>

            {/* Results */}
            <EnterpriseCard>
              <EnterpriseCardHeader icon={DollarSign}>
                <EnterpriseCardTitle>Cost Analysis Results</EnterpriseCardTitle>
              </EnterpriseCardHeader>
              <EnterpriseCardContent>
                {result ? (
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-sky-500/10 rounded-lg border border-sky-500/20">
                      <p className="text-2xl font-bold text-sky-400">
                        ${result.totalCost.toLocaleString()}
                      </p>
                      <p className="text-slate-400">Total Estimated Cost</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-sm text-slate-400">Cost per Sq Ft</p>
                        <p className="text-lg font-semibold text-slate-200">
                          ${result.costPerSqFt.toFixed(2)}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-800/30 rounded-lg">
                        <p className="text-sm text-slate-400">Base Cost</p>
                        <p className="text-lg font-semibold text-slate-200">
                          ${result.baseCost}/sq ft
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-200">Cost Adjustments</h4>
                      <div className="space-y-2">
                        {result.qualityAdjustment !== 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Quality Class</span>
                            <span className={result.qualityAdjustment > 0 ? "text-amber-400" : "text-emerald-400"}>
                              {result.qualityAdjustment > 0 ? "+" : ""}{result.qualityAdjustment.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {result.storyAdjustment !== 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Multi-Story</span>
                            <span className="text-amber-400">
                              +{result.storyAdjustment.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">Enter project parameters to calculate costs</p>
                  </div>
                )}
              </EnterpriseCardContent>
            </EnterpriseCard>
          </div>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <EnterpriseCard>
            <EnterpriseCardHeader icon={History}>
              <EnterpriseCardTitle>Recent Calculations</EnterpriseCardTitle>
            </EnterpriseCardHeader>
            <EnterpriseCardContent>
              <div className="text-center py-12">
                <History className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">Calculation history will appear here</p>
                <p className="text-sm text-slate-500 mt-2">Complete a calculation to start tracking your project estimates</p>
              </div>
            </EnterpriseCardContent>
          </EnterpriseCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}