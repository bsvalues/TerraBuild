// AgentFeed.tsx
import React, { useState } from 'react';

interface AgentMessage {
  id: string;
  agent: string;
  message: string;
  timestamp: string;
  type: 'insight' | 'alert' | 'analysis';
}

export default function AgentFeed() {
  const [feedType, setFeedType] = useState<'all' | 'insights' | 'alerts' | 'analysis'>('all');
  
  // This would come from an API in a real implementation
  const messages: AgentMessage[] = [
    {
      id: 'msg1',
      agent: 'Cost Analysis Agent',
      message: 'Commercial office space cost factors have increased by 7.2% compared to last quarter due to increased material costs.',
      timestamp: '12:45 PM',
      type: 'analysis'
    },
    {
      id: 'msg2',
      agent: 'Data Quality Agent',
      message: 'Warning: Missing cost data for Industrial Warehouses, Class B in regions R3 and R4.',
      timestamp: '11:30 AM',
      type: 'alert'
    },
    {
      id: 'msg3',
      agent: 'Regional Agent',
      message: 'Eastern Washington construction costs trending 5.3% below state average for residential structures.',
      timestamp: '10:15 AM',
      type: 'insight'
    },
    {
      id: 'msg4',
      agent: 'Matrix Validation Agent',
      message: 'All cost values validated against historical models. 98% confidence rating for current matrix.',
      timestamp: '9:00 AM',
      type: 'analysis'
    }
  ];
  
  const filteredMessages = feedType === 'all' 
    ? messages 
    : messages.filter(msg => msg.type === feedType);
  
  const getColorForType = (type: AgentMessage['type']) => {
    switch (type) {
      case 'alert':
        return 'border-red-500 bg-red-50';
      case 'insight':
        return 'border-blue-500 bg-blue-50';
      case 'analysis':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold">Agent Activity Feed</h3>
        
        <div className="flex text-xs">
          <button 
            onClick={() => setFeedType('all')}
            className={`px-2 py-1 rounded-l ${
              feedType === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFeedType('insights')}
            className={`px-2 py-1 ${
              feedType === 'insights' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Insights
          </button>
          <button 
            onClick={() => setFeedType('alerts')}
            className={`px-2 py-1 ${
              feedType === 'alerts' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Alerts
          </button>
          <button 
            onClick={() => setFeedType('analysis')}
            className={`px-2 py-1 rounded-r ${
              feedType === 'analysis' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Analysis
          </button>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {filteredMessages.map((msg) => (
          <div 
            key={msg.id} 
            className={`border-l-4 p-3 rounded ${getColorForType(msg.type)}`}
          >
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">{msg.agent}</span>
              <span className="text-gray-500">{msg.timestamp}</span>
            </div>
            <p className="text-sm">{msg.message}</p>
          </div>
        ))}
        
        {filteredMessages.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            No messages of this type found
          </div>
        )}
      </div>
      
      <div className="mt-3 text-center">
        <button className="text-blue-600 text-sm hover:underline">
          View Full Agent Log
        </button>
      </div>
    </div>
  );
}