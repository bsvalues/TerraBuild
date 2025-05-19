from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class RCNInput(BaseModel):
    use_type: str
    construction_type: str
    sqft: float
    year_built: int
    quality_class: Optional[str] = "B"
    locality_index: Optional[float] = 1.0
    condition: Optional[str] = "Average"

class RCNOutput(BaseModel):
    base_cost: float
    adjusted_rcn: float
    depreciated_rcn: float
    depreciation_pct: float

@app.post("/rcn/calculate", response_model=RCNOutput)
def calculate_rcn(data: RCNInput):
    base_cost_per_sqft = 110  # Simulated lookup value
    base_cost = data.sqft * base_cost_per_sqft
    adjusted_rcn = base_cost * data.locality_index

    age = 2025 - data.year_built
    depreciation_pct = min(age * 0.5, 60)  # Simple linear physical depreciation
    depreciated_rcn = adjusted_rcn * (1 - depreciation_pct / 100)

    return {
        "base_cost": round(base_cost, 2),
        "adjusted_rcn": round(adjusted_rcn, 2),
        "depreciated_rcn": round(depreciated_rcn, 2),
        "depreciation_pct": round(depreciation_pct, 2)
    }

@app.get("/")
def read_root():
    return {
        "name": "TerraFusionBuild RCN Valuation Engine",
        "version": "1.0.0",
        "description": "API for calculating Replacement Cost New (RCN) values for property valuation",
        "endpoints": [
            {
                "path": "/rcn/calculate",
                "method": "POST",
                "description": "Calculate RCN value for a building"
            },
            {
                "path": "/docs",
                "method": "GET",
                "description": "Swagger UI documentation"
            }
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)