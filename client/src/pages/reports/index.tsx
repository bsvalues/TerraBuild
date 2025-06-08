import React, { useState } from 'react';
import { Download, FileText, BarChart3, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');

  const reports = [
    {
      id: '1',
      title: 'Property Valuation Summary',
      type: 'Valuation',
      period: 'Monthly',
      lastGenerated: '2025-06-07',
      size: '2.4 MB',
      status: 'Ready'
    },
    {
      id: '2',
      title: 'Cost Analysis Trends',
      type: 'Analytics',
      period: 'Weekly',
      lastGenerated: '2025-06-05',
      size: '1.8 MB',
      status: 'Ready'
    },
    {
      id: '3',
      title: 'Geographic Assessment Report',
      type: 'Geographic',
      period: 'Quarterly',
      lastGenerated: '2025-06-01',
      size: '5.2 MB',
      status: 'Generating'
    }
  ];

  const quickReports = [
    { name: 'Property Count by Type', icon: BarChart3 },
    { name: 'Average Values by District', icon: BarChart3 },
    { name: 'Recent Assessments', icon: FileText },
    { name: 'Cost Factor Updates', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Reports & Analytics</h1>
          <p className="text-slate-400 mt-1">Generate comprehensive property assessment reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Report
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickReports.map((report, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <report.icon className="h-8 w-8 text-sky-400" />
                <div>
                  <h3 className="font-medium text-slate-100">{report.name}</h3>
                  <p className="text-sm text-slate-400">Quick generate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-48 bg-slate-800/50 border-slate-700">
            <SelectValue placeholder="Report type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="valuation">Valuation</SelectItem>
            <SelectItem value="analytics">Analytics</SelectItem>
            <SelectItem value="geographic">Geographic</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <FileText className="h-8 w-8 text-sky-400" />
                  <div>
                    <h3 className="font-medium text-slate-100">{report.title}</h3>
                    <p className="text-sm text-slate-400">{report.type} • {report.period} • Last: {report.lastGenerated}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-slate-300">{report.size}</p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'Ready' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  
                  {report.status === 'Ready' && (
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;