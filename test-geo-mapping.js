/**
 * Geographic Mapping API Test
 * 
 * This test checks that the geo-mapping API routes are working correctly
 * and that the Geographic Mapping Agent is properly handling requests.
 */

import fetch from 'node-fetch';

// Base URL for API requests
const API_BASE = 'http://localhost:5000/api';

async function testGeoMapping() {
  console.log('Testing Geographic Mapping API...');
  
  // Check API health to verify server is running
  try {
    console.log('Checking API health...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('API health check passed:', healthData.status);
    } else {
      console.error('API health check failed:', healthData);
      return;
    }
  } catch (error) {
    console.error('Error checking API health:', error.message);
    return;
  }
  
  // Test neighborhood analysis endpoint
  try {
    console.log('\nTesting neighborhood analysis...');
    const analyzeResponse = await fetch(`${API_BASE}/geo-mapping/analyze/neighborhoods`);
    
    if (!analyzeResponse.ok) {
      console.error('Neighborhood analysis failed:', await analyzeResponse.text());
      return;
    }
    
    const analyzeData = await analyzeResponse.json();
    console.log('Neighborhood analysis success:', JSON.stringify(analyzeData, null, 2));
    
    // Check that we got some neighborhood data
    if (analyzeData.success && analyzeData.data && analyzeData.data.patterns) {
      console.log(`Found ${analyzeData.data.uniqueHoodCds} unique hood_cd values`);
      console.log('Sample patterns:');
      
      // Show a few sample patterns
      const sampleCount = Math.min(3, analyzeData.data.patterns.length);
      for (let i = 0; i < sampleCount; i++) {
        const pattern = analyzeData.data.patterns[i];
        console.log(`- hood_cd: ${pattern.hood_cd}, prefix: ${pattern.prefix}, possible city: ${pattern.possibleCity}`);
      }
    }
  } catch (error) {
    console.error('Error testing neighborhood analysis:', error.message);
  }
  
  // Test creating a neighborhood mapping
  try {
    console.log('\nTesting neighborhood creation...');
    
    // Create a test neighborhood 
    const createResponse = await fetch(`${API_BASE}/geo-mapping/neighborhood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hood_cd: '540100 999', // Test hood_cd
        municipalityId: 1,      // Assume municipality 1 exists
        name: 'Test Neighborhood'
      })
    });
    
    if (!createResponse.ok) {
      console.error('Neighborhood creation failed:', await createResponse.text());
      return;
    }
    
    const createData = await createResponse.json();
    console.log('Neighborhood creation success:', JSON.stringify(createData, null, 2));
  } catch (error) {
    console.error('Error testing neighborhood creation:', error.message);
  }
  
  console.log('\nGeographic Mapping API test completed');
}

// Run the test
testGeoMapping();