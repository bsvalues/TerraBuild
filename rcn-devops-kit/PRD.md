# TerraFusionBuild RCN Valuation Engine - Product Requirements Document

## 1. Introduction

### 1.1 Purpose

The TerraFusionBuild RCN (Replacement Cost New) Valuation Engine is designed to provide county assessors, real estate professionals, and insurance adjusters with a reliable tool for calculating accurate replacement cost values for various building types. This document outlines the requirements and specifications for the RCN Valuation Engine.

### 1.2 Scope

This document covers the RCN Valuation Engine's core functionality, deployment options, user interface, and API capabilities. It serves as the definitive reference for understanding the product's features and limitations.

### 1.3 Product Overview

The RCN Valuation Engine is a standalone application that calculates replacement cost values based on industry-standard cost metrics including building type, construction type, quality class, regional factors, and depreciation. It offers both a web-based UI and API access for integration with existing systems.

## 2. Product Features

### 2.1 Core Calculation Engine

- **Base Cost Calculation**: Calculate base cost using square footage and type-specific cost rates
- **Quality Adjustments**: Apply quality class multipliers to base costs
- **Regional Adjustments**: Adjust costs based on regional factors
- **Age Depreciation**: Calculate depreciation based on building age
- **Condition Depreciation**: Apply depreciation based on building condition
- **Feature Additions**: Calculate costs for additional building features
- **Confidence Indicators**: Provide confidence levels for calculations based on data availability

### 2.2 Web Interface

- **Interactive Form**: User-friendly input form for building parameters
- **Detailed Results**: Comprehensive breakdown of calculation results
- **Example Buildings**: Pre-configured examples for common building types
- **Responsive Design**: Works on desktop and tablet devices

### 2.3 API Endpoints

- **Calculate RCN**: Primary endpoint for calculating RCN values
- **Building Types**: Retrieve available building types
- **Construction Types**: Retrieve available construction types
- **Quality Classes**: Retrieve available quality classes
- **Regions**: Retrieve available regions
- **Example Buildings**: Retrieve example building inputs

### 2.4 Deployment Options

- **Standalone Server**: Run as a Python web server
- **Windows Service**: Install as a background Windows service
- **Executable Package**: Run as a standalone Windows executable
- **Deployment Package**: Create a distributable package for deployment

## 3. User Personas

### 3.1 County Assessor

- **Needs**: Batch processing of property valuations, consistency in calculations
- **Goals**: Accurately assess property values for tax purposes
- **Pain Points**: Time-consuming manual calculations, inconsistent methodologies

### 3.2 Real Estate Appraiser

- **Needs**: Quick individual property valuations
- **Goals**: Generate accurate property reports for clients
- **Pain Points**: Limited access to cost data, complex calculation processes

### 3.3 Insurance Adjuster

- **Needs**: Defensible replacement cost estimates
- **Goals**: Determine appropriate insurance coverage amounts
- **Pain Points**: Outdated cost data, regional variations in construction costs

### 3.4 IT Administrator

- **Needs**: Simple deployment and maintenance
- **Goals**: Integrate with existing systems and workflows
- **Pain Points**: Complex setup procedures, limited documentation

## 4. Technical Requirements

### 4.1 System Requirements

- **Operating System**: Windows 10 or newer, Windows Server 2016+
- **Runtime Environment**: Python 3.8+ or standalone executable
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB disk space
- **Network**: Internet access (for initial setup only)

### 4.2 Performance Requirements

- **Response Time**: < 2 seconds for individual calculations
- **Throughput**: Support for up to 10 concurrent users
- **Availability**: 99.9% uptime when running as a service

### 4.3 Security Requirements

- **Data Storage**: Local storage only, no external data transmission
- **API Access**: Local network access only by default

## 5. Data Requirements

### 5.1 Cost Data

- **Building Types**: Support for residential, commercial, industrial, agricultural
- **Construction Types**: Multiple construction methodologies
- **Quality Classes**: Multiple quality grades with corresponding multipliers
- **Regional Factors**: Geographic cost adjustment factors
- **Base Rates**: Cost per square foot for various building/construction types
- **Feature Adjustments**: Cost factors for additional building features

### 5.2 Depreciation Data

- **Age-Based Depreciation**: Factors based on effective age
- **Condition-Based Depreciation**: Factors based on building condition

## 6. Interfaces

### 6.1 User Interfaces

- **Web UI**: HTML-based interface accessible via web browser
- **API Documentation**: Interactive Swagger UI for API exploration

### 6.2 API Interfaces

- **REST API**: JSON-based RESTful API
- **OpenAPI Documentation**: Swagger specification for API documentation

## 7. Customization

### 7.1 Cost Profiles

- **Editable Cost Data**: Modify cost profiles through JSON configuration files
- **Custom Building Types**: Add organization-specific building categories
- **Regional Adjustments**: Customize regional cost multipliers

### 7.2 Depreciation Tables

- **Custom Age Factors**: Modify age-based depreciation schedules
- **Custom Condition Factors**: Adjust condition-based depreciation values

## 8. Limitations & Constraints

- **No Cloud Integration**: The system operates locally without cloud dependencies
- **No External Database**: Uses file-based data storage
- **No Multi-user Authentication**: Designed for single organization use
- **Limited to Supported Building Types**: Calculations are limited to configured building types

## 9. Future Enhancements

- **Multi-user Support**: User management and authentication
- **External Database Integration**: Support for external database systems
- **Advanced Reporting**: Enhanced reporting capabilities
- **Mobile Interface**: Dedicated mobile application
- **Cloud Deployment**: Support for cloud deployment options
- **Integration APIs**: Connectors for popular property management systems

## Appendix A: Calculation Methodology

The RCN calculation follows this general formula:

```
Base Cost = Square Footage × Base Rate for Building/Construction Type
Quality Adjusted Cost = Base Cost × Quality Class Multiplier
Region Adjusted Cost = Quality Adjusted Cost × Regional Factor
Feature Costs = Sum of (Feature Quantity × Feature-specific Rate)
Depreciation Factor = Max(Age Depreciation, Condition Depreciation)
Final RCN = (Region Adjusted Cost + Feature Costs) × (1 - Depreciation Factor)
```

## Appendix B: Version History

| Version | Date       | Description                              |
|---------|------------|------------------------------------------|
| 1.0.0   | 2025-05-19 | Initial release with core functionality  |
