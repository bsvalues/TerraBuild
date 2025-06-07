"""
Export Service for TerraBuild API

Handles exporting of valuation data in different formats.
"""
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Import PDF generator
from app.utils.pdf_generator import generate_benton_pdf_report

class ExportService:
    """
    Service for exporting TerraBuild valuation data in different formats.
    """
    
    def __init__(self, export_dir: str = None):
        """
        Initialize the export service.
        
        Args:
            export_dir: Directory to store exported files
        """
        self.export_dir = export_dir or os.path.join(os.getcwd(), "data", "exports")
        os.makedirs(self.export_dir, exist_ok=True)
    
    def get_export_path(self, filename: str) -> str:
        """
        Get the file path for an export.
        
        Args:
            filename: Name of the export file
            
        Returns:
            str: Path to the export file
        """
        return os.path.join(self.export_dir, filename)

# Create global export service instance
export_service = ExportService()

def generate_pdf_export(
    session_data: Dict[str, Any],
    filename: str = None,
    include_insights: bool = True,
    include_history: bool = True
) -> str:
    """
    Generate a PDF export of session data.
    
    Args:
        session_data: Valuation session data
        filename: Name for the PDF file
        include_insights: Whether to include agent insights
        include_history: Whether to include history
        
    Returns:
        str: Path to the exported PDF file
    """
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_id = session_data.get("metadata", {}).get("session_id", "unknown")
        filename = f"valuation_{session_id}_{timestamp}.pdf"
    
    output_path = export_service.get_export_path(filename)
    title = "Benton County Building Cost Assessment Report"
    
    # Generate the PDF using the PDF generator
    generate_benton_pdf_report(
        session_data=session_data,
        output_path=output_path,
        title=title,
        include_insights=include_insights,
        include_history=include_history
    )
    
    return output_path

def generate_json_export(
    session_data: Dict[str, Any],
    filename: str = None
) -> str:
    """
    Generate a JSON export of session data.
    
    Args:
        session_data: Valuation session data
        filename: Name for the JSON file
        
    Returns:
        str: Path to the exported JSON file
    """
    if filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_id = session_data.get("metadata", {}).get("session_id", "unknown")
        filename = f"valuation_{session_id}_{timestamp}.json"
    
    output_path = export_service.get_export_path(filename)
    
    # Add export metadata
    export_data = {
        "export_metadata": {
            "timestamp": datetime.now().isoformat(),
            "format": "json",
            "version": "1.0.0"
        },
        "session_data": session_data
    }
    
    # Write to JSON file
    with open(output_path, "w") as f:
        json.dump(export_data, f, indent=2)
    
    return output_path