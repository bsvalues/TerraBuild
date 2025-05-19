#!/usr/bin/env python3
"""
TerraFusionBuild RCN (Replacement Cost New) Valuation Engine API

This FastAPI implementation provides endpoints for calculating property replacement costs
based on building characteristics, materials, and quality factors. It serves as the core
of the RCN Valuation Engine for county assessors.

Usage:
  python rcn_api_stub.py
"""

import json
import os
import math
import logging
import datetime
from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel, Field, validator
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("rcn_valuation_engine")

# Create FastAPI application
app = FastAPI(
    title="TerraFusionBuild RCN Valuation Engine",
    description="API for calculating property Replacement Cost New (RCN) values based on building characteristics",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define data models
class BuildingInput(BaseModel):
    """Input data model for building valuation requests"""
    use_type: str = Field(..., description="Building use type (Residential, Commercial, Industrial, Agricultural)")
    construction_type: str = Field(..., description="Type of construction (Wood Frame, Masonry, Steel Frame, Concrete)")
    sqft: int = Field(..., gt=0, description="Building square footage")
    year_built: int = Field(..., description="Year the building was constructed")
    quality_class: str = Field(..., description="Quality class (A+, A, B+, B, C+, C, D+, D, E)")
    condition: str = Field(..., description="Building condition (Excellent, Good, Average, Fair, Poor)")
    locality_index: float = Field(1.0, gt=0, description="Regional cost modifier (default: 1.0)")
    description: Optional[str] = Field(None, description="Optional building description")
    location: Optional[str] = Field(None, description="Optional location description")
    
    @validator('use_type')
    def validate_use_type(cls, v):
        valid_types = ["Residential", "Commercial", "Industrial", "Agricultural"]
        if v not in valid_types:
            raise ValueError(f"use_type must be one of {valid_types}")
        return v
    
    @validator('construction_type')
    def validate_construction_type(cls, v):
        valid_types = ["Wood Frame", "Masonry", "Steel Frame", "Concrete"]
        if v not in valid_types:
            raise ValueError(f"construction_type must be one of {valid_types}")
        return v
    
    @validator('quality_class')
    def validate_quality_class(cls, v):
        valid_classes = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "E"]
        if v not in valid_classes:
            raise ValueError(f"quality_class must be one of {valid_classes}")
        return v
    
    @validator('condition')
    def validate_condition(cls, v):
        valid_conditions = ["Excellent", "Good", "Average", "Fair", "Poor"]
        if v not in valid_conditions:
            raise ValueError(f"condition must be one of {valid_conditions}")
        return v

class CalculationResult(BaseModel):
    """Result data model for RCN calculation responses"""
    rcn: float = Field(..., description="Replacement Cost New value")
    depreciated_cost: float = Field(..., description="Depreciated cost after applying factors")
    effective_age: Optional[int] = Field(None, description="Effective age of the building")
    remaining_life: Optional[int] = Field(None, description="Estimated remaining life")
    details: Optional[Dict[str, Any]] = Field(None, description="Detailed calculation breakdown")

# Data paths
SAMPLE_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_data")
COST_PROFILES_PATH = os.path.join(SAMPLE_DATA_DIR, "cost_profiles.json")
DEPRECIATION_TABLES_PATH = os.path.join(SAMPLE_DATA_DIR, "depreciation_tables.json")
EXAMPLE_BUILDINGS_PATH = os.path.join(SAMPLE_DATA_DIR, "example_building_inputs.json")
HTML_UI_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "html_ui")

# Check if sample data exists, create directories if not
os.makedirs(SAMPLE_DATA_DIR, exist_ok=True)
os.makedirs(HTML_UI_DIR, exist_ok=True)

# Load or create cost profiles
try:
    with open(COST_PROFILES_PATH, 'r') as f:
        cost_profiles = json.load(f)
        logger.info(f"Loaded cost profiles from {COST_PROFILES_PATH}")
except (FileNotFoundError, json.JSONDecodeError) as e:
    logger.error(f"Error loading cost profiles: {e}")
    # Default cost profiles if file doesn't exist
    cost_profiles = {"building_types": {}}
    logger.warning("Using default cost profiles")

# Load or create depreciation tables
try:
    with open(DEPRECIATION_TABLES_PATH, 'r') as f:
        depreciation_tables = json.load(f)
        logger.info(f"Loaded depreciation tables from {DEPRECIATION_TABLES_PATH}")
except (FileNotFoundError, json.JSONDecodeError) as e:
    logger.error(f"Error loading depreciation tables: {e}")
    # Default depreciation tables if file doesn't exist
    depreciation_tables = {
        "condition_factors": {
            "Excellent": 0.95,
            "Good": 0.85,
            "Average": 0.70,
            "Fair": 0.50,
            "Poor": 0.30
        },
        "age_factors": {}
    }
    logger.warning("Using default depreciation tables")

# Load or create example buildings
try:
    with open(EXAMPLE_BUILDINGS_PATH, 'r') as f:
        example_buildings = json.load(f)
        logger.info(f"Loaded example buildings from {EXAMPLE_BUILDINGS_PATH}")
except (FileNotFoundError, json.JSONDecodeError) as e:
    logger.error(f"Error loading example buildings: {e}")
    # Default example buildings if file doesn't exist
    example_buildings = []
    logger.warning("Using default example buildings (empty list)")

# RCN Calculation Engine
class RCNCalculator:
    """RCN (Replacement Cost New) Calculator for property valuation"""
    
    def __init__(self, cost_profiles, depreciation_tables):
        self.cost_profiles = cost_profiles
        self.depreciation_tables = depreciation_tables
        self.current_year = datetime.datetime.now().year
    
    def get_base_rate(self, use_type, construction_type):
        """Get the base rate per square foot for a building type and construction type"""
        try:
            return self.cost_profiles["building_types"][use_type]["base_rates"][construction_type]
        except KeyError:
            # Default values if not found in profiles
            default_rates = {
                "Residential": {"Wood Frame": 125, "Masonry": 150, "Steel Frame": 175, "Concrete": 180},
                "Commercial": {"Wood Frame": 145, "Masonry": 170, "Steel Frame": 185, "Concrete": 200},
                "Industrial": {"Wood Frame": 120, "Masonry": 140, "Steel Frame": 160, "Concrete": 170},
                "Agricultural": {"Wood Frame": 90, "Masonry": 110, "Steel Frame": 130, "Concrete": 140}
            }
            return default_rates.get(use_type, {}).get(construction_type, 150)
    
    def get_quality_factor(self, use_type, quality_class):
        """Get the quality factor for a building type and quality class"""
        try:
            return self.cost_profiles["building_types"][use_type]["quality_factors"][quality_class]
        except KeyError:
            # Default quality factors if not found in profiles
            default_factors = {
                "A+": 1.4, "A": 1.3, "B+": 1.2, "B": 1.1, "C+": 1.0,
                "C": 0.9, "D+": 0.8, "D": 0.7, "E": 0.6
            }
            return default_factors.get(quality_class, 1.0)
    
    def get_size_adjustment(self, sqft):
        """Get size adjustment factor based on building size"""
        try:
            for size_category, size_data in self.cost_profiles["size_adjustment_factors"].items():
                size_range = size_data["range"]
                if size_range[0] <= sqft <= size_range[1]:
                    return size_data["factor"]
            return 1.0
        except (KeyError, IndexError):
            # Default size adjustments if not found in profiles
            if sqft <= 1000:
                return 1.2
            elif sqft <= 2500:
                return 1.1
            elif sqft <= 5000:
                return 1.0
            elif sqft <= 10000:
                return 0.95
            elif sqft <= 50000:
                return 0.9
            else:
                return 0.85
    
    def get_condition_factor(self, condition):
        """Get the condition factor based on building condition"""
        try:
            return self.depreciation_tables["condition_factors"][condition]
        except KeyError:
            # Default condition factors if not found in tables
            default_factors = {
                "Excellent": 0.95, "Good": 0.85, "Average": 0.70, "Fair": 0.50, "Poor": 0.30
            }
            return default_factors.get(condition, 0.70)
    
    def calculate_age_factor(self, year_built):
        """Calculate the age factor based on the building's age"""
        age = self.current_year - year_built
        
        # Try to use the age factors from the depreciation tables
        try:
            for age_range, factor in self.depreciation_tables["age_factors"].items():
                age_min, age_max = map(int, age_range.split('-'))
                if age_min <= age <= age_max:
                    return factor
        except (KeyError, ValueError):
            pass
        
        # Default age factor calculation if not found in tables
        if age <= 5:
            return 0.98
        elif age <= 10:
            return 0.90
        elif age <= 20:
            return 0.80
        elif age <= 30:
            return 0.70
        elif age <= 40:
            return 0.60
        elif age <= 50:
            return 0.50
        else:
            return 0.40
    
    def calculate_rcn(self, building: BuildingInput) -> CalculationResult:
        """Calculate the Replacement Cost New (RCN) for a building"""
        # Get base rate for building type and construction
        base_rate = self.get_base_rate(building.use_type, building.construction_type)
        
        # Get quality factor
        quality_factor = self.get_quality_factor(building.use_type, building.quality_class)
        
        # Get size adjustment
        size_factor = self.get_size_adjustment(building.sqft)
        
        # Calculate base replacement cost
        base_cost = base_rate * building.sqft * quality_factor * size_factor
        
        # Apply locality index
        rcn = base_cost * building.locality_index
        
        # Calculate depreciation
        age = self.current_year - building.year_built
        age_factor = self.calculate_age_factor(building.year_built)
        condition_factor = self.get_condition_factor(building.condition)
        
        # Combined depreciation factor
        depreciation_factor = (age_factor + condition_factor) / 2
        
        # Calculate depreciated cost
        depreciated_cost = rcn * depreciation_factor
        
        # Calculate effective age and remaining life
        typical_life = 75  # Typical building life in years
        effective_age = int(typical_life * (1 - depreciation_factor))
        remaining_life = max(0, typical_life - effective_age)
        
        # Format calculation details for response
        calculation_details = {
            "base_rate": round(base_rate, 2),
            "quality_factor": round(quality_factor, 2),
            "size_factor": round(size_factor, 2),
            "condition_factor": round(condition_factor, 2),
            "age_factor": round(age_factor, 2),
            "locality_index": round(building.locality_index, 2),
            "depreciation_factor": round(depreciation_factor, 2),
            "calculation": f"RCN = {base_rate:.2f} $/sqft × {building.sqft:,} sqft × {quality_factor:.2f} (quality) × {size_factor:.2f} (size) × {building.locality_index:.2f} (locality) = ${rcn:,.2f}",
            "depreciation": f"Depreciated Cost = ${rcn:,.2f} × {depreciation_factor:.2f} (depreciation) = ${depreciated_cost:,.2f}"
        }
        
        return CalculationResult(
            rcn=round(rcn, 2),
            depreciated_cost=round(depreciated_cost, 2),
            effective_age=effective_age,
            remaining_life=remaining_life,
            details=calculation_details
        )

# Create calculator instance
calculator = RCNCalculator(cost_profiles, depreciation_tables)

# Define API routes
@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the HTML UI for the RCN calculator"""
    try:
        with open(os.path.join(HTML_UI_DIR, "index.html"), 'r') as f:
            html_content = f.read()
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        # Fallback HTML if file doesn't exist
        return HTMLResponse(content="""
        <!DOCTYPE html>
        <html>
        <head>
            <title>TerraFusionBuild RCN Valuation Engine</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #234567; }
                .api-link { margin-top: 20px; }
            </style>
        </head>
        <body>
            <h1>TerraFusionBuild RCN Valuation Engine</h1>
            <p>The HTML UI file was not found. Please check the installation.</p>
            <div class="api-link">
                <p>API documentation is available at: <a href="/docs">/docs</a></p>
            </div>
        </body>
        </html>
        """)

@app.post("/rcn/calculate", response_model=CalculationResult)
async def calculate_rcn(building: BuildingInput):
    """Calculate the Replacement Cost New (RCN) for a building"""
    try:
        logger.info(f"Calculating RCN for building: {building.dict()}")
        result = calculator.calculate_rcn(building)
        logger.info(f"RCN calculation complete: ${result.rcn:,.2f}")
        return result
    except Exception as e:
        logger.error(f"Error calculating RCN: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating RCN: {str(e)}")

@app.get("/sample/buildings")
async def get_sample_buildings():
    """Get sample building inputs for testing"""
    return example_buildings

@app.get("/api/status")
async def get_api_status():
    """Get the API status and version information"""
    return {
        "status": "online",
        "version": "1.0.0",
        "data_loaded": {
            "cost_profiles": bool(cost_profiles.get("building_types")),
            "depreciation_tables": bool(depreciation_tables.get("condition_factors")),
            "example_buildings": len(example_buildings) > 0
        },
        "timestamp": datetime.datetime.now().isoformat()
    }

@app.get("/data/profiles")
async def get_cost_profiles():
    """Get the cost profiles data"""
    return cost_profiles

@app.get("/data/depreciation")
async def get_depreciation_tables():
    """Get the depreciation tables data"""
    return depreciation_tables

@app.get("/favicon.ico", include_in_schema=False)
async def get_favicon():
    """Serve the favicon"""
    favicon_path = os.path.join(HTML_UI_DIR, "favicon.ico")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    return JSONResponse(content={"message": "Favicon not found"}, status_code=404)

# Entry point for running the application
if __name__ == "__main__":
    uvicorn.run(
        "rcn_api_stub:app",
        host="0.0.0.0",  # Bind to all interfaces
        port=8000,
        reload=True
    )