
// AgentFeed.tsx
import React from 'react';
import { BrainCircuit, Activity, ChevronRight } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface AgentLog {
  agent: string;
  message: string;
  time: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'insight' | 'warning' | 'action';
}

const logs: AgentLog[] = [
  {
    agent: "SHAP Agent",
    message: "Key features driving valuation: square footage (42%), quality grade (27%), year built (15%)",
    time: "2 mins ago",
    variant: "insight"
  },
  {
    agent: "Data Quality Agent",
    message: "Found 3 inconsistent quality classifications in commercial zone B2",
    time: "Just now",
    variant: "warning"
  },
  {
    agent: "Regression Agent",
    message: "Model trained on 3,214 records. R² = 0.87, RMSE = 4.2%",
    time: "5 mins ago",
    variant: "default"
  },
  {
    agent: "Market Analysis Agent",
    message: "Regional multiplier for zone A3 updated from 1.03 to 1.05 based on recent transactions",
    time: "8 mins ago",
    variant: "action"
  },
  {
    agent: "Compliance Agent",
    message: "All valuations meet county regulatory requirements for 2025",
    time: "15 mins ago",
    variant: "default"
  }
];

export default function AgentFeed() {
  const getAgentIcon = (agent: string) => {
    if (agent.includes("SHAP")) return <BrainCircuit className="h-4 w-4" />;
    if (agent.includes("Regression")) return <Activity className="h-4 w-4" />;
    return <ChevronRight className="h-4 w-4" />;
  };

  const getVariantStyle = (variant: AgentLog['variant'] = 'default') => {
    switch (variant) {
      case 'insight':
        return 'bg-blue-50 border-blue-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'action':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <BrainCircuit className="h-5 w-5 mr-2 text-blue-600" />
          <span className="font-medium">AI Agent Activity</span>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          View All
        </Button>
      </div>

      <ScrollArea className="h-60">
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div 
              key={idx} 
              className={`p-3 border rounded-md ${getVariantStyle(log.variant)}`}
            >
              <div className="flex items-start">
                <Avatar className="h-6 w-6 mr-2">
                  <AvatarFallback className="text-xs">
                    {log.agent.substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-sm">{log.agent}</span>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                  <p className="text-sm">{log.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
