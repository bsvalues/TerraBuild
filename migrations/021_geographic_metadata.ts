import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Migration to add metadata fields to geographic entities
 * This is needed to store GeoJSON data and other geographic metadata
 * from the Benton County GIS system.
 */
export async function up() {
  console.log('Running migration: Adding metadata fields to geographic entities');
  
  // Add metadata column to geographic_regions table
  await db.execute(sql`
    ALTER TABLE geographic_regions
    ADD COLUMN metadata JSONB DEFAULT NULL;
  `);
  
  // Add metadata column to geographic_municipalities table
  await db.execute(sql`
    ALTER TABLE geographic_municipalities
    ADD COLUMN metadata JSONB DEFAULT NULL;
  `);
  
  // Add metadata column to geographic_neighborhoods table
  await db.execute(sql`
    ALTER TABLE geographic_neighborhoods
    ADD COLUMN metadata JSONB DEFAULT NULL;
  `);
  
  console.log('Migration complete: Added metadata fields to geographic entities');
}

export async function down() {
  console.log('Running migration rollback: Removing metadata fields from geographic entities');
  
  // Remove metadata column from geographic_regions table
  await db.execute(sql`
    ALTER TABLE geographic_regions
    DROP COLUMN metadata;
  `);
  
  // Remove metadata column from geographic_municipalities table
  await db.execute(sql`
    ALTER TABLE geographic_municipalities
    DROP COLUMN metadata;
  `);
  
  // Remove metadata column from geographic_neighborhoods table
  await db.execute(sql`
    ALTER TABLE geographic_neighborhoods
    DROP COLUMN metadata;
  `);
  
  console.log('Migration rollback complete: Removed metadata fields from geographic entities');
}