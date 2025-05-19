#!/usr/bin/env python3
"""
TerraFusionBuild RCN Valuation Engine API Stub

This is a FastAPI implementation of the Replacement Cost New (RCN) calculation API
for the TerraFusionBuild platform. It provides endpoints for calculating building
replacement costs based on industry-standard cost factors and adjustments.

For more details, see the API specification in api_spec.json
"""

import json
import logging
import os
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Union

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("logs/rcn_api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("rcn_api")

# Create the FastAPI app
app = FastAPI(
    title="TerraFusionBuild RCN Valuation Engine",
    description="API for calculating Replacement Cost New (RCN) values for property assessment",
    version="1.0.0"
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Define enums for input validation
class UseType(str, Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    AGRICULTURAL = "Agricultural"

class ConstructionType(str, Enum):
    WOOD_FRAME = "Wood Frame"
    MASONRY = "Masonry"
    STEEL_FRAME = "Steel Frame"
    CONCRETE = "Concrete"

class QualityClass(str, Enum):
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    D_PLUS = "D+"
    D = "D"
    E = "E"

class Condition(str, Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    AVERAGE = "Average"
    FAIR = "Fair"
    POOR = "Poor"

# Define input/output models
class RCNInput(BaseModel):
    use_type: UseType
    construction_type: ConstructionType
    sqft: float = Field(..., gt=0)
    year_built: int = Field(..., ge=1800, le=datetime.now().year)
    quality_class: QualityClass = QualityClass.B
    locality_index: Optional[float] = Field(1.0, ge=0.5, le=2.0)
    condition: Optional[Condition] = Condition.AVERAGE

    @validator('sqft')
    def sqft_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Square footage must be positive')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "use_type": "Residential",
                "construction_type": "Wood Frame",
                "sqft": 1800,
                "year_built": 2010,
                "quality_class": "B",
                "locality_index": 1.05,
                "condition": "Good"
            }
        }

class RCNOutput(BaseModel):
    base_cost: float
    adjusted_rcn: float
    depreciated_rcn: float
    depreciation_pct: float

# Sample cost data (would be loaded from database or files in production)
BASE_COST_RATES = {
    "Residential": {
        "Wood Frame": 110.0,
        "Masonry": 125.0,
        "Steel Frame": 140.0,
        "Concrete": 135.0
    },
    "Commercial": {
        "Wood Frame": 95.0,
        "Masonry": 135.0,
        "Steel Frame": 150.0,
        "Concrete": 145.0
    },
    "Industrial": {
        "Wood Frame": 85.0,
        "Masonry": 110.0,
        "Steel Frame": 130.0,
        "Concrete": 125.0
    },
    "Agricultural": {
        "Wood Frame": 65.0,
        "Masonry": 85.0,
        "Steel Frame": 100.0,
        "Concrete": 90.0
    }
}

QUALITY_ADJUSTMENTS = {
    "A+": 1.30,
    "A": 1.20,
    "B+": 1.10,
    "B": 1.00,
    "C+": 0.90,
    "C": 0.80,
    "D+": 0.70,
    "D": 0.60,
    "E": 0.50
}

CONDITION_ADJUSTMENTS = {
    "Excellent": 0.05,  # Only 5% depreciation
    "Good": 0.15,       # 15% depreciation
    "Average": 0.25,    # 25% depreciation
    "Fair": 0.40,       # 40% depreciation
    "Poor": 0.60        # 60% depreciation
}

# Load sample data if specified in environment
USE_SAMPLE_DATA = os.getenv("USE_SAMPLE_DATA", "true").lower() == "true"
SAMPLE_DATA_PATH = os.getenv("SAMPLE_DATA_PATH", "./sample_data")

def load_sample_data():
    """Load sample data from files"""
    try:
        if USE_SAMPLE_DATA and os.path.exists(SAMPLE_DATA_PATH):
            logger.info(f"Loading sample data from {SAMPLE_DATA_PATH}")
            
            # Try to load cost profiles
            cost_profile_path = os.path.join(SAMPLE_DATA_PATH, "cost_profiles.json")
            if os.path.exists(cost_profile_path):
                with open(cost_profile_path, "r") as f:
                    global BASE_COST_RATES
                    BASE_COST_RATES = json.load(f)
                    logger.info("Loaded custom cost profiles")
            
            # Load other data files as needed
            
            return True
        return False
    except Exception as e:
        logger.error(f"Error loading sample data: {e}")
        return False

# Initialize by loading sample data
load_sample_data()

# Helper functions for calculations
def calculate_age_factor(year_built: int) -> float:
    """Calculate age factor based on year built"""
    current_year = datetime.now().year
    age = current_year - year_built
    
    # Simple linear depreciation based on age, maximum 60% from age alone
    if age <= 0:
        return 0.0
    elif age > 100:
        return 0.60
    else:
        return min(age * 0.006, 0.60)  # 0.6% per year

def calculate_rcn(input_data: RCNInput) -> RCNOutput:
    """Calculate RCN based on input parameters"""
    # Get base cost rate ($/sqft)
    try:
        base_rate = BASE_COST_RATES[input_data.use_type][input_data.construction_type]
    except KeyError:
        logger.error(f"No base rate found for {input_data.use_type}/{input_data.construction_type}")
        base_rate = 100.0  # Default fallback
    
    # Calculate base cost (rate × sqft)
    base_cost = base_rate * input_data.sqft
    
    # Apply quality adjustment
    quality_factor = QUALITY_ADJUSTMENTS[input_data.quality_class]
    
    # Apply locality adjustment
    locality_factor = input_data.locality_index if input_data.locality_index is not None else 1.0
    
    # Calculate adjusted RCN
    adjusted_rcn = base_cost * quality_factor * locality_factor
    
    # Calculate depreciation based on age and condition
    age_depreciation = calculate_age_factor(input_data.year_built)
    condition_depreciation = CONDITION_ADJUSTMENTS[input_data.condition]
    
    # Combined depreciation (use the larger of the two)
    depreciation_pct = max(age_depreciation, condition_depreciation)
    
    # Apply depreciation
    depreciated_rcn = adjusted_rcn * (1 - depreciation_pct)
    
    return RCNOutput(
        base_cost=round(base_cost, 2),
        adjusted_rcn=round(adjusted_rcn, 2),
        depreciated_rcn=round(depreciated_rcn, 2),
        depreciation_pct=round(depreciation_pct * 100, 2)
    )

# API routes
@app.get("/")
def get_api_info():
    """API root endpoint providing information about the API"""
    return {
        "name": "TerraFusionBuild RCN Valuation Engine",
        "version": "1.0.0",
        "description": "API for calculating Replacement Cost New (RCN) values for property valuation",
        "endpoints": [
            {
                "path": "/",
                "method": "GET",
                "description": "API information"
            },
            {
                "path": "/rcn/calculate",
                "method": "POST",
                "description": "Calculate RCN value for a building"
            }
        ]
    }

@app.post("/rcn/calculate", response_model=RCNOutput)
def calculate_rcn_endpoint(input_data: RCNInput):
    """Calculate RCN value based on input building data"""
    try:
        logger.info(f"Calculating RCN for {input_data.sqft} sqft {input_data.construction_type} {input_data.use_type}")
        result = calculate_rcn(input_data)
        logger.info(f"RCN calculation result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error calculating RCN: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating RCN: {str(e)}")

# For direct execution
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    logger.info(f"Starting RCN Valuation Engine API on http://{host}:{port}")
    uvicorn.run("rcn_api_stub:app", host=host, port=port, reload=True)