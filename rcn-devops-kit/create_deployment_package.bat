@echo off
echo ====================================================
echo TerraFusionBuild RCN Valuation Engine - Deployment Package Creator
echo ====================================================
echo.

set VERSION=1.0.0
set PKG_NAME=TerraFusionBuild_RCN_ValuationEngine_v%VERSION%

REM Check if 7-Zip is installed
set ZIP_PATH=
for %%X in (7z.exe) do (set ZIP_PATH=%%~$PATH:X)
if not defined ZIP_PATH (
    echo 7-Zip not found. Checking Program Files...
    if exist "%ProgramFiles%\7-Zip\7z.exe" (
        set "ZIP_PATH=%ProgramFiles%\7-Zip\7z.exe"
    ) else if exist "%ProgramFiles(x86)%\7-Zip\7z.exe" (
        set "ZIP_PATH=%ProgramFiles(x86)%\7-Zip\7z.exe"
    ) else (
        echo 7-Zip not found. Please install 7-Zip from https://www.7-zip.org/
        echo.
        echo Alternatively, you can manually create a ZIP file containing:
        echo - All files in the rcn-devops-kit directory
        echo.
        pause
        exit /b 1
    )
)

REM Check if the executable has been built
if not exist dist\RcnValuationEngine.exe (
    echo Standalone executable not found.
    echo Running build_exe.bat to create it...
    call build_exe.bat
    if not exist dist\RcnValuationEngine.exe (
        echo Failed to build executable.
        echo.
        pause
        exit /b 1
    )
)

REM Create package directory
echo Creating deployment package...
if exist output rmdir /s /q output
mkdir output\%PKG_NAME%

REM Copy files to package directory
echo Copying files to package directory...
xcopy /e /i /y dist\* output\%PKG_NAME%\
copy README.md output\%PKG_NAME%\
copy install_deps.bat output\%PKG_NAME%\
copy start_rcn.bat output\%PKG_NAME%\
if not exist output\%PKG_NAME%\sample_data mkdir output\%PKG_NAME%\sample_data
xcopy /e /i /y sample_data\* output\%PKG_NAME%\sample_data\
if not exist output\%PKG_NAME%\html_ui mkdir output\%PKG_NAME%\html_ui
xcopy /e /i /y html_ui\* output\%PKG_NAME%\html_ui\

REM Create installation guide
echo Creating installation guide...
(
    echo ====================================================
    echo TerraFusionBuild RCN Valuation Engine - Installation Guide
    echo Version: %VERSION%
    echo ====================================================
    echo.
    echo CONTENTS:
    echo ---------
    echo 1. Introduction
    echo 2. System Requirements
    echo 3. Installation Options
    echo 4. Using the RCN Valuation Engine
    echo 5. Customizing Cost Profiles and Depreciation Tables
    echo 6. Troubleshooting
    echo.
    echo.
    echo 1. INTRODUCTION
    echo ---------------
    echo The TerraFusionBuild RCN Valuation Engine is a powerful tool for calculating
    echo Replacement Cost New ^(RCN^) values for buildings. It uses industry-standard
    echo valuation methods and can be customized with your county's specific cost
    echo data and depreciation tables.
    echo.
    echo.
    echo 2. SYSTEM REQUIREMENTS
    echo ----------------------
    echo - Windows 10 or newer
    echo - 100 MB of free disk space
    echo - Administrator privileges ^(for service installation^)
    echo.
    echo.
    echo 3. INSTALLATION OPTIONS
    echo -----------------------
    echo Option A: Python Installation ^(recommended for development/customization^)
    echo --------------------------------------------------------------------
    echo 1. Ensure Python 3.8 or newer is installed
    echo 2. Run install_deps.bat as Administrator
    echo 3. Run start_rcn.bat to start the API server
    echo 4. Open http://localhost:5000/documentation in your web browser
    echo.
    echo Option B: Standalone Executable ^(no Python required^)
    echo ------------------------------------------------
    echo 1. Run start_engine.bat
    echo 2. The API server will start and open documentation in your browser
    echo.
    echo Option C: Windows Service Installation ^(for permanent deployment^)
    echo ------------------------------------------------------------
    echo 1. Run windows_service\install_service.bat as Administrator
    echo 2. The service will start automatically when the system boots
    echo 3. Open http://localhost:5000/documentation in your web browser
    echo.
    echo.
    echo 4. USING THE RCN VALUATION ENGINE
    echo --------------------------------
    echo After starting the engine:
    echo.
    echo 1. Access the HTML interface by opening html_ui\index.html in a web browser
    echo 2. Use the example buildings to test the system
    echo 3. Enter your own building data to calculate RCN values
    echo 4. View API documentation at http://localhost:5000/documentation
    echo.
    echo.
    echo 5. CUSTOMIZING COST PROFILES AND DEPRECIATION TABLES
    echo ---------------------------------------------------
    echo To customize the engine with your county's specific cost data:
    echo.
    echo 1. Edit sample_data\cost_profiles.json to update base rates and region adjustments
    echo 2. Edit sample_data\depreciation_tables.json to update depreciation schedules
    echo 3. Edit sample_data\example_building_inputs.json to add your own example buildings
    echo 4. Restart the engine to apply changes
    echo.
    echo See sample_data\README.md for detailed information on customization options.
    echo.
    echo.
    echo 6. TROUBLESHOOTING
    echo -----------------
    echo Common issues:
    echo.
    echo - If the API server fails to start, check logs\*.log for error messages
    echo - If running as a service, check logs\service_*.log for error messages
    echo - Port 5000 must be available for the API server to start
    echo - Ensure you have necessary permissions to read/write files in the installation directory
    echo.
    echo For additional support, contact TerraFusionBuild support at support@terrafusionbuild.com
    echo.
) > output\%PKG_NAME%\INSTALLATION_GUIDE.txt

REM Create ZIP file
echo Creating ZIP archive...
cd output
"%ZIP_PATH%" a -tzip "%PKG_NAME%.zip" "%PKG_NAME%"
cd ..

REM Clean up
echo Cleaning up...
rmdir /s /q output\%PKG_NAME%

echo.
echo ====================================================
echo Deployment package created successfully!
echo.
echo Package file: output\%PKG_NAME%.zip
echo.
echo This package contains everything needed to deploy the RCN Valuation Engine:
echo - Standalone executable
echo - Python installation scripts
echo - Windows service scripts
echo - Sample data files
echo - HTML user interface
echo - Documentation
echo ====================================================
echo.

pause