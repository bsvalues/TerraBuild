import React from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AuthProvider } from '@/contexts/auth-context-fixed';
import { WindowProvider } from '@/contexts/WindowContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HomePage from '@/pages/home-page';
import AuthPage from '@/pages/auth-page';
import LoginPage from '@/pages/login';
import NotFoundPage from '@/pages/not-found';
import CostFactorTablesPage from '@/pages/CostFactorTablesPage';
import CostWizardPage from '@/pages/CostWizardPage';
import TestCostFactorsPage from '@/pages/TestCostFactorsPage';
import MatrixExplorerPage from '@/pages/matrix';
import DiagnosticPage from '@/pages/diagnostic';
import CalculatorPage from '@/pages/calculator-page';
import DashboardsPage from '@/pages/dashboards';
import PropertiesPage from '@/pages/properties';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import DocumentationPage from '@/pages/documentation-new';
import SettingsPage from '@/pages/settings';
import ReportsPage from '@/pages/reports';
import TrendAnalysisPage from '@/pages/trend-analysis';
import DataImportPage from '@/pages/data-import';
import AgentsPage from '@/pages/agents/index-fixed';
import HelpSupportPage from '@/pages/help';
import WebinarsPage from '@/pages/help/webinars';
import WebinarViewPage from '@/pages/help/webinars/[id]';
import ValuationMapsPage from '@/pages/maps';
import { ProtectedRoute } from '@/lib/protected-route';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WindowProvider>
          <SidebarProvider>
            <Router />
            <Toaster />
          </SidebarProvider>
        </WindowProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={LoginPage} />
      
      <ProtectedRoute path="/" component={() => (
        <DashboardLayout>
          <HomePage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/dashboards" component={() => (
        <DashboardLayout>
          <DashboardsPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/properties" component={() => (
        <DashboardLayout>
          <PropertiesPage />
        </DashboardLayout>
      )} />
      
      <Route path="/properties/:id">
        {(params) => (
          <DashboardLayout>
            <PropertyDetailPage />
          </DashboardLayout>
        )}
      </Route>
      
      <ProtectedRoute path="/matrix" component={() => (
        <DashboardLayout>
          <MatrixExplorerPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/maps" component={() => (
        <DashboardLayout>
          <ValuationMapsPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/calculator" component={() => (
        <DashboardLayout>
          <CalculatorPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/cost-factors" component={() => (
        <DashboardLayout>
          <CostFactorTablesPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/cost-wizard" component={() => (
        <DashboardLayout>
          <CostWizardPage />
        </DashboardLayout>
      )} />
      
      <Route path="/test-cost-factors" component={TestCostFactorsPage} />
      
      <ProtectedRoute path="/reports" component={() => (
        <DashboardLayout>
          <ReportsPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/settings" component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/diagnostic" component={() => (
        <DashboardLayout>
          <DiagnosticPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/trend-analysis" component={() => (
        <DashboardLayout>
          <TrendAnalysisPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/import" component={() => (
        <DashboardLayout>
          <DataImportPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/documentation" component={() => (
        <DashboardLayout>
          <DocumentationPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/history" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">History</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">History tracking coming soon...</p>
          </div>
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/agents" component={() => (
        <DashboardLayout>
          <AgentsPage />
        </DashboardLayout>
      )} />

      <ProtectedRoute path="/help" component={() => (
        <DashboardLayout>
          <HelpSupportPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/help/webinars" component={() => (
        <DashboardLayout>
          <WebinarsPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/help/webinars/:id" component={() => (
        <DashboardLayout>
          <WebinarViewPage />
        </DashboardLayout>
      )} />
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;