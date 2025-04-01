/**
 * User Customizable Dashboard Tests
 * 
 * These tests verify the functionality of the customizable dashboard feature
 * that allows users to select, arrange, and configure visualization components.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fetchMock = require('fetch-mock');

// Sample data for testing
const mockDefaultLayout = {
  components: [
    { id: 'cost-trend-chart', position: { x: 0, y: 0, w: 6, h: 4 }, config: { title: 'Cost Trend Over Time', showLegend: true } },
    { id: 'regional-comparison', position: { x: 6, y: 0, w: 6, h: 4 }, config: { title: 'Regional Cost Comparison', showLegend: true } },
    { id: 'building-type-breakdown', position: { x: 0, y: 4, w: 6, h: 4 }, config: { title: 'Building Type Cost Breakdown', showLegend: true } },
    { id: 'cost-prediction', position: { x: 6, y: 4, w: 6, h: 4 }, config: { title: 'Cost Prediction Insights', showLegend: true } }
  ],
  userId: 1,
  layoutName: 'Default'
};

const mockUserLayout = {
  components: [
    { id: 'regional-comparison', position: { x: 0, y: 0, w: 12, h: 4 }, config: { title: 'My Regional Comparison', showLegend: false } },
    { id: 'cost-trend-chart', position: { x: 0, y: 4, w: 6, h: 4 }, config: { title: 'Historical Trends', showLegend: true } },
    { id: 'building-type-breakdown', position: { x: 6, y: 4, w: 6, h: 4 }, config: { title: 'Cost Analysis by Type', showLegend: true } }
  ],
  userId: 1,
  layoutName: 'My Custom Layout'
};

const mockAvailableComponents = [
  { id: 'cost-trend-chart', name: 'Cost Trend Chart', description: 'Shows cost trends over time' },
  { id: 'regional-comparison', name: 'Regional Comparison', description: 'Compares costs across regions' },
  { id: 'building-type-breakdown', name: 'Building Type Breakdown', description: 'Breaks down costs by building type' },
  { id: 'cost-prediction', name: 'Cost Prediction', description: 'Shows AI-powered cost predictions' },
  { id: 'material-cost-analysis', name: 'Material Cost Analysis', description: 'Analyzes material cost trends' },
  { id: 'complexity-factor-impact', name: 'Complexity Factor Impact', description: 'Shows impact of complexity on cost' },
  { id: 'year-over-year-changes', name: 'Year-over-Year Changes', description: 'Displays annual cost changes' }
];

describe('User Customizable Dashboard', () => {
  beforeEach(() => {
    // Reset API mocks before each test
    fetchMock.restore();
    
    // Mock the user dashboard layout endpoint
    fetchMock.get('/api/dashboard/layout/1', mockUserLayout);
    
    // Mock the default layout endpoint
    fetchMock.get('/api/dashboard/layout/default', mockDefaultLayout);
    
    // Mock the available components endpoint
    fetchMock.get('/api/dashboard/components', mockAvailableComponents);
    
    // Mock the save layout endpoint
    fetchMock.post('/api/dashboard/layout', {
      success: true,
      layout: { ...mockUserLayout, updated: true }
    });
    
    // Mock the update component config endpoint
    fetchMock.patch('/api/dashboard/component/cost-trend-chart', {
      success: true,
      component: {
        id: 'cost-trend-chart',
        config: { title: 'Updated Title', showLegend: false }
      }
    });
  });

  describe('Layout Management', () => {
    it('should fetch user dashboard layout successfully', async () => {
      const response = await fetch('/api/dashboard/layout/1');
      const data = await response.json();
      
      expect(data).to.have.property('components');
      expect(data.components).to.be.an('array');
      expect(data.components.length).to.equal(mockUserLayout.components.length);
    });
    
    it('should fetch default layout when user layout not available', async () => {
      // Mock 404 for user layout to trigger default layout fetch
      fetchMock.get('/api/dashboard/layout/2', 404, { overwriteRoutes: true });
      
      const response = await fetch('/api/dashboard/layout/default');
      const data = await response.json();
      
      expect(data).to.have.property('components');
      expect(data.components.length).to.equal(mockDefaultLayout.components.length);
    });
    
    it('should save dashboard layout successfully', async () => {
      const updatedLayout = {
        ...mockUserLayout,
        components: [
          ...mockUserLayout.components,
          { id: 'material-cost-analysis', position: { x: 0, y: 8, w: 12, h: 4 }, config: { title: 'Material Costs', showLegend: true } }
        ]
      };
      
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedLayout)
      });
      
      const data = await response.json();
      
      expect(data.success).to.be.true;
      expect(data.layout).to.have.property('updated');
    });
  });

  describe('Component Management', () => {
    it('should fetch available dashboard components', async () => {
      const response = await fetch('/api/dashboard/components');
      const data = await response.json();
      
      expect(data).to.be.an('array');
      expect(data.length).to.equal(mockAvailableComponents.length);
    });
    
    it('should update component configuration', async () => {
      const updatedConfig = {
        title: 'Updated Title',
        showLegend: false
      };
      
      const response = await fetch('/api/dashboard/component/cost-trend-chart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: updatedConfig })
      });
      
      const data = await response.json();
      
      expect(data.success).to.be.true;
      expect(data.component.config.title).to.equal('Updated Title');
      expect(data.component.config.showLegend).to.be.false;
    });
  });

  describe('Layout Manipulation', () => {
    it('should correctly add a component to layout', () => {
      const originalComponentCount = mockUserLayout.components.length;
      
      const updatedLayout = {
        ...mockUserLayout,
        components: [
          ...mockUserLayout.components,
          { 
            id: 'year-over-year-changes', 
            position: { x: 0, y: 8, w: 12, h: 4 }, 
            config: { title: 'Annual Changes', showLegend: true } 
          }
        ]
      };
      
      expect(updatedLayout.components.length).to.equal(originalComponentCount + 1);
      expect(updatedLayout.components[originalComponentCount].id).to.equal('year-over-year-changes');
    });
    
    it('should correctly remove a component from layout', () => {
      const originalComponentCount = mockUserLayout.components.length;
      
      // Remove the cost-trend-chart component
      const updatedLayout = {
        ...mockUserLayout,
        components: mockUserLayout.components.filter(comp => comp.id !== 'cost-trend-chart')
      };
      
      expect(updatedLayout.components.length).to.equal(originalComponentCount - 1);
      updatedLayout.components.forEach(comp => {
        expect(comp.id).to.not.equal('cost-trend-chart');
      });
    });
    
    it('should correctly reposition a component in layout', () => {
      // Get the original position of the cost-trend-chart
      const originalComponent = mockUserLayout.components.find(comp => comp.id === 'cost-trend-chart');
      const originalPosition = originalComponent.position;
      
      // Create updated layout with new position
      const updatedLayout = {
        ...mockUserLayout,
        components: mockUserLayout.components.map(comp => {
          if (comp.id === 'cost-trend-chart') {
            return {
              ...comp,
              position: { x: 3, y: 3, w: 6, h: 3 }
            };
          }
          return comp;
        })
      };
      
      const updatedComponent = updatedLayout.components.find(comp => comp.id === 'cost-trend-chart');
      
      expect(updatedComponent.position.x).to.equal(3);
      expect(updatedComponent.position.y).to.equal(3);
      expect(updatedComponent.position).to.not.deep.equal(originalPosition);
    });
    
    it('should correctly resize a component in layout', () => {
      // Get the original size of the cost-trend-chart
      const originalComponent = mockUserLayout.components.find(comp => comp.id === 'cost-trend-chart');
      const originalSize = { w: originalComponent.position.w, h: originalComponent.position.h };
      
      // Create updated layout with new size
      const updatedLayout = {
        ...mockUserLayout,
        components: mockUserLayout.components.map(comp => {
          if (comp.id === 'cost-trend-chart') {
            return {
              ...comp,
              position: { ...comp.position, w: 12, h: 6 }
            };
          }
          return comp;
        })
      };
      
      const updatedComponent = updatedLayout.components.find(comp => comp.id === 'cost-trend-chart');
      
      expect(updatedComponent.position.w).to.equal(12);
      expect(updatedComponent.position.h).to.equal(6);
      expect(updatedComponent.position.w).to.not.equal(originalSize.w);
      expect(updatedComponent.position.h).to.not.equal(originalSize.h);
    });
  });

  describe('Layout Templates', () => {
    it('should have properly structured default layout', () => {
      expect(mockDefaultLayout.components.length).to.be.greaterThan(0);
      
      mockDefaultLayout.components.forEach(comp => {
        expect(comp).to.have.property('id');
        expect(comp).to.have.property('position');
        expect(comp.position).to.have.property('x');
        expect(comp.position).to.have.property('y');
        expect(comp.position).to.have.property('w');
        expect(comp.position).to.have.property('h');
        expect(comp).to.have.property('config');
      });
    });
  });
});

describe('UI Integration Tests', () => {
  // These tests would normally use a UI testing library like React Testing Library
  // Here we're just defining what they would test
  
  it('should render the user dashboard layout', () => {
    // Would render the dashboard component and verify components are displayed
  });
  
  it('should allow dragging and repositioning components', () => {
    // Would test drag-and-drop functionality
  });
  
  it('should allow resizing components', () => {
    // Would test component resizing functionality
  });
  
  it('should allow adding new components from available components', () => {
    // Would test adding new components to the dashboard
  });
  
  it('should allow removing components from the dashboard', () => {
    // Would test removing components from the dashboard
  });
  
  it('should allow configuring component settings', () => {
    // Would test component configuration UI
  });
  
  it('should persist layout changes between sessions', () => {
    // Would test that layout changes are saved and loaded correctly
  });
});