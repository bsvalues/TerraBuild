// ExportJustification.tsx
import React, { useState } from 'react';

export default function ExportJustification() {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = () => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false);
      // In a real implementation, this would trigger a download or open a new window
      alert(`Exported as ${exportFormat.toUpperCase()}`);
    }, 1500);
  };
  
  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-white">
      <h3 className="font-semibold mb-3">Export Assessment Justification</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Generate a defensible document with full audit trail and justification for current assessment values.
        </p>
        
        <div className="flex flex-col space-y-3">
          <div className="flex items-center">
            <input
              type="radio"
              id="pdf-format"
              name="export-format"
              checked={exportFormat === 'pdf'}
              onChange={() => setExportFormat('pdf')}
              className="mr-2"
            />
            <label htmlFor="pdf-format" className="text-sm">
              PDF Report (with county letterhead)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="radio"
              id="json-format"
              name="export-format"
              checked={exportFormat === 'json'}
              onChange={() => setExportFormat('json')}
              className="mr-2"
            />
            <label htmlFor="json-format" className="text-sm">
              JSON Data Export (for developers)
            </label>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Session ID: 20250505-BC-V123
        </div>
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`px-4 py-2 rounded text-white ${
            isExporting ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isExporting ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>
          Exports include: current matrix values, adjustment history, agent insights, and supporting data
        </p>
      </div>
    </div>
  );
}