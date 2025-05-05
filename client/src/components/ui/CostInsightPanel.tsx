import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ArrowUpFromLine, ArrowDownFromLine, DollarSign, LineChart, X } from 'lucide-react';

interface CostInsight {
  type: 'average' | 'trend' | 'min-max' | 'alert';
  title: string;
  value?: string | number;
  change?: string | number;
  isPositive?: boolean;
  description?: string;
}

interface CostInsightPanelProps {
  insights: CostInsight[];
}

export default function CostInsightPanel({ insights }: CostInsightPanelProps) {
  if (!insights || insights.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cost Insights</CardTitle>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <LineChart className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No insights available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Function to get the appropriate icon for an insight type
  const getInsightIcon = (type: CostInsight['type'], isPositive?: boolean) => {
    switch (type) {
      case 'average':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'min-max':
        return <DollarSign className="h-5 w-5 text-purple-500" />;
      case 'trend':
        if (isPositive !== undefined) {
          return isPositive ? 
            <ArrowUpFromLine className="h-5 w-5 text-green-500" /> :
            <ArrowDownFromLine className="h-5 w-5 text-red-500" />;
        }
        return <LineChart className="h-5 w-5 text-blue-500" />;
      case 'alert':
        return <X className="h-5 w-5 text-orange-500" />;
      default:
        return <LineChart className="h-5 w-5 text-blue-500" />;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cost Insights</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {insight.title}
                    </p>
                    
                    {insight.value !== undefined && (
                      <div className="flex items-baseline">
                        <p className="text-2xl font-bold">
                          {typeof insight.value === 'number' 
                            ? insight.value.toLocaleString('en-US', { 
                                style: 'currency', 
                                currency: 'USD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2
                              })
                            : insight.value}
                        </p>
                        
                        {insight.change && (
                          <span className={`ml-2 text-sm ${insight.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {insight.isPositive ? '+' : ''}{insight.change}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {insight.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {insight.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="p-2 rounded-full bg-muted">
                    {getInsightIcon(insight.type, insight.isPositive)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}