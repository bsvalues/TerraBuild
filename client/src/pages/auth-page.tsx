import React, { useState } from 'react';
import { Redirect } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerraFusionLogo from '@/components/TerraFusionLogo';
import { useAuth } from '@/contexts/auth-context';
import { Building2, BarChart2, Map, Database } from 'lucide-react';
import LoginForm from '@/components/auth/login-form';
import RegisterForm from '@/components/auth/register-form';

const AuthPage = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');

  // Redirect if user is already logged in
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-blue-950 to-blue-900">
      {/* Left column - Auth forms */}
      <div className="w-full md:w-1/2 px-4 lg:px-8 xl:px-12 py-10 flex flex-col justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <TerraFusionLogo variant="default" size="lg" className="mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-blue-100">Welcome to TerraFusion Build</h1>
            <p className="text-blue-300 mt-2">Advanced geospatial property valuation platform</p>
          </div>
          
          <Tabs 
            defaultValue="login" 
            value={activeTab}
            onValueChange={setActiveTab} 
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-8 w-full">
              <TabsTrigger value="login" className="text-base py-3">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="text-base py-3">
                Create Account
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="mt-0">
              <LoginForm onSuccess={() => {}} onRegisterClick={() => setActiveTab('register')} />
            </TabsContent>
            
            <TabsContent value="register" className="mt-0">
              <RegisterForm onSuccess={() => {}} onLoginClick={() => setActiveTab('login')} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Right column - Hero */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-900 to-blue-950 border-l border-blue-800/40 relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute h-[500px] w-[800px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-10">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-400 via-cyan-700/30 to-transparent"></div>
          </div>
          <div className="absolute inset-0 bg-blue-950/30"></div>
        </div>
        
        <div className="relative flex flex-col items-center justify-center w-full z-10 px-8">
          <h2 className="text-3xl font-bold mb-8 text-blue-100 text-center">
            Powerful Property Valuation & Analysis
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div className="bg-blue-900/30 border border-blue-800/40 p-6 rounded-lg flex">
              <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-700/20 border border-cyan-400/20">
                <Building2 className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-100 mb-1">Precision Valuations</h3>
                <p className="text-sm text-blue-300">AI-powered property assessment with statistical validity</p>
              </div>
            </div>
            
            <div className="bg-blue-900/30 border border-blue-800/40 p-6 rounded-lg flex">
              <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-700/20 border border-cyan-400/20">
                <Map className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-100 mb-1">Geospatial Intelligence</h3>
                <p className="text-sm text-blue-300">Dynamic 3D visualizations and regional analysis</p>
              </div>
            </div>
            
            <div className="bg-blue-900/30 border border-blue-800/40 p-6 rounded-lg flex">
              <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-700/20 border border-cyan-400/20">
                <BarChart2 className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-100 mb-1">Advanced Analytics</h3>
                <p className="text-sm text-blue-300">Comprehensive data insights and trend forecasting</p>
              </div>
            </div>
            
            <div className="bg-blue-900/30 border border-blue-800/40 p-6 rounded-lg flex">
              <div className="mr-4 p-3 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-700/20 border border-cyan-400/20">
                <Database className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-100 mb-1">Integrated Data</h3>
                <p className="text-sm text-blue-300">Unified property records and cost matrices</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-blue-200 font-medium">Trusted by assessors and municipal offices nationwide</p>
            <div className="mt-4 flex justify-center space-x-8">
              <div className="text-blue-400/50">County Logo</div>
              <div className="text-blue-400/50">County Logo</div>
              <div className="text-blue-400/50">County Logo</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;