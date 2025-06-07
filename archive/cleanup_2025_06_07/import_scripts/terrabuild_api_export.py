from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Dict, Optional
from datetime import datetime
import os, json, uuid
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = "./matrix_sessions"
EXPORT_DIR = "./matrix_exports"
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(EXPORT_DIR, exist_ok=True)

class MatrixRow(BaseModel):
    id: int
    building_type: str
    base_cost: float

class MatrixPayload(BaseModel):
    fileName: str
    data: List[MatrixRow]

class ExportRequest(BaseModel):
    session_id: str
    format: str  # 'pdf' or 'json'
    include_insights: bool = True
    include_history: bool = True
    title: Optional[str] = None

def save_session(data, session_id):
    path = os.path.join(DATA_DIR, f"{session_id}.json")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def get_session_data(session_id):
    path = os.path.join(DATA_DIR, f"{session_id}.json")
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)

@app.post("/api/validate_matrix")
def validate_matrix(payload: MatrixPayload):
    session_id = str(uuid.uuid4())
    issues = [row for row in payload.data if row.base_cost < 100]
    session_data = {
        "id": session_id,
        "file": payload.fileName,
        "created_at": datetime.now().isoformat(),
        "rows": [row.dict() for row in payload.data],
        "issues": len(issues),
        "insights": generate_insights(payload.data),  # Add insights to session data
        "history": []  # Empty history for new sessions
    }
    save_session(session_data, session_id)
    return {
        "session_id": session_id,
        "valid": len(issues) == 0,
        "issues_found": len(issues),
        "message": "Validation complete.",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/session/{session_id}")
def get_session(session_id: str):
    data = get_session_data(session_id)
    if not data:
        return {"error": "Session not found."}
    return data

@app.post("/api/re_run_agents")
def re_run_agents(payload: dict):
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    
    # Get the existing session data
    session_data = get_session_data(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update the session with new insights and add to history
    original_data = session_data.copy()
    if "history" not in session_data:
        session_data["history"] = []
    
    # Add the current state to history before updating
    history_entry = {
        "timestamp": datetime.now().isoformat(),
        "rows": session_data["rows"],
        "insights": session_data.get("insights", [])
    }
    session_data["history"].append(history_entry)
    
    # Generate new insights
    session_data["insights"] = generate_insights(session_data["rows"])
    
    # Save the updated session
    save_session(session_data, session_id)
    
    return {
        "session_id": session_id,
        "message": "Agents re-run successfully",
        "insights": session_data["insights"],
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/get_insights/{session_id}")
def get_insights(session_id: str):
    session_data = get_session_data(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "insights": session_data.get("insights", []),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/get_valuation_history/{session_id}")
def get_valuation_history(session_id: str):
    session_data = get_session_data(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "history": session_data.get("history", []),
        "timestamp": datetime.now().isoformat()
    }

def generate_insights(matrix_data):
    """Generate AI agent insights based on the matrix data"""
    insights = []
    
    # Check for anomalies in base costs
    costs = [row["base_cost"] if isinstance(row, dict) else row.base_cost for row in matrix_data]
    avg_cost = sum(costs) / len(costs) if costs else 0
    
    # Sample insights based on data analysis
    if any(cost < 100 for cost in costs):
        insights.append({
            "agent": "cost-analysis-agent",
            "severity": "warning",
            "message": "Some base costs are below $100, which seems unusually low for building valuation.",
            "timestamp": datetime.now().isoformat()
        })
    
    if max(costs) > avg_cost * 2:
        insights.append({
            "agent": "data-quality-agent",
            "severity": "info",
            "message": f"Cost outliers detected. The highest cost is {max(costs)}, which is significantly above the average of {avg_cost:.2f}.",
            "timestamp": datetime.now().isoformat()
        })
    
    if len(set(row["building_type"] if isinstance(row, dict) else row.building_type for row in matrix_data)) < 3:
        insights.append({
            "agent": "compliance-agent",
            "severity": "info",
            "message": "Limited building types detected. Consider expanding the matrix to include more diverse property types.",
            "timestamp": datetime.now().isoformat()
        })
    
    return insights

@app.post("/api/export")
async def export_matrix(export_request: ExportRequest):
    session_id = export_request.session_id
    export_format = export_request.format.lower()
    
    # Validate format
    if export_format not in ["pdf", "json"]:
        raise HTTPException(status_code=400, detail="Invalid export format. Use 'pdf' or 'json'.")
    
    # Get session data
    session_data = get_session_data(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Generate file name
    title = export_request.title or f"TerraBuild_Valuation_{session_id[:8]}"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = f"{title}_{timestamp}"
    
    if export_format == "json":
        # Create JSON export
        export_data = {
            "export_id": str(uuid.uuid4()),
            "session_id": session_id,
            "title": title,
            "generated_at": datetime.now().isoformat(),
            "matrix_data": session_data["rows"],
        }
        
        if export_request.include_insights:
            export_data["insights"] = session_data.get("insights", [])
        
        if export_request.include_history:
            export_data["history"] = session_data.get("history", [])
        
        # Save JSON file
        json_path = os.path.join(EXPORT_DIR, f"{file_name}.json")
        with open(json_path, "w") as f:
            json.dump(export_data, f, indent=2)
        
        return FileResponse(
            path=json_path,
            filename=f"{file_name}.json",
            media_type="application/json"
        )
    
    else:  # PDF export
        # Create PDF file
        pdf_path = os.path.join(EXPORT_DIR, f"{file_name}.pdf")
        generate_pdf_report(session_data, pdf_path, title, export_request.include_insights, export_request.include_history)
        
        return FileResponse(
            path=pdf_path,
            filename=f"{file_name}.pdf",
            media_type="application/pdf"
        )

def generate_pdf_report(session_data, output_path, title, include_insights=True, include_history=True):
    """Generate a PDF report from the session data"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    # Add title
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    elements.append(Paragraph(f"TerraBuild Valuation Report: {title}", title_style))
    elements.append(Spacer(1, 12))
    
    # Add session info
    elements.append(Paragraph(f"Session ID: {session_data['id'][:8]}...", styles['Normal']))
    elements.append(Paragraph(f"File: {session_data['file']}", styles['Normal']))
    elements.append(Paragraph(f"Created: {session_data['created_at']}", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Add matrix data table
    elements.append(Paragraph("Matrix Data", styles['Heading2']))
    elements.append(Spacer(1, 6))
    
    # Create the table data
    table_data = [['ID', 'Building Type', 'Base Cost']]
    for row in session_data['rows']:
        table_data.append([str(row['id']), row['building_type'], f"${row['base_cost']:.2f}"])
    
    # Create the table
    matrix_table = Table(table_data, colWidths=[60, 200, 100])
    matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(matrix_table)
    elements.append(Spacer(1, 12))
    
    # Add insights if requested
    if include_insights and 'insights' in session_data and session_data['insights']:
        elements.append(Paragraph("Agent Insights", styles['Heading2']))
        elements.append(Spacer(1, 6))
        
        for insight in session_data['insights']:
            severity_color = colors.darkblue
            if insight['severity'] == 'warning':
                severity_color = colors.orange
            elif insight['severity'] == 'error':
                severity_color = colors.red
                
            insight_style = ParagraphStyle(
                f"Insight_{insight['severity']}",
                parent=styles['Normal'],
                fontSize=10,
                textColor=severity_color,
                leftIndent=20
            )
            elements.append(Paragraph(f"<b>{insight['agent']}</b>: {insight['message']}", insight_style))
            elements.append(Spacer(1, 4))
        
        elements.append(Spacer(1, 12))
    
    # Add history if requested
    if include_history and 'history' in session_data and session_data['history']:
        elements.append(Paragraph("Valuation History", styles['Heading2']))
        elements.append(Spacer(1, 6))
        
        for i, entry in enumerate(session_data['history']):
            elements.append(Paragraph(f"Version {i+1} - {entry['timestamp']}", styles['Heading3']))
            
            # Add a brief summary of this version
            num_rows = len(entry['rows'])
            avg_cost = sum(row['base_cost'] for row in entry['rows']) / num_rows if num_rows else 0
            elements.append(Paragraph(f"Matrix with {num_rows} rows, average cost: ${avg_cost:.2f}", styles['Normal']))
            elements.append(Spacer(1, 8))
        
        elements.append(Spacer(1, 12))
    
    # Add footer
    footer_text = f"TerraBuild Valuation System | Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    elements.append(Paragraph(footer_text, styles['Normal']))
    
    # Build the PDF
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # Write to file
    with open(output_path, 'wb') as f:
        f.write(pdf_data)
    
    return output_path

# Main execution
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)