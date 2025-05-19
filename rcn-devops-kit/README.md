# TerraFusionBuild RCN Valuation Engine

The **TerraFusionBuild RCN Valuation Engine** is a comprehensive solution for calculating Replacement Cost New (RCN) values for property assessment. This DevOps Kit provides everything needed to deploy, configure, and use the RCN calculation engine in county assessor environments.

![TerraFusionBuild](https://www.terrafusionbuild.com/logo.png)

## Overview

This package is designed for county assessors and property valuation professionals who need a reliable, consistent method for calculating building replacement costs. The RCN Valuation Engine uses industry-standard valuation methodologies updated for 2025 and can be deployed in various IT environments.

### Key Features

- **Accurate Cost Calculations**: Uses up-to-date cost matrices for different building types and construction methods
- **Flexible Deployment Options**: Run as a standalone application or Windows service
- **User-Friendly Interface**: Simple web UI for performing calculations
- **API Access**: RESTful API for integration with existing systems
- **Comprehensive Documentation**: Detailed usage guides and API specifications

## System Requirements

- **Operating System**: Windows 10/11 or Windows Server 2016/2019/2022
- **Prerequisites**:
  - Python 3.8 or higher (automatically detected or can be specified)
  - Network connectivity (for initial setup only)
  - Administrative privileges (for service installation only)

## Quick Start Guide

Follow these steps to get the RCN Valuation Engine up and running quickly:

### 1. Install Dependencies

Run the installer script to set up all required dependencies:

```bat
install_deps.bat
```

This script will:
- Check for Python installation
- Create a virtual environment
- Install required packages
- Set up sample data for testing

### 2. Start the Server

Launch the RCN Valuation Engine server:

```bat
start_rcn.bat
```

By default, the server runs on port 8000. To use a different port:

```bat
start_rcn.bat 8080
```

### 3. Access the Web Interface

Open your web browser and navigate to:

```
http://localhost:8000/ui
```

This will display the RCN calculator where you can enter building specifications and calculate replacement costs.

## Windows Service Installation

For persistent deployment, you can install the engine as a Windows service:

1. Open Command Prompt as Administrator
2. Run:
   ```bat
   windows_service\install_service.bat
   ```

This will install and start the "TerraFusionRCN" service. The service will automatically start when Windows boots.

To uninstall the service:
```bat
windows_service\uninstall_service.bat
```

## Building a Standalone Executable

For easier distribution or deployment to systems without Python, you can create a standalone executable:

```bat
build_exe.bat
```

The executable will be created in the `dist` folder.

## Creating a Deployment Package

To create a complete deployment package for distribution:

```bat
create_deployment_package.bat
```

This will create a ZIP file in the `deployment` folder containing all necessary files for installation on another system.

## API Usage

### API Documentation

The API documentation is available at:

```
http://localhost:8000/docs
```

This interactive documentation allows you to try out API endpoints directly from the browser.

### Sample API Request

Calculate an RCN value via API:

```bash
curl -X POST "http://localhost:8000/rcn/calculate" -H "Content-Type: application/json" -d '{
  "use_type": "Residential",
  "construction_type": "Wood Frame",
  "sqft": 1800,
  "year_built": 2010,
  "quality_class": "B",
  "locality_index": 1.05,
  "condition": "Good"
}'
```

## Customization

### Using Your Own Cost Data

To use custom cost matrices:
1. Create JSON files following the format in the `sample_data` directory
2. Replace the existing sample data files

## Troubleshooting

### Common Issues

1. **Server won't start**: Ensure Python is correctly installed and in your PATH
2. **Service fails to install**: Make sure you're running as Administrator
3. **Can't access web UI**: Check that the server is running and confirm the port is not blocked

### Log Files

Log files are stored in the `logs` directory and can help diagnose issues:
- Server logs: `logs/server.log`
- Service logs: `logs/service_stdout.log` and `logs/service_stderr.log`

## Support and Resources

For additional assistance:
- Documentation: See the `docs` folder for detailed guides
- Email Support: support@terrafusionbuild.com
- Website: [www.terrafusionbuild.com](https://www.terrafusionbuild.com)

## License

This software is licensed under a proprietary license. See LICENSE.txt for details.

---

© 2025 TerraFusionBuild. All rights reserved.