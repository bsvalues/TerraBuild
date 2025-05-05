# TerraBuild Stakeholder Demo Guide

This guide outlines the key demonstration points and talking points for showcasing the TerraBuild platform to stakeholders, particularly those from Benton County Assessor's Office.

## Demo Preparation

1. Ensure all services are running:
   - Backend API on port 5001
   - Frontend application on port 3000
   
2. Pre-load demo data:
   - Verify `benton_matrix_demo.json` is accessible to the API
   - Reset any test modifications from previous demos

3. Have the environment variables set correctly:
   ```
   REACT_APP_JURISDICTION=Benton County, WA
   REACT_APP_REGION=Eastern Washington
   ```

## Demo Walkthrough

### 1. Introduction (2 minutes)

**Key Points:**
- "TerraBuild represents a new approach to property valuation, replacing black-box systems with transparent, explainable cost analytics."
- "Developed with and for Benton County, the system addresses the specific needs of modern assessor's offices."
- "The platform is built on a flexible architecture that allows deployment to any jurisdiction while maintaining Benton County as our flagship implementation."

**Actions:**
- Show the TerraBuild landing page with Benton County branding
- Point out the county seal and customized header

### 2. Matrix Visualization & Editing (5 minutes)

**Key Points:**
- "The core of the system is its editable cost matrix, allowing experts to view and adjust values as needed."
- "All changes are tracked with a complete audit trail for transparency and defensibility."
- "The system supports multiple building types and quality classes, organized according to Benton County's specific requirements."

**Actions:**
- Navigate to the matrix editor
- Demonstrate how to view different building types
- Make a small adjustment to a value and show how it's tracked
- Point out the color-coding for edited values

### 3. AI Agent Insights (4 minutes)

**Key Points:**
- "What makes TerraBuild unique is the AI agent system providing real-time insights and analysis."
- "These agents compare your matrix values against historical data, regional trends, and industry standards."
- "Each insight is provided with a confidence rating and clear explanation of the analysis performed."

**Actions:**
- Show the Agent Feed panel
- Highlight specific insights about Benton County's values
- Demonstrate filtering insights by type
- Point out confidence ratings

### 4. Valuation Timeline & Comparisons (3 minutes)

**Key Points:**
- "The system tracks valuation changes over time, allowing you to understand trends and patterns."
- "The scenario comparison feature allows you to evaluate different potential matrix configurations."
- "All historical versions are preserved for reference and reporting."

**Actions:**
- Show the valuation timeline chart
- Demonstrate the scenario comparison tool by selecting different versions
- Point out percentage changes in key categories

### 5. Export & Documentation (3 minutes)

**Key Points:**
- "When you're ready to publish or document your valuations, TerraBuild generates professional reports."
- "These exports include all relevant data, justifications, agent insights, and the audit trail of changes."
- "Reports can be generated as PDFs with Benton County branding or as JSON data for integration with other systems."

**Actions:**
- Navigate to the export panel
- Show both PDF and JSON export options
- Display a sample PDF with Benton County letterhead
- Point out the inclusion of agent insights and justifications

### 6. Jurisdiction Configuration (2 minutes)

**Key Points:**
- "While built for Benton County, TerraBuild is designed for deployment to any jurisdiction."
- "The entire system adapts to different regions, building types, and assessment methodologies through simple configuration."
- "This allows counties to share development costs while maintaining their specific requirements."

**Actions:**
- Briefly show how different jurisdiction settings affect the interface
- Mention other counties that could benefit from the system

### 7. Q&A (5+ minutes)

Be prepared for questions about:
- Data security and access controls
- Integration with existing systems
- Customization options for specific county needs
- Implementation timeline and requirements
- Training and support

## Key Technical Selling Points

If technical questions arise, emphasize:

- **Modern Architecture**: Built with TypeScript, React, and FastAPI for performance and reliability
- **Dynamic Configuration**: County-specific settings controlled through environment variables
- **Transparent AI**: All agent insights are explainable and include confidence ratings
- **Defensive Documentation**: Complete audit trail for appeals and justification
- **Flexible Deployment**: Can be hosted on-premises or in the cloud

## Call to Action

End with a clear next step, such as:
- "We'd like to schedule a follow-up session to discuss your specific implementation needs."
- "We can provide access to a sandbox environment for your team to evaluate the system in more detail."
- "Let's discuss what a pilot implementation would look like for Benton County."