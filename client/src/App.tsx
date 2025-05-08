import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { TASKS } from "@/config/tasks";

// Import all page components
import DashboardPage from "@/pages/DashboardPage";
import CalculatorPage from "@/pages/CalculatorPage";
import EnhancedCalculatorPage from "@/pages/EnhancedCalculatorPage";
import EnhancedCalculatorPageV2 from "@/pages/EnhancedCalculatorPageV2";
import WorkflowDashboardPage from "@/pages/WorkflowDashboardPage";
import UsersPage from "@/pages/users-page";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/auth-page";
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
import InfrastructureLifecyclePage from "@/pages/InfrastructureLifecyclePage";
import GeoAssessmentPage from "@/pages/GeoAssessmentPage";
import MCPVisualizationsPage from "@/pages/MCPVisualizationsPage";
import SupabaseTestPage from "@/pages/SupabaseTestPage";
import CostWizardPage from "@/pages/CostWizardPage";
import CostCalculator from "@/pages/CostCalculator";
import SwarmPage from "@/pages/SwarmPage";
import MatrixUploadPage from "@/pages/MatrixUploadPage";
import XREGPage from "@/pages/XREGPage";
import MatrixXREGIntegrationPage from "@/pages/MatrixXREGIntegrationPage";
import ValuationDashboardPage from "@/pages/ValuationDashboardPage";
import BentonCountyDemo from "@/pages/BentonCountyDemo";
import Header from "@/components/layout/header";
import ProtectedRoute from "@/components/auth/protected-route";
import { AuthProvider } from "./contexts/auth-context";
import { CollaborationProvider } from "./contexts/CollaborationContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { WindowProvider } from "./contexts/WindowContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import DataFlowProvider from "@/contexts/DataFlowContext";
import TerraBuildThemeProvider from "./components/TerraBuildThemeProvider";
// Import for NavigationMenuProvider has been removed
import SupabaseProvider from "@/components/supabase/SupabaseProvider";
import { EnhancedSupabaseProvider } from "@/components/supabase/EnhancedSupabaseProvider";
import React, { useEffect, useState } from "react";

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
      if (import.meta.env.DEV) {
        console.log("Setting up mock admin user for development");
        // Set mock user data directly to avoid HTML parsing issues
        queryClient.setQueryData(["/api/user"], {
          id: 1,
          username: "admin",
          name: "Admin User",
          role: "admin",
          isActive: true
        });
        
        // Set up a mock implementation for fetch when requesting user data
        const originalFetch = window.fetch;
        window.fetch = function(input, init) {
          // Check if this is a request to /api/user or /api/auth/user
          if (typeof input === 'string' && 
              (input.endsWith('/api/user') || input.endsWith('/api/auth/user'))) {
            console.log("Intercepting auth request in development mode");
            return Promise.resolve({
              ok: true,
              status: 200,
              json: () => Promise.resolve({
                id: 1,
                username: "admin",
                name: "Admin User",
                role: "admin",
                isActive: true
              })
            } as Response);
          }
          // Otherwise, use the original fetch
          return originalFetch(input as RequestInfo, init);
        };
      }
    } catch (error) {
      console.error("Error setting up mock user:", error);
    }
  }, []);
  
  return <GlobalErrorHandler />;
};

// We've refactored to use the ProtectedRoute component directly within each Route definition

function Router() {
  return (
    <Switch>
      {/* Public routes - no authentication required */}
      <Route path="/" >
        <LandingPage />
      </Route>
      
      <Route path="/auth">
        <AuthPage />
      </Route>
      
      <Route path="/documentation">
        <DocumentationPage />
      </Route>
      
      <Route path="/tutorials">
        <TutorialsPage />
      </Route>
      
      <Route path="/faq">
        <FAQPage />
      </Route>
      
      {/* Test routes - without protection for easier testing */}
      <Route path="/supabase-test">
        <SupabaseTestPage />
      </Route>
      
      <Route path="/cost-wizard">
        <CostWizardPage />
      </Route>

      <Route path="/benton-demo">
        <BentonCountyDemo />
      </Route>
      
      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/calculator">
        <ProtectedRoute>
          <EnhancedCalculatorPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/calculator-v2">
        <ProtectedRoute>
          <EnhancedCalculatorPageV2 />
        </ProtectedRoute>
      </Route>
      
      <Route path="/workflows">
        <ProtectedRoute>
          <WorkflowDashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/calculator-old">
        <ProtectedRoute>
          <CalculatorPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute>
          <AnalyticsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/users">
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ai-tools">
        <ProtectedRoute>
          <AIToolsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ai-cost-wizard">
        <ProtectedRoute>
          <AICostWizardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ar-visualization">
        <ProtectedRoute>
          <ARVisualizationPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/data-import">
        <ProtectedRoute>
          <DataImportPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/benchmarking">
        <ProtectedRoute>
          <BenchmarkingPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/mcp-overview">
        <ProtectedRoute>
          <MCPOverviewPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/mcp-dashboard">
        <ProtectedRoute>
          <MCPDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/what-if-scenarios">
        <ProtectedRoute>
          <WhatIfScenariosPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/visualizations">
        <ProtectedRoute>
          <VisualizationsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/data-exploration">
        <ProtectedRoute>
          <DataExplorationDemo />
        </ProtectedRoute>
      </Route>
      
      <Route path="/infrastructure-lifecycle">
        <ProtectedRoute>
          <InfrastructureLifecyclePage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/comparative-analysis">
        <ProtectedRoute>
          <ComparativeAnalysisDemo />
        </ProtectedRoute>
      </Route>
      
      <Route path="/statistical-analysis">
        <ProtectedRoute>
          <StatisticalAnalysisDemo />
        </ProtectedRoute>
      </Route>
      
      <Route path="/cost-trend-analysis">
        <ProtectedRoute>
          <CostTrendAnalysisDemo />
        </ProtectedRoute>
      </Route>
      
      <Route path="/predictive-cost-analysis">
        <ProtectedRoute>
          <PredictiveCostAnalysisDemo />
        </ProtectedRoute>
      </Route>
      
      <Route path="/regional-cost-comparison">
        <ProtectedRoute>
          <RegionalCostComparisonPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/matrix-upload">
        <ProtectedRoute>
          <MatrixUploadPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/xreg">
        <ProtectedRoute>
          <XREGPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/matrix-xreg-integration">
        <ProtectedRoute>
          <MatrixXREGIntegrationPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/valuation-dashboard">
        <ProtectedRoute>
          <ValuationDashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/contextual-data">
        <ProtectedRoute>
          <ContextualDataPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/data-connections">
        <ProtectedRoute>
          <DataConnectionsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/data-connections/ftp">
        <ProtectedRoute>
          <FTPConnectionPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/data-connections/ftp/test">
        <ProtectedRoute>
          <FTPConnectionTestPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings/ftp-sync">
        <ProtectedRoute>
          <FTPSyncSchedulePage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/properties">
        <ProtectedRoute>
          <PropertyBrowserPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/properties/:id">
        <ProtectedRoute>
          <PropertyDetailsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/geo-assessment">
        <ProtectedRoute>
          <GeoAssessmentPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/mcp-visualizations">
        <ProtectedRoute>
          <MCPVisualizationsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/cost-calculator">
        <ProtectedRoute>
          <CostCalculator />
        </ProtectedRoute>
      </Route>
      
      <Route path="/ai-swarm">
        <ProtectedRoute>
          <SwarmPage />
        </ProtectedRoute>
      </Route>
      
      {/* Collaborative routes */}
      <Route path="/shared-projects">
        <ProtectedRoute>
          <SharedProjectsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/shared-projects/create">
        <ProtectedRoute>
          <CreateProjectPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/shared-projects/:id">
        <ProtectedRoute>
          <ProjectDetailsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/shared-projects/:id/dashboard">
        <ProtectedRoute>
          <SharedProjectDashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/projects/:id">
        <ProtectedRoute>
          <ProjectDetailsPage />
        </ProtectedRoute>
      </Route>
      
      {/* 404 route */}
      <Route>
        <NotFound />
      </Route>
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
        <TerraBuildThemeProvider defaultTheme="advanced" defaultMode="light">
          <ThemeProvider>
            <RemixIconLink />
            <ErrorHandlerWrapper />
            <EnhancedSupabaseProvider>
              <WindowProvider>
                {/* Using only the AuthProvider to prevent duplicate context issues */}
                <AuthProvider>
                  <DataFlowProvider>
                    <SidebarProvider>
                      {/* Workflow Provider for task-based navigation */}
                      <WorkflowProvider tasks={TASKS}>
                        <Router />
                        <Toaster />
                      </WorkflowProvider>
                    </SidebarProvider>
                  </DataFlowProvider>
                </AuthProvider>
              </WindowProvider>
            </EnhancedSupabaseProvider>
          </ThemeProvider>
        </TerraBuildThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;