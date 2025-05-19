#!/usr/bin/env python3
"""
RCN (Replacement Cost New) API Stub for TerraFusionBuild

This FastAPI application provides endpoints for calculating building replacement costs
using the Replacement Cost New (RCN) methodology. It loads cost profiles, depreciation tables,
and example building data from JSON files and provides calculation services based on
industry standard valuation methods.

Usage:
  python rcn_api_stub.py

API Endpoints:
  GET /health - Health check endpoint
  GET /info - API information
  POST /calculate - Calculate RCN for a building
  GET /examples - List available example buildings
  GET /examples/{example_id} - Get a specific example building
  POST /examples/{example_id}/calculate - Calculate RCN for an example building
  GET /building-types - Get available building types
  GET /regions - Get available regions
  GET /quality-classes - Get available quality classes
  GET /documentation - Get API documentation

Configuration:
  The API loads data from the following files in the sample_data directory:
  - cost_profiles.json - Cost profiles for different building types
  - depreciation_tables.json - Depreciation tables for different building types
  - example_building_inputs.json - Example building inputs for testing
"""

import json
import os
import time
import math
import logging
from datetime import datetime
from typing import Dict, List, Optional, Union, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse
from pydantic import BaseModel, Field, validator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="TerraFusionBuild RCN Valuation API",
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

# Data storage
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_data")
cost_profiles = {}
depreciation_tables = {}
example_buildings = {}

# Models
class Feature(BaseModel):
    type: str
    quantity: Optional[int] = None
    area: Optional[float] = None
    area_covered: Optional[float] = None

class Renovation(BaseModel):
    year: int
    extent: str

class SpecialConsiderations(BaseModel):
    historical: Optional[bool] = None
    energy_efficient: Optional[bool] = None
    ada_compliant: Optional[bool] = None
    hazardous_materials: Optional[bool] = None

class BuildingInput(BaseModel):
    id: Optional[str] = None
    description: str
    building_type: str
    subtype: str
    year_built: int
    total_area: float
    construction_type: str
    quality_class: str
    condition: str
    region: str
    stories: float
    basement_area: float = 0.0
    garage_area: float = 0.0
    units: Optional[int] = None
    office_area: Optional[float] = None
    warehouse_area: Optional[float] = None
    loading_docks: Optional[int] = None
    features: List[Feature] = []
    last_renovation: Optional[Renovation] = None
    special_considerations: Optional[SpecialConsiderations] = None

class CalculationStep(BaseModel):
    step: int
    description: str
    details: str
    value: Optional[float] = None

class CalculationResult(BaseModel):
    building_id: Optional[str] = None
    building_description: str
    calculation_date: str
    replacement_cost_new: float
    depreciated_value: float
    depreciation_percentage: float
    effective_age: Optional[int] = None
    remaining_life: Optional[int] = None
    cost_breakdown: Dict[str, float]
    calculation_steps: List[CalculationStep]
    cost_per_sqft: float
    confidence_level: str
    warnings: List[str] = []

# Load data from files
def load_data():
    global cost_profiles, depreciation_tables, example_buildings
    
    try:
        # Load cost profiles
        with open(os.path.join(DATA_DIR, "cost_profiles.json"), "r") as f:
            cost_profiles = json.load(f)
            logger.info(f"Loaded cost profiles with {len(cost_profiles['building_types'])} building types")
        
        # Load depreciation tables
        with open(os.path.join(DATA_DIR, "depreciation_tables.json"), "r") as f:
            depreciation_tables = json.load(f)
            logger.info(f"Loaded depreciation tables with {len(depreciation_tables['age_based'])} building types")
        
        # Load example buildings
        with open(os.path.join(DATA_DIR, "example_building_inputs.json"), "r") as f:
            data = json.load(f)
            example_buildings = {bldg["id"]: bldg for bldg in data["example_buildings"]}
            logger.info(f"Loaded {len(example_buildings)} example buildings")
    
    except Exception as e:
        logger.error(f"Error loading data: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    load_data()
    logger.info("RCN API started successfully")

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# API info endpoint
@app.get("/info", tags=["System"])
async def api_info():
    return {
        "name": "TerraFusionBuild RCN Valuation API",
        "version": "1.0.0",
        "description": "API for calculating Replacement Cost New (RCN) values for buildings",
        "supported_building_types": list(cost_profiles["building_types"].keys()),
        "supported_regions": list(cost_profiles["regions"].keys()),
        "data_year": 2025
    }

# Calculate RCN for a building
@app.post("/calculate", response_model=CalculationResult, tags=["Calculation"])
async def calculate_rcn(building: BuildingInput):
    try:
        # Validate building input against available data
        validate_building_input(building)
        
        # Start timing calculation
        start_time = time.time()
        
        # Calculate replacement cost new
        result = calculate_rcn_value(building)
        
        # Log calculation time
        calculation_time = time.time() - start_time
        logger.info(f"Calculated RCN for {building.description} in {calculation_time:.2f} seconds")
        
        return result
    
    except KeyError as e:
        logger.error(f"Invalid input data: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid input data: {e}")
    
    except Exception as e:
        logger.error(f"Error calculating RCN: {e}")
        raise HTTPException(status_code=500, detail=f"Error calculating RCN: {str(e)}")

# List available example buildings
@app.get("/examples", tags=["Examples"])
async def list_examples(
    building_type: Optional[str] = Query(None, description="Filter by building type"),
    quality_class: Optional[str] = Query(None, description="Filter by quality class"),
    region: Optional[str] = Query(None, description="Filter by region")
):
    filtered_examples = example_buildings.copy()
    
    # Apply filters
    if building_type:
        filtered_examples = {k: v for k, v in filtered_examples.items() if v["building_type"] == building_type}
    if quality_class:
        filtered_examples = {k: v for k, v in filtered_examples.items() if v["quality_class"] == quality_class}
    if region:
        filtered_examples = {k: v for k, v in filtered_examples.items() if v["region"] == region}
    
    # Return summary of each example
    return {
        "count": len(filtered_examples),
        "examples": [
            {
                "id": k,
                "description": v["description"],
                "building_type": v["building_type"],
                "subtype": v["subtype"],
                "quality_class": v["quality_class"],
                "total_area": v["total_area"]
            }
            for k, v in filtered_examples.items()
        ]
    }

# Get a specific example building
@app.get("/examples/{example_id}", tags=["Examples"])
async def get_example(example_id: str = Path(..., description="ID of the example building")):
    if example_id not in example_buildings:
        raise HTTPException(status_code=404, detail=f"Example building with ID {example_id} not found")
    
    return example_buildings[example_id]

# Calculate RCN for an example building
@app.post("/examples/{example_id}/calculate", response_model=CalculationResult, tags=["Examples"])
async def calculate_example_rcn(example_id: str = Path(..., description="ID of the example building")):
    if example_id not in example_buildings:
        raise HTTPException(status_code=404, detail=f"Example building with ID {example_id} not found")
    
    # Convert example building to BuildingInput model
    building = BuildingInput(**example_buildings[example_id])
    
    # Calculate RCN
    return await calculate_rcn(building)

# Get available building types
@app.get("/building-types", tags=["Reference Data"])
async def get_building_types():
    types = {}
    for building_type, data in cost_profiles["building_types"].items():
        types[building_type] = {
            "code": data["code"],
            "name": data["name"],
            "description": data["description"],
            "subtypes": [
                {
                    "code": subtype_data["code"],
                    "name": subtype_data["name"],
                    "description": subtype_data["description"],
                    "base_rate": subtype_data["base_rate"]
                }
                for subtype, subtype_data in data["subtypes"].items()
            ]
        }
    return types

# Get available regions
@app.get("/regions", tags=["Reference Data"])
async def get_regions():
    return cost_profiles["regions"]

# Get available quality classes
@app.get("/quality-classes", tags=["Reference Data"])
async def get_quality_classes():
    return cost_profiles["quality_classes"]

# Get API documentation
@app.get("/documentation", response_class=HTMLResponse, tags=["System"])
async def get_documentation():
    docs_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>TerraFusionBuild RCN API Documentation</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            h1 { color: #333366; }
            h2 { color: #336699; margin-top: 30px; }
            code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
            pre { background-color: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            .endpoint { margin-bottom: 40px; }
        </style>
    </head>
    <body>
        <h1>TerraFusionBuild RCN API Documentation</h1>
        <p>This API provides endpoints for calculating building replacement costs using the Replacement Cost New (RCN) methodology.</p>
        
        <h2>Endpoints</h2>
        
        <div class="endpoint">
            <h3>Calculate RCN</h3>
            <p><strong>POST</strong> /calculate</p>
            <p>Calculate the Replacement Cost New (RCN) value for a building.</p>
            <p>Request body example:</p>
            <pre>
{
  "description": "Standard Single-Family Home",
  "building_type": "residential",
  "subtype": "single_family",
  "year_built": 2010,
  "total_area": 2200,
  "construction_type": "frame",
  "quality_class": "standard",
  "condition": "average",
  "region": "midwest",
  "stories": 2,
  "basement_area": 1100,
  "garage_area": 440,
  "features": [
    {
      "type": "fireplace",
      "quantity": 1
    },
    {
      "type": "hvac",
      "area_covered": 2200
    }
  ]
}
            </pre>
        </div>
        
        <div class="endpoint">
            <h3>List Examples</h3>
            <p><strong>GET</strong> /examples</p>
            <p>List all available example buildings.</p>
            <p>Query parameters:</p>
            <ul>
                <li><code>building_type</code> - Filter by building type</li>
                <li><code>quality_class</code> - Filter by quality class</li>
                <li><code>region</code> - Filter by region</li>
            </ul>
        </div>
        
        <div class="endpoint">
            <h3>Get Example</h3>
            <p><strong>GET</strong> /examples/{example_id}</p>
            <p>Get a specific example building by ID.</p>
        </div>
        
        <div class="endpoint">
            <h3>Calculate Example RCN</h3>
            <p><strong>POST</strong> /examples/{example_id}/calculate</p>
            <p>Calculate the RCN for a specific example building.</p>
        </div>
        
        <h2>Building Types</h2>
        <p>The API supports the following building types:</p>
        <ul>
            <li>residential</li>
            <li>commercial</li>
            <li>industrial</li>
            <li>agricultural</li>
        </ul>
        
        <h2>Calculation Methodology</h2>
        <p>The RCN calculation follows these general steps:</p>
        <ol>
            <li>Determine base cost rate from building type and subtype</li>
            <li>Apply construction type, quality class, and region adjustments</li>
            <li>Calculate base building cost (area × adjusted rate)</li>
            <li>Add costs for basement, garage, and features</li>
            <li>Calculate age-based and condition-based depreciation</li>
            <li>Apply effective age adjustments based on renovation history</li>
            <li>Determine final depreciated value</li>
        </ol>
    </body>
    </html>
    """
    return HTMLResponse(content=docs_html)

# Validation and Calculation Functions
def validate_building_input(building: BuildingInput):
    """Validate building input against available data"""
    # Check building type
    if building.building_type not in cost_profiles["building_types"]:
        raise KeyError(f"Building type '{building.building_type}' not found")
    
    # Check building subtype
    if building.subtype not in cost_profiles["building_types"][building.building_type]["subtypes"]:
        raise KeyError(f"Building subtype '{building.subtype}' not found for type '{building.building_type}'")
    
    # Check construction type
    if building.construction_type not in cost_profiles["construction_types"]:
        raise KeyError(f"Construction type '{building.construction_type}' not found")
    
    # Check quality class
    if building.quality_class not in cost_profiles["quality_classes"]:
        raise KeyError(f"Quality class '{building.quality_class}' not found")
    
    # Check region
    if building.region not in cost_profiles["regions"]:
        raise KeyError(f"Region '{building.region}' not found")
    
    # Check condition
    if building.condition not in depreciation_tables["condition_based"]:
        raise KeyError(f"Condition '{building.condition}' not found")
    
    # Check features
    for feature in building.features:
        if feature.type not in cost_profiles["features"]:
            raise KeyError(f"Feature type '{feature.type}' not found")

def calculate_rcn_value(building: BuildingInput) -> CalculationResult:
    """Calculate the Replacement Cost New (RCN) value for a building"""
    calculation_steps = []
    warnings = []
    step_counter = 1
    
    # Step 1: Get base rate for building type/subtype
    building_data = cost_profiles["building_types"][building.building_type]
    subtype_data = building_data["subtypes"][building.subtype]
    base_rate = subtype_data["base_rate"]
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Determine base rate",
        details=f"{subtype_data['name']} base rate = ${base_rate:.2f}/sq ft",
        value=base_rate
    ))
    step_counter += 1
    
    # Step 2: Apply construction type multiplier
    construction_data = cost_profiles["construction_types"][building.construction_type]
    construction_multiplier = construction_data["multiplier"]
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Apply construction type multiplier",
        details=f"{construction_data['name']} construction multiplier = {construction_multiplier}",
        value=construction_multiplier
    ))
    step_counter += 1
    
    # Step 3: Apply quality class multiplier
    quality_data = cost_profiles["quality_classes"][building.quality_class]
    quality_multiplier = quality_data["multiplier"]
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Apply quality class multiplier",
        details=f"{quality_data['name']} quality multiplier = {quality_multiplier}",
        value=quality_multiplier
    ))
    step_counter += 1
    
    # Step 4: Apply regional cost multiplier
    region_data = cost_profiles["regions"][building.region]
    region_multiplier = region_data["multiplier"]
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Apply regional cost multiplier",
        details=f"{region_data['name']} region multiplier = {region_multiplier}",
        value=region_multiplier
    ))
    step_counter += 1
    
    # Step 5: Calculate adjusted base rate
    adjusted_rate = base_rate * construction_multiplier * quality_multiplier * region_multiplier
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate adjusted base rate",
        details=f"${base_rate:.2f} × {construction_multiplier} × {quality_multiplier} × {region_multiplier} = ${adjusted_rate:.2f}/sq ft",
        value=adjusted_rate
    ))
    step_counter += 1
    
    # Step 6: Calculate base building cost
    base_building_cost = adjusted_rate * building.total_area
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate base building cost",
        details=f"${adjusted_rate:.2f} × {building.total_area:,.0f} sq ft = ${base_building_cost:,.0f}",
        value=base_building_cost
    ))
    step_counter += 1
    
    # Initialize cost breakdown
    cost_breakdown = {
        "main_structure": base_building_cost
    }
    
    # Step 7: Calculate basement cost, if any
    basement_cost = 0
    if building.basement_area > 0:
        basement_multiplier = 0.4  # Basements typically cost 40% of main living area
        basement_cost = adjusted_rate * basement_multiplier * building.basement_area
        cost_breakdown["basement"] = basement_cost
        
        calculation_steps.append(CalculationStep(
            step=step_counter,
            description="Calculate basement cost",
            details=f"${adjusted_rate:.2f} × {basement_multiplier} × {building.basement_area:,.0f} sq ft = ${basement_cost:,.0f}",
            value=basement_cost
        ))
        step_counter += 1
    
    # Step 8: Calculate garage cost, if any
    garage_cost = 0
    if building.garage_area > 0:
        garage_unit_cost = cost_profiles["features"]["garage"]["unit_cost"]
        quality_adj = cost_profiles["features"]["garage"]["quality_adjustments"][building.quality_class]
        garage_cost = garage_unit_cost * quality_adj * building.garage_area
        cost_breakdown["garage"] = garage_cost
        
        calculation_steps.append(CalculationStep(
            step=step_counter,
            description="Calculate garage cost",
            details=f"${garage_unit_cost:.2f} × {quality_adj} × {building.garage_area:,.0f} sq ft = ${garage_cost:,.0f}",
            value=garage_cost
        ))
        step_counter += 1
    
    # Step 9: Calculate feature costs
    feature_costs = {}
    feature_total = 0
    if building.features:
        feature_details = []
        for feature in building.features:
            feature_data = cost_profiles["features"][feature.type]
            feature_cost = 0
            quality_adj = feature_data["quality_adjustments"][building.quality_class]
            
            if feature.type == "hvac" and feature.area_covered:
                feature_cost = feature_data["unit_cost"] * quality_adj * feature.area_covered
                feature_details.append(f"HVAC: ${feature_data['unit_cost']:.2f} × {quality_adj} × {feature.area_covered:,.0f} sq ft = ${feature_cost:,.0f}")
            
            elif feature.type == "fireplace" and feature.quantity:
                feature_cost = feature_data["unit_cost"] * quality_adj * feature.quantity
                feature_details.append(f"Fireplace: ${feature_data['unit_cost']:,.0f} × {quality_adj} × {feature.quantity} = ${feature_cost:,.0f}")
            
            elif feature.type in ["pool", "deck"] and feature.area:
                feature_cost = feature_data["unit_cost"] * quality_adj * feature.area
                feature_details.append(f"{feature_data['name']}: ${feature_data['unit_cost']:.2f} × {quality_adj} × {feature.area:,.0f} sq ft = ${feature_cost:,.0f}")
            
            if feature_cost > 0:
                feature_costs[feature.type] = feature_cost
                feature_total += feature_cost
        
        cost_breakdown["features"] = feature_total
        
        calculation_steps.append(CalculationStep(
            step=step_counter,
            description="Calculate feature costs",
            details="\n".join(feature_details),
            value=feature_total
        ))
        step_counter += 1
    
    # Step 10: Calculate total replacement cost new
    total_rcn = base_building_cost + basement_cost + garage_cost + feature_total
    
    # Apply any special considerations
    special_considerations_cost = 0
    if building.special_considerations:
        special_details = []
        
        if building.special_considerations.historical:
            historical_multiplier = cost_profiles["special_considerations"]["historical"]["multiplier_range"][0]
            historical_adjustment = total_rcn * (historical_multiplier - 1)
            special_considerations_cost += historical_adjustment
            special_details.append(f"Historical building: ${total_rcn:,.0f} × ({historical_multiplier} - 1) = ${historical_adjustment:,.0f}")
        
        if building.special_considerations.energy_efficient:
            energy_multiplier = cost_profiles["special_considerations"]["energy_efficient"]["multiplier_range"][0]
            energy_adjustment = total_rcn * (energy_multiplier - 1)
            special_considerations_cost += energy_adjustment
            special_details.append(f"Energy-efficient building: ${total_rcn:,.0f} × ({energy_multiplier} - 1) = ${energy_adjustment:,.0f}")
        
        if building.special_considerations.ada_compliant:
            ada_multiplier = cost_profiles["special_considerations"]["ada_compliant"]["multiplier_range"][0]
            ada_adjustment = total_rcn * (ada_multiplier - 1)
            special_considerations_cost += ada_adjustment
            special_details.append(f"ADA-compliant building: ${total_rcn:,.0f} × ({ada_multiplier} - 1) = ${ada_adjustment:,.0f}")
        
        if special_considerations_cost > 0:
            cost_breakdown["special_considerations"] = special_considerations_cost
            total_rcn += special_considerations_cost
            
            calculation_steps.append(CalculationStep(
                step=step_counter,
                description="Apply special considerations",
                details="\n".join(special_details),
                value=special_considerations_cost
            ))
            step_counter += 1
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate total replacement cost new",
        details=f"${base_building_cost:,.0f} + ${basement_cost:,.0f} + ${garage_cost:,.0f} + ${feature_total:,.0f} + ${special_considerations_cost:,.0f} = ${total_rcn:,.0f}",
        value=total_rcn
    ))
    step_counter += 1
    
    # Step 11: Calculate age-based depreciation
    current_year = datetime.now().year
    age = current_year - building.year_built
    
    # Get effective age, adjusting for renovations if needed
    effective_age = age
    age_adjustment = 0
    
    if building.last_renovation:
        renovation_age = current_year - building.last_renovation.year
        renovation_extent = building.last_renovation.extent
        if renovation_extent in depreciation_tables["renovation_adjustments"]:
            age_adjustment = depreciation_tables["renovation_adjustments"][renovation_extent]
            effective_age = max(0, age + age_adjustment)
            
            calculation_steps.append(CalculationStep(
                step=step_counter,
                description="Adjust effective age for renovations",
                details=f"Actual age: {age} years, {renovation_extent} renovation {current_year - building.last_renovation.year} years ago, adjustment: {age_adjustment} years, effective age: {effective_age} years",
                value=effective_age
            ))
            step_counter += 1
    
    # Also adjust effective age based on condition
    condition_age_adjustment = depreciation_tables["effective_age_adjustment"][building.condition]
    effective_age = max(0, effective_age + condition_age_adjustment)
    
    if condition_age_adjustment != 0:
        calculation_steps.append(CalculationStep(
            step=step_counter,
            description="Adjust effective age for condition",
            details=f"Previous effective age: {effective_age - condition_age_adjustment} years, {building.condition} condition adjustment: {condition_age_adjustment} years, final effective age: {effective_age} years",
            value=effective_age
        ))
        step_counter += 1
    
    # Get depreciation rate from age-based table
    # Find the closest age in the table
    age_keys = sorted([int(k) for k in depreciation_tables["age_based"][building.building_type].keys()])
    closest_age = min(age_keys, key=lambda x: abs(x - effective_age))
    
    # If exact age not found, interpolate between closest ages
    if closest_age != effective_age and effective_age > 0:
        # Find the next age bracket
        age_index = age_keys.index(closest_age)
        if effective_age > closest_age and age_index < len(age_keys) - 1:
            lower_age = closest_age
            upper_age = age_keys[age_index + 1]
            lower_rate = depreciation_tables["age_based"][building.building_type][str(lower_age)]
            upper_rate = depreciation_tables["age_based"][building.building_type][str(upper_age)]
            
            # Linear interpolation
            age_depr_rate = lower_rate + (upper_rate - lower_rate) * (effective_age - lower_age) / (upper_age - lower_age)
        elif effective_age < closest_age and age_index > 0:
            upper_age = closest_age
            lower_age = age_keys[age_index - 1]
            upper_rate = depreciation_tables["age_based"][building.building_type][str(upper_age)]
            lower_rate = depreciation_tables["age_based"][building.building_type][str(lower_age)]
            
            # Linear interpolation
            age_depr_rate = lower_rate + (upper_rate - lower_rate) * (effective_age - lower_age) / (upper_age - lower_age)
        else:
            age_depr_rate = depreciation_tables["age_based"][building.building_type][str(closest_age)]
    else:
        age_depr_rate = depreciation_tables["age_based"][building.building_type][str(closest_age)]
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate age-based depreciation",
        details=f"{effective_age} years old, {building.building_type} depreciation rate = {age_depr_rate:.2f} ({age_depr_rate*100:.0f}%)",
        value=age_depr_rate
    ))
    step_counter += 1
    
    # Step 12: Calculate condition-based adjustment
    if building.building_type in depreciation_tables["building_type_specific_condition"]:
        condition_depr_rate = depreciation_tables["building_type_specific_condition"][building.building_type][building.condition]
    else:
        condition_depr_rate = depreciation_tables["condition_based"][building.condition]
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate condition-based adjustment",
        details=f"{building.condition} condition, adjustment = {condition_depr_rate:.2f} ({condition_depr_rate*100:.0f}%)",
        value=condition_depr_rate
    ))
    step_counter += 1
    
    # Step 13: Calculate total depreciation
    # Use the larger of age-based and condition-based depreciation
    total_depr_rate = max(age_depr_rate, condition_depr_rate)
    
    # Check for historical building depreciation cap
    if building.special_considerations and building.special_considerations.historical:
        if effective_age >= depreciation_tables["historical_considerations"]["age_thresholds"]["significant_historical"]:
            historical_cap = depreciation_tables["historical_considerations"]["depreciation_caps"]["significant_historical"]
            if total_depr_rate > historical_cap:
                total_depr_rate = historical_cap
                calculation_steps.append(CalculationStep(
                    step=step_counter,
                    description="Apply historical building depreciation cap",
                    details=f"Significant historical building (over {depreciation_tables['historical_considerations']['age_thresholds']['significant_historical']} years), depreciation capped at {historical_cap:.2f} ({historical_cap*100:.0f}%)",
                    value=historical_cap
                ))
                step_counter += 1
        elif effective_age >= depreciation_tables["historical_considerations"]["age_thresholds"]["historical"]:
            historical_cap = depreciation_tables["historical_considerations"]["depreciation_caps"]["historical"]
            if total_depr_rate > historical_cap:
                total_depr_rate = historical_cap
                calculation_steps.append(CalculationStep(
                    step=step_counter,
                    description="Apply historical building depreciation cap",
                    details=f"Historical building (over {depreciation_tables['historical_considerations']['age_thresholds']['historical']} years), depreciation capped at {historical_cap:.2f} ({historical_cap*100:.0f}%)",
                    value=historical_cap
                ))
                step_counter += 1
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate total depreciation",
        details=f"Max of {age_depr_rate:.2f} and {condition_depr_rate:.2f} = {total_depr_rate:.2f} ({total_depr_rate*100:.0f}%)",
        value=total_depr_rate
    ))
    step_counter += 1
    
    # Step 14: Calculate depreciated cost
    depreciated_value = total_rcn * (1 - total_depr_rate)
    
    calculation_steps.append(CalculationStep(
        step=step_counter,
        description="Calculate depreciated cost",
        details=f"${total_rcn:,.0f} × (1 - {total_depr_rate:.2f}) = ${depreciated_value:,.0f}",
        value=depreciated_value
    ))
    step_counter += 1
    
    # Calculate cost per square foot
    cost_per_sqft = total_rcn / building.total_area
    
    # Determine confidence level based on data quality
    confidence_level = "High"
    
    # If the building is very old, reduce confidence level
    if age > 75:
        confidence_level = "Medium"
        warnings.append("Building age exceeds 75 years, reducing confidence in depreciation estimates.")
    
    # If special considerations are present, reduce confidence
    if building.special_considerations:
        if building.special_considerations.historical:
            confidence_level = "Medium"
            warnings.append("Historical building status may affect accuracy of standard valuation methods.")
    
    # If features are missing or insufficient data, reduce confidence
    expected_features = {
        "residential": ["hvac"],
        "commercial": ["hvac"],
        "industrial": ["hvac"],
        "agricultural": []
    }
    
    feature_types = [f.type for f in building.features]
    if building.building_type in expected_features:
        for expected in expected_features[building.building_type]:
            if expected not in feature_types:
                confidence_level = "Medium"
                warnings.append(f"Missing expected feature: {expected} for building type {building.building_type}.")
    
    # If out of standard range for key parameters, reduce confidence
    if building.stories > 10:
        confidence_level = "Medium"
        warnings.append("Building height exceeds standard range for accurate cost estimation.")
    
    # Calculate estimated remaining life
    typical_life = {
        "residential": 75,
        "commercial": 60,
        "industrial": 50,
        "agricultural": 40
    }
    
    remaining_life = max(0, typical_life.get(building.building_type, 60) - effective_age)
    
    # Create calculation result
    result = CalculationResult(
        building_id=building.id,
        building_description=building.description,
        calculation_date=datetime.now().isoformat(),
        replacement_cost_new=total_rcn,
        depreciated_value=depreciated_value,
        depreciation_percentage=total_depr_rate * 100,
        effective_age=effective_age,
        remaining_life=remaining_life,
        cost_breakdown=cost_breakdown,
        calculation_steps=calculation_steps,
        cost_per_sqft=cost_per_sqft,
        confidence_level=confidence_level,
        warnings=warnings
    )
    
    return result

# Start the server if running as main script
if __name__ == "__main__":
    uvicorn.run("rcn_api_stub:app", host="0.0.0.0", port=5000, reload=True)