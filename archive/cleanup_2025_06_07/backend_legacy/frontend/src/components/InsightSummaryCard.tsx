// InsightSummaryCard.tsx
import React from 'react';

interface Insight {
  id: string;
  type: 'info' | 'warning' | 'success';
  message: string;
  source: string;
  timestamp: string;
}

export default function InsightSummaryCard() {
  // This would come from an API in a real implementation
  const insights: Insight[] = [
    {
      id: 'ins1',
      type: 'warning',
      message: 'Commercial Office rates 15% above 5-year average',
      source: 'Trend Analysis Agent',
      timestamp: '2 hours ago'
    },
    {
      id: 'ins2',
      type: 'info',
      message: 'Residential rates consistent with regional trends',
      source: 'Regional Comparison Agent',
      timestamp: '3 hours ago'
    },
    {
      id: 'ins3',
      type: 'success',
      message: 'Matrix validation completed successfully',
      source: 'Data Validation Agent',
      timestamp: '4 hours ago'
    }
  ];
  
  const getIconForType = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '📊';
    }
  };
  
  const getColorForType = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-3">AI Agent Insights</h3>
      
      <div className="space-y-3">
        {insights.map((insight) => (
          <div 
            key={insight.id} 
            className={`border-l-4 p-3 rounded ${getColorForType(insight.type)}`}
          >
            <div className="flex items-start">
              <div className="mr-2">
                {getIconForType(insight.type)}
              </div>
              <div>
                <p className="text-sm font-medium">{insight.message}</p>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{insight.source}</span>
                  <span>{insight.timestamp}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 text-center">
        <button className="text-blue-600 text-sm hover:underline">
          View All Insights
        </button>
      </div>
    </div>
  );
}