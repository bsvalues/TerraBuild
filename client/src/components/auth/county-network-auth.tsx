import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Building } from 'lucide-react';

/**
 * County Network Authentication Component
 * 
 * This component provides authentication for users on the county network
 * using their network credentials.
 */
export function CountyNetworkAuth() {
  const { login, isLoading } = useAuth();
  const [networkStatus, setNetworkStatus] = useState<{
    checking: boolean;
    onNetwork: boolean;
  }>({ checking: true, onNetwork: false });
  const [error, setError] = useState<string | null>(null);

  // Check if user is on county network
  useEffect(() => {
    async function checkCountyNetwork() {
      try {
        const response = await fetch('/api/county-network-status');
        const data = await response.json();
        setNetworkStatus({
          checking: false,
          onNetwork: data.onCountyNetwork
        });
      } catch (err) {
        console.error('Error checking county network status:', err);
        setNetworkStatus({
          checking: false,
          onNetwork: false
        });
      }
    }

    checkCountyNetwork();
  }, []);

  // Function to handle county network login
  const handleCountyNetworkLogin = async () => {
    try {
      setError(null);
      
      // In a real implementation, this would use the network credentials
      // For now in development, we'll just authenticate with default credentials
      const username = 'county.user';
      const password = 'county-network-password';
      
      await login(username, password);
    } catch (err) {
      setError('County network authentication failed. Please try again or contact IT support.');
      console.error('County network login error:', err);
    }
  };

  if (networkStatus.checking) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>County Network Authentication</CardTitle>
          <CardDescription>Checking network status...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!networkStatus.onNetwork) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>County Network Authentication</CardTitle>
          <CardDescription>Network authentication unavailable</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Not on County Network</AlertTitle>
            <AlertDescription>
              You are not currently on the Benton County network. Please connect to the county network or use standard login credentials.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>County Network Authentication</CardTitle>
        <CardDescription>
          You are connected to the Benton County network.
          Sign in using your network credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Authentication Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-center p-4">
          <Building className="h-16 w-16 text-primary mb-2" />
        </div>
        <p className="text-center text-sm text-muted-foreground mb-4">
          Network authentication provides secure access using your County network identity.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleCountyNetworkLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>Sign in with County Network</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Integrated Authentication Component
 * 
 * This component provides both standard authentication and county network authentication
 * options in a tabbed interface.
 */
export function IntegratedAuthComponent({ 
  standardAuthComponent 
}: { 
  standardAuthComponent: React.ReactNode 
}) {
  return (
    <Tabs defaultValue="standard" className="w-full max-w-md mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="standard">Standard Login</TabsTrigger>
        <TabsTrigger value="county">County Network</TabsTrigger>
      </TabsList>
      <TabsContent value="standard">
        {standardAuthComponent}
      </TabsContent>
      <TabsContent value="county">
        <CountyNetworkAuth />
      </TabsContent>
    </Tabs>
  );
}