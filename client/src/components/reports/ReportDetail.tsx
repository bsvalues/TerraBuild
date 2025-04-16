import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Download, 
  Building,
  User,
  Calendar,
  MapPin,
  DollarSign,
  Share2,
  Printer,
  FileText
} from "lucide-react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

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

// Color schemes for charts
const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
];

export default function ReportDetail({ report, onBack }: ReportDetailProps) {
  // Format currency values 
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Determine badge style based on report type
  const getReportTypeBadgeVariant = (type: string): "default" | "destructive" | "outline" | "success" | "warning" | null | undefined => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('assessment')) return 'default';
    if (typeLower.includes('cost')) return 'destructive';
    if (typeLower.includes('tax')) return 'warning';
    if (typeLower.includes('analysis')) return 'outline';
    if (typeLower.includes('valuation')) return 'success';
    return 'outline';
  };

  // Format report type for display
  const formatReportType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  // Format change percentage with color
  const formatChangePercent = (percent: number | undefined) => {
    if (percent === undefined) return null;
    
    const textColorClass = percent >= 0 
      ? "text-green-600" 
      : "text-red-600";
      
    return (
      <span className={textColorClass}>
        {percent >= 0 ? '+' : ''}{percent.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Reports
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant={getReportTypeBadgeVariant(report.report_type)}>
                    {formatReportType(report.report_type)}
                  </Badge>
                  <CardTitle className="mt-2 text-2xl">{report.title}</CardTitle>
                  <CardDescription className="mt-2 text-md">{report.description}</CardDescription>
                </div>
                <Badge variant={report.is_public ? "outline" : "warning"}>
                  {report.is_public ? "Public" : "Private"}
                </Badge>
              </div>
              <div className="flex items-center mt-4 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Generated on {formatDate(report.created_at)}</span>
              </div>
            </CardHeader>
          </Card>
          
          {report.content?.property && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {report.content.property.address && (
                    <div>
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="font-medium">{report.content.property.address}</dd>
                    </div>
                  )}
                  {report.content.property.parcel_id && (
                    <div>
                      <dt className="text-muted-foreground">Parcel ID</dt>
                      <dd className="font-medium">{report.content.property.parcel_id}</dd>
                    </div>
                  )}
                  {report.content.property.city && report.content.property.state && (
                    <div>
                      <dt className="text-muted-foreground">Location</dt>
                      <dd className="font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {report.content.property.city}, {report.content.property.state}
                      </dd>
                    </div>
                  )}
                  {report.content.property.county && (
                    <div>
                      <dt className="text-muted-foreground">County</dt>
                      <dd className="font-medium">{report.content.property.county}</dd>
                    </div>
                  )}
                  {report.content.property.building_type && (
                    <div>
                      <dt className="text-muted-foreground">Building Type</dt>
                      <dd className="font-medium">{report.content.property.building_type}</dd>
                    </div>
                  )}
                  {report.content.property.year_built && (
                    <div>
                      <dt className="text-muted-foreground">Year Built</dt>
                      <dd className="font-medium">{report.content.property.year_built}</dd>
                    </div>
                  )}
                  {report.content.property.square_feet && (
                    <div>
                      <dt className="text-muted-foreground">Square Feet</dt>
                      <dd className="font-medium">{report.content.property.square_feet.toLocaleString()} sq ft</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
          
          {report.content?.assessment && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Assessment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-4">
                  {report.content.assessment.date && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <dt className="text-muted-foreground">Assessment Date</dt>
                      <dd className="font-medium">{formatDate(report.content.assessment.date)}</dd>
                    </div>
                  )}
                  {report.content.assessment.land_value !== undefined && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <dt className="text-muted-foreground">Land Value</dt>
                      <dd className="font-medium">{formatCurrency(report.content.assessment.land_value)}</dd>
                    </div>
                  )}
                  {report.content.assessment.improvement_value !== undefined && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <dt className="text-muted-foreground">Improvement Value</dt>
                      <dd className="font-medium">{formatCurrency(report.content.assessment.improvement_value)}</dd>
                    </div>
                  )}
                  {report.content.assessment.total_value !== undefined && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <dt className="text-muted-foreground">Total Value</dt>
                      <dd className="font-semibold text-lg">{formatCurrency(report.content.assessment.total_value)}</dd>
                    </div>
                  )}
                  {report.content.assessment.previous_value !== undefined && (
                    <div className="flex justify-between items-center border-b pb-2">
                      <dt className="text-muted-foreground">Previous Assessment</dt>
                      <dd className="font-medium">{formatCurrency(report.content.assessment.previous_value)}</dd>
                    </div>
                  )}
                  {report.content.assessment.change_percent !== undefined && (
                    <div className="flex justify-between items-center">
                      <dt className="text-muted-foreground">Change</dt>
                      <dd className="font-medium">
                        {formatChangePercent(report.content.assessment.change_percent)}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
          
          {report.content?.assessor && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Assessor Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {report.content.assessor.name && (
                    <div>
                      <dt className="text-muted-foreground">Assessor</dt>
                      <dd className="font-medium">{report.content.assessor.name}</dd>
                    </div>
                  )}
                  {report.content.assessor.department && (
                    <div>
                      <dt className="text-muted-foreground">Department</dt>
                      <dd className="font-medium">{report.content.assessor.department}</dd>
                    </div>
                  )}
                  {report.content.assessor.contact && (
                    <div>
                      <dt className="text-muted-foreground">Contact</dt>
                      <dd className="font-medium">{report.content.assessor.contact}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {report.content?.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {report.content.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="w-full md:w-[38%] space-y-6">
          {report.content?.charts?.cost_breakdown && report.content.charts.cost_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
                <CardDescription>Distribution of property costs by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.content.charts.cost_breakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {report.content.charts.cost_breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {report.content?.charts?.historical_values && report.content.charts.historical_values.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historical Values</CardTitle>
                <CardDescription>Property value trend over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={report.content.charts.historical_values}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value).replace('$', '').replace(',000', 'K')}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0088FE" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {report.content?.charts?.comparable_properties && report.content.charts.comparable_properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparable Properties</CardTitle>
                <CardDescription>Value comparison with similar properties</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.content.charts.comparable_properties}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis 
                        tickFormatter={(value) => formatCurrency(value).replace('$', '').replace(',000', 'K')}
                      />
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}