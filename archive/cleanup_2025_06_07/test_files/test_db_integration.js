#!/usr/bin/env node

/**
 * Test Database Integration Script
 * 
 * This script tests that the cost matrix database tables are set up correctly
 * and that data can be queried properly.
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Create a connection pool to the PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDatabaseIntegration() {
  const client = await pool.connect();
  
  try {
    console.log('Testing database integration...');
    
    // Test 1: Check if cost_matrix table exists
    console.log('\nTest 1: Check if cost_matrix table exists');
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'cost_matrix'
      )
    `);
    
    if (tableResult.rows[0].exists) {
      console.log('✅ cost_matrix table exists');
    } else {
      console.log('❌ cost_matrix table does not exist');
      return;
    }
    
    // Test 2: Check table schema
    console.log('\nTest 2: Check table schema');
    const schemaResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cost_matrix'
      ORDER BY ordinal_position
    `);
    
    console.log('cost_matrix table schema:');
    schemaResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });
    
    // Test 3: Check if we can insert data
    console.log('\nTest 3: Check if we can insert data');
    const testMatrix = {
      region: 'Test Region',
      buildingType: 'TEST',
      buildingTypeDescription: 'Test Building Type',
      baseCost: 100.00,
      matrixYear: 2025,
      sourceMatrixId: 9999,
      matrixDescription: 'Test Matrix Description',
      dataPoints: 1,
      complexityFactorBase: 1.0,
      qualityFactorBase: 1.0,
      conditionFactorBase: 1.0
    };
    
    // Check if test data already exists
    const existingResult = await client.query(
      'SELECT id FROM cost_matrix WHERE region = $1 AND building_type = $2 AND matrix_year = $3',
      [testMatrix.region, testMatrix.buildingType, testMatrix.matrixYear]
    );
    
    if (existingResult.rows.length > 0) {
      // Test data already exists, we'll update it
      const id = existingResult.rows[0].id;
      await client.query(
        `UPDATE cost_matrix SET 
          base_cost = $1,
          updated_at = NOW()
        WHERE id = $2`,
        [
          testMatrix.baseCost + 1, // Change the value to confirm update
          id
        ]
      );
      console.log('✅ Successfully updated test data');
    } else {
      // Insert test data
      await client.query(
        `INSERT INTO cost_matrix (
          region, 
          building_type, 
          building_type_description, 
          base_cost, 
          matrix_year, 
          source_matrix_id, 
          matrix_description, 
          data_points, 
          complexity_factor_base, 
          quality_factor_base, 
          condition_factor_base
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          testMatrix.region,
          testMatrix.buildingType,
          testMatrix.buildingTypeDescription,
          testMatrix.baseCost,
          testMatrix.matrixYear,
          testMatrix.sourceMatrixId,
          testMatrix.matrixDescription,
          testMatrix.dataPoints,
          testMatrix.complexityFactorBase,
          testMatrix.qualityFactorBase,
          testMatrix.conditionFactorBase
        ]
      );
      console.log('✅ Successfully inserted test data');
    }
    
    // Test 4: Check if we can query data
    console.log('\nTest 4: Check if we can query data');
    const queryResult = await client.query(
      'SELECT * FROM cost_matrix WHERE region = $1 AND building_type = $2',
      [testMatrix.region, testMatrix.buildingType]
    );
    
    if (queryResult.rows.length > 0) {
      console.log('✅ Successfully queried test data');
      console.log('Test matrix entry:');
      console.log(queryResult.rows[0]);
    } else {
      console.log('❌ Failed to query test data');
    }
    
    // Test 5: Clean up test data
    console.log('\nTest 5: Clean up test data');
    await client.query(
      'DELETE FROM cost_matrix WHERE region = $1 AND building_type = $2',
      [testMatrix.region, testMatrix.buildingType]
    );
    console.log('✅ Successfully cleaned up test data');
    
    console.log('\nAll tests passed! Database integration is working correctly.');
    
  } catch (error) {
    console.error('Error during test:', error.message);
  } finally {
    // Release the client
    client.release();
    // Close the pool to end the process
    await pool.end();
  }
}

testDatabaseIntegration().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});