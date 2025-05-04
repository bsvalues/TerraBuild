/**
 * Migration 020 - Add Property Value History Table
 * 
 * This migration adds the property_value_history table to track historical property values
 * for the property value heatmap feature with trend indicators.
 */

import { sql } from 'drizzle-orm';
import { pgTable, serial, uuid, timestamp, integer, text, jsonb } from 'drizzle-orm/pg-core';

export async function up(db) {
  console.log('Running migration: Add property_value_history table');
  
  // Create property_value_history table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS property_value_history (
      id SERIAL PRIMARY KEY,
      property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
      valuation_date TIMESTAMP NOT NULL,
      appraised_value INTEGER,
      assessed_value INTEGER,
      market_value INTEGER,
      land_value INTEGER,
      improvement_value INTEGER,
      source TEXT NOT NULL,
      assessment_year INTEGER,
      tax_year INTEGER,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      created_by TEXT REFERENCES users(id),
      metadata JSONB
    );
  `);
  
  // Add indexes for better query performance
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_property_value_history_property_id ON property_value_history(property_id);
    CREATE INDEX IF NOT EXISTS idx_property_value_history_valuation_date ON property_value_history(valuation_date);
    CREATE INDEX IF NOT EXISTS idx_property_value_history_assessment_year ON property_value_history(assessment_year);
  `);
  
  console.log('Migration complete: Added property_value_history table');
}

export async function down(db) {
  console.log('Running rollback: Remove property_value_history table');
  
  // Drop indexes
  await db.execute(sql`
    DROP INDEX IF EXISTS idx_property_value_history_property_id;
    DROP INDEX IF EXISTS idx_property_value_history_valuation_date;
    DROP INDEX IF EXISTS idx_property_value_history_assessment_year;
  `);
  
  // Drop table
  await db.execute(sql`
    DROP TABLE IF EXISTS property_value_history;
  `);
  
  console.log('Rollback complete: Removed property_value_history table');
}