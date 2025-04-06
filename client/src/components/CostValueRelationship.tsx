import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Scale, Zap, DollarSign, PercentIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import DataPointContext from './DataPointContext';

interface ValuePoint {
  label: string;
  cost: number;
  value: number;
  description?: string;
  category?: string;
}

interface CostValueRelationshipProps {
  /**
   * Title for the component
   */
  title?: string;
  
  /**
   * Description text
   */
  description?: string;
  
  /**
   * Array of cost-value points to display
   */
  dataPoints: ValuePoint[];
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Callback when a data point is selected
   */
  onSelectDataPoint?: (point: ValuePoint) => void;
  
  /**
   * Highlight specific categories
   */
  highlightCategories?: string[];
  
  /**
   * Maximum cost to display (for scaling)
   */
  maxCost?: number;
  
  /**
   * Maximum value to display (for scaling)
   */
  maxValue?: number;
}

/**
 * CostValueRelationship provides an interactive visualization of the relationship
 * between cost and value for different building components or features.
 */
const CostValueRelationship: React.FC<CostValueRelationshipProps> = ({
  title = "Cost-Value Analysis",
  description = "Explore the relationship between cost and value for different building components",
  dataPoints,
  className = "",
  onSelectDataPoint,
  highlightCategories = [],
  maxCost: propMaxCost,
  maxValue: propMaxValue
}) => {
  const [selectedPoint, setSelectedPoint] = useState<ValuePoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ValuePoint | null>(null);
  
  // Calculate max cost and value for scaling if not provided
  const maxCost = propMaxCost || Math.max(...dataPoints.map(point => point.cost)) * 1.1;
  const maxValue = propMaxValue || Math.max(...dataPoints.map(point => point.value)) * 1.1;
  
  // Format currency values
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage values
  const formatPercentage = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };
  
  // Calculate ROI (Return on Investment)
  const calculateROI = (cost: number, value: number): number => {
    return ((value - cost) / cost) * 100;
  };
  
  // Calculate the efficiency score (value per cost unit)
  const calculateEfficiency = (cost: number, value: number): number => {
    return value / cost;
  };
  
  // Handle click on a data point
  const handlePointClick = (point: ValuePoint, event: React.MouseEvent) => {
    // Prevent event bubbling
    event.stopPropagation();
    
    console.log('Clicked on data point:', point.label, point);
    
    // Toggle the selected point
    setSelectedPoint(prevSelected => 
      prevSelected?.label === point.label ? null : point
    );
    
    // Call the callback if provided
    if (onSelectDataPoint) {
      console.log('Calling onSelectDataPoint callback');
      onSelectDataPoint(point);
    }
  };
  
  return (
    <Card className={cn("border shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Chart display area */}
        <div className="relative h-[300px] mt-4 mb-8">
          {/* Y-axis (Value) */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between items-center border-r border-dashed border-gray-200">
            <div className="text-xs text-muted-foreground -ml-2">Value</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxValue)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxValue * 0.75)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxValue * 0.5)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxValue * 0.25)}</div>
            <div className="text-xs text-muted-foreground">$0</div>
          </div>
          
          {/* X-axis (Cost) */}
          <div className="absolute left-12 right-0 bottom-0 h-8 flex justify-between items-center border-t border-dashed border-gray-200">
            <div className="text-xs text-muted-foreground">$0</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxCost * 0.25)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxCost * 0.5)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxCost * 0.75)}</div>
            <div className="text-xs text-muted-foreground">{formatCurrency(maxCost)}</div>
          </div>
          
          {/* Diagonal line representing equal cost and value */}
          <div 
            className="absolute left-12 right-0 top-0 bottom-8 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(135deg, transparent 49.5%, rgba(100,116,139,0.2) 49.5%, rgba(100,116,139,0.2) 50.5%, transparent 50.5%)',
              backgroundSize: '10px 10px'
            }}
          ></div>
          
          {/* Data points */}
          <div className="absolute left-12 right-0 top-0 bottom-8">
            {dataPoints.map((point, index) => {
              // Calculate position based on cost and value
              const xPos = (point.cost / maxCost) * 100;
              const yPos = 100 - (point.value / maxValue) * 100;
              
              // Determine if this point should be highlighted
              const isHighlighted = highlightCategories.includes(point.category || '') || 
                                   selectedPoint?.label === point.label || 
                                   hoveredPoint?.label === point.label;
              
              // Calculate ROI and efficiency
              const roi = calculateROI(point.cost, point.value);
              const efficiency = calculateEfficiency(point.cost, point.value);
              
              // Determine if this is a good value (above the diagonal line)
              const isGoodValue = point.value > point.cost;
              
              return (
                <div
                  key={index}
                  className={cn(
                    "absolute z-10 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200",
                    isHighlighted ? "scale-125 z-20" : "",
                    selectedPoint?.label === point.label ? "ring-2 ring-primary ring-offset-2" : "",
                  )}
                  style={{
                    left: `${xPos}%`,
                    top: `${yPos}%`,
                  }}
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={(e) => handlePointClick(point, e)}
                >
                  <div 
                    className={cn(
                      "h-4 w-4 rounded-full cursor-pointer flex items-center justify-center",
                      isGoodValue 
                        ? "bg-green-100 border border-green-300"
                        : "bg-amber-100 border border-amber-300",
                      isHighlighted
                        ? (isGoodValue ? "bg-green-200 border-green-400" : "bg-amber-200 border-amber-400")
                        : ""
                    )}
                  >
                    {isHighlighted && (
                      isGoodValue 
                        ? <TrendingUp className="h-2.5 w-2.5 text-green-700" />
                        : <TrendingDown className="h-2.5 w-2.5 text-amber-700" />
                    )}
                  </div>
                  
                  {/* Tooltip for the data point */}
                  {(hoveredPoint?.label === point.label || selectedPoint?.label === point.label) && (
                    <div 
                      className="absolute z-30 bg-white border shadow-md rounded-lg p-2 min-w-[200px] text-xs"
                      style={{
                        left: "50%",
                        transform: "translateX(-50%)",
                        bottom: "100%",
                        marginBottom: "8px"
                      }}
                    >
                      <div className="font-medium mb-1">{point.label}</div>
                      {point.category && (
                        <div className="text-muted-foreground mb-1">Category: {point.category}</div>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Cost:
                        </span>
                        <span className="font-medium">{formatCurrency(point.cost)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          Value:
                        </span>
                        <span className="font-medium">{formatCurrency(point.value)}</span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1">
                          <PercentIcon className="h-3 w-3" />
                          ROI:
                        </span>
                        <span className={cn(
                          "font-medium",
                          roi > 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {formatPercentage(roi)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Efficiency:
                        </span>
                        <span className={cn(
                          "font-medium",
                          efficiency > 1 ? "text-green-600" : "text-amber-600"
                        )}>
                          {efficiency.toFixed(2)}x
                        </span>
                      </div>
                      
                      {point.description && (
                        <div className="mt-2 pt-1 border-t text-[10px] text-muted-foreground">
                          {point.description}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend and metrics */}
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="p-3 border rounded-lg bg-card">
            <div className="text-xs text-muted-foreground mb-1">Best ROI</div>
            <div className="font-medium">
              {(() => {
                const bestROI = dataPoints.reduce((best, point) => {
                  const roi = calculateROI(point.cost, point.value);
                  return roi > best.roi ? { label: point.label, roi } : best;
                }, { label: '', roi: -Infinity });
                
                return (
                  <DataPointContext
                    value={bestROI.roi}
                    format="percentage"
                    context={`${bestROI.label} provides the best return on investment`}
                    explanation="ROI measures the percentage return relative to the cost"
                    contextType="tooltip"
                    interactionEffect="pulse"
                    thresholds={{ low: 0, medium: 25, high: 50 }}
                  />
                );
              })()}
            </div>
          </div>
          
          <div className="p-3 border rounded-lg bg-card">
            <div className="text-xs text-muted-foreground mb-1">Best Value</div>
            <div className="font-medium">
              {(() => {
                const bestValue = dataPoints.reduce((best, point) => {
                  const efficiency = calculateEfficiency(point.cost, point.value);
                  return efficiency > best.efficiency ? { label: point.label, efficiency } : best;
                }, { label: '', efficiency: -Infinity });
                
                return (
                  <DataPointContext
                    value={bestValue.efficiency}
                    format="number"
                    context={`${bestValue.label} provides the most value per dollar`}
                    explanation="This measures how much value you get for each dollar spent"
                    contextType="tooltip"
                    interactionEffect="pulse"
                    thresholds={{ low: 1, medium: 1.5, high: 2 }}
                  />
                );
              })()}
              <span className="text-xs ml-1">value/dollar</span>
            </div>
          </div>
          
          <div className="p-3 border rounded-lg bg-card">
            <div className="text-xs text-muted-foreground mb-1">Average ROI</div>
            <div className="font-medium">
              {(() => {
                const totalROI = dataPoints.reduce((sum, point) => {
                  return sum + calculateROI(point.cost, point.value);
                }, 0);
                const avgROI = totalROI / dataPoints.length;
                
                return (
                  <DataPointContext
                    value={avgROI}
                    format="percentage"
                    context="Average return on investment across all components"
                    explanation="A positive average ROI indicates overall good value"
                    contextType="tooltip"
                    interactionEffect="pulse"
                    thresholds={{ low: 0, medium: 15, high: 30 }}
                  />
                );
              })()}
            </div>
          </div>
        </div>
        
        {/* Selected component details */}
        {selectedPoint && (
          <div className="mt-4 p-3 border rounded-lg bg-card">
            <div className="text-sm font-medium">{selectedPoint.label} Details</div>
            <div className="mt-1 text-sm">{selectedPoint.description}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cost:</span>
                <span className="font-medium">{formatCurrency(selectedPoint.cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value:</span>
                <span className="font-medium">{formatCurrency(selectedPoint.value)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI:</span>
                <span className={cn(
                  "font-medium",
                  calculateROI(selectedPoint.cost, selectedPoint.value) > 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatPercentage(calculateROI(selectedPoint.cost, selectedPoint.value))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Value Ratio:</span>
                <span className={cn(
                  "font-medium",
                  calculateEfficiency(selectedPoint.cost, selectedPoint.value) > 1 ? "text-green-600" : "text-amber-600"
                )}>
                  {calculateEfficiency(selectedPoint.cost, selectedPoint.value).toFixed(2)}x
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CostValueRelationship;