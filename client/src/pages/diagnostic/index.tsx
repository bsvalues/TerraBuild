import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Zap, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const DiagnosticPage = () => {
  const [isRunning, setIsRunning] = useState(false);

  const systemHealth = [
    { component: 'Database Connection', status: 'healthy', uptime: '99.9%', responseTime: '2ms' },
    { component: 'Cost Calculation Engine', status: 'healthy', uptime: '99.8%', responseTime: '15ms' },
    { component: 'GIS Data Service', status: 'warning', uptime: '97.5%', responseTime: '45ms' },
    { component: 'Marshall Swift API', status: 'healthy', uptime: '99.7%', responseTime: '120ms' },
    { component: 'File Upload Service', status: 'healthy', uptime: '99.9%', responseTime: '8ms' },
    { component: 'Report Generation', status: 'healthy', uptime: '99.6%', responseTime: '250ms' }
  ];

  const dataQuality = [
    { metric: 'Property Records', score: 98.5, status: 'excellent', total: 20136, issues: 12 },
    { metric: 'Cost Factor Data', score: 97.2, status: 'good', total: 2847, issues: 8 },
    { metric: 'Geographic Data', score: 94.8, status: 'good', total: 15623, issues: 45 },
    { metric: 'Assessment History', score: 99.1, status: 'excellent', total: 89234, issues: 3 }
  ];

  const recentIssues = [
    {
      id: 1,
      type: 'warning',
      component: 'GIS Data Service',
      message: 'Increased response time detected',
      timestamp: '2025-06-08 12:15:00',
      resolved: false
    },
    {
      id: 2,
      type: 'info',
      component: 'Cost Calculation Engine',
      message: 'Scheduled maintenance completed',
      timestamp: '2025-06-08 08:30:00',
      resolved: true
    },
    {
      id: 3,
      type: 'error',
      component: 'Marshall Swift API',
      message: 'Rate limit exceeded (resolved)',
      timestamp: '2025-06-07 16:45:00',
      resolved: true
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  const runDiagnostics = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">System Diagnostics</h1>
          <p className="text-slate-400 mt-1">Monitor system health and data quality</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button size="sm" onClick={runDiagnostics} disabled={isRunning}>
            <Zap className="h-4 w-4 mr-2" />
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-emerald-400" />
              <div>
                <div className="text-2xl font-bold text-emerald-400">6/6</div>
                <div className="text-sm text-slate-400">Services Online</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-sky-400" />
              <div>
                <div className="text-2xl font-bold text-slate-100">97.4%</div>
                <div className="text-sm text-slate-400">Data Quality</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <div>
                <div className="text-2xl font-bold text-slate-100">99.7%</div>
                <div className="text-sm text-slate-400">System Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <div className="text-2xl font-bold text-slate-100">1</div>
                <div className="text-sm text-slate-400">Active Issues</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemHealth.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <div className="font-medium text-slate-100">{service.component}</div>
                      <div className="text-sm text-slate-400">
                        Uptime: {service.uptime} • Response: {service.responseTime}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={service.status === 'healthy' 
                      ? 'border-emerald-500/30 text-emerald-400' 
                      : 'border-yellow-500/30 text-yellow-400'}
                  >
                    {service.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Data Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataQuality.map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">{metric.metric}</span>
                    <span className="text-slate-100 font-bold">{metric.score}%</span>
                  </div>
                  <Progress value={metric.score} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      {metric.total.toLocaleString()} records
                    </span>
                    <span className={metric.issues === 0 ? 'text-emerald-400' : 'text-yellow-400'}>
                      {metric.issues} issues
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Issues & Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentIssues.map((issue) => (
              <div key={issue.id} className="flex items-start gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  issue.type === 'error' ? 'bg-red-400' :
                  issue.type === 'warning' ? 'bg-yellow-400' : 'bg-sky-400'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-100">{issue.component}</span>
                    {issue.resolved && (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-300 mb-1">{issue.message}</div>
                  <div className="text-xs text-slate-400">{issue.timestamp}</div>
                </div>
                {!issue.resolved && (
                  <Button variant="outline" size="sm">
                    Investigate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isRunning && (
        <Card className="bg-sky-500/10 border-sky-500/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-sky-500 border-t-transparent rounded-full"></div>
              <div>
                <div className="font-medium text-slate-100">Running comprehensive diagnostics...</div>
                <div className="text-sm text-slate-400">Checking all systems and data integrity</div>
              </div>
            </div>
            <Progress value={75} className="mt-4" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiagnosticPage;