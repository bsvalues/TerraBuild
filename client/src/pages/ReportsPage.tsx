import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import ReportsList from "../components/reports/ReportsList";
import ReportDetail from "../components/reports/ReportDetail";

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
  const { toast } = useToast();
  
  // Selected report state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("list");
  
  // Fetch reports from API
  const { data: reports, isLoading, error } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
    refetchOnWindowFocus: false,
  });
  
  // Handle selecting a report
  const handleSelectReport = async (reportId: number) => {
    try {
      // Fetch the detailed report data if needed
      const response = await fetch(`/api/reports/${reportId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report details');
      }
      
      const reportData = await response.json();
      setSelectedReport(reportData);
      setActiveTab("detail");
    } catch (error) {
      console.error('Error fetching report details:', error);
      toast({
        title: "Error",
        description: "Failed to load report details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle back to list
  const handleBackToList = () => {
    setActiveTab("list");
    setSelectedReport(null);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">
          <p>Error loading reports. Please try again.</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Assessment Reports | BCBS</title>
      </Helmet>
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Assessment Reports</h1>
            <p className="text-muted-foreground">
              View and analyze property assessment reports and cost analyses
            </p>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="list">Reports List</TabsTrigger>
            {selectedReport && (
              <TabsTrigger value="detail">Report Details</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="list">
            {reports && reports.length > 0 ? (
              <ReportsList 
                reports={reports} 
                onSelectReport={handleSelectReport} 
              />
            ) : (
              <div className="text-center p-8 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
                <p className="text-muted-foreground">
                  There are no assessment reports available in the system.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="detail">
            {selectedReport && (
              <ReportDetail 
                report={selectedReport} 
                onBack={handleBackToList} 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}