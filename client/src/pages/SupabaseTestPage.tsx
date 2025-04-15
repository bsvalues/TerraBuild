import React, { useState, useEffect, FC } from 'react';
import { useSupabase } from '@/components/supabase/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Database, Server, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

interface RpcResult {
  name: string;
  success: boolean;
  error?: string;
  responsePreview?: string;
}

const SupabaseTestPage: React.FC = () => {
  const { 
    supabase, 
    isConfigured, 
    checkConnection, 
    connectionStatus, 
    diagnostics,
    serviceStatus,
    verifyServices
  } = useSupabase();
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<string[]>(serviceStatus?.tables || []);
  const [rpcResults, setRpcResults] = useState<RpcResult[]>([]);
  const [activeTab, setActiveTab] = useState('connection');
  const [tableDetails, setTableDetails] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    // Initial connection check
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    setTables([]);
    setRpcResults([]);
    setTableDetails({});
    
    try {
      // Use our enhanced service verification to get precise diagnostics
      const services = await verifyServices();
      
      // Update tables with verified tables from service check
      if (services.tables && services.tables.length > 0) {
        setTables(services.tables);
      }
      
      // First check if we can ping Supabase
      const isConnected = await checkConnection();
      
      if (!isConnected && !services.auth) {
        setTestResult({
          success: false,
          message: 'Could not connect to Supabase. Check your network connection and credentials.'
        });
        setLoading(false);
        return;
      }
      
      // If we have at least partial connectivity, show that in the result
      if (!isConnected && services.auth) {
        setTestResult({
          success: true,
          message: 'Partial connection to Supabase detected. Some services are available.'
        });
      }
      
      // Try a different approach - check which tables exist in the schema
      try {
        // First try direct metadata query instead of RPC
        const { data: tableData, error: tableError } = await supabase
          .from('cost_matrix')
          .select('count', { count: 'exact', head: true });
        
        if (!tableError) {
          // We could connect to cost_matrix table
          setTestResult({
            success: true,
            message: 'Successfully connected to Supabase and verified cost_matrix table!'
          });
          setTables(['cost_matrix']);
          
          // Try to get more tables to populate the list
          await getAvailableTables();
          
          // Test RPC functions if connection succeeded
          await testRpcFunctions();
          
          // Get table details
          await getTableDetails();
        } else {
          // Fallback to basic connection test
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

  const testRpcFunctions = async () => {
    try {
      // List of common RPC functions to test
      const rpcFunctions = [
        'get_cost_factors',
        'get_properties',
        'get_building_types',
        'get_regions',
        'get_cost_matrix',
        'get_user_settings'
      ];
      
      const results: RpcResult[] = [];
      
      for (const funcName of rpcFunctions) {
        try {
          const { data, error } = await supabase.rpc(funcName);
          
          if (!error) {
            // We found a working RPC function
            results.push({
              name: funcName,
              success: true,
              responsePreview: JSON.stringify(data).substring(0, 100) + '...'
            });
          } else {
            results.push({
              name: funcName,
              success: false,
              error: error.message
            });
          }
        } catch (funcError) {
          results.push({
            name: funcName,
            success: false,
            error: funcError instanceof Error ? funcError.message : String(funcError)
          });
        }
      }
      
      setRpcResults(results);
      
      // Update the overall test result if we have successful RPC calls
      const successfulRpcs = results.filter(r => r.success);
      if (successfulRpcs.length > 0) {
        setTestResult(prev => {
          if (!prev) return { 
            success: true, 
            message: `Successfully called ${successfulRpcs.length} of ${rpcFunctions.length} RPC functions.`
          };
          return { 
            success: true, 
            message: `${prev.message}\nSuccessfully called ${successfulRpcs.length} of ${rpcFunctions.length} RPC functions.`
          };
        });
      }
    } catch (err) {
      console.error('RPC test error:', err);
    }
  };

  const getTableDetails = async () => {
    const details: Record<string, any> = {};
    
    // Get row counts for each table
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (!error) {
          details[table] = { count, error: null };
          
          // Get first 2 rows for sample data if available
          try {
            const { data: sampleData, error: sampleError } = await supabase
              .from(table)
              .select('*')
              .limit(2);
              
            if (!sampleError && sampleData && sampleData.length > 0) {
              details[table].sample = sampleData;
            }
          } catch (sampleErr) {
            console.warn(`Error getting sample data for ${table}:`, sampleErr);
          }
        } else {
          details[table] = { count: 0, error: error.message };
        }
      } catch (err) {
        details[table] = { 
          count: 0, 
          error: err instanceof Error ? err.message : String(err) 
        };
      }
    }
    
    setTableDetails(details);
  };

  // Try to get a list of available tables in the database
  const getAvailableTables = async () => {
    try {
      // Common tables that might exist in our application
      const commonTables = ['cost_matrix', 'users', 'properties', 'projects', 'settings', 
                           'cost_factors', 'improvements', 'material_types', 'material_costs',
                           'building_types', 'regions', 'calculation_history', 'documents'];
      
      const foundTables = [];
      
      // Try each table to see if it exists
      for (const table of commonTables) {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
          
        if (!error || (error && !error.message.includes('does not exist'))) {
          foundTables.push(table);
        }
      }
      
      if (foundTables.length > 0) {
        setTables(foundTables);
      }
    } catch (err) {
      console.warn('Error getting available tables:', err);
      // Failure here is non-critical, so just log it
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
          setTables(['users']);
          await getAvailableTables();
          
          // Test RPC functions if we got this far
          await testRpcFunctions();
          await getTableDetails();
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
            setTables(['properties']);
            await getAvailableTables();
            
            // Test RPC functions if we got this far
            await testRpcFunctions();
            await getTableDetails();
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
        setTables(['cost_matrix']);
        await getAvailableTables();
        
        // Test RPC functions if we got this far
        await testRpcFunctions();
        await getTableDetails();
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
            <Tabs defaultValue="connection" onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                <TabsTrigger value="tables">Tables</TabsTrigger>
              </TabsList>
              
              <TabsContent value="connection" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Connection Status:</p>
                    <Badge 
                      variant={
                        connectionStatus === 'connected' ? 'default' : 
                        connectionStatus === 'partial' ? 'outline' :
                        connectionStatus === 'connecting' ? 'outline' :
                        'destructive'
                      }
                      className="flex items-center gap-1"
                    >
                      {connectionStatus === 'connected' ? (
                        <><CheckCircle size={14} className="text-green-500" /> Connected</>
                      ) : connectionStatus === 'partial' ? (
                        <><AlertTriangle size={14} className="text-amber-500" /> Partial</>
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

                <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
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
              </TabsContent>
              
              <TabsContent value="diagnostics" className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-md border border-blue-100">
                  <h3 className="text-sm font-semibold mb-2">Connection Diagnostics</h3>
                  
                  {/* Service Status Overview */}
                  {serviceStatus && (
                    <div className="mb-3 bg-white p-2 rounded border border-blue-100">
                      <h4 className="text-xs font-semibold mb-1">Service Status Overview</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div className={`p-1 rounded flex items-center gap-1 ${serviceStatus.auth ? 'bg-green-50' : 'bg-red-50'}`}>
                          {serviceStatus.auth ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span>Auth</span>
                        </div>
                        <div className={`p-1 rounded flex items-center gap-1 ${serviceStatus.database ? 'bg-green-50' : 'bg-red-50'}`}>
                          {serviceStatus.database ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span>Database</span>
                        </div>
                        <div className={`p-1 rounded flex items-center gap-1 ${serviceStatus.storage ? 'bg-green-50' : 'bg-red-50'}`}>
                          {serviceStatus.storage ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span>Storage</span>
                        </div>
                        <div className={`p-1 rounded flex items-center gap-1 ${serviceStatus.functions ? 'bg-green-50' : 'bg-red-50'}`}>
                          {serviceStatus.functions ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span>Functions</span>
                        </div>
                        <div className={`p-1 rounded flex items-center gap-1 ${serviceStatus.realtime ? 'bg-green-50' : 'bg-red-50'}`}>
                          {serviceStatus.realtime ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span>Realtime</span>
                        </div>
                        <div className={`p-1 rounded flex items-center gap-1 ${serviceStatus.health ? 'bg-green-50' : 'bg-red-50'}`}>
                          {serviceStatus.health ? 
                            <CheckCircle className="h-3 w-3 text-green-500" /> : 
                            <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span>Health</span>
                        </div>
                      </div>

                      {/* Service Status Message */}
                      <div className={`text-xs p-1 rounded mt-1
                        ${serviceStatus.message.includes('✅') ? 'bg-green-50 text-green-800' : 
                          serviceStatus.message.includes('❌') ? 'bg-red-50 text-red-800' :
                          serviceStatus.message.includes('⚠️') ? 'bg-yellow-50 text-yellow-800' :
                          'bg-slate-50 text-slate-800'}`}>
                        {serviceStatus.message}
                      </div>
                    </div>
                  )}
                  
                  {/* Diagnostic Logs */}
                  <div className="text-xs space-y-1 bg-white p-2 rounded border border-blue-100 font-mono max-h-48 overflow-y-auto">
                    {diagnostics.length > 0 ? (
                      diagnostics.map((message, idx) => (
                        <div key={idx} className={`
                          ${message.includes('✅') ? 'text-green-600' : 
                            message.includes('❌') ? 'text-red-600' : 
                            message.includes('⚠️') ? 'text-amber-600' : 
                            message.includes('ℹ️') ? 'text-blue-600' : 'text-gray-700'}
                        `}>
                          {message}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No diagnostic information available.</p>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-2 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={checkConnection}
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Refresh Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs" 
                      onClick={verifyServices}
                    >
                      <Server size={12} className="mr-1" />
                      Verify Services
                    </Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="tables" className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200">
                  <h3 className="text-sm font-semibold mb-2">Available Database Tables</h3>
                  {tables.length > 0 ? (
                    <div className="text-xs space-y-1">
                      {tables.map((table) => (
                        <Badge key={table} variant="outline" className="mr-1 mb-1">
                          <Database className="mr-1 h-3 w-3" />
                          {table}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No table information available yet.</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

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
            
            {tables.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <h3 className="text-sm font-semibold mb-2">Available Tables</h3>
                <div className="flex flex-wrap gap-2">
                  {tables.map((table) => (
                    <Badge key={table} variant="outline" className="bg-white">
                      <Database className="mr-1 h-3 w-3" />
                      {table}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {rpcResults.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <h3 className="text-sm font-semibold mb-2">RPC Function Tests</h3>
                <div className="space-y-2">
                  {rpcResults.map((result) => (
                    <div 
                      key={result.name} 
                      className={`p-2 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-50'} flex items-start gap-2`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-xs font-medium">{result.name}</p>
                        {result.success ? (
                          <p className="text-xs text-green-700 truncate">{result.responsePreview || 'Success'}</p>
                        ) : (
                          <p className="text-xs text-red-700">{result.error || 'Failed'}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {Object.keys(tableDetails).length > 0 && (
              <div className="mt-4 p-3 bg-blue-50/50 rounded-md border border-blue-100">
                <h3 className="text-sm font-semibold mb-2">Table Details</h3>
                <div className="space-y-2">
                  {Object.entries(tableDetails).map(([tableName, details]) => (
                    <Accordion key={tableName} type="single" collapsible className="bg-white rounded-md">
                      <AccordionItem value={tableName}>
                        <AccordionTrigger className="px-3 py-2 text-xs font-medium">
                          <span className="flex items-center">
                            <Database className="mr-2 h-3.5 w-3.5" />
                            {tableName}
                            {details.count !== undefined && (
                              <Badge variant="outline" className="ml-2">
                                {details.count} rows
                              </Badge>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 py-2">
                          {details.error ? (
                            <div className="p-2 bg-red-50 rounded text-xs">
                              <AlertTriangle className="h-4 w-4 text-amber-500 inline mr-1" />
                              {details.error}
                            </div>
                          ) : details.sample ? (
                            <div className="text-xs">
                              <div className="font-mono bg-slate-50 p-2 rounded overflow-auto max-h-32">
                                <pre>{JSON.stringify(details.sample, null, 2)}</pre>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs italic">No sample data available</p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ))}
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