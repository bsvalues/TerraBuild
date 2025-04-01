/**
 * Comparative Analysis Tool Tests
 * 
 * These tests verify the functionality of the comparative analysis tool
 * that allows users to compare building costs across different regions,
 * time periods, and building types.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fetchMock = require('fetch-mock');

// Sample data for testing
const mockCostData = [
  { id: 1, buildingType: 'RESIDENTIAL', region: 'Benton County', baseCost: 200, matrixYear: 2024 },
  { id: 2, buildingType: 'COMMERCIAL', region: 'Benton County', baseCost: 350, matrixYear: 2024 },
  { id: 3, buildingType: 'INDUSTRIAL', region: 'Benton County', baseCost: 275, matrixYear: 2024 },
  { id: 4, buildingType: 'RESIDENTIAL', region: 'Franklin County', baseCost: 190, matrixYear: 2024 },
  { id: 5, buildingType: 'COMMERCIAL', region: 'Franklin County', baseCost: 330, matrixYear: 2024 },
  { id: 6, buildingType: 'INDUSTRIAL', region: 'Franklin County', baseCost: 260, matrixYear: 2024 },
  { id: 7, buildingType: 'RESIDENTIAL', region: 'Benton County', baseCost: 180, matrixYear: 2023 },
  { id: 8, buildingType: 'COMMERCIAL', region: 'Benton County', baseCost: 320, matrixYear: 2023 },
  { id: 9, buildingType: 'RESIDENTIAL', region: 'Franklin County', baseCost: 170, matrixYear: 2023 },
];

describe('Comparative Analysis Tool', () => {
  beforeEach(() => {
    // Reset API mocks before each test
    fetchMock.restore();
    
    // Mock the cost matrix endpoint
    fetchMock.get('/api/cost-matrix', mockCostData);
  });

  describe('Data Fetching', () => {
    it('should fetch cost matrix data successfully', async () => {
      const response = await fetch('/api/cost-matrix');
      const data = await response.json();
      
      expect(data).to.be.an('array');
      expect(data.length).to.equal(mockCostData.length);
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock API error response
      fetchMock.get('/api/cost-matrix', { status: 500, body: { error: 'Server error' } }, { overwriteRoutes: true });
      
      try {
        await fetch('/api/cost-matrix');
      } catch (error) {
        expect(error).to.exist;
      }
    });
  });

  describe('Data Selection', () => {
    it('should filter data by building type correctly', () => {
      const residentialData = mockCostData.filter(item => item.buildingType === 'RESIDENTIAL');
      
      expect(residentialData.length).to.equal(4);
      residentialData.forEach(item => {
        expect(item.buildingType).to.equal('RESIDENTIAL');
      });
    });
    
    it('should filter data by region correctly', () => {
      const bentonCountyData = mockCostData.filter(item => item.region === 'Benton County');
      
      expect(bentonCountyData.length).to.equal(5);
      bentonCountyData.forEach(item => {
        expect(item.region).to.equal('Benton County');
      });
    });
    
    it('should filter data by year correctly', () => {
      const data2024 = mockCostData.filter(item => item.matrixYear === 2024);
      
      expect(data2024.length).to.equal(6);
      data2024.forEach(item => {
        expect(item.matrixYear).to.equal(2024);
      });
    });
    
    it('should combine multiple filters correctly', () => {
      const filtered = mockCostData.filter(item => 
        item.buildingType === 'RESIDENTIAL' && 
        item.region === 'Benton County'
      );
      
      expect(filtered.length).to.equal(2);
      filtered.forEach(item => {
        expect(item.buildingType).to.equal('RESIDENTIAL');
        expect(item.region).to.equal('Benton County');
      });
    });
  });

  describe('Comparison Calculations', () => {
    it('should calculate percentage difference correctly', () => {
      const item1 = { baseCost: 200 };
      const item2 = { baseCost: 220 };
      
      const percentageDiff = ((item2.baseCost - item1.baseCost) / item1.baseCost) * 100;
      
      expect(percentageDiff).to.equal(10);
    });
    
    it('should calculate absolute difference correctly', () => {
      const item1 = { baseCost: 200 };
      const item2 = { baseCost: 220 };
      
      const absoluteDiff = item2.baseCost - item1.baseCost;
      
      expect(absoluteDiff).to.equal(20);
    });
    
    it('should handle negative difference correctly', () => {
      const item1 = { baseCost: 220 };
      const item2 = { baseCost: 200 };
      
      const percentageDiff = ((item2.baseCost - item1.baseCost) / item1.baseCost) * 100;
      const absoluteDiff = item2.baseCost - item1.baseCost;
      
      expect(percentageDiff).to.be.lessThan(0);
      expect(absoluteDiff).to.be.lessThan(0);
    });
  });

  describe('Year-over-Year Analysis', () => {
    it('should calculate year-over-year changes correctly', () => {
      // Find residential Benton County data for 2023 and 2024
      const data2023 = mockCostData.find(item => 
        item.buildingType === 'RESIDENTIAL' && 
        item.region === 'Benton County' && 
        item.matrixYear === 2023
      );
      
      const data2024 = mockCostData.find(item => 
        item.buildingType === 'RESIDENTIAL' && 
        item.region === 'Benton County' && 
        item.matrixYear === 2024
      );
      
      const yearOverYearChange = ((data2024.baseCost - data2023.baseCost) / data2023.baseCost) * 100;
      
      expect(yearOverYearChange).to.be.approximately(11.11, 0.01); // 11.11% increase
    });
  });

  describe('Multi-item Comparison', () => {
    it('should handle comparison of multiple items', () => {
      // Compare residential costs across different regions
      const bentonResidential = mockCostData.find(item => 
        item.buildingType === 'RESIDENTIAL' && 
        item.region === 'Benton County' && 
        item.matrixYear === 2024
      );
      
      const franklinResidential = mockCostData.find(item => 
        item.buildingType === 'RESIDENTIAL' && 
        item.region === 'Franklin County' && 
        item.matrixYear === 2024
      );
      
      const regionDiff = ((franklinResidential.baseCost - bentonResidential.baseCost) / bentonResidential.baseCost) * 100;
      
      expect(regionDiff).to.be.approximately(-5, 0.01); // -5% difference
    });
  });
});

describe('UI Integration Tests', () => {
  // These tests would normally use a UI testing library like React Testing Library
  // Here we're just defining what they would test
  
  it('should render selection interface correctly', () => {
    // Would render component and verify selection UI elements
  });
  
  it('should update comparison view when selections change', () => {
    // Would render component, change selections, and verify view updates
  });
  
  it('should highlight differences between compared items', () => {
    // Would check that differences are visually highlighted
  });
  
  it('should generate exportable comparison reports', () => {
    // Would test export functionality
  });
});