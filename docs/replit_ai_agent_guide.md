# Replit AI Agent Guide for BCBS Development

This guide outlines how to use the Replit AI Agent effectively for developing the Benton County Building Cost System (BCBS). It includes specific prompt templates and strategies based on the PM playbook provided.

## Getting Started with the AI Agent

### Setting Up the Agent

1. **Access the Agent**: Click the AI icon in the left toolbar of your Replit workspace.
2. **Configure the Agent**: If prompted, select your preferred AI model.
3. **Set the Context**: Start by giving the agent context about the BCBS project:

```
You are my autonomous developer for the Benton County Building Cost System (BCBS). This is a TypeScript/React application for property assessment and building cost calculation. Follow my prompts exactly. After each deliverable, output:
- Changes made
- Test status
- Any clarifications needed
Do not move on until I approve the changes.
```

## Sprint-Based Development Workflow

### Sprint 1: Foundation & Architecture

Use this prompt to start Sprint 1:

```
Drive Sprint 1 to completion. Focus on:
1. Code quality improvements
   - Set up ESLint/Prettier with consistent rules
   - Organize imports consistently
   - Fix any TypeScript errors
2. Codebase organization
   - Refactor components into logical directories
   - Create consistent naming conventions
   - Add proper documentation
3. Testing framework
   - Set up Jest/React Testing Library
   - Add initial component tests
   - Create test utilities

For each task, make the necessary changes, explain what you did, and ask for approval before moving to the next task.
```

### Sprint 2: Cost Matrix Core Functionality

After completing Sprint 1, use this prompt for Sprint 2:

```
Implement the multi-step Cost Matrix functionality:
- Step 1: Import cost matrix data (from API endpoint: `/api/cost-matrix/import`)
- Step 2: View and filter cost matrix data
- Step 3: Apply cost matrix to assessments

Ensure proper error handling, loading states, and validation. Add unit tests for core functions and components.
```

### Sprint 3: API Enhancement

After completing Sprint 2, use this prompt for Sprint 3:

```
Enhance the API layer with these requirements:
- Standardize all API endpoints following RESTful practices
- Add proper validation using Zod schemas
- Implement consistent error handling
- Document all endpoints with clear request/response examples
- Add unit tests for each endpoint

Focus on the cost matrix and property assessment endpoints first.
```

## Task-Specific Prompt Templates

### Code Review

Use this prompt to get the AI to review specific code:

```
Review the [file path] in our BCBS codebase and provide:
1. Summary of current functionality
2. Potential issues or bugs
3. Performance concerns
4. Suggestions for improvement
5. Security considerations
```

Example:
```
Review the client/src/components/BCBSCostCalculator.tsx in our BCBS codebase and provide:
1. Summary of current functionality
2. Potential issues or bugs
3. Performance concerns
4. Suggestions for improvement
5. Security considerations
```

### Feature Implementation

Use this prompt to get the AI to implement a specific feature:

```
Implement the following feature for our BCBS application:
- Feature: [feature name]
- Description: [detailed description]
- Requirements:
  - [requirement 1]
  - [requirement 2]
- Technical constraints:
  - Use [specific libraries/approaches]
  - Consider [specific edge cases]
- Files to modify/create:
  - [file path 1]
  - [file path 2]
```

Example:
```
Implement the following feature for our BCBS application:
- Feature: Cost Matrix Filtering
- Description: Add filtering capabilities to the cost matrix view
- Requirements:
  - Users should be able to filter by building type, region, and year
  - Filters should be applied in real-time
  - Clear filters button should reset all filters
- Technical constraints:
  - Use React Query for data fetching
  - Implement as a reusable component
- Files to modify/create:
  - client/src/components/cost-matrix/CostMatrixFilters.tsx
  - client/src/hooks/use-cost-matrix.ts
```

### Bug Fixing

Use this prompt to get the AI to fix a specific bug:

```
Fix the following bug in our BCBS application:
- Bug description: [description of the bug]
- Steps to reproduce:
  - [step 1]
  - [step 2]
- Expected behavior: [what should happen]
- Actual behavior: [what currently happens]
- Error messages/logs: [any error messages or logs]
- Affected files:
  - [file path 1]
  - [file path 2]
```

Example:
```
Fix the following bug in our BCBS application:
- Bug description: Cost calculation is not applying the quality factor correctly
- Steps to reproduce:
  - Enter building details with "Premium" quality
  - Calculate the cost
- Expected behavior: The quality factor (1.25) should be applied to the base cost
- Actual behavior: The quality factor is not being applied, resulting in lower cost calculations
- Error messages: None, silent calculation error
- Affected files:
  - client/src/components/BCBSCostCalculator.tsx
  - client/src/utils/calculation-utils.ts
```

### Testing

Use this prompt to get the AI to create tests:

```
Create tests for the following component/function in our BCBS application:
- Component/Function: [name]
- File path: [file path]
- Test requirements:
  - Test [specific functionality 1]
  - Test [specific functionality 2]
  - Test edge cases: [specific edge cases]
- Testing approach:
  - Use [testing library/framework]
  - Mock [specific dependencies]
```

Example:
```
Create tests for the following component in our BCBS application:
- Component: CostMatrixImport
- File path: client/src/components/cost-matrix/CostMatrixImport.tsx
- Test requirements:
  - Test successful file upload
  - Test validation error handling
  - Test loading states
  - Test edge cases: empty file, invalid format, server error
- Testing approach:
  - Use Jest and React Testing Library
  - Mock API calls using msw
```

## Best Practices for Working with the AI Agent

1. **Be Specific**: Provide clear, detailed instructions with explicit requirements.

2. **Break Tasks Down**: Large tasks should be broken into smaller, manageable parts.

3. **Provide Context**: Give the agent necessary context about the codebase and project.

4. **Review Carefully**: Always review generated code before integrating it.

5. **Iterative Refinement**: Use follow-up prompts to refine and improve generated code.

6. **Learning from Feedback**: Incorporate feedback into future prompts to improve results.

7. **Documentation**: Ask the agent to document its work to help other developers understand the changes.

## Example Workflow

1. **Start with Analysis**:
   ```
   Analyze the current cost calculation implementation in client/src/components/BCBSCostCalculator.tsx. Identify any issues or improvement opportunities.
   ```

2. **Plan the Changes**:
   ```
   Based on your analysis, provide a plan for improving the cost calculation component with:
   1. Specific files to modify
   2. Changes to make in each file
   3. Testing approach
   ```

3. **Implement the Changes**:
   ```
   Implement the planned changes to improve the cost calculation component. Start with [specific file].
   ```

4. **Test the Implementation**:
   ```
   Create unit tests for the improved cost calculation functionality.
   ```

5. **Document the Changes**:
   ```
   Create documentation that explains:
   1. The changes made to the cost calculation
   2. How to use the improved component
   3. Any new props or APIs introduced
   ```

By following this guide, you'll be able to leverage the Replit AI Agent effectively for developing the BCBS application.