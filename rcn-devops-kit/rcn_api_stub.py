#!/usr/bin/env python3
"""
TerraFusionBuild RCN Valuation Engine API

This FastAPI implementation provides RCN (Replacement Cost New) calculation
capabilities for building valuation and assessment purposes.
"""

import os
import json
import logging
import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Body, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, validator, ConfigDict

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("rcn_valuation_engine")

# Try to load environment variables from .env file if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    logger.info("dotenv not installed, skipping .env file loading")

# Constants
VERSION = "1.0.0"
API_NAME = "TerraFusionBuild RCN Valuation Engine API"
CURRENT_YEAR = datetime.datetime.now().year

# Define models for API validation

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

class ConfidenceLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class RCNRequest(BaseModel):
    use_type: UseType
    construction_type: ConstructionType
    sqft: float = Field(..., gt=0, description="Square footage of the building")
    year_built: int = Field(..., ge=1800, le=CURRENT_YEAR, description="Year the building was constructed")
    quality_class: QualityClass = Field(default=QualityClass.B, description="Quality class of the building construction")
    locality_index: float = Field(default=1.0, ge=0.5, le=2.0, description="Location/region cost adjustment factor")
    condition: Condition = Field(default=Condition.AVERAGE, description="Condition of the building")
    name: Optional[str] = Field(default=None, description="Optional name for the building")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "use_type": "Residential",
            "construction_type": "Wood Frame",
            "sqft": 1800,
            "year_built": 2010,
            "quality_class": "B",
            "locality_index": 1.05,
            "condition": "Good",
            "name": "Single Family Home"
        }
    })

class RCNResponse(BaseModel):
    base_cost: float
    quality_factor: float
    locality_factor: float
    adjusted_rcn: float
    depreciation_pct: float
    depreciated_rcn: float
    effective_age: int
    confidence_level: ConfidenceLevel
    calculation_notes: List[str]
    calculation_date: datetime.datetime
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "base_cost": 154.75,
            "quality_factor": 1.1,
            "locality_factor": 1.05, 
            "adjusted_rcn": 324450.0,
            "depreciation_pct": 12.5,
            "depreciated_rcn": 283893.75,
            "effective_age": 12,
            "confidence_level": "High",
            "calculation_notes": [
                "Base cost of $175.00 per sqft for Residential/Wood Frame",
                "Quality adjustment factor of 1.10 applied for B class",
                "Locality index of 1.05 applied",
                "Depreciation of 12.5% applied based on 15 years age and Good condition"
            ],
            "calculation_date": "2025-05-19T12:30:45.123456"
        }
    })

class ErrorResponse(BaseModel):
    status: str = "error"
    code: int
    message: str
    detail: Optional[str] = None
    timestamp: datetime.datetime = Field(default_factory=datetime.datetime.now)
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "error",
            "code": 400,
            "message": "Request error",
            "detail": "Invalid value for field 'sqft': must be greater than 0",
            "timestamp": "2025-05-19T12:30:45.123456"
        }
    })

# Initialize FastAPI app
app = FastAPI(
    title=API_NAME,
    description="API for calculating Replacement Cost New (RCN) values for building valuation and assessment purposes.",
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility functions for RCN calculation

def get_base_cost(use_type: UseType, construction_type: ConstructionType) -> float:
    """Get the base cost per square foot for the given building type and construction."""
    # In a real implementation, this would look up from a cost matrix
    # For this stub, we return predefined values based on the building type and construction
    base_costs = {
        UseType.RESIDENTIAL: {
            ConstructionType.WOOD_FRAME: 175.00,
            ConstructionType.MASONRY: 185.00,
            ConstructionType.STEEL_FRAME: 195.00,
            ConstructionType.CONCRETE: 205.00,
        },
        UseType.COMMERCIAL: {
            ConstructionType.WOOD_FRAME: 165.00,
            ConstructionType.MASONRY: 180.00,
            ConstructionType.STEEL_FRAME: 210.00,
            ConstructionType.CONCRETE: 225.00,
        },
        UseType.INDUSTRIAL: {
            ConstructionType.WOOD_FRAME: 145.00,
            ConstructionType.MASONRY: 160.00,
            ConstructionType.STEEL_FRAME: 185.00,
            ConstructionType.CONCRETE: 200.00,
        },
        UseType.AGRICULTURAL: {
            ConstructionType.WOOD_FRAME: 95.00,
            ConstructionType.MASONRY: 115.00,
            ConstructionType.STEEL_FRAME: 135.00,
            ConstructionType.CONCRETE: 155.00,
        },
    }
    
    return base_costs[use_type][construction_type]

def get_quality_factor(quality_class: QualityClass) -> float:
    """Get the quality adjustment factor for the given quality class."""
    quality_factors = {
        QualityClass.A_PLUS: 1.30,
        QualityClass.A: 1.20,
        QualityClass.B_PLUS: 1.15,
        QualityClass.B: 1.10,
        QualityClass.C_PLUS: 1.05,
        QualityClass.C: 1.00,
        QualityClass.D_PLUS: 0.95,
        QualityClass.D: 0.90,
        QualityClass.E: 0.80,
    }
    
    return quality_factors[quality_class]

def calculate_effective_age(year_built: int, condition: Condition) -> int:
    """Calculate the effective age of the building based on year built and condition."""
    # Calculate chronological age
    chronological_age = CURRENT_YEAR - year_built
    
    # Adjust effective age based on condition
    condition_adjustments = {
        Condition.EXCELLENT: 0.70,  # Excellent condition reduces effective age
        Condition.GOOD: 0.85,
        Condition.AVERAGE: 1.00,    # Average condition = chronological age
        Condition.FAIR: 1.15,
        Condition.POOR: 1.30,       # Poor condition increases effective age
    }
    
    effective_age = int(chronological_age * condition_adjustments[condition])
    return max(1, effective_age)  # Ensure at least 1 year effective age

def calculate_depreciation(effective_age: int) -> float:
    """Calculate depreciation percentage based on effective age."""
    # Simple linear depreciation model
    # A more sophisticated model would use a depreciation table or curve
    
    max_life = 70  # Assumed maximum economic life in years
    max_depreciation = 80.0  # Maximum depreciation percentage
    
    depreciation_pct = min((effective_age / max_life) * max_depreciation, max_depreciation)
    return round(depreciation_pct, 2)

def determine_confidence_level(request: RCNRequest) -> ConfidenceLevel:
    """Determine the confidence level in the calculation based on input data."""
    # This is a simplified assessment for the stub
    # In a real implementation, more factors would be considered
    
    # Check if the building is too old (less confident for very old buildings)
    if request.year_built < 1950:
        return ConfidenceLevel.MEDIUM
    
    # Check if building is too new (more confident for newer buildings)
    if request.year_built > 2000:
        return ConfidenceLevel.HIGH
        
    # Check if size is unusual (less confident for very large buildings)
    if request.sqft > 5000:
        return ConfidenceLevel.MEDIUM
        
    # Default confidence level
    return ConfidenceLevel.HIGH

def load_example_buildings() -> List[Dict[str, Any]]:
    """Load example building specifications from sample data."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to example data in bundled or development environments
    sample_data_paths = [
        os.path.join(script_dir, "sample_data", "example_building_inputs.json"),
        os.path.join(script_dir, "dist", "sample_data", "example_building_inputs.json"),
        os.path.join(os.path.dirname(script_dir), "sample_data", "example_building_inputs.json")
    ]
    
    for path in sample_data_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load example buildings from {path}: {e}")
                break
    
    # Return default examples if file not found
    return [
        {
            "use_type": "Residential",
            "construction_type": "Wood Frame",
            "sqft": 1800,
            "year_built": 2010,
            "quality_class": "B",
            "locality_index": 1.05,
            "condition": "Good",
            "name": "Single Family Home"
        },
        {
            "use_type": "Commercial",
            "construction_type": "Steel Frame",
            "sqft": 5000,
            "year_built": 2015,
            "quality_class": "A",
            "locality_index": 1.15,
            "condition": "Excellent",
            "name": "Retail Store"
        }
    ]

# Define API endpoints

@app.get("/", response_class=JSONResponse)
async def get_api_info():
    """Get basic information about the API."""
    return {
        "name": API_NAME,
        "version": VERSION,
        "documentation": "/docs",
        "ui": "/ui",
        "status": "operational"
    }

@app.post("/rcn/calculate", response_model=RCNResponse)
async def calculate_rcn(request: RCNRequest = Body(...)):
    """Calculate Replacement Cost New (RCN) for a building."""
    try:
        # Get the base cost for the building type
        base_cost = get_base_cost(request.use_type, request.construction_type)
        
        # Apply quality adjustment
        quality_factor = get_quality_factor(request.quality_class)
        
        # Apply location/region adjustment
        locality_factor = request.locality_index
        
        # Calculate adjusted RCN
        adjusted_cost_per_sqft = base_cost * quality_factor * locality_factor
        adjusted_rcn = adjusted_cost_per_sqft * request.sqft
        
        # Calculate depreciation
        effective_age = calculate_effective_age(request.year_built, request.condition)
        depreciation_pct = calculate_depreciation(effective_age)
        
        # Apply depreciation to get final value
        depreciated_rcn = adjusted_rcn * (1 - (depreciation_pct / 100))
        
        # Determine confidence level
        confidence_level = determine_confidence_level(request)
        
        # Generate calculation notes
        calculation_notes = [
            f"Base cost of ${base_cost:.2f} per sqft for {request.use_type}/{request.construction_type}",
            f"Quality adjustment factor of {quality_factor:.2f} applied for {request.quality_class} class",
            f"Locality index of {locality_factor:.2f} applied",
            f"Depreciation of {depreciation_pct:.1f}% applied based on {effective_age} years effective age and {request.condition} condition"
        ]
        
        # Create the response
        response = RCNResponse(
            base_cost=base_cost,
            quality_factor=quality_factor,
            locality_factor=locality_factor,
            adjusted_rcn=round(adjusted_rcn, 2),
            depreciation_pct=depreciation_pct,
            depreciated_rcn=round(depreciated_rcn, 2),
            effective_age=effective_age,
            confidence_level=confidence_level,
            calculation_notes=calculation_notes,
            calculation_date=datetime.datetime.now()
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error calculating RCN: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating RCN: {str(e)}"
        )

@app.get("/examples", response_model=List[RCNRequest])
async def get_examples():
    """Get example building specifications for testing the RCN calculator."""
    try:
        examples = load_example_buildings()
        return examples
    except Exception as e:
        logger.error(f"Error loading example buildings: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error loading example buildings: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Check the health and operational status of the API."""
    return {
        "status": "ok",
        "version": VERSION,
        "timestamp": datetime.datetime.now().isoformat()
    }

# Setup HTML UI
@app.get("/ui", response_class=HTMLResponse)
async def get_ui():
    """Serve the HTML UI for the RCN calculator."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Path to UI in bundled or development environments
    ui_paths = [
        os.path.join(script_dir, "html_ui", "index.html"),
        os.path.join(script_dir, "dist", "html_ui", "index.html"),
        os.path.join(os.path.dirname(script_dir), "html_ui", "index.html")
    ]
    
    for path in ui_paths:
        if os.path.exists(path):
            with open(path, "r") as f:
                return f.read()
    
    # Return a basic UI if file not found
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>RCN Valuation Engine</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #333; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #4285f4; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #3367d6; }
            #result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; display: none; }
            .error { color: red; margin-top: 10px; }
        </style>
    </head>
    <body>
        <h1>TerraFusionBuild RCN Valuation Engine</h1>
        <p>Enter building details below to calculate the Replacement Cost New (RCN) value.</p>
        
        <div class="form-group">
            <label for="use_type">Building Use Type:</label>
            <select id="use_type">
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Agricultural">Agricultural</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="construction_type">Construction Type:</label>
            <select id="construction_type">
                <option value="Wood Frame">Wood Frame</option>
                <option value="Masonry">Masonry</option>
                <option value="Steel Frame">Steel Frame</option>
                <option value="Concrete">Concrete</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="sqft">Square Footage:</label>
            <input type="number" id="sqft" min="1" value="1800">
        </div>
        
        <div class="form-group">
            <label for="year_built">Year Built:</label>
            <input type="number" id="year_built" min="1800" max="2025" value="2010">
        </div>
        
        <div class="form-group">
            <label for="quality_class">Quality Class:</label>
            <select id="quality_class">
                <option value="A+">A+</option>
                <option value="A">A</option>
                <option value="B+">B+</option>
                <option value="B" selected>B</option>
                <option value="C+">C+</option>
                <option value="C">C</option>
                <option value="D+">D+</option>
                <option value="D">D</option>
                <option value="E">E</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="locality_index">Locality Index (0.5-2.0):</label>
            <input type="number" id="locality_index" min="0.5" max="2.0" step="0.01" value="1.05">
        </div>
        
        <div class="form-group">
            <label for="condition">Condition:</label>
            <select id="condition">
                <option value="Excellent">Excellent</option>
                <option value="Good" selected>Good</option>
                <option value="Average">Average</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
            </select>
        </div>
        
        <button id="calculate">Calculate RCN</button>
        <div id="error" class="error"></div>
        
        <div id="result">
            <h2>Calculation Results</h2>
            <div id="result_content"></div>
        </div>
        
        <script>
            document.getElementById('calculate').addEventListener('click', async () => {
                const useType = document.getElementById('use_type').value;
                const constructionType = document.getElementById('construction_type').value;
                const sqft = parseFloat(document.getElementById('sqft').value);
                const yearBuilt = parseInt(document.getElementById('year_built').value);
                const qualityClass = document.getElementById('quality_class').value;
                const localityIndex = parseFloat(document.getElementById('locality_index').value);
                const condition = document.getElementById('condition').value;
                
                const data = {
                    use_type: useType,
                    construction_type: constructionType,
                    sqft: sqft,
                    year_built: yearBuilt,
                    quality_class: qualityClass,
                    locality_index: localityIndex,
                    condition: condition
                };
                
                try {
                    const response = await fetch('/rcn/calculate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                    
                    if (!response.ok) {
                        throw new Error('Error calculating RCN');
                    }
                    
                    const result = await response.json();
                    
                    // Format the result
                    let resultHtml = `
                        <p><strong>Base Cost:</strong> $${result.base_cost.toFixed(2)} per sqft</p>
                        <p><strong>Quality Factor:</strong> ${result.quality_factor.toFixed(2)}</p>
                        <p><strong>Locality Factor:</strong> ${result.locality_factor.toFixed(2)}</p>
                        <p><strong>Adjusted RCN:</strong> $${result.adjusted_rcn.toFixed(2)}</p>
                        <p><strong>Depreciation:</strong> ${result.depreciation_pct.toFixed(1)}%</p>
                        <p><strong>Depreciated RCN:</strong> $${result.depreciated_rcn.toFixed(2)}</p>
                        <p><strong>Effective Age:</strong> ${result.effective_age} years</p>
                        <p><strong>Confidence Level:</strong> ${result.confidence_level}</p>
                        <p><strong>Notes:</strong></p>
                        <ul>
                    `;
                    
                    for (const note of result.calculation_notes) {
                        resultHtml += `<li>${note}</li>`;
                    }
                    
                    resultHtml += `</ul>
                        <p><strong>Calculation Date:</strong> ${new Date(result.calculation_date).toLocaleString()}</p>
                    `;
                    
                    document.getElementById('result_content').innerHTML = resultHtml;
                    document.getElementById('result').style.display = 'block';
                    document.getElementById('error').textContent = '';
                } catch (error) {
                    document.getElementById('error').textContent = error.message;
                    document.getElementById('result').style.display = 'none';
                }
            });
        </script>
    </body>
    </html>
    """

# Configure static files if HTML UI directory exists
script_dir = os.path.dirname(os.path.abspath(__file__))
static_dirs = [
    os.path.join(script_dir, "html_ui"),
    os.path.join(script_dir, "dist", "html_ui"),
    os.path.join(os.path.dirname(script_dir), "html_ui")
]

for static_dir in static_dirs:
    if os.path.exists(static_dir) and os.path.isdir(static_dir):
        app.mount("/static", StaticFiles(directory=static_dir), name="static")
        break

# Add exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions and return a standardized error response."""
    error = ErrorResponse(
        status="error",
        code=exc.status_code,
        message=str(exc.detail),
        timestamp=datetime.datetime.now()
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error.dict()
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions and return a standardized error response."""
    logger.error(f"Unhandled exception: {str(exc)}")
    error = ErrorResponse(
        status="error",
        code=500,
        message="Internal server error",
        detail=str(exc),
        timestamp=datetime.datetime.now()
    )
    return JSONResponse(
        status_code=500,
        content=error.dict()
    )

# Main entry point for running the server
if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting {API_NAME} v{VERSION}")
    print(f"Server running at http://{host}:{port}")
    print(f"Documentation available at http://{host}:{port}/docs")
    print(f"UI available at http://{host}:{port}/ui")
    
    uvicorn.run("rcn_api_stub:app", host=host, port=port, reload=False)