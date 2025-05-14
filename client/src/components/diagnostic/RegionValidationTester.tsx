import React, { useState } from 'react';
import { validateRegion } from '../../lib/agentClient';

const regionTypes = [
  { value: 'city', label: 'City' },
  { value: 'tca', label: 'Tax Code Area (TCA)' },
  { value: 'hood_code', label: 'Hood Code' },
  { value: 'township_range', label: 'Township/Range' }
] as const;

type RegionType = typeof regionTypes[number]['value'];

export const RegionValidationTester: React.FC = () => {
  const [regionValue, setRegionValue] = useState('');
  const [regionType, setRegionType] = useState<RegionType>('city');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const validationResult = await validateRegion(regionValue, regionType);
      setResult(validationResult);
    } catch (err) {
      console.error('Validation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Region Validation Tester</h2>
      <p className="text-gray-600 mb-4">
        Test the Data Quality Agent's region validation capabilities by entering a region value and type.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region Type
          </label>
          <select
            value={regionType}
            onChange={(e) => setRegionType(e.target.value as RegionType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {regionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region Value
          </label>
          <input
            type="text"
            value={regionValue}
            onChange={(e) => setRegionValue(e.target.value)}
            placeholder={
              regionType === 'city' ? 'e.g., Richland, Kennewick' :
              regionType === 'tca' ? 'e.g., 1111H, 1210' :
              regionType === 'hood_code' ? 'e.g., 52100 100, 52100 140' :
              'e.g., 10N-24E, 5N-28E'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading || !regionValue}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Validate Region'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Validation Result</h3>
          <div className="bg-gray-50 p-4 rounded border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Region</span>
                <p>{result.region?.value}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Type</span>
                <p>{result.region?.type}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-medium mb-1">Validation Details</h4>
              {result.validation?.isValid ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded">
                  <p className="font-medium">Valid</p>
                  <p className="text-sm">{result.validation?.message || 'Region value is valid'}</p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
                  <p className="font-medium">Invalid</p>
                  <p className="text-sm">{result.validation?.message || 'Region value is invalid'}</p>
                  
                  {result.validation?.details && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Details:</p>
                      <pre className="text-xs mt-1 bg-red-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(result.validation.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500">Full Response</p>
              <pre className="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionValidationTester;