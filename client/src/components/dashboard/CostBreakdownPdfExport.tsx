import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { exportCostPredictionAsPdf, exportElementAsPdf } from '@/lib/pdf-export';
import { Material } from '@/hooks/use-building-costs';
import { 
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import AnnotationTool from '@/components/annotation/AnnotationTool';

// Custom icons for the Cost Breakdown component
const PdfIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="M18 17V9"/>
    <path d="M13 17V5"/>
    <path d="M8 17v-3"/>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

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
  const visibleReportRef = useRef<HTMLDivElement>(null);

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
      // Generate PDF filename with project details
      const filename = `${data.buildingType.toLowerCase().replace(/\s+/g, '-')}-${
        data.region.toLowerCase().replace(/\s+/g, '-')
      }-${data.squareFootage}sqft-cost-breakdown.pdf`;

      // Export to PDF
      await exportElementAsPdf(reportRef.current, {
        title: `Building Cost Breakdown: ${data.buildingType}`,
        filename,
        addHeader: true,
        addFooter: true
      });
      
      // Call onExport callback if provided
      if (onExport) onExport();
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setExportError('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Function to handle saving annotated images
  const handleSaveAnnotation = (dataUrl: string) => {
    // You could save this to a report history or send to server
    console.log('Annotation saved with data URL length:', dataUrl.length);
  };

  if (!data) return null;

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200 overflow-hidden shadow-sm">
        <div className="py-3 px-4 flex items-center justify-between border-b border-blue-200/70 bg-white/50">
          <div className="flex items-center gap-2">
            <PdfIcon />
            <h3 className="text-sm font-medium text-blue-900">Cost Report Export</h3>
          </div>
          
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
            Export as PDF or annotate with notes
          </div>
        </div>
        
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="grow">
            <h4 className="text-sm font-medium text-blue-900">Building Cost Report</h4>
            <p className="text-xs text-blue-700 mt-1">
              Generate a professional report with detailed cost information, materials breakdown, and visualizations for your records or presentations.
            </p>
            
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <div className="px-2 py-1 bg-white rounded border border-blue-200 flex items-center gap-1 text-blue-700">
                <CheckIcon />
                <span>Summary Data</span>
              </div>
              <div className="px-2 py-1 bg-white rounded border border-blue-200 flex items-center gap-1 text-blue-700">
                <CheckIcon />
                <span>Material Breakdown</span>
              </div>
              <div className="px-2 py-1 bg-white rounded border border-blue-200 flex items-center gap-1 text-blue-700">
                <CheckIcon />
                <span>Visualizations</span>
              </div>
              <div className="px-2 py-1 bg-white rounded border border-blue-200 flex items-center gap-1 text-blue-700">
                <CheckIcon />
                <span>Custom Annotations</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <AnnotationTool 
              targetSelector="#visibleReport"
              onSave={handleSaveAnnotation}
            />
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-10 px-4 shadow-sm flex items-center gap-1.5"
            >
              {isExporting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Generating PDF...</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <PdfIcon />
                  <span>Download PDF Report</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {exportError && (
        <div className="text-xs text-red-600 bg-red-50 p-3 rounded-md border border-red-200 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <strong className="font-medium block">Export Failed:</strong>
            {exportError}
          </div>
        </div>
      )}

      {/* Visible report that can be screenshot and annotated */}
      <div 
        id="visibleReport"
        ref={visibleReportRef}
        className="p-6 bg-white rounded-lg border border-gray-200 shadow-md mt-4"
      >
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-800 mb-1">
            Building Cost Breakdown
          </h2>
          <h3 className="text-sm font-medium text-gray-600 mb-0.5">
            {data.buildingType} in {data.region}
          </h3>
          <p className="text-xs text-gray-500">
            {data.squareFootage.toLocaleString()} sq ft
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm">
            <h3 className="text-blue-800 font-medium mb-2">Cost Per Square Foot</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-blue-700">${data.costPerSqft.toFixed(2)}</span>
              <span className="text-blue-600 text-lg">/sq ft</span>
            </div>
            <p className="mt-2 text-sm text-blue-600">
              For {data.buildingType} building in {data.region} region
            </p>
          </div>
                  
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 shadow-sm">
            <h3 className="text-green-800 font-medium mb-2">Total Project Cost</h3>
            <div className="text-4xl font-bold text-green-700">
              {formatCurrency(data.totalCost)}
            </div>
            <p className="mt-2 text-sm text-green-600">
              Based on {data.squareFootage.toLocaleString()} square feet
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Cost Component Factors</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Region Impact</span>
                <span className="text-blue-600">{data.regionFactor.toFixed(2)}× multiplier</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${data.regionFactor * 50}%` }}></div>
              </div>
            </div>
                        
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-medium">Complexity Factor</span>
                <span className="text-purple-600">{data.complexityFactor.toFixed(2)}× adjustment</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 bg-purple-600 rounded-full" style={{ width: `${(data.complexityFactor / 3) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Material Cost Distribution
          </h3>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Pie Chart */}
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.materials.map(m => ({
                      name: m.materialName,
                      value: m.totalCost
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
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
            <div className="w-full md:w-1/2 h-64">
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
                  <Bar dataKey="cost" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Material Cost Breakdown
          </h3>
          
          <div className="relative overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs bg-gray-50 text-gray-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Material</th>
                  <th className="px-4 py-3 font-medium text-right">Percentage</th>
                  <th className="px-4 py-3 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.materials.map((material, index) => (
                  <tr key={material.id} className="border-b border-gray-200">
                    <td className="px-4 py-2.5">
                      {material.materialName}
                      <span className="block text-xs text-gray-500">
                        {material.materialCode}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {material.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      {formatCurrency(material.totalCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50">
                  <td colSpan={2} className="px-4 py-3 text-right font-medium text-blue-900">
                    Total Material Cost:
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">
                    {formatCurrency(data.materials.reduce((sum, m) => sum + m.totalCost, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

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
            color: '#3B82F6', 
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
                  <Bar dataKey="cost" fill="#3B82F6" />
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
                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold', color: '#3B82F6' }}>
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