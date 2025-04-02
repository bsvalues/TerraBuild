/**
 * Tests for 3D Building Cost Visualization Component
 * 
 * This suite tests the functionality of the 3D Building Cost Visualization
 * component which renders building costs on a 3D map.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BuildingCost3DVisualization } from '../client/src/components/visualizations/BuildingCost3DVisualization';

// Mock three.js and related libraries
jest.mock('three', () => {
  return {
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      setClearColor: jest.fn(),
      render: jest.fn(),
      domElement: document.createElement('canvas')
    })),
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      remove: jest.fn(),
      children: []
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
      position: { set: jest.fn() },
      lookAt: jest.fn()
    })),
    DirectionalLight: jest.fn(),
    AmbientLight: jest.fn(),
    Color: jest.fn(),
    Mesh: jest.fn(),
    MeshStandardMaterial: jest.fn(),
    BoxGeometry: jest.fn(),
    Vector3: jest.fn().mockImplementation(() => ({ set: jest.fn() })),
    Group: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      position: { set: jest.fn() },
      rotation: { set: jest.fn() }
    }))
  };
});

// Mock OrbitControls
jest.mock('three/examples/jsm/controls/OrbitControls', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    enableDamping: true,
    dampingFactor: 0.1,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }))
}));

// Mock data
const mockCostData = [
  { id: 1, region: 'Eastern', buildingType: 'Residential', squareFeet: 2000, baseCost: 250000, coordinates: { lat: 40.7128, lng: -74.0060 } },
  { id: 2, region: 'Western', buildingType: 'Commercial', squareFeet: 5000, baseCost: 750000, coordinates: { lat: 37.7749, lng: -122.4194 } },
  { id: 3, region: 'Southern', buildingType: 'Industrial', squareFeet: 10000, baseCost: 1500000, coordinates: { lat: 29.7604, lng: -95.3698 } }
];

// Mock context
jest.mock('@/contexts/visualization-context', () => ({
  useVisualizationContext: () => ({
    filters: null,
    setFilters: jest.fn(),
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    clearFilters: jest.fn(),
    selectedDatapoint: null,
    setSelectedDatapoint: jest.fn()
  })
}));

// Mock API request
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn().mockImplementation(() => Promise.resolve(mockCostData))
}));

describe('Building Cost 3D Visualization', () => {
  test('renders without crashing', () => {
    render(<BuildingCost3DVisualization />);
    expect(screen.getByTestId('3d-visualization')).toBeInTheDocument();
  });
  
  test('displays loading state initially', () => {
    render(<BuildingCost3DVisualization />);
    expect(screen.getByText(/loading visualization/i)).toBeInTheDocument();
  });
  
  test('renders visualization controls', async () => {
    render(<BuildingCost3DVisualization />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading visualization/i)).not.toBeInTheDocument();
    });
    
    // Check for control elements
    expect(screen.getByLabelText(/height scale/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/color mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset view/i })).toBeInTheDocument();
  });
  
  test('allows toggling between region and cost views', async () => {
    render(<BuildingCost3DVisualization />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading visualization/i)).not.toBeInTheDocument();
    });
    
    // Find and click view toggles
    const regionToggle = screen.getByLabelText(/region view/i);
    const costToggle = screen.getByLabelText(/cost view/i);
    
    // Toggle to cost view
    fireEvent.click(costToggle);
    expect(costToggle).toBeChecked();
    expect(regionToggle).not.toBeChecked();
    
    // Toggle back to region view
    fireEvent.click(regionToggle);
    expect(regionToggle).toBeChecked();
    expect(costToggle).not.toBeChecked();
  });
  
  test('displays legend with correct values', async () => {
    render(<BuildingCost3DVisualization />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading visualization/i)).not.toBeInTheDocument();
    });
    
    // Check legend is visible
    expect(screen.getByTestId('visualization-legend')).toBeInTheDocument();
    
    // Check for region names in the legend
    expect(screen.getByText(/eastern/i)).toBeInTheDocument();
    expect(screen.getByText(/western/i)).toBeInTheDocument();
    expect(screen.getByText(/southern/i)).toBeInTheDocument();
  });
  
  test('handles empty data gracefully', async () => {
    // Override mock for this test
    jest.spyOn(require('@/lib/queryClient'), 'apiRequest').mockResolvedValueOnce([]);
    
    render(<BuildingCost3DVisualization />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading visualization/i)).not.toBeInTheDocument();
    });
    
    // Check for empty state message
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
  
  test('displays building details on click', async () => {
    render(<BuildingCost3DVisualization />);
    
    await waitFor(() => {
      expect(screen.queryByText(/loading visualization/i)).not.toBeInTheDocument();
    });
    
    // Find and click on a building in the visualization
    // Note: Since we can't actually interact with Three.js in tests,
    // we're simulating the click handler being called
    const mockClickEvent = new MouseEvent('click', { bubbles: true });
    const visualization = screen.getByTestId('3d-visualization');
    
    // Mock the click handler's behavior of showing details
    // This would normally be handled inside the component
    setTimeout(() => {
      fireEvent.click(visualization, mockClickEvent);
      
      // Simulate selection of building #1
      window.dispatchEvent(new CustomEvent('buildingSelected', { 
        detail: mockCostData[0]
      }));
    }, 0);
    
    // Check that details panel appears
    await waitFor(() => {
      expect(screen.getByText(/building details/i)).toBeInTheDocument();
      expect(screen.getByText(/residential/i)).toBeInTheDocument();
      expect(screen.getByText(/eastern/i)).toBeInTheDocument();
      expect(screen.getByText(/250,000/i)).toBeInTheDocument();
    });
  });
});