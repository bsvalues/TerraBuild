import React, { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./header";
import { useAuth } from "@/contexts/auth-context";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-8 bg-card rounded-lg shadow-lg flex flex-col items-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-primary-foreground font-medium">
            Loading TerraBuild...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div 
        className={cn(
          "h-screen transition-all duration-300 ease-in-out bg-card border-r",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <Sidebar 
          isCollapsed={!isSidebarOpen} 
          onToggle={toggleSidebar} 
          user={user}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <Header user={user} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <ScrollArea className="flex-1 p-6">
          <main className="container mx-auto max-w-7xl">
            {children}
          </main>
        </ScrollArea>
        
        <footer className="p-4 border-t bg-card text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Benton County, Washington. All rights reserved.</p>
          <p className="text-xs mt-1">TerraBuild Building Cost Assessment System v1.0</p>
        </footer>
      </div>
    </div>
  );
}