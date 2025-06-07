// ValueScenarioCompare.tsx
import React, { useState } from 'react';

interface Scenario {
  id: string;
  name: string;
  description: string;
  residentialRate: number;
  commercialRate: number;
  industrialRate: number;
  timestamp: string;
}

export default function ValueScenarioCompare() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['current', 'historical']);
  
  // This would come from an API in a real implementation
  const scenarios: Scenario[] = [
    {
      id: 'current',
      name: 'Current Matrix',
      description: 'Values from the current edited matrix',
      residentialRate: 145.75,
      commercialRate: 175.30,
      industrialRate: 160.25,
      timestamp: 'Now'
    },
    {
      id: 'historical',
      name: '2024 Matrix',
      description: 'Values from previous year assessment',
      residentialRate: 135.50,
      commercialRate: 160.45,
      industrialRate: 150.80,
      timestamp: 'Jan 2024'
    },
    {
      id: 'ai-suggested',
      name: 'AI Suggestion',
      description: 'Agent-optimized value matrix',
      residentialRate: 147.25,
      commercialRate: 172.15,
      industrialRate: 163.90,
      timestamp: '2 hours ago'
    }
  ];
  
  const toggleScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(s => s !== id));
    } else {
      if (selectedScenarios.length < 2) {
        setSelectedScenarios([...selectedScenarios, id]);
      }
    }
  };
  
  // Calculate percentage difference between selected scenarios
  const getPercentageDifference = (property: keyof Scenario) => {
    if (selectedScenarios.length !== 2) return null;
    
    const scenario1 = scenarios.find(s => s.id === selectedScenarios[0]);
    const scenario2 = scenarios.find(s => s.id === selectedScenarios[1]);
    
    if (!scenario1 || !scenario2) return null;
    
    const value1 = scenario1[property] as number;
    const value2 = scenario2[property] as number;
    
    const percentDiff = ((value1 - value2) / value2) * 100;
    return percentDiff.toFixed(1);
  };
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-3">Value Scenario Comparison</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Select up to 2 scenarios to compare changes in valuation
        </p>
        
        <div className="flex flex-wrap -mx-1">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="px-1 mb-2">
              <button
                onClick={() => toggleScenario(scenario.id)}
                className={`px-3 py-1 text-sm rounded ${
                  selectedScenarios.includes(scenario.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {scenario.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {selectedScenarios.length === 2 && (
        <div>
          <div className="mb-2 pb-2 border-b">
            <div className="flex justify-between text-sm font-medium">
              <span>Category</span>
              <span>Difference</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Residential Rate</span>
              <span className={Number(getPercentageDifference('residentialRate')) > 0 ? 'text-green-600' : 'text-red-600'}>
                {getPercentageDifference('residentialRate')}%
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Commercial Rate</span>
              <span className={Number(getPercentageDifference('commercialRate')) > 0 ? 'text-green-600' : 'text-red-600'}>
                {getPercentageDifference('commercialRate')}%
              </span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Industrial Rate</span>
              <span className={Number(getPercentageDifference('industrialRate')) > 0 ? 'text-green-600' : 'text-red-600'}>
                {getPercentageDifference('industrialRate')}%
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-2 border-t text-xs text-gray-500">
            <p>
              Comparing {scenarios.find(s => s.id === selectedScenarios[0])?.name} 
              {" vs "} 
              {scenarios.find(s => s.id === selectedScenarios[1])?.name}
            </p>
          </div>
        </div>
      )}
      
      {selectedScenarios.length !== 2 && (
        <div className="text-sm text-gray-500 text-center p-4 border border-dashed rounded">
          Select 2 scenarios to compare differences
        </div>
      )}
    </div>
  );
}