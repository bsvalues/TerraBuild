// ValuationTimelineChart.tsx
import React from 'react';

export default function ValuationTimelineChart() {
  // This would use chart.js or another charting library in a real implementation
  return (
    <div className="h-64 border border-gray-300 rounded-lg p-4 bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Valuation Timeline (2020-2025)</h3>
        <div className="space-x-2">
          <button className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Annual</button>
          <button className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Quarterly</button>
          <button className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">Monthly</button>
        </div>
      </div>
      
      <div className="h-40 relative">
        {/* Bar chart placeholder */}
        <div className="absolute bottom-0 left-0 w-full flex items-end justify-between h-32">
          <div className="w-1/6 px-1">
            <div className="bg-blue-500 w-full" style={{ height: '60%' }}></div>
            <div className="text-xs text-center mt-1">2020</div>
          </div>
          <div className="w-1/6 px-1">
            <div className="bg-blue-500 w-full" style={{ height: '65%' }}></div>
            <div className="text-xs text-center mt-1">2021</div>
          </div>
          <div className="w-1/6 px-1">
            <div className="bg-blue-500 w-full" style={{ height: '75%' }}></div>
            <div className="text-xs text-center mt-1">2022</div>
          </div>
          <div className="w-1/6 px-1">
            <div className="bg-blue-500 w-full" style={{ height: '70%' }}></div>
            <div className="text-xs text-center mt-1">2023</div>
          </div>
          <div className="w-1/6 px-1">
            <div className="bg-blue-500 w-full" style={{ height: '85%' }}></div>
            <div className="text-xs text-center mt-1">2024</div>
          </div>
          <div className="w-1/6 px-1">
            <div className="bg-green-500 w-full" style={{ height: '90%' }}></div>
            <div className="text-xs text-center mt-1">2025</div>
          </div>
        </div>
        
        {/* Y-axis labels */}
        <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500">
          <div>$200</div>
          <div>$150</div>
          <div>$100</div>
          <div>$50</div>
          <div>$0</div>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Average cost per square foot over time
      </div>
    </div>
  );
}