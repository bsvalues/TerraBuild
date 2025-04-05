import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DashboardPage from "@/pages/DashboardPage";
import CalculatorPage from "@/pages/CalculatorPage";
import UsersPage from "@/pages/users-page";
import AuthPage from "@/pages/auth-page";
import AIToolsPage from "@/pages/AIToolsPage";
import AICostWizardPage from "@/pages/AICostWizardPage";
import ARVisualizationPage from "@/pages/ARVisualizationPage";
import DataImportPage from "@/pages/DataImportPage";
import BenchmarkingPage from "@/pages/BenchmarkingPage";
import MCPOverviewPage from "@/pages/MCPOverviewPage";
import WhatIfScenariosPage from "@/pages/WhatIfScenariosPage";
import VisualizationsPage from "@/pages/VisualizationsPage";
import DataExplorationDemo from "@/pages/DataExplorationDemo";
import ComparativeAnalysisDemo from "@/pages/ComparativeAnalysisDemo";
import StatisticalAnalysisDemo from "@/pages/StatisticalAnalysisDemo";
import CostTrendAnalysisDemo from "@/pages/CostTrendAnalysisDemo";
import PredictiveCostAnalysisDemo from "@/pages/PredictiveCostAnalysisDemo";
import RegionalCostComparisonPage from "@/pages/RegionalCostComparisonPage";
import SharedProjectsPage from "@/pages/SharedProjectsPage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import ProjectDetailsPage from "@/pages/ProjectDetailsPage";
import SharedProjectDashboardPage from "@/pages/SharedProjectDashboardPage";
import DataConnectionsPage from "@/pages/DataConnectionsPage";
import FTPConnectionPage from "@/pages/FTPConnectionPage";
import FTPSyncSchedulePage from "@/pages/FTPSyncSchedulePage";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { CollaborationProvider } from "./contexts/CollaborationContext";
import { useEffect } from "react";

// Add link to Remix Icon for icons
const RemixIconLink = () => (
  <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
);

// Component for auto-login
const DevAutoLogin = () => {
  useEffect(() => {
    console.log("DEVELOPMENT MODE: Setting mock admin user");
    // Use the same mock admin user as on the server
    const adminUser = {
      id: 1,
      username: "admin",
      password: "password", // Not actual password, just for display
      role: "admin",
      name: "Admin User",
      isActive: true
    };
    
    // Set the user data directly in the query cache
    queryClient.setQueryData(["/api/user"], adminUser);
  }, []);
  
  return null;
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/calculator" component={CalculatorPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/ai-tools" component={AIToolsPage} />
      <ProtectedRoute path="/ai-cost-wizard" component={AICostWizardPage} />
      <ProtectedRoute path="/ar-visualization" component={ARVisualizationPage} />
      <ProtectedRoute path="/data-import" component={DataImportPage} />
      <ProtectedRoute path="/benchmarking" component={BenchmarkingPage} />
      <ProtectedRoute path="/mcp-overview" component={MCPOverviewPage} />
      <ProtectedRoute path="/what-if-scenarios" component={WhatIfScenariosPage} />
      <ProtectedRoute path="/visualizations" component={VisualizationsPage} />
      <ProtectedRoute path="/data-exploration" component={DataExplorationDemo} />
      <ProtectedRoute path="/comparative-analysis" component={ComparativeAnalysisDemo} />
      <ProtectedRoute path="/statistical-analysis" component={StatisticalAnalysisDemo} />
      <ProtectedRoute path="/cost-trend-analysis" component={CostTrendAnalysisDemo} />
      <ProtectedRoute path="/predictive-cost-analysis" component={PredictiveCostAnalysisDemo} />
      <ProtectedRoute path="/regional-cost-comparison" component={RegionalCostComparisonPage} />
      <ProtectedRoute path="/data-connections" component={DataConnectionsPage} />
      <ProtectedRoute path="/data-connections/ftp" component={FTPConnectionPage} />
      <ProtectedRoute path="/settings/ftp-sync" component={FTPSyncSchedulePage} />
      <ProtectedRoute path="/shared-projects" component={SharedProjectsPage} />
      <ProtectedRoute path="/shared-projects/create" component={CreateProjectPage} />
      <ProtectedRoute path="/shared-projects/:id" component={ProjectDetailsPage} />
      <ProtectedRoute path="/shared-projects/:id/dashboard" component={SharedProjectDashboardPage} />
      <ProtectedRoute path="/projects/:id" component={ProjectDetailsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollaborationProvider projectId={0}>
          <DevAutoLogin />
          <RemixIconLink />
          <Router />
          <Toaster />
        </CollaborationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
