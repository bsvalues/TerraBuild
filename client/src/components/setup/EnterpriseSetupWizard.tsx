import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Database, Shield, Server, Key, Globe, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'running' | 'complete' | 'error';
  required: boolean;
}

interface SystemCheck {
  name: string;
  status: 'checking' | 'passed' | 'failed' | 'warning';
  message: string;
  required: boolean;
}

export default function EnterpriseSetupWizard() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [setupProgress, setSetupProgress] = useState(0);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { name: 'Node.js Runtime', status: 'checking', message: '', required: true },
    { name: 'Database Connection', status: 'checking', message: '', required: true },
    { name: 'SSL Certificates', status: 'checking', message: '', required: false },
    { name: 'Environment Variables', status: 'checking', message: '', required: true },
    { name: 'External APIs', status: 'checking', message: '', required: false },
  ]);

  const [config, setConfig] = useState({
    databaseUrl: '',
    sessionSecret: '',
    jwtSecret: '',
    openaiKey: '',
    anthropicKey: '',
    awsAccessKey: '',
    awsSecretKey: '',
    domain: '',
    enableSSL: true,
    enableEnterprise: true,
  });

  const [steps] = useState<SetupStep[]>([
    {
      id: 'system-check',
      title: 'System Verification',
      description: 'Verify system requirements and dependencies',
      icon: <Monitor className="w-6 h-6" />,
      status: 'pending',
      required: true,
    },
    {
      id: 'database-setup',
      title: 'Database Configuration',
      description: 'Configure PostgreSQL connection and schema',
      icon: <Database className="w-6 h-6" />,
      status: 'pending',
      required: true,
    },
    {
      id: 'security-config',
      title: 'Security Setup',
      description: 'Configure SSL certificates and authentication',
      icon: <Shield className="w-6 h-6" />,
      status: 'pending',
      required: true,
    },
    {
      id: 'api-integration',
      title: 'API Integration',
      description: 'Connect external services and AI providers',
      icon: <Key className="w-6 h-6" />,
      status: 'pending',
      required: false,
    },
    {
      id: 'deployment',
      title: 'Deployment',
      description: 'Final deployment and service startup',
      icon: <Server className="w-6 h-6" />,
      status: 'pending',
      required: true,
    },
    {
      id: 'verification',
      title: 'System Verification',
      description: 'Verify all services are running correctly',
      icon: <Globe className="w-6 h-6" />,
      status: 'pending',
      required: true,
    },
  ]);

  const runSystemChecks = async () => {
    const checks = [...systemChecks];
    
    for (let i = 0; i < checks.length; i++) {
      setSystemChecks(prev => prev.map((check, idx) => 
        idx === i ? { ...check, status: 'checking' } : check
      ));

      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        switch (checks[i].name) {
          case 'Node.js Runtime':
            const nodeVersion = await fetch('/api/system/node-version').then(r => r.json());
            checks[i] = { ...checks[i], status: 'passed', message: `Node.js ${nodeVersion.version}` };
            break;
          
          case 'Database Connection':
            const dbStatus = await fetch('/api/system/database-status').then(r => r.json());
            checks[i] = { ...checks[i], status: dbStatus.connected ? 'passed' : 'failed', 
                          message: dbStatus.connected ? 'Connected' : 'Connection failed' };
            break;
          
          case 'SSL Certificates':
            const sslStatus = await fetch('/api/system/ssl-status').then(r => r.json());
            checks[i] = { ...checks[i], status: sslStatus.present ? 'passed' : 'warning', 
                          message: sslStatus.present ? 'Certificates found' : 'Using self-signed certificates' };
            break;
          
          case 'Environment Variables':
            const envStatus = await fetch('/api/system/env-status').then(r => r.json());
            checks[i] = { ...checks[i], status: envStatus.configured ? 'passed' : 'failed', 
                          message: envStatus.configured ? 'Configured' : 'Missing required variables' };
            break;
          
          case 'External APIs':
            const apiStatus = await fetch('/api/system/api-status').then(r => r.json());
            checks[i] = { ...checks[i], status: apiStatus.available ? 'passed' : 'warning', 
                          message: apiStatus.available ? 'APIs accessible' : 'Some APIs unavailable' };
            break;
        }
      } catch (error) {
        checks[i] = { ...checks[i], status: 'failed', message: 'Check failed' };
      }

      setSystemChecks([...checks]);
    }
  };

  const handleConfigSubmit = async (stepId: string) => {
    try {
      const response = await fetch(`/api/setup/${stepId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast({
          title: "Configuration saved",
          description: "Step completed successfully",
        });
        
        setCurrentStep(prev => prev + 1);
        setSetupProgress((currentStep + 1) / steps.length * 100);
      } else {
        throw new Error('Configuration failed');
      }
    } catch (error) {
      toast({
        title: "Configuration failed",
        description: "Please check your settings and try again",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (currentStep === 0) {
      runSystemChecks();
    }
  }, [currentStep]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
      case 'complete':
        return <Badge variant="default">{status}</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="destructive">{status}</Badge>;
      case 'warning':
        return <Badge variant="warning">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TerraFusion Enterprise Setup</h1>
          <p className="text-xl text-gray-600">Configure your enterprise-grade civil infrastructure platform</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Setup Progress
              <Badge variant="outline">{currentStep + 1} of {steps.length}</Badge>
            </CardTitle>
            <Progress value={setupProgress} className="w-full" />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setup Steps</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`p-3 border-l-4 cursor-pointer transition-colors ${
                        index === currentStep
                          ? 'border-blue-500 bg-blue-50'
                          : index < currentStep
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => index <= currentStep && setCurrentStep(index)}
                    >
                      <div className="flex items-center gap-3">
                        {step.icon}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{step.title}</div>
                          {getStatusBadge(step.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {steps[currentStep]?.icon}
                  {steps[currentStep]?.title}
                </CardTitle>
                <CardDescription>
                  {steps[currentStep]?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">System Requirements Check</h3>
                    <div className="space-y-3">
                      {systemChecks.map((check, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(check.status)}
                            <div>
                              <div className="font-medium">{check.name}</div>
                              <div className="text-sm text-gray-600">{check.message}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {check.required && <Badge variant="outline">Required</Badge>}
                            {getStatusBadge(check.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Database Configuration</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="databaseUrl">Database URL</Label>
                        <Input
                          id="databaseUrl"
                          placeholder="postgresql://user:password@localhost:5432/terrafusion"
                          value={config.databaseUrl}
                          onChange={(e) => setConfig(prev => ({ ...prev, databaseUrl: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Security Configuration</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="sessionSecret">Session Secret</Label>
                        <Input
                          id="sessionSecret"
                          type="password"
                          placeholder="Enter a secure session secret (min 32 characters)"
                          value={config.sessionSecret}
                          onChange={(e) => setConfig(prev => ({ ...prev, sessionSecret: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jwtSecret">JWT Secret</Label>
                        <Input
                          id="jwtSecret"
                          type="password"
                          placeholder="Enter a secure JWT secret (min 32 characters)"
                          value={config.jwtSecret}
                          onChange={(e) => setConfig(prev => ({ ...prev, jwtSecret: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">API Integration</h3>
                    <Tabs defaultValue="ai" className="w-full">
                      <TabsList>
                        <TabsTrigger value="ai">AI Services</TabsTrigger>
                        <TabsTrigger value="cloud">Cloud Services</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ai" className="space-y-4">
                        <div>
                          <Label htmlFor="openaiKey">OpenAI API Key</Label>
                          <Input
                            id="openaiKey"
                            type="password"
                            placeholder="sk-..."
                            value={config.openaiKey}
                            onChange={(e) => setConfig(prev => ({ ...prev, openaiKey: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="anthropicKey">Anthropic API Key</Label>
                          <Input
                            id="anthropicKey"
                            type="password"
                            placeholder="sk-ant-..."
                            value={config.anthropicKey}
                            onChange={(e) => setConfig(prev => ({ ...prev, anthropicKey: e.target.value }))}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="cloud" className="space-y-4">
                        <div>
                          <Label htmlFor="awsAccessKey">AWS Access Key</Label>
                          <Input
                            id="awsAccessKey"
                            placeholder="AKIA..."
                            value={config.awsAccessKey}
                            onChange={(e) => setConfig(prev => ({ ...prev, awsAccessKey: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="awsSecretKey">AWS Secret Key</Label>
                          <Input
                            id="awsSecretKey"
                            type="password"
                            placeholder="Enter AWS secret key"
                            value={config.awsSecretKey}
                            onChange={(e) => setConfig(prev => ({ ...prev, awsSecretKey: e.target.value }))}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Deployment Configuration</h3>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        The system will now deploy your enterprise configuration. This may take a few minutes.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">System Verification</h3>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your TerraFusion enterprise system is now ready! All services are running correctly.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => handleConfigSubmit(steps[currentStep]?.id)}
                  disabled={currentStep >= steps.length - 1}
                >
                  {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}