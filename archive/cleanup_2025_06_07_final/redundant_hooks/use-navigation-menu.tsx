import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

interface NavigationMenuContextType {
  activeMenu: string | null;
  toggleMenu: (menuName: string) => void;
  setMenu: (menuName: string | null) => void;
  closeAllMenus: () => void;
  isMenuOpen: (menuName: string) => boolean;
}

const NavigationMenuContext = createContext<NavigationMenuContextType | undefined>(undefined);

export function NavigationMenuProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [location] = useLocation();

  // Close menus on navigation
  useEffect(() => {
    closeAllMenus();
  }, [location]);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(prevMenu => prevMenu === menuName ? null : menuName);
  };

  const setMenu = (menuName: string | null) => {
    setActiveMenu(menuName);
  };

  const closeAllMenus = () => {
    setActiveMenu(null);
  };

  const isMenuOpen = (menuName: string) => {
    return activeMenu === menuName;
  };

  return (
    <NavigationMenuContext.Provider value={{ 
      activeMenu, 
      toggleMenu, 
      setMenu, 
      closeAllMenus,
      isMenuOpen 
    }}>
      {children}
    </NavigationMenuContext.Provider>
  );
}

export function useNavigationMenu() {
  const context = useContext(NavigationMenuContext);
  
  if (context === undefined) {
    throw new Error('useNavigationMenu must be used within a NavigationMenuProvider');
  }
  
  return context;
}