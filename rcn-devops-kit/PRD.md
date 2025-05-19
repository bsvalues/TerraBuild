# Product Requirements Document
# RCN Valuation Engine

## Overview

The RCN (Replacement Cost New) Valuation Engine is a critical component of the TerraBuild property valuation platform. This engine provides accurate, defensible building cost valuations for county assessors and property tax professionals.

## Purpose

The RCN Engine calculates the cost to replace a building with a new one of similar utility, using current construction costs and methods while excluding any depreciation for age, condition, or obsolescence. This replacement cost serves as the foundation for property tax assessment valuation methodologies.

## Stakeholders

- County Assessor's Offices
- Property Tax Administrators
- Building Officials
- Property Owners (indirect)
- TerraBuild Development Team

## Requirements

### Functional Requirements

1. **Cost Calculation API**
   - Provide a RESTful API endpoint (`/rcn/calculate`) for calculating replacement cost new values
   - Accept building specifications as input (type, size, construction method, etc.)
   - Return detailed cost breakdowns including base cost, adjusted RCN, and depreciated values

2. **Cost Data Management**
   - Support Benton County cost matrix data structure
   - Allow for jurisdiction-specific cost adjustments
   - Include quality class multipliers
   - Support locality/region adjustment factors

3. **Valuation Methods**
   - Calculate base cost using square footage and building type
   - Apply quality class adjustments
   - Apply region/locality multipliers
   - Calculate depreciation based on age, condition, and obsolescence factors
   - Support multiple valuation scenarios for comparison

4. **Output Generation**
   - Provide consistent, formatted output for integration with reporting systems
   - Include metadata about calculation methodology
   - Store calculation history for auditing purposes

### Non-Functional Requirements

1. **Performance**
   - API response time under 200ms for single building calculations
   - Support for batch calculations of up to 100 buildings with response time under 5 seconds

2. **Reliability**
   - 99.9% uptime for the API
   - Graceful error handling with meaningful error messages
   - Input validation to prevent calculation errors

3. **Security**
   - API authentication using industry standard methods
   - Role-based access control for administrative functions
   - No personally identifiable information (PII) in logs

4. **Scalability**
   - Support for concurrent requests from multiple users
   - Horizontal scaling capability for high-demand periods
   - Caching of common calculation parameters

5. **Compliance**
   - Adherence to International Association of Assessing Officers (IAAO) standards
   - Support for jurisdiction-specific assessment rules
   - Audit trail for all calculations

## Success Metrics

1. Calculation accuracy within 5% of manual assessments
2. User adoption by target counties
3. Reduction in assessment appeals related to cost approach valuations
4. System performance meeting or exceeding non-functional requirements

## Timeline

- Alpha Release: Q2 2025
- Beta Testing with Benton County: Q3 2025
- Production Release: Q4 2025
- Additional County Support: Q1 2026