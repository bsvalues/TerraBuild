import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DataPointContext from './DataPointContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, DollarSign, PercentIcon, Layers, Clock, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostFactor {
  name: string;
  value: number;
  unit: 'currency' | 'percentage' | 'multiplier';
  icon?: React.ReactNode;
  explanation?: string;
  impact?: 'positive' | 'negative' | 'neutral';
  breakdown?: {
    label: string;
    value: number;
    percentage: number;
  }[];
  trend?: {
    date: string;
    value: number;
  }[];
}

interface CostBreakdownCardProps {
  /**
   * The building type being analyzed
   */
  buildingType: string;
  
  /**
   * Base cost before adjustments
   */
  baseCost: number;
  
  /**
   * Final cost after all adjustments
   */
  finalCost: number;
  
  /**
   * Square footage of the building
   */
  squareFootage: number;
  
  /**
   * Various cost factors that affect the final price
   */
  costFactors: CostFactor[];
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * Optional callback when a cost factor is interacted with
   */
  onFactorInteraction?: (factor: string, type: 'hover' | 'click') => void;
  
  /**
   * Set to true to enable animation effects
   */
  animated?: boolean;
}

/**
 * CostBreakdownCard displays a comprehensive breakdown of building costs
 * with rich interactive elements for exploring the data in detail.
 */
const CostBreakdownCard: React.FC<CostBreakdownCardProps> = ({
  buildingType,
  baseCost,
  finalCost,
  squareFootage,
  costFactors,
  className,
  onFactorInteraction,
  animated = true
}) => {
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [expandedView, setExpandedView] = useState(false);
  
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

  // Calculate the cost per square foot
  const costPerSqFt = finalCost / squareFootage;
  
  // Get the appropriate format for a cost factor
  const getFormatForUnit = (unit: 'currency' | 'percentage' | 'multiplier'): 'currency' | 'percentage' | 'number' => {
    switch (unit) {
      case 'currency': return 'currency';
      case 'percentage': return 'percentage';
      case 'multiplier': return 'number';
      default: return 'number';
    }
  };
  
  // Get the appropriate icon for a cost factor
  const getIconForFactor = (factor: CostFactor): React.ReactNode => {
    if (factor.icon) return factor.icon;
    
    switch (factor.unit) {
      case 'currency': return <DollarSign className="h-4 w-4" />;
      case 'percentage': return <PercentIcon className="h-4 w-4" />;
      case 'multiplier': return <Layers className="h-4 w-4" />;
      default: return <ChevronRight className="h-4 w-4" />;
    }
  };

  // Handle interaction with a cost factor
  const handleFactorInteraction = (factor: string, type: 'hover' | 'click') => {
    console.log(`CostBreakdownCard: ${type} interaction on ${factor}`);
    
    if (type === 'click') {
      console.log('Toggling selected factor:', factor, 'Current:', selectedFactor);
      setSelectedFactor(prevSelected => prevSelected === factor ? null : factor);
    }
    
    if (onFactorInteraction) {
      onFactorInteraction(factor, type);
    }
  };

  return (
    <Card className={cn(
      "border shadow-sm overflow-hidden transition-all duration-300",
      expandedView ? "min-h-[500px]" : "",
      className
    )}>
      <CardHeader className="bg-primary/5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary/70" />
              <span>{buildingType} Cost Breakdown</span>
            </CardTitle>
            <CardDescription>
              {squareFootage.toLocaleString()} sq.ft • {formatCurrency(costPerSqFt)} per sq.ft
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
            className="h-7 text-xs gap-1"
          >
            {expandedView ? "Collapse" : "Expand"} View
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-6">
          {/* Primary cost overview */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Base Cost</div>
              <div className="text-2xl font-bold">
                <DataPointContext
                  value={baseCost}
                  format="currency"
                  context="Initial cost based on building type and size"
                  explanation="The base cost is calculated from standard building costs per square foot for this building type."
                  contextType="tooltip"
                  interactionEffect="glow"
                  valueClassName="text-2xl font-bold"
                  showIndicator={false}
                />
              </div>
            </div>
            
            <div className="flex-none">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Final Cost</div>
              <div className="text-2xl font-bold text-primary">
                <DataPointContext
                  value={finalCost}
                  format="currency"
                  context="Final cost after all adjustments"
                  explanation="This is the total cost after applying all adjustment factors to the base cost."
                  breakdownData={costFactors.map(factor => ({
                    label: factor.name,
                    value: factor.unit === 'currency' ? factor.value : 
                           factor.unit === 'percentage' ? (baseCost * factor.value / 100) :
                           (factor.value - 1) * baseCost,
                    percentage: factor.unit === 'currency' ? (factor.value / baseCost) * 100 : 
                               factor.unit === 'percentage' ? factor.value : 
                               (factor.value - 1) * 100
                  }))}
                  contextType="popover"
                  interactionEffect="glow"
                  valueClassName="text-2xl font-bold text-primary"
                  showIndicator={false}
                />
              </div>
            </div>
          </div>
          
          {/* Cost factor breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Cost Factors</h3>
            <div className={cn(
              "grid gap-2",
              expandedView ? "grid-cols-1" : "grid-cols-2"
            )}>
              {costFactors.map((factor, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-3 rounded-lg border transition-all duration-200",
                    selectedFactor === factor.name ? "bg-primary/5 border-primary/30" : "bg-card border-input hover:border-primary/20",
                    animated && "transform hover:-translate-y-0.5",
                  )}
                  onClick={() => setSelectedFactor(factor.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex items-center justify-center h-6 w-6 rounded-full",
                        factor.impact === 'positive' ? "bg-green-100 text-green-700" :
                        factor.impact === 'negative' ? "bg-red-100 text-red-700" :
                        "bg-primary/10 text-primary/70"
                      )}>
                        {getIconForFactor(factor)}
                      </div>
                      <div className="font-medium">{factor.name}</div>
                    </div>
                    
                    <DataPointContext
                      value={factor.value}
                      format={getFormatForUnit(factor.unit)}
                      context={factor.explanation}
                      trendData={factor.trend}
                      breakdownData={factor.breakdown}
                      contextType={factor.breakdown ? "popover" : factor.trend ? "hovercard" : "tooltip"}
                      interactionEffect="glow"
                      onInteraction={(type) => handleFactorInteraction(factor.name, type)}
                    />
                  </div>
                  
                  {/* Expanded content when a factor is selected */}
                  {(selectedFactor === factor.name || expandedView) && (
                    <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                      {factor.explanation}
                      
                      {factor.unit === 'currency' && (
                        <div className="mt-2 text-xs">
                          Impact: {formatPercentage(factor.value / baseCost)} of base cost
                        </div>
                      )}
                      
                      {factor.unit === 'percentage' && (
                        <div className="mt-2 text-xs">
                          Cost impact: {formatCurrency(baseCost * factor.value / 100)}
                        </div>
                      )}
                      
                      {factor.unit === 'multiplier' && (
                        <div className="mt-2 text-xs">
                          Cost impact: {formatCurrency((factor.value - 1) * baseCost)}
                        </div>
                      )}
                      
                      {factor.breakdown && expandedView && (
                        <div className="mt-3 space-y-1">
                          <div className="text-xs font-medium">Breakdown:</div>
                          {factor.breakdown.map((item, i) => (
                            <div key={i} className="flex items-center text-xs">
                              <div className="w-24 truncate">{item.label}:</div>
                              <div className="flex-1 h-1.5 bg-gray-100 rounded-full ml-2">
                                <div 
                                  className="h-full bg-primary/60 rounded-full"
                                  style={{ width: `${item.percentage}%` }}
                                ></div>
                              </div>
                              <div className="ml-2 min-w-[60px] text-right">
                                {factor.unit === 'currency' ? formatCurrency(item.value) : 
                                 factor.unit === 'percentage' ? formatPercentage(item.value) : 
                                 item.value.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {factor.trend && expandedView && (
                        <div className="mt-3">
                          <div className="text-xs font-medium">Historical Trend:</div>
                          <div className="h-16 mt-1 flex items-end gap-1">
                            {factor.trend.map((point, i) => {
                              const maxValue = Math.max(...factor.trend!.map(p => p.value));
                              const height = (point.value / maxValue) * 100;
                              
                              return (
                                <div 
                                  key={i} 
                                  className="relative flex-1 group/trend"
                                >
                                  <div 
                                    className="absolute bottom-0 w-full bg-primary/60 rounded-t transition-all"
                                    style={{ height: `${height}%` }}
                                  ></div>
                                  <div className="opacity-0 group-hover/trend:opacity-100 absolute -top-6 left-1/2 transform -translate-x-1/2 text-[10px] bg-primary text-white px-1 py-0.5 rounded whitespace-nowrap">
                                    {factor.unit === 'currency' ? formatCurrency(point.value) : 
                                     factor.unit === 'percentage' ? formatPercentage(point.value) : 
                                     point.value.toFixed(2)}
                                  </div>
                                  
                                  <div className="opacity-0 group-hover/trend:opacity-100 absolute top-full left-1/2 transform -translate-x-1/2 text-[10px] whitespace-nowrap">
                                    {point.date}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer summary */}
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Last updated: {new Date().toLocaleDateString()}</span>
            </div>
            
            <div className="text-primary font-medium">
              {((finalCost - baseCost) / baseCost * 100).toFixed(1)}% total adjustment
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostBreakdownCard;