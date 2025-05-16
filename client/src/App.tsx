import { Route, Switch } from 'wouter';
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
import DocumentationPage from '@/pages/documentation';
import SettingsPage from '@/pages/settings';
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
      
      <ProtectedRoute path="/matrix" component={() => (
        <DashboardLayout>
          <MatrixExplorerPage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/maps" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Valuation Maps</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Valuation maps coming soon...</p>
          </div>
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
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Report Generator</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Report generator coming soon...</p>
          </div>
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
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Trend Analysis</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Trend analysis coming soon...</p>
          </div>
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/import" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Data Import</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Data import functionality coming soon...</p>
          </div>
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
      
      <ProtectedRoute path="/help" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Help & Support</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Help & support information coming soon...</p>
          </div>
        </DashboardLayout>
      )} />
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;