/**
 * Test script for the Neighborhood Discovery Agent
 * 
 * This script tests the neighborhood discovery agent and its API endpoints.
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function main() {
  console.log('Testing Neighborhood Discovery API...');
  
  // First test the API health
  try {
    console.log('Checking API health...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'healthy') {
      console.log('API health check passed:', healthData.status);
    } else {
      console.warn('API health check warning:', healthData.status);
    }
  } catch (error) {
    console.error('API health check failed:', error.message);
    process.exit(1);
  }
  
  // Test the neighborhood codes endpoint
  try {
    console.log('\nGetting neighborhood codes...');
    const hoodResponse = await fetch(`${API_URL}/neighborhoods/codes`);
    const hoodData = await hoodResponse.json();
    
    if (hoodData.success) {
      console.log(`Found ${hoodData.data.length} unique neighborhood codes`);
      
      if (hoodData.data.length > 0) {
        console.log('Sample neighborhoods:');
        const samples = hoodData.data.slice(0, 3);
        samples.forEach(hood => {
          console.log(`- ${hood.hood_cd}: Properties: ${hood.propertyCount}, Name: ${hood.name}`);
        });
      }
    } else {
      console.error('Failed to get neighborhood codes:', hoodData.message);
    }
  } catch (error) {
    console.error('Neighborhood codes request failed:', error.message);
  }
  
  // Test the neighborhood discovery endpoint with a timeout
  try {
    console.log('\nTesting neighborhood discovery...');
    const discoveryParams = {
      minimumProperties: 3,
      useAI: false,
      limitResults: 5
    };
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 5 seconds')), 5000);
    });
    
    // Create the actual fetch promise
    const fetchPromise = fetch(`${API_URL}/neighborhoods/discover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discoveryParams)
    });
    
    // Race the fetch against the timeout
    console.log('Sending discovery request (with 5 second timeout)...');
    const discoveryResponse = await Promise.race([fetchPromise, timeoutPromise]);
    const discoveryData = await discoveryResponse.json();
    
    if (discoveryData.success) {
      console.log('Neighborhood discovery successful');
      console.log(`Discovered ${discoveryData.data.neighborhoods?.length || 0} neighborhoods`);
      
      if (discoveryData.data.neighborhoods?.length > 0) {
        const sample = discoveryData.data.neighborhoods[0];
        console.log('Sample neighborhood characteristics:');
        console.log(`- Hood code: ${sample.hood_cd}`);
        console.log(`- Name: ${sample.name}`);
        console.log(`- Property count: ${sample.propertyCount}`);
        if (sample.averageValue) console.log(`- Average value: ${sample.averageValue}`);
        if (sample.dominantPropertyType) console.log(`- Dominant property type: ${sample.dominantPropertyType}`);
        if (sample.averageYearBuilt) console.log(`- Average year built: ${sample.averageYearBuilt}`);
      }
    } else {
      console.error('Neighborhood discovery failed:', discoveryData.message);
    }
  } catch (error) {
    console.error('Neighborhood discovery request failed:', error.message);
    console.log('This may be expected if the agent processing is still running');
    console.log('You can check the agent logs for processing status');
  }
  
  // Test the neighborhood analysis endpoint with a sample hood_cd and timeout
  try {
    console.log('\nTesting neighborhood analysis...');
    
    // First get a sample hood_cd
    const hoodResponse = await fetch(`${API_URL}/neighborhoods/codes`);
    const hoodData = await hoodResponse.json();
    
    if (hoodData.success && hoodData.data.length > 0) {
      const sampleHoodCd = encodeURIComponent(hoodData.data[0].hood_cd);
      console.log(`Analyzing neighborhood with hood_cd: ${sampleHoodCd}`);
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out after 5 seconds')), 5000);
      });
      
      // Create the actual fetch promise
      const fetchPromise = fetch(`${API_URL}/neighborhoods/analyze/${sampleHoodCd}`);
      
      // Race the fetch against the timeout
      console.log('Sending analysis request (with 5 second timeout)...');
      const analysisResponse = await Promise.race([fetchPromise, timeoutPromise]);
      const analysisData = await analysisResponse.json();
      
      if (analysisData.success) {
        console.log('Neighborhood analysis successful');
        console.log('Analysis results:');
        console.log(`- Hood code: ${analysisData.data.hood_cd}`);
        console.log(`- Name: ${analysisData.data.name}`);
        console.log(`- Property count: ${analysisData.data.propertyCount}`);
        if (analysisData.data.averageValue) console.log(`- Average value: ${analysisData.data.averageValue}`);
        if (analysisData.data.dominantPropertyType) console.log(`- Dominant property type: ${analysisData.data.dominantPropertyType}`);
        if (analysisData.data.averageYearBuilt) console.log(`- Average year built: ${analysisData.data.averageYearBuilt}`);
      } else {
        console.error('Neighborhood analysis failed:', analysisData.message);
      }
    } else {
      console.log('No hood_cd available for testing analysis');
    }
  } catch (error) {
    console.error('Neighborhood analysis request failed:', error.message);
    console.log('This may be expected if the agent processing is still running');
    console.log('You can check the agent logs for processing status');
  }
  
  console.log('\nNeighborhood Discovery API test completed');
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});