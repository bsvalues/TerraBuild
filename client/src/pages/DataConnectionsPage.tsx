import React from 'react';
import { useDocumentTitle } from '@/hooks/use-document-title';
import DataConnectionTester from '@/components/data-connectors/DataConnectionTester';
import ConnectionHistory from '@/components/data-connectors/ConnectionHistory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Server, Database, FolderSync } from 'lucide-react';

const DataConnectionsPage = () => {
  useDocumentTitle('Data Connections - BCBS');

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Data Connections</h1>
        <p className="text-muted-foreground">
          Manage and test connections to external data sources used by the Building Cost Building System
        </p>
      </div>

      <Tabs defaultValue="test">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="test">
            <Server className="h-4 w-4 mr-2" />
            Connection Test
          </TabsTrigger>
          <TabsTrigger value="config">
            <Shield className="h-4 w-4 mr-2" />
            Connection Settings
          </TabsTrigger>
          <TabsTrigger value="history">
            <Database className="h-4 w-4 mr-2" />
            Connection History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="test" className="space-y-6 mt-6">
          <DataConnectionTester />
        </TabsContent>
        
        <TabsContent value="config" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>FTP Connection Settings</CardTitle>
              <CardDescription>
                Configure connection details for the FTP server
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 p-4 bg-muted rounded-md">
                <FolderSync className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  FTP connection settings are managed through environment variables.
                  Contact your system administrator to update these values.
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Host</h4>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {import.meta.env.VITE_FTP_HOST || 'Set via FTP_HOST env variable'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Port</h4>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {import.meta.env.VITE_FTP_PORT || 'Set via FTP_PORT env variable'}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Username</h4>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {import.meta.env.VITE_FTP_USERNAME ? '******** (Set)' : 'Not configured'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Password</h4>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {import.meta.env.VITE_FTP_PASSWORD ? '******** (Set)' : 'Not configured'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection History</CardTitle>
              <CardDescription>
                View recent connection attempts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConnectionHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataConnectionsPage;