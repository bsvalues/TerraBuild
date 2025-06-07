/**
 * Advanced Visualization Component Tests
 * 
 * This test suite verifies the functionality of enhanced visualization components
 * including heatmaps, drill-down charts, and export capabilities.
 */

const { expect } = require('chai');
const { JSDOM } = require('jsdom');
const { createHeatmapData, processDataForDrilldown, exportChartToPDF } = require('../client/src/lib/visualization-utils');

describe('Heatmap Visualization', () => {
  it('should generate correct data format for heatmaps', () => {
    // Sample cost data for counties
    const countyData = [
      { name: 'Benton', avgCost: 150.25 },
      { name: 'King', avgCost: 200.75 },
      { name: 'Spokane', avgCost: 125.50 }
    ];
    
    const heatmapData = createHeatmapData('Washington', countyData);
    
    // Verify structure
    expect(heatmapData).to.be.an('object');
    expect(heatmapData.region).to.equal('Washington');
    expect(heatmapData.data).to.be.an('array').with.lengthOf(3);
    
    // Verify data mapping
    expect(heatmapData.data[0].id).to.equal('Benton');
    expect(heatmapData.data[0].value).to.equal(150.25);
    
    // Verify color scaling
    expect(heatmapData.minValue).to.equal(125.50);
    expect(heatmapData.maxValue).to.equal(200.75);
    expect(heatmapData.colorScale).to.be.an('array');
  });

  it('should handle empty dataset gracefully', () => {
    const heatmapData = createHeatmapData('Washington', []);
    
    expect(heatmapData).to.be.an('object');
    expect(heatmapData.data).to.be.an('array').that.is.empty;
    expect(heatmapData.minValue).to.equal(0);
    expect(heatmapData.maxValue).to.equal(0);
  });
});

describe('Drill-down Chart Functionality', () => {
  it('should process data correctly for drill-down views', () => {
    // Sample hierarchical cost data
    const costData = {
      name: 'Washington',
      children: [
        {
          name: 'Benton County',
          children: [
            { name: 'Residential', value: 145.50 },
            { name: 'Commercial', value: 185.75 }
          ]
        },
        {
          name: 'King County',
          children: [
            { name: 'Residential', value: 210.25 },
            { name: 'Commercial', value: 250.00 }
          ]
        }
      ]
    };
    
    // Test top level view
    const topLevel = processDataForDrilldown(costData, []);
    expect(topLevel.current.name).to.equal('Washington');
    expect(topLevel.items).to.be.an('array').with.lengthOf(2);
    expect(topLevel.items[0].name).to.equal('Benton County');
    expect(topLevel.breadcrumbs).to.be.an('array').that.is.empty;
    
    // Test drill-down to county level
    const countyLevel = processDataForDrilldown(costData, ['Benton County']);
    expect(countyLevel.current.name).to.equal('Benton County');
    expect(countyLevel.items).to.be.an('array').with.lengthOf(2);
    expect(countyLevel.items[0].name).to.equal('Residential');
    expect(countyLevel.breadcrumbs).to.be.an('array').with.lengthOf(1);
    expect(countyLevel.breadcrumbs[0]).to.equal('Washington');
  });

  it('should handle invalid drill-down paths', () => {
    const costData = {
      name: 'Washington',
      children: [
        { name: 'Benton County', children: [] }
      ]
    };
    
    // Test with non-existent path
    const invalidPath = processDataForDrilldown(costData, ['Non-existent County']);
    expect(invalidPath.error).to.equal('Path not found');
    expect(invalidPath.current.name).to.equal('Washington');
  });
});

describe('Visualization Export Functionality', () => {
  it('should generate correct PDF export configuration', () => {
    const chartData = {
      title: 'Cost Comparison',
      data: [
        { name: 'Benton', value: 150 },
        { name: 'King', value: 200 }
      ]
    };
    
    const exportConfig = exportChartToPDF(chartData);
    
    expect(exportConfig).to.be.an('object');
    expect(exportConfig.filename).to.include('Cost_Comparison');
    expect(exportConfig.title).to.equal('Cost Comparison');
    expect(exportConfig.content).to.be.an('array');
    expect(exportConfig.styles).to.be.an('object');
  });
});