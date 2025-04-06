import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  isPinned: boolean;
  toggleExpanded: () => void;
  togglePinned: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isExpanded: true,
  isPinned: true,
  toggleExpanded: () => {},
  togglePinned: () => {},
  expandSidebar: () => {},
  collapseSidebar: () => {},
  toggleSidebar: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  // Default to expanded on larger screens, collapsed on mobile
  const [isExpanded, setIsExpanded] = useState(window.innerWidth > 768);
  const [isPinned, setIsPinned] = useState(window.innerWidth > 1024);
  const [autoCollapseTimeoutId, setAutoCollapseTimeoutId] = useState<number | null>(null);
  
  // Handle window resize events
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && isExpanded && !isPinned) {
        setIsExpanded(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded, isPinned]);
  
  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };
  
  const togglePinned = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    
    // If unpinning, start the auto-collapse timer
    if (!newPinned && isExpanded) {
      startAutoCollapseTimer();
    }
    
    // If pinning, cancel any pending auto-collapse
    if (newPinned && autoCollapseTimeoutId) {
      cancelAutoCollapseTimer();
    }
  };
  
  const expandSidebar = () => {
    // Only expand if not already expanded
    if (!isExpanded) {
      setIsExpanded(true);
      
      // If not pinned, start auto-collapse timer
      if (!isPinned) {
        startAutoCollapseTimer();
      }
    } else if (!isPinned) {
      // If already expanded but not pinned, reset the auto-collapse timer
      restartAutoCollapseTimer();
    }
  };
  
  const collapseSidebar = () => {
    // Only collapse if not pinned
    if (!isPinned) {
      setIsExpanded(false);
    }
  };
  
  const startAutoCollapseTimer = () => {
    // Cancel any existing timer first
    cancelAutoCollapseTimer();
    
    // Set a new timer
    const timeoutId = window.setTimeout(() => {
      if (!isPinned) {
        setIsExpanded(false);
      }
    }, 3000); // Auto-collapse after 3 seconds of inactivity
    
    setAutoCollapseTimeoutId(timeoutId);
  };
  
  const restartAutoCollapseTimer = () => {
    startAutoCollapseTimer();
  };
  
  const cancelAutoCollapseTimer = () => {
    if (autoCollapseTimeoutId) {
      window.clearTimeout(autoCollapseTimeoutId);
      setAutoCollapseTimeoutId(null);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCollapseTimeoutId) {
        window.clearTimeout(autoCollapseTimeoutId);
      }
    };
  }, [autoCollapseTimeoutId]);
  
  // Create a toggleSidebar function
  const toggleSidebar = () => {
    setIsExpanded(prev => !prev);
    if (!isExpanded && !isPinned) {
      // If we're expanding and not pinned, start auto-collapse timer
      startAutoCollapseTimer();
    }
  };

  const contextValue = {
    isExpanded,
    isPinned,
    toggleExpanded,
    togglePinned,
    expandSidebar,
    collapseSidebar,
    toggleSidebar,
  };
  
  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;