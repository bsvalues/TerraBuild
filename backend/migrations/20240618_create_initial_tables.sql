-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Properties table (with GIS/geometry)
CREATE TABLE property (
    id SERIAL PRIMARY KEY,
    parcel_id VARCHAR(32) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    owner TEXT,
    imp_type VARCHAR(32),
    quality VARCHAR(32),
    year_built INTEGER,
    sqft NUMERIC(10,2),
    region VARCHAR(32),
    geom geometry(Point, 4326), -- PostGIS
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cost table
CREATE TABLE cost_table (
    id SERIAL PRIMARY KEY,
    imp_type VARCHAR(32) NOT NULL,
    quality VARCHAR(32) NOT NULL,
    year INTEGER NOT NULL,
    region VARCHAR(32) NOT NULL,
    cost_per_sqft NUMERIC(10,2) NOT NULL,
    source TEXT,
    notes TEXT,
    version INTEGER DEFAULT 1,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (imp_type, quality, year, region, version)
);

-- Depreciation schedule
CREATE TABLE depreciation_schedule (
    id SERIAL PRIMARY KEY,
    schedule_type VARCHAR(32) NOT NULL,
    effective_age INTEGER NOT NULL,
    percent_good NUMERIC(5,2) NOT NULL,
    source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (schedule_type, effective_age)
);

-- User table for authentication
CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('admin', 'assessor', 'analyst', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Valuation records with calculation chains
CREATE TABLE valuation (
    id SERIAL PRIMARY KEY,
    parcel_id INTEGER REFERENCES property(id),
    imp_type VARCHAR(32) NOT NULL,
    quality VARCHAR(32) NOT NULL,
    sqft NUMERIC(10,2) NOT NULL,
    year_built INTEGER NOT NULL,
    region VARCHAR(32) NOT NULL,
    rcn NUMERIC(12,2) NOT NULL,
    percent_good NUMERIC(5,2) NOT NULL,
    final_value NUMERIC(12,2) NOT NULL,
    calculation_chain JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES "user"(id)
);

-- GIS Layer (generic, for extensible layers)
CREATE TABLE gis_layer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) UNIQUE NOT NULL,
    feature_type VARCHAR(32) NOT NULL,
    geom geometry(MultiPolygon, 4326),
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table for modeling
CREATE TABLE scenario (
    id SERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    parameters JSONB NOT NULL,
    results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES "user"(id)
);

-- Batch upload tracking
CREATE TABLE batch_upload (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'processing',
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    error_log TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES "user"(id)
);

-- Create indexes for performance
CREATE INDEX idx_property_parcel_id ON property(parcel_id);
CREATE INDEX idx_property_geom ON property USING GIST(geom);
CREATE INDEX idx_cost_table_lookup ON cost_table(imp_type, quality, year, region);
CREATE INDEX idx_valuation_parcel ON valuation(parcel_id);
CREATE INDEX idx_valuation_created_at ON valuation(created_at);
CREATE INDEX idx_depreciation_lookup ON depreciation_schedule(schedule_type, effective_age);
CREATE INDEX idx_gis_layer_geom ON gis_layer USING GIST(geom);

-- Create default admin user (password: admin123)
INSERT INTO "user" (username, password_hash, role) VALUES 
('admin', '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$x8DQ7m6qF6Qqo3eUP1oZrq8a7x8zK4w9a4hK8rZ9xT0', 'admin');

-- Insert sample cost data
INSERT INTO cost_table (imp_type, quality, year, region, cost_per_sqft, source, effective_date) VALUES
('RESIDENTIAL', 'Average', 2024, 'North', 195.00, 'Marshall Swift', '2024-01-01'),
('RESIDENTIAL', 'Good', 2024, 'North', 225.00, 'Marshall Swift', '2024-01-01'),
('RESIDENTIAL', 'Excellent', 2024, 'North', 275.00, 'Marshall Swift', '2024-01-01'),
('COMMERCIAL', 'Average', 2024, 'North', 145.00, 'Marshall Swift', '2024-01-01'),
('COMMERCIAL', 'Good', 2024, 'North', 175.00, 'Marshall Swift', '2024-01-01');

-- Insert sample depreciation schedules
INSERT INTO depreciation_schedule (schedule_type, effective_age, percent_good, source) VALUES
('RESIDENTIAL', 0, 1.00, 'Standard Schedule'),
('RESIDENTIAL', 5, 0.95, 'Standard Schedule'),
('RESIDENTIAL', 10, 0.90, 'Standard Schedule'),
('RESIDENTIAL', 15, 0.85, 'Standard Schedule'),
('RESIDENTIAL', 20, 0.80, 'Standard Schedule'),
('COMMERCIAL', 0, 1.00, 'Standard Schedule'),
('COMMERCIAL', 5, 0.92, 'Standard Schedule'),
('COMMERCIAL', 10, 0.84, 'Standard Schedule'),
('COMMERCIAL', 15, 0.76, 'Standard Schedule'),
('COMMERCIAL', 20, 0.68, 'Standard Schedule');