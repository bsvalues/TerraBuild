import React, { useState } from 'react';
import { Route, Switch, useRoute } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { WindowProvider } from '@/contexts/WindowContext';
import { AuthProvider } from '@/contexts/AuthContext';
import EnterpriseLayout from '@/components/layout/EnterpriseLayout';
import TerraFusionSplash from '@/components/TerraFusionSplash';
import HomePage from '@/pages/home-page';
import NotFoundPage from '@/pages/not-found';
import TestCostFactorsPage from '@/pages/TestCostFactorsPage';
import MatrixExplorerPage from '@/pages/matrix';
import DiagnosticPage from '@/pages/diagnostic';
import CalculatorPage from '@/pages/calculator-page';
import DashboardsPage from '@/pages/dashboards';
import PropertiesPage from '@/pages/properties';
import PortfolioAnalytics from '@/pages/analytics/PortfolioAnalytics';
import MarketAnalytics from '@/pages/analytics/MarketAnalytics';
import MunicipalDashboard from '@/pages/deployment/MunicipalDashboard';
import DocumentationPage from '@/pages/documentation-new';
import SettingsPage from '@/pages/settings';
import ReportsPage from '@/pages/reports';
import TrendAnalysisPage from '@/pages/trend-analysis';
import DataImportPage from '@/pages/data-import';
import NewCostWizardPage from '@/pages/cost-wizard';
import CostFactorsPage from '@/pages/cost-factors';
import MapsPage from '@/pages/maps';
import AgentsPage from '@/pages/agents/index-fixed';
import HelpSupportPage from '@/pages/help';
import WebinarsPage from '@/pages/help/webinars';
import WebinarViewPage from '@/pages/help/webinars/[id]';
import EnterpriseSetupPage from '@/pages/setup/EnterpriseSetupPage';
import PropertyValuationPage from '@/pages/valuation';



function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WindowProvider>
          <SidebarProvider>
            {showSplash && (
              <TerraFusionSplash onComplete={() => setShowSplash(false)} duration={2500} />
            )}
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
        <EnterpriseLayout>
          <HomePage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/benton-county" component={() => (
        <EnterpriseLayout>
          <PropertiesPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/dashboards" component={() => (
        <EnterpriseLayout>
          <DashboardsPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/properties" component={() => (
        <EnterpriseLayout>
          <PropertiesPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/analytics" component={() => (
        <EnterpriseLayout>
          <PortfolioAnalytics />
        </EnterpriseLayout>
      )} />
      
      <Route path="/valuation" component={() => (
        <EnterpriseLayout>
          <PropertyValuationPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/market-intelligence" component={() => (
        <EnterpriseLayout>
          <MarketAnalytics />
        </EnterpriseLayout>
      )} />
      
      <Route path="/deployment" component={() => (
        <EnterpriseLayout>
          <MunicipalDashboard />
        </EnterpriseLayout>
      )} />
      

      
      <Route path="/matrix" component={() => (
        <EnterpriseLayout>
          <MatrixExplorerPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/maps" component={() => (
        <EnterpriseLayout>
          <MapsPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/calculator" component={() => (
        <EnterpriseLayout>
          <CalculatorPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/cost-factors" component={() => (
        <EnterpriseLayout>
          <CostFactorsPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/cost-wizard" component={() => (
        <EnterpriseLayout>
          <NewCostWizardPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/test-cost-factors" component={() => (
        <EnterpriseLayout>
          <TestCostFactorsPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/reports" component={() => (
        <EnterpriseLayout>
          <ReportsPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/settings" component={() => (
        <EnterpriseLayout>
          <SettingsPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/diagnostic" component={() => (
        <EnterpriseLayout>
          <DiagnosticPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/trend-analysis" component={() => (
        <EnterpriseLayout>
          <TrendAnalysisPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/import" component={() => (
        <EnterpriseLayout>
          <DataImportPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/documentation" component={() => (
        <EnterpriseLayout>
          <DocumentationPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/agents" component={() => (
        <EnterpriseLayout>
          <AgentsPage />
        </EnterpriseLayout>
      )} />

      <Route path="/help" component={() => (
        <EnterpriseLayout>
          <HelpSupportPage />
        </EnterpriseLayout>
      )} />
      
      <Route path="/setup" component={() => (
        <EnterpriseSetupPage />
      )} />
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;