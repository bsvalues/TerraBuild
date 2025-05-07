/**
 * Smart Search API Test Script
 * 
 * This script tests the Smart Search API endpoints for searching properties and
 * neighborhoods with predictive suggestions.
 */

const API_URL = 'http://localhost:5000/api';

async function main() {
  console.log('Testing Smart Search API...');
  
  // Test the main search endpoint
  try {
    console.log('\nTesting main search endpoint...');
    const searchQuery = '14'; // This should match neighborhood codes in our test database
    
    console.log(`Searching for: "${searchQuery}"`);
    const searchResponse = await fetch(`${API_URL}/search?query=${encodeURIComponent(searchQuery)}`);
    const searchData = await searchResponse.json();
    
    if (searchData.success) {
      console.log('Search successful!');
      console.log('Results:');
      
      if (searchData.data.neighborhoods && searchData.data.neighborhoods.length > 0) {
        console.log(`\nNeighborhoods (${searchData.data.neighborhoods.length}):`);
        searchData.data.neighborhoods.forEach(neighborhood => {
          console.log(`- ${neighborhood.name} (${neighborhood.hood_cd}): ${neighborhood.propertyCount} properties`);
        });
      } else {
        console.log('No neighborhoods found');
      }
      
      if (searchData.data.properties && searchData.data.properties.length > 0) {
        console.log(`\nProperties (${searchData.data.properties.length}):`);
        searchData.data.properties.forEach(property => {
          console.log(`- ${property.address || 'No address'} (${property.prop_id || property.geo_id})`);
        });
      } else {
        console.log('No properties found');
      }
    } else {
      console.error('Search failed:', searchData.message);
    }
  } catch (error) {
    console.error('Error testing search endpoint:', error.message);
  }
  
  // Test the neighborhoods search endpoint
  try {
    console.log('\nTesting neighborhoods search endpoint...');
    const neighborhoodQuery = '140'; // This should match neighborhood codes
    
    console.log(`Searching for neighborhoods: "${neighborhoodQuery}"`);
    const neighborhoodResponse = await fetch(`${API_URL}/search/neighborhoods?query=${encodeURIComponent(neighborhoodQuery)}`);
    const neighborhoodData = await neighborhoodResponse.json();
    
    if (neighborhoodData.success) {
      console.log('Neighborhood search successful!');
      
      if (neighborhoodData.data && neighborhoodData.data.length > 0) {
        console.log(`Found ${neighborhoodData.data.length} neighborhoods:`);
        neighborhoodData.data.forEach(neighborhood => {
          console.log(`- ${neighborhood.name} (${neighborhood.hood_cd}): ${neighborhood.propertyCount} properties`);
        });
      } else {
        console.log('No neighborhoods found');
      }
    } else {
      console.error('Neighborhood search failed:', neighborhoodData.message);
    }
  } catch (error) {
    console.error('Error testing neighborhood search endpoint:', error.message);
  }
  
  // Test the properties search endpoint
  try {
    console.log('\nTesting properties search endpoint...');
    const propertyQuery = 'BC'; // This should match property IDs
    
    console.log(`Searching for properties: "${propertyQuery}"`);
    const propertyResponse = await fetch(`${API_URL}/search/properties?query=${encodeURIComponent(propertyQuery)}`);
    const propertyData = await propertyResponse.json();
    
    if (propertyData.success) {
      console.log('Property search successful!');
      
      if (propertyData.data && propertyData.data.length > 0) {
        console.log(`Found ${propertyData.data.length} properties:`);
        propertyData.data.forEach(property => {
          console.log(`- ${property.address || 'No address'} (${property.prop_id || property.geo_id})`);
          if (property.description) {
            console.log(`  Description: ${property.description}`);
          }
        });
      } else {
        console.log('No properties found');
      }
    } else {
      console.error('Property search failed:', propertyData.message);
    }
  } catch (error) {
    console.error('Error testing property search endpoint:', error.message);
  }
  
  console.log('\nSmart Search API test completed');
}

main().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});