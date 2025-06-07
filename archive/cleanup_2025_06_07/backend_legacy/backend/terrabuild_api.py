"""
TerraBuild API

Main FastAPI application for the TerraBuild valuation platform.
"""
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Union
from pydantic import BaseModel

# Import services
from app.services.session_service import SessionManager
from app.services.export_service import generate_pdf_export, generate_json_export
from app.utils.pdf_generator import generate_benton_pdf_report

# Create FastAPI app
app = FastAPI(
    title="TerraBuild API",
    description="API for TerraBuild County Valuation Platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, use specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize session manager
session_manager = SessionManager()

# Models
class MatrixData(BaseModel):
    matrix_id: str
    building_type: str
    region: str
    quality_classes: List[str]
    values: List[float]
    comments: Optional[str] = None

class Insight(BaseModel):
    insight_id: str 
    type: str
    message: str
    source: str
    timestamp: str
    confidence: float

class SessionData(BaseModel):
    matrix_data: List[MatrixData]
    insights: Optional[List[Insight]] = None
    history: Optional[List[Dict]] = None
    metadata: Optional[Dict] = None

class ExportRequest(BaseModel):
    session_id: str
    format: str
    include_insights: bool = True
    include_history: bool = True

# Routes
@app.get("/")
def read_root():
    return {"status": "ok", "service": "TerraBuild API"}

@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/api/sessions")
def create_session(data: SessionData):
    """Create a new valuation session"""
    session_id = f"{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8]}"
    success = session_manager.save_session(session_id, data.dict())
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to create session")
    
    return {"session_id": session_id, "created_at": datetime.now().isoformat()}

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    """Get a valuation session by ID"""
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session

@app.put("/api/sessions/{session_id}")
def update_session(session_id: str, data: SessionData):
    """Update an existing valuation session"""
    session = session_manager.get_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    success = session_manager.save_session(session_id, data.dict())
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update session")
    
    return {"session_id": session_id, "updated_at": datetime.now().isoformat()}

@app.post("/api/insights/generate")
def generate_insights(data: SessionData):
    """Generate AI agent insights for matrix data"""
    # In a real implementation, this would call AI services
    
    # For demo purposes, we'll return mock insights
    mock_insights = [
        {
            "insight_id": str(uuid.uuid4()),
            "type": "info",
            "message": "Residential rates are within expected ranges for the region",
            "source": "Regional Comparison Agent",
            "timestamp": datetime.now().isoformat(),
            "confidence": 0.92
        },
        {
            "insight_id": str(uuid.uuid4()),
            "type": "warning",
            "message": f"Commercial rates for {data.matrix_data[0].building_type} are 12% above regional average",
            "source": "Cost Analysis Agent",
            "timestamp": datetime.now().isoformat(),
            "confidence": 0.85
        }
    ]
    
    return {"insights": mock_insights}

@app.post("/api/export")
def export_session(request: ExportRequest):
    """Export session data in the requested format"""
    session = session_manager.get_session(request.session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if request.format.lower() == "pdf":
        # Generate PDF export
        filename = f"valuation_{request.session_id}.pdf"
        file_path = generate_pdf_export(session, filename, request.include_insights, request.include_history)
        
        return {
            "success": True,
            "format": "pdf",
            "file_path": file_path,
            "download_url": f"/api/download/{os.path.basename(file_path)}"
        }
    
    elif request.format.lower() == "json":
        # Generate JSON export
        filename = f"valuation_{request.session_id}.json"
        file_path = generate_json_export(session, filename)
        
        return {
            "success": True,
            "format": "json",
            "file_path": file_path,
            "download_url": f"/api/download/{os.path.basename(file_path)}"
        }
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {request.format}")

@app.get("/api/jurisdictions")
def get_jurisdictions():
    """Get available jurisdictions"""
    # In a production environment, this would come from a database
    return {
        "jurisdictions": [
            {
                "id": "benton-wa",
                "name": "Benton County, WA",
                "region": "Eastern Washington",
                "is_default": True
            },
            {
                "id": "king-wa",
                "name": "King County, WA",
                "region": "Western Washington",
                "is_default": False
            },
            {
                "id": "clark-wa",
                "name": "Clark County, WA",
                "region": "Southern Washington",
                "is_default": False
            }
        ]
    }

# Run the application using Uvicorn if executed directly
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 5001))
    uvicorn.run("terrabuild_api:app", host="0.0.0.0", port=port, reload=True)