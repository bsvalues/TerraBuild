import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";

/**
 * Hook for auto-login functionality in development mode
 * 
 * DEVELOPMENT MODE: Authentication is completely disabled
 * This hook simply acts as if the user is already logged in with admin privileges
 */
export function useAutoLoginClient() {
  // Keep the same hooks and order as the original implementation
  const { user, isLoading } = useAuth();
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);

  useEffect(() => {
    // Skip if we're already logged in or still loading auth status
    if (user || isLoading || autoLoginChecked) {
      return;
    }
    
    // Use the same mock admin user as on the server
    const adminUser = {
      id: 1,
      username: "admin",
      password: "password", // Not actual password, just for display
      role: "admin",
      name: "Admin User",
      isActive: true
    };
    
    // Set the user data directly in the query cache
    queryClient.setQueryData(["/api/user"], adminUser);
    
    console.log("DEVELOPMENT MODE: Auto-login complete with mock admin user");
    
    // Mark as checked to prevent further attempts
    setAutoLoginChecked(true);
  }, [user, isLoading, autoLoginChecked]);

  return { autoLoginChecked };
}