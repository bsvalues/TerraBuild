import React, { useState } from 'react';
import { Database, Upload, Download, Eye, Edit, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const MatrixPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const matrices = [
    {
      id: 1,
      name: 'Benton County Residential Cost Matrix 2025',
      type: 'Residential',
      region: 'Benton County',
      version: '2025.1',
      records: 2847,
      lastUpdated: '2025-06-01',
      status: 'active',
      source: 'Marshall Swift'
    },
    {
      id: 2,
      name: 'Commercial Building Cost Factors',
      type: 'Commercial',
      region: 'Benton County',
      version: '2025.1',
      records: 1523,
      lastUpdated: '2025-05-28',
      status: 'active',
      source: 'RS Means'
    },
    {
      id: 3,
      name: 'Agricultural Structure Costs',
      type: 'Agricultural',
      region: 'Benton County',
      version: '2024.4',
      records: 687,
      lastUpdated: '2025-05-15',
      status: 'active',
      source: 'Local Survey'
    },
    {
      id: 4,
      name: 'Industrial Facility Matrix',
      type: 'Industrial',
      region: 'Benton County',
      version: '2025.1',
      records: 892,
      lastUpdated: '2025-06-03',
      status: 'pending',
      source: 'Marshall Swift'
    }
  ];

  const stats = [
    { label: 'Total Matrices', value: '4', color: 'text-sky-400' },
    { label: 'Active Records', value: '5,949', color: 'text-emerald-400' },
    { label: 'Last Sync', value: 'Jun 3', color: 'text-slate-300' },
    { label: 'Coverage', value: '98.5%', color: 'text-emerald-400' }
  ];

  const filteredMatrices = matrices.filter(matrix =>
    matrix.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matrix.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Cost Matrix Management</h1>
          <p className="text-slate-400 mt-1">Manage building cost matrices and data sources</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Matrix
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Matrix
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Database className="h-8 w-8 text-sky-400" />
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search matrices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Cost Matrices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Matrix Name</TableHead>
                <TableHead className="text-slate-300">Type</TableHead>
                <TableHead className="text-slate-300">Version</TableHead>
                <TableHead className="text-slate-300">Records</TableHead>
                <TableHead className="text-slate-300">Source</TableHead>
                <TableHead className="text-slate-300">Last Updated</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatrices.map((matrix) => (
                <TableRow key={matrix.id} className="border-slate-700 hover:bg-slate-700/30">
                  <TableCell className="text-slate-100 font-medium">{matrix.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-sky-500/30 text-sky-400">
                      {matrix.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-300">{matrix.version}</TableCell>
                  <TableCell className="text-slate-300">{matrix.records.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-300">{matrix.source}</TableCell>
                  <TableCell className="text-slate-300">{matrix.lastUpdated}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={matrix.status === 'active' 
                        ? 'border-emerald-500/30 text-emerald-400' 
                        : 'border-yellow-500/30 text-yellow-400'}
                    >
                      {matrix.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Matrix Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Data Completeness</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700 rounded-full">
                    <div className="w-[95%] h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-emerald-400 text-sm">95%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Data Quality</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700 rounded-full">
                    <div className="w-[98%] h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-emerald-400 text-sm">98%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Sync Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-700 rounded-full">
                    <div className="w-[100%] h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                  <span className="text-emerald-400 text-sm">100%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 text-lg">Recent Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">Industrial Matrix Updated</div>
                  <div className="text-xs text-slate-400">892 new records added</div>
                </div>
                <div className="text-xs text-slate-400">Jun 3</div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">Residential Matrix Synced</div>
                  <div className="text-xs text-slate-400">2,847 records validated</div>
                </div>
                <div className="text-xs text-slate-400">Jun 1</div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-100">Commercial Matrix Review</div>
                  <div className="text-xs text-slate-400">Quality check in progress</div>
                </div>
                <div className="text-xs text-slate-400">May 28</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MatrixPage;