import { useState, useEffect } from 'react';

const STORAGE_KEY = 'terrafusion-sidebar-state';

export function useSidebarState() {
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      return savedState ? JSON.parse(savedState).isExpanded : true;
    } catch (error) {
      return true;
    }
  });

  const toggle = () => {
    setIsExpanded((prev: boolean) => !prev);
  };

  const expand = () => {
    setIsExpanded(true);
  };

  const collapse = () => {
    setIsExpanded(false);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isExpanded }));
  }, [isExpanded]);

  return { isExpanded, toggle, expand, collapse };
}