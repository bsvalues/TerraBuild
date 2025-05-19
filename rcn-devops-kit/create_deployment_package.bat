@echo off
REM ======================================================================
REM TerraFusionBuild RCN Valuation Engine - Deployment Package Creator
REM
REM This script creates a complete deployment package including all files
REM needed to deploy the RCN Valuation Engine in various environments.
REM ======================================================================

echo.
echo TerraFusionBuild RCN Valuation Engine - Deployment Package Creator
echo ==============================================================
echo.

REM Set version info and date
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
    set DATESTAMP=%%c-%%a-%%b
)
set VERSION=1.0.0
set PACKAGE_NAME=TerraFusionRCN_Deployment_%VERSION%_%DATESTAMP%

REM Check if deployment directory exists, create if not
if not exist deployment mkdir deployment

REM Check if files exist
if not exist rcn_api_stub.py (
    echo Error: Required files are missing.
    echo Please run this script from the root directory of the RCN Valuation Engine.
    exit /b 1
)

REM Create a clean temporary directory
echo Creating temporary directory...
if exist temp_deploy rmdir /s /q temp_deploy
mkdir temp_deploy

REM Copy required files
echo Copying files to temporary directory...
xcopy rcn_api_stub.py temp_deploy\ /Y
xcopy install_deps.bat temp_deploy\ /Y
xcopy start_rcn.bat temp_deploy\ /Y
xcopy build_exe.bat temp_deploy\ /Y
xcopy README.md temp_deploy\ /Y
xcopy PRD.md temp_deploy\ /Y /I

REM Copy sample data
echo Copying sample data...
if exist sample_data (
    mkdir temp_deploy\sample_data
    xcopy sample_data\*.json temp_deploy\sample_data\ /Y
)

REM Copy Windows service scripts
echo Copying Windows service scripts...
mkdir temp_deploy\windows_service
xcopy windows_service\install_service.bat temp_deploy\windows_service\ /Y
xcopy windows_service\uninstall_service.bat temp_deploy\windows_service\ /Y

REM Create html_ui directory if needed
if not exist temp_deploy\html_ui mkdir temp_deploy\html_ui
if not exist temp_deploy\html_ui\templates mkdir temp_deploy\html_ui\templates

REM Create logs directory
if not exist temp_deploy\logs mkdir temp_deploy\logs

REM Create API spec file
echo Creating API specification...
echo {^
    "openapi": "3.0.0",^
    "info": {^
        "title": "TerraFusionBuild RCN Valuation Engine API",^
        "description": "API for calculating Replacement Cost New (RCN) values for property assessment",^
        "version": "1.0.0"^
    },^
    "paths": {^
        "/rcn/calculate": {^
            "post": {^
                "summary": "Calculate RCN value",^
                "description": "Calculate the Replacement Cost New (RCN) value for a building",^
                "requestBody": {^
                    "required": true,^
                    "content": {^
                        "application/json": {^
                            "schema": {^
                                "type": "object",^
                                "required": ["use_type", "construction_type", "sqft", "year_built", "quality_class", "condition"],^
                                "properties": {^
                                    "use_type": {^
                                        "type": "string",^
                                        "description": "Building use type (Residential, Commercial, Industrial, Agricultural)"^
                                    },^
                                    "construction_type": {^
                                        "type": "string",^
                                        "description": "Construction type (Wood Frame, Masonry, Steel Frame, Concrete)"^
                                    },^
                                    "sqft": {^
                                        "type": "integer",^
                                        "description": "Building square footage"^
                                    },^
                                    "year_built": {^
                                        "type": "integer",^
                                        "description": "Year the building was constructed"^
                                    },^
                                    "quality_class": {^
                                        "type": "string",^
                                        "description": "Quality class of construction (A+, A, B+, B, C+, C, D+, D, E)"^
                                    },^
                                    "locality_index": {^
                                        "type": "number",^
                                        "description": "Local adjustment factor"^
                                    },^
                                    "condition": {^
                                        "type": "string",^
                                        "description": "Building condition (Excellent, Good, Average, Fair, Poor)"^
                                    }^
                                }^
                            }^
                        }^
                    }^
                },^
                "responses": {^
                    "200": {^
                        "description": "Successful RCN calculation",^
                        "content": {^
                            "application/json": {^
                                "schema": {^
                                    "type": "object",^
                                    "properties": {^
                                        "rcn": {^
                                            "type": "number",^
                                            "description": "Replacement Cost New in USD"^
                                        },^
                                        "depreciated_cost": {^
                                            "type": "number",^
                                            "description": "Depreciated cost in USD"^
                                        }^
                                    }^
                                }^
                            }^
                        }^
                    }^
                }^
            }^
        },^
        "/health": {^
            "get": {^
                "summary": "Health check",^
                "description": "Check if the API is functioning properly",^
                "responses": {^
                    "200": {^
                        "description": "API is healthy",^
                        "content": {^
                            "application/json": {^
                                "schema": {^
                                    "type": "object",^
                                    "properties": {^
                                        "status": {^
                                            "type": "string",^
                                            "example": "ok"^
                                        }^
                                    }^
                                }^
                            }^
                        }^
                    }^
                }^
            }^
        }^
    }^
} > temp_deploy\api_spec.json

REM Create a simple getting started guide
echo Creating getting started guide...
echo # Getting Started with TerraFusionBuild RCN Valuation Engine > temp_deploy\GETTING_STARTED.md
echo. >> temp_deploy\GETTING_STARTED.md
echo This guide will help you quickly set up and start using the RCN Valuation Engine. >> temp_deploy\GETTING_STARTED.md
echo. >> temp_deploy\GETTING_STARTED.md
echo ## Quick Start >> temp_deploy\GETTING_STARTED.md
echo. >> temp_deploy\GETTING_STARTED.md
echo 1. Run `install_deps.bat` to install required dependencies >> temp_deploy\GETTING_STARTED.md
echo 2. Run `start_rcn.bat` to start the server >> temp_deploy\GETTING_STARTED.md
echo 3. Open your browser to `http://localhost:8000/ui` >> temp_deploy\GETTING_STARTED.md
echo. >> temp_deploy\GETTING_STARTED.md
echo ## For Permanent Installation >> temp_deploy\GETTING_STARTED.md
echo. >> temp_deploy\GETTING_STARTED.md
echo Run `windows_service\install_service.bat` as Administrator to install as a Windows service. >> temp_deploy\GETTING_STARTED.md
echo. >> temp_deploy\GETTING_STARTED.md
echo For complete documentation, see the README.md file. >> temp_deploy\GETTING_STARTED.md

REM Create the ZIP package
echo Creating deployment package...
powershell -Command "Compress-Archive -Path 'temp_deploy\*' -DestinationPath 'deployment\%PACKAGE_NAME%.zip' -Force"

if exist deployment\%PACKAGE_NAME%.zip (
    echo.
    echo Deployment package created successfully!
    echo.
    echo Package location: deployment\%PACKAGE_NAME%.zip
    echo.
    echo This package contains everything needed to deploy the RCN Valuation Engine:
    echo - API implementation (rcn_api_stub.py)
    echo - Installation scripts (install_deps.bat)
    echo - Server starter (start_rcn.bat)
    echo - Windows service scripts (windows_service\)
    echo - Sample data (sample_data\)
    echo - Documentation (README.md, PRD.md, GETTING_STARTED.md)
    echo - API specification (api_spec.json)
    echo.
) else (
    echo Failed to create deployment package.
    exit /b 1
)

REM Clean up temp directory
echo Cleaning up...
rmdir /s /q temp_deploy

echo Done!
exit /b 0