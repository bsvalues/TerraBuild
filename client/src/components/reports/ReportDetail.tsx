import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, Download, Share } from "lucide-react";

// Import visualization components
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
  ResponsiveContainer 
} from "recharts";

interface ReportDetailProps {
  reportId: number;
  onBack: () => void;
}

// Define report types
interface ReportData {
  id: number;
  title: string;
  description: string;
  report_type: string;
  parameters: any;
  data: any;
  created_at: string;
  is_public: boolean;
}

export default function ReportDetail({ reportId, onBack }: ReportDetailProps) {
  const { toast } = useToast();

  // Fetch report data
  const { data: report, isLoading, error } = useQuery<ReportData>({
    queryKey: ["/api/reports", reportId],
    refetchOnWindowFocus: false,
  });

  // Handle report type to display readable format
  const getReadableReportType = (type: string) => {
    switch (type) {
      case "trend_analysis":
        return "Trend Analysis";
      case "regional_impact":
        return "Regional Impact";
      case "type_comparison":
        return "Building Type Comparison";
      case "projection":
        return "Cost Projection";
      case "factor_analysis":
        return "Factor Analysis";
      default:
        return type.replace("_", " ");
    }
  };

  // Generate badge color based on report type
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "trend_analysis":
        return "default";
      case "regional_impact":
        return "secondary";
      case "type_comparison":
        return "destructive";
      case "projection":
        return "outline";
      case "factor_analysis":
        return "default";
      default:
        return "default";
    }
  };

  const handleDownloadReport = () => {
    toast({
      title: "Download Started",
      description: "Your report is being prepared for download.",
    });
  };

  const handleShareReport = () => {
    toast({
      title: "Share Report",
      description: "Report sharing options are coming soon.",
    });
  };

  const handleSaveReport = () => {
    toast({
      title: "Report Saved",
      description: "This report has been saved to your collection.",
    });
  };

  // Helper to format numeric values for display
  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
    }
    return value.toFixed(2);
  };

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  if (error || !report) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading report. Please try again.
      </div>
    );
  }

  // Render different report components based on report type
  const renderReportContent = () => {
    switch (report.report_type) {
      case "trend_analysis":
        return renderTrendAnalysis();
      case "regional_impact":
        return renderRegionalImpact();
      case "type_comparison":
        return renderTypeComparison();
      case "projection":
        return renderProjection();
      case "factor_analysis":
        return renderFactorAnalysis();
      default:
        return <div>Unsupported report type</div>;
    }
  };

  // Render trend analysis report
  const renderTrendAnalysis = () => {
    // Format data for line chart
    const chartData = report.data.trends.map((item: any) => ({
      year: item.year,
      "Single Family": item.R1,
      "Commercial Retail": item.C1 / 100, // Scale down for better visualization
      "Industrial": item.I1,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Building Cost Trends 2020-2025</CardTitle>
            <CardDescription>
              Showing cost trends for key building types over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "Commercial Retail") {
                        return [formatNumber(value * 100), name];
                      }
                      return [formatNumber(value), name];
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Single Family"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Commercial Retail"
                    stroke="#82ca9d"
                  />
                  <Line type="monotone" dataKey="Industrial" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Cost Comparison (2025)</CardTitle>
            <CardDescription>
              Comparing costs across Benton County regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Summary Findings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Average Increase</div>
                  <div className="text-2xl font-bold">{report.data.summary.averageIncrease}%</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Highest Increase</div>
                  <div className="text-2xl font-bold">{report.data.summary.highestIncrease.value}%</div>
                  <div className="text-xs text-muted-foreground">
                    {report.data.summary.highestIncrease.type} in {report.data.summary.highestIncrease.region}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Lowest Increase</div>
                  <div className="text-2xl font-bold">{report.data.summary.lowestIncrease.value}%</div>
                  <div className="text-xs text-muted-foreground">
                    {report.data.summary.lowestIncrease.type} in {report.data.summary.lowestIncrease.region}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render regional impact report
  const renderRegionalImpact = () => {
    // Create data for the bar chart
    const chartData = Object.entries(report.data.details).map(([key, value]: [string, any]) => ({
      buildingType: key,
      East: value.East,
      Central: value.Central,
      West: value.West,
      variation: value.variation,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Regional Cost Variations (2025)</CardTitle>
            <CardDescription>
              Comparing building costs across Benton County regions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="buildingType" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="East" fill="#8884d8" name="East Benton" />
                  <Bar dataKey="Central" fill="#82ca9d" name="Central Benton" />
                  <Bar dataKey="West" fill="#ffc658" name="West Benton" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Summary</CardTitle>
            <CardDescription>
              Key findings on regional cost variations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Highest Cost Region</div>
                  <div className="text-2xl font-bold">{report.data.summary.highestCostRegion}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Lowest Cost Region</div>
                  <div className="text-2xl font-bold">{report.data.summary.lowestCostRegion}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Average Variation</div>
                  <div className="text-2xl font-bold">{report.data.summary.averageVariation}%</div>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Recommendations</h3>
              <ul className="list-disc pl-5 space-y-2">
                {report.data.recommendations.map((rec: any, index: number) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{rec.buildingType}:</span> {rec.recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render building type comparison report
  const renderTypeComparison = () => {
    // Create data for the bar chart (normalized comparison)
    const chartData = Object.entries(report.data.normalizedComparison).map(
      ([key, value]: [string, any]) => ({
        buildingType: key,
        normalizedCost: value,
      })
    );

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Building Type Cost Comparison</CardTitle>
            <CardDescription>
              Normalized comparison with R1 (Single Family) as baseline (1.0)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="buildingType" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="normalizedCost"
                    fill="#8884d8"
                    name="Normalized Cost"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
            <CardDescription>
              Key findings on building type cost variations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Most Expensive</div>
                  <div className="text-2xl font-bold">{report.data.summary.mostExpensive.type}</div>
                  <div className="text-xs text-muted-foreground">
                    ${formatNumber(report.data.summary.mostExpensive.cost)}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Least Expensive</div>
                  <div className="text-2xl font-bold">{report.data.summary.leastExpensive.type}</div>
                  <div className="text-xs text-muted-foreground">
                    ${formatNumber(report.data.summary.leastExpensive.cost)}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Median Cost</div>
                  <div className="text-2xl font-bold">{report.data.summary.medianCost.type}</div>
                  <div className="text-xs text-muted-foreground">
                    ${formatNumber(report.data.summary.medianCost.cost)}
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Quality Factor Impact</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Building Type</th>
                      <th className="text-right p-2">Low Quality</th>
                      <th className="text-right p-2">Medium Quality</th>
                      <th className="text-right p-2">High Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(report.data.qualityFactorImpact).map(([type, values]: [string, any]) => (
                      <tr key={type} className="border-b">
                        <td className="p-2">{type}</td>
                        <td className="text-right p-2">${formatNumber(values.low)}</td>
                        <td className="text-right p-2">${formatNumber(values.medium)}</td>
                        <td className="text-right p-2">${formatNumber(values.high)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render cost projection report
  const renderProjection = () => {
    // Format R1 data for line chart
    const r1Data = report.data.projections.R1.map((item: any) => ({
      year: item.year,
      cost: item.cost,
      confidence: item.confidence * 100,
    }));

    // Format C1 data for line chart
    const c1Data = report.data.projections.C1.map((item: any) => ({
      year: item.year,
      cost: item.cost / 100, // Scale down for better visualization
      confidence: item.confidence * 100,
    }));

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Projections 2025-2030</CardTitle>
            <CardDescription>
              Projected building costs for the next five years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="r1">
              <TabsList className="mb-4">
                <TabsTrigger value="r1">Residential (R1)</TabsTrigger>
                <TabsTrigger value="c1">Commercial (C1)</TabsTrigger>
              </TabsList>
              <TabsContent value="r1">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={r1Data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "cost") return [`$${formatNumber(value)}`, "Cost"];
                          if (name === "confidence") return [`${value}%`, "Confidence"];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Cost"
                      />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#82ca9d"
                        name="Confidence"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="c1">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c1Data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number, name: string) => {
                          if (name === "cost") return [`$${formatNumber(value * 100)}`, "Cost"];
                          if (name === "confidence") return [`${value}%`, "Confidence"];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cost"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Cost"
                      />
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#82ca9d"
                        name="Confidence"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projection Methodology</CardTitle>
            <CardDescription>
              Factors used in generating these projections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Annual Inflation</div>
                  <div className="text-2xl font-bold">
                    {(report.data.methodology.inflationFactor * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Regional Adjustment</div>
                  <div className="text-2xl font-bold">
                    {(report.data.methodology.regionalAdjustment * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">Market Conditions</div>
                  <div className="text-2xl font-bold">
                    {(report.data.methodology.marketConditions * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  Note: Confidence levels decrease with projection timeframe, reflecting
                  increasing uncertainty in long-term forecasts. Economic conditions and policy
                  changes may significantly affect actual costs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Render factor analysis report
  const renderFactorAnalysis = () => {
    // Create data for factor impact
    const impactData = [
      {
        factor: "Quality",
        min: report.data.summary.qualityImpact.min,
        avg: report.data.summary.qualityImpact.average,
        max: report.data.summary.qualityImpact.max,
      },
      {
        factor: "Condition",
        min: report.data.summary.conditionImpact.min,
        avg: report.data.summary.conditionImpact.average,
        max: report.data.summary.conditionImpact.max,
      },
      {
        factor: "Complexity",
        min: report.data.summary.complexityImpact.min,
        avg: report.data.summary.complexityImpact.average,
        max: report.data.summary.complexityImpact.max,
      },
    ];

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Quality and Condition Impact Analysis</CardTitle>
            <CardDescription>
              How different factors affect building cost assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={impactData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="factor" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="min" fill="#8884d8" name="Minimum Impact (%)" />
                  <Bar dataKey="avg" fill="#82ca9d" name="Average Impact (%)" />
                  <Bar dataKey="max" fill="#ffc658" name="Maximum Impact (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factor Matrix for R1 (Residential)</CardTitle>
            <CardDescription>
              Detailed breakdown of factor impacts on residential properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Factor</th>
                    <th className="text-right p-2">Poor</th>
                    <th className="text-right p-2">Average</th>
                    <th className="text-right p-2">Excellent</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.data.factorMatrix.R1).map(([factor, values]: [string, any]) => (
                    <tr key={factor} className="border-b">
                      <td className="p-2 capitalize">{factor}</td>
                      <td className="text-right p-2">${formatNumber(values.poor)}</td>
                      <td className="text-right p-2">${formatNumber(values.average)}</td>
                      <td className="text-right p-2">${formatNumber(values.excellent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-medium mt-6">Assessment Guidelines</h3>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              {report.data.guidelines.map((guideline: any, index: number) => (
                <li key={index} className="text-sm">
                  <span className="font-medium capitalize">{guideline.factor}:</span>{" "}
                  {guideline.description}
                  <div className="text-xs text-muted-foreground mt-1">
                    Assessment: {guideline.assessment}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={getBadgeVariant(report.report_type) as any}>
                {getReadableReportType(report.report_type)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Created on {formatDate(report.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleSaveReport}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareReport}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="bg-muted p-4 rounded-lg text-sm">
        <p>{report.description}</p>
      </div>

      {renderReportContent()}
    </div>
  );
}