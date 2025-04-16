import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface ScenarioResultsProps {
  scenario: any;
}

export default function ScenarioResults({ scenario }: ScenarioResultsProps) {
  // Format numbers for display
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Check if scenario and results exist
  if (!scenario || !scenario.results) {
    return (
      <div className="text-center p-4">
        No scenario results available. Please run the analysis.
      </div>
    );
  }

  // Create impact data for pie chart
  const createImpactData = () => {
    if (!scenario.results.details || scenario.results.details.length === 0) {
      return [];
    }

    return scenario.results.details.map((detail: any) => ({
      name: detail.factor,
      value: detail.impact,
      percentImpact: detail.percentImpact
    }));
  };

  const impactData = createImpactData();

  // Determine scenario type based on parameters
  const determineScenarioType = () => {
    const params = scenario.parameters;
    
    if (params.baseYear !== params.comparisonYear) {
      return "Time Comparison";
    } 
    if (params.qualityFactor && params.qualityFactor !== 1.0) {
      return "Quality Analysis";
    }
    if (params.targetRegion && params.targetRegion !== params.region) {
      return "Regional Comparison";
    }
    if (params.conditionFactor && params.conditionFactor !== 1.0) {
      return "Condition Analysis";
    }
    if (params.complexityFactor && params.complexityFactor !== 1.0) {
      return "Complexity Analysis";
    }
    return "Multi-Factor Analysis";
  };

  const scenarioType = determineScenarioType();

  // Determine badge color based on scenario type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "Time Comparison":
        return "default";
      case "Quality Analysis":
        return "secondary";
      case "Regional Comparison":
        return "destructive";
      case "Condition Analysis":
        return "outline";
      case "Complexity Analysis":
        return "default";
      default:
        return "default";
    }
  };

  // Create chart data based on scenario type
  const getChartData = () => {
    // For time comparison, use chart data if available
    if (scenarioType === "Time Comparison" && scenario.results.chartData) {
      return scenario.results.chartData;
    }

    // For quality analysis, create simple comparison
    if (scenarioType === "Quality Analysis") {
      return [
        { name: "Base Quality", value: scenario.results.baseCost },
        { name: "Improved Quality", value: scenario.results.adjustedCost }
      ];
    }

    // For regional comparison
    if (scenarioType === "Regional Comparison" && scenario.results.chartData) {
      return scenario.results.chartData;
    }

    // Default to using impact data
    return impactData;
  };

  const chartData = getChartData();

  // Render different charts based on scenario type
  const renderChart = () => {
    if (chartData.length === 0) {
      return <div className="text-center p-4">No chart data available</div>;
    }

    if (scenarioType === "Time Comparison") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#8884d8" 
              activeDot={{ r: 8 }}
              name="Cost" 
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (scenarioType === "Regional Comparison") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Cost" />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // For impact breakdown
    if (impactData.length > 0) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={impactData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percentImpact }) => `${name}: ${formatPercent(percentImpact)}`}
            >
              {impactData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // Default to simple bar chart
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{scenario.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getBadgeVariant(scenarioType) as any}>
              {scenarioType}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {scenario.parameters.buildingType} in {scenario.parameters.region}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scenario Summary</CardTitle>
          <CardDescription>
            Cost comparison results and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground">Base Cost</div>
              <div className="text-2xl font-bold">{formatCurrency(scenario.results.baseCost)}</div>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground">Adjusted Cost</div>
              <div className="text-2xl font-bold">{formatCurrency(scenario.results.adjustedCost)}</div>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <div className="text-sm text-muted-foreground">Difference</div>
              <div className="text-2xl font-bold">
                {formatCurrency(scenario.results.difference)} 
                <span className="text-sm ml-1">
                  ({formatPercent(scenario.results.percentChange)})
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-medium mb-4">Impact Visualization</h3>
            {renderChart()}
          </div>

          {impactData.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-lg font-medium mb-4">Factor Breakdown</h3>
                <div className="space-y-3">
                  {impactData.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span>{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div>{formatCurrency(item.value)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercent(item.percentImpact)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}