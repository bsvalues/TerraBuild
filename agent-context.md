# TerraFusion AI Agent Context

TerraFusion is an advanced AI-powered geospatial property valuation platform that transforms municipal property assessments through intelligent technologies and comprehensive data analysis, with a specific focus on Benton County's unique regional requirements.

## Core Project Components

1. **Cost Estimation Engine**
   - Building cost calculation using regional factors from Benton County
   - Quality and condition adjustments
   - Age-based depreciation modeling
   - Complexity factors (stories, foundation, roof type, HVAC)

2. **CostFactorTables Implementation**
   - JSON-driven cost factor data sourcing
   - Regional adjustment factors
   - Building type base rates
   - Quality grade multipliers
   - Integration with the Cost API endpoints

3. **AI Agent System**
   - Specialized agents for cost analysis, data quality, and compliance
   - Swarm coordination for collaborative problem-solving
   - Event-driven messaging between components

## Current Development Goals

1. **Refactor MarshallSwift to CostFactorTables**
   - Replace all references to MarshallSwift with CostFactorTables
   - Update function names (getMsCostFactors → getCostFactors)
   - Set up proper test fixtures in tests/costEngine/cf/

2. **Test Scaffolding**
   - Implement comprehensive test suite for cost engine components
   - Create test fixtures for cost factor data
   - Set up integration tests for API endpoints

3. **Cost Breakdown Panel**
   - Display cost factors loaded from data/costFactors.json
   - Show detailed breakdown of calculation components
   - Provide clear explanations of each adjustment factor

## Implementation Notes

- The cost factors are loaded from data/costFactors.json by default
- The cost estimate endpoint should be available at /cost/estimate
- Test files should be organized in tests/costEngine/cf/ directory
- All old references to MarshallSwift should be updated to CostFactorTables

## Technical Stack

- TypeScript Full-Stack (React + Express)
- PostgreSQL Database with Drizzle ORM
- Jest for Testing
- Tailwind CSS for UI Components
- AI Agent Infrastructure

## Important Commands

- `npm run lint` - Check for code style issues
- `npm test` - Run the test suite
- `npm start` - Start the application
- `npm run dev` - Start development server

## Health Check Sequence

1. Run lint checks to ensure code quality
2. Execute test suite to verify functionality
3. Start server and verify cost engine loading
4. Confirm cost factor data is properly loaded
5. Verify cost estimation works with proper factor application