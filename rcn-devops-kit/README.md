# TerraFusionBuild RCN Valuation Engine DevOps Kit

The TerraFusionBuild RCN (Replacement Cost New) Valuation Engine DevOps Kit provides a complete deployment solution for the property valuation engine used by county assessors. This kit includes everything needed to install, configure, and run the RCN calculator in various Windows environments.

## Overview

This DevOps kit allows county departments to deploy the RCN Valuation Engine through multiple methods:

1. **Direct Execution** - Run the server directly from a local folder
2. **Windows Service** - Install as a background Windows service
3. **Standalone Executable** - Create a portable executable file
4. **Enterprise Deployment** - Package for distribution via Group Policy or SCCM

## Components

The kit includes the following components:

- **Core RCN Calculator** - The FastAPI implementation of the valuation engine
- **User Interface** - Web-based HTML interface for easy calculations
- **Sample Data** - Preconfigured cost profiles and depreciation tables
- **Deployment Scripts** - Installation and service management utilities
- **Documentation** - Installation and usage instructions

## Getting Started

### System Requirements

- Windows 10/11 or Windows Server 2016/2019/2022
- Python 3.8 or higher (for direct execution)
- PowerShell 5.1 or higher (for deployment packaging)
- Administrator privileges (for Windows service installation)

### Installation Options

#### Option 1: Quick Start (Direct Execution)

1. Run `install_deps.bat` to install the required dependencies
2. Run `start_rcn.bat` to start the RCN Valuation Engine
3. Open a web browser and navigate to http://localhost:8000

#### Option 2: Windows Service Installation

1. Run `install_deps.bat` to install the required dependencies
2. Right-click on `windows_service/install_service.bat` and select "Run as administrator"
3. The service will be installed and started automatically
4. Open a web browser and navigate to http://localhost:8000
5. To uninstall, run `windows_service/uninstall_service.bat` as administrator

#### Option 3: Standalone Executable

1. Run `install_deps.bat` to install the required dependencies
2. Run `build_exe.bat` to create a standalone executable
3. The executable will be created as `TerraFusionRCN.exe` in the current directory
4. Run the executable and access the web interface at http://localhost:8000

#### Option 4: Deployment Package for Distribution

1. Run `create_deployment_package.bat` to create a ZIP file for distribution
2. Deploy the ZIP file to target machines via USB drive, network share, or IT deployment tools
3. Extract the ZIP file and follow the instructions in the included README.txt

## Key Features

- **Multiple Building Types** - Support for Residential, Commercial, Industrial, and Agricultural properties
- **Customizable Construction Types** - Wood Frame, Masonry, Steel Frame, and Concrete
- **Quality Classifications** - Detailed quality class system (A+ through E)
- **Condition-Based Depreciation** - Automatically calculate depreciation based on building condition
- **Age Factors** - Adjust valuation based on the building's age
- **Regional Adjustments** - Apply locality factors for regional cost variations
- **Professional UI** - User-friendly web interface for easy data entry and results
- **API Documentation** - Built-in API documentation for integration with other systems

## Sample Data

The kit includes sample data files that demonstrate the functionality:

- **Cost Profiles** - Base rates for different building types and construction methods
- **Depreciation Tables** - Factors for condition and age-based depreciation
- **Example Buildings** - Sample building inputs for testing the calculation engine

## Customization

County assessors can customize the valuation engine by:

1. Modifying the `sample_data/cost_profiles.json` file to adjust base rates
2. Updating the `sample_data/depreciation_tables.json` file for local depreciation standards
3. Adding or modifying building types, construction methods, and quality factors

## Support

For technical support or questions about the RCN Valuation Engine, please contact your TerraFusionBuild representative.