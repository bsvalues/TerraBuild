import React from 'react';
import { Link } from 'wouter';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TerraFusionLogo from '@/components/TerraFusionLogo';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <TerraFusionLogo variant="default" size="lg" className="mx-auto mb-6" />
        
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping"></div>
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-blue-900 border border-blue-800">
            <AlertTriangle className="h-12 w-12 text-cyan-400" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-blue-100 mb-3">404</h1>
        <h2 className="text-2xl font-semibold text-blue-200 mb-4">Page Not Found</h2>
        
        <p className="mb-8 text-blue-300 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Please check the URL or return to the home page.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white w-full sm:w-auto">
              <Home className="mr-2 h-5 w-5" />
              Go to Home
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.history.back()}
            className="border-blue-700 text-blue-300 hover:bg-blue-900/50 w-full sm:w-auto"
          >
            Go Back
          </Button>
        </div>
      </div>
      
      <div className="mt-16 text-blue-400 text-sm">
        <p>© 2025 TerraFusion Analytics. All rights reserved.</p>
      </div>
    </div>
  );
};

export default NotFoundPage;