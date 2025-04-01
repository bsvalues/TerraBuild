/**
 * DataPointExplorer Component
 * 
 * A component that enhances charts and visualizations with micro-interactions
 * for exploring data points. It provides tooltips, popover details, animations,
 * and context-aware information when users interact with data visualizations.
 */

import React, { useState, useRef, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Maximize2, X, ZoomIn } from 'lucide-react';

// Types for data point information
export interface DataPoint {
  id: string | number;
  label: string;
  value: number;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  relatedPoints?: string[] | number[];
}

interface DataPointExplorerProps {
  children: ReactNode;
  dataPoint: DataPoint;
  renderTooltip?: (dataPoint: DataPoint) => ReactNode;
  renderPopover?: (dataPoint: DataPoint) => ReactNode;
  onExplore?: (dataPoint: DataPoint) => void;
  onFocus?: (dataPoint: DataPoint) => void;
  tooltipPlacement?: 'top' | 'right' | 'bottom' | 'left';
  showAnimation?: boolean;
  highlightRelated?: boolean;
  showDetailOnClick?: boolean;
}

export function DataPointExplorer({
  children,
  dataPoint,
  renderTooltip,
  renderPopover,
  onExplore,
  onFocus,
  tooltipPlacement = 'top',
  showAnimation = true,
  highlightRelated = false,
  showDetailOnClick = true,
}: DataPointExplorerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Default tooltip renderer if none provided
  const defaultTooltipRenderer = (dataPoint: DataPoint) => (
    <div className="flex flex-col">
      <div className="font-medium">{dataPoint.label}</div>
      <div className="text-sm text-muted-foreground flex items-center">
        {dataPoint.category && (
          <Badge variant="outline" className="mr-2 text-xs">
            {dataPoint.category}
          </Badge>
        )}
        <span className="font-semibold">{formatValue(dataPoint.value)}</span>
        {dataPoint.trend && (
          <span className={`ml-2 ${getTrendColor(dataPoint.trend)}`}>
            {getTrendArrow(dataPoint.trend)}
          </span>
        )}
      </div>
    </div>
  );

  // Default popover renderer if none provided
  const defaultPopoverRenderer = (dataPoint: DataPoint) => (
    <div className="w-64 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <Badge 
          variant="outline" 
          className={getDataPointColor(dataPoint)}
        >
          {dataPoint.category || 'Data Point'}
        </Badge>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => {
            setIsPopoverOpen(false);
            onExplore?.(dataPoint);
          }}
        >
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
      
      <h4 className="font-medium text-sm mb-1">{dataPoint.label}</h4>
      
      <div className="flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Value:</span>
          <span className="text-sm font-medium">{formatValue(dataPoint.value)}</span>
        </div>
        
        {dataPoint.metadata && Object.entries(dataPoint.metadata).map(([key, value]) => (
          <div key={key} className="flex justify-between">
            <span className="text-sm text-muted-foreground">{formatKey(key)}:</span>
            <span className="text-sm">{formatMetadataValue(value)}</span>
          </div>
        ))}
      </div>
      
      {dataPoint.description && (
        <p className="text-xs text-muted-foreground mt-2 border-t pt-2">
          {dataPoint.description}
        </p>
      )}
    </div>
  );

  // Detail card for expanded view
  const DetailCard = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onClick={() => setIsDetailOpen(false)}
    >
      <Card 
        className="w-full max-w-md mx-4 shadow-lg" 
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => setIsDetailOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle>{dataPoint.label}</CardTitle>
          <CardDescription>
            Detailed information about this data point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Value</span>
              <div className="flex items-center">
                <span className="text-lg font-semibold">
                  {formatValue(dataPoint.value)}
                </span>
                {dataPoint.trend && (
                  <span className={`ml-2 ${getTrendColor(dataPoint.trend)}`}>
                    {getTrendArrow(dataPoint.trend)}
                  </span>
                )}
              </div>
            </div>
            
            {dataPoint.category && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Category</span>
                <Badge variant="outline">{dataPoint.category}</Badge>
              </div>
            )}
            
            {dataPoint.metadata && Object.entries(dataPoint.metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="font-medium">{formatKey(key)}</span>
                <span>{formatMetadataValue(value)}</span>
              </div>
            ))}
            
            {dataPoint.description && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm">{dataPoint.description}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setIsDetailOpen(false);
              onExplore?.(dataPoint);
            }}
          >
            Explore Further
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  // Animation styles for the data point
  const animationProps = showAnimation ? {
    scale: isHovered ? 1.05 : 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  } : {};

  // Handle data point click
  const handleClick = () => {
    if (showDetailOnClick) {
      setIsDetailOpen(true);
    }
    onFocus?.(dataPoint);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={150}>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <motion.div
                  ref={triggerRef}
                  className="cursor-pointer inline-block relative"
                  animate={animationProps}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onClick={handleClick}
                >
                  {children}
                  {isHovered && highlightRelated && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-500 rounded-full w-2 h-2 animate-ping"></span>
                  )}
                </motion.div>
              </PopoverTrigger>
            </TooltipTrigger>
            
            <TooltipContent side={tooltipPlacement} className="z-50">
              {renderTooltip ? renderTooltip(dataPoint) : defaultTooltipRenderer(dataPoint)}
            </TooltipContent>
            
            <PopoverContent className="z-50 p-3">
              {renderPopover ? renderPopover(dataPoint) : defaultPopoverRenderer(dataPoint)}
            </PopoverContent>
          </Popover>
        </Tooltip>
      </TooltipProvider>
      
      <AnimatePresence>
        {isDetailOpen && <DetailCard />}
      </AnimatePresence>
    </>
  );
}

// Helper functions
function formatValue(value: number): string {
  // Format based on magnitude
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  } else if (value % 1 === 0) {
    return `$${value.toFixed(0)}`;
  } else {
    return `$${value.toFixed(2)}`;
  }
}

function formatKey(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase());
}

function formatMetadataValue(value: any): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function getTrendArrow(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '→';
  }
}

function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up': return 'text-green-500';
    case 'down': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

function getDataPointColor(dataPoint: DataPoint): string {
  if (dataPoint.color) {
    return dataPoint.color;
  }
  
  if (dataPoint.trend === 'up') {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  
  if (dataPoint.trend === 'down') {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  
  return 'bg-blue-100 text-blue-800 border-blue-200';
}