"""
PDF Generator for TerraBuild API

Generates professional PDF reports for valuation data.
"""
import os
from datetime import datetime
from typing import Dict, Any, List, Optional

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
except ImportError:
    print("Warning: ReportLab not installed. PDF generation will not work.")

def generate_benton_pdf_report(
    session_data: Dict[str, Any],
    output_path: str,
    title: str,
    include_insights: bool = True,
    include_history: bool = True
) -> str:
    """
    Generate a PDF report with Benton County branding.
    
    Args:
        session_data: Valuation session data
        output_path: Path to save the PDF
        title: Title of the report
        include_insights: Whether to include agent insights
        include_history: Whether to include history
        
    Returns:
        str: Path to the generated PDF
    """
    try:
        # Create a PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=72
        )
        
        # Get styles
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name='BentonTitle',
            fontName='Helvetica-Bold',
            fontSize=16,
            textColor=colors.darkgreen,
            alignment=1,  # Center
            spaceAfter=12
        ))
        styles.add(ParagraphStyle(
            name='BentonHeading',
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=colors.darkgreen,
            spaceAfter=6
        ))
        styles.add(ParagraphStyle(
            name='BentonSubheading',
            fontName='Helvetica-Bold',
            fontSize=12,
            textColor=colors.darkgreen,
            spaceAfter=6
        ))
        
        # Create content elements
        elements = []
        
        # Add Benton County header
        # In a real implementation, this would include the county logo
        elements.append(Paragraph(
            "Benton County, Washington",
            styles['BentonTitle']
        ))
        elements.append(Paragraph(
            "Building Cost Assessment System",
            styles['BentonSubheading']
        ))
        elements.append(Spacer(1, 0.25 * inch))
        
        # Add title
        elements.append(Paragraph(title, styles['BentonHeading']))
        elements.append(Spacer(1, 0.25 * inch))
        
        # Add metadata
        metadata = session_data.get("metadata", {})
        session_id = metadata.get("session_id", "Unknown ID")
        created_at = metadata.get("created_at", "Unknown")
        last_updated = metadata.get("last_updated", "Unknown")
        
        metadata_table_data = [
            ["Report Date:", datetime.now().strftime("%Y-%m-%d %H:%M:%S")],
            ["Session ID:", session_id],
            ["Created:", created_at],
            ["Last Updated:", last_updated]
        ]
        
        metadata_table = Table(
            metadata_table_data,
            colWidths=[1.5 * inch, 4 * inch]
        )
        metadata_table.setStyle(TableStyle([
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('FONT', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONT', (1, 0), (1, -1), 'Helvetica'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey)
        ]))
        
        elements.append(metadata_table)
        elements.append(Spacer(1, 0.5 * inch))
        
        # Add matrix data
        elements.append(Paragraph("Cost Matrix Values", styles['BentonHeading']))
        elements.append(Spacer(1, 0.25 * inch))
        
        matrix_data = session_data.get("matrix_data", [])
        if matrix_data:
            for matrix in matrix_data:
                building_type = matrix.get("building_type", "Unknown")
                region = matrix.get("region", "Unknown")
                
                elements.append(Paragraph(
                    f"Building Type: {building_type}, Region: {region}",
                    styles['BentonSubheading']
                ))
                elements.append(Spacer(1, 0.15 * inch))
                
                # Create matrix table
                quality_classes = matrix.get("quality_classes", [])
                values = matrix.get("values", [])
                
                table_data = [["Quality Class", "Cost Value"]]
                for i, qc in enumerate(quality_classes):
                    if i < len(values):
                        table_data.append([qc, f"${values[i]:.2f}"])
                
                matrix_table = Table(table_data, colWidths=[2 * inch, 2 * inch])
                matrix_table.setStyle(TableStyle([
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('ALIGN', (1, 0), (1, -1), 'RIGHT')
                ]))
                
                elements.append(matrix_table)
                elements.append(Spacer(1, 0.25 * inch))
                
                # Add comments if any
                comments = matrix.get("comments", "")
                if comments:
                    elements.append(Paragraph("Comments:", styles['BentonSubheading']))
                    elements.append(Paragraph(comments, styles['Normal']))
                    elements.append(Spacer(1, 0.25 * inch))
        
        # Add insights if requested
        if include_insights:
            insights = session_data.get("insights", [])
            if insights:
                elements.append(Paragraph("AI Agent Insights", styles['BentonHeading']))
                elements.append(Spacer(1, 0.25 * inch))
                
                for insight in insights:
                    insight_type = insight.get("type", "info")
                    message = insight.get("message", "")
                    source = insight.get("source", "Unknown")
                    timestamp = insight.get("timestamp", "")
                    confidence = insight.get("confidence", 0)
                    
                    elements.append(Paragraph(
                        f"<b>{source}</b> ({confidence:.0%} confidence)",
                        styles['BentonSubheading']
                    ))
                    elements.append(Paragraph(message, styles['Normal']))
                    elements.append(Paragraph(
                        f"<i>Generated: {timestamp}</i>",
                        styles['Italic']
                    ))
                    elements.append(Spacer(1, 0.15 * inch))
        
        # Add history if requested
        if include_history:
            history = session_data.get("history", [])
            if history:
                elements.append(Paragraph("Valuation History", styles['BentonHeading']))
                elements.append(Spacer(1, 0.25 * inch))
                
                history_data = [["Date", "Change", "User"]]
                for entry in history:
                    history_data.append([
                        entry.get("timestamp", ""),
                        entry.get("action", "Unknown"),
                        entry.get("user", "Unknown")
                    ])
                
                history_table = Table(history_data, colWidths=[1.5 * inch, 3 * inch, 1.5 * inch])
                history_table.setStyle(TableStyle([
                    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
                    ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
                ]))
                
                elements.append(history_table)
                elements.append(Spacer(1, 0.25 * inch))
        
        # Add footer
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph(
            f"Generated by TerraBuild Valuation Platform on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            styles['Italic']
        ))
        elements.append(Paragraph(
            "This report is for official use by Benton County Assessor's Office.",
            styles['Italic']
        ))
        
        # Build the PDF
        doc.build(elements)
        
        return output_path
    
    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
        
        # Create a simple text file as fallback
        with open(output_path.replace(".pdf", ".txt"), "w") as f:
            f.write(f"BENTON COUNTY VALUATION REPORT\n")
            f.write(f"{title}\n\n")
            f.write(f"Session ID: {session_data.get('metadata', {}).get('session_id', 'Unknown')}\n")
            f.write(f"Generated: {datetime.now().isoformat()}\n\n")
            f.write("Error generating PDF report. Please contact technical support.")
        
        return output_path.replace(".pdf", ".txt")