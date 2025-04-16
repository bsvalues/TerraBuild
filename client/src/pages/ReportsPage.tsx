import React, { useState } from "react";
import { Helmet } from "react-helmet";
import ReportsList from "../components/reports/ReportsList";
import ReportDetail from "../components/reports/ReportDetail";

export default function ReportsPage() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  // Handle report selection
  const handleSelectReport = (reportId: number) => {
    setSelectedReportId(reportId);
    window.scrollTo(0, 0);
  };

  // Handle back button click
  const handleBackToList = () => {
    setSelectedReportId(null);
  };

  return (
    <>
      <Helmet>
        <title>Benton County Cost Reports | BCBS</title>
      </Helmet>
      <div className="container mx-auto py-8 px-4">
        {selectedReportId ? (
          <ReportDetail
            reportId={selectedReportId}
            onBack={handleBackToList}
          />
        ) : (
          <ReportsList onSelectReport={handleSelectReport} />
        )}
      </div>
    </>
  );
}