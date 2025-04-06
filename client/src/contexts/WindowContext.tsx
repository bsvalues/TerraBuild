import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type WindowState = {
  id: string;
  title: string;
  route: string;
  content: string;
  isDetached: boolean;
};

interface WindowContextType {
  detachedWindows: Record<string, WindowState>;
  detachWindow: (windowConfig: Omit<WindowState, 'isDetached'>) => void;
  attachWindow: (windowId: string) => void;
  isDetached: (windowId: string) => boolean;
}

const WindowContext = createContext<WindowContextType>({
  detachedWindows: {},
  detachWindow: () => {},
  attachWindow: () => {},
  isDetached: () => false,
});

export const useWindow = () => useContext(WindowContext);

interface WindowProviderProps {
  children: ReactNode;
}

export const WindowProvider: React.FC<WindowProviderProps> = ({ children }) => {
  const [detachedWindows, setDetachedWindows] = useState<Record<string, WindowState>>({});
  const [popupWindows, setPopupWindows] = useState<Record<string, Window | null>>({});
  
  // Clean up any pop-up windows when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(popupWindows).forEach(win => {
        if (win && !win.closed) {
          win.close();
        }
      });
    };
  }, [popupWindows]);
  
  // Detect when popup windows are closed and update state
  useEffect(() => {
    const checkWindows = setInterval(() => {
      let hasChanges = false;
      
      Object.entries(popupWindows).forEach(([id, win]) => {
        if (win && win.closed) {
          setPopupWindows(prev => {
            const newWindows = { ...prev };
            delete newWindows[id];
            return newWindows;
          });
          
          setDetachedWindows(prev => {
            const newDetached = { ...prev };
            delete newDetached[id];
            return newDetached;
          });
          
          hasChanges = true;
        }
      });
      
      if (!hasChanges && Object.keys(popupWindows).length === 0) {
        clearInterval(checkWindows);
      }
    }, 500);
    
    return () => clearInterval(checkWindows);
  }, [popupWindows]);
  
  const detachWindow = (windowConfig: Omit<WindowState, 'isDetached'>) => {
    const { id, title, route, content } = windowConfig;
    
    // Don't create a new window if one with this ID already exists
    if (popupWindows[id] && !popupWindows[id]?.closed) {
      popupWindows[id]?.focus();
      return;
    }
    
    // Create the new window
    const popupWidth = 800;
    const popupHeight = 600;
    const left = window.screenX + (window.outerWidth - popupWidth) / 2;
    const top = window.screenY + (window.outerHeight - popupHeight) / 2;
    
    const newWindow = window.open(
      '',
      id,
      `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable,scrollbars=yes,status=1`
    );
    
    if (!newWindow) {
      console.error('Failed to open popup window - it may have been blocked by a popup blocker');
      return;
    }
    
    // Update state
    setPopupWindows(prev => ({ ...prev, [id]: newWindow }));
    setDetachedWindows(prev => ({
      ...prev,
      [id]: { id, title, route, content, isDetached: true }
    }));
    
    // Set up the new window's content
    newWindow.document.title = `${title} - Benton County Building Cost System`;
    
    // Apply styles and content
    newWindow.document.body.innerHTML = `
      <style>
        body { 
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
          margin: 0;
          padding: 0;
          background: #f0f4f7;
          color: #243E4D;
        }
        .detached-window-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #243E4D;
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .detached-window-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }
        .detached-window-content {
          padding: 1.5rem;
          height: calc(100vh - 3.5rem);
          overflow: auto;
        }
        .loading-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
        }
        .loading-placeholder h3 {
          color: #243E4D;
          margin-bottom: 0.5rem;
        }
        .loading-placeholder p {
          color: #6b7280;
        }
        .gradient-line {
          height: 2px;
          width: 100%;
          background: linear-gradient(to right, #243E4D, #29B7D3, #3CAB36);
          opacity: 0.8;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      </style>
      <div class="detached-window-header">
        <h1 class="detached-window-title">${title}</h1>
      </div>
      <div class="gradient-line"></div>
      <div class="detached-window-content fadeIn">
        ${content}
      </div>
    `;
    
    // Clean up when this window is closed
    newWindow.addEventListener('beforeunload', () => {
      attachWindow(id);
    });
  };
  
  const attachWindow = (windowId: string) => {
    setDetachedWindows(prev => {
      const newDetached = { ...prev };
      delete newDetached[windowId];
      return newDetached;
    });
    
    setPopupWindows(prev => {
      const newWindows = { ...prev };
      if (newWindows[windowId] && !newWindows[windowId]?.closed) {
        newWindows[windowId]?.close();
      }
      delete newWindows[windowId];
      return newWindows;
    });
  };
  
  const isDetached = (windowId: string) => {
    return !!detachedWindows[windowId];
  };
  
  const contextValue = {
    detachedWindows,
    detachWindow,
    attachWindow,
    isDetached,
  };
  
  return (
    <WindowContext.Provider value={contextValue}>
      {children}
    </WindowContext.Provider>
  );
};

export default WindowContext;