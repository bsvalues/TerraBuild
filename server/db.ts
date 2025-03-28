import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle instance using the PostgreSQL pool
export const db = drizzle(pool, { schema });

// Utility function to initialize the database tables
export async function initDatabase() {
  try {
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        name TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS environments (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS api_endpoints (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'online',
        requires_auth BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT NOT NULL DEFAULT 'string'
      );

      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        icon TEXT NOT NULL,
        icon_color TEXT NOT NULL DEFAULT 'primary',
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS repository_status (
        id SERIAL PRIMARY KEY,
        source_repo TEXT NOT NULL,
        target_repo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        steps JSONB NOT NULL DEFAULT '[]',
        cloned_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS building_costs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        region TEXT NOT NULL,
        building_type TEXT NOT NULL,
        square_footage INTEGER NOT NULL,
        cost_per_sqft DECIMAL(10,2) NOT NULL,
        total_cost DECIMAL(14,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cost_factors (
        id SERIAL PRIMARY KEY,
        region TEXT NOT NULL,
        building_type TEXT NOT NULL,
        base_cost DECIMAL(10,2) NOT NULL,
        complexity_factor DECIMAL(5,2) NOT NULL DEFAULT 1.0,
        region_factor DECIMAL(5,2) NOT NULL DEFAULT 1.0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Add default data if not already exists
    await addDefaultData();
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

async function addDefaultData() {
  try {
    // Check if admin user exists
    const adminExists = await pool.query("SELECT * FROM users WHERE username = 'admin' LIMIT 1");
    
    if (adminExists.rows.length === 0) {
      // Add admin user
      await pool.query(`
        INSERT INTO users (username, password, role, name, is_active)
        VALUES ('admin', 'password', 'admin', 'Admin User', true)
      `);
    }

    // Check if environments exist
    const envExists = await pool.query("SELECT * FROM environments LIMIT 1");
    
    if (envExists.rows.length === 0) {
      // Add environments
      await pool.query(`
        INSERT INTO environments (name, is_active)
        VALUES 
          ('Development', true),
          ('Staging', true),
          ('Production', true)
      `);
    }

    // Check if API endpoints exist
    const endpointsExist = await pool.query("SELECT * FROM api_endpoints LIMIT 1");
    
    if (endpointsExist.rows.length === 0) {
      // Add API endpoints
      await pool.query(`
        INSERT INTO api_endpoints (path, method, status, requires_auth)
        VALUES 
          ('/api/costs', 'GET', 'online', true),
          ('/api/costs/{id}', 'GET', 'online', true),
          ('/api/costs', 'POST', 'online', true),
          ('/api/costs/{id}', 'PUT', 'degraded', true),
          ('/api/costs/{id}', 'DELETE', 'online', true)
      `);
    }

    // Check if settings exist
    const settingsExist = await pool.query("SELECT * FROM settings LIMIT 1");
    
    if (settingsExist.rows.length === 0) {
      // Add settings
      await pool.query(`
        INSERT INTO settings (key, value, type)
        VALUES 
          ('SAAS_MODE', 'true', 'boolean'),
          ('DEV_AUTOLOGIN', 'true', 'boolean'),
          ('DEBUG_MODE', 'false', 'boolean'),
          ('API_RATE_LIMITING', 'true', 'boolean'),
          ('DEV_AUTH_TOKEN', 'dev_tk_7f9a8b3c2d1e0f4a5b6c7d8e9f0a1b2c3d4e5f6', 'string')
      `);
    }

    // Check if repository status exists
    const repoExists = await pool.query("SELECT * FROM repository_status LIMIT 1");
    
    if (repoExists.rows.length === 0) {
      // Add repository status
      await pool.query(`
        INSERT INTO repository_status (source_repo, target_repo, status, steps, cloned_at)
        VALUES (
          'bsvalues/BSBuildingCost',
          'yourteam/BSBuildingCost',
          'complete',
          '[
            {"name": "Repository cloned successfully", "completed": true},
            {"name": "Dependencies installed", "completed": true},
            {"name": "Environment configured", "completed": true},
            {"name": "Build completed", "completed": true},
            {"name": "Application deployed", "completed": true}
          ]'::jsonb,
          NOW()
        )
      `);
    }

    // Check if cost factors exist
    const factorsExist = await pool.query("SELECT * FROM cost_factors LIMIT 1");
    
    if (factorsExist.rows.length === 0) {
      // Add cost factors
      await pool.query(`
        INSERT INTO cost_factors (region, building_type, base_cost, complexity_factor, region_factor)
        VALUES 
          ('Northeast', 'Commercial', 250.00, 1.2, 1.3),
          ('Midwest', 'Commercial', 200.00, 1.1, 1.0),
          ('South', 'Commercial', 180.00, 1.0, 0.9),
          ('West', 'Commercial', 275.00, 1.2, 1.5),
          ('Northeast', 'Residential', 200.00, 1.1, 1.2),
          ('Midwest', 'Residential', 175.00, 1.0, 0.9),
          ('South', 'Residential', 150.00, 0.9, 0.8),
          ('West', 'Residential', 225.00, 1.1, 1.4),
          ('Northeast', 'Industrial', 180.00, 1.0, 1.2),
          ('Midwest', 'Industrial', 150.00, 0.9, 1.0),
          ('South', 'Industrial', 130.00, 0.8, 0.9),
          ('West', 'Industrial', 190.00, 1.0, 1.3)
      `);
    }
    
    // Add activity
    await pool.query(`
      INSERT INTO activities (action, icon, icon_color)
      VALUES 
        ('Database initialized with default data', 'ri-database-2-line', 'success')
    `);

  } catch (error) {
    console.error('Error adding default data:', error);
    throw error;
  }
}