# TerraFusionBuild RCN Valuation Engine

## Overview

The TerraFusionBuild RCN (Replacement Cost New) Valuation Engine is a comprehensive solution for calculating building replacement costs using industry-standard valuation methodologies. This tool helps county assessors, property appraisers, and valuation specialists quickly and accurately determine replacement costs for various building types.

This DevOps kit provides a complete package for deployment, configuration, and usage of the RCN calculation engine in Windows environments, with options for both portable deployment (via USB) and enterprise IT deployment (via Group Policy or SCCM).

## Features

- **Comprehensive Building Type Support**: Calculate RCNs for residential, commercial, industrial, and agricultural buildings
- **Detailed Cost Breakdowns**: View itemized cost components including structure, basement, garage, and features
- **Multiple Deployment Options**: Run as a standalone application, as a Windows service, or from Python source
- **Customizable Cost Data**: Easily modify cost profiles and depreciation tables to match local market conditions
- **User-Friendly Web Interface**: Intuitive dashboard for entering building data and viewing results
- **Example Buildings**: Pre-configured examples demonstrating various building types and features
- **API Documentation**: Comprehensive API reference for integration with other systems
- **Windows Service Support**: Install as a system service for automated startup and background operation

## System Requirements

- Windows 10 or newer
- 100 MB free disk space
- Administrator privileges (for service installation)
- For Python deployment:
  - Python 3.8 or newer
  - pip package manager

## Quick Start Guide

### Option 1: Run from Python Source

1. Run `install_deps.bat` as Administrator to install required dependencies
2. Run `start_rcn.bat` to start the RCN Valuation Engine
3. Open a web browser to http://localhost:5000/documentation or open `html_ui/index.html`

### Option 2: Run Standalone Executable

1. Run `build_exe.bat` to create the standalone executable
2. In the `dist` directory, run `start_engine.bat`
3. The application will automatically open in your web browser

### Option 3: Install as Windows Service

1. Run `windows_service/install_service.bat` as Administrator
2. The service will start automatically and run in the background
3. Open a web browser to http://localhost:5000/documentation or open `html_ui/index.html`

## Customizing Cost Data

The engine uses three primary data files that can be customized for your local requirements:

1. **cost_profiles.json** - Contains base rates, construction types, quality classes, and region adjustments
2. **depreciation_tables.json** - Contains age-based and condition-based depreciation factors
3. **example_building_inputs.json** - Contains example buildings for testing

See the `sample_data/README.md` file for detailed information on customizing these files.

## API Endpoints

The RCN Valuation Engine provides the following API endpoints:

- `GET /health` - Health check endpoint
- `GET /info` - API information
- `POST /calculate` - Calculate RCN for a building
- `GET /examples` - List available example buildings
- `GET /examples/{example_id}` - Get a specific example building
- `POST /examples/{example_id}/calculate` - Calculate RCN for an example building
- `GET /building-types` - Get available building types
- `GET /regions` - Get available regions
- `GET /quality-classes` - Get available quality classes
- `GET /documentation` - Get API documentation

## Package Contents

- `rcn_api_stub.py` - The main API implementation
- `sample_data/` - Directory containing cost profiles, depreciation tables, and example buildings
- `html_ui/` - Directory containing the web-based user interface
- `windows_service/` - Scripts for installing and uninstalling Windows service
- `*.bat` files - Deployment and management scripts

## Deployment Scripts

- `install_deps.bat` - Installs required Python dependencies
- `start_rcn.bat` - Starts the RCN Valuation Engine
- `build_exe.bat` - Builds a standalone executable
- `create_deployment_package.bat` - Creates a complete deployment package
- `windows_service/install_service.bat` - Installs the engine as a Windows service
- `windows_service/uninstall_service.bat` - Uninstalls the Windows service

## Development

For developers looking to modify or extend the RCN Valuation Engine:

1. The main implementation is in `rcn_api_stub.py`
2. The engine is built using FastAPI for the backend
3. The frontend UI is in `html_ui/index.html`
4. Data files in `sample_data/` can be modified to adjust costs and depreciation factors

## Support

For support, contact TerraFusionBuild support at support@terrafusionbuild.com or refer to the documentation included in this package.

## License

© 2025 TerraFusionBuild. All rights reserved.