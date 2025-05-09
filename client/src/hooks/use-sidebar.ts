import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isExpanded: boolean;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: true,
      toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
      expand: () => set({ isExpanded: true }),
      collapse: () => set({ isExpanded: false }),
    }),
    {
      name: 'terrafusion-sidebar-state',
    }
  )
);