"""
TerraFusionBuild RCN Valuation Engine API

This FastAPI application implements the RCN (Replacement Cost New) calculation
API for building valuation as specified in the API specification.

Usage:
    python rcn_api_stub.py

Or with custom settings:
    PORT=8080 HOST=127.0.0.1 python rcn_api_stub.py
"""

import os
import json
import logging
import enum
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union, Any

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("dotenv package not found, using environment variables as-is")

import uvicorn
from pydantic import BaseModel, Field, validator
from fastapi import FastAPI, HTTPException, Query, Path as FastAPIPath
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("rcn_api.log")
    ]
)

logger = logging.getLogger("rcn_api")

# Global configuration
API_VERSION = "1.0.0"
BASE_PATH = Path(__file__).parent

# Load environment variables
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# API metadata
app = FastAPI(
    title="TerraFusionBuild RCN Valuation Engine API",
    description="API for calculating Replacement Cost New values for building valuation",
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for HTML UI
html_ui_dir = os.path.join(BASE_PATH, "html_ui")
if os.path.exists(html_ui_dir):
    app.mount("/ui", StaticFiles(directory=html_ui_dir, html=True), name="ui")


# Enums for standardized inputs
class UseType(str, enum.Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    AGRICULTURAL = "Agricultural"


class ConstructionType(str, enum.Enum):
    WOOD_FRAME = "Wood Frame"
    MASONRY = "Masonry"
    STEEL_FRAME = "Steel Frame"
    CONCRETE = "Concrete"


class QualityClass(str, enum.Enum):
    A_PLUS = "A+"
    A = "A"
    B_PLUS = "B+"
    B = "B"
    C_PLUS = "C+"
    C = "C"
    D_PLUS = "D+"
    D = "D"
    E = "E"


class Condition(str, enum.Enum):
    EXCELLENT = "Excellent"
    GOOD = "Good"
    AVERAGE = "Average"
    FAIR = "Fair"
    POOR = "Poor"


# Data Models
class RCNRequest(BaseModel):
    """Request model for RCN calculation"""
    use_type: UseType
    construction_type: ConstructionType
    sqft: float = Field(..., gt=0, description="Square footage of the building")
    year_built: int = Field(..., ge=1800, le=2025, description="Year the building was constructed")
    quality_class: QualityClass = Field(default=QualityClass.B)
    locality_index: float = Field(default=1.0, ge=0.5, le=2.0)
    condition: Condition = Field(default=Condition.AVERAGE)

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


class RCNResponse(BaseModel):
    """Response model for RCN calculation"""
    base_cost: float
    quality_factor: float
    locality_factor: float
    adjusted_rcn: float
    depreciation_pct: float
    depreciated_rcn: float
    effective_age: Optional[int] = None
    confidence_level: str = Field(default="High")
    calculation_notes: Optional[List[str]] = None
    calculation_date: datetime = Field(default_factory=datetime.now)

    class Config:
        schema_extra = {
            "example": {
                "base_cost": 154.75,
                "quality_factor": 1.1,
                "locality_factor": 1.05,
                "adjusted_rcn": 178.0,
                "depreciation_pct": 12.5,
                "depreciated_rcn": 156.0,
                "effective_age": 12,
                "confidence_level": "High",
                "calculation_notes": ["Standard residential depreciation applied", "Quality adjustment based on B class"],
                "calculation_date": "2025-05-19T12:30:45.123456"
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response model"""
    status: str = "error"
    code: int
    message: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


# Data Access Functions
def load_cost_profiles():
    """Load cost profiles from sample data"""
    try:
        sample_file = os.path.join(BASE_PATH, "sample_data", "cost_profiles.json")
        
        # If sample data file doesn't exist, use default hardcoded values
        if not os.path.exists(sample_file):
            logger.warning(f"Sample data file not found: {sample_file}")
            return get_default_cost_profiles()
        
        with open(sample_file, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading cost profiles: {e}")
        return get_default_cost_profiles()


def get_default_cost_profiles():
    """Return default cost profiles if sample data is unavailable"""
    return {
        "Residential": {
            "Wood Frame": 175.0,
            "Masonry": 195.0,
            "Steel Frame": 210.0,
            "Concrete": 225.0
        },
        "Commercial": {
            "Wood Frame": 145.0,
            "Masonry": 185.0,
            "Steel Frame": 195.0,
            "Concrete": 215.0
        },
        "Industrial": {
            "Wood Frame": 110.0,
            "Masonry": 125.0,
            "Steel Frame": 150.0,
            "Concrete": 175.0
        },
        "Agricultural": {
            "Wood Frame": 85.0,
            "Masonry": 110.0,
            "Steel Frame": 135.0,
            "Concrete": 150.0
        }
    }


def load_quality_factors():
    """Load quality adjustment factors"""
    return {
        "A+": 1.35,
        "A": 1.25,
        "B+": 1.15,
        "B": 1.0,
        "C+": 0.9,
        "C": 0.8,
        "D+": 0.7,
        "D": 0.6,
        "E": 0.5
    }


def load_condition_factors():
    """Load condition adjustment factors for depreciation adjustments"""
    return {
        "Excellent": 0.75,  # Reduces depreciation by 25%
        "Good": 0.9,        # Reduces depreciation by 10%
        "Average": 1.0,     # Standard depreciation
        "Fair": 1.15,       # Increases depreciation by 15%
        "Poor": 1.35        # Increases depreciation by 35%
    }


def calculate_depreciation(year_built, condition=None):
    """
    Calculate depreciation percentage based on the year built and condition
    
    Args:
        year_built: Year the building was constructed
        condition: Building condition (affects depreciation rate)
        
    Returns:
        Tuple of (depreciation_percentage, effective_age)
    """
    current_year = datetime.now().year
    age = current_year - year_built
    
    # Base depreciation calculation - simplified for demonstration
    # In a real system, this would use more sophisticated depreciation tables
    if age <= 0:
        base_depreciation = 0
    elif age <= 5:
        base_depreciation = age * 0.5  # 0.5% per year for first 5 years
    elif age <= 15:
        base_depreciation = 2.5 + (age - 5) * 1.0  # 1% per year for years 6-15
    elif age <= 30:
        base_depreciation = 12.5 + (age - 15) * 1.5  # 1.5% per year for years 16-30
    elif age <= 50:
        base_depreciation = 35 + (age - 30) * 1.0  # 1% per year for years 31-50
    else:
        base_depreciation = 55 + (age - 50) * 0.5  # 0.5% per year for years 51+
        
    # Cap depreciation at 80%
    base_depreciation = min(base_depreciation, 80.0)
    
    # Apply condition adjustment if provided
    condition_factors = load_condition_factors()
    condition_factor = condition_factors.get(condition, 1.0) if condition else 1.0
    
    # Calculate final depreciation with condition factor
    final_depreciation = base_depreciation * condition_factor
    
    # Cap final depreciation at 85%
    final_depreciation = min(final_depreciation, 85.0)
    
    return final_depreciation, age


# API Routes
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "TerraFusionBuild RCN Valuation Engine API",
        "version": API_VERSION,
        "documentation": "/docs",
        "ui": "/ui",
        "status": "operational"
    }


@app.post("/rcn/calculate", response_model=RCNResponse)
async def calculate_rcn(request: RCNRequest):
    """
    Calculate Replacement Cost New (RCN) for a building
    
    Returns:
        RCNResponse: Calculated RCN and related factors
    """
    try:
        logger.info(f"RCN calculation request received: {request}")
        
        # Load cost profiles
        cost_profiles = load_cost_profiles()
        
        # Get base cost for building type
        try:
            base_cost = cost_profiles[request.use_type][request.construction_type]
        except KeyError:
            raise HTTPException(
                status_code=400,
                detail=f"No cost profile found for use type '{request.use_type}' and construction type '{request.construction_type}'"
            )
        
        # Get quality factor
        quality_factors = load_quality_factors()
        quality_factor = quality_factors.get(request.quality_class, 1.0)
        
        # Calculate adjusted RCN
        adjusted_rcn_per_sqft = base_cost * quality_factor * request.locality_index
        adjusted_rcn_total = adjusted_rcn_per_sqft * request.sqft
        
        # Calculate depreciation
        depreciation_pct, effective_age = calculate_depreciation(request.year_built, request.condition)
        
        # Calculate depreciated RCN
        depreciated_rcn = adjusted_rcn_total * (1 - (depreciation_pct / 100))
        
        # Determine confidence level based on inputs
        confidence_level = "High"
        if request.year_built < 1950:
            confidence_level = "Medium"
        if request.locality_index < 0.7 or request.locality_index > 1.5:
            confidence_level = "Medium"
            
        # Generate calculation notes
        notes = [
            f"Base cost of ${base_cost:.2f} per sqft for {request.use_type}/{request.construction_type}",
            f"Quality adjustment factor of {quality_factor:.2f} applied for {request.quality_class} class",
            f"Locality index of {request.locality_index:.2f} applied",
            f"Depreciation of {depreciation_pct:.1f}% applied based on {effective_age} years age and {request.condition} condition"
        ]
        
        # Prepare response
        response = RCNResponse(
            base_cost=base_cost,
            quality_factor=quality_factor,
            locality_factor=request.locality_index,
            adjusted_rcn=adjusted_rcn_total,
            depreciation_pct=depreciation_pct,
            depreciated_rcn=depreciated_rcn,
            effective_age=effective_age,
            confidence_level=confidence_level,
            calculation_notes=notes,
            calculation_date=datetime.now()
        )
        
        logger.info(f"RCN calculation completed: {response}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in RCN calculation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during RCN calculation: {str(e)}"
        )


@app.get("/examples", response_model=List[Dict[str, Any]])
async def get_examples():
    """Get sample building examples for testing"""
    try:
        examples_file = os.path.join(BASE_PATH, "sample_data", "example_building_inputs.json")
        
        if not os.path.exists(examples_file):
            logger.warning(f"Examples file not found: {examples_file}")
            return []
            
        with open(examples_file, "r") as f:
            examples = json.load(f)
        
        return examples
    except Exception as e:
        logger.error(f"Error loading examples: {str(e)}", exc_info=True)
        return []


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": API_VERSION, "timestamp": datetime.now()}


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler for consistent error responses"""
    error = ErrorResponse(
        code=exc.status_code,
        message="Request error",
        detail=exc.detail,
        timestamp=datetime.now()
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error.dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """General exception handler for unexpected errors"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    error = ErrorResponse(
        code=500,
        message="Internal server error",
        detail=str(exc),
        timestamp=datetime.now()
    )
    return JSONResponse(
        status_code=500,
        content=error.dict()
    )


# Create sample data folder if it doesn't exist
def ensure_sample_data():
    """Ensure sample data folder exists and contains required files"""
    sample_dir = os.path.join(BASE_PATH, "sample_data")
    os.makedirs(sample_dir, exist_ok=True)
    
    # Create cost profiles file if it doesn't exist
    cost_profiles_file = os.path.join(sample_dir, "cost_profiles.json")
    if not os.path.exists(cost_profiles_file):
        with open(cost_profiles_file, "w") as f:
            json.dump(get_default_cost_profiles(), f, indent=2)
            
    logger.info(f"Sample data directory setup at {sample_dir}")


if __name__ == "__main__":
    # Ensure sample data is available
    ensure_sample_data()
    
    # Print startup information
    print(f"\n{'='*60}")
    print(f"TerraFusionBuild RCN Valuation Engine API v{API_VERSION}")
    print(f"{'='*60}")
    print(f"Server starting on http://{HOST}:{PORT}")
    print(f"Documentation available at http://{HOST}:{PORT}/docs")
    print(f"UI available at http://{HOST}:{PORT}/ui")
    print(f"{'='*60}\n")
    
    # Start the API server
    uvicorn.run("rcn_api_stub:app", host=HOST, port=PORT, reload=DEBUG)