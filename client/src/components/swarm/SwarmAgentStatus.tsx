/**
 * TerraBuild AI Swarm - Agent Status Component
 * 
 * This component displays the status of all agents in the AI Swarm.
 */

import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BarChart, FileText, Activity, Clock } from 'lucide-react';

interface SwarmAgentStatusProps {
  agents: Array<{
    id: string;
    name: string;
    active: boolean;
    pendingTasks: number;
    processingTasks: number;
  }>;
}

export function SwarmAgentStatus({ agents }: SwarmAgentStatusProps) {
  if (!agents || agents.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No agents available or swarm is not active.
      </div>
    );
  }
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Agent</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Pending Tasks</TableHead>
            <TableHead className="text-right">Processing Tasks</TableHead>
            <TableHead className="text-right">Capability</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  {getAgentIcon(agent.name)}
                  <span className="ml-2">{agent.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={agent.active ? "success" : "secondary"}>
                  {agent.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{agent.pendingTasks}</TableCell>
              <TableCell className="text-right">{agent.processingTasks}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{getAgentCapability(agent.name)}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function getAgentIcon(agentName: string) {
  const name = agentName.toLowerCase();
  
  if (name.includes('factor') || name.includes('benchmark')) {
    return <BarChart className="h-4 w-4 text-blue-500" />;
  } else if (name.includes('curve')) {
    return <Activity className="h-4 w-4 text-green-500" />;
  } else if (name.includes('scenario')) {
    return <FileText className="h-4 w-4 text-purple-500" />;
  } else {
    return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function getAgentCapability(agentName: string) {
  const name = agentName.toLowerCase();
  
  if (name.includes('factor')) {
    return 'Cost Optimization';
  } else if (name.includes('benchmark')) {
    return 'Quality Control';
  } else if (name.includes('curve')) {
    return 'Pattern Analysis';
  } else if (name.includes('scenario')) {
    return 'Forecasting';
  } else if (name.includes('boe')) {
    return 'Documentation';
  } else {
    return 'General';
  }
}