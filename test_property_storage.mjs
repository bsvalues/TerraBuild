/**
 * Test script for property-storage.ts functionality
 * This script tests the CRUD operations of the property storage implementation
 */

import { db } from './server/db.js';
import { PropertyPostgresStorage } from './server/property-storage.js';

async function testPropertyStorage() {
  try {
    console.log("Testing PropertyPostgresStorage implementation...");
    
    // Initialize the storage
    const storage = new PropertyPostgresStorage();
    
    // Test 1: Get all properties (should work even if empty)
    console.log("\nTest 1: Get all properties");
    const allProperties = await storage.getAllProperties();
    console.log(`Retrieved ${allProperties.length} properties`);
    
    // Test 2: Create a test property
    console.log("\nTest 2: Create a property");
    const testProperty = {
      propId: 999999, // Using a very high number to avoid conflicts
      propertyType: "TEST",
      address: "123 Test Street",
      city: "Test City",
      state: "WA",
      zipCode: "99999",
      assessedValue: "100000"
    };
    
    let createdProperty;
    try {
      createdProperty = await storage.createProperty(testProperty);
      console.log("Property created successfully:", createdProperty.id);
    } catch (error) {
      console.error("Error creating property:", error.message);
      return;
    }
    
    // Test 3: Get property by ID
    console.log("\nTest 3: Get property by ID");
    const retrievedProperty = await storage.getProperty(createdProperty.id);
    console.log("Retrieved property:", retrievedProperty ? "Success" : "Failed");
    
    // Test 4: Get property by propId
    console.log("\nTest 4: Get property by propId");
    const retrievedByPropId = await storage.getPropertyByPropId(testProperty.propId);
    console.log("Retrieved property by propId:", retrievedByPropId ? "Success" : "Failed");
    
    // Test 5: Update property
    console.log("\nTest 5: Update property");
    const updateData = {
      address: "456 Updated Street",
      city: "Updated City"
    };
    
    const updatedProperty = await storage.updateProperty(createdProperty.id, updateData);
    console.log("Updated property:", updatedProperty ? "Success" : "Failed");
    console.log("New address:", updatedProperty ? updatedProperty.address : "N/A");
    
    // Test 6: Create a test improvement
    console.log("\nTest 6: Create an improvement");
    const testImprovement = {
      propId: testProperty.propId,
      imprvId: 888888, // Using a high number to avoid conflicts
      imprvDesc: "Test Improvement",
      imprvVal: "50000",
      livingArea: "2000",
      actualYearBuilt: 2020
    };
    
    let createdImprovement;
    try {
      createdImprovement = await storage.createImprovement(testImprovement);
      console.log("Improvement created successfully:", createdImprovement.id);
    } catch (error) {
      console.error("Error creating improvement:", error.message);
    }
    
    // Test 7: Get improvements by property ID
    console.log("\nTest 7: Get improvements by property ID");
    const improvements = await storage.getImprovementsByPropertyId(testProperty.propId);
    console.log(`Retrieved ${improvements.length} improvements`);
    
    // Test 8: Clean up - Delete the test property and related data
    console.log("\nTest 8: Clean up - Delete test data");
    if (createdImprovement) {
      await storage.deleteImprovement(createdImprovement.id);
      console.log("Deleted test improvement");
    }
    
    if (createdProperty) {
      await storage.deleteProperty(createdProperty.id);
      console.log("Deleted test property");
    }
    
    console.log("\nAll tests completed");
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the tests
testPropertyStorage()
  .then(() => console.log("Testing completed"))
  .catch(err => console.error("Testing failed:", err));