import React from 'react';
import { FTPConnectionManager } from '@/components/data-transfer/FTPConnectionManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'wouter';
import { ChevronLeft, Database, Cog } from 'lucide-react';

export function FTPConnectionPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/data-connections" className="inline-block">
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Data Connections</span>
            </Button>
          </Link>
        </div>
        <Link href="/settings/ftp" className="inline-block">
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Cog className="h-4 w-4" />
            <span>FTP Settings</span>
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Details</CardTitle>
              <CardDescription>Current FTP Connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Host</h4>
                <p className="text-sm text-muted-foreground truncate">*******</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Port</h4>
                <p className="text-sm text-muted-foreground">21</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Username</h4>
                <p className="text-sm text-muted-foreground truncate">*******</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Status</h4>
                <div className="flex items-center mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <p className="text-sm">Connected</p>
                </div>
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" className="w-full gap-1">
                  <Database className="h-4 w-4" />
                  <span>Test Connection</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About FTP Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This FTP connection allows you to access the County Assessor CAMA system
                files directly, facilitating seamless data transfer between systems.
              </p>
              <p className="text-sm text-muted-foreground">
                You can browse, upload, download, and manage files on the remote server
                from this interface.
              </p>
              <p className="text-sm font-medium text-amber-600">
                Note: Changes made through this interface will directly affect the 
                remote system. Use with caution.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-3">
          <div className="h-[700px]">
            <FTPConnectionManager />
          </div>
        </div>
      </div>
    </div>
  );
}

export default FTPConnectionPage;