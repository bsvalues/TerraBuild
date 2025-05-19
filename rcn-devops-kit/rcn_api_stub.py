#!/usr/bin/env python3
"""
TerraFusionBuild RCN Valuation Engine API

This module implements a FastAPI-based API for calculating Replacement Cost New (RCN)
values for property assessment. It provides a simple interface for county assessors
to calculate building costs based on various parameters.

Usage:
    python rcn_api_stub.py [--port PORT]

Example:
    python rcn_api_stub.py --port 8080
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union, Any

import pandas as pd
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Define the version
VERSION = "1.0.0"

# Create the application
app = FastAPI(
    title="TerraFusionBuild RCN Valuation Engine API",
    description="API for calculating Replacement Cost New (RCN) values for property assessment",
    version=VERSION,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class RCNRequest(BaseModel):
    """Request model for RCN calculation"""
    use_type: str = Field(..., description="Building use type (Residential, Commercial, Industrial, Agricultural)")
    construction_type: str = Field(..., description="Construction type (Wood Frame, Masonry, Steel Frame, Concrete)")
    sqft: int = Field(..., description="Building square footage")
    year_built: int = Field(..., description="Year the building was constructed")
    quality_class: str = Field(..., description="Quality class of construction (A+, A, B+, B, C+, C, D+, D, E)")
    condition: str = Field(..., description="Building condition (Excellent, Good, Average, Fair, Poor)")
    locality_index: Optional[float] = Field(1.0, description="Local adjustment factor")

class RCNResponse(BaseModel):
    """Response model for RCN calculation"""
    rcn: float = Field(..., description="Replacement Cost New in USD")
    depreciated_cost: float = Field(..., description="Depreciated cost in USD")
    details: Optional[Dict[str, Any]] = Field(None, description="Detailed calculation factors")

# Load sample data
def load_sample_data():
    """Load sample data from JSON files"""
    data = {
        "cost_profiles": {},
        "depreciation_tables": {},
        "example_buildings": []
    }
    
    # Get the directory where this script is located
    script_dir = Path(__file__).resolve().parent
    
    # Define paths to sample data files
    cost_profiles_path = script_dir / "sample_data" / "cost_profiles.json"
    depreciation_tables_path = script_dir / "sample_data" / "depreciation_tables.json"
    example_buildings_path = script_dir / "sample_data" / "example_building_inputs.json"
    
    # Load cost profiles
    if cost_profiles_path.exists():
        with open(cost_profiles_path, "r") as f:
            data["cost_profiles"] = json.load(f)
    else:
        # Default cost profiles if file doesn't exist
        data["cost_profiles"] = {
            "Residential": {
                "Wood Frame": {"base_rate": 125.0, "quality_factors": {"A+": 1.5, "A": 1.3, "B+": 1.2, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}},
                "Masonry": {"base_rate": 145.0, "quality_factors": {"A+": 1.5, "A": 1.3, "B+": 1.2, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}}
            },
            "Commercial": {
                "Steel Frame": {"base_rate": 175.0, "quality_factors": {"A+": 1.6, "A": 1.4, "B+": 1.2, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}},
                "Concrete": {"base_rate": 195.0, "quality_factors": {"A+": 1.6, "A": 1.4, "B+": 1.2, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}}
            },
            "Industrial": {
                "Steel Frame": {"base_rate": 155.0, "quality_factors": {"A+": 1.4, "A": 1.3, "B+": 1.1, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}},
                "Concrete": {"base_rate": 185.0, "quality_factors": {"A+": 1.4, "A": 1.3, "B+": 1.1, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}}
            },
            "Agricultural": {
                "Wood Frame": {"base_rate": 85.0, "quality_factors": {"A+": 1.3, "A": 1.2, "B+": 1.1, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}},
                "Steel Frame": {"base_rate": 95.0, "quality_factors": {"A+": 1.3, "A": 1.2, "B+": 1.1, "B": 1.0, "C+": 0.9, "C": 0.8, "D+": 0.7, "D": 0.6, "E": 0.5}}
            }
        }
    
    # Load depreciation tables
    if depreciation_tables_path.exists():
        with open(depreciation_tables_path, "r") as f:
            data["depreciation_tables"] = json.load(f)
    else:
        # Default depreciation tables if file doesn't exist
        data["depreciation_tables"] = {
            "condition_factors": {
                "Excellent": 0.95,
                "Good": 0.85,
                "Average": 0.70,
                "Fair": 0.50,
                "Poor": 0.30
            },
            "age_factors": {
                "0-5": 0.98,
                "6-10": 0.90,
                "11-20": 0.80,
                "21-30": 0.70,
                "31-40": 0.60,
                "41-50": 0.50,
                "51+": 0.40
            }
        }
    
    # Load example buildings
    if example_buildings_path.exists():
        with open(example_buildings_path, "r") as f:
            data["example_buildings"] = json.load(f)
    else:
        # Default example buildings if file doesn't exist
        data["example_buildings"] = [
            {
                "use_type": "Residential",
                "construction_type": "Wood Frame",
                "sqft": 2000,
                "year_built": 2010,
                "quality_class": "B",
                "condition": "Good",
                "locality_index": 1.05
            },
            {
                "use_type": "Commercial",
                "construction_type": "Steel Frame",
                "sqft": 10000,
                "year_built": 2005,
                "quality_class": "A",
                "condition": "Excellent",
                "locality_index": 1.10
            }
        ]
    
    return data

# Load the sample data
SAMPLE_DATA = load_sample_data()

# Calculation functions
def calculate_age_factor(year_built: int) -> float:
    """Calculate age factor based on the year built"""
    current_year = datetime.now().year
    age = current_year - year_built
    
    if age <= 5:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["0-5"]
    elif age <= 10:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["6-10"]
    elif age <= 20:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["11-20"]
    elif age <= 30:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["21-30"]
    elif age <= 40:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["31-40"]
    elif age <= 50:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["41-50"]
    else:
        return SAMPLE_DATA["depreciation_tables"]["age_factors"]["51+"]

def calculate_rcn(request: RCNRequest) -> Dict:
    """Calculate RCN based on the request parameters"""
    try:
        # Get base rate and quality factor
        base_rate = SAMPLE_DATA["cost_profiles"][request.use_type][request.construction_type]["base_rate"]
        quality_factor = SAMPLE_DATA["cost_profiles"][request.use_type][request.construction_type]["quality_factors"][request.quality_class]
        
        # Get condition factor
        condition_factor = SAMPLE_DATA["depreciation_tables"]["condition_factors"][request.condition]
        
        # Calculate age factor
        age_factor = calculate_age_factor(request.year_built)
        
        # Calculate RCN
        rcn = base_rate * request.sqft * quality_factor * request.locality_index
        
        # Calculate depreciated cost
        depreciated_cost = rcn * condition_factor * age_factor
        
        return {
            "rcn": round(rcn, 2),
            "depreciated_cost": round(depreciated_cost, 2),
            "details": {
                "base_rate": base_rate,
                "quality_factor": quality_factor,
                "condition_factor": condition_factor,
                "age_factor": age_factor,
                "locality_index": request.locality_index,
                "calculation": f"{base_rate} $/sqft × {request.sqft} sqft × {quality_factor} quality × {request.locality_index} locality = ${rcn:.2f} RCN",
                "depreciation": f"${rcn:.2f} × {condition_factor} condition × {age_factor} age = ${depreciated_cost:.2f}"
            }
        }
    except KeyError as e:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid parameter value: {str(e)}. Please check that all parameters have valid values."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API routes
@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint that redirects to documentation"""
    return """
    <html>
        <head>
            <title>TerraFusionBuild RCN Valuation Engine API</title>
            <meta http-equiv="refresh" content="0;url=/docs" />
        </head>
        <body>
            <p>Redirecting to <a href="/docs">API documentation</a>...</p>
        </body>
    </html>
    """

@app.get("/health", response_model=Dict)
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": VERSION}

@app.post("/rcn/calculate", response_model=RCNResponse)
async def calculate_rcn_endpoint(request: RCNRequest):
    """Calculate RCN value based on input parameters"""
    return calculate_rcn(request)

@app.get("/sample/buildings", response_model=List[Dict])
async def get_sample_buildings():
    """Get sample building inputs"""
    return SAMPLE_DATA["example_buildings"]

@app.get("/sample/cost-profiles", response_model=Dict)
async def get_cost_profiles():
    """Get cost profiles"""
    return SAMPLE_DATA["cost_profiles"]

@app.get("/sample/depreciation-tables", response_model=Dict)
async def get_depreciation_tables():
    """Get depreciation tables"""
    return SAMPLE_DATA["depreciation_tables"]

# Serve HTML UI
html_ui_path = Path(__file__).resolve().parent / "html_ui"
if html_ui_path.exists():
    app.mount("/ui", StaticFiles(directory=str(html_ui_path), html=True), name="ui")
    
    @app.get("/ui")
    async def ui_root():
        """Serve the UI index file"""
        index_path = html_ui_path / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        else:
            # Create a simple UI if no custom UI exists
            return HTMLResponse(f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>TerraFusionBuild RCN Valuation Engine</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {{
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 20px;
                    }}
                    h1, h2, h3 {{
                        color: #2c3e50;
                    }}
                    .container {{
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }}
                    .form-container {{
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }}
                    .result-container {{
                        background-color: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        min-height: 300px;
                    }}
                    label {{
                        display: block;
                        margin-bottom: 5px;
                        font-weight: 500;
                    }}
                    select, input {{
                        width: 100%;
                        padding: 8px;
                        margin-bottom: 15px;
                        border: 1px solid #ced4da;
                        border-radius: 4px;
                    }}
                    button {{
                        background-color: #2c3e50;
                        color: white;
                        border: none;
                        padding: 10px 15px;
                        border-radius: 4px;
                        cursor: pointer;
                    }}
                    button:hover {{
                        background-color: #1a252f;
                    }}
                    pre {{
                        background-color: #eaeaea;
                        padding: 15px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }}
                    .sample-button {{
                        background-color: #6c757d;
                        margin-right: 10px;
                    }}
                    .header {{
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 20px;
                    }}
                    .logo {{
                        font-size: 24px;
                        font-weight: bold;
                    }}
                    .version {{
                        font-size: 14px;
                        color: #6c757d;
                    }}
                    @media (max-width: 768px) {{
                        .container {{
                            grid-template-columns: 1fr;
                        }}
                    }}
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">TerraFusionBuild RCN Valuation Engine</div>
                    <div class="version">v{VERSION}</div>
                </div>
                
                <p>This tool calculates the Replacement Cost New (RCN) value for buildings based on 
                various parameters like use type, construction type, and quality.</p>
                
                <div class="container">
                    <div class="form-container">
                        <h2>Input Parameters</h2>
                        <form id="rcnForm">
                            <label for="useType">Building Use Type:</label>
                            <select id="useType" name="useType" required>
                                <option value="">Select...</option>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Industrial">Industrial</option>
                                <option value="Agricultural">Agricultural</option>
                            </select>
                            
                            <label for="constructionType">Construction Type:</label>
                            <select id="constructionType" name="constructionType" required>
                                <option value="">Select...</option>
                                <option value="Wood Frame">Wood Frame</option>
                                <option value="Masonry">Masonry</option>
                                <option value="Steel Frame">Steel Frame</option>
                                <option value="Concrete">Concrete</option>
                            </select>
                            
                            <label for="sqft">Square Footage:</label>
                            <input type="number" id="sqft" name="sqft" min="1" required>
                            
                            <label for="yearBuilt">Year Built:</label>
                            <input type="number" id="yearBuilt" name="yearBuilt" min="1900" max="2100" required>
                            
                            <label for="qualityClass">Quality Class:</label>
                            <select id="qualityClass" name="qualityClass" required>
                                <option value="">Select...</option>
                                <option value="A+">A+ (Premium)</option>
                                <option value="A">A (Excellent)</option>
                                <option value="B+">B+ (Very Good)</option>
                                <option value="B">B (Good)</option>
                                <option value="C+">C+ (Above Average)</option>
                                <option value="C">C (Average)</option>
                                <option value="D+">D+ (Fair)</option>
                                <option value="D">D (Poor)</option>
                                <option value="E">E (Minimal)</option>
                            </select>
                            
                            <label for="condition">Condition:</label>
                            <select id="condition" name="condition" required>
                                <option value="">Select...</option>
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Average">Average</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                            </select>
                            
                            <label for="localityIndex">Locality Index:</label>
                            <input type="number" id="localityIndex" name="localityIndex" step="0.01" min="0.5" max="2.0" value="1.0" required>
                            
                            <div>
                                <button type="button" id="loadSample1" class="sample-button">Load Sample 1</button>
                                <button type="button" id="loadSample2" class="sample-button">Load Sample 2</button>
                                <button type="submit">Calculate RCN</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="result-container">
                        <h2>Results</h2>
                        <div id="results">
                            <p>Enter parameters and click "Calculate RCN" to see results.</p>
                        </div>
                    </div>
                </div>
                
                <script>
                    // Sample data
                    const samples = [
                        {{
                            useType: 'Residential',
                            constructionType: 'Wood Frame',
                            sqft: 2000,
                            yearBuilt: 2010,
                            qualityClass: 'B',
                            condition: 'Good',
                            localityIndex: 1.05
                        }},
                        {{
                            useType: 'Commercial',
                            constructionType: 'Steel Frame',
                            sqft: 10000,
                            yearBuilt: 2005,
                            qualityClass: 'A',
                            condition: 'Excellent',
                            localityIndex: 1.10
                        }}
                    ];
                    
                    // Load sample data
                    document.getElementById('loadSample1').addEventListener('click', () => loadSample(0));
                    document.getElementById('loadSample2').addEventListener('click', () => loadSample(1));
                    
                    function loadSample(index) {{
                        const sample = samples[index];
                        document.getElementById('useType').value = sample.useType;
                        document.getElementById('constructionType').value = sample.constructionType;
                        document.getElementById('sqft').value = sample.sqft;
                        document.getElementById('yearBuilt').value = sample.yearBuilt;
                        document.getElementById('qualityClass').value = sample.qualityClass;
                        document.getElementById('condition').value = sample.condition;
                        document.getElementById('localityIndex').value = sample.localityIndex;
                    }}
                    
                    // Form submission
                    document.getElementById('rcnForm').addEventListener('submit', async (e) => {{
                        e.preventDefault();
                        
                        const form = e.target;
                        const data = {{
                            use_type: form.useType.value,
                            construction_type: form.constructionType.value,
                            sqft: parseInt(form.sqft.value),
                            year_built: parseInt(form.yearBuilt.value),
                            quality_class: form.qualityClass.value,
                            condition: form.condition.value,
                            locality_index: parseFloat(form.localityIndex.value)
                        }};
                        
                        try {{
                            document.getElementById('results').innerHTML = '<p>Calculating...</p>';
                            
                            const response = await fetch('/rcn/calculate', {{
                                method: 'POST',
                                headers: {{
                                    'Content-Type': 'application/json'
                                }},
                                body: JSON.stringify(data)
                            }});
                            
                            if (!response.ok) {{
                                throw new Error(`HTTP error! Status: ${{response.status}}`);
                            }}
                            
                            const result = await response.json();
                            
                            // Display results
                            let html = `
                                <h3>Replacement Cost New (RCN)</h3>
                                <p><strong>$${result.rcn.toLocaleString()}</strong></p>
                                
                                <h3>Depreciated Cost</h3>
                                <p><strong>$${result.depreciated_cost.toLocaleString()}</strong></p>
                            `;
                            
                            if (result.details) {{
                                html += `
                                    <h3>Calculation Details</h3>
                                    <p><strong>Base Rate:</strong> $${result.details.base_rate}/sqft</p>
                                    <p><strong>Quality Factor:</strong> ${result.details.quality_factor}</p>
                                    <p><strong>Condition Factor:</strong> ${result.details.condition_factor}</p>
                                    <p><strong>Age Factor:</strong> ${result.details.age_factor}</p>
                                    <p><strong>Locality Index:</strong> ${result.details.locality_index}</p>
                                    <p><strong>RCN Calculation:</strong> ${result.details.calculation}</p>
                                    <p><strong>Depreciation Calculation:</strong> ${result.details.depreciation}</p>
                                `;
                            }}
                            
                            document.getElementById('results').innerHTML = html;
                        }} catch (error) {{
                            document.getElementById('results').innerHTML = `
                                <h3>Error</h3>
                                <p>${{error.message}}</p>
                            `;
                        }}
                    }});
                </script>
            </body>
            </html>
            """)


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description="TerraFusionBuild RCN Valuation Engine API"
    )
    parser.add_argument(
        "--port", type=int, default=8000, help="Port to run the server on (default: 8000)"
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    
    print(f"Starting TerraFusionBuild RCN Valuation Engine API (v{VERSION})")
    print(f"Server will be available at: http://localhost:{args.port}")
    print(f"API Documentation: http://localhost:{args.port}/docs")
    print(f"Web Interface: http://localhost:{args.port}/ui")
    
    # Create logs directory if it doesn't exist
    logs_dir = Path(__file__).resolve().parent / "logs"
    logs_dir.mkdir(exist_ok=True)
    
    try:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=args.port)
    except ImportError:
        print("Error: uvicorn is required to run the server.")
        print("Please install it using: pip install uvicorn")
        sys.exit(1)