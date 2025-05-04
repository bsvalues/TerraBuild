import { sql } from 'drizzle-orm';

/**
 * Migration: Create Geographic Data Performance Indexes
 * 
 * This migration creates indexes to optimize performance for geographic data queries.
 * These indexes improve lookup performance for region, municipality, and neighborhood queries,
 * as well as for township/range and tax code area mapping lookups.
 */
export async function up(db) {
  console.log('Running migration: Create Geographic Data Performance Indexes');

  // Geographic entity indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_geo_municipalities_region_id 
    ON geographic_municipalities(region_id);

    CREATE INDEX IF NOT EXISTS idx_geo_neighborhoods_municipality_id 
    ON geographic_neighborhoods(municipality_id);

    CREATE INDEX IF NOT EXISTS idx_geo_municipalities_code 
    ON geographic_municipalities(municipality_code);

    CREATE INDEX IF NOT EXISTS idx_geo_regions_code 
    ON geographic_regions(region_code);

    -- Mapping table indexes for lookups
    CREATE INDEX IF NOT EXISTS idx_township_range_mapping_codes 
    ON township_range_mapping(township_code, range_code);

    CREATE INDEX IF NOT EXISTS idx_township_range_mapping_region 
    ON township_range_mapping(region_id);

    CREATE INDEX IF NOT EXISTS idx_township_range_mapping_municipality 
    ON township_range_mapping(municipality_id);

    CREATE INDEX IF NOT EXISTS idx_tax_code_area_mapping_tca 
    ON tax_code_area_mapping(tca);

    CREATE INDEX IF NOT EXISTS idx_tax_code_area_mapping_region 
    ON tax_code_area_mapping(region_id);

    CREATE INDEX IF NOT EXISTS idx_tax_code_area_mapping_municipality 
    ON tax_code_area_mapping(municipality_id);

    -- Active entity indexes for faster filtering
    CREATE INDEX IF NOT EXISTS idx_geo_regions_active 
    ON geographic_regions(is_active) 
    WHERE is_active = true;

    CREATE INDEX IF NOT EXISTS idx_geo_municipalities_active 
    ON geographic_municipalities(is_active) 
    WHERE is_active = true;
  `);
}

/**
 * Down migration to remove the indexes if needed
 */
export async function down(db) {
  console.log('Running down migration: Remove Geographic Data Performance Indexes');

  await db.execute(sql`
    DROP INDEX IF EXISTS idx_geo_municipalities_region_id;
    DROP INDEX IF EXISTS idx_geo_neighborhoods_municipality_id;
    DROP INDEX IF EXISTS idx_geo_municipalities_code;
    DROP INDEX IF EXISTS idx_geo_regions_code;
    DROP INDEX IF EXISTS idx_township_range_mapping_codes;
    DROP INDEX IF EXISTS idx_township_range_mapping_region;
    DROP INDEX IF EXISTS idx_township_range_mapping_municipality;
    DROP INDEX IF EXISTS idx_tax_code_area_mapping_tca;
    DROP INDEX IF EXISTS idx_tax_code_area_mapping_region;
    DROP INDEX IF EXISTS idx_tax_code_area_mapping_municipality;
    DROP INDEX IF EXISTS idx_geo_regions_active;
    DROP INDEX IF EXISTS idx_geo_municipalities_active;
  `);
}