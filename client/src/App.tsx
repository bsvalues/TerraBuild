import React from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WindowProvider } from '@/contexts/WindowContext';
import { AuthProvider } from '@/contexts/AuthContext';
import TerraFusionLayout from '@/components/layout/TerraFusionLayout';
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
import TerraFusionCore from '@/components/TerraFusionCore';

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
      <Route path="/" component={() => (
        <TerraFusionLayout>
          <TerraFusionCore />
        </TerraFusionLayout>
      )} />
      
      <Route path="/benton-county" component={() => (
        <TerraFusionLayout>
          <BentonCountyValuationPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/dashboards" component={() => (
        <TerraFusionLayout>
          <DashboardsPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/properties" component={() => (
        <TerraFusionLayout>
          <PropertiesPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/properties/:id" component={() => (
        <TerraFusionLayout>
          <PropertyDetailPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/matrix" component={() => (
        <TerraFusionLayout>
          <MatrixExplorerPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/maps" component={() => (
        <TerraFusionLayout>
          <MapAnalysisPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/calculator" component={() => (
        <TerraFusionLayout>
          <CalculatorPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/cost-factors" component={() => (
        <TerraFusionLayout>
          <CostFactorTablesPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/cost-wizard" component={() => (
        <TerraFusionLayout>
          <CostWizardPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/test-cost-factors" component={() => (
        <TerraFusionLayout>
          <TestCostFactorsPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/reports" component={() => (
        <TerraFusionLayout>
          <ReportsPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/settings" component={() => (
        <TerraFusionLayout>
          <SettingsPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/diagnostic" component={() => (
        <TerraFusionLayout>
          <DiagnosticPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/trend-analysis" component={() => (
        <TerraFusionLayout>
          <TrendAnalysisPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/import" component={() => (
        <TerraFusionLayout>
          <DataImportPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/documentation" component={() => (
        <TerraFusionLayout>
          <DocumentationPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/history" component={() => (
        <TerraFusionLayout>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-2">History</h1>
            <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-700">
              <p className="text-slate-300">History tracking coming soon...</p>
            </div>
          </div>
        </TerraFusionLayout>
      )} />
      
      <Route path="/agents" component={() => (
        <TerraFusionLayout>
          <AgentsPage />
        </TerraFusionLayout>
      )} />

      <Route path="/help" component={() => (
        <TerraFusionLayout>
          <HelpSupportPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/help/webinars" component={() => (
        <TerraFusionLayout>
          <WebinarsPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/help/webinars/:id" component={() => (
        <TerraFusionLayout>
          <WebinarViewPage />
        </TerraFusionLayout>
      )} />
      
      <Route path="/predictive" component={() => (
        <TerraFusionLayout>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-2">Predictive Analytics</h1>
            <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-700">
              <p className="text-slate-300">AI-powered market forecasting and trend analysis coming soon...</p>
            </div>
          </div>
        </TerraFusionLayout>
      )} />
      
      <Route path="/insights" component={() => (
        <TerraFusionLayout>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-2">Smart Insights</h1>
            <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-700">
              <p className="text-slate-300">Automated pattern recognition and recommendations coming soon...</p>
            </div>
          </div>
        </TerraFusionLayout>
      )} />
      
      <Route path="/users" component={() => (
        <TerraFusionLayout>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <div className="bg-slate-800/30 p-8 rounded-lg border border-slate-700">
              <p className="text-slate-300">Access control and role management coming soon...</p>
            </div>
          </div>
        </TerraFusionLayout>
      )} />
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;