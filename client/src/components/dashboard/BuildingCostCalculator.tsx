import React, { useState } from "react";
import { useBuildingCosts, CalculationResponse, MaterialsBreakdownResponse } from "@/hooks/use-building-costs";
import { useCostFactors } from "@/hooks/use-cost-factors";
import { REGIONS, BUILDING_TYPES, COMPLEXITY_OPTIONS } from "@/data/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";

// Form schema
const calculatorSchema = z.object({
  region: z.string().min(1, "Region is required"),
  buildingType: z.string().min(1, "Building type is required"),
  squareFootage: z.coerce.number().min(1, "Square footage must be at least 1"),
  complexityMultiplier: z.coerce.number().optional()
});

type CalculatorForm = z.infer<typeof calculatorSchema>;

export default function BuildingCostCalculator() {
  // All useState hooks declarations should be in the same order between renders
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [materialsBreakdown, setMaterialsBreakdown] = useState<MaterialsBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("summary");
  
  // Hooks
  const { calculateCost, calculateMaterialsBreakdown } = useBuildingCosts();
  const { costFactors, isLoadingFactors } = useCostFactors();

  const form = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      region: REGIONS[0].value,
      buildingType: BUILDING_TYPES[0].value,
      squareFootage: 1000,
      complexityMultiplier: 1
    }
  });

  const onSubmit = async (data: CalculatorForm) => {
    setLoading(true);
    try {
      console.log("Submitting form data:", data);
      
      // Calculate regular cost estimate
      const response = await calculateCost.mutateAsync(data);
      console.log("Cost calculation response:", response);
      if (response instanceof Response) {
        const jsonData = await response.json();
        console.log("Cost calculation JSON data:", jsonData);
        setResult(jsonData as CalculationResponse);
      }
      
      // Calculate materials breakdown
      console.log("Calculating materials breakdown with:", data);
      const materialsResponse = await calculateMaterialsBreakdown.mutateAsync(data);
      console.log("Materials breakdown response:", materialsResponse);
      if (materialsResponse instanceof Response) {
        const materialsData = await materialsResponse.json();
        console.log("Materials breakdown JSON data:", materialsData);
        setMaterialsBreakdown(materialsData as MaterialsBreakdownResponse);
      }
    } catch (error) {
      console.error("Calculation error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold text-neutral-600 mb-4">Building Cost Calculator</h2>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-200">
          <h3 className="text-sm font-medium text-neutral-600">Cost Estimator</h3>
        </div>

        {isLoadingFactors ? (
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-10 bg-neutral-200 rounded mb-4"></div>
              <div className="h-10 bg-neutral-200 rounded mb-4"></div>
              <div className="h-10 bg-neutral-200 rounded mb-4"></div>
              <div className="h-10 bg-neutral-200 rounded"></div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Region
                  </label>
                  <select
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-600"
                    {...form.register("region")}
                  >
                    {REGIONS.map(region => (
                      <option key={region.value} value={region.value}>{region.label}</option>
                    ))}
                  </select>
                  {form.formState.errors.region && (
                    <p className="text-xs text-danger mt-1">{form.formState.errors.region.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Building Type
                  </label>
                  <select
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-600"
                    {...form.register("buildingType")}
                  >
                    {BUILDING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {form.formState.errors.buildingType && (
                    <p className="text-xs text-danger mt-1">{form.formState.errors.buildingType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-600"
                    placeholder="Enter square footage"
                    {...form.register("squareFootage")}
                  />
                  {form.formState.errors.squareFootage && (
                    <p className="text-xs text-danger mt-1">{form.formState.errors.squareFootage.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">
                    Complexity
                  </label>
                  <select
                    className="w-full bg-neutral-100 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-600"
                    {...form.register("complexityMultiplier")}
                  >
                    {COMPLEXITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full bg-primary text-white rounded-md py-2 text-sm font-medium hover:bg-primary-dark disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : 'Calculate Estimated Cost'}
                </button>
              </div>

              <div className={`bg-neutral-50 p-5 rounded-lg border border-neutral-200 ${!result ? 'flex items-center justify-center' : ''}`}>
                {!result ? (
                  <div className="text-center text-neutral-500 text-sm">
                    <i className="ri-calculator-line text-3xl mb-2 block"></i>
                    Enter your building details and click calculate to see cost estimates
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-base font-semibold text-neutral-700">Cost Estimate Results</h4>
                    
                    <div className="text-center py-4">
                      <div className="text-2xl font-bold text-primary">{formatCurrency(result.totalCost)}</div>
                      <div className="text-sm text-neutral-500">Total Estimated Cost</div>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger 
                          value="summary" 
                          className="text-xs"
                        >
                          Summary
                        </TabsTrigger>
                        <TabsTrigger 
                          value="materials" 
                          className="text-xs"
                        >
                          Materials
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="summary" className="mt-0">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Region:</span>
                            <span className="text-xs font-medium text-neutral-700">{result.region}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Building Type:</span>
                            <span className="text-xs font-medium text-neutral-700">{result.buildingType}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Square Footage:</span>
                            <span className="text-xs font-medium text-neutral-700">{result.squareFootage.toLocaleString()} sq ft</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Base Cost:</span>
                            <span className="text-xs font-medium text-neutral-700">{formatCurrency(result.baseCost)} per sq ft</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Region Factor:</span>
                            <span className="text-xs font-medium text-neutral-700">{result.regionFactor.toFixed(2)}×</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Complexity Factor:</span>
                            <span className="text-xs font-medium text-neutral-700">{result.complexityFactor.toFixed(2)}×</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">Cost per Sq Ft:</span>
                            <span className="text-xs font-medium text-neutral-700">{formatCurrency(result.costPerSqft)}</span>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="materials" className="mt-0">
                        {materialsBreakdown && materialsBreakdown.materials ? (
                          <div className="space-y-3">
                            <div className="max-h-[180px] overflow-y-auto pr-1">
                              <table className="w-full text-xs">
                                <thead className="bg-neutral-100 sticky top-0">
                                  <tr>
                                    <th className="text-left p-1.5 font-medium text-neutral-600">Material</th>
                                    <th className="text-right p-1.5 font-medium text-neutral-600">%</th>
                                    <th className="text-right p-1.5 font-medium text-neutral-600">Cost</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {materialsBreakdown.materials.map((material) => (
                                    <tr key={material.id} className="border-b border-neutral-100">
                                      <td className="p-1.5 text-neutral-700">
                                        {material.materialName}
                                        <span className="text-neutral-400 text-[10px] block">
                                          {material.materialCode}
                                        </span>
                                      </td>
                                      <td className="p-1.5 text-right text-neutral-700">
                                        {material.percentage.toFixed(1)}%
                                      </td>
                                      <td className="p-1.5 text-right font-medium text-neutral-700">
                                        {formatCurrency(material.totalCost)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            <div className="flex justify-between items-center pt-1 border-t border-neutral-200">
                              <span className="text-xs font-medium text-neutral-600">Total Material Cost:</span>
                              <span className="text-xs font-bold text-primary">
                                {formatCurrency(
                                  materialsBreakdown.materials.reduce((sum, m) => sum + m.totalCost, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-neutral-500">
                            <i className="ri-loader-4-line animate-spin text-xl block mb-2"></i>
                            Loading materials breakdown...
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                    
                    <button
                      type="button"
                      className="w-full mt-4 border border-neutral-300 text-neutral-700 rounded-md py-1.5 text-xs font-medium"
                      onClick={() => {
                        setResult(null);
                        setMaterialsBreakdown(null);
                      }}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}