import axios from 'axios';

async function testCostMatrixImport() {
  try {
    // Create test data - array of cost matrix entries
    const costMatrixEntries = [
      {
        region: 'Eastern',
        buildingType: 'R1',
        buildingTypeDescription: 'Single Family Residential',
        baseCost: '120.50',
        matrixYear: 2025,
        sourceMatrixId: 1001,
        matrixDescription: 'Eastern region residential matrix',
        dataPoints: 52,
        notes: 'Standard matrix for 2025',
        hasComplexityFactors: true,
        hasQualityFactors: true,
        isActive: true
      },
      {
        region: 'Western',
        buildingType: 'C4',
        buildingTypeDescription: 'Office Building',
        baseCost: '145.75',
        matrixYear: 2025,
        sourceMatrixId: 1002,
        matrixDescription: 'Western region commercial matrix',
        dataPoints: 38,
        notes: 'Updated rates for inflation',
        hasComplexityFactors: true, 
        hasQualityFactors: true,
        isActive: true
      }
    ];
    
    console.log('Sending test request to cost matrix JSON import API...');
    
    const response = await axios.post(
      'http://localhost:5000/api/cost-matrix/import',
      { data: costMatrixEntries },
      { 
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Also test the batch endpoint
    console.log('\nTesting batch endpoint...');
    
    const batchResponse = await axios.post(
      'http://localhost:5000/api/cost-matrix/batch',
      { entries: costMatrixEntries },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Batch Response:', JSON.stringify(batchResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing cost matrix import:', error.response ? error.response.data : error.message);
  }
}

testCostMatrixImport();