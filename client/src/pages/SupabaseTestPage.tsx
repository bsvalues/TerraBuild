import React, { useState, useEffect, FC } from 'react';
import { useSupabase } from '@/components/supabase/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SupabaseTestPage: React.FC = () => {
  const { supabase, isConfigured, checkConnection, connectionStatus } = useSupabase();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initial connection check
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    setTables([]);
    
    try {
      // First check if we can ping Supabase
      const isConnected = await checkConnection();
      
      if (!isConnected) {
        setTestResult({
          success: false,
          message: 'Could not connect to Supabase. Check your network connection and credentials.'
        });
        setLoading(false);
        return;
      }
      
      // Try a different approach - check which tables exist in the schema
      try {
        // This query lists all tables in the public schema
        const { data, error } = await supabase
          .rpc('list_tables')
          .select();
          
        if (!error && data) {
          setTables(data.map((t: any) => t.table_name));
          setTestResult({
            success: true,
            message: `Connection successful. Found ${data.length} tables in the database.`
          });
        } else {
          // If RPC method doesn't exist, fallback to basic query
          await testBasicConnection();
        }
      } catch (err) {
        // Fallback to basic connection test
        await testBasicConnection();
      }
    } catch (err) {
      console.error('Error testing connection:', err);
      setTestResult({
        success: false,
        message: `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const testBasicConnection = async () => {
    try {
      // Try to fetch some data - check for any table that should exist
      const { data: costData, error: costError } = await supabase
        .from('cost_matrix')
        .select('count', { count: 'exact', head: true });
      
      // If cost_matrix query fails, try the users table as fallback
      if (costError) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('count', { count: 'exact', head: true });
          
        if (!userError) {
          // We could connect successfully to users table
          setTestResult({
            success: true,
            message: 'Successfully connected to Supabase and found users table!'
          });
          return;
        } else {
          // Both queries failed, try properties table as last resort
          const { data: propData, error: propError } = await supabase
            .from('properties')
            .select('count', { count: 'exact', head: true });
            
          if (!propError) {
            setTestResult({
              success: true,
              message: 'Successfully connected to Supabase and found properties table!'
            });
            return;
          } else {
            // All queries failed
            setTestResult({
              success: false,
              message: `Connection established but all table queries failed. Database may be empty.`
            });
            return;
          }
        }
      } else {
        // Cost matrix query succeeded
        setTestResult({
          success: true,
          message: 'Successfully connected to Supabase and found cost_matrix table!'
        });
        return;
      }
    } catch (err) {
      console.error('Basic connection test error:', err);
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
            <Badge variant={isConfigured ? "default" : "danger"}>
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
                    'danger'
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
                <p className="text-sm truncate">{window.location.hostname.includes('replit') ? '[Protected in UI]' : 'Supabase URL (hidden)'}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200">
              <h3 className="text-sm font-semibold mb-2">Configuration Status</h3>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt>Environment Variables:</dt>
                <dd>{isConfigured ? '✓ Present' : '✗ Missing'}</dd>
                
                <dt>Client Connection:</dt>
                <dd className={connectionStatus === 'connected' ? 'text-green-600' : 'text-amber-600'}>
                  {connectionStatus === 'connected' ? '✓ Connected' : '⚠ Limited'}
                </dd>
                
                <dt>Fallback Values:</dt>
                <dd>✓ Available</dd>
                
                <dt>Auth Service:</dt>
                <dd>{testResult?.success ? '✓ Working' : '⚠ Limited'}</dd>
              </dl>
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