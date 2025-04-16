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
import LandingPage from "@/pages/LandingPage";
import AIToolsPage from "@/pages/AIToolsPage";
import AICostWizardPage from "@/pages/AICostWizardPage";
import ARVisualizationPage from "@/pages/ARVisualizationPage";
import DataImportPage from "@/pages/DataImportPage";
import BenchmarkingPage from "@/pages/BenchmarkingPage";
import MCPOverviewPage from "@/pages/MCPOverviewPage";
import WhatIfScenariosPage from "@/pages/WhatIfScenariosPage";
import ReportsPage from "@/pages/ReportsPage";
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
import CostWizardPage from "@/pages/CostWizardPage";
import Header from "@/components/layout/header";
import ProtectedRoute from "@/components/auth/protected-route";
import { AuthProvider } from "@/contexts/auth-context";
import { CollaborationProvider } from "./contexts/CollaborationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { WindowProvider } from "./contexts/WindowContext";
import { ThemeProvider } from "./contexts/ThemeContext";
// Import for NavigationMenuProvider has been removed
import SupabaseProvider from "@/components/supabase/SupabaseProvider";
import { EnhancedSupabaseProvider } from "@/components/supabase/EnhancedSupabaseProvider";
import { useEffect, useState } from "react";

// Add TypeScript declaration for our custom window property
declare global {
  interface Window {
    lastSupabaseErrorTime?: number;
  }
}

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
      
      try {
        // Log error details to help with debugging
        const errorSource = event.reason?.stack?.split('\n')?.[1] || 'Unknown source';
        const errorMessage = event.reason?.message || 'Unknown error';
        
        // Determine the error type for more specific handling
        const isApiError = errorMessage.includes('fetch') || 
                           errorMessage.includes('network') || 
                           errorMessage.includes('API') || 
                           errorMessage.includes('/api/');
        
        const isAuthError = errorMessage.includes('auth') || 
                            errorMessage.includes('login') || 
                            errorMessage.includes('token') || 
                            errorSource.includes('AuthContext') ||
                            errorSource.includes('useAuth');
        
        const isSupabaseError = errorMessage.includes('Supabase') ||
                                errorSource.includes('supabase') || 
                                errorSource.includes('Supabase') ||
                                errorMessage.includes('Failed to fetch');
        
        // Handling specific error types
        if (isSupabaseError) {
          // Handle Supabase connection errors more gracefully
          // Avoid flooding the console with repeated errors
          const timeSinceLastSupabaseError = Date.now() - (window.lastSupabaseErrorTime || 0);
          if (timeSinceLastSupabaseError > 5000) { // Throttle to once every 5 seconds
            window.lastSupabaseErrorTime = Date.now();
            console.group('Supabase Connection Issue:');
            console.warn('The application is having trouble connecting to Supabase. This is expected in development mode.');
            console.warn('If using this in production, check your Supabase credentials and network connection.');
            console.groupEnd();
          }
          
          // Don't log detailed errors for Supabase in dev mode to reduce console noise
          return;
        }
        
        if (process.env.NODE_ENV === 'development') {
          // In development, show detailed error information
          console.group('Error Details:');
          console.error('Error:', errorMessage);
          console.error('Source:', errorSource);
          console.error('Stack:', event.reason?.stack);
          console.groupEnd();
        }
        
        // For production, we could send errors to a monitoring service
        // logErrorToService({ message: errorMessage, source: errorSource, stack: event.reason?.stack });
      } catch (handlingError) {
        // Ensure our error handling doesn't itself cause errors
        console.error('Error while handling unhandled rejection:', handlingError);
      }
    };
    
    const handleError = (event: ErrorEvent) => {
      // Determine the type of error
      const isAuthError = 
        event.message.includes('useAuth') || 
        event.message.includes('AuthProvider') ||
        event.message.includes('Authentication') ||
        event.message.includes('token') ||
        event.message.includes('login');
        
      const isSupabaseError = 
        event.message.includes('Supabase') ||
        event.message.includes('supabase') ||
        (event.filename && event.filename.includes('supabase')) ||
        event.message.includes('Failed to fetch');
      
      // Handle specific error types more gracefully
      if (isAuthError) {
        // Don't prevent default for auth errors, but log them specially
        console.warn('Auth-related error caught:', event.message);
      }
      
      // Handle Supabase connection errors more gracefully
      if (isSupabaseError) {
        // Throttle Supabase error messages to reduce console noise
        const timeSinceLastSupabaseError = Date.now() - (window.lastSupabaseErrorTime || 0);
        if (timeSinceLastSupabaseError > 5000) { // Throttle to once every 5 seconds
          window.lastSupabaseErrorTime = Date.now();
          console.group('Supabase Connection Issue:');
          console.warn('The application is having trouble connecting to Supabase. This is expected in development mode.');
          console.warn('If using this in production, check your Supabase credentials and network connection.');
          console.groupEnd();
        }
        return; // Skip further logging for Supabase errors
      }
      
      // Log all other errors in development
      if (process.env.NODE_ENV === 'development') {
        console.group('Global Error:');
        console.error('Message:', event.message);
        console.error('Source:', event.filename, 'Line:', event.lineno, 'Col:', event.colno);
        console.error('Error object:', event.error);
        console.groupEnd();
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

// Development mode setup - avoid Promise usage to prevent unhandled rejections
// This is only run once at app startup to set the mock user data
if (process.env.NODE_ENV === 'development') {
  // Set mock admin user directly in the query cache
  queryClient.setQueryData(["/api/user"], {
    id: 1,
    username: "admin",
    name: "Admin User",
    role: "admin",
    isActive: true
  });
}

// Global error handler wrapper component to handle unhandled rejections and errors
const ErrorHandlerWrapper = () => {
  // For development mode, set mock admin user directly in the query cache
  useEffect(() => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log("Setting up mock admin user for development");
        queryClient.setQueryData(["/api/user"], {
          id: 1,
          username: "admin",
          name: "Admin User",
          role: "admin",
          isActive: true
        });
      }
    } catch (error) {
      console.error("Error setting up mock user:", error);
    }
  }, []);
  
  return <GlobalErrorHandler />;
};

// Create a wrapper component to combine Route and ProtectedRoute
interface ProtectedRouteWrapperProps {
  path: string;
  component: React.ComponentType<any>;
  requiredRole?: string | string[];
}

const ProtectedRouteWrapper = ({ path, component: Component, requiredRole }: ProtectedRouteWrapperProps) => {
  return (
    <Route path={path}>
      <ProtectedRoute requiredRole={requiredRole}>
        <Component />
      </ProtectedRoute>
    </Route>
  );
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
      <Route path="/cost-wizard" component={CostWizardPage} />
      
      {/* Collaborative routes wrapped with CollaborationProvider */}
      <Route path="/shared-projects">
        <CollaborationProvider projectId={0}>
          <Switch>
            <ProtectedRouteWrapper path="/shared-projects" component={SharedProjectsPage} />
            <ProtectedRouteWrapper path="/shared-projects/create" component={CreateProjectPage} />
            <ProtectedRouteWrapper path="/shared-projects/:id" component={ProjectDetailsPage} />
            <ProtectedRouteWrapper path="/shared-projects/:id/dashboard" component={SharedProjectDashboardPage} />
          </Switch>
        </CollaborationProvider>
      </Route>
      
      <Route path="/projects">
        <CollaborationProvider projectId={0}>
          <Switch>
            <ProtectedRouteWrapper path="/projects/:id" component={ProjectDetailsPage} />
          </Switch>
        </CollaborationProvider>
      </Route>
      
      {/* Other protected routes */}
      <ProtectedRouteWrapper path="/dashboard" component={DashboardPage} />
      <ProtectedRouteWrapper path="/calculator" component={CalculatorPage} />
      <ProtectedRouteWrapper path="/analytics" component={AnalyticsPage} />
      <ProtectedRouteWrapper path="/users" component={UsersPage} />
      <ProtectedRouteWrapper path="/ai-tools" component={AIToolsPage} />
      <ProtectedRouteWrapper path="/ai-cost-wizard" component={AICostWizardPage} />
      <ProtectedRouteWrapper path="/ar-visualization" component={ARVisualizationPage} />
      <ProtectedRouteWrapper path="/data-import" component={DataImportPage} />
      <ProtectedRouteWrapper path="/benchmarking" component={BenchmarkingPage} />
      <ProtectedRouteWrapper path="/mcp-overview" component={MCPOverviewPage} />
      <ProtectedRouteWrapper path="/mcp-dashboard" component={MCPDashboard} />
      <ProtectedRouteWrapper path="/what-if-scenarios" component={WhatIfScenariosPage} />
      <ProtectedRouteWrapper path="/reports" component={ReportsPage} />
      <ProtectedRouteWrapper path="/visualizations" component={VisualizationsPage} />
      <ProtectedRouteWrapper path="/data-exploration" component={DataExplorationDemo} />
      <ProtectedRouteWrapper path="/comparative-analysis" component={ComparativeAnalysisDemo} />
      <ProtectedRouteWrapper path="/statistical-analysis" component={StatisticalAnalysisDemo} />
      <ProtectedRouteWrapper path="/cost-trend-analysis" component={CostTrendAnalysisDemo} />
      <ProtectedRouteWrapper path="/predictive-cost-analysis" component={PredictiveCostAnalysisDemo} />
      <ProtectedRouteWrapper path="/regional-cost-comparison" component={RegionalCostComparisonPage} />
      <ProtectedRouteWrapper path="/contextual-data" component={ContextualDataPage} />
      <ProtectedRouteWrapper path="/data-connections" component={DataConnectionsPage} />
      <ProtectedRouteWrapper path="/data-connections/ftp" component={FTPConnectionPage} />
      <ProtectedRouteWrapper path="/data-connections/ftp/test" component={FTPConnectionTestPage} />
      <ProtectedRouteWrapper path="/settings/ftp-sync" component={FTPSyncSchedulePage} />
      <ProtectedRouteWrapper path="/properties" component={PropertyBrowserPage} />
      <ProtectedRouteWrapper path="/properties/:id" component={PropertyDetailsPage} />
      <ProtectedRouteWrapper path="/geo-assessment" component={GeoAssessmentPage} />
      <ProtectedRouteWrapper path="/mcp-visualizations" component={MCPVisualizationsPage} />
      
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
          <ErrorHandlerWrapper />
          <EnhancedSupabaseProvider>
            <AuthProvider>
              <SidebarProvider>
                <WindowProvider>
                  <Router />
                  <Toaster />
                </WindowProvider>
              </SidebarProvider>
            </AuthProvider>
          </EnhancedSupabaseProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;