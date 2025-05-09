import React, { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/auth-context';
import { SidebarProvider } from '@/contexts/SidebarContext';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <AuthProvider>
      <SidebarProvider>
        {children}
      </SidebarProvider>
    </AuthProvider>
  );
}