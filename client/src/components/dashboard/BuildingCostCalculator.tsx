import React, { useState } from "react";
import { useBuildingCosts, CalculationResponse, MaterialsBreakdownResponse } from "@/hooks/use-building-costs";
import { useCostFactors } from "@/hooks/use-cost-factors";
import { 
  REGIONS, BUILDING_TYPES, COMPLEXITY_OPTIONS, 
  PROPERTY_CLASSES, ASSESSMENT_YEARS, CONDITION_TYPES 
} from "@/data/constants";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Sector 
} from "recharts";
import CostBreakdownPdfExport from "./CostBreakdownPdfExport";

// Form schema - Enhanced for Benton County, Washington
const calculatorSchema = z.object({
  region: z.string().min(1, "Region is required"),
  buildingType: z.string().min(1, "Building type is required"),
  propertyClass: z.string().optional(),
  squareFootage: z.coerce.number().min(1, "Square footage must be at least 1"),
  complexityMultiplier: z.coerce.number().optional(),
  taxLotId: z.string().optional(),
  propertyId: z.string().optional(),
  assessmentYear: z.coerce.number().default(2025),
  yearBuilt: z.coerce.number().optional(),
  condition: z.string().optional()
});

type CalculatorForm = z.infer<typeof calculatorSchema>;

// For custom active shape in pie chart
const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value, name
  } = props;

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" className="text-xs">
        {name}
      </text>
      <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-xs font-semibold">
        ${Number(value).toLocaleString()}
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#999" className="text-xs">
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
    </g>
  );
};

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-neutral-200 rounded-md shadow-sm text-xs">
        <p className="font-medium">{payload[0].payload.name}</p>
        <p className="text-neutral-500">Cost: ${Number(payload[0].value).toLocaleString()}</p>
        <p className="text-neutral-500">Percentage: {payload[0].payload.percentage.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

export default function BuildingCostCalculator() {
  // All useState hooks declarations should be in the same order between renders
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [materialsBreakdown, setMaterialsBreakdown] = useState<MaterialsBreakdownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [activePieIndex, setActivePieIndex] = useState<number>(0);
  
  // Hooks
  const { calculateCost, calculateMaterialsBreakdown } = useBuildingCosts();
  const { costFactors, isLoadingFactors } = useCostFactors();

  const form = useForm<CalculatorForm>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      region: REGIONS[0].value,
      buildingType: BUILDING_TYPES[0].value,
      propertyClass: PROPERTY_CLASSES[0].value, // R1 - Single Family Residential
      squareFootage: 1000,
      complexityMultiplier: 1,
      assessmentYear: Number(ASSESSMENT_YEARS[0].value),
      condition: CONDITION_TYPES[2].value, // Average condition by default
      yearBuilt: new Date().getFullYear() - 10 // Default to 10 years old
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
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-600">Building Cost Calculator</h2>
        {result && (
          <button
            type="button"
            className="text-xs text-neutral-500 flex items-center gap-1 hover:text-neutral-700"
            onClick={() => {
              setResult(null);
              setMaterialsBreakdown(null);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Calculator
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="bg-white border border-neutral-200 rounded-lg md:col-span-1">
          <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-600">Input Parameters</h3>
          </div>

          {isLoadingFactors ? (
            <div className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-9 bg-neutral-200 rounded"></div>
                <div className="h-9 bg-neutral-200 rounded"></div>
                <div className="h-9 bg-neutral-200 rounded"></div>
                <div className="h-9 bg-neutral-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Region
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                    {...form.register("region")}
                  >
                    {REGIONS.map(region => (
                      <option key={region.value} value={region.value}>{region.label}</option>
                    ))}
                  </select>
                  {form.formState.errors.region && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.region.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Building Type
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                    {...form.register("buildingType")}
                  >
                    {BUILDING_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                  {form.formState.errors.buildingType && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.buildingType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Square Footage
                  </label>
                  <input
                    type="number"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                    placeholder="Enter square footage"
                    {...form.register("squareFootage")}
                  />
                  {form.formState.errors.squareFootage && (
                    <p className="text-xs text-red-500 mt-1">{form.formState.errors.squareFootage.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Property Class
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                    {...form.register("propertyClass")}
                  >
                    {PROPERTY_CLASSES.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 mb-1">
                    Complexity
                  </label>
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                    {...form.register("complexityMultiplier")}
                  >
                    {COMPLEXITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Benton County, Washington specific fields */}
                <div className="pt-3 border-t border-neutral-200">
                  <h4 className="text-xs font-medium text-neutral-600 mb-2">Benton County, Washington Assessment Details</h4>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Tax Lot ID
                        </label>
                        <input
                          type="text"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                          placeholder="e.g. 12345"
                          {...form.register("taxLotId")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Property ID
                        </label>
                        <input
                          type="text"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                          placeholder="e.g. BN-1234"
                          {...form.register("propertyId")}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Assessment Year
                        </label>
                        <select
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                          {...form.register("assessmentYear", {
                            setValueAs: (value) => Number(value),
                          })}
                        >
                          {ASSESSMENT_YEARS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Year Built
                        </label>
                        <input
                          type="number"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                          placeholder="e.g. 1990"
                          min="1800"
                          max={new Date().getFullYear()}
                          {...form.register("yearBuilt")}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Building Condition
                      </label>
                      <select
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-2 text-sm text-neutral-700"
                        {...form.register("condition")}
                      >
                        {CONDITION_TYPES.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-4 w-full bg-primary hover:bg-primary/90 text-white rounded-md py-2 text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-70"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Calculate Cost
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className="bg-white border border-neutral-200 rounded-lg md:col-span-2">
          <div className="px-4 py-3 border-b border-neutral-200">
            <h3 className="text-sm font-medium text-neutral-600">Cost Estimate Results</h3>
          </div>

          <div className="p-0">
            {!result ? (
              <div className="flex items-center justify-center h-[400px] text-center text-neutral-500 p-4">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-neutral-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Enter your building details and click calculate to see cost estimates</p>
                  <p className="text-xs mt-2 text-neutral-400">Results will appear here with detailed breakdowns</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[400px]">
                <div className="text-center bg-neutral-50 py-4 border-b border-neutral-200">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(result.totalCost)}</div>
                  <div className="text-sm text-neutral-500">Total Estimated Cost</div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger 
                        value="summary" 
                        className="text-xs py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Summary
                      </TabsTrigger>
                      <TabsTrigger 
                        value="materials" 
                        className="text-xs py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Materials
                      </TabsTrigger>
                      <TabsTrigger 
                        value="visualization" 
                        className="text-xs py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Visualization
                      </TabsTrigger>
                      <TabsTrigger 
                        value="assessment" 
                        className="text-xs py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary"
                      >
                        Assessment
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="summary" className="mt-0 p-4">
                      <div className="space-y-4">
                        {/* Basic Information */}
                        <div>
                          <h4 className="text-xs font-medium text-neutral-600 mb-2">Building Information</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-neutral-500">Region:</span>
                              <span className="text-xs font-medium text-neutral-700">{result.region}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-neutral-500">Building Type:</span>
                              <span className="text-xs font-medium text-neutral-700">{result.buildingType}</span>
                            </div>
                            {result.propertyClass && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">Property Class:</span>
                                <span className="text-xs font-medium text-neutral-700">{result.propertyClass}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-neutral-500">Square Footage:</span>
                              <span className="text-xs font-medium text-neutral-700">{result.squareFootage.toLocaleString()} sq ft</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Cost Calculation Factors */}
                        <div>
                          <h4 className="text-xs font-medium text-neutral-600 mb-2">Cost Factors</h4>
                          <div className="space-y-2">
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
                            {result.conditionFactor && (
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-500">Condition Factor:</span>
                                <span className="text-xs font-medium text-neutral-700">{result.conditionFactor.toFixed(2)}×</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-neutral-500">Cost per Sq Ft:</span>
                              <span className="text-xs font-medium text-neutral-700">{formatCurrency(result.costPerSqft)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Benton County, Washington Assessment Information */}
                        {(result.taxLotId || result.propertyId || result.assessmentYear || result.yearBuilt || result.condition || result.depreciationAmount || result.assessedValue) && (
                          <div>
                            <h4 className="text-xs font-medium text-neutral-600 mb-2">Benton County, Washington Assessment Details</h4>
                            <div className="space-y-2">
                              {result.taxLotId && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Tax Lot ID:</span>
                                  <span className="text-xs font-medium text-neutral-700">{result.taxLotId}</span>
                                </div>
                              )}
                              {result.propertyId && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Property ID:</span>
                                  <span className="text-xs font-medium text-neutral-700">{result.propertyId}</span>
                                </div>
                              )}
                              {result.assessmentYear && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Assessment Year:</span>
                                  <span className="text-xs font-medium text-neutral-700">{result.assessmentYear}</span>
                                </div>
                              )}
                              {result.yearBuilt && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Year Built:</span>
                                  <span className="text-xs font-medium text-neutral-700">{result.yearBuilt}</span>
                                </div>
                              )}
                              {result.condition && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Building Condition:</span>
                                  <span className="text-xs font-medium text-neutral-700">{result.condition}</span>
                                </div>
                              )}
                              {result.depreciationAmount && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Depreciation Amount:</span>
                                  <span className="text-xs font-medium text-neutral-700">{formatCurrency(result.depreciationAmount)}</span>
                                </div>
                              )}
                              {result.assessedValue && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Assessed Value:</span>
                                  <span className="text-xs font-medium text-neutral-700">{formatCurrency(result.assessedValue)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="materials" className="mt-0 p-4">
                      {materialsBreakdown && materialsBreakdown.materials ? (
                        <div className="space-y-3">
                          <div className="max-h-[280px] overflow-y-auto pr-1">
                            <table className="w-full text-xs">
                              <thead className="bg-neutral-50 sticky top-0">
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
                          
                          <div className="flex justify-between items-center pt-2 border-t border-neutral-200">
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
                          <svg className="animate-spin h-4 w-4 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading materials breakdown...
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="assessment" className="mt-0 p-4">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xs font-medium text-neutral-600">Benton County, Washington Property Assessment</h4>
                            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded">
                              Tax Assessment Year: {result.assessmentYear || new Date().getFullYear()}
                            </span>
                          </div>
                          
                          <div className="p-3 border border-neutral-200 rounded-md space-y-4">
                            {/* Property Info Card */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-[10px] text-neutral-500 block">Tax Lot ID</span>
                                <span className="text-sm font-medium">{result.taxLotId || 'Not Specified'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-500 block">Property ID</span>
                                <span className="text-sm font-medium">{result.propertyId || 'Not Specified'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-500 block">Property Class</span>
                                <span className="text-sm font-medium">{result.propertyClass || 'Not Specified'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-500 block">Year Built</span>
                                <span className="text-sm font-medium">{result.yearBuilt || 'Unknown'}</span>
                              </div>
                            </div>
                            
                            {/* Calculation Card */}
                            <div className="border-t border-neutral-200 pt-3">
                              <span className="text-xs font-medium text-neutral-600 block mb-2">Assessment Calculation</span>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Building Replacement Cost:</span>
                                  <span className="text-xs font-medium text-neutral-700">{formatCurrency(result.totalCost)}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Building Condition:</span>
                                  <span className="text-xs font-medium text-neutral-700">{result.condition || 'Average'}</span>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-neutral-500">Building Age:</span>
                                  <span className="text-xs font-medium text-neutral-700">
                                    {result.yearBuilt ? `${(Number(result.assessmentYear) || new Date().getFullYear()) - Number(result.yearBuilt)} years` : 'Unknown'}
                                  </span>
                                </div>
                                
                                {result.conditionFactor && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-neutral-500">Condition Factor:</span>
                                    <span className="text-xs font-medium text-neutral-700">{result.conditionFactor.toFixed(2)}×</span>
                                  </div>
                                )}
                                
                                {result.depreciationAmount ? (
                                  <div className="flex justify-between items-center text-red-500">
                                    <span className="text-xs">Depreciation Amount:</span>
                                    <span className="text-xs font-medium">-{formatCurrency(result.depreciationAmount)}</span>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center text-red-500">
                                    <span className="text-xs">Estimated Depreciation:</span>
                                    <span className="text-xs font-medium">
                                      {result.yearBuilt ? 
                                        `-${formatCurrency(result.totalCost * (
                                          Math.min(0.75, ((Number(result.assessmentYear) || new Date().getFullYear()) - Number(result.yearBuilt)) * 0.015)
                                        ))}` 
                                        : 'Unknown'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Assessment Result */}
                            <div className="border-t border-neutral-200 pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-neutral-700">Assessed Building Value:</span>
                                <span className="text-sm font-bold text-primary">
                                  {result.assessedValue ? 
                                    formatCurrency(result.assessedValue) :
                                    result.depreciationAmount ?
                                      formatCurrency(result.totalCost - result.depreciationAmount) :
                                      result.yearBuilt ?
                                        formatCurrency(result.totalCost * (
                                          1 - Math.min(0.75, ((Number(result.assessmentYear) || new Date().getFullYear()) - Number(result.yearBuilt)) * 0.015)
                                        )) :
                                        formatCurrency(result.totalCost)
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <span className="text-xs text-yellow-700 flex items-center gap-1.5">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="12"></line>
                              <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            This is an estimated assessment based on Benton County, Washington's matrix calculations. Official assessments may vary.
                          </span>
                        </div>
                        
                        <div className="flex justify-center">
                          <button 
                            type="button" 
                            className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80"
                            onClick={() => console.log('Save to history clicked')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                              <polyline points="17 21 17 13 7 13 7 21"></polyline>
                              <polyline points="7 3 7 8 15 8"></polyline>
                            </svg>
                            Save to Assessment History
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="visualization" className="mt-0 p-4">
                      {materialsBreakdown && materialsBreakdown.materials ? (
                        <div className="space-y-6">
                          <div>
                            <div className="text-xs text-center text-neutral-600 font-medium mb-2">
                              Interactive Material Cost Distribution
                            </div>
                            <div className="w-full h-[180px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    activeIndex={activePieIndex}
                                    activeShape={renderActiveShape}
                                    data={materialsBreakdown.materials.map(m => ({
                                      name: m.materialName,
                                      value: m.totalCost,
                                      percentage: m.percentage
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={60}
                                    dataKey="value"
                                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                                  >
                                    {materialsBreakdown.materials.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={`hsl(${index * 25 % 360}, 70%, 60%)`}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="text-xs text-center text-neutral-500 mt-1">
                              Hover over segments to see details
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs text-center text-neutral-600 font-medium mb-2">
                              Material Cost Breakdown
                            </div>
                            <div className="w-full h-[130px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={materialsBreakdown.materials
                                    .sort((a, b) => b.totalCost - a.totalCost)
                                    .slice(0, 8)
                                    .map(m => ({
                                      name: m.materialName,
                                      cost: m.totalCost,
                                      percentage: m.percentage
                                    }))}
                                  margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis 
                                    dataKey="name" 
                                    angle={-45} 
                                    textAnchor="end" 
                                    height={50}
                                    tick={{ fontSize: 9 }}
                                  />
                                  <YAxis 
                                    tickFormatter={(value) => `$${value/1000}k`}
                                    tick={{ fontSize: 9 }}
                                  />
                                  <Tooltip content={<CustomBarTooltip />} />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Bar 
                                    dataKey="cost" 
                                    name="Cost"
                                    fill="#7C3AED"
                                    radius={[2, 2, 0, 0]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="text-xs text-center text-neutral-500 mt-1">
                              Top 8 material costs by value
                            </div>
                          </div>
                          
                          {/* PDF Export Component */}
                          <div className="pt-3 border-t border-neutral-200">
                            <CostBreakdownPdfExport 
                              data={result && materialsBreakdown ? {
                                region: result.region,
                                buildingType: result.buildingType,
                                squareFootage: result.squareFootage,
                                costPerSqft: result.costPerSqft,
                                totalCost: result.totalCost,
                                baseCost: result.baseCost,
                                regionFactor: result.regionFactor,
                                complexityFactor: result.complexityFactor,
                                materials: materialsBreakdown.materials
                              } : null}
                              onExport={() => {
                                console.log("PDF exported successfully");
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-neutral-500">
                          <svg className="animate-spin h-4 w-4 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading visualization data...
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}