import React from "react";

export interface MainContentProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actionButton?: {
    label: string;
    icon: string;
    onClick: () => void;
  };
}

export default function MainContent({ title, subtitle, children, actionButton }: MainContentProps) {
  return (
    <main className="flex-1 overflow-y-auto bg-neutral-100">
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-600">{title}</h1>
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="flex items-center text-sm text-neutral-500 hover:text-primary"
              onClick={() => window.location.reload()}
            >
              <i className="ri-refresh-line mr-1"></i> Refresh
            </button>
            {actionButton && (
              <button 
                className="flex items-center text-sm bg-primary text-white rounded-md px-3 py-1.5 hover:bg-primary-dark"
                onClick={actionButton.onClick}
              >
                <i className={`${actionButton.icon} mr-1`}></i> {actionButton.label}
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="p-6">
        {children}
      </div>
    </main>
  );
}
