-- Migration 022: GIS Analysis Tables for TerraFusion
-- Creates comprehensive geospatial analysis infrastructure

-- GIS Layers table for organizing geospatial data
CREATE TABLE IF NOT EXISTS gis_layers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    source VARCHAR(255),
    geometry_type VARCHAR(50),
    srid INTEGER DEFAULT 4326,
    bounds JSONB,
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gis_layers_name ON gis_layers(name);
CREATE INDEX idx_gis_layers_type ON gis_layers(type);
CREATE INDEX idx_gis_layers_active ON gis_layers(is_active);

-- GIS Features table for storing individual geospatial features
CREATE TABLE IF NOT EXISTS gis_features (
    id SERIAL PRIMARY KEY,
    layer_id INTEGER REFERENCES gis_layers(id) NOT NULL,
    feature_id VARCHAR(100),
    geometry JSONB NOT NULL,
    properties JSONB,
    centroid_lat DOUBLE PRECISION,
    centroid_lng DOUBLE PRECISION,
    area DOUBLE PRECISION,
    perimeter DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gis_features_layer ON gis_features(layer_id);
CREATE INDEX idx_gis_features_centroid ON gis_features(centroid_lat, centroid_lng);
CREATE INDEX idx_gis_features_feature_id ON gis_features(feature_id);

-- Spatial Analysis table for tracking analysis operations
CREATE TABLE IF NOT EXISTS spatial_analysis (
    id SERIAL PRIMARY KEY,
    analysis_type VARCHAR(50) NOT NULL,
    input_layers JSONB NOT NULL,
    parameters JSONB,
    results JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_spatial_analysis_type ON spatial_analysis(analysis_type);
CREATE INDEX idx_spatial_analysis_status ON spatial_analysis(status);

-- Property Geometry table for enhanced property spatial data
CREATE TABLE IF NOT EXISTS property_geometry (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    parcel_geometry JSONB,
    building_footprints JSONB,
    boundary_points JSONB,
    elevation_data JSONB,
    slope_analysis JSONB,
    flood_zone VARCHAR(50),
    soil_type VARCHAR(100),
    vegetation_cover DOUBLE PRECISION,
    impervious_surface DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(property_id)
);

CREATE UNIQUE INDEX idx_property_geometry_property ON property_geometry(property_id);
CREATE INDEX idx_property_geometry_flood_zone ON property_geometry(flood_zone);

-- Market Areas table for market analysis zones
CREATE TABLE IF NOT EXISTS market_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    area_code VARCHAR(20) UNIQUE,
    geometry JSONB NOT NULL,
    market_type VARCHAR(50),
    price_per_sqft_avg DOUBLE PRECISION,
    price_per_sqft_median DOUBLE PRECISION,
    appreciation_rate DOUBLE PRECISION,
    inventory_months DOUBLE PRECISION,
    sales_volume INTEGER,
    active_listings INTEGER,
    demographics JSONB,
    amenities JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_market_areas_area_code ON market_areas(area_code);
CREATE INDEX idx_market_areas_market_type ON market_areas(market_type);

-- Valuation Zones table for property valuation analysis
CREATE TABLE IF NOT EXISTS valuation_zones (
    id SERIAL PRIMARY KEY,
    zone_code VARCHAR(20) UNIQUE NOT NULL,
    zone_name VARCHAR(100),
    geometry JSONB NOT NULL,
    base_land_value DOUBLE PRECISION,
    adjustment_factors JSONB,
    zoning_restrictions JSONB,
    development_potential VARCHAR(50),
    infrastructure_quality INTEGER,
    environmental_factors JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_valuation_zones_zone_code ON valuation_zones(zone_code);

-- GIS Analysis Results table for storing comprehensive analysis outcomes
CREATE TABLE IF NOT EXISTS gis_analysis_results (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL,
    analysis_date TIMESTAMP DEFAULT NOW(),
    proximity_scores JSONB,
    accessibility_metrics JSONB,
    environmental_risk JSONB,
    development_constraints JSONB,
    market_position JSONB,
    comparables_analysis JSONB,
    ai_insights JSONB,
    confidence_score DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gis_analysis_results_property ON gis_analysis_results(property_id);
CREATE INDEX idx_gis_analysis_results_date ON gis_analysis_results(analysis_date);
CREATE INDEX idx_gis_analysis_results_confidence ON gis_analysis_results(confidence_score);

-- Insert sample GIS layers for Benton County
INSERT INTO gis_layers (name, type, geometry_type, metadata) VALUES
('Schools', 'schools', 'Point', '{"description": "Educational facilities in Benton County", "source": "Benton County GIS"}'),
('Hospitals', 'hospitals', 'Point', '{"description": "Medical facilities", "source": "Healthcare Directory"}'),
('Transportation', 'transportation', 'LineString', '{"description": "Roads and transit routes", "source": "DOT"}'),
('Commercial', 'commercial', 'Polygon', '{"description": "Commercial zones and businesses", "source": "Zoning Department"}'),
('Recreation', 'recreation', 'Polygon', '{"description": "Parks and recreational areas", "source": "Parks Department"}'),
('Flood Zones', 'flood_zones', 'Polygon', '{"description": "FEMA flood zone boundaries", "source": "FEMA"}'),
('Zoning', 'zoning', 'Polygon', '{"description": "Zoning districts", "source": "Planning Department"}');

-- Insert sample market areas for Benton County
INSERT INTO market_areas (name, area_code, market_type, price_per_sqft_avg, appreciation_rate, geometry) VALUES
('Richland Central', 'RC01', 'residential', 285.50, 0.045, '{"type": "Polygon", "coordinates": [[[-119.30, 46.28], [-119.25, 46.28], [-119.25, 46.32], [-119.30, 46.32], [-119.30, 46.28]]]}'),
('Kennewick Heights', 'KH01', 'residential', 220.75, 0.038, '{"type": "Polygon", "coordinates": [[[-119.20, 46.20], [-119.15, 46.20], [-119.15, 46.25], [-119.20, 46.25], [-119.20, 46.20]]]}'),
('Pasco Downtown', 'PD01', 'mixed', 180.25, 0.042, '{"type": "Polygon", "coordinates": [[[-119.10, 46.23], [-119.05, 46.23], [-119.05, 46.27], [-119.10, 46.27], [-119.10, 46.23]]]}'),
('West Richland', 'WR01', 'residential', 255.80, 0.041, '{"type": "Polygon", "coordinates": [[[-119.35, 46.30], [-119.30, 46.30], [-119.30, 46.35], [-119.35, 46.35], [-119.35, 46.30]]]}');

-- Insert sample valuation zones
INSERT INTO valuation_zones (zone_code, zone_name, base_land_value, development_potential, geometry) VALUES
('VZ001', 'Richland Premium', 85000, 'high', '{"type": "Polygon", "coordinates": [[[-119.30, 46.28], [-119.25, 46.28], [-119.25, 46.32], [-119.30, 46.32], [-119.30, 46.28]]]}'),
('VZ002', 'Kennewick Standard', 65000, 'moderate', '{"type": "Polygon", "coordinates": [[[-119.20, 46.20], [-119.15, 46.20], [-119.15, 46.25], [-119.20, 46.25], [-119.20, 46.20]]]}'),
('VZ003', 'Pasco Growth', 45000, 'high', '{"type": "Polygon", "coordinates": [[[-119.10, 46.23], [-119.05, 46.23], [-119.05, 46.27], [-119.10, 46.27], [-119.10, 46.23]]]}'),
('VZ004', 'West Richland Elite', 95000, 'limited', '{"type": "Polygon", "coordinates": [[[-119.35, 46.30], [-119.30, 46.30], [-119.30, 46.35], [-119.35, 46.35], [-119.35, 46.30]]]}');

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gis_layers_modtime BEFORE UPDATE ON gis_layers FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_gis_features_modtime BEFORE UPDATE ON gis_features FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_property_geometry_modtime BEFORE UPDATE ON property_geometry FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_market_areas_modtime BEFORE UPDATE ON market_areas FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_valuation_zones_modtime BEFORE UPDATE ON valuation_zones FOR EACH ROW EXECUTE FUNCTION update_modified_column();