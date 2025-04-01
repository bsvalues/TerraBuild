/**
 * This script adds sample cost matrix data with county and state values for testing the benchmarking API
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function insertBenchmarkingTestData() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Sample counties and states with building types
    const testData = [
      {
        region: 'Northwest',
        building_type: 'Residential',
        base_cost: '100.00',
        county: 'Benton',
        state: 'Washington',
        building_type_description: 'Single Family Home',
        complexity_factor_base: '1.0',
        quality_factor_base: '1.1',
        condition_factor_base: '1.0',
        matrix_year: 2025,
        source_matrix_id: 1,
        matrix_description: 'Benton County Residential 2025',
        data_points: 150,
        min_cost: '90.00',
        max_cost: '110.00',
        is_active: true
      },
      {
        region: 'Northwest',
        building_type: 'Commercial',
        base_cost: '150.00',
        county: 'Benton',
        state: 'Washington',
        building_type_description: 'Office Building',
        complexity_factor_base: '1.2',
        quality_factor_base: '1.1',
        condition_factor_base: '1.0',
        matrix_year: 2025,
        source_matrix_id: 1,
        matrix_description: 'Benton County Commercial 2025',
        data_points: 85,
        min_cost: '140.00',
        max_cost: '160.00',
        is_active: true
      },
      {
        region: 'Northwest',
        building_type: 'Industrial',
        base_cost: '120.00',
        county: 'Benton',
        state: 'Washington',
        building_type_description: 'Warehouse',
        complexity_factor_base: '1.1',
        quality_factor_base: '1.1',
        condition_factor_base: '1.0',
        matrix_year: 2025,
        source_matrix_id: 1,
        matrix_description: 'Benton County Industrial 2025',
        data_points: 65,
        min_cost: '110.00',
        max_cost: '130.00',
        is_active: true
      },
      {
        region: 'Northwest',
        building_type: 'Residential',
        base_cost: '110.00',
        county: 'Franklin',
        state: 'Washington',
        building_type_description: 'Single Family Home',
        complexity_factor_base: '1.0',
        quality_factor_base: '1.15',
        condition_factor_base: '1.0',
        matrix_year: 2024,
        source_matrix_id: 2,
        matrix_description: 'Franklin County Residential 2024',
        data_points: 125,
        min_cost: '105.00',
        max_cost: '115.00',
        is_active: true
      },
      {
        region: 'Southwest',
        building_type: 'Residential',
        base_cost: '130.00',
        county: 'Clark',
        state: 'Washington',
        building_type_description: 'Single Family Home',
        complexity_factor_base: '1.0',
        quality_factor_base: '1.2',
        condition_factor_base: '1.0',
        matrix_year: 2024,
        source_matrix_id: 3,
        matrix_description: 'Clark County Residential 2024',
        data_points: 180,
        min_cost: '125.00',
        max_cost: '135.00',
        is_active: true
      },
      {
        region: 'Eastern',
        building_type: 'Residential',
        base_cost: '95.00',
        county: 'Spokane',
        state: 'Washington',
        building_type_description: 'Single Family Home',
        complexity_factor_base: '1.0',
        quality_factor_base: '1.05',
        condition_factor_base: '1.0',
        matrix_year: 2024,
        source_matrix_id: 4,
        matrix_description: 'Spokane County Residential 2024',
        data_points: 140,
        min_cost: '90.00',
        max_cost: '100.00',
        is_active: true
      },
      {
        region: 'Pacific',
        building_type: 'Residential',
        base_cost: '120.00',
        county: 'Mason',
        state: 'Oregon',
        building_type_description: 'Single Family Home',
        complexity_factor_base: '1.0',
        quality_factor_base: '1.1',
        condition_factor_base: '1.0',
        matrix_year: 2024,
        source_matrix_id: 5,
        matrix_description: 'Mason County Residential 2024',
        data_points: 110,
        min_cost: '115.00',
        max_cost: '125.00',
        is_active: true
      }
    ];

    console.log('Inserting test data...');
    
    for (const item of testData) {
      // Check if an entry with this county and building type already exists
      const checkQuery = `
        SELECT id FROM cost_matrix 
        WHERE county = $1 AND state = $2 AND building_type = $3
      `;
      const checkResult = await client.query(checkQuery, [item.county, item.state, item.building_type]);
      
      if (checkResult.rows.length > 0) {
        console.log(`Entry for ${item.county}, ${item.state}, ${item.building_type} already exists`);
        continue;
      }
      
      // Prepare the insert statement
      const insertQuery = `
        INSERT INTO cost_matrix (
          region, building_type, base_cost, county, state, building_type_description,
          complexity_factor_base, quality_factor_base, condition_factor_base, matrix_year, 
          source_matrix_id, matrix_description, data_points, min_cost, max_cost, is_active,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          NOW(), NOW()
        ) RETURNING id
      `;
      
      const result = await client.query(insertQuery, [
        item.region,
        item.building_type,
        item.base_cost,
        item.county,
        item.state,
        item.building_type_description,
        item.complexity_factor_base,
        item.quality_factor_base,
        item.condition_factor_base,
        item.matrix_year,
        item.source_matrix_id,
        item.matrix_description,
        item.data_points,
        item.min_cost,
        item.max_cost,
        item.is_active
      ]);
      
      console.log(`Added ${item.county}, ${item.state}, ${item.building_type} with ID: ${result.rows[0].id}`);
    }
    
    console.log('Test data insertion completed');
  } catch (error) {
    console.error('Error inserting test data:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

insertBenchmarkingTestData();