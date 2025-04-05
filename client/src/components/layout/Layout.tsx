import React from 'react';
import Topbar from './Topbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Topbar />
      <main className="flex-1 py-8">
        {children}
      </main>
      <footer className="bg-white border-t py-6 px-4">
        <div className="container mx-auto">
          <div className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Benton County Washington Building Cost Assessment System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;