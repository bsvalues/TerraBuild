/**
 * Test script for Property Storage API endpoints
 * 
 * This script tests the CRUD operations for properties and related entities
 * through the API endpoints.
 */

import axios from 'axios';

// Configuration
const API_URL = 'http://localhost:5000';

// Test data for a property
const testProperty = {
  propId: 999999, // Using a high number to avoid conflicts
  propertyUseCd: "TEST",
  propertyUseDesc: "Test Property",
  legalDesc: "Test Legal Description",
  townshipSection: "01",
  townshipCode: "10",
  rangeCode: "25",
  assessedVal: "100000.00",
  market: "100000.00"
};

// Test data for an improvement
const testImprovement = {
  imprvId: 888888, // Using a high number to avoid conflicts
  imprvDesc: "Test Improvement",
  imprvVal: "50000.00",
  livingArea: "2000",
  actualYearBuilt: "2020",
  stories: "1.0"
};

// Test data for an improvement detail
const testImprovementDetail = {
  imprvDetDesc: "Test Detail",
  imprvDetArea: "1500.00",
  imprvDetClassCd: "PC-AV",
  imprvDetSubClassCd: "*",
  conditionCd: "AV",
  yrBuilt: "2020"
};

// Test data for an improvement item
const testImprovementItem = {
  bedrooms: "3.00",
  baths: "2.00",
  foundation: "Concrete",
  extWallDesc: "Wood",
  roofcoverDesc: "Comp Shingle",
  hvacDesc: "Heat pump",
  fireplaces: "1.00"
};

// Test data for a land detail
const testLandDetail = {
  sizeAcres: "1.5000",
  sizeSquareFeet: "65340.00",
  landTypeCd: "5",
  landSoilCode: "Dry Agland #1",
  primaryUseCd: "83"
};

async function testPropertyStorageApi() {
  try {
    console.log("Testing Property Storage API...");

    // Test 1: Get all properties
    console.log("\nTest 1: Get all properties");
    const propertiesResponse = await axios.get(`${API_URL}/api/properties`);
    console.log(`Retrieved ${propertiesResponse.data.length} properties`);

    // Test 2: Create a property
    console.log("\nTest 2: Create a property");
    let createdProperty;
    try {
      const createResponse = await axios.post(`${API_URL}/api/properties`, testProperty);
      createdProperty = createResponse.data;
      console.log(`Property created successfully with ID: ${createdProperty.id}`);
    } catch (error) {
      console.error("Error creating property:", error.response?.data?.message || error.message);
      if (error.response?.status === 400) {
        console.log("Attempting to get property by propId to see if it already exists");
        const existingResponse = await axios.get(`${API_URL}/api/properties/by-prop-id/${testProperty.propId}`);
        if (existingResponse.data) {
          createdProperty = existingResponse.data;
          console.log(`Using existing property with ID: ${createdProperty.id}`);
        } else {
          return;
        }
      } else {
        return;
      }
    }

    // Test 3: Get property by ID
    console.log("\nTest 3: Get property by ID");
    try {
      // Make sure we have a valid property ID
      if (!createdProperty || !createdProperty.id) {
        console.log("No valid property ID available, skipping this test");
      } else {
        const propertyResponse = await axios.get(`${API_URL}/api/properties/${createdProperty.id}`);
        console.log(`Retrieved property by ID: ${propertyResponse.data.id}`);
      }
    } catch (error) {
      console.error("Error getting property:", error.response?.data?.message || error.message);
    }

    // Test 4: Create an improvement for the property
    console.log("\nTest 4: Create an improvement");
    let createdImprovement;
    try {
      const improvementData = {
        ...testImprovement,
        propId: createdProperty.propId
      };
      const improvementResponse = await axios.post(`${API_URL}/api/improvements`, improvementData);
      createdImprovement = improvementResponse.data;
      console.log(`Improvement created successfully with ID: ${createdImprovement.id}`);
    } catch (error) {
      console.error("Error creating improvement:", error.response?.data?.message || error.message);
      return;
    }

    // Test 5: Get improvements for the property
    console.log("\nTest 5: Get improvements for property");
    try {
      const improvementsResponse = await axios.get(`${API_URL}/api/properties/${createdProperty.id}/improvements`);
      console.log(`Retrieved ${improvementsResponse.data.length} improvements for property`);
    } catch (error) {
      console.error("Error getting improvements:", error.response?.data?.message || error.message);
    }

    // Test 6: Create improvement detail
    console.log("\nTest 6: Create improvement detail");
    let createdDetail;
    try {
      const detailData = {
        ...testImprovementDetail,
        propId: createdProperty.propId,
        imprvId: createdImprovement.imprvId
      };
      const detailResponse = await axios.post(`${API_URL}/api/improvement-details`, detailData);
      createdDetail = detailResponse.data;
      console.log(`Improvement detail created successfully with ID: ${createdDetail.id}`);
    } catch (error) {
      console.error("Error creating improvement detail:", error.response?.data?.message || error.message);
    }

    // Test 7: Create improvement item
    console.log("\nTest 7: Create improvement item");
    let createdItem;
    try {
      const itemData = {
        ...testImprovementItem,
        propId: createdProperty.propId,
        imprvId: createdImprovement.imprvId
      };
      const itemResponse = await axios.post(`${API_URL}/api/improvement-items`, itemData);
      createdItem = itemResponse.data;
      console.log(`Improvement item created successfully with ID: ${createdItem.id}`);
    } catch (error) {
      console.error("Error creating improvement item:", error.response?.data?.message || error.message);
    }

    // Test 8: Create land detail
    console.log("\nTest 8: Create land detail");
    let createdLandDetail;
    try {
      const landDetailData = {
        ...testLandDetail,
        propId: createdProperty.propId
      };
      const landResponse = await axios.post(`${API_URL}/api/land-details`, landDetailData);
      createdLandDetail = landResponse.data;
      console.log(`Land detail created successfully with ID: ${createdLandDetail.id}`);
    } catch (error) {
      console.error("Error creating land detail:", error.response?.data?.message || error.message);
    }

    // Test 9: Update property
    console.log("\nTest 9: Update property");
    try {
      const updateData = {
        propertyUseDesc: "Updated Test Property"
      };
      const updateResponse = await axios.put(`${API_URL}/api/properties/${createdProperty.id}`, updateData);
      console.log(`Property updated successfully. New description: ${updateResponse.data.propertyUseDesc}`);
    } catch (error) {
      console.error("Error updating property:", error.response?.data?.message || error.message);
    }

    // Test 10: Test pagination in getAllProperties
    console.log("\nTest 10: Test pagination");
    try {
      const paginatedResponse = await axios.get(`${API_URL}/api/properties?limit=5&offset=0`);
      console.log(`Retrieved ${paginatedResponse.data.length} properties with pagination (limit=5, offset=0)`);
    } catch (error) {
      console.error("Error with pagination:", error.response?.data?.message || error.message);
    }

    // Test 11: Clean up - Delete test data
    // Only run this part if you want to clean up the test data
    const shouldCleanup = true;
    
    if (shouldCleanup) {
      console.log("\nTest 11: Clean up - Delete test data");
      
      // Delete in correct order to respect foreign key constraints
      if (createdLandDetail) {
        try {
          await axios.delete(`${API_URL}/api/land-details/${createdLandDetail.id}`);
          console.log("Deleted land detail");
        } catch (error) {
          console.error("Error deleting land detail:", error.response?.data?.message || error.message);
        }
      }
      
      if (createdItem) {
        try {
          await axios.delete(`${API_URL}/api/improvement-items/${createdItem.id}`);
          console.log("Deleted improvement item");
        } catch (error) {
          console.error("Error deleting improvement item:", error.response?.data?.message || error.message);
        }
      }
      
      if (createdDetail) {
        try {
          await axios.delete(`${API_URL}/api/improvement-details/${createdDetail.id}`);
          console.log("Deleted improvement detail");
        } catch (error) {
          console.error("Error deleting improvement detail:", error.response?.data?.message || error.message);
        }
      }
      
      if (createdImprovement) {
        try {
          await axios.delete(`${API_URL}/api/improvements/${createdImprovement.id}`);
          console.log("Deleted improvement");
        } catch (error) {
          console.error("Error deleting improvement:", error.response?.data?.message || error.message);
        }
      }
      
      if (createdProperty) {
        try {
          await axios.delete(`${API_URL}/api/properties/${createdProperty.id}`);
          console.log("Deleted property");
        } catch (error) {
          console.error("Error deleting property:", error.response?.data?.message || error.message);
        }
      }
    }

    console.log("\nAll tests completed");
  } catch (error) {
    console.error("Test failed with error:", error.message);
  }
}

// Run the tests
testPropertyStorageApi()
  .then(() => console.log("Testing completed"))
  .catch(err => console.error("Testing failed:", err));