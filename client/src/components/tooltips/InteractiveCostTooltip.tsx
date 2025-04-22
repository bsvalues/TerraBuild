import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, DollarSign, Home, Building, Map, Clock, TrendingUp, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface TooltipProps {
  title: string;
  content: string;
  funFact?: string;
  impact: 'high' | 'medium' | 'low';
  children: React.ReactNode;
}

/**
 * Interactive tooltip component with playful explanations for cost factors
 */
const InteractiveCostTooltip = ({ title, content, funFact, impact, children }: TooltipProps) => {
  // Define impact colors
  const getImpactColor = () => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200';
    }
  };

  // Define impact icons
  const getImpactIcon = () => {
    switch (impact) {
      case 'high':
        return <ArrowUpCircle className="inline h-4 w-4 ml-1 text-red-600" />;
      case 'medium':
        return <TrendingUp className="inline h-4 w-4 ml-1 text-amber-600" />;
      case 'low':
        return <ArrowDownCircle className="inline h-4 w-4 ml-1 text-green-600" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center">
            {children}
            <HelpCircle className="h-4 w-4 ml-1 text-[#243E4D]/50 hover:text-[#243E4D] cursor-help transition-colors" />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          className="bg-white border border-gray-200 p-4 shadow-lg rounded-lg max-w-md"
          sideOffset={5}
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm text-[#243E4D]">{title}</h4>
              <Badge 
                variant="outline" 
                className={`text-xs ${getImpactColor()}`}
              >
                Cost Impact {getImpactIcon()}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{content}</p>
            {funFact && (
              <div className="bg-blue-50 p-2 rounded-md mt-2 text-xs text-blue-800 italic">
                <span className="font-bold">Fun Fact:</span> {funFact}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InteractiveCostTooltip;