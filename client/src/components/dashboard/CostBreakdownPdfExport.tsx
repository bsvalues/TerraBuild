import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { exportToPdf, preparePdfElement } from '@/lib/pdf-export';
import { Material } from '@/hooks/use-building-costs';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface CostBreakdownPdfExportProps {
  data: {
    region: string;
    buildingType: string;
    squareFootage: number;
    costPerSqft: number;
    totalCost: number;
    baseCost: number;
    regionFactor: number;
    complexityFactor: number;
    materials: Material[];
  } | null;
  onExport?: () => void;
}

const CostBreakdownPdfExport: React.FC<CostBreakdownPdfExportProps> = ({ 
  data,
  onExport
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  const handleExport = async () => {
    if (!data || !reportRef.current) return;

    setIsExporting(true);
    setExportError(null);

    try {
      // Apply temporary styles for PDF export
      const cleanup = preparePdfElement(reportRef.current);
      
      // Generate PDF filename with project details
      const filename = `${data.buildingType.toLowerCase().replace(/\s+/g, '-')}-${
        data.region.toLowerCase().replace(/\s+/g, '-')
      }-${data.squareFootage}sqft-cost-breakdown.pdf`;

      // Generate export options
      const options = {
        title: `Building Cost Breakdown: ${data.buildingType}`,
        filename,
        pageSize: 'a4' as const,
        orientation: 'portrait' as const,
      };

      // Export to PDF
      await exportToPdf(reportRef.current, options);
      
      // Restore original styles
      cleanup();
      
      // Call onExport callback if provided
      if (onExport) onExport();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setExportError('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-md border border-neutral-200">
        <div>
          <h3 className="text-sm font-medium text-neutral-700">Export Cost Breakdown</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Generate a professional PDF report with all cost details
          </p>
        </div>
        <Button 
          onClick={handleExport}
          disabled={isExporting}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-xs h-9"
        >
          {isExporting ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export to PDF
            </span>
          )}
        </Button>
      </div>

      {exportError && (
        <div className="text-xs text-red-500 bg-red-50 p-3 rounded-md border border-red-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {exportError}
        </div>
      )}

      {/* Hidden container that will be converted to PDF */}
      <div 
        ref={reportRef} 
        className="hidden"
        style={{
          width: '800px',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          color: '#333'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#444', marginBottom: '5px' }}>
            Building Cost Breakdown
          </h1>
          <h2 style={{ fontSize: '16px', fontWeight: 'normal', color: '#666', marginBottom: '5px' }}>
            {data.buildingType} in {data.region}
          </h2>
          <h3 style={{ fontSize: '14px', fontWeight: 'normal', color: '#888' }}>
            {data.squareFootage.toLocaleString()} sq ft
          </h3>
        </div>

        <div style={{ 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            color: '#7C3AED', 
            marginBottom: '10px' 
          }}>
            {formatCurrency(data.totalCost)}
          </div>
          <div style={{ fontSize: '12px', textAlign: 'center', color: '#666', marginBottom: '15px' }}>
            Total Estimated Cost
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Base Cost:</span>
            <span style={{ fontSize: '12px', fontWeight: 'medium' }}>{formatCurrency(data.baseCost)} per sq ft</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Region Factor:</span>
            <span style={{ fontSize: '12px', fontWeight: 'medium' }}>{data.regionFactor.toFixed(2)}×</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Complexity Factor:</span>
            <span style={{ fontSize: '12px', fontWeight: 'medium' }}>{data.complexityFactor.toFixed(2)}×</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '12px', color: '#666' }}>Cost per Sq Ft:</span>
            <span style={{ fontSize: '12px', fontWeight: 'medium' }}>{formatCurrency(data.costPerSqft)}</span>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'medium', marginBottom: '10px' }}>
            Material Cost Distribution
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {/* Pie Chart */}
            <div style={{ width: '45%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.materials.map(m => ({
                      name: m.materialName,
                      value: m.totalCost
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.materials.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 25 % 360}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Bar Chart */}
            <div style={{ width: '50%', height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.materials
                    .sort((a, b) => b.totalCost - a.totalCost)
                    .slice(0, 5)
                    .map(m => ({
                      name: m.materialName,
                      cost: m.totalCost
                    }))}
                  margin={{ top: 5, right: 0, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={50}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value/1000}k`}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="cost" fill="#7C3AED" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 'medium', marginBottom: '10px' }}>
            Material Cost Breakdown
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Material</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Percentage</th>
                <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.materials.map(material => (
                <tr key={material.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px', textAlign: 'left' }}>
                    {material.materialName}
                    <span style={{ display: 'block', fontSize: '10px', color: '#888' }}>
                      {material.materialCode}
                    </span>
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {material.percentage.toFixed(1)}%
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right', fontWeight: '500' }}>
                    {formatCurrency(material.totalCost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                  Total Material Cost:
                </td>
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#7C3AED' }}>
                  {formatCurrency(data.materials.reduce((sum, m) => sum + m.totalCost, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostBreakdownPdfExport;