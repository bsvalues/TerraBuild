# TerraFusionBuild RCN Valuation Engine

## Overview

The TerraFusionBuild RCN (Replacement Cost New) Valuation Engine is a portable, self-contained tool for calculating building replacement costs. It provides accurate valuation capabilities for county assessors, real estate professionals, and insurance adjusters.

This DevOps Kit makes it easy to deploy, configure, and manage the RCN Valuation Engine in various environments.

## Features

- **Advanced Valuation Calculations**: Calculate replacement costs based on building type, construction method, quality, and regional factors
- **Multiple Deployment Options**: Run as a web service, Windows service, or standalone executable
- **Interactive Web Interface**: User-friendly interface for performing calculations
- **Comprehensive REST API**: Programmatic access for integration with existing systems
- **Sample Cost Data**: Pre-loaded cost profiles and depreciation tables
- **Customizable Cost Factors**: Ability to modify cost profiles and regional multipliers

## System Requirements

- **Operating System**: Windows 10 or newer / Windows Server 2016+
- **Memory**: 4GB RAM minimum (8GB recommended)
- **Disk Space**: 500MB of free disk space
- **Runtime**: Python 3.8 or newer (installed automatically)
- **Network**: Internet connection for initial setup only

## Quick Start

1. **Download**: Download and extract the TerraFusionBuild RCN Valuation Engine package
2. **Install Dependencies**: Run `install_deps.bat` to set up the Python environment and dependencies
3. **Start the Server**: Run `start_rcn.bat` to start the RCN calculation engine
4. **Access the Interface**: Open a web browser and navigate to http://localhost:8000

## Installation Options

### Standard Installation

1. Extract the package to any location on your computer
2. Double-click `install_deps.bat` to install required dependencies
3. Double-click `start_rcn.bat` to start the RCN calculation engine
4. Open http://localhost:8000 in your web browser

### Windows Service Installation

To run the RCN Valuation Engine as a Windows service:

1. Complete the standard installation steps above
2. Run the server manually at least once to create sample data files
3. Open an Administrator command prompt
4. Navigate to the installation directory
5. Run `cd windows_service` and then `install_service.bat`
6. The service will be installed and set to start automatically on system boot
7. Access the interface at http://localhost:8000

To uninstall the service:
1. Open an Administrator command prompt
2. Navigate to the installation directory, then to the windows_service folder
3. Run `uninstall_service.bat`

### Standalone Executable

To create a standalone executable package:

1. Complete the standard installation steps above
2. Run `build_exe.bat` to create a standalone executable version
3. The executable will be created in the `dist` folder
4. The executable package can be distributed to systems without Python installed

## Package Contents

- `install_deps.bat` - Installs required Python and dependencies
- `start_rcn.bat` - Starts the RCN Valuation Engine server
- `build_exe.bat` - Creates a standalone executable package
- `create_deployment_package.bat` - Creates a distributable deployment package
- `rcn_api_stub.py` - Main RCN calculation engine
- `windows_service/` - Scripts for Windows service installation
- `sample_data/` - Sample cost profiles and depreciation tables
- `html_ui/` - Web interface for the RCN Valuation Engine
- `logs/` - Log files directory

## API Documentation

The RCN Valuation Engine provides a comprehensive REST API for programmatic access:

- Access the interactive API documentation at http://localhost:8000/docs

### Example API Call

```
POST /api/calculate-rcn
Content-Type: application/json

{
  "building_type": "residential",
  "building_subtype": "single_family",
  "construction_type": "frame",
  "quality_class": "standard",
  "region": "midwest",
  "year_built": 2010,
  "condition": "good",
  "square_footage": 2000,
  "features": [
    {"type": "garage", "quantity": 400}
  ]
}
```

## Customization

### Cost Profiles

Cost profiles are stored in JSON format at `sample_data/cost_profiles.json`. This file can be modified to:

- Add/modify building types and subtypes
- Adjust base rates for different building categories
- Customize regional cost multipliers
- Add new construction types or quality classes

### Depreciation Tables

Depreciation tables are stored in JSON format at `sample_data/depreciation_tables.json`. This file can be modified to:

- Adjust age-based depreciation factors
- Customize condition-based depreciation values
- Add specialized depreciation schedules

## Troubleshooting

### Common Issues

- **Server won't start**: Ensure Python is properly installed and the virtual environment is created
- **Can't access the web interface**: Check that the server is running and no firewall is blocking port 8000
- **Windows service fails to start**: Check the Windows Event Viewer for specific error messages
- **Calculation errors**: Verify the cost profiles and depreciation tables are properly formatted

### Logs

Log files are stored in the `logs` directory and can be used to diagnose issues:

- `rcn_api_YYYYMMDD.log` - API server logs

## Support

For support, please contact:

- Email: support@terrafusionbuild.com
- Website: https://www.terrafusionbuild.com/support

## License

Copyright © 2025 TerraFusionBuild Corporation.
All rights reserved.

## Version History

- 1.0.0 (2025-05-19) - Initial release