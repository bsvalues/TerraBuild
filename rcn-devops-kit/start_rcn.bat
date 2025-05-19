@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Starting Server
echo ===================================================================
echo.

REM Check if Python virtual environment exists
if not exist venv (
    echo Virtual environment not found. Please run install_deps.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Check if sample data directory exists
if not exist sample_data (
    echo Creating sample data directory...
    mkdir sample_data
)

REM Check if sample data files exist, create if not
if not exist sample_data\cost_profiles.json (
    echo Creating sample cost profile data...
    echo { > sample_data\cost_profiles.json
    echo   "building_types": [ >> sample_data\cost_profiles.json
    echo     { "code": "RES", "name": "Residential", "description": "Single and multi-family residential buildings" }, >> sample_data\cost_profiles.json
    echo     { "code": "COM", "name": "Commercial", "description": "Commercial buildings including retail, office, and hospitality" }, >> sample_data\cost_profiles.json
    echo     { "code": "IND", "name": "Industrial", "description": "Industrial buildings including warehouses and manufacturing" }, >> sample_data\cost_profiles.json
    echo     { "code": "AGR", "name": "Agricultural", "description": "Agricultural buildings including barns and equipment storage" } >> sample_data\cost_profiles.json
    echo   ], >> sample_data\cost_profiles.json
    echo   "construction_types": [ >> sample_data\cost_profiles.json
    echo     { "code": "WF", "name": "Wood Frame", "description": "Standard wood frame construction" }, >> sample_data\cost_profiles.json
    echo     { "code": "MS", "name": "Metal Structure", "description": "Metal or steel frame construction" }, >> sample_data\cost_profiles.json
    echo     { "code": "SF", "name": "Special Foundation", "description": "Special foundation requirements or enhanced structural elements" }, >> sample_data\cost_profiles.json
    echo     { "code": "CC", "name": "Concrete Construction", "description": "Concrete or masonry construction" } >> sample_data\cost_profiles.json
    echo   ], >> sample_data\cost_profiles.json
    echo   "quality_classes": [ >> sample_data\cost_profiles.json
    echo     { "code": "A+", "name": "Premium Plus", "multiplier": 1.5 }, >> sample_data\cost_profiles.json
    echo     { "code": "A", "name": "Premium", "multiplier": 1.3 }, >> sample_data\cost_profiles.json
    echo     { "code": "B+", "name": "Good Plus", "multiplier": 1.15 }, >> sample_data\cost_profiles.json
    echo     { "code": "B", "name": "Good", "multiplier": 1.0 }, >> sample_data\cost_profiles.json
    echo     { "code": "C+", "name": "Average Plus", "multiplier": 0.9 }, >> sample_data\cost_profiles.json
    echo     { "code": "C", "name": "Average", "multiplier": 0.8 }, >> sample_data\cost_profiles.json
    echo     { "code": "D+", "name": "Fair Plus", "multiplier": 0.7 }, >> sample_data\cost_profiles.json
    echo     { "code": "D", "name": "Fair", "multiplier": 0.6 }, >> sample_data\cost_profiles.json
    echo     { "code": "E", "name": "Low", "multiplier": 0.5 } >> sample_data\cost_profiles.json
    echo   ], >> sample_data\cost_profiles.json
    echo   "region_factors": [ >> sample_data\cost_profiles.json
    echo     { "code": "NW", "name": "Northwest", "factor": 1.15 }, >> sample_data\cost_profiles.json
    echo     { "code": "NE", "name": "Northeast", "factor": 1.2 }, >> sample_data\cost_profiles.json
    echo     { "code": "CEN", "name": "Central", "factor": 1.0 }, >> sample_data\cost_profiles.json
    echo     { "code": "SW", "name": "Southwest", "factor": 0.95 }, >> sample_data\cost_profiles.json
    echo     { "code": "SE", "name": "Southeast", "factor": 0.9 } >> sample_data\cost_profiles.json
    echo   ], >> sample_data\cost_profiles.json
    echo   "base_rates": [ >> sample_data\cost_profiles.json
    echo     { "building_type": "RES", "construction_type": "WF", "base_rate": 125.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "RES", "construction_type": "MS", "base_rate": 145.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "RES", "construction_type": "SF", "base_rate": 160.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "RES", "construction_type": "CC", "base_rate": 175.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "COM", "construction_type": "WF", "base_rate": 135.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "COM", "construction_type": "MS", "base_rate": 155.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "COM", "construction_type": "SF", "base_rate": 175.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "COM", "construction_type": "CC", "base_rate": 185.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "IND", "construction_type": "WF", "base_rate": 85.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "IND", "construction_type": "MS", "base_rate": 95.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "IND", "construction_type": "SF", "base_rate": 125.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "IND", "construction_type": "CC", "base_rate": 145.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "AGR", "construction_type": "WF", "base_rate": 45.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "AGR", "construction_type": "MS", "base_rate": 65.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "AGR", "construction_type": "SF", "base_rate": 85.0 }, >> sample_data\cost_profiles.json
    echo     { "building_type": "AGR", "construction_type": "CC", "base_rate": 95.0 } >> sample_data\cost_profiles.json
    echo   ], >> sample_data\cost_profiles.json
    echo   "feature_adjustments": [ >> sample_data\cost_profiles.json
    echo     { "feature": "finished_basement", "building_type": "RES", "adjustment_factor": 0.6 }, >> sample_data\cost_profiles.json
    echo     { "feature": "unfinished_basement", "building_type": "RES", "adjustment_factor": 0.3 }, >> sample_data\cost_profiles.json
    echo     { "feature": "attached_garage", "building_type": "RES", "adjustment_factor": 0.5 }, >> sample_data\cost_profiles.json
    echo     { "feature": "detached_garage", "building_type": "RES", "adjustment_factor": 0.4 }, >> sample_data\cost_profiles.json
    echo     { "feature": "covered_porch", "building_type": "RES", "adjustment_factor": 0.25 }, >> sample_data\cost_profiles.json
    echo     { "feature": "open_porch", "building_type": "RES", "adjustment_factor": 0.15 }, >> sample_data\cost_profiles.json
    echo     { "feature": "hvac_standard", "building_type": "COM", "adjustment_factor": 0.1 }, >> sample_data\cost_profiles.json
    echo     { "feature": "hvac_premium", "building_type": "COM", "adjustment_factor": 0.2 }, >> sample_data\cost_profiles.json
    echo     { "feature": "sprinkler_system", "building_type": "COM", "adjustment_factor": 0.08 }, >> sample_data\cost_profiles.json
    echo     { "feature": "dock_door", "building_type": "IND", "adjustment_factor": 0.05 }, >> sample_data\cost_profiles.json
    echo     { "feature": "crane_system", "building_type": "IND", "adjustment_factor": 0.15 }, >> sample_data\cost_profiles.json
    echo     { "feature": "reinforced_floor", "building_type": "IND", "adjustment_factor": 0.12 }, >> sample_data\cost_profiles.json
    echo     { "feature": "climate_control", "building_type": "AGR", "adjustment_factor": 0.18 }, >> sample_data\cost_profiles.json
    echo     { "feature": "grain_storage", "building_type": "AGR", "adjustment_factor": 0.25 } >> sample_data\cost_profiles.json
    echo   ] >> sample_data\cost_profiles.json
    echo } >> sample_data\cost_profiles.json
)

if not exist sample_data\depreciation_tables.json (
    echo Creating sample depreciation tables...
    echo { > sample_data\depreciation_tables.json
    echo   "age_factors": { >> sample_data\depreciation_tables.json
    echo     "RES": [ >> sample_data\depreciation_tables.json
    echo       { "age": 0, "factor": 0.00 }, >> sample_data\depreciation_tables.json
    echo       { "age": 5, "factor": 0.05 }, >> sample_data\depreciation_tables.json
    echo       { "age": 10, "factor": 0.10 }, >> sample_data\depreciation_tables.json
    echo       { "age": 15, "factor": 0.15 }, >> sample_data\depreciation_tables.json
    echo       { "age": 20, "factor": 0.20 }, >> sample_data\depreciation_tables.json
    echo       { "age": 25, "factor": 0.25 }, >> sample_data\depreciation_tables.json
    echo       { "age": 30, "factor": 0.30 }, >> sample_data\depreciation_tables.json
    echo       { "age": 40, "factor": 0.40 }, >> sample_data\depreciation_tables.json
    echo       { "age": 50, "factor": 0.50 }, >> sample_data\depreciation_tables.json
    echo       { "age": 60, "factor": 0.60 }, >> sample_data\depreciation_tables.json
    echo       { "age": 70, "factor": 0.65 }, >> sample_data\depreciation_tables.json
    echo       { "age": 80, "factor": 0.70 }, >> sample_data\depreciation_tables.json
    echo       { "age": 90, "factor": 0.75 }, >> sample_data\depreciation_tables.json
    echo       { "age": 100, "factor": 0.80 } >> sample_data\depreciation_tables.json
    echo     ], >> sample_data\depreciation_tables.json
    echo     "COM": [ >> sample_data\depreciation_tables.json
    echo       { "age": 0, "factor": 0.00 }, >> sample_data\depreciation_tables.json
    echo       { "age": 5, "factor": 0.08 }, >> sample_data\depreciation_tables.json
    echo       { "age": 10, "factor": 0.15 }, >> sample_data\depreciation_tables.json
    echo       { "age": 15, "factor": 0.22 }, >> sample_data\depreciation_tables.json
    echo       { "age": 20, "factor": 0.30 }, >> sample_data\depreciation_tables.json
    echo       { "age": 25, "factor": 0.35 }, >> sample_data\depreciation_tables.json
    echo       { "age": 30, "factor": 0.40 }, >> sample_data\depreciation_tables.json
    echo       { "age": 40, "factor": 0.50 }, >> sample_data\depreciation_tables.json
    echo       { "age": 50, "factor": 0.60 }, >> sample_data\depreciation_tables.json
    echo       { "age": 60, "factor": 0.65 }, >> sample_data\depreciation_tables.json
    echo       { "age": 70, "factor": 0.70 }, >> sample_data\depreciation_tables.json
    echo       { "age": 80, "factor": 0.75 }, >> sample_data\depreciation_tables.json
    echo       { "age": 90, "factor": 0.80 }, >> sample_data\depreciation_tables.json
    echo       { "age": 100, "factor": 0.85 } >> sample_data\depreciation_tables.json
    echo     ], >> sample_data\depreciation_tables.json
    echo     "IND": [ >> sample_data\depreciation_tables.json
    echo       { "age": 0, "factor": 0.00 }, >> sample_data\depreciation_tables.json
    echo       { "age": 5, "factor": 0.10 }, >> sample_data\depreciation_tables.json
    echo       { "age": 10, "factor": 0.18 }, >> sample_data\depreciation_tables.json
    echo       { "age": 15, "factor": 0.25 }, >> sample_data\depreciation_tables.json
    echo       { "age": 20, "factor": 0.32 }, >> sample_data\depreciation_tables.json
    echo       { "age": 25, "factor": 0.40 }, >> sample_data\depreciation_tables.json
    echo       { "age": 30, "factor": 0.45 }, >> sample_data\depreciation_tables.json
    echo       { "age": 40, "factor": 0.55 }, >> sample_data\depreciation_tables.json
    echo       { "age": 50, "factor": 0.65 }, >> sample_data\depreciation_tables.json
    echo       { "age": 60, "factor": 0.70 }, >> sample_data\depreciation_tables.json
    echo       { "age": 70, "factor": 0.75 }, >> sample_data\depreciation_tables.json
    echo       { "age": 80, "factor": 0.80 }, >> sample_data\depreciation_tables.json
    echo       { "age": 90, "factor": 0.85 }, >> sample_data\depreciation_tables.json
    echo       { "age": 100, "factor": 0.90 } >> sample_data\depreciation_tables.json
    echo     ], >> sample_data\depreciation_tables.json
    echo     "AGR": [ >> sample_data\depreciation_tables.json
    echo       { "age": 0, "factor": 0.00 }, >> sample_data\depreciation_tables.json
    echo       { "age": 5, "factor": 0.12 }, >> sample_data\depreciation_tables.json
    echo       { "age": 10, "factor": 0.20 }, >> sample_data\depreciation_tables.json
    echo       { "age": 15, "factor": 0.30 }, >> sample_data\depreciation_tables.json
    echo       { "age": 20, "factor": 0.40 }, >> sample_data\depreciation_tables.json
    echo       { "age": 25, "factor": 0.45 }, >> sample_data\depreciation_tables.json
    echo       { "age": 30, "factor": 0.50 }, >> sample_data\depreciation_tables.json
    echo       { "age": 40, "factor": 0.60 }, >> sample_data\depreciation_tables.json
    echo       { "age": 50, "factor": 0.70 }, >> sample_data\depreciation_tables.json
    echo       { "age": 60, "factor": 0.75 }, >> sample_data\depreciation_tables.json
    echo       { "age": 70, "factor": 0.80 }, >> sample_data\depreciation_tables.json
    echo       { "age": 80, "factor": 0.85 }, >> sample_data\depreciation_tables.json
    echo       { "age": 90, "factor": 0.90 }, >> sample_data\depreciation_tables.json
    echo       { "age": 100, "factor": 0.95 } >> sample_data\depreciation_tables.json
    echo     ] >> sample_data\depreciation_tables.json
    echo   }, >> sample_data\depreciation_tables.json
    echo   "condition_factors": [ >> sample_data\depreciation_tables.json
    echo     { "condition": "Excellent", "factor": 0.00 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Very Good", "factor": 0.05 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Good", "factor": 0.10 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Average", "factor": 0.20 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Fair", "factor": 0.30 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Poor", "factor": 0.50 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Very Poor", "factor": 0.70 }, >> sample_data\depreciation_tables.json
    echo     { "condition": "Unsound", "factor": 0.90 } >> sample_data\depreciation_tables.json
    echo   ] >> sample_data\depreciation_tables.json
    echo } >> sample_data\depreciation_tables.json
)

if not exist sample_data\example_building_inputs.json (
    echo Creating sample building examples...
    echo { > sample_data\example_building_inputs.json
    echo   "buildings": [ >> sample_data\example_building_inputs.json
    echo     { >> sample_data\example_building_inputs.json
    echo       "name": "Standard Residential Home", >> sample_data\example_building_inputs.json
    echo       "building_type": "RES", >> sample_data\example_building_inputs.json
    echo       "construction_type": "WF", >> sample_data\example_building_inputs.json
    echo       "quality_class": "B", >> sample_data\example_building_inputs.json
    echo       "region": "CEN", >> sample_data\example_building_inputs.json
    echo       "year_built": 2010, >> sample_data\example_building_inputs.json
    echo       "condition": "Good", >> sample_data\example_building_inputs.json
    echo       "effective_age_adjustment": 0, >> sample_data\example_building_inputs.json
    echo       "square_footage": 2000, >> sample_data\example_building_inputs.json
    echo       "features": [ >> sample_data\example_building_inputs.json
    echo         { "type": "attached_garage", "quantity": 400, "unit": "sqft" }, >> sample_data\example_building_inputs.json
    echo         { "type": "covered_porch", "quantity": 200, "unit": "sqft" } >> sample_data\example_building_inputs.json
    echo       ] >> sample_data\example_building_inputs.json
    echo     }, >> sample_data\example_building_inputs.json
    echo     { >> sample_data\example_building_inputs.json
    echo       "name": "Luxury Custom Home", >> sample_data\example_building_inputs.json
    echo       "building_type": "RES", >> sample_data\example_building_inputs.json
    echo       "construction_type": "CC", >> sample_data\example_building_inputs.json
    echo       "quality_class": "A+", >> sample_data\example_building_inputs.json
    echo       "region": "NE", >> sample_data\example_building_inputs.json
    echo       "year_built": 2020, >> sample_data\example_building_inputs.json
    echo       "condition": "Excellent", >> sample_data\example_building_inputs.json
    echo       "effective_age_adjustment": -2, >> sample_data\example_building_inputs.json
    echo       "square_footage": 4500, >> sample_data\example_building_inputs.json
    echo       "features": [ >> sample_data\example_building_inputs.json
    echo         { "type": "finished_basement", "quantity": 2000, "unit": "sqft" }, >> sample_data\example_building_inputs.json
    echo         { "type": "attached_garage", "quantity": 800, "unit": "sqft" }, >> sample_data\example_building_inputs.json
    echo         { "type": "covered_porch", "quantity": 400, "unit": "sqft" } >> sample_data\example_building_inputs.json
    echo       ] >> sample_data\example_building_inputs.json
    echo     }, >> sample_data\example_building_inputs.json
    echo     { >> sample_data\example_building_inputs.json
    echo       "name": "Small Office Building", >> sample_data\example_building_inputs.json
    echo       "building_type": "COM", >> sample_data\example_building_inputs.json
    echo       "construction_type": "WF", >> sample_data\example_building_inputs.json
    echo       "quality_class": "B+", >> sample_data\example_building_inputs.json
    echo       "region": "CEN", >> sample_data\example_building_inputs.json
    echo       "year_built": 2015, >> sample_data\example_building_inputs.json
    echo       "condition": "Very Good", >> sample_data\example_building_inputs.json
    echo       "effective_age_adjustment": 0, >> sample_data\example_building_inputs.json
    echo       "square_footage": 5000, >> sample_data\example_building_inputs.json
    echo       "features": [ >> sample_data\example_building_inputs.json
    echo         { "type": "hvac_standard", "quantity": 1, "unit": "system" }, >> sample_data\example_building_inputs.json
    echo         { "type": "sprinkler_system", "quantity": 1, "unit": "system" } >> sample_data\example_building_inputs.json
    echo       ] >> sample_data\example_building_inputs.json
    echo     }, >> sample_data\example_building_inputs.json
    echo     { >> sample_data\example_building_inputs.json
    echo       "name": "Warehouse Facility", >> sample_data\example_building_inputs.json
    echo       "building_type": "IND", >> sample_data\example_building_inputs.json
    echo       "construction_type": "MS", >> sample_data\example_building_inputs.json
    echo       "quality_class": "C+", >> sample_data\example_building_inputs.json
    echo       "region": "SW", >> sample_data\example_building_inputs.json
    echo       "year_built": 2005, >> sample_data\example_building_inputs.json
    echo       "condition": "Average", >> sample_data\example_building_inputs.json
    echo       "effective_age_adjustment": 3, >> sample_data\example_building_inputs.json
    echo       "square_footage": 15000, >> sample_data\example_building_inputs.json
    echo       "features": [ >> sample_data\example_building_inputs.json
    echo         { "type": "dock_door", "quantity": 4, "unit": "doors" }, >> sample_data\example_building_inputs.json
    echo         { "type": "reinforced_floor", "quantity": 5000, "unit": "sqft" } >> sample_data\example_building_inputs.json
    echo       ] >> sample_data\example_building_inputs.json
    echo     }, >> sample_data\example_building_inputs.json
    echo     { >> sample_data\example_building_inputs.json
    echo       "name": "Agricultural Barn", >> sample_data\example_building_inputs.json
    echo       "building_type": "AGR", >> sample_data\example_building_inputs.json
    echo       "construction_type": "WF", >> sample_data\example_building_inputs.json
    echo       "quality_class": "D+", >> sample_data\example_building_inputs.json
    echo       "region": "SE", >> sample_data\example_building_inputs.json
    echo       "year_built": 2000, >> sample_data\example_building_inputs.json
    echo       "condition": "Fair", >> sample_data\example_building_inputs.json
    echo       "effective_age_adjustment": 5, >> sample_data\example_building_inputs.json
    echo       "square_footage": 8000, >> sample_data\example_building_inputs.json
    echo       "features": [ >> sample_data\example_building_inputs.json
    echo         { "type": "grain_storage", "quantity": 1, "unit": "system" } >> sample_data\example_building_inputs.json
    echo       ] >> sample_data\example_building_inputs.json
    echo     } >> sample_data\example_building_inputs.json
    echo   ] >> sample_data\example_building_inputs.json
    echo } >> sample_data\example_building_inputs.json
)

REM Check if HTML UI directory exists
if not exist html_ui (
    echo Creating HTML UI directory...
    mkdir html_ui
)

REM Start the server
echo.
echo Starting RCN Valuation Engine API...
echo.
echo Server will be available at: http://localhost:8000
echo Interactive API documentation will be available at: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python rcn_api_stub.py