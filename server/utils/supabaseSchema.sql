-- Supabase Schema for BCBS Application
-- This script creates the database schema for the BCBS application in Supabase

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create scenarios table for storing what-if scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parameters JSONB NOT NULL DEFAULT '{}',
  user_id INT NOT NULL,
  base_calculation_id INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  is_saved BOOLEAN DEFAULT FALSE,
  results JSONB
);

-- Create variations table for storing scenario variations
CREATE TABLE IF NOT EXISTS variations (
  id SERIAL PRIMARY KEY,
  scenario_id INT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parameter_changes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create impacts table for storing parameter impacts
CREATE TABLE IF NOT EXISTS impacts (
  id SERIAL PRIMARY KEY,
  scenario_id INT NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  parameter_key TEXT NOT NULL,
  original_value JSONB NOT NULL,
  new_value JSONB NOT NULL,
  impact_value TEXT,
  impact_percentage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table for storing property records
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  prop_id TEXT NOT NULL UNIQUE,
  block TEXT,
  tract_or_lot TEXT,
  parcel TEXT,
  address TEXT NOT NULL,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  geo_location JSONB
);

-- Create improvements table for storing property improvements
CREATE TABLE IF NOT EXISTS improvements (
  id SERIAL PRIMARY KEY,
  property_id INT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  improvement_type TEXT NOT NULL,
  improvement_id TEXT NOT NULL,
  building_type TEXT NOT NULL,
  year_built INT NOT NULL,
  grade TEXT NOT NULL,
  condition TEXT NOT NULL,
  sq_footage INT NOT NULL,
  stories INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scenarios_user_id ON scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_variations_scenario_id ON variations(scenario_id);
CREATE INDEX IF NOT EXISTS idx_impacts_scenario_id ON impacts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_properties_prop_id ON properties(prop_id);
CREATE INDEX IF NOT EXISTS idx_improvements_property_id ON improvements(property_id);

-- Enable Row Level Security (RLS)
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvements ENABLE ROW LEVEL SECURITY;

-- Create policies for scenarios table
CREATE POLICY "Scenarios are viewable by everyone" 
  ON scenarios FOR SELECT 
  USING (true);

CREATE POLICY "Scenarios can be inserted by authenticated users" 
  ON scenarios FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Scenarios can be updated by their owners" 
  ON scenarios FOR UPDATE 
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Scenarios can be deleted by their owners" 
  ON scenarios FOR DELETE 
  USING (auth.uid()::text = user_id::text);

-- Create policies for variations table
CREATE POLICY "Variations are viewable by everyone" 
  ON variations FOR SELECT 
  USING (true);

CREATE POLICY "Variations can be inserted by authenticated users" 
  ON variations FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Variations can be updated by owners of the parent scenario" 
  ON variations FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM scenarios 
    WHERE scenarios.id = variations.scenario_id 
    AND auth.uid()::text = scenarios.user_id::text
  ));

CREATE POLICY "Variations can be deleted by owners of the parent scenario" 
  ON variations FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM scenarios 
    WHERE scenarios.id = variations.scenario_id 
    AND auth.uid()::text = scenarios.user_id::text
  ));

-- Create policies for impacts table
CREATE POLICY "Impacts are viewable by everyone" 
  ON impacts FOR SELECT 
  USING (true);

CREATE POLICY "Impacts can be inserted by authenticated users" 
  ON impacts FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Impacts can be updated by owners of the parent scenario" 
  ON impacts FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM scenarios 
    WHERE scenarios.id = impacts.scenario_id 
    AND auth.uid()::text = scenarios.user_id::text
  ));

CREATE POLICY "Impacts can be deleted by owners of the parent scenario" 
  ON impacts FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM scenarios 
    WHERE scenarios.id = impacts.scenario_id 
    AND auth.uid()::text = scenarios.user_id::text
  ));

-- Create policies for properties table
CREATE POLICY "Properties are viewable by everyone" 
  ON properties FOR SELECT 
  USING (true);

CREATE POLICY "Properties can be inserted by authenticated users" 
  ON properties FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Properties can be updated by authenticated users" 
  ON properties FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Properties can be deleted by authenticated users" 
  ON properties FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create policies for improvements table
CREATE POLICY "Improvements are viewable by everyone" 
  ON improvements FOR SELECT 
  USING (true);

CREATE POLICY "Improvements can be inserted by authenticated users" 
  ON improvements FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Improvements can be updated by authenticated users" 
  ON improvements FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Improvements can be deleted by authenticated users" 
  ON improvements FOR DELETE 
  USING (auth.role() = 'authenticated');