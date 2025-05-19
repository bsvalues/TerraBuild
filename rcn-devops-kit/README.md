# TerraFusionBuild RCN Valuation Engine

## Overview

The TerraFusionBuild RCN (Replacement Cost New) Valuation Engine is a professional-grade API and calculation tool for property assessors and valuers. The system provides accurate cost estimations for various building types based on industry-standard metrics including quality class, construction type, regional cost factors, and depreciation tables.

This DevOps Kit provides a complete package for deploying and using the RCN Valuation Engine in Windows environments, with options for both standalone and service-based deployments.

## Features

- **Comprehensive Building Cost Calculation**: Calculate Replacement Cost New values for residential, commercial, industrial, and agricultural buildings with detailed cost breakdowns.
- **Multiple Deployment Options**: Deploy as a standalone application or as a Windows service.
- **Interactive Web UI**: User-friendly interface for performing calculations and viewing results.
- **RESTful API**: Well-documented API endpoints for integration with other systems.
- **Sample Data Included**: Pre-configured with sample cost profiles and depreciation tables for immediate use.
- **Extensible Architecture**: Designed to be customized with organization-specific cost data.

## System Requirements

- Windows 10 or newer, or Windows Server 2016 or newer
- Python 3.8 or newer
- 4GB RAM (minimum)
- 500MB free disk space
- Administrator rights (for service installation only)

## Quick Start Guide

### Standalone Deployment

1. Extract the package to a directory of your choice.
2. Run `install_deps.bat` to install required dependencies.
3. Run `start_rcn.bat` to start the server.
4. Access the web interface at http://localhost:8000 or the API documentation at http://localhost:8000/docs.

### Windows Service Deployment

1. Extract the package to a directory of your choice.
2. Run `install_deps.bat` to install required dependencies.
3. Download NSSM (Non-Sucking Service Manager) from https://nssm.cc/download and place `nssm.exe` in the `windows_service` directory.
4. Run `windows_service\install_service.bat` as Administrator to install and start the service.
5. Access the web interface at http://localhost:8000 or the API documentation at http://localhost:8000/docs.

To uninstall the service, run `windows_service\uninstall_service.bat` as Administrator.

## Directory Structure

```
rcn-devops-kit/
├── install_deps.bat           # Dependency installation script
├── start_rcn.bat              # Server startup script
├── rcn_api_stub.py            # Main API implementation
├── sample_data/               # Sample cost data files
│   ├── cost_profiles.json     # Base rates, building types, etc.
│   ├── depreciation_tables.json # Age and condition factors
│   └── example_building_inputs.json # Example building data
├── html_ui/                   # Web interface files
│   └── index.html             # Main web interface
├── windows_service/           # Windows service scripts
│   ├── install_service.bat    # Service installation script
│   └── uninstall_service.bat  # Service removal script
└── logs/                      # Log files directory
```

## API Documentation

The RCN Valuation Engine provides the following API endpoints:

- `POST /api/calculate-rcn`: Calculate RCN value based on building parameters
- `GET /api/building-types`: List available building types
- `GET /api/construction-types`: List available construction types
- `GET /api/quality-classes`: List available quality classes
- `GET /api/regions`: List available regions
- `GET /api/example-buildings`: Get example building inputs
- `GET /api/health`: Health check endpoint

For detailed API documentation, access the Swagger UI at http://localhost:8000/docs when the server is running.

## Customization

### Cost Profiles

To customize cost profiles, edit the `sample_data/cost_profiles.json` file. This file contains:

- Building types
- Construction types
- Quality classes and multipliers
- Regional cost factors
- Base rates for each building type/construction type combination
- Feature adjustments

### Depreciation Tables

To customize depreciation tables, edit the `sample_data/depreciation_tables.json` file. This file contains:

- Age-based depreciation factors for each building type
- Condition-based depreciation factors

## Troubleshooting

### Common Issues

1. **Server won't start**: Ensure Python is installed and in the PATH. Check logs in the `logs` directory.
2. **Service installation fails**: Ensure you have administrator privileges and NSSM is correctly placed in the `windows_service` directory.
3. **Calculation errors**: Verify the input data matches the expected format. Check that the building type, construction type, and other parameters exist in the cost profile data.

### Logs

Log files are stored in the `logs` directory:
- `rcn_api_YYYYMMDD.log`: API server logs
- `service_stdout.log` and `service_stderr.log`: Service logs (when installed as a service)

## Support

For additional support or to report issues, please contact your TerraFusionBuild representative.

## License

This software is proprietary and licensed under the terms of the TerraFusionBuild Software License Agreement.

Copyright © 2025 TerraFusionBuild. All rights reserved.