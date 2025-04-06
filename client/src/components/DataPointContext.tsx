import React, { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info, HelpCircle, BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataPointContextProps {
  /**
   * The value to display
   */
  value: string | number;
  
  /**
   * Optional contextual information about the data point
   */
  context?: string;
  
  /**
   * Optional detailed explanation of the data point
   */
  explanation?: string;
  
  /**
   * Optional historical or trend data for this value
   */
  trendData?: Array<{
    date: string;
    value: number;
  }>;
  
  /**
   * Optional breakdown data showing composition of this value
   */
  breakdownData?: Array<{
    label: string;
    value: number;
    percentage: number;
  }>;
  
  /**
   * The type of contextual component to use
   */
  contextType?: 'tooltip' | 'hovercard' | 'popover';
  
  /**
   * Optional CSS class name for the wrapper element
   */
  className?: string;
  
  /**
   * Optional CSS class name for the value text
   */
  valueClassName?: string;
  
  /**
   * Show a visual indicator for the data point (icon)
   */
  showIndicator?: boolean;
  
  /**
   * Animation effect when user interacts with the data point
   */
  interactionEffect?: 'pulse' | 'glow' | 'expand' | 'highlight' | 'none';
  
  /**
   * Format for data display (affects how the value is processed)
   */
  format?: 'currency' | 'percentage' | 'number' | 'text' | 'date';
  
  /**
   * Optional threshold values to style the data point differently
   */
  thresholds?: {
    low?: number;
    medium?: number;
    high?: number;
  };
  
  /**
   * Custom render function for the content of the hover state
   */
  renderContent?: (value: string | number) => React.ReactNode;
  
  /**
   * Optional callback when the user interacts with the data point
   */
  onInteraction?: (type: 'hover' | 'click', value: string | number) => void;
}

/**
 * DataPointContext provides contextual micro-interactions for complex data points
 * It enhances data understanding by showing additional context, explanations, and
 * visual feedback when users interact with the data.
 */
const DataPointContext: React.FC<DataPointContextProps> = ({
  value,
  context,
  explanation,
  trendData,
  breakdownData,
  contextType = 'tooltip',
  className = '',
  valueClassName = '',
  showIndicator = true,
  interactionEffect = 'pulse',
  format = 'text',
  thresholds,
  renderContent,
  onInteraction,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  // Format the displayed value based on the specified format
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') {
      return format === 'date' ? new Date(val).toLocaleDateString() : val;
    }
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(val);
      case 'percentage':
        return new Intl.NumberFormat('en-US', {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(val / 100);
      case 'number':
        return new Intl.NumberFormat('en-US').format(val);
      default:
        return String(val);
    }
  };

  // Get the appropriate color based on the thresholds
  const getThresholdClass = (): string => {
    if (!thresholds || typeof value !== 'number') return '';
    
    if (thresholds.high && value >= thresholds.high) {
      return 'text-red-600 font-medium';
    } else if (thresholds.medium && value >= thresholds.medium) {
      return 'text-amber-600 font-medium';
    } else if (thresholds.low && value >= thresholds.low) {
      return 'text-green-600 font-medium';
    }
    
    return '';
  };

  // Get the appropriate interaction effect class
  const getInteractionEffectClass = (): string => {
    if (!isHovered) return '';
    
    switch (interactionEffect) {
      case 'pulse':
        return 'animate-pulse';
      case 'glow':
        return 'shadow-lg shadow-primary/40';
      case 'expand':
        return 'scale-110';
      case 'highlight':
        return 'bg-primary/10 rounded';
      default:
        return '';
    }
  };

  // Handle hover and click interactions
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onInteraction) {
      console.log('Hover interaction triggered:', value);
      onInteraction('hover', value);
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    // Prevent event propagation which could interfere with Popover
    e.stopPropagation();
    
    console.log('Click interaction triggered:', value);
    setIsClicked(!isClicked);
    
    if (onInteraction) {
      onInteraction('click', value);
    }
  };

  // Get the appropriate indicator icon
  const getIndicatorIcon = () => {
    // Show trend icon if trend data is available
    if (trendData) {
      return <TrendingUp className="h-4 w-4 text-primary/60" />;
    }
    
    // Show breakdown icon if breakdown data is available
    if (breakdownData) {
      return <BarChart3 className="h-4 w-4 text-primary/60" />;
    }
    
    // Default info icon
    if (context || explanation) {
      return <Info className="h-4 w-4 text-primary/60" />;
    }
    
    return <HelpCircle className="h-4 w-4 text-primary/60" />;
  };

  // Render the content of the tooltip/hovercard/popover
  const renderContextContent = () => {
    if (renderContent) {
      return renderContent(value);
    }
    
    return (
      <div className="flex flex-col gap-2 p-1 max-w-xs">
        {context && (
          <div className="text-sm font-medium">{context}</div>
        )}
        
        {explanation && (
          <div className="text-xs text-muted-foreground">{explanation}</div>
        )}
        
        {trendData && (
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Trend</div>
            <div className="h-16 w-full flex items-end gap-1">
              {trendData.map((point, index) => {
                // Find the max value to normalize heights
                const maxValue = Math.max(...trendData.map(p => p.value));
                const height = point.value > 0 ? (point.value / maxValue) * 100 : 5;
                
                return (
                  <div 
                    key={index} 
                    className="relative group"
                    style={{ height: '100%', flex: 1 }}
                  >
                    <div 
                      className="absolute bottom-0 w-full bg-primary/80 rounded-t transition-all duration-200"
                      style={{ height: `${height}%` }}
                    ></div>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] font-medium bg-primary text-white px-1 py-0.5 rounded">
                      {formatValue(point.value)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
              <span>{trendData[0]?.date}</span>
              <span>{trendData[trendData.length - 1]?.date}</span>
            </div>
          </div>
        )}
        
        {breakdownData && (
          <div className="mt-2">
            <div className="text-xs font-medium mb-1">Breakdown</div>
            <div className="space-y-1">
              {breakdownData.map((item, index) => (
                <div key={index} className="flex flex-col">
                  <div className="flex justify-between text-[11px]">
                    <span>{item.label}</span>
                    <span className="font-medium">{formatValue(item.value)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Wrapper for the content with different contextual components
  const renderWrapper = () => {
    const wrappedContent = (
      <div 
        className={cn(
          'inline-flex items-center gap-1 transition-all duration-200',
          getInteractionEffectClass(),
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <span className={cn('transition-colors', getThresholdClass(), valueClassName)}>
          {formatValue(value)}
        </span>
        {showIndicator && getIndicatorIcon()}
      </div>
    );

    switch (contextType) {
      case 'tooltip':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {wrappedContent}
              </TooltipTrigger>
              <TooltipContent className="z-50">
                {renderContextContent()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'hovercard':
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              {wrappedContent}
            </HoverCardTrigger>
            <HoverCardContent className="w-auto p-2">
              {renderContextContent()}
            </HoverCardContent>
          </HoverCard>
        );
      case 'popover':
        return (
          <Popover open={isClicked} onOpenChange={setIsClicked}>
            <PopoverTrigger asChild>
              {wrappedContent}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              {renderContextContent()}
            </PopoverContent>
          </Popover>
        );
      default:
        return wrappedContent;
    }
  };

  return renderWrapper();
};

export default DataPointContext;