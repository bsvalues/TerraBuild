import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

/**
 * Hook for auto-login functionality
 * This hook will attempt to auto-login the user if:
 * 1. Auto-login is enabled in the settings
 * 2. There is a valid auth token
 * 3. The user is not already logged in
 */
export function useAutoLoginClient() {
  const { user, isLoading } = useAuth();
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);

  useEffect(() => {
    const checkAndLogin = async () => {
      // Skip if we're already logged in or still loading auth status
      if (user || isLoading || autoLoginChecked) {
        return;
      }

      try {
        // Check if auto-login is enabled
        const response = await fetch("/api/auth/autologin");
        const data = await response.json();
        
        if (data.enabled && data.token) {
          // Attempt auto-login
          await apiRequest("POST", "/api/auth/autologin", { token: data.token });
          
          // Mark as checked to prevent further attempts
          setAutoLoginChecked(true);
        } else {
          // Auto-login not enabled, mark as checked
          setAutoLoginChecked(true);
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
        setAutoLoginChecked(true);
      }
    };

    checkAndLogin();
  }, [user, isLoading, autoLoginChecked]);

  return { autoLoginChecked };
}