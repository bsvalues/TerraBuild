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
import ARVisualizationPage from "@/pages/ARVisualizationPage";
import DataImportPage from "@/pages/DataImportPage";
import BenchmarkingPage from "@/pages/BenchmarkingPage";
import MCPOverviewPage from "@/pages/MCPOverviewPage";
import DataExplorationDemo from "@/pages/DataExplorationDemo";
import ComparativeAnalysisDemo from "@/pages/ComparativeAnalysisDemo";
import StatisticalAnalysisDemo from "@/pages/StatisticalAnalysisDemo";
import CostTrendAnalysisDemo from "@/pages/CostTrendAnalysisDemo";
import PredictiveCostAnalysisDemo from "@/pages/PredictiveCostAnalysisDemo";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
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
      <ProtectedRoute path="/ar-visualization" component={ARVisualizationPage} />
      <ProtectedRoute path="/data-import" component={DataImportPage} />
      <ProtectedRoute path="/benchmarking" component={BenchmarkingPage} />
      <ProtectedRoute path="/mcp-overview" component={MCPOverviewPage} />
      <ProtectedRoute path="/data-exploration" component={DataExplorationDemo} />
      <ProtectedRoute path="/comparative-analysis" component={ComparativeAnalysisDemo} />
      <ProtectedRoute path="/statistical-analysis" component={StatisticalAnalysisDemo} />
      <ProtectedRoute path="/cost-trend-analysis" component={CostTrendAnalysisDemo} />
      <ProtectedRoute path="/predictive-cost-analysis" component={PredictiveCostAnalysisDemo} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DevAutoLogin />
        <RemixIconLink />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
