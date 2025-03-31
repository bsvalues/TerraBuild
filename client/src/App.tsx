import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import CalculatorPage from "@/pages/calculator-page";
import UsersPage from "@/pages/users-page";
import AuthPage from "@/pages/auth-page";
import AIToolsPage from "@/pages/AIToolsPage";
import ARVisualizationPage from "@/pages/ARVisualizationPage";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { useAutoLoginClient } from "./hooks/use-auto-login-client";

// Add link to Remix Icon for icons
const RemixIconLink = () => (
  <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
);

// Wrapper component to handle auto-login
const AutoLoginHandler = ({ children }: { children: React.ReactNode }) => {
  useAutoLoginClient();
  return <>{children}</>;
};

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/calculator" component={CalculatorPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/ai-tools" component={AIToolsPage} />
      <ProtectedRoute path="/ar-visualization" component={ARVisualizationPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AutoLoginHandler>
          <RemixIconLink />
          <Router />
          <Toaster />
        </AutoLoginHandler>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
