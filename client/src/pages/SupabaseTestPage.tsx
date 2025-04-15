import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/components/supabase/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

const SupabaseTestPage: React.FC = () => {
  const { supabase, isConfigured, checkConnection, connectionStatus } = useSupabase();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial connection check
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      // First check if we can ping Supabase
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        setTestResult({
          success: false,
          message: 'Could not connect to Supabase. Check your network connection and credentials.'
        });
        return;
      }
      
      // Try to fetch some data - check for any table that should exist
      const { data, error } = await supabase
        .from('cost_matrix')
        .select('count', { count: 'exact', head: true })
        
      // If error is relation doesn't exist, try another core table
      if (error && error.message && error.message.includes('relation "cost_matrix" does not exist')) {
        // Try the users table as fallback
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });
          
        if (!userError) {
          // We could connect successfully to another table
          return { data: userData, error: null };
        }
      }
      
      if (error) {
        setTestResult({
          success: false,
          message: `Connection established but query failed: ${error.message}`
        });
      } else {
        setTestResult({
          success: true,
          message: 'Successfully connected to Supabase and executed a test query!'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: `Error: ${err instanceof Error ? err.message : String(err)}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Supabase Connection Test
            <Badge variant={isConfigured ? "default" : "destructive"}>
              {isConfigured ? "Configured" : "Not Configured"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Verify your Supabase connection and database access
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Connection Status:</p>
                <Badge 
                  variant={
                    connectionStatus === 'connected' ? 'success' : 
                    connectionStatus === 'connecting' ? 'warning' :
                    'destructive'
                  }
                  className="flex items-center gap-1"
                >
                  {connectionStatus === 'connected' ? (
                    <><CheckCircle size={14} /> Connected</>
                  ) : connectionStatus === 'connecting' ? (
                    <><RefreshCw size={14} className="animate-spin" /> Connecting</>
                  ) : (
                    <><AlertCircle size={14} /> {connectionStatus === 'unconfigured' ? 'Not Configured' : 'Error'}</>
                  )}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">API Endpoint:</p>
                <p className="text-sm truncate">{supabase.supabaseUrl || 'Not available'}</p>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 rounded-md ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">
                      {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                    </p>
                    <p className="text-sm mt-1">
                      {testResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            onClick={handleTestConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupabaseTestPage;