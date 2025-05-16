import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Power,
  Zap, 
  BarChart, 
  Settings, 
  Check,
  X,
  Play,
  Pause,
  RefreshCw,
  Info,
  AlertTriangle,
  PieChart,
  HelpCircle,
  MessageSquare,
  CloudRain,
  Activity,
  Database,
  LineChart,
  SearchCheck,
  Cpu,
  BrainCircuit,
  ClipboardEdit,
  Code,
  ServerCrash,
  Workflow
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample agent data
const agents = [
  {
    id: 'data-analysis-agent',
    name: 'Data Analysis Agent',
    description: 'Performs advanced data analysis and generates insights',
    type: 'analysis',
    status: 'active',
    version: '1.2.0',
    lastActive: '2025-05-16 12:45 PM',
    cpu: 2.4,
    memory: 128,
    capabilities: ['data:analyze', 'data:query:generate', 'data:schema:optimize'],
    owner: 'system',
    icon: PieChart,
  },
  {
    id: 'design-agent',
    name: 'Design Agent',
    description: 'Creates and optimizes UI/UX design elements',
    type: 'design',
    status: 'active',
    version: '1.0.5',
    lastActive: '2025-05-16 10:30 AM',
    cpu: 1.8,
    memory: 96,
    capabilities: ['design:request', 'accessibility:request'],
    owner: 'system',
    icon: ClipboardEdit,
  },
  {
    id: 'development-agent',
    name: 'Development Agent',
    description: 'Generates, refactors, and analyzes code',
    type: 'development',
    status: 'active',
    version: '1.3.2',
    lastActive: '2025-05-16 11:15 AM',
    cpu: 3.1,
    memory: 156,
    capabilities: ['code:request:generate', 'code:request:refactor', 'code:request:analyze'],
    owner: 'system',
    icon: Code,
  },
  {
    id: 'cost-analysis-agent',
    name: 'Cost Analysis Agent',
    description: 'Performs cost calculations and analysis for property valuations',
    type: 'cost',
    status: 'active',
    version: '1.1.0',
    lastActive: '2025-05-16 01:30 PM',
    cpu: 2.7,
    memory: 142,
    capabilities: ['cost:calculate', 'cost:analyze', 'cost:validate'],
    owner: 'system',
    icon: BarChart,
  },
  {
    id: 'compliance-agent',
    name: 'Compliance Agent',
    description: 'Validates data against compliance standards and regulations',
    type: 'compliance',
    status: 'inactive',
    version: '0.9.5',
    lastActive: '2025-05-15 03:20 PM',
    cpu: 0,
    memory: 0,
    capabilities: ['compliance:validate', 'compliance:report', 'compliance:remediate'],
    owner: 'system',
    icon: SearchCheck,
  },
  {
    id: 'data-quality-agent',
    name: 'Data Quality Agent',
    description: 'Monitors and improves data quality across the system',
    type: 'data',
    status: 'error',
    version: '1.0.2',
    lastActive: '2025-05-16 09:45 AM',
    cpu: 0,
    memory: 0,
    capabilities: ['quality:validate', 'quality:enhance', 'quality:monitor'],
    owner: 'system',
    icon: Database,
  },
  {
    id: 'mapping-agent',
    name: 'Mapping Agent',
    description: 'Handles geographic mapping and spatial data analysis',
    type: 'geo',
    status: 'maintenance',
    version: '0.8.4',
    lastActive: '2025-05-14 02:10 PM',
    cpu: 0,
    memory: 0,
    capabilities: ['geo:map', 'geo:analyze', 'geo:validate'],
    owner: 'system',
    icon: CloudRain,
  }
];

// Sample agent logs
const agentLogs = [
  {
    id: 1,
    agentId: 'data-analysis-agent',
    timestamp: '2025-05-16 12:45:23',
    level: 'info',
    message: 'Successfully analyzed property data for Richland region',
  },
  {
    id: 2,
    agentId: 'cost-analysis-agent',
    timestamp: '2025-05-16 12:42:11',
    level: 'info',
    message: 'Calculated cost factors for commercial properties in region 52100 140',
  },
  {
    id: 3,
    agentId: 'data-quality-agent',
    timestamp: '2025-05-16 12:40:05',
    level: 'error',
    message: 'Failed to validate property records due to missing region codes',
  },
  {
    id: 4,
    agentId: 'development-agent',
    timestamp: '2025-05-16 12:38:47',
    level: 'info',
    message: 'Generated query for property trend analysis in the township 10N-24E',
  },
  {
    id: 5,
    agentId: 'design-agent',
    timestamp: '2025-05-16 12:35:30',
    level: 'info',
    message: 'Optimized chart layout for accessibility compliance',
  },
  {
    id: 6,
    agentId: 'data-analysis-agent',
    timestamp: '2025-05-16 12:30:19',
    level: 'warning',
    message: 'Some property records contain outdated assessment values',
  },
  {
    id: 7,
    agentId: 'cost-analysis-agent',
    timestamp: '2025-05-16 12:25:55',
    level: 'info',
    message: 'Updated cost matrix with new values for region 52100 320',
  },
];

// Sample agent tasks
const agentTasks = [
  {
    id: 'task-001',
    agentId: 'data-analysis-agent',
    name: 'Quarterly Property Value Analysis',
    status: 'running',
    progress: 65,
    startTime: '2025-05-16 12:30:00',
    estimatedCompletion: '2025-05-16 13:15:00',
    priority: 'high',
  },
  {
    id: 'task-002',
    agentId: 'cost-analysis-agent',
    name: 'Cost Matrix Validation',
    status: 'queued',
    progress: 0,
    startTime: null,
    estimatedCompletion: null,
    priority: 'medium',
  },
  {
    id: 'task-003',
    agentId: 'development-agent',
    name: 'Generate Region Mapping Code',
    status: 'completed',
    progress: 100,
    startTime: '2025-05-16 11:45:00',
    estimatedCompletion: '2025-05-16 12:00:00',
    priority: 'medium',
  },
  {
    id: 'task-004',
    agentId: 'design-agent',
    name: 'Optimize Dashboard UI Components',
    status: 'paused',
    progress: 45,
    startTime: '2025-05-16 10:20:00',
    estimatedCompletion: null,
    priority: 'low',
  },
  {
    id: 'task-005',
    agentId: 'data-quality-agent',
    name: 'Property Record Validation',
    status: 'failed',
    progress: 32,
    startTime: '2025-05-16 09:30:00',
    estimatedCompletion: null,
    priority: 'high',
  },
];

const AgentsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  
  // Filter agents based on search and inactive setting
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!showInactive && agent.status !== 'active') {
      return false;
    }
    
    return matchesSearch;
  });

  // Get agent by ID
  const getAgentById = (id: string) => {
    return agents.find(agent => agent.id === id);
  };
  
  // Filter logs for a specific agent
  const getAgentLogs = (agentId: string) => {
    return agentLogs.filter(log => log.agentId === agentId);
  };
  
  // Filter tasks for a specific agent
  const getAgentTasks = (agentId: string) => {
    return agentTasks.filter(task => task.agentId === agentId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-100">Agent Management</h1>
        <Button variant="outline" className="text-blue-200 border-blue-700">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-blue-900/50 border border-blue-800/40">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-800/50">
            <Bot className="h-4 w-4 mr-2" />
            Agent Overview
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-800/50">
            <MessageSquare className="h-4 w-4 mr-2" />
            Agent Logs
          </TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-800/50">
            <Activity className="h-4 w-4 mr-2" />
            Active Tasks
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-800/50">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-blue-100">MCP Agent Status</CardTitle>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="show-inactive" className="text-blue-300 text-sm">Show Inactive</Label>
                  <Switch 
                    id="show-inactive" 
                    checked={showInactive}
                    onCheckedChange={setShowInactive}
                  />
                </div>
              </div>
              <CardDescription className="text-blue-300">
                Monitor and manage intelligent agents in the Model Content Protocol system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Input
                  placeholder="Search agents..."
                  className="pl-8 bg-blue-900/50 border-blue-700/50 text-blue-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <SearchCheck className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-400" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAgents.map(agent => (
                  <Card 
                    key={agent.id} 
                    className={`bg-blue-900/40 border-blue-800/40 hover:bg-blue-900/50 transition-colors cursor-pointer ${
                      selectedAgent === agent.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedAgent(agent.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-blue-800/50 mr-3">
                            <agent.icon className="h-5 w-5 text-blue-300" />
                          </div>
                          <div>
                            <CardTitle className="text-blue-100 text-base">{agent.name}</CardTitle>
                            <CardDescription className="text-blue-400 text-xs">
                              {agent.id}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge 
                          className={
                            agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 
                            agent.status === 'inactive' ? 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30' :
                            agent.status === 'error' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                            'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                          }
                        >
                          {agent.status === 'active' ? (
                            <><Power className="h-3 w-3 mr-1" /> Active</>
                          ) : agent.status === 'inactive' ? (
                            <><Pause className="h-3 w-3 mr-1" /> Inactive</>
                          ) : agent.status === 'error' ? (
                            <><AlertTriangle className="h-3 w-3 mr-1" /> Error</>
                          ) : (
                            <><RefreshCw className="h-3 w-3 mr-1" /> Maintenance</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-blue-300 text-sm mb-3">{agent.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-400">
                        <div>
                          <span className="block">Version</span>
                          <span className="text-blue-200">{agent.version}</span>
                        </div>
                        <div>
                          <span className="block">Type</span>
                          <span className="text-blue-200">{agent.type}</span>
                        </div>
                        <div>
                          <span className="block">Last Active</span>
                          <span className="text-blue-200">{agent.lastActive || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="block">Capabilities</span>
                          <span className="text-blue-200">{agent.capabilities.length}</span>
                        </div>
                      </div>
                      {agent.status === 'active' && (
                        <div className="mt-3 space-y-2">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-400">CPU</span>
                              <span className="text-blue-300">{agent.cpu}%</span>
                            </div>
                            <div className="w-full h-1 bg-blue-900/70 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(agent.cpu / 10) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-blue-400">Memory</span>
                              <span className="text-blue-300">{agent.memory} MB</span>
                            </div>
                            <div className="w-full h-1 bg-blue-900/70 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(agent.memory / 200) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs text-blue-300 border-blue-800/60"
                      >
                        <Info className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      {agent.status === 'active' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-xs bg-red-900/50 hover:bg-red-900/70 text-red-300"
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      ) : agent.status === 'inactive' || agent.status === 'maintenance' ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-300"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-amber-700/50 text-amber-300"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {filteredAgents.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Bot className="h-12 w-12 text-blue-700/50 mb-4" />
                  <h3 className="text-lg font-medium text-blue-200 mb-1">No agents found</h3>
                  <p className="text-blue-400">
                    No agents match your current search criteria.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedAgent && (
            <Card className="bg-blue-900/30 border-blue-800/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-lg bg-blue-800/50 mr-3">
                      {getAgentById(selectedAgent)?.icon && (
                        <div className="h-5 w-5 text-blue-300">
                          {React.createElement(getAgentById(selectedAgent)!.icon)}
                        </div>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-blue-100">{getAgentById(selectedAgent)?.name}</CardTitle>
                      <CardDescription className="text-blue-400">
                        Agent ID: {selectedAgent}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge 
                    className={
                      getAgentById(selectedAgent)?.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 
                      getAgentById(selectedAgent)?.status === 'inactive' ? 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30' :
                      getAgentById(selectedAgent)?.status === 'error' ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' :
                      'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    }
                  >
                    {getAgentById(selectedAgent)?.status === 'active' ? (
                      <><Power className="h-3 w-3 mr-1" /> Active</>
                    ) : getAgentById(selectedAgent)?.status === 'inactive' ? (
                      <><Pause className="h-3 w-3 mr-1" /> Inactive</>
                    ) : getAgentById(selectedAgent)?.status === 'error' ? (
                      <><AlertTriangle className="h-3 w-3 mr-1" /> Error</>
                    ) : (
                      <><RefreshCw className="h-3 w-3 mr-1" /> Maintenance</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-blue-200 font-medium">Agent Details</h3>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-blue-400">Type:</span>
                          <span className="text-blue-200">{getAgentById(selectedAgent)?.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-400">Version:</span>
                          <span className="text-blue-200">{getAgentById(selectedAgent)?.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-400">Owner:</span>
                          <span className="text-blue-200">{getAgentById(selectedAgent)?.owner}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-400">Last Active:</span>
                          <span className="text-blue-200">{getAgentById(selectedAgent)?.lastActive || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-blue-200 font-medium">Capabilities</h3>
                      <div className="space-y-1">
                        {getAgentById(selectedAgent)?.capabilities.map((capability, index) => (
                          <div key={index} className="flex items-center">
                            <Check className="h-3 w-3 text-emerald-400 mr-2" />
                            <span className="text-blue-200">{capability}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-blue-200 font-medium">Resource Usage</h3>
                      {getAgentById(selectedAgent)?.status === 'active' ? (
                        <>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-400">CPU Usage</span>
                              <span className="text-blue-300">{getAgentById(selectedAgent)?.cpu}%</span>
                            </div>
                            <div className="w-full h-2 bg-blue-900/70 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(getAgentById(selectedAgent)?.cpu || 0) / 10 * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-400">Memory Usage</span>
                              <span className="text-blue-300">{getAgentById(selectedAgent)?.memory} MB</span>
                            </div>
                            <div className="w-full h-2 bg-blue-900/70 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ width: `${(getAgentById(selectedAgent)?.memory || 0) / 200 * 100}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-blue-400">Task Queue</span>
                              <span className="text-blue-300">
                                {getAgentTasks(selectedAgent).filter(task => task.status === 'queued').length} pending
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-blue-400 text-sm italic">
                          Resource information unavailable while agent is {getAgentById(selectedAgent)?.status}.
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator className="bg-blue-800/40" />

                  <div className="space-y-3">
                    <h3 className="text-blue-200 font-medium">Recent Activity</h3>
                    
                    {getAgentLogs(selectedAgent).length > 0 ? (
                      <div className="space-y-2">
                        {getAgentLogs(selectedAgent).slice(0, 3).map((log, index) => (
                          <div key={index} className="p-2 bg-blue-900/30 rounded-md border border-blue-800/40">
                            <div className="flex items-start">
                              <div className="mr-2 mt-0.5">
                                {log.level === 'info' ? (
                                  <Info className="h-4 w-4 text-blue-400" />
                                ) : log.level === 'warning' ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                                ) : (
                                  <X className="h-4 w-4 text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-blue-200 text-sm">{log.message}</p>
                                <span className="text-blue-500 text-xs">{log.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-blue-400 text-sm italic">
                        No recent activity logs for this agent.
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-blue-200 font-medium">Active Tasks</h3>
                    
                    {getAgentTasks(selectedAgent).filter(task => task.status === 'running' || task.status === 'queued').length > 0 ? (
                      <div className="space-y-2">
                        {getAgentTasks(selectedAgent)
                          .filter(task => task.status === 'running' || task.status === 'queued')
                          .map((task, index) => (
                            <div key={index} className="p-3 bg-blue-900/30 rounded-md border border-blue-800/40">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="text-blue-100 font-medium">{task.name}</h4>
                                  <div className="flex items-center space-x-2 text-xs">
                                    <Badge 
                                      className={
                                        task.status === 'running' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 
                                        'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                      }
                                    >
                                      {task.status === 'running' ? (
                                        <><Play className="h-3 w-3 mr-1" /> Running</>
                                      ) : (
                                        <><Pause className="h-3 w-3 mr-1" /> Queued</>
                                      )}
                                    </Badge>
                                    <span className="text-blue-400">
                                      Priority: {task.priority}
                                    </span>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <Settings className="h-4 w-4 text-blue-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-blue-950 border-blue-800">
                                    <DropdownMenuItem className="text-blue-200 hover:text-blue-100 hover:bg-blue-900">
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause Task
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-blue-200 hover:text-blue-100 hover:bg-blue-900">
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel Task
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-blue-800/40" />
                                    <DropdownMenuItem className="text-blue-200 hover:text-blue-100 hover:bg-blue-900">
                                      <Info className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              {task.status === 'running' && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-blue-400">Progress</span>
                                    <span className="text-blue-300">{task.progress}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-blue-900/70 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500" 
                                      style={{ width: `${task.progress}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-xs text-blue-500">
                                    <span>Started: {task.startTime}</span>
                                    <span>Est. completion: {task.estimatedCompletion || 'Unknown'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-blue-400 text-sm italic">
                        No active tasks for this agent.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="text-blue-200 border-blue-700"
                  onClick={() => setSelectedAgent(null)}
                >
                  Back to Overview
                </Button>
                <div className="space-x-2">
                  {getAgentById(selectedAgent)?.status === 'active' ? (
                    <Button variant="destructive" className="bg-red-900/50 hover:bg-red-900/70 text-red-300">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause Agent
                    </Button>
                  ) : getAgentById(selectedAgent)?.status === 'inactive' || getAgentById(selectedAgent)?.status === 'maintenance' ? (
                    <Button variant="default" className="bg-emerald-900/50 hover:bg-emerald-900/70 text-emerald-300">
                      <Play className="h-4 w-4 mr-2" />
                      Start Agent
                    </Button>
                  ) : (
                    <Button variant="outline" className="border-amber-700/50 text-amber-300">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Restart Agent
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Agent Logs</CardTitle>
              <CardDescription className="text-blue-300">
                View and filter logs from all agents in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <Label htmlFor="agent-filter" className="text-blue-200 text-sm">Agent</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="agent-filter" className="bg-blue-900/50 border-blue-700/50 text-blue-100 mt-1">
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="all">All Agents</SelectItem>
                      {agents.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="level-filter" className="text-blue-200 text-sm">Log Level</Label>
                  <Select defaultValue="all">
                    <SelectTrigger id="level-filter" className="bg-blue-900/50 border-blue-700/50 text-blue-100 mt-1">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date-filter" className="text-blue-200 text-sm">Date Range</Label>
                  <Select defaultValue="today">
                    <SelectTrigger id="date-filter" className="bg-blue-900/50 border-blue-700/50 text-blue-100 mt-1">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border border-blue-800/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-900/50">
                    <TableRow className="hover:bg-blue-900/60 border-blue-800/60">
                      <TableHead className="text-blue-300 w-48">Timestamp</TableHead>
                      <TableHead className="text-blue-300 w-40">Agent</TableHead>
                      <TableHead className="text-blue-300 w-24">Level</TableHead>
                      <TableHead className="text-blue-300">Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentLogs.map((log, index) => (
                      <TableRow key={index} className="hover:bg-blue-900/40 border-blue-800/40">
                        <TableCell className="text-blue-400">{log.timestamp}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getAgentById(log.agentId)?.icon && (
                              <div className="h-4 w-4 text-blue-400">
                                {React.createElement(getAgentById(log.agentId)!.icon)}
                              </div>
                            )}
                            <span className="text-blue-200">{getAgentById(log.agentId)?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              log.level === 'info' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 
                              log.level === 'warning' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' :
                              'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }
                          >
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-blue-200">{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-blue-400 text-sm">
                  Showing 7 of 124 logs
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="border-blue-700 text-blue-300">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="border-blue-700 text-blue-300">
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Agent Tasks</CardTitle>
              <CardDescription className="text-blue-300">
                View and manage tasks being executed by agents in the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-900/40 border border-blue-800/40 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-900/60 p-2 rounded-full">
                      <Play className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-100">3</div>
                      <div className="text-blue-400 text-sm">Running</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/40 border border-blue-800/40 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-900/60 p-2 rounded-full">
                      <Pause className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-100">2</div>
                      <div className="text-blue-400 text-sm">Queued</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/40 border border-blue-800/40 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-900/60 p-2 rounded-full">
                      <Check className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-100">12</div>
                      <div className="text-blue-400 text-sm">Completed</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-900/40 border border-blue-800/40 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-900/60 p-2 rounded-full">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-blue-100">1</div>
                      <div className="text-blue-400 text-sm">Failed</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {agentTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="p-4 rounded-lg border border-blue-800/40 bg-blue-900/40"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <h3 className="text-blue-100 font-medium">{task.name}</h3>
                          <Badge 
                            className={`ml-3 ${
                              task.status === 'running' ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 
                              task.status === 'queued' ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' :
                              task.status === 'completed' ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                              'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            }`}
                          >
                            {task.status}
                          </Badge>
                          <Badge variant="outline" className="ml-2 bg-blue-900/20 border-blue-700/50 text-blue-300">
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center text-blue-400 text-sm">
                          <div className="flex items-center">
                            {getAgentById(task.agentId)?.icon && (
                              <getAgentById(task.agentId)!.icon className="h-4 w-4 mr-1 text-blue-500" />
                            )}
                            <span>{getAgentById(task.agentId)?.name}</span>
                          </div>
                          {task.startTime && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Started: {task.startTime}</span>
                            </>
                          )}
                          {task.estimatedCompletion && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Est. completion: {task.estimatedCompletion}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status === 'running' && (
                          <Button variant="outline" size="sm" className="border-blue-700 text-blue-300">
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}
                        {task.status === 'paused' && (
                          <Button variant="outline" size="sm" className="border-blue-700 text-blue-300">
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        {(task.status === 'running' || task.status === 'paused' || task.status === 'queued') && (
                          <Button variant="destructive" size="sm" className="bg-red-900/50 hover:bg-red-900/70 text-red-300">
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="border-blue-700 text-blue-300">
                          <Info className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                    
                    {task.status === 'running' && (
                      <div className="mt-4 space-y-1">
                        <div className="w-full h-2 bg-blue-900/70 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-blue-400">
                          <span>Progress: {task.progress}%</span>
                          {task.estimatedCompletion && <span>Completing soon</span>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-blue-900/30 border-blue-800/40">
            <CardHeader>
              <CardTitle className="text-blue-100">Agent System Settings</CardTitle>
              <CardDescription className="text-blue-300">
                Configure global settings for the Model Content Protocol agent system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-blue-100 font-medium">System Configuration</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="agent-monitoring" className="text-blue-300">
                          Agent Monitoring
                        </Label>
                        <Switch id="agent-monitoring" defaultChecked />
                      </div>
                      <p className="text-blue-500 text-xs">
                        Enables real-time monitoring of agent status and performance.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-recovery" className="text-blue-300">
                          Automatic Recovery
                        </Label>
                        <Switch id="auto-recovery" defaultChecked />
                      </div>
                      <p className="text-blue-500 text-xs">
                        Automatically restart agents that fail or become unresponsive.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="task-queuing" className="text-blue-300">
                          Task Queuing
                        </Label>
                        <Switch id="task-queuing" defaultChecked />
                      </div>
                      <p className="text-blue-500 text-xs">
                        Enable task queueing for improved performance under high load.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="polling-interval" className="text-blue-300">
                        Monitoring Interval (seconds)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="polling-interval" 
                          defaultValue="5" 
                          className="bg-blue-900/50 border-blue-700/50 text-blue-100" 
                        />
                        <Button className="bg-blue-700 hover:bg-blue-600">
                          Apply
                        </Button>
                      </div>
                      <p className="text-blue-500 text-xs">
                        How frequently agent status is checked (in seconds).
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-blue-100 font-medium">Resource Management</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-cpu" className="text-blue-300">
                        Max CPU Usage (% per agent)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="max-cpu" 
                          defaultValue="25" 
                          type="number" 
                          min="5" 
                          max="90"
                          className="bg-blue-900/50 border-blue-700/50 text-blue-100" 
                        />
                        <span className="text-blue-300">%</span>
                      </div>
                      <p className="text-blue-500 text-xs">
                        Maximum CPU utilization per agent before throttling occurs.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="max-memory" className="text-blue-300">
                        Max Memory Usage (MB per agent)
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Input 
                          id="max-memory" 
                          defaultValue="256" 
                          type="number" 
                          min="64" 
                          max="1024"
                          className="bg-blue-900/50 border-blue-700/50 text-blue-100" 
                        />
                        <span className="text-blue-300">MB</span>
                      </div>
                      <p className="text-blue-500 text-xs">
                        Maximum memory allocation per agent.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="concurrent-tasks" className="text-blue-300">
                        Max Concurrent Tasks
                      </Label>
                      <Input 
                        id="concurrent-tasks" 
                        defaultValue="5" 
                        type="number" 
                        min="1" 
                        max="20"
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100" 
                      />
                      <p className="text-blue-500 text-xs">
                        Maximum number of tasks that can run simultaneously.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="task-timeout" className="text-blue-300">
                        Task Timeout (minutes)
                      </Label>
                      <Input 
                        id="task-timeout" 
                        defaultValue="30" 
                        type="number" 
                        min="1" 
                        max="120"
                        className="bg-blue-900/50 border-blue-700/50 text-blue-100" 
                      />
                      <p className="text-blue-500 text-xs">
                        Maximum time a task can run before being terminated.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div className="space-y-4">
                  <h3 className="text-blue-100 font-medium">Agent Communication</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-blue-300">Communication Protocol</Label>
                    <Select defaultValue="mcp">
                      <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                        <SelectValue placeholder="Select protocol" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                        <SelectItem value="mcp">Model Content Protocol (MCP)</SelectItem>
                        <SelectItem value="rest">RESTful API</SelectItem>
                        <SelectItem value="events">Event-based Messaging</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-blue-500 text-xs">
                      Protocol used for inter-agent communication.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="secure-comms" className="text-blue-300">
                        Secure Communications
                      </Label>
                      <Switch id="secure-comms" defaultChecked />
                    </div>
                    <p className="text-blue-500 text-xs">
                      Enable encryption for all agent communications.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="fallback-mode" className="text-blue-300">
                        Communication Fallback Mode
                      </Label>
                      <Switch id="fallback-mode" defaultChecked />
                    </div>
                    <p className="text-blue-500 text-xs">
                      Automatically switch to alternative communication methods if primary fails.
                    </p>
                  </div>
                </div>
                
                <Separator className="bg-blue-800/40" />
                
                <div className="space-y-4">
                  <h3 className="text-blue-100 font-medium">Logging & Diagnostics</h3>
                  
                  <div className="space-y-2">
                    <Label className="text-blue-300">Log Level</Label>
                    <Select defaultValue="info">
                      <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                        <SelectValue placeholder="Select log level" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                        <SelectItem value="debug">Debug (Verbose)</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-blue-500 text-xs">
                      Minimum level of messages to be logged.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-blue-300">Log Retention</Label>
                    <Select defaultValue="30">
                      <SelectTrigger className="bg-blue-900/50 border-blue-700/50 text-blue-100">
                        <SelectValue placeholder="Select retention period" />
                      </SelectTrigger>
                      <SelectContent className="bg-blue-900 border-blue-700 text-blue-200">
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-blue-500 text-xs">
                      How long to keep agent logs before automatic deletion.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="performance-metrics" className="text-blue-300">
                        Performance Metrics Collection
                      </Label>
                      <Switch id="performance-metrics" defaultChecked />
                    </div>
                    <p className="text-blue-500 text-xs">
                      Collect and store agent performance metrics for analysis.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" className="border-blue-700 text-blue-200">
                Reset to Defaults
              </Button>
              <Button className="bg-blue-700 hover:bg-blue-600">
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentsPage;