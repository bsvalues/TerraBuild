"""
Benton County PDF Report Generator

This module generates professional PDF reports for Benton County's
Building Cost Assessment System with proper branding, formatting,
and content structure.
"""

import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

def generate_benton_pdf_report(session_data, output_path, title, include_insights=True, include_history=True):
    """Generate a PDF report from the session data with Benton County branding"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, 
                           rightMargin=0.5*inch, leftMargin=0.5*inch,
                           topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    elements = []
    
    # Add Benton County Header
    header_style = ParagraphStyle(
        'BentonHeader',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=1,  # Center alignment
        spaceAfter=12,
        textColor=colors.Color(0.18, 0.32, 0.2)  # Dark green: #2F5233
    )
    
    # Add subtitle
    subtitle_style = ParagraphStyle(
        'BentonSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        alignment=1,  # Center alignment
        spaceAfter=20,
        textColor=colors.Color(0.18, 0.32, 0.2)  # Dark green: #2F5233
    )
    
    # Add document title
    elements.append(Paragraph("BENTON COUNTY, WASHINGTON", header_style))
    elements.append(Paragraph("Building Cost Assessment System", subtitle_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Add report title
    report_title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading2'],
        fontSize=14,
        alignment=1,  # Center alignment
        spaceAfter=10,
        textColor=colors.Color(0.18, 0.32, 0.2)  # Dark green: #2F5233
    )
    elements.append(Paragraph(f"Valuation Report: {title}", report_title_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Add session info
    info_style = ParagraphStyle(
        'InfoStyle',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=6
    )
    elements.append(Paragraph(f"<b>Report ID:</b> {session_data['id'][:8]}...", info_style))
    elements.append(Paragraph(f"<b>Source File:</b> {session_data['file']}", info_style))
    elements.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", info_style))
    elements.append(Paragraph(f"<b>Original Data Date:</b> {session_data['created_at']}", info_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Add matrix data table
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Heading3'],
        fontSize=12,
        spaceAfter=8,
        textColor=colors.Color(0.18, 0.32, 0.2)  # Dark green: #2F5233
    )
    elements.append(Paragraph("Building Cost Matrix Data", section_title_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Create the table data
    table_data = [['ID', 'Building Type', 'Region', 'Quality', 'Base Cost']]
    for row in session_data['rows']:
        table_data.append([
            str(row['id']), 
            row['building_type'], 
            row.get('region', 'EAST-WA'),
            row.get('quality', 'Standard'),
            f"${row['base_cost']:.2f}"
        ])
    
    # Create the table
    matrix_table = Table(table_data, colWidths=[40, 90, 90, 80, 80])
    matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.Color(0.18, 0.32, 0.2)),  # Dark green header
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(matrix_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Add insights if requested
    if include_insights and 'insights' in session_data and session_data['insights']:
        elements.append(Paragraph("Assessment Agent Insights", section_title_style))
        elements.append(Spacer(1, 0.1*inch))
        
        for insight in session_data['insights']:
            severity_color = colors.Color(0.18, 0.32, 0.2)  # Default dark green
            
            if insight['severity'] == 'warning':
                severity_color = colors.orange
            elif insight['severity'] == 'error':
                severity_color = colors.red
                
            insight_style = ParagraphStyle(
                f"Insight_{insight['severity']}",
                parent=styles['Normal'],
                fontSize=10,
                textColor=severity_color,
                leftIndent=20,
                spaceAfter=6
            )
            timestamp = insight.get('timestamp', datetime.now().isoformat())
            formatted_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
            
            elements.append(Paragraph(f"<b>{insight['agent']}</b> ({formatted_time}):", insight_style))
            elements.append(Paragraph(f"{insight['message']}", ParagraphStyle(
                'InsightMessage',
                parent=styles['Normal'],
                fontSize=10,
                leftIndent=30,
                spaceAfter=10
            )))
        
        elements.append(Spacer(1, 0.1*inch))
    
    # Add history if requested
    if include_history and 'history' in session_data and session_data['history']:
        elements.append(Paragraph("Valuation History", section_title_style))
        elements.append(Spacer(1, 0.1*inch))
        
        for i, entry in enumerate(session_data['history']):
            history_title_style = ParagraphStyle(
                'HistoryTitle',
                parent=styles['Normal'],
                fontSize=10,
                fontName='Helvetica-Bold',
                spaceAfter=4
            )
            
            timestamp = entry.get('timestamp', '')
            formatted_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00')).strftime('%Y-%m-%d %H:%M')
            matrix_id = entry.get('matrix_id', f'Version {i+1}')
            
            elements.append(Paragraph(f"{matrix_id} - {formatted_time}", history_title_style))
            
            # Add a brief summary of this version
            avg_res = entry.get('avg_residential_cost', 0)
            avg_com = entry.get('avg_commercial_cost', 0)
            modifier = entry.get('modified_by', 'Unknown')
            
            history_detail_style = ParagraphStyle(
                'HistoryDetail',
                parent=styles['Normal'],
                fontSize=9,
                leftIndent=20,
                spaceAfter=8
            )
            elements.append(Paragraph(f"Average Residential Cost: ${avg_res:.2f}", history_detail_style))
            elements.append(Paragraph(f"Average Commercial Cost: ${avg_com:.2f}", history_detail_style))
            elements.append(Paragraph(f"Modified by: {modifier}", history_detail_style))
        
        elements.append(Spacer(1, 0.1*inch))
    
    # Add certificate of authenticity
    elements.append(Spacer(1, 0.1*inch))
    cert_style = ParagraphStyle(
        'Certificate',
        parent=styles['Normal'],
        fontSize=10,
        alignment=1,  # Center alignment
        spaceAfter=10,
        borderWidth=1,
        borderColor=colors.Color(0.18, 0.32, 0.2),
        borderPadding=10,
        borderRadius=5
    )
    elements.append(Paragraph(
        f"This is an official valuation report generated by the Benton County Building Cost Assessment System. "
        f"The data contained in this document represents the official cost valuation for the specified building types "
        f"as of {datetime.now().strftime('%Y-%m-%d')}.", 
        cert_style
    ))
    
    # Add footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.gray,
        alignment=1  # Center alignment
    )
    elements.append(Spacer(1, 0.2*inch))
    footer_text = (
        f"Benton County Assessor's Office | 7122 W. Okanogan Place Bldg A, Kennewick, WA 99336 | "
        f"Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )
    elements.append(Paragraph(footer_text, footer_style))
    
    # Build the PDF
    doc.build(elements)
    pdf_data = buffer.getvalue()
    buffer.close()
    
    # Write to file
    with open(output_path, 'wb') as f:
        f.write(pdf_data)
    
    return output_path