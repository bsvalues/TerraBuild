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
import { FileText, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";

// Define report types
interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  created_at: string;
  is_public: boolean;
}

interface ReportsListProps {
  reports: Report[];
  onSelectReport: (reportId: number) => void;
}

export default function ReportsList({ reports, onSelectReport }: ReportsListProps) {
  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {reports.map((report) => (
        <Card key={report.id} className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <CardTitle className="line-clamp-1">{report.title}</CardTitle>
              <Badge 
                className={`${getReportTypeColor(report.report_type)}`}
                variant="outline"
              >
                {formatReportType(report.report_type)}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {report.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Created on {formatDate(report.created_at)}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileText className="mr-2 h-4 w-4" />
              <span>{report.is_public ? "Public Report" : "Private Report"}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => onSelectReport(report.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Report
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}