import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from '@shared/schema';

// Create a PostgreSQL connection pool
export const pool = new Pool({
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
      
      CREATE TABLE IF NOT EXISTS material_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        unit TEXT NOT NULL DEFAULT 'sqft',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS material_costs (
        id SERIAL PRIMARY KEY,
        material_type_id INTEGER NOT NULL,
        building_type TEXT NOT NULL,
        region TEXT NOT NULL,
        cost_per_unit DECIMAL(10,2) NOT NULL,
        default_percentage DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(material_type_id, building_type, region)
      );
      
      CREATE TABLE IF NOT EXISTS building_cost_materials (
        id SERIAL PRIMARY KEY,
        building_cost_id INTEGER NOT NULL,
        material_type_id INTEGER NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        cost_per_unit DECIMAL(10,2) NOT NULL,
        percentage DECIMAL(5,2) NOT NULL,
        total_cost DECIMAL(14,2) NOT NULL,
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
          ('DEV_AUTO_LOGIN_ENABLED', 'true', 'boolean'),
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
      // Add cost factors based on BCBS Building Cost Matrix 2025
      await pool.query(`
        INSERT INTO cost_factors (region, building_type, base_cost, complexity_factor, region_factor)
        VALUES 
          -- Northeast region factors 
          ('Northeast', 'Commercial', 225.50, 1.0, 1.25),
          ('Northeast', 'Residential', 185.75, 1.0, 1.20),
          ('Northeast', 'Industrial', 165.25, 1.0, 1.15),
          
          -- Midwest region factors (baseline)
          ('Midwest', 'Commercial', 195.50, 1.0, 1.0),
          ('Midwest', 'Residential', 160.75, 1.0, 1.0),
          ('Midwest', 'Industrial', 145.25, 1.0, 0.95),
          
          -- South region factors
          ('South', 'Commercial', 185.25, 1.0, 0.90),
          ('South', 'Residential', 155.50, 1.0, 0.85),
          ('South', 'Industrial', 135.75, 1.0, 0.85),
          
          -- West region factors
          ('West', 'Commercial', 245.75, 1.0, 1.35),
          ('West', 'Residential', 205.50, 1.0, 1.30),
          ('West', 'Industrial', 175.25, 1.0, 1.25)
      `);
    }
    
    // Check if material types exist
    const materialTypesExist = await pool.query("SELECT * FROM material_types LIMIT 1");
    
    if (materialTypesExist.rows.length === 0) {
      // Add material types
      await pool.query(`
        INSERT INTO material_types (name, code, description, unit)
        VALUES 
          ('Concrete', 'CON', 'Foundation and structural concrete', 'cubic yard'),
          ('Structural Steel', 'STL', 'Beams, columns, and structural framing', 'ton'),
          ('Lumber', 'LUM', 'Wood framing and carpentry', 'board feet'),
          ('Drywall', 'DRY', 'Gypsum wall board and finishing', 'sqft'),
          ('Roofing', 'ROOF', 'Roofing materials and installation', 'sqft'),
          ('HVAC', 'HVAC', 'Heating, ventilation, and air conditioning systems', 'unit'),
          ('Electrical', 'ELEC', 'Electrical systems and wiring', 'linear feet'),
          ('Plumbing', 'PLMB', 'Plumbing fixtures and piping', 'fixture'),
          ('Flooring', 'FLR', 'Floor coverings including tile, carpet, and wood', 'sqft'),
          ('Windows', 'WIN', 'Windows and glazing', 'unit'),
          ('Doors', 'DOOR', 'Interior and exterior doors', 'unit'),
          ('Insulation', 'INS', 'Thermal and acoustic insulation', 'sqft'),
          ('Paint', 'PAINT', 'Interior and exterior painting', 'gallon'),
          ('Site Work', 'SITE', 'Excavation, grading, and site preparation', 'cubic yard'),
          ('Finishes', 'FIN', 'Interior and exterior finishes', 'sqft')
      `);
    }
    
    // Check if material costs exist
    const materialCostsExist = await pool.query("SELECT * FROM material_costs LIMIT 1");
    
    if (materialCostsExist.rows.length === 0) {
      // Add material costs for Commercial buildings in Northeast region
      await pool.query(`
        INSERT INTO material_costs (material_type_id, building_type, region, cost_per_unit, default_percentage)
        VALUES 
          -- Commercial building in Northeast
          (1, 'Commercial', 'Northeast', 185.00, 15.00),  -- Concrete
          (2, 'Commercial', 'Northeast', 3250.00, 18.00), -- Structural Steel
          (3, 'Commercial', 'Northeast', 2.75, 5.00),     -- Lumber
          (4, 'Commercial', 'Northeast', 2.25, 4.00),     -- Drywall
          (5, 'Commercial', 'Northeast', 8.50, 7.00),     -- Roofing
          (6, 'Commercial', 'Northeast', 12000.00, 10.00),-- HVAC
          (7, 'Commercial', 'Northeast', 12.00, 8.00),    -- Electrical
          (8, 'Commercial', 'Northeast', 950.00, 7.00),   -- Plumbing
          (9, 'Commercial', 'Northeast', 7.50, 6.00),     -- Flooring
          (10, 'Commercial', 'Northeast', 850.00, 4.00),  -- Windows
          (11, 'Commercial', 'Northeast', 450.00, 3.00),  -- Doors
          (12, 'Commercial', 'Northeast', 1.75, 3.00),    -- Insulation
          (13, 'Commercial', 'Northeast', 45.00, 2.00),   -- Paint
          (14, 'Commercial', 'Northeast', 65.00, 4.00),   -- Site Work
          (15, 'Commercial', 'Northeast', 12.00, 4.00),   -- Finishes
          
          -- Residential building in Northeast
          (1, 'Residential', 'Northeast', 165.00, 12.00),  -- Concrete
          (2, 'Residential', 'Northeast', 2950.00, 10.00), -- Structural Steel
          (3, 'Residential', 'Northeast', 2.50, 15.00),    -- Lumber
          (4, 'Residential', 'Northeast', 2.00, 8.00),     -- Drywall
          (5, 'Residential', 'Northeast', 7.75, 7.00),     -- Roofing
          (6, 'Residential', 'Northeast', 8500.00, 8.00),  -- HVAC
          (7, 'Residential', 'Northeast', 10.00, 8.00),    -- Electrical
          (8, 'Residential', 'Northeast', 750.00, 8.00),   -- Plumbing
          (9, 'Residential', 'Northeast', 6.00, 7.00),     -- Flooring
          (10, 'Residential', 'Northeast', 650.00, 5.00),  -- Windows
          (11, 'Residential', 'Northeast', 350.00, 4.00),  -- Doors
          (12, 'Residential', 'Northeast', 1.50, 3.00),    -- Insulation
          (13, 'Residential', 'Northeast', 40.00, 2.00),   -- Paint
          (14, 'Residential', 'Northeast', 55.00, 1.00),   -- Site Work
          (15, 'Residential', 'Northeast', 10.00, 2.00)    -- Finishes
      `);
      
      // Add more material costs for regions and building types
      await pool.query(`
        INSERT INTO material_costs (material_type_id, building_type, region, cost_per_unit, default_percentage)
        VALUES
          -- Commercial building in Midwest (baseline)
          (1, 'Commercial', 'Midwest', 160.00, 15.00),  -- Concrete
          (2, 'Commercial', 'Midwest', 2950.00, 18.00), -- Structural Steel
          (3, 'Commercial', 'Midwest', 2.45, 5.00),     -- Lumber
          (4, 'Commercial', 'Midwest', 1.95, 4.00),     -- Drywall
          (5, 'Commercial', 'Midwest', 7.50, 7.00),     -- Roofing
          (6, 'Commercial', 'Midwest', 10500.00, 10.00),-- HVAC
          (7, 'Commercial', 'Midwest', 10.50, 8.00),    -- Electrical
          (8, 'Commercial', 'Midwest', 850.00, 7.00),   -- Plumbing
          (9, 'Commercial', 'Midwest', 6.25, 6.00),     -- Flooring
          (10, 'Commercial', 'Midwest', 750.00, 4.00),  -- Windows
          (11, 'Commercial', 'Midwest', 400.00, 3.00),  -- Doors
          (12, 'Commercial', 'Midwest', 1.55, 3.00),    -- Insulation
          (13, 'Commercial', 'Midwest', 40.00, 2.00),   -- Paint
          (14, 'Commercial', 'Midwest', 55.00, 4.00),   -- Site Work
          (15, 'Commercial', 'Midwest', 10.00, 4.00)    -- Finishes
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