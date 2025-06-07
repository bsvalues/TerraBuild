import { createContext, useContext } from 'react';
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

// Create a fallback context for when useAuth is called outside of AuthProvider
// This helps prevent the app from crashing, but will show a warning
const FallbackAuthContext = createContext({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  loginMutation: {
    mutate: () => console.warn("Login not available in fallback context"),
    isPending: false,
    isError: false,
    error: null,
  },
  logoutMutation: {
    mutate: () => console.warn("Logout not available in fallback context"),
    isPending: false,
    isError: false,
    error: null,
  },
  registerMutation: {
    mutate: () => console.warn("Register not available in fallback context"),
    isPending: false,
    isError: false,
    error: null, 
  },
});

export function useAuth() {
  try {
    // Try to use the real auth context
    const auth = useAuthContext();
    return {
      user: auth.user,
      isLoading: auth.isLoading,
      isAuthenticated: !!auth.user,
      error: auth.error,
      loginMutation: auth.loginMutation,
      logoutMutation: auth.logoutMutation,
      registerMutation: auth.registerMutation
    };
  } catch (error) {
    // If we get here, it means useAuth was called outside AuthProvider
    console.warn("useAuth was called outside of AuthProvider - using fallback values");
    return useContext(FallbackAuthContext);
  }
}