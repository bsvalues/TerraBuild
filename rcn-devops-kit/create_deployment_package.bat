@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Deployment Package Creator
echo ===================================================================
echo.

set PACKAGE_VERSION=1.0.0
set PACKAGE_NAME=TerraFusionRCN-DeploymentKit-%PACKAGE_VERSION%

REM Check if PowerShell is available for zip creation
where powershell.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: PowerShell is required for creating the deployment package.
    echo Please install PowerShell or use a system with PowerShell installed.
    pause
    exit /b 1
)

REM Check for required files
if not exist rcn_api_stub.py (
    echo Error: rcn_api_stub.py file not found.
    echo Please make sure all files are in the correct location.
    pause
    exit /b 1
)

echo Preparing deployment package...

REM Create package directory
if exist %PACKAGE_NAME% rmdir /S /Q %PACKAGE_NAME%
mkdir %PACKAGE_NAME%
mkdir %PACKAGE_NAME%\sample_data
mkdir %PACKAGE_NAME%\html_ui
mkdir %PACKAGE_NAME%\windows_service
mkdir %PACKAGE_NAME%\logs

REM Copy core files
echo Copying core files...
copy rcn_api_stub.py %PACKAGE_NAME%\ >nul
copy install_deps.bat %PACKAGE_NAME%\ >nul
copy start_rcn.bat %PACKAGE_NAME%\ >nul
copy build_exe.bat %PACKAGE_NAME%\ >nul

REM Copy sample data
echo Copying sample data...
copy sample_data\*.json %PACKAGE_NAME%\sample_data\ >nul

REM Copy HTML UI
echo Copying HTML UI...
copy html_ui\*.html %PACKAGE_NAME%\html_ui\ >nul
if exist html_ui\*.css copy html_ui\*.css %PACKAGE_NAME%\html_ui\ >nul
if exist html_ui\*.js copy html_ui\*.js %PACKAGE_NAME%\html_ui\ >nul

REM Copy Windows service files
echo Copying Windows service files...
copy windows_service\*.bat %PACKAGE_NAME%\windows_service\ >nul
copy windows_service\nssm.exe %PACKAGE_NAME%\windows_service\ >nul 2>&1
if exist windows_service\app_icon.ico copy windows_service\app_icon.ico %PACKAGE_NAME%\windows_service\ >nul 2>&1

REM Create README file
echo Creating documentation...
(
echo # TerraFusionBuild RCN Valuation Engine
echo ## Deployment Kit v%PACKAGE_VERSION%
echo.
echo This package contains the TerraFusionBuild RCN ^(Replacement Cost New^) Valuation Engine,
echo a powerful tool designed for county assessors to calculate property valuations
echo based on building characteristics.
echo.
echo ### Quick Start Guide
echo.
echo 1. Run `install_deps.bat` to install required dependencies
echo 2. Run `start_rcn.bat` to start the RCN Valuation Engine
echo 3. Open your web browser and navigate to http://localhost:8000/
echo.
echo ### Deployment Options
echo.
echo * **Direct Execution**: Run `start_rcn.bat` to start the server immediately
echo * **Windows Service**: Run `windows_service\install_service.bat` to install as a Windows service
echo * **Standalone Executable**: Run `build_exe.bat` to create a portable EXE file
echo.
echo ### Sample Data
echo.
echo This package includes sample data files in the `sample_data` folder:
echo.
echo * Cost profiles for different building types
echo * Depreciation tables for age and condition factors
echo * Example building inputs for testing
echo.
echo ### System Requirements
echo.
echo * Windows 10/11 or Windows Server 2016/2019/2022
echo * Python 3.8 or higher ^(for non-executable deployment^)
echo * Administrator privileges ^(for Windows service installation^)
echo.
echo ### Support
echo.
echo For technical support or questions about the RCN Valuation Engine,
echo please contact your TerraFusionBuild representative.
) > %PACKAGE_NAME%\README.txt

REM Create ZIP file
echo Creating ZIP package...
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%\*' -DestinationPath '%PACKAGE_NAME%.zip' -Force"

REM Cleanup
echo Cleaning up temporary files...
rmdir /S /Q %PACKAGE_NAME%

if exist %PACKAGE_NAME%.zip (
    echo.
    echo ===================================================================
    echo Deployment package created successfully!
    echo ===================================================================
    echo.
    echo Package: %PACKAGE_NAME%.zip
    echo.
    echo This ZIP file contains everything needed to deploy the RCN Valuation
    echo Engine on Windows systems. It can be deployed via USB drive, network
    echo share, or enterprise IT deployment tools.
    echo.
) else (
    echo.
    echo Error: Failed to create deployment package.
)

pause