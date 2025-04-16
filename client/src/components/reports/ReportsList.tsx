import React from "react";
import { 
  Card, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  Calendar, 
  Eye, 
  FileText, 
  Lock, 
  Unlock 
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

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
  // Function to format report type
  const formatReportType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Function to determine badge color based on report type
  const getReportTypeBadgeVariant = (type: string): "default" | "destructive" | "outline" | "success" | "warning" | null | undefined => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('assessment')) return 'default';
    if (typeLower.includes('cost')) return 'destructive';
    if (typeLower.includes('tax')) return 'warning';
    if (typeLower.includes('analysis')) return 'outline';
    if (typeLower.includes('valuation')) return 'success';
    return 'outline';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report) => (
        <Card 
          key={report.id} 
          className="hover:shadow-md transition-shadow"
        >
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-3">
              <Badge variant={getReportTypeBadgeVariant(report.report_type)}>
                {formatReportType(report.report_type)}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-muted-foreground">
                      {report.is_public ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {report.is_public ? "Public Report" : "Private Report"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <h3 className="text-xl font-semibold mb-2 line-clamp-1">{report.title}</h3>
            
            <p className="text-muted-foreground mb-4 text-sm line-clamp-2">
              {report.description}
            </p>
            
            <div className="flex items-center text-xs text-muted-foreground mb-6">
              <Calendar className="h-3 w-3 mr-1" />
              <span>
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </span>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelectReport(report.id)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Open in new tab
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}