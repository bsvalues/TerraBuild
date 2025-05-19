@echo off
echo ===================================================================
echo TerraFusionBuild RCN Valuation Engine - Executable Builder
echo ===================================================================
echo.

REM Check if Python virtual environment exists
if not exist venv (
    echo Virtual environment not found. Please run install_deps.bat first.
    pause
    exit /b 1
)

REM Activate virtual environment
echo Activating Python virtual environment...
call venv\Scripts\activate.bat

REM Check if PyInstaller is installed
pip show pyinstaller >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install PyInstaller. Please check your internet connection.
        pause
        exit /b 1
    )
)

REM Create directories if they don't exist
if not exist dist mkdir dist
if not exist build mkdir build

REM Create sample data directory (if needed)
if not exist sample_data (
    echo Creating sample data directory...
    mkdir sample_data
)

REM Create logs directory (if needed)
if not exist logs mkdir logs

REM Create HTML UI directory (if needed)
if not exist html_ui (
    echo Creating HTML UI directory...
    mkdir html_ui
)

REM Call start_rcn.bat with /nostart flag to ensure sample data files are created
echo Initializing sample data...
call start_rcn.bat /nostart

REM Build executable with PyInstaller
echo Building TerraFusionBuild RCN Executable...
pyinstaller --name="TerraFusionBuild_RCN_Valuation_Engine" ^
    --add-data="sample_data;sample_data" ^
    --add-data="html_ui;html_ui" ^
    --icon=NONE ^
    --windowed ^
    --clean ^
    rcn_api_stub.py

REM Copy relevant files to dist directory
echo Copying additional files to distribution...
copy README.md "dist\TerraFusionBuild_RCN_Valuation_Engine\"
echo Please check logs directory for application logs > "dist\TerraFusionBuild_RCN_Valuation_Engine\logs_readme.txt"

REM Create a simple launcher.bat file
echo Creating launcher script...
echo @echo off > "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo echo Starting TerraFusionBuild RCN Valuation Engine... >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo echo. >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo echo Access the web interface at http://localhost:8000 >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo echo Interactive API documentation at http://localhost:8000/docs >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo echo. >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo echo Press Ctrl+C to stop the server >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo. >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo mkdir logs 2>nul >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo start TerraFusionBuild_RCN_Valuation_Engine.exe >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"
echo start http://localhost:8000 >> "dist\TerraFusionBuild_RCN_Valuation_Engine\run_rcn_server.bat"

REM Check if build was successful
if exist "dist\TerraFusionBuild_RCN_Valuation_Engine\TerraFusionBuild_RCN_Valuation_Engine.exe" (
    echo.
    echo ===================================================================
    echo Build successful!
    echo ===================================================================
    echo.
    echo Executable created at: dist\TerraFusionBuild_RCN_Valuation_Engine\TerraFusionBuild_RCN_Valuation_Engine.exe
    echo.
    echo To use the executable:
    echo 1. Distribute the entire "dist\TerraFusionBuild_RCN_Valuation_Engine" folder
    echo 2. Run the "run_rcn_server.bat" file to start the application
    echo.
) else (
    echo.
    echo ===================================================================
    echo Build failed!
    echo ===================================================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause