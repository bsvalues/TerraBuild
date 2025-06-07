import React from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WindowProvider } from '@/contexts/WindowContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HomePage from '@/pages/home-page';
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
import { BentonCountyValuationPage } from '@/pages/BentonCountyValuationPage';
import { MapAnalysisPage } from '@/pages/MapAnalysisPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WindowProvider>
        <SidebarProvider>
          <Router />
          <Toaster />
        </SidebarProvider>
      </WindowProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => (
        <DashboardLayout>
          <BentonCountyValuationPage />
        </DashboardLayout>
      )} />
      
      <Route path="/benton-county" component={() => (
        <DashboardLayout>
          <BentonCountyValuationPage />
        </DashboardLayout>
      )} />
      
      <Route path="/dashboards" component={() => (
        <DashboardLayout>
          <DashboardsPage />
        </DashboardLayout>
      )} />
      
      <Route path="/properties" component={() => (
        <DashboardLayout>
          <PropertiesPage />
        </DashboardLayout>
      )} />
      
      <Route path="/properties/:id" component={() => (
        <DashboardLayout>
          <PropertyDetailPage />
        </DashboardLayout>
      )} />
      
      <Route path="/matrix" component={() => (
        <DashboardLayout>
          <MatrixExplorerPage />
        </DashboardLayout>
      )} />
      
      <Route path="/maps" component={MapAnalysisPage} />
      
      <Route path="/calculator" component={() => (
        <DashboardLayout>
          <CalculatorPage />
        </DashboardLayout>
      )} />
      
      <Route path="/cost-factors" component={() => (
        <DashboardLayout>
          <CostFactorTablesPage />
        </DashboardLayout>
      )} />
      
      <Route path="/cost-wizard" component={() => (
        <DashboardLayout>
          <CostWizardPage />
        </DashboardLayout>
      )} />
      
      <Route path="/test-cost-factors" component={TestCostFactorsPage} />
      
      <Route path="/reports" component={() => (
        <DashboardLayout>
          <ReportsPage />
        </DashboardLayout>
      )} />
      
      <Route path="/settings" component={() => (
        <DashboardLayout>
          <SettingsPage />
        </DashboardLayout>
      )} />
      
      <Route path="/diagnostic" component={() => (
        <DashboardLayout>
          <DiagnosticPage />
        </DashboardLayout>
      )} />
      
      <Route path="/trend-analysis" component={() => (
        <DashboardLayout>
          <TrendAnalysisPage />
        </DashboardLayout>
      )} />
      
      <Route path="/import" component={() => (
        <DashboardLayout>
          <DataImportPage />
        </DashboardLayout>
      )} />
      
      <Route path="/documentation" component={() => (
        <DashboardLayout>
          <DocumentationPage />
        </DashboardLayout>
      )} />
      
      <Route path="/history" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">History</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">History tracking coming soon...</p>
          </div>
        </DashboardLayout>
      )} />
      
      <Route path="/agents" component={() => (
        <DashboardLayout>
          <AgentsPage />
        </DashboardLayout>
      )} />

      <Route path="/help" component={() => (
        <DashboardLayout>
          <HelpSupportPage />
        </DashboardLayout>
      )} />
      
      <Route path="/help/webinars" component={() => (
        <DashboardLayout>
          <WebinarsPage />
        </DashboardLayout>
      )} />
      
      <Route path="/help/webinars/:id" component={() => (
        <DashboardLayout>
          <WebinarViewPage />
        </DashboardLayout>
      )} />
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;