import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Palette, 
  Moon, 
  Sun, 
  Monitor,
  PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const SettingsPage = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="profile" className="data-[state=active]:bg-blue-800/50">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-blue-800/50">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-800/50">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-blue-800/50">
            <Settings className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
          {user?.role === 'admin' && (
            <TabsTrigger value="admin" className="data-[state=active]:bg-blue-800/50">
              <Shield className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Profile Information</CardTitle>
              <CardDescription className="text-blue-300">
                Manage your account details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-blue-800/60 flex items-center justify-center text-blue-200 text-4xl font-semibold mb-4 border-4 border-blue-700/40 relative">
                    {user?.name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    <Badge className="absolute bottom-0 right-0 bg-blue-600 text-xs">
                      {user?.role || 'user'}
                    </Badge>
                  </div>
                  <Button variant="outline" className="text-blue-200 border-blue-700 mt-2">
                    Change Avatar
                  </Button>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-blue-200">Username</Label>
                      <Input 
                        id="username" 
                        value={user?.username} 
                        disabled 
                        className="bg-blue-950/70 border-blue-800/60 text-blue-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-id" className="text-blue-200">User ID</Label>
                      <Input 
                        id="user-id" 
                        value={user?.id} 
                        disabled 
                        className="bg-blue-950/70 border-blue-800/60 text-blue-300 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-blue-200">Display Name</Label>
                      <Input 
                        id="name" 
                        defaultValue={user?.name || ''}
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-blue-200">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="Enter your email"
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4 bg-blue-800/40" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-blue-200">Bio</Label>
                    <textarea 
                      id="bio" 
                      rows={3}
                      placeholder="Tell us about yourself"
                      className="w-full rounded-md bg-blue-900/50 border border-blue-700/50 text-blue-100 p-3 placeholder:text-blue-400/70"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button className="bg-blue-700 hover:bg-blue-600">
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Security</CardTitle>
              <CardDescription className="text-blue-300">
                Update your password and security settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-blue-200">Current Password</Label>
                    <Input 
                      id="current-password" 
                      type="password"
                      className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-blue-200">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password"
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-blue-200">Confirm Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password"
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button className="bg-blue-700 hover:bg-blue-600">
                    Update Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Theme Settings</CardTitle>
              <CardDescription className="text-blue-300">
                Customize the appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-blue-200">Theme Mode</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="border-blue-700 bg-transparent">
                        <Sun className="h-5 w-5 text-amber-500 mr-2" />
                        Light
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="border-blue-700 bg-blue-800/60">
                        <Moon className="h-5 w-5 text-blue-300 mr-2" />
                        Dark
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="border-blue-700 bg-transparent">
                        <Monitor className="h-5 w-5 text-blue-400 mr-2" />
                        System
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-200">Color Palette</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" className="border-transparent h-10 p-0 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-600"></div>
                    </Button>
                    <Button variant="outline" className="border-blue-700 h-10 p-0 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-cyan-900 to-cyan-600"></div>
                    </Button>
                    <Button variant="outline" className="border-transparent h-10 p-0 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-indigo-600"></div>
                    </Button>
                    <Button variant="outline" className="border-transparent h-10 p-0 overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-violet-900 to-violet-600"></div>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-blue-200">Sidebar Density</Label>
                  <Select defaultValue="default">
                    <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                      <SelectValue placeholder="Select density" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-blue-200">Animations</Label>
                    <span className="text-xs text-blue-400">Enable interface animations</span>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-blue-200">Reduced Motion</Label>
                    <span className="text-xs text-blue-400">Simplify motions for accessibility</span>
                  </div>
                  <Switch id="reduced-motion" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Notification Preferences</CardTitle>
              <CardDescription className="text-blue-300">
                Configure how you want to be notified about system events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <NotificationSetting 
                  title="Property Updates"
                  description="Notify when property data is updated"
                  emailEnabled={true}
                  appEnabled={true}
                />
                <Separator className="bg-blue-800/40" />
                
                <NotificationSetting 
                  title="Cost Matrix Changes"
                  description="Notify when cost matrices are updated"
                  emailEnabled={true}
                  appEnabled={true}
                />
                <Separator className="bg-blue-800/40" />
                
                <NotificationSetting 
                  title="Calculation Reports"
                  description="Notify when calculation reports are ready"
                  emailEnabled={true}
                  appEnabled={true}
                />
                <Separator className="bg-blue-800/40" />
                
                <NotificationSetting 
                  title="System Updates"
                  description="Notify about system updates and maintenance"
                  emailEnabled={false}
                  appEnabled={true}
                />
                <Separator className="bg-blue-800/40" />
                
                <NotificationSetting 
                  title="Data Import Status"
                  description="Notify about data import completion"
                  emailEnabled={true}
                  appEnabled={true}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">System Settings</CardTitle>
              <CardDescription className="text-blue-300">
                Configure system-level settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-blue-200">Data Cache</Label>
                    <span className="text-xs text-blue-400">Cache property data for faster access</span>
                  </div>
                  <Switch id="data-cache" defaultChecked />
                </div>
                <Separator className="bg-blue-800/40" />
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-blue-200">Auto-save</Label>
                    <span className="text-xs text-blue-400">Automatically save form data</span>
                  </div>
                  <Switch id="auto-save" defaultChecked />
                </div>
                <Separator className="bg-blue-800/40" />

                <div className="space-y-2">
                  <Label className="text-blue-200">Default Region</Label>
                  <Select defaultValue="richland">
                    <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="richland">Richland</SelectItem>
                      <SelectItem value="kennewick">Kennewick</SelectItem>
                      <SelectItem value="prosser">Prosser</SelectItem>
                      <SelectItem value="west-richland">West Richland</SelectItem>
                      <SelectItem value="benton-city">Benton City</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-blue-800/40" />

                <div className="space-y-2">
                  <Label className="text-blue-200">Data Export Format</Label>
                  <Select defaultValue="json">
                    <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator className="bg-blue-800/40" />

                <div className="space-y-4">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-cyan-200">API Key</Label>
                    <span className="text-xs text-cyan-400">For accessing TerraFusion programmatically</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value="••••••••••••••••••••••••••"
                      disabled
                      className="font-mono bg-[#083344]/70 border-cyan-800/60 text-cyan-300"
                    />
                    <Button variant="outline" className="border-cyan-700 text-cyan-200">
                      Regenerate
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-cyan-900/30 border-cyan-800/40">
            <CardHeader>
              <CardTitle className="text-cyan-100">About</CardTitle>
              <CardDescription className="text-cyan-300">
                System information and version details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-cyan-400 text-sm">Version</p>
                    <p className="text-cyan-100">v2.5.1 (build 2025.05.16)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-cyan-400 text-sm">Database</p>
                    <p className="text-cyan-100">PostgreSQL 16.3</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-cyan-400 text-sm">Environment</p>
                    <p className="text-cyan-100">Production</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-cyan-400 text-sm">Last Update</p>
                    <p className="text-cyan-100">May 16, 2025</p>
                  </div>
                </div>
                
                <Button variant="outline" className="border-cyan-700 text-cyan-200 w-full mt-4">
                  Check for Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {user?.role === 'admin' && (
          <TabsContent value="admin" className="space-y-4">
            <Card className="bg-blue-900/30 border-blue-800/40">
              <CardHeader>
                <CardTitle className="text-blue-100">Administrator Controls</CardTitle>
                <CardDescription className="text-blue-300">
                  Advanced system settings for administrators only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-blue-200">User Management</Label>
                    <Button className="bg-blue-700 hover:bg-blue-600">
                      Manage Users
                    </Button>
                  </div>
                  <Separator className="bg-blue-800/40" />
                  
                  <div className="space-y-2">
                    <Label className="text-blue-200">System Configuration</Label>
                    <Select defaultValue="production">
                      <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator className="bg-blue-800/40" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label className="text-blue-200">Maintenance Mode</Label>
                      <span className="text-xs text-blue-400">Disable user access for maintenance</span>
                    </div>
                    <Switch id="maintenance-mode" />
                  </div>
                  <Separator className="bg-blue-800/40" />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      <Label className="text-blue-200">Debug Logging</Label>
                      <span className="text-xs text-blue-400">Enable detailed system logs</span>
                    </div>
                    <Switch id="debug-logging" />
                  </div>
                  <Separator className="bg-blue-800/40" />
                  
                  <div className="space-y-2">
                    <Label className="text-blue-200 mb-2">System Actions</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Button variant="outline" className="border-blue-700 text-blue-200">
                        <Database className="mr-2 h-4 w-4" />
                        Database Backup
                      </Button>
                      <Button variant="outline" className="border-blue-700 text-blue-200">
                        <PieChart className="mr-2 h-4 w-4" />
                        System Analytics
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

// Helper component for notification settings
const NotificationSetting = ({ title, description, emailEnabled, appEnabled }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-blue-200">{title}</Label>
        <p className="text-xs text-blue-400">{description}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor={`${title}-email`} className="text-sm text-blue-300">Email</Label>
          <Switch id={`${title}-email`} defaultChecked={emailEnabled} />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor={`${title}-app`} className="text-sm text-blue-300">In-app</Label>
          <Switch id={`${title}-app`} defaultChecked={appEnabled} />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;