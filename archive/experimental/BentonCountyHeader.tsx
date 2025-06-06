// BentonCountyHeader.tsx
import React from 'react';

export const BentonCountyHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between bg-[#2F5233] text-white p-4 rounded-lg shadow-md">
      <div className="flex items-center">
        {/* County Seal Placeholder - Replace with actual Benton County seal image */}
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4">
          <div className="text-[#2F5233] font-bold text-xs text-center">BENTON COUNTY SEAL</div>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold">Benton County</h1>
          <p className="text-sm">Washington State Assessor's Office</p>
        </div>
      </div>
      
      <div className="hidden md:block">
        <div className="text-right">
          <p className="font-semibold">Building Cost Assessment System</p>
          <p className="text-sm">2025 Valuation Cycle</p>
        </div>
      </div>
    </div>
  );
};