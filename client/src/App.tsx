import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import AuthPage from "@/pages/auth-page";
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
