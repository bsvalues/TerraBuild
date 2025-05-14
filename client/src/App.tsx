import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { AuthProvider } from '@/contexts/auth-context';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HomePage from '@/pages/home-page';
import AuthPage from '@/pages/auth-page';
import NotFoundPage from '@/pages/not-found';
import CostFactorTablesPage from '@/pages/CostFactorTablesPage';
import CostWizardPage from '@/pages/CostWizardPage';
import TestCostFactorsPage from '@/pages/TestCostFactorsPage';
import MatrixExplorerPage from '@/pages/matrix';
import DiagnosticPage from '@/pages/diagnostic';
import { ProtectedRoute } from '@/lib/protected-route';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <Router />
          <Toaster />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <ProtectedRoute path="/" component={() => (
        <DashboardLayout>
          <HomePage />
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/dashboards" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Dashboards</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Dashboards coming soon...</p>
          </div>
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/properties" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Properties</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Property management coming soon...</p>
          </div>
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
      
      <ProtectedRoute path="/cost-calculator" component={() => (
        <DashboardLayout>
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Cost Calculator</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Cost calculator coming soon...</p>
          </div>
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
          <h1 className="text-2xl font-bold text-blue-100 mb-6">Settings</h1>
          <div className="bg-blue-900/30 p-8 rounded-lg border border-blue-800/40">
            <p className="text-blue-300">Settings coming soon...</p>
          </div>
        </DashboardLayout>
      )} />
      
      <ProtectedRoute path="/diagnostic" component={() => (
        <DashboardLayout>
          <DiagnosticPage />
        </DashboardLayout>
      )} />
      
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;