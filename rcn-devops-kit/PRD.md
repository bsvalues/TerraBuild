# Product Requirements Document: TerraFusionBuild RCN Valuation Engine

## 1. Introduction

### 1.1 Purpose

The TerraFusionBuild RCN (Replacement Cost New) Valuation Engine is designed to provide county assessors, property appraisers, and valuation specialists with a comprehensive, user-friendly, and customizable solution for calculating replacement costs of various building types. The system implements industry-standard valuation methodologies while allowing for local customization to ensure accurate cost calculations based on regional factors.

### 1.2 Scope

This document outlines the requirements for the complete RCN Valuation Engine DevOps Kit, including the core calculation engine, web interface, deployment options, and customization capabilities. The system is primarily designed for use by county assessment offices and property valuation professionals.

### 1.3 Definitions

- **RCN**: Replacement Cost New, the cost to construct a new building of equal utility using current materials, design, and workmanship
- **Depreciation**: The loss in value due to physical deterioration, functional obsolescence, or economic obsolescence
- **Cost Profiles**: Data structures containing base rates, adjustments, and multipliers for different building types
- **NSSM**: Non-Sucking Service Manager, a tool for installing Windows services

## 2. Product Overview

### 2.1 Product Perspective

The RCN Valuation Engine is a standalone system that can be deployed in various configurations depending on user needs:
- As a Python application with full source code access
- As a standalone executable requiring no Python installation
- As a Windows service for permanent background operation

The system features a REST API for programmatic access and a web-based user interface for interactive use.

### 2.2 User Classes and Characteristics

1. **County Assessors**: Need to accurately value large numbers of properties for tax assessment purposes
2. **Property Appraisers**: Require detailed cost calculations to support property valuations
3. **IT Administrators**: Responsible for deploying and maintaining the system
4. **Valuation Specialists**: Need to customize cost data to match local market conditions

### 2.3 Operating Environment

- Windows 10 or newer operating systems
- Minimum 100 MB of free disk space
- CPU: 1 GHz or faster processor
- RAM: 1 GB minimum (2 GB recommended)
- Network connectivity for multi-user access (optional)

### 2.4 Design and Implementation Constraints

- Windows-only deployment (no Linux or macOS support in this version)
- Requires administrative privileges for service installation
- API server runs on port 5000 by default (configurable)

### 2.5 Assumptions and Dependencies

- For Python deployment: Requires Python 3.8 or newer
- For service installation: Requires NSSM (automatically downloaded if not present)
- For deployment packaging: Requires 7-Zip (automatically detected or prompts for installation)

## 3. System Features and Requirements

### 3.1 Calculation Engine

#### 3.1.1 RCN Calculation
- Calculate replacement cost based on building characteristics, including type, size, quality, and features
- Apply appropriate cost multipliers based on construction type, quality class, and region
- Calculate costs for additional components such as basements, garages, and special features
- Provide itemized cost breakdown showing contribution of each component to total cost

#### 3.1.2 Depreciation Calculation
- Calculate age-based depreciation according to industry-standard tables
- Apply condition-based depreciation adjustments
- Account for renovation history in effective age calculations
- Apply special considerations for historical buildings
- Calculate total depreciation and present both RCN and depreciated values

#### 3.1.3 Data Customization
- Support for customizable cost profiles by building type and subtype
- Support for customizable depreciation tables by building type
- Support for region-specific cost adjustments
- Support for construction type and quality class multipliers

### 3.2 API Endpoints

#### 3.2.1 Calculation Endpoints
- `POST /calculate`: Calculate RCN for a custom building input
- `POST /examples/{example_id}/calculate`: Calculate RCN for a pre-defined example building

#### 3.2.2 Reference Data Endpoints
- `GET /building-types`: Retrieve available building types and subtypes
- `GET /regions`: Retrieve available regions and their multipliers
- `GET /quality-classes`: Retrieve available quality classes and their multipliers

#### 3.2.3 Example Building Endpoints
- `GET /examples`: List available example buildings
- `GET /examples/{example_id}`: Get details for a specific example building

#### 3.2.4 System Endpoints
- `GET /health`: Check system health status
- `GET /info`: Get API version and configuration information
- `GET /documentation`: Access interactive API documentation

### 3.3 User Interface

#### 3.3.1 Building Input Form
- Form fields for all required building characteristics:
  - Building type and subtype
  - Construction type and quality class
  - Size, age, condition, and region
  - Special features (HVAC, fireplaces, pools, decks)
  - Renovation history
  - Special considerations (historical status, energy efficiency, ADA compliance)
- Dynamic form adjustment based on building type selection
- Validation of required fields and valid value ranges

#### 3.3.2 Calculation Results Display
- Clear presentation of RCN value and depreciated value
- Detailed cost breakdown by component
- Step-by-step explanation of calculation process
- Warnings for potential calculation issues
- Confidence level indicator for result accuracy

#### 3.3.3 Reference Data Viewer
- Viewer for building types and base rates
- Viewer for regions and regional multipliers
- Viewer for quality classes and quality multipliers

### 3.4 Deployment Options

#### 3.4.1 Python Source Deployment
- Script to install Python dependencies (`install_deps.bat`)
- Script to start the API server (`start_rcn.bat`)
- Support for Python virtual environment

#### 3.4.2 Standalone Executable Deployment
- Script to build standalone executable (`build_exe.bat`)
- No Python installation required on target system
- Includes all necessary dependencies

#### 3.4.3 Windows Service Deployment
- Script to install as Windows service (`install_service.bat`)
- Automatic startup with Windows
- Service management capabilities (start, stop, uninstall)

#### 3.4.4 Enterprise Deployment
- Support for deployment via USB drive
- Support for deployment via Group Policy
- Support for deployment via System Center Configuration Manager (SCCM)
- Deployment package creation script (`create_deployment_package.bat`)

### 3.5 Customization Capabilities

#### 3.5.1 Cost Profile Customization
- Editable JSON file for building types, subtypes, and base rates
- Editable JSON file for construction types and multipliers
- Editable JSON file for quality classes and multipliers
- Editable JSON file for regional adjustments

#### 3.5.2 Depreciation Table Customization
- Editable JSON file for age-based depreciation tables by building type
- Editable JSON file for condition-based depreciation factors
- Editable JSON file for special case adjustments (historical buildings, renovations)

#### 3.5.3 Example Building Customization
- Editable JSON file for example buildings
- Support for adding custom examples specific to local building types

## 4. Non-Functional Requirements

### 4.1 Performance

- Calculate RCN values in under 2 seconds for standard inputs
- Support multiple concurrent API requests
- Low memory footprint (under 500 MB RAM usage)
- Quick startup time (under 5 seconds)

### 4.2 Security

- No external dependencies or network calls required for operation
- All data stored locally with standard file permissions
- No authentication required for single-user deployments
- Configurable port binding for network security

### 4.3 Usability

- Intuitive web interface requiring minimal training
- Clear documentation for all deployment options
- Example buildings to demonstrate system capabilities
- Detailed installation guide for different deployment scenarios

### 4.4 Reliability

- Robust error handling with clear error messages
- Input validation to prevent calculation errors
- Logging of all operations for troubleshooting
- Service recovery configuration for Windows service deployment

### 4.5 Maintainability

- Modular code structure for easy updates
- Comprehensive comments throughout the codebase
- Separation of calculation logic from user interface
- Data-driven approach for easy updates to cost tables

### 4.6 Portability

- Support for different Windows versions (10, 11, Server 2016+)
- Support for both 32-bit and 64-bit environments
- Support for standalone operation (no internet connection required)

## 5. Data Requirements

### 5.1 Data Models

#### 5.1.1 Building Input Model
- Building identification (optional)
- Building description
- Building type and subtype
- Construction details (age, size, stories, construction type)
- Quality and condition
- Regional location
- Features and special elements
- Renovation history
- Special considerations

#### 5.1.2 Calculation Result Model
- Building identification and description
- Calculation timestamp
- Replacement cost new (RCN) value
- Depreciated value
- Depreciation percentage
- Effective age and remaining life
- Itemized cost breakdown
- Calculation steps with explanations
- Cost per square foot
- Confidence level and warnings

### 5.2 Data Storage

- Cost profiles stored in JSON format
- Depreciation tables stored in JSON format
- Example buildings stored in JSON format
- Calculation logs stored in text files
- No external database required

## 6. Implementation Plan

### 6.1 Phase 1: Core Calculation Engine
- Implement RCN calculation logic
- Implement depreciation calculation logic
- Create data structures for building inputs and calculation results
- Develop and test API endpoints

### 6.2 Phase 2: Web Interface
- Develop HTML/CSS/JavaScript user interface
- Implement form for building inputs
- Create results display with cost breakdown
- Add example building selection interface

### 6.3 Phase 3: Deployment Scripts
- Create Python dependency installation script
- Develop API server startup script
- Create Windows service installation scripts
- Develop standalone executable build script
- Create deployment package builder

### 6.4 Phase 4: Documentation and Examples
- Create comprehensive README file
- Develop detailed installation guide
- Create sample data with example buildings
- Document API endpoints and usage

## 7. Additional Information

### 7.1 Sample Data

The system includes sample data for demonstration and testing:
- 20 example buildings covering various types, sizes, and qualities
- Pre-configured cost profiles for common building types
- Standard depreciation tables based on industry norms
- Regional multipliers for different geographic areas

### 7.2 Customization Documentation

Detailed documentation is provided for customizing the system to match local requirements:
- Guide for updating cost profiles
- Instructions for modifying depreciation tables
- Process for adding custom example buildings

### 7.3 Future Enhancements

Potential future enhancements may include:
- Multi-user authentication and access control
- Database integration for permanent storage of calculations
- Report generation in PDF format
- Mobile application for field use
- Integration with GIS systems
- Linux and macOS support