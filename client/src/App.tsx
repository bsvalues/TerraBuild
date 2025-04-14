import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

// Import all page components
import DashboardPage from "@/pages/DashboardPage";
import CalculatorPage from "@/pages/CalculatorPage";
import UsersPage from "@/pages/users-page";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/LandingPage";
import AIToolsPage from "@/pages/AIToolsPage";
import AICostWizardPage from "@/pages/AICostWizardPage";
import ARVisualizationPage from "@/pages/ARVisualizationPage";
import DataImportPage from "@/pages/DataImportPage";
import BenchmarkingPage from "@/pages/BenchmarkingPage";
import MCPOverviewPage from "@/pages/MCPOverviewPage";
import WhatIfScenariosPage from "@/pages/WhatIfScenariosPage";
import VisualizationsPage from "@/pages/VisualizationsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import DataExplorationDemo from "@/pages/DataExplorationDemo";
import ComparativeAnalysisDemo from "@/pages/ComparativeAnalysisDemo";
import StatisticalAnalysisDemo from "@/pages/StatisticalAnalysisDemo";
import CostTrendAnalysisDemo from "@/pages/CostTrendAnalysisDemo";
import PredictiveCostAnalysisDemo from "@/pages/PredictiveCostAnalysisDemo";
import RegionalCostComparisonPage from "@/pages/RegionalCostComparisonPage";
import SharedProjectsPage from "@/pages/SharedProjectsPage";
// Use the newly renamed file to avoid casing conflicts
import MCPDashboard from "@/pages/MainDashboard";
import CreateProjectPage from "@/pages/CreateProjectPage";
import DocumentationPage from "@/pages/documentation";
import TutorialsPage from "@/pages/tutorials";
import FAQPage from "@/pages/faq";
import ProjectDetailsPage from "@/pages/ProjectDetailsPage";
import SharedProjectDashboardPage from "@/pages/SharedProjectDashboardPage";
import DataConnectionsPage from "@/pages/DataConnectionsPage";
import FTPConnectionPage from "@/pages/FTPConnectionPage";
import FTPSyncSchedulePage from "@/pages/FTPSyncSchedulePage";
import FTPConnectionTestPage from "@/pages/FTPConnectionTestPage";
import ContextualDataPage from "@/pages/contextual-data";
import PropertyBrowserPage from "@/pages/PropertyBrowserPage";
import PropertyDetailsPage from "@/pages/PropertyDetailsPage";
import GeoAssessmentPage from "@/pages/GeoAssessmentPage";
import MCPVisualizationsPage from "@/pages/MCPVisualizationsPage";
import SupabaseTestPage from "@/pages/SupabaseTestPage";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./contexts/AuthContext";
import { CollaborationProvider } from "./contexts/CollaborationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { WindowProvider } from "./contexts/WindowContext";
import { ThemeProvider } from "./contexts/ThemeContext";
// Import for NavigationMenuProvider has been removed
import SupabaseProvider from "@/components/supabase/SupabaseProvider";
import { useEffect, useState } from "react";

// Add link to Remix Icon for icons
const RemixIconLink = () => (
  <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
);

// Track global promise rejections and handle them gracefully
const GlobalErrorHandler = () => {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault(); // Prevent default console error
      console.warn('Unhandled promise rejection caught:', event.reason);
      
      // If you want to log to a service in production, you could do that here
      // Example: logErrorToService(event.reason);
    };
    
    const handleError = (event: ErrorEvent) => {
      // Prevent default console error in some cases
      if (event.message.includes('useAuth') || event.message.includes('AuthProvider')) {
        event.preventDefault();
        console.warn('Auth-related error caught:', event.message);
      }
    };
    
    // Add the event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    
    // Clean up the event listeners on component unmount
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return null;
};

// Dev auto login component without Promise usage to avoid unhandled rejections
const DevAutoLogin = () => {
  // Only set up the mock user once
  useEffect(() => {
    try {
      console.log("DEVELOPMENT MODE: Setting mock admin user");
      
      // Mock admin user - must match the User interface in auth.ts
      const adminUser = {
        id: 1,
        username: "admin",
        name: "Admin User",
        role: "admin",
        isActive: true
      };
      
      // Set the query data directly
      queryClient.setQueryData(["/api/user"], adminUser);
    } catch (error) {
      console.error("Error in DevAutoLogin:", error);
    }
  }, []);
  
  return <GlobalErrorHandler />;
};

function Router() {
  return (
    <Switch>
      {/* Use LandingPage as the root route without authentication */}
      <Route path="/" component={LandingPage} />
      <Route path="/documentation" component={DocumentationPage} />
      <Route path="/tutorials" component={TutorialsPage} />
      <Route path="/faq" component={FAQPage} />
      
      {/* Supabase test route - without protection for easier testing */}
      <Route path="/supabase-test" component={SupabaseTestPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Collaborative routes wrapped with CollaborationProvider */}
      <Route path="/shared-projects">
        <CollaborationProvider projectId={0}>
          <Switch>
            <ProtectedRoute path="/shared-projects" component={SharedProjectsPage} />
            <ProtectedRoute path="/shared-projects/create" component={CreateProjectPage} />
            <ProtectedRoute path="/shared-projects/:id" component={ProjectDetailsPage} />
            <ProtectedRoute path="/shared-projects/:id/dashboard" component={SharedProjectDashboardPage} />
          </Switch>
        </CollaborationProvider>
      </Route>
      
      <Route path="/projects">
        <CollaborationProvider projectId={0}>
          <Switch>
            <ProtectedRoute path="/projects/:id" component={ProjectDetailsPage} />
          </Switch>
        </CollaborationProvider>
      </Route>
      
      {/* Other protected routes */}
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/calculator" component={CalculatorPage} />
      <ProtectedRoute path="/analytics" component={AnalyticsPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/ai-tools" component={AIToolsPage} />
      <ProtectedRoute path="/ai-cost-wizard" component={AICostWizardPage} />
      <ProtectedRoute path="/ar-visualization" component={ARVisualizationPage} />
      <ProtectedRoute path="/data-import" component={DataImportPage} />
      <ProtectedRoute path="/benchmarking" component={BenchmarkingPage} />
      <ProtectedRoute path="/mcp-overview" component={MCPOverviewPage} />
      <ProtectedRoute path="/mcp-dashboard" component={MCPDashboard} />
      <ProtectedRoute path="/what-if-scenarios" component={WhatIfScenariosPage} />
      <ProtectedRoute path="/visualizations" component={VisualizationsPage} />
      <ProtectedRoute path="/data-exploration" component={DataExplorationDemo} />
      <ProtectedRoute path="/comparative-analysis" component={ComparativeAnalysisDemo} />
      <ProtectedRoute path="/statistical-analysis" component={StatisticalAnalysisDemo} />
      <ProtectedRoute path="/cost-trend-analysis" component={CostTrendAnalysisDemo} />
      <ProtectedRoute path="/predictive-cost-analysis" component={PredictiveCostAnalysisDemo} />
      <ProtectedRoute path="/regional-cost-comparison" component={RegionalCostComparisonPage} />
      <ProtectedRoute path="/contextual-data" component={ContextualDataPage} />
      <ProtectedRoute path="/data-connections" component={DataConnectionsPage} />
      <ProtectedRoute path="/data-connections/ftp" component={FTPConnectionPage} />
      <ProtectedRoute path="/data-connections/ftp/test" component={FTPConnectionTestPage} />
      <ProtectedRoute path="/settings/ftp-sync" component={FTPSyncSchedulePage} />
      <ProtectedRoute path="/properties" component={PropertyBrowserPage} />
      <ProtectedRoute path="/properties/:id" component={PropertyDetailsPage} />
      <ProtectedRoute path="/geo-assessment" component={GeoAssessmentPage} />
      <ProtectedRoute path="/mcp-visualizations" component={MCPVisualizationsPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Global error fallback UI
  const globalErrorFallback = (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md p-6 space-y-4 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          The application encountered an unexpected error. Please try refreshing the page.
        </p>
        <Button 
          onClick={() => window.location.reload()}
          className="w-full mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reload Application
        </Button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={globalErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RemixIconLink />
          <DevAutoLogin />
          <SupabaseProvider>
            <AuthProvider>
              <SidebarProvider>
                <WindowProvider>
                  <Router />
                  <Toaster />
                </WindowProvider>
              </SidebarProvider>
            </AuthProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;