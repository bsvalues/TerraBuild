import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { testConnection, testTableAccess, runComprehensiveTest, getDiagnosticInfo, TestResult } from '@/lib/utils/supabaseConnectionTest';
import supabaseProxy from '@/lib/utils/supabaseProxy';
import { CheckCircle, XCircle, AlertTriangle, Info, RefreshCw, Database, AlertCircle } from 'lucide-react';

const SupabaseTestPage: React.FC = () => {
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [tableResults, setTableResults] = useState<Record<string, TestResult>>({});
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  useEffect(() => {
    // Initialize diagnostic info on mount
    setDiagnosticInfo(getDiagnosticInfo());
  }, []);

  const handleConnectionTest = async () => {
    setIsLoading(true);
    try {
      // First try with our direct proxy
      const proxyResult = await supabaseProxy.checkConnection();
      
      if (proxyResult.success) {
        setConnectionResult({
          success: true,
          message: 'Successfully connected to Supabase via direct proxy',
          details: proxyResult
        });
      } else {
        // If direct proxy fails, try the regular test
        const result = await testConnection();
        setConnectionResult(result);
      }
    } catch (error) {
      console.error('Error in connection test:', error);
      setConnectionResult({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTableTest = async (tableName: string) => {
    setIsLoading(true);
    try {
      // Try to query using the proxy first
      try {
        const data = await supabaseProxy.queryTable(tableName, { limit: 5 });
        setTableResults(prev => ({ 
          ...prev, 
          [tableName]: {
            success: true,
            message: `Successfully accessed table '${tableName}' (${data.length} records via proxy)`,
            details: data
          }
        }));
      } catch (proxyError) {
        // If proxy fails, try the regular test
        console.error(`Proxy table access failed for ${tableName}:`, proxyError);
        const result = await testTableAccess(tableName);
        setTableResults(prev => ({ ...prev, [tableName]: result }));
      }
    } catch (error) {
      console.error(`Error in table test for ${tableName}:`, error);
      setTableResults(prev => ({
        ...prev,
        [tableName]: {
          success: false,
          message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleComprehensiveTest = async () => {
    setIsLoading(true);
    try {
      const results = await runComprehensiveTest();
      setTestResults(results);
    } catch (error) {
      console.error('Error in comprehensive test:', error);
      setTestResults([{
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDiagnosticInfo = () => {
    setDiagnosticInfo(getDiagnosticInfo());
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Database className="mr-2" />
        Supabase Connection Test
      </h1>
      
      <Tabs defaultValue="connection" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="connection">Connection Test</TabsTrigger>
          <TabsTrigger value="tables">Table Access</TabsTrigger>
          <TabsTrigger value="comprehensive">Comprehensive Test</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle>Basic Connection Test</CardTitle>
              <CardDescription>
                Test the basic connection to Supabase through our server-side proxy
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectionResult && (
                <Alert variant={connectionResult.success ? "default" : "destructive"} className="mb-4">
                  <div className="flex items-center">
                    {connectionResult.success ? <CheckCircle className="h-5 w-5 mr-2" /> : <XCircle className="h-5 w-5 mr-2" />}
                    <AlertTitle>{connectionResult.success ? 'Success' : 'Error'}</AlertTitle>
                  </div>
                  <AlertDescription>{connectionResult.message}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleConnectionTest} 
                disabled={isLoading}
                className="mt-2"
              >
                {isLoading ? 'Testing...' : 'Test Connection'}
                {isLoading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Table Access Tests</CardTitle>
              <CardDescription>
                Test access to specific tables in your Supabase database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {['scenarios', 'users', 'properties', 'projects'].map(tableName => (
                  <div key={tableName} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium">{tableName}</h3>
                      {tableResults[tableName] && (
                        <Badge variant={tableResults[tableName]?.success ? "outline" : "danger"}>
                          {tableResults[tableName]?.success ? 'Success' : 'Failed'}
                        </Badge>
                      )}
                    </div>
                    
                    {tableResults[tableName] && (
                      <Alert variant={tableResults[tableName].success ? "default" : "destructive"} className="mb-3">
                        <AlertDescription>{tableResults[tableName].message}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      onClick={() => handleTableTest(tableName)} 
                      disabled={isLoading}
                      size="sm"
                    >
                      {isLoading ? 'Testing...' : 'Test Access'}
                      {isLoading && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comprehensive">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Test</CardTitle>
              <CardDescription>
                Run all tests to check the full Supabase connection and capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleComprehensiveTest} 
                disabled={isLoading}
                className="mb-4"
              >
                {isLoading ? 'Running Tests...' : 'Run All Tests'}
                {isLoading && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
              </Button>
              
              {testResults.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Test Results</h3>
                  <div className="space-y-3">
                    {testResults.map((result, index) => (
                      <Alert 
                        key={index} 
                        variant={result.success ? "default" : "destructive"}
                      >
                        <div className="flex items-center">
                          {result.success ? <CheckCircle className="h-4 w-4 mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                          <AlertTitle className="text-sm font-medium">{result.message}</AlertTitle>
                        </div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm">View Details</summary>
                            <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto max-h-60">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostic">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Information</CardTitle>
              <CardDescription>
                View configuration and environment details for your Supabase connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={refreshDiagnosticInfo} 
                variant="outline" 
                size="sm" 
                className="mb-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Info
              </Button>
              
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Client Configuration</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="text-sm font-medium">Supabase Client Configured</div>
                  <div>
                    {diagnosticInfo.configured ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium">Auth Configured</div>
                  <div>
                    {diagnosticInfo.authConfigured ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                        <AlertTriangle className="h-3 w-3 mr-1" /> No
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm font-medium">Client Version</div>
                  <div className="text-sm">{diagnosticInfo.clientVersion || 'N/A'}</div>
                  
                  <div className="text-sm font-medium">Timestamp</div>
                  <div className="text-sm">{diagnosticInfo.timestamp || 'N/A'}</div>
                </div>
                
                {diagnosticInfo.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertTitle>Error Retrieving Diagnostic Info</AlertTitle>
                    <AlertDescription>{diagnosticInfo.error}</AlertDescription>
                  </Alert>
                )}
              </div>
              
              <Separator className="my-4" />
              
              <Alert variant="default" className="mt-4">
                <Info className="h-4 w-4 mr-2" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  The Supabase connection is being tested via our server-side proxy to bypass CORS
                  issues in the Replit environment. Direct connections from the browser client to
                  Supabase may still fail.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabaseTestPage;