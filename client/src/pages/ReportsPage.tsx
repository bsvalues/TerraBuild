import React, { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle,
  FileText,
  Filter,
  PlusCircle, 
  RefreshCw,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import ReportsList from "../components/reports/ReportsList";
import ReportDetail from "../components/reports/ReportDetail";
import { useQuery } from "@tanstack/react-query";

// Define report types
interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  created_at: string;
  is_public: boolean;
  content?: any;
}

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // Fetch reports
  const { 
    data: reports = [],
    isLoading,
    isError,
    refetch
  } = useQuery<Report[]>({ 
    queryKey: ['/api/reports'],
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });
  
  // Get the selected report
  const selectedReport = selectedReportId 
    ? reports.find(report => report.id === selectedReportId) 
    : null;
  
  // Filter reports based on search term and filter type
  const filteredReports = reports.filter(report => {
    const matchesSearch = !searchTerm || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterType || report.report_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  // Handle selecting a report
  const handleSelectReport = async (reportId: number) => {
    setSelectedReportId(reportId);
  };

  // Handle going back to the list
  const handleBack = () => {
    setSelectedReportId(null);
  };

  // Get unique report types for filtering
  const reportTypesSet = new Set<string>();
  reports.forEach(report => reportTypesSet.add(report.report_type));
  const reportTypes = Array.from(reportTypesSet);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Assessment Reports</h1>
        <p className="text-muted-foreground">
          View, analyze, and manage property assessment reports
        </p>
      </div>

      {selectedReport ? (
        <ReportDetail 
          report={selectedReport} 
          onBack={handleBack}
        />
      ) : (
        <>
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-start">
            <div className="relative w-full md:w-auto flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
                <select 
                  className="border rounded-md bg-background px-2 py-1 text-sm"
                  value={filterType || ""}
                  onChange={(e) => setFilterType(e.target.value || null)}
                >
                  <option value="">All Types</option>
                  {reportTypes.map(type => (
                    <option key={type} value={type}>
                      {type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Report
              </Button>
            </div>
          </div>

          <Tabs defaultValue="all" className="mb-8">
            <TabsList>
              <TabsTrigger value="all">All Reports</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="my">My Reports</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : isError ? (
                <Card>
                  <CardContent className="py-10 flex flex-col items-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Failed to load reports</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      There was an error retrieving the reports. Please try again.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => refetch()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : filteredReports.length === 0 ? (
                <Card>
                  <CardContent className="py-10 flex flex-col items-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No reports found</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      {searchTerm || filterType 
                        ? "No reports match your search criteria. Try adjusting your search terms or filters."
                        : "There are no reports yet. Create your first report to get started."}
                    </p>
                    {searchTerm || filterType ? (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterType(null);
                        }}
                      >
                        Clear Filters
                      </Button>
                    ) : (
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Report
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <ReportsList 
                  reports={filteredReports} 
                  onSelectReport={handleSelectReport}
                />
              )}
            </TabsContent>
            <TabsContent value="recent" className="mt-6">
              <ReportsList 
                reports={filteredReports.slice(0, 5)} 
                onSelectReport={handleSelectReport}
              />
            </TabsContent>
            <TabsContent value="my" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Reports</CardTitle>
                  <CardDescription>
                    Reports created by you will appear here when available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    You haven't created any reports yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="shared" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shared Reports</CardTitle>
                  <CardDescription>
                    Reports shared with you will appear here when available
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    No reports have been shared with you yet
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Report Templates</h2>
            <Separator className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>Property Assessment</CardTitle>
                    <Badge variant="outline">Standard</Badge>
                  </div>
                  <CardDescription>
                    Comprehensive property assessment with market value analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>Valuation Report</CardTitle>
                    <Badge variant="outline">Detailed</Badge>
                  </div>
                  <CardDescription>
                    In-depth valuation report with comparative analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between">
                    <CardTitle>Cost Analysis</CardTitle>
                    <Badge variant="outline">Technical</Badge>
                  </div>
                  <CardDescription>
                    Technical cost analysis with detailed breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}