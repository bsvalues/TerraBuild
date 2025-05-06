import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { CountyNetworkAuth } from "@/components/auth/county-network-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { APP_NAME } from "@/data/constants";

// Import Benton County logo directly
import bentonSeal from '@assets/BC.png';
import bentonScenicLogo from '@assets/ogimage.jpg';

export default function AuthPage() {
  const { user, isLoading } = useAuth();

  // If user is already logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Auth Form */}
      <div className="flex flex-col w-full md:w-1/2 p-8 justify-center">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex justify-center mb-6">
            <img 
              src={bentonSeal} 
              alt="Benton County Seal" 
              className="h-20 w-20"
            />
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-[#243E4D]">{APP_NAME}</h1>
            <h2 className="text-xl font-medium text-[#47AD55] mt-1">Benton County, Washington</h2>
            <p className="text-muted-foreground mt-2">
              Sign in using your county network credentials
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>County Network Authentication</CardTitle>
              <CardDescription>
                Sign in with your Benton County network credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CountyNetworkAuth />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hidden md:block w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: `url(${bentonScenicLogo})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div 
          className="absolute inset-0 bg-gradient-to-r from-primary/90 to-transparent flex flex-col justify-center p-12"
        >
          <div className="max-w-lg text-white">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Building Cost Estimation Tool</h1>
              <h2 className="text-2xl font-semibold text-white/80">Benton County, Washington</h2>
            </div>
            <p className="text-xl mb-6 text-white/90">
              A comprehensive solution for accurately estimating construction costs
              across different regions and building types within Benton County.
            </p>
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h3 className="font-semibold text-lg">Accurate Cost Estimations</h3>
                <p className="text-white/80">
                  Leverage regional cost factors and building type classifications
                  for precise cost assessments.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h3 className="font-semibold text-lg">Secure County Access</h3>
                <p className="text-white/80">
                  Authenticate securely through the county network to ensure data
                  integrity and compliance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}