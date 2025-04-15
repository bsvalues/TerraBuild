import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { queryClient } from "@/lib/queryClient";

/**
 * Hook for auto-login functionality in development mode
 * 
 * DEVELOPMENT MODE: Authentication is completely disabled
 * This hook simply acts as if the user is already logged in with admin privileges
 */
export function useAutoLoginClient() {
  // Keep the same hooks and order as the original implementation
  const auth = useAuth();
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Safely access auth properties
    if (!auth) {
      return;
    }
    
    const { user, isLoading } = auth;
    
    // Function to handle auto-login
    const handleAutoLogin = () => {
      try {
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
      } catch (err) {
        // Handle any errors that might occur
        console.error("Error in auto-login:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };
    
    // Execute auto-login with error handling
    handleAutoLogin();
    
  }, [auth, autoLoginChecked]);

  return { autoLoginChecked, error };
}