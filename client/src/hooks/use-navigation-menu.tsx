import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';

interface NavigationMenuContextType {
  activeMenu: string | null;
  toggleMenu: (menuName: string) => void;
  setMenu: (menuName: string | null) => void;
  closeAllMenus: () => void;
}

const NavigationMenuContext = createContext<NavigationMenuContextType | undefined>(undefined);

export function NavigationMenuProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when location changes
  useEffect(() => {
    closeAllMenus();
  }, [location]);

  // Handle outside clicks to close dropdown menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle a menu open/closed
  const toggleMenu = (menuName: string) => {
    setActiveMenu(prevMenu => prevMenu === menuName ? null : menuName);
  };
  
  // Directly set active menu (for direct navigation)
  const setMenu = (menuName: string | null) => {
    setActiveMenu(menuName);
  };
  
  // Close all menus
  const closeAllMenus = () => {
    setActiveMenu(null);
  };

  return (
    <NavigationMenuContext.Provider value={{ 
      activeMenu, 
      toggleMenu, 
      setMenu, 
      closeAllMenus 
    }}>
      <div ref={menuRef}>
        {children}
      </div>
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