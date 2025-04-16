import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  created_at: string;
  is_public: boolean;
}

interface ReportsListProps {
  onSelectReport: (reportId: number) => void;
}

export default function ReportsList({ onSelectReport }: ReportsListProps) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Query to fetch reports
  const { data: reports, isLoading, error } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    refetchOnWindowFocus: false,
  });

  // Filter reports based on type
  const filteredReports = reports
    ? filter === "all"
      ? reports
      : reports.filter((report) => report.report_type === filter)
    : [];

  // Pagination calculations
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
    return <div className="p-8 text-center">Loading reports...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading reports. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Benton County Cost Reports</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reports</SelectItem>
            <SelectItem value="trend_analysis">Trend Analysis</SelectItem>
            <SelectItem value="regional_impact">Regional Impact</SelectItem>
            <SelectItem value="type_comparison">Building Type</SelectItem>
            <SelectItem value="projection">Cost Projection</SelectItem>
            <SelectItem value="factor_analysis">Factor Analysis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentReports.map((report) => (
          <Card key={report.id} className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{report.title}</CardTitle>
                <Badge variant={getBadgeVariant(report.report_type) as any}>
                  {getReadableReportType(report.report_type)}
                </Badge>
              </div>
              <CardDescription>
                Created on {formatDate(report.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">
                {report.description}
              </p>
            </CardContent>
            <CardFooter className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onSelectReport(report.id)}
              >
                View Report
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                className={currentPage === 1 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const page = idx + 1;
              // Show first page, last page, and pages around current page
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                className={currentPage === totalPages ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}