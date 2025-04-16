import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Download,
  Share2,
  Printer,
  Clock,
  Building,
  MapPin,
  User,
  FileText,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Define report interface
interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  created_at: string;
  is_public: boolean;
  content?: {
    property?: {
      address?: string;
      parcel_id?: string;
      city?: string;
      county?: string;
      state?: string;
      building_type?: string;
      year_built?: number;
      square_feet?: number;
    };
    assessor?: {
      name?: string;
      department?: string;
      contact?: string;
    };
    assessment?: {
      date?: string;
      land_value?: number;
      improvement_value?: number;
      total_value?: number;
      previous_value?: number;
      change_percent?: number;
    };
    charts?: {
      cost_breakdown?: Array<{name: string; value: number}>;
      historical_values?: Array<{year: number; value: number}>;
      comparable_properties?: Array<{name: string; value: number}>;
    };
    notes?: string;
  };
}

interface ReportDetailProps {
  report: Report;
  onBack: () => void;
}

export default function ReportDetail({ report, onBack }: ReportDetailProps) {
  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get report type badge color
  const getReportTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "assessment":
        return "bg-blue-100 text-blue-800";
      case "valuation":
        return "bg-green-100 text-green-800";
      case "cost_analysis":
        return "bg-purple-100 text-purple-800";
      case "comparison":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format report type for display
  const formatReportType = (type: string) => {
    return type
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Create demo data if none exists in the report
  const costBreakdownData = report.content?.charts?.cost_breakdown || [
    { name: 'Structure', value: 245000 },
    { name: 'Land', value: 120000 },
    { name: 'Improvements', value: 35000 },
    { name: 'Features', value: 15000 }
  ];

  const historicalData = report.content?.charts?.historical_values || [
    { year: 2020, value: 370000 },
    { year: 2021, value: 385000 },
    { year: 2022, value: 405000 },
    { year: 2023, value: 415000 },
    { year: 2024, value: 425000 },
    { year: 2025, value: 450000 }
  ];

  const comparableData = report.content?.charts?.comparable_properties || [
    { name: 'Subject Property', value: 450000 },
    { name: 'Comp 1', value: 445000 },
    { name: 'Comp 2', value: 467000 },
    { name: 'Comp 3', value: 428000 },
    { name: 'Neighborhood Avg', value: 442000 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        
        <div className="flex-1" />
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              <CardDescription className="mt-2">{report.description}</CardDescription>
            </div>
            <Badge 
              className={`${getReportTypeColor(report.report_type)}`}
              variant="outline"
            >
              {formatReportType(report.report_type)}
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Report Date: {formatDate(report.created_at)}</span>
            </div>
            {report.content?.assessment?.date && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Assessment Date: {formatDate(report.content.assessment.date)}</span>
              </div>
            )}
            {report.content?.assessor?.name && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>Assessor: {report.content.assessor.name}</span>
              </div>
            )}
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              <span>{report.is_public ? "Public Report" : "Private Report"}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Property Information Section */}
          {report.content?.property && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Building Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Type:</dt>
                        <dd>{report.content.property.building_type || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Year Built:</dt>
                        <dd>{report.content.property.year_built || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Square Feet:</dt>
                        <dd>
                          {report.content.property.square_feet 
                            ? new Intl.NumberFormat().format(report.content.property.square_feet) + " sq ft"
                            : "N/A"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Address:</dt>
                        <dd>{report.content.property.address || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">City:</dt>
                        <dd>{report.content.property.city || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">County:</dt>
                        <dd>{report.content.property.county || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">State:</dt>
                        <dd>{report.content.property.state || "N/A"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Parcel ID:</dt>
                        <dd>{report.content.property.parcel_id || "N/A"}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
                
                {report.content?.assessment && (
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Value Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Land Value:</dt>
                          <dd>{formatCurrency(report.content.assessment.land_value)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Improvement Value:</dt>
                          <dd>{formatCurrency(report.content.assessment.improvement_value)}</dd>
                        </div>
                        <div className="flex justify-between font-medium">
                          <dt>Total Value:</dt>
                          <dd>{formatCurrency(report.content.assessment.total_value)}</dd>
                        </div>
                        {report.content.assessment.previous_value && (
                          <>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Previous Value:</dt>
                              <dd>{formatCurrency(report.content.assessment.previous_value)}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Change:</dt>
                              <dd className={
                                (report.content.assessment.change_percent || 0) >= 0 
                                  ? "text-green-600" 
                                  : "text-red-600"
                              }>
                                {report.content.assessment.change_percent 
                                  ? (report.content.assessment.change_percent >= 0 ? "+" : "") +
                                    report.content.assessment.change_percent + "%"
                                  : "N/A"}
                              </dd>
                            </div>
                          </>
                        )}
                      </dl>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          
          {/* Visualizations Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Assessment Visualizations</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cost Breakdown Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Value Distribution</CardTitle>
                  <CardDescription>
                    Breakdown of assessed property value by component
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costBreakdownData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {costBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Historical Values Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historical Values</CardTitle>
                  <CardDescription>
                    Property value trends over the past years
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={historicalData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          name="Assessed Value"
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Comparable Properties Chart */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Comparable Properties</CardTitle>
                  <CardDescription>
                    Value comparison with similar properties in the area
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={comparableData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Bar 
                          dataKey="value" 
                          name="Assessed Value" 
                          fill="#8884d8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Notes Section */}
          {report.content?.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Assessment Notes</h3>
              <Card>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-line">{report.content.notes}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button>
              <Share2 className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}