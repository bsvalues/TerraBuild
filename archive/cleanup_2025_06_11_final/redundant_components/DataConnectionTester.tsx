import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Database, Globe, FolderSync } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionResult {
  success: boolean;
  message: string;
  timestamp?: string;
  config?: {
    host?: string;
    server?: string;
    port?: number;
    database?: string;
    hasCredentials?: boolean;
  };
}

const DataConnectionTester = () => {
  const [activeTab, setActiveTab] = useState('ftp');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConnectionResult | null>(null);

  const testConnection = async (type: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await axios.get(`/api/data-connections/test/${type}`);
      setResult(response.data);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || `Error testing ${type} connection`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'ftp':
        return <FolderSync className="h-5 w-5 mr-2" />;
      case 'arcgis':
        return <Globe className="h-5 w-5 mr-2" />;
      case 'sqlserver':
        return <Database className="h-5 w-5 mr-2" />;
      default:
        return null;
    }
  };

  const getTabTitle = (type: string) => {
    switch (type) {
      case 'ftp':
        return 'FTP Connection';
      case 'arcgis':
        return 'ArcGIS REST API';
      case 'sqlserver':
        return 'SQL Server DB';
      default:
        return type;
    }
  };

  const renderConnectionDetails = () => {
    if (!result?.config) return null;

    const details = [];

    if (result.config.host || result.config.server) {
      details.push(
        <div key="host" className="flex items-center">
          <span className="font-medium mr-2">Host:</span>
          <span>{result.config.host || result.config.server}</span>
        </div>
      );
    }

    if (result.config.port) {
      details.push(
        <div key="port" className="flex items-center">
          <span className="font-medium mr-2">Port:</span>
          <span>{result.config.port}</span>
        </div>
      );
    }

    if (result.config.database) {
      details.push(
        <div key="database" className="flex items-center">
          <span className="font-medium mr-2">Database:</span>
          <span>{result.config.database}</span>
        </div>
      );
    }

    if (result.config.hasCredentials !== undefined) {
      details.push(
        <div key="credentials" className="flex items-center">
          <span className="font-medium mr-2">Credentials:</span>
          <span>{result.config.hasCredentials ? 'Provided' : 'Missing'}</span>
        </div>
      );
    }

    return details.length > 0 ? (
      <div className="p-4 mt-4 bg-muted rounded-md">
        <h4 className="font-semibold mb-2">Connection Details</h4>
        <div className="space-y-2">{details}</div>
      </div>
    ) : null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Connection Tester</CardTitle>
        <CardDescription>
          Test connections to external data sources including FTP, ArcGIS REST API, and SQL Server
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="ftp" onClick={() => setActiveTab('ftp')}>
              {getConnectionIcon('ftp')} FTP
            </TabsTrigger>
            <TabsTrigger value="arcgis" onClick={() => setActiveTab('arcgis')}>
              {getConnectionIcon('arcgis')} ArcGIS
            </TabsTrigger>
            <TabsTrigger value="sqlserver" onClick={() => setActiveTab('sqlserver')}>
              {getConnectionIcon('sqlserver')} SQL Server
            </TabsTrigger>
          </TabsList>

          {['ftp', 'arcgis', 'sqlserver'].map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{getTabTitle(type)}</h3>
                <p className="text-sm text-muted-foreground">
                  {type === 'ftp'
                    ? 'Test the connection to the FTP server where data files can be imported from or exported to.'
                    : type === 'arcgis'
                    ? 'Test the connection to the ArcGIS REST API for retrieving geospatial building data.'
                    : 'Test the connection to the SQL Server database containing building cost information.'}
                </p>
              </div>

              <Button 
                disabled={loading} 
                onClick={() => testConnection(type)}
                className="w-full"
              >
                {loading && activeTab === type ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>

              {result && activeTab === type && (
                <Alert className={result.success ? 'border-green-500' : 'border-red-500'}>
                  <div className="flex items-center">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <AlertTitle className={result.success ? 'text-green-500' : 'text-red-500'}>
                      {result.success ? 'Connection Successful' : 'Connection Failed'}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    <p>{result.message}</p>
                    {result.timestamp && (
                      <Badge variant="outline" className="mt-2">
                        {new Date(result.timestamp).toLocaleString()}
                      </Badge>
                    )}
                    {renderConnectionDetails()}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <p className="text-sm text-muted-foreground">
          These tests verify your ability to connect to external data sources. If a connection fails,
          please check your environment variables and network settings.
        </p>
      </CardFooter>
    </Card>
  );
};

export default DataConnectionTester;