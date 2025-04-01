/**
 * Visualization Utilities
 * 
 * This module contains utility functions for advanced visualization components
 * including heatmaps, drill-down charts, and export capabilities.
 */

/**
 * Creates data for a regional heatmap visualization
 * 
 * @param region The region/state name
 * @param countyData Array of county data objects with name and avgCost
 * @returns Formatted data object for heatmap visualization
 */
export function createHeatmapData(region: string, countyData: Array<{ name: string, avgCost: number }>) {
  // Handle empty dataset
  if (!countyData.length) {
    return {
      region,
      data: [],
      minValue: 0,
      maxValue: 0,
      colorScale: generateColorScale(0, 0)
    };
  }

  // Map data to heatmap format
  const data = countyData.map(county => ({
    id: county.name,
    value: county.avgCost
  }));

  // Calculate min and max values for color scaling
  const values = countyData.map(county => county.avgCost);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return {
    region,
    data,
    minValue,
    maxValue,
    colorScale: generateColorScale(minValue, maxValue)
  };
}

/**
 * Generates a color scale for heatmap based on min and max values
 * 
 * @param minValue Minimum value in the dataset
 * @param maxValue Maximum value in the dataset
 * @returns Array of color values for the scale
 */
function generateColorScale(minValue: number, maxValue: number): string[] {
  // Default blue gradient for cost visualization
  return [
    '#e3f2fd', // Lightest blue
    '#bbdefb',
    '#90caf9',
    '#64b5f6',
    '#42a5f5',
    '#2196f3',
    '#1e88e5',
    '#1976d2',
    '#1565c0',
    '#0d47a1'  // Darkest blue
  ];
}

/**
 * Interface for hierarchical data used in drill-down charts
 */
interface DrilldownNode {
  name: string;
  value?: number;
  children?: DrilldownNode[];
}

/**
 * Interface for processed drill-down data
 */
interface DrilldownResult {
  current: DrilldownNode;
  items: Array<DrilldownNode>;
  breadcrumbs: string[];
  error?: string;
}

/**
 * Processes hierarchical data for drill-down chart views
 * 
 * @param data Hierarchical data structure
 * @param path Array of node names defining the drill-down path
 * @returns Processed data for the current drill-down level
 */
export function processDataForDrilldown(data: DrilldownNode, path: string[]): DrilldownResult {
  // Handle empty path (top level)
  if (!path.length) {
    return {
      current: data,
      items: data.children || [],
      breadcrumbs: []
    };
  }

  // Traverse the path
  let current = data;
  const breadcrumbs: string[] = [];
  let pathFound = true;

  for (let i = 0; i < path.length; i++) {
    const nodeName = path[i];
    const children = current.children || [];
    
    // Find the child node matching the path segment
    const nextNode = children.find(child => child.name === nodeName);
    
    if (!nextNode) {
      pathFound = false;
      break;
    }
    
    breadcrumbs.push(current.name);
    current = nextNode;
  }

  // Handle invalid path
  if (!pathFound) {
    return {
      current: data,
      items: data.children || [],
      breadcrumbs: [],
      error: 'Path not found'
    };
  }

  return {
    current,
    items: current.children || [],
    breadcrumbs
  };
}

/**
 * Interface for chart export configuration
 */
interface ExportConfig {
  filename: string;
  title: string;
  content: any[];
  styles: Record<string, any>;
}

/**
 * Prepares a chart for PDF export
 * 
 * @param chartData The chart data including title and dataset
 * @returns Configuration object for PDF generation
 */
export function exportChartToPDF(chartData: { title: string, data: any[] }): ExportConfig {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${chartData.title.replace(/\s+/g, '_')}_${timestamp}`;

  return {
    filename: filename,
    title: chartData.title,
    content: [
      { text: chartData.title, style: 'header' },
      { text: `Generated on ${new Date().toLocaleString()}`, style: 'subheader' },
      {
        table: {
          headerRows: 1,
          body: [
            ['Name', 'Value'],
            ...chartData.data.map(item => [item.name, item.value])
          ]
        }
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      subheader: { fontSize: 14, bold: false, margin: [0, 0, 0, 20], italics: true },
      tableHeader: { bold: true, fontSize: 12, color: 'black' }
    }
  };
}