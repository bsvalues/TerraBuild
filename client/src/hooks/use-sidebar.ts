import { useState, useEffect, useCallback, createContext, useContext } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

const STORAGE_KEY = 'terrafusion-sidebar-state';

const defaultState = {
  isExpanded: true,
  toggle: () => {},
  expand: () => {},
  collapse: () => {}
};

const SidebarContext = createContext<SidebarContextType>(defaultState);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      return savedState ? JSON.parse(savedState).isExpanded : true;
    } catch (error) {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isExpanded }));
  }, [isExpanded]);

  const value = { isExpanded, toggle, expand, collapse };
  
  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);