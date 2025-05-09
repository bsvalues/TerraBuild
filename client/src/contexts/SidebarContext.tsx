import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Define the shape of our sidebar context
type SidebarContextType = {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
};

// Create the context with a default value
const SidebarContext = createContext<SidebarContextType | null>(null);

// Create the provider component
export function SidebarProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available, otherwise default to expanded
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    const savedState = typeof window !== 'undefined' ? localStorage.getItem('sidebar-expanded') : null;
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  // Persist state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-expanded', JSON.stringify(isExpanded));
    }
  }, [isExpanded]);

  // Toggle sidebar state
  const toggle = () => setIsExpanded(prev => !prev);
  
  // Explicitly expand sidebar
  const expand = () => setIsExpanded(true);
  
  // Explicitly collapse sidebar
  const collapse = () => setIsExpanded(false);

  return (
    <SidebarContext.Provider value={{ isExpanded, toggle, expand, collapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Custom hook to use the sidebar context
export function useSidebar() {
  const context = useContext(SidebarContext);
  
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  
  return context;
}