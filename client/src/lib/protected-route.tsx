import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-950 to-blue-900">
          <div className="p-8 rounded-lg flex flex-col items-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-700/40 flex items-center justify-center border border-cyan-500/30 shadow-glow">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
            <p className="text-blue-100 font-medium mt-4">Loading...</p>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}