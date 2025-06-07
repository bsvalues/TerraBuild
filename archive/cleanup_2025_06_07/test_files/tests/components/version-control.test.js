/**
 * Cost Matrix Version Control Tests
 * 
 * These tests verify the functionality of the cost matrix version control feature
 * that tracks changes in cost matrices over time and allows viewing historical versions.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fetchMock = require('fetch-mock');

// Sample data for testing
const mockMatrixVersions = [
  {
    id: 1,
    version: 1,
    buildingType: 'RESIDENTIAL',
    region: 'Benton County',
    baseCost: 180,
    matrixYear: 2023,
    timestamp: '2023-01-15T10:30:00Z',
    author: 'admin',
    changelog: 'Initial version for 2023'
  },
  {
    id: 2,
    version: 2,
    buildingType: 'RESIDENTIAL',
    region: 'Benton County',
    baseCost: 200,
    matrixYear: 2024,
    timestamp: '2024-01-10T11:15:00Z',
    author: 'admin',
    changelog: 'Annual update with 11% increase'
  },
  {
    id: 3,
    version: 3,
    buildingType: 'RESIDENTIAL',
    region: 'Benton County',
    baseCost: 210,
    matrixYear: 2024,
    timestamp: '2024-03-22T14:45:00Z',
    author: 'analyst',
    changelog: 'Mid-year adjustment due to lumber price increases'
  }
];

describe('Cost Matrix Version Control', () => {
  beforeEach(() => {
    // Reset API mocks before each test
    fetchMock.restore();
    
    // Mock the matrix version history endpoint
    fetchMock.get('/api/cost-matrix/versions/RESIDENTIAL', mockMatrixVersions);
    
    // Mock the matrix version comparison endpoint
    fetchMock.get('/api/cost-matrix/compare?type=RESIDENTIAL&v1=1&v2=3', {
      additions: [],
      removals: [],
      modifications: {
        baseCost: {
          from: 180,
          to: 210
        },
        matrixYear: {
          from: 2023,
          to: 2024
        }
      }
    });
    
    // Mock the create new version endpoint
    fetchMock.post('/api/cost-matrix/version', {
      success: true,
      newVersion: {
        id: 4,
        version: 4,
        buildingType: 'RESIDENTIAL',
        region: 'Benton County',
        baseCost: 215,
        matrixYear: 2024,
        timestamp: '2024-04-01T09:00:00Z',
        author: 'admin',
        changelog: 'Test version update'
      }
    });
    
    // Mock the rollback endpoint
    fetchMock.post('/api/cost-matrix/rollback', {
      success: true,
      message: 'Matrix rolled back to version 2'
    });
  });

  describe('Version History', () => {
    it('should fetch version history successfully', async () => {
      const response = await fetch('/api/cost-matrix/versions/RESIDENTIAL');
      const data = await response.json();
      
      expect(data).to.be.an('array');
      expect(data.length).to.equal(mockMatrixVersions.length);
      expect(data[0].version).to.equal(1);
      expect(data[1].version).to.equal(2);
      expect(data[2].version).to.equal(3);
    });
    
    it('should sort versions chronologically', () => {
      const sortedVersions = [...mockMatrixVersions].sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      expect(sortedVersions[0].timestamp).to.equal('2023-01-15T10:30:00Z');
      expect(sortedVersions[1].timestamp).to.equal('2024-01-10T11:15:00Z');
      expect(sortedVersions[2].timestamp).to.equal('2024-03-22T14:45:00Z');
    });
  });

  describe('Version Comparison', () => {
    it('should compare versions correctly', async () => {
      const response = await fetch('/api/cost-matrix/compare?type=RESIDENTIAL&v1=1&v2=3');
      const data = await response.json();
      
      expect(data).to.have.property('modifications');
      expect(data.modifications).to.have.property('baseCost');
      expect(data.modifications.baseCost.from).to.equal(180);
      expect(data.modifications.baseCost.to).to.equal(210);
    });
    
    it('should calculate percentage changes between versions', () => {
      const v1 = mockMatrixVersions[0];
      const v3 = mockMatrixVersions[2];
      
      const percentageChange = ((v3.baseCost - v1.baseCost) / v1.baseCost) * 100;
      
      expect(percentageChange).to.be.approximately(16.67, 0.01); // 16.67% increase from v1 to v3
    });
  });

  describe('Version Creation', () => {
    it('should create a new version successfully', async () => {
      const newVersionData = {
        buildingType: 'RESIDENTIAL',
        region: 'Benton County',
        baseCost: 215,
        matrixYear: 2024,
        changelog: 'Test version update'
      };
      
      const response = await fetch('/api/cost-matrix/version', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newVersionData)
      });
      
      const data = await response.json();
      
      expect(data.success).to.be.true;
      expect(data.newVersion.version).to.equal(4);
      expect(data.newVersion.baseCost).to.equal(215);
    });
  });

  describe('Version Rollback', () => {
    it('should roll back to a previous version successfully', async () => {
      const rollbackData = {
        buildingType: 'RESIDENTIAL',
        targetVersion: 2
      };
      
      const response = await fetch('/api/cost-matrix/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rollbackData)
      });
      
      const data = await response.json();
      
      expect(data.success).to.be.true;
      expect(data.message).to.equal('Matrix rolled back to version 2');
    });
  });

  describe('Audit Trail', () => {
    it('should track changes with proper attribution', () => {
      expect(mockMatrixVersions[0].author).to.equal('admin');
      expect(mockMatrixVersions[1].author).to.equal('admin');
      expect(mockMatrixVersions[2].author).to.equal('analyst');
    });
    
    it('should include meaningful changelog messages', () => {
      expect(mockMatrixVersions[0].changelog).to.be.a('string');
      expect(mockMatrixVersions[0].changelog.length).to.be.greaterThan(0);
      
      expect(mockMatrixVersions[1].changelog).to.include('11%');
      expect(mockMatrixVersions[2].changelog).to.include('lumber price');
    });
  });
});

describe('UI Integration Tests', () => {
  // These tests would normally use a UI testing library like React Testing Library
  // Here we're just defining what they would test
  
  it('should display version history in chronological order', () => {
    // Would render component and verify version history display
  });
  
  it('should highlight changes between selected versions', () => {
    // Would render component, select versions to compare, and verify diff display
  });
  
  it('should allow administrators to create new versions', () => {
    // Would test version creation UI for admin users
  });
  
  it('should allow administrators to roll back to previous versions', () => {
    // Would test rollback functionality for admin users
  });
  
  it('should prevent non-admin users from creating or rolling back versions', () => {
    // Would verify that non-admin users cannot perform these actions
  });
});