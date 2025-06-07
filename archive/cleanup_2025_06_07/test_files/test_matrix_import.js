import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

async function testCostMatrixImport() {
  try {
    const form = new FormData();
    
    // For a simple test, create a buffer from a string (sample CSV)
    const csvContent = `region,buildingType,buildingTypeDescription,baseCost,matrixYear,sourceMatrixId,matrixDescription,dataPoints,notes,hasComplexityFactors,hasQualityFactors,isActive
Eastern,R1,Single Family Residential,120.50,2025,1001,Eastern region residential matrix,52,"Standard matrix for 2025",true,true,true
Western,C4,Office Building,145.75,2025,1002,Western region commercial matrix,38,"Updated rates for inflation",true,true,true`;
    
    form.append('file', Buffer.from(csvContent), {
      filename: 'test_cost_matrix.csv',
      contentType: 'text/csv',
    });
    
    form.append('userId', '1');
    form.append('year', '2025');
    form.append('region', 'All');
    
    console.log('Sending test request to cost matrix import API...');
    
    const response = await axios.post(
      'http://localhost:5000/api/cost-matrix/import',
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
      }
    );
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Now test the validation endpoint
    console.log('\nTesting validation endpoint...');
    
    const validateForm = new FormData();
    validateForm.append('file', Buffer.from(csvContent), {
      filename: 'test_cost_matrix.csv',
      contentType: 'text/csv',
    });
    
    const validateResponse = await axios.post(
      'http://localhost:5000/api/cost-matrix/validate',
      validateForm,
      {
        headers: {
          ...validateForm.getHeaders(),
        },
      }
    );
    
    console.log('Validation Response:', JSON.stringify(validateResponse.data, null, 2));
    
    // Get import records
    console.log('\nGetting import records...');
    
    const importsResponse = await axios.get('http://localhost:5000/api/cost-matrix/imports');
    console.log('Import Records:', JSON.stringify(importsResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing cost matrix import:', error.response ? error.response.data : error.message);
  }
}

testCostMatrixImport();