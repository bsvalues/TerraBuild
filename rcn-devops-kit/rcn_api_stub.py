#!/usr/bin/env python3
"""
TerraFusionBuild RCN Valuation Engine API Stub

This module implements a FastAPI server that provides endpoints for calculating
Replacement Cost New (RCN) values for buildings based on various parameters.
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Union, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Setup logging
if not os.path.exists("logs"):
    os.makedirs("logs")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(f"logs/rcn_api_{datetime.now().strftime('%Y%m%d')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("rcn_api")

# Initialize FastAPI app
app = FastAPI(
    title="TerraFusionBuild RCN Valuation Engine API",
    description="API for calculating Replacement Cost New (RCN) values for buildings",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Pydantic Models -----

class Feature(BaseModel):
    """Building feature model"""
    type: str
    quantity: float
    unit: str

class BuildingInput(BaseModel):
    """Building input model for RCN calculation"""
    building_type: str = Field(..., description="Building type code (e.g., RES, COM, IND, AGR)")
    construction_type: str = Field(..., description="Construction type code (e.g., WF, MS, SF, CC)")
    quality_class: str = Field(..., description="Quality class code (e.g., A+, A, B+, B, etc.)")
    region: str = Field(..., description="Region code (e.g., NW, NE, CEN, SW, SE)")
    year_built: int = Field(..., description="Year the building was constructed")
    condition: str = Field(..., description="Building condition (e.g., Excellent, Good, Average, etc.)")
    effective_age_adjustment: int = Field(0, description="Adjustment to effective age due to renovations")
    square_footage: float = Field(..., description="Total building square footage")
    features: List[Feature] = Field([], description="List of additional building features")
    
class RCNResponse(BaseModel):
    """Response model for RCN calculation"""
    rcn_value: float
    base_cost_per_sqft: float
    total_base_cost: float
    quality_adjusted_cost: float
    region_adjusted_cost: float
    feature_costs: Dict[str, float]
    age_depreciation: float
    condition_depreciation: float
    effective_age: int
    calculation_date: str
    confidence_level: str
    notes: List[str]

# ----- Helper Functions -----

def load_cost_data():
    """Load sample cost data from the data files"""
    try:
        # Load cost profiles
        with open(os.path.join("sample_data", "cost_profiles.json"), "r") as f:
            cost_profiles = json.load(f)
        
        # Load depreciation tables
        with open(os.path.join("sample_data", "depreciation_tables.json"), "r") as f:
            depreciation_tables = json.load(f)
            
        return {
            "cost_profiles": cost_profiles,
            "depreciation_tables": depreciation_tables
        }
    except Exception as e:
        logger.error(f"Error loading cost data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading cost data: {str(e)}")

def calculate_rcn(building_input: BuildingInput) -> RCNResponse:
    """Calculate the RCN value for a building"""
    try:
        # Load cost data
        data = load_cost_data()
        cost_profiles = data["cost_profiles"]
        depreciation_tables = data["depreciation_tables"]
        
        # Get base rate
        base_rate = next(
            (rate["base_rate"] for rate in cost_profiles["base_rates"] 
             if rate["building_type"] == building_input.building_type 
             and rate["construction_type"] == building_input.construction_type),
            0.0
        )
        
        if base_rate == 0.0:
            raise ValueError(f"No base rate found for building type {building_input.building_type} and construction type {building_input.construction_type}")
        
        # Get quality multiplier
        quality_multiplier = next(
            (q["multiplier"] for q in cost_profiles["quality_classes"] 
             if q["code"] == building_input.quality_class),
            1.0
        )
        
        # Get region factor
        region_factor = next(
            (r["factor"] for r in cost_profiles["region_factors"] 
             if r["code"] == building_input.region),
            1.0
        )
        
        # Calculate base cost
        total_base_cost = base_rate * building_input.square_footage
        
        # Apply quality adjustment
        quality_adjusted_cost = total_base_cost * quality_multiplier
        
        # Apply region adjustment
        region_adjusted_cost = quality_adjusted_cost * region_factor
        
        # Calculate feature costs
        feature_costs = {}
        feature_total = 0
        
        for feature in building_input.features:
            feature_adjustment = next(
                (f["adjustment_factor"] for f in cost_profiles["feature_adjustments"] 
                 if f["feature"] == feature.type and f["building_type"] == building_input.building_type),
                1.0
            )
            
            if feature.unit == "sqft":
                feature_cost = feature.quantity * base_rate * feature_adjustment
            else:
                feature_cost = feature.quantity * (base_rate * building_input.square_footage * 0.01) * feature_adjustment
                
            feature_costs[feature.type] = feature_cost
            feature_total += feature_cost
        
        # Calculate effective age
        current_year = datetime.now().year
        chronological_age = current_year - building_input.year_built
        effective_age = max(0, chronological_age + building_input.effective_age_adjustment)
        
        # Get age depreciation factor
        age_factors = depreciation_tables["age_factors"].get(building_input.building_type, [])
        if not age_factors:
            age_depreciation_factor = 0.0
        else:
            # Find the closest age in the table
            closest_age = min(age_factors, key=lambda x: abs(x["age"] - effective_age))
            age_depreciation_factor = closest_age["factor"]
        
        # Get condition depreciation factor
        condition_factor = next(
            (c["factor"] for c in depreciation_tables["condition_factors"] 
             if c["condition"] == building_input.condition),
            0.0
        )
        
        # Calculate depreciated value
        depreciated_value = (region_adjusted_cost + feature_total) * (1 - max(age_depreciation_factor, condition_factor))
        
        # Determine confidence level based on data quality
        if all([base_rate > 0, quality_multiplier > 0, region_factor > 0]):
            confidence_level = "High"
            notes = ["All cost factors were found in the database"]
        else:
            confidence_level = "Medium"
            notes = ["Some cost factors were estimated"]
            
        if building_input.year_built < 1900 or building_input.year_built > current_year:
            confidence_level = "Low"
            notes.append("Year built is outside the expected range")
            
        if effective_age > 100:
            notes.append("Building age exceeds typical depreciation schedules")
        
        # Create response
        response = RCNResponse(
            rcn_value=round(depreciated_value, 2),
            base_cost_per_sqft=round(base_rate, 2),
            total_base_cost=round(total_base_cost, 2),
            quality_adjusted_cost=round(quality_adjusted_cost, 2),
            region_adjusted_cost=round(region_adjusted_cost, 2),
            feature_costs={k: round(v, 2) for k, v in feature_costs.items()},
            age_depreciation=round(age_depreciation_factor, 3),
            condition_depreciation=round(condition_factor, 3),
            effective_age=effective_age,
            calculation_date=datetime.now().strftime("%Y-%m-%d"),
            confidence_level=confidence_level,
            notes=notes
        )
        
        return response
    
    except ValueError as e:
        logger.error(f"Validation error in RCN calculation: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error calculating RCN: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating RCN: {str(e)}")

# ----- API Endpoints -----

@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the HTML UI"""
    try:
        with open(os.path.join("html_ui", "index.html"), "r") as f:
            return f.read()
    except FileNotFoundError:
        # Create a simple HTML page if the UI file doesn't exist
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>TerraFusionBuild RCN Valuation Engine</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #2c3e50; }
                .endpoint { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
                code { background: #eee; padding: 2px 4px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>TerraFusionBuild RCN Valuation Engine</h1>
            <p>The RCN Valuation Engine API is running. You can use the following endpoints:</p>
            
            <div class="endpoint">
                <h3>Calculate RCN</h3>
                <p><code>POST /api/calculate-rcn</code></p>
                <p>Calculate the Replacement Cost New value for a building.</p>
            </div>
            
            <div class="endpoint">
                <h3>Get Building Types</h3>
                <p><code>GET /api/building-types</code></p>
                <p>Get a list of available building types.</p>
            </div>
            
            <div class="endpoint">
                <h3>Get Construction Types</h3>
                <p><code>GET /api/construction-types</code></p>
                <p>Get a list of available construction types.</p>
            </div>
            
            <div class="endpoint">
                <h3>Get Quality Classes</h3>
                <p><code>GET /api/quality-classes</code></p>
                <p>Get a list of available quality classes.</p>
            </div>
            
            <div class="endpoint">
                <h3>Get Regions</h3>
                <p><code>GET /api/regions</code></p>
                <p>Get a list of available regions.</p>
            </div>
            
            <div class="endpoint">
                <h3>API Documentation</h3>
                <p><code>GET /docs</code></p>
                <p>View the interactive API documentation.</p>
            </div>
            
            <footer>
                <p>TerraFusionBuild RCN Valuation Engine v1.0.0</p>
            </footer>
        </body>
        </html>
        """

@app.post("/api/calculate-rcn", response_model=RCNResponse)
async def calculate_rcn_endpoint(building_input: BuildingInput):
    """Calculate the RCN value for a building"""
    return calculate_rcn(building_input)

@app.get("/api/building-types")
async def get_building_types():
    """Get a list of available building types"""
    data = load_cost_data()
    return data["cost_profiles"]["building_types"]

@app.get("/api/construction-types")
async def get_construction_types():
    """Get a list of available construction types"""
    data = load_cost_data()
    return data["cost_profiles"]["construction_types"]

@app.get("/api/quality-classes")
async def get_quality_classes():
    """Get a list of available quality classes"""
    data = load_cost_data()
    return data["cost_profiles"]["quality_classes"]

@app.get("/api/regions")
async def get_regions():
    """Get a list of available regions"""
    data = load_cost_data()
    return data["cost_profiles"]["region_factors"]

@app.get("/api/example-buildings")
async def get_example_buildings():
    """Get a list of example building inputs"""
    try:
        with open(os.path.join("sample_data", "example_building_inputs.json"), "r") as f:
            data = json.load(f)
        return data["buildings"]
    except Exception as e:
        logger.error(f"Error loading example buildings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading example buildings: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions"""
    logger.error(f"Uncaught exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# ----- Server Startup -----

def main():
    """Start the server"""
    logger.info("Starting TerraFusionBuild RCN Valuation Engine API")
    
    # Check for sample data
    if not os.path.exists("sample_data"):
        logger.warning("sample_data directory not found. Creating directory.")
        os.makedirs("sample_data")
    
    required_files = [
        os.path.join("sample_data", "cost_profiles.json"),
        os.path.join("sample_data", "depreciation_tables.json"),
        os.path.join("sample_data", "example_building_inputs.json")
    ]
    
    for file in required_files:
        if not os.path.exists(file):
            logger.warning(f"Required sample data file {file} not found.")
    
    # Mount static files if HTML UI directory exists
    if os.path.exists("html_ui"):
        app.mount("/static", StaticFiles(directory="html_ui"), name="static")
    
    # Start server
    uvicorn.run(
        "rcn_api_stub:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False
    )

if __name__ == "__main__":
    main()